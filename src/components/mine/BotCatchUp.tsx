"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { botInSeat } from "@/lib/bots/bots";
import { CATCH_UP_MOVES, CATCH_UP_TIMEOUT_MS } from "@/lib/bots/bots.constants";
import { BROWSER_MOVE_MILLIS } from "@/lib/gomoku/botWorker.constants";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { replayGame } from "@/lib/gomoku/replay";
import { postTurn } from "@/components/live/postTurn";
import { settleFromRecord } from "@/lib/history/settle";
import type { BotAnswer, BotAsk } from "@/lib/gomoku/botWorker";
import type { BotTier, BotTurn } from "@/lib/gomoku/opponent.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import type { CatchUpSeat } from "./botCatchUp.types";
import type { GameState } from "@/lib/gomoku/gomoku.types";

/**
 * THE COMPUTER'S MOVE NOBODY STAYED FOR, MADE HERE RATHER THAN ON THE SERVER.
 *
 * A computer's reply in a live game is worked out in the player's own browser
 * (`useBotSeat`), and the move route is told so and stays out of it. That is
 * the whole saving, and it leaves one hole: a tab closed mid-thought leaves the
 * computer still to move with nothing anywhere working on it.
 *
 * That hole used to be filled by the server — the read of a player's games
 * played the move on a paid function. It cost little and it cost SOMETHING, on
 * the one page a member opens daily, and the machine that ought to be doing the
 * work is the one reading the page. John: "why can't we do a check in the
 * browser — if there was no move when the user comes back, to do the move
 * again?" So this is that check. The list has already worked out which games
 * are waiting (`unansweredBotTurns`, past its grace); this browser reads each
 * one back, thinks in the same worker the board uses, and posts the move
 * through the same route as any other. Nothing about a bot's move touches a
 * paid function any more.
 *
 * IT POSTS WITH THE READER'S OWN SEAT KEY, THE WAY THE BOARD DOES. A seat key
 * is the whole credential for a colour, so where it may be written down is a
 * decision rather than a detail — and this is the decision the match page has
 * always made: the server resolves who holds the seat (`resolveSeat`, by cookie
 * or by the member the session names) and hands that seat's own key to that
 * seat's own browser. Nothing here widens who may move: a key reaches this page
 * only for a game whose seat is already this reader's, at most two of them, and
 * only while one is actually waiting on a computer.
 *
 * It is done this way rather than by letting the route work the seat out from
 * the session, which would have been a new way into `appendMove` — a door worth
 * more thought than a cost fix should carry.
 *
 * THE SAFEGUARDS, each for a way this could be worse than doing nothing:
 *
 * - **Only where a worker can be made**, so it never claims a move it cannot
 *   think out. A page with no `Worker` does nothing at all, which is exactly
 *   what it did before this existed.
 * - **Only while the tab is visible.** A background tab is the poll rule's
 *   other half: nobody is waiting on it, and a hidden page working is the
 *   pattern this site keeps out. It waits for the tab to be looked at.
 * - **Re-read from the server before posting.** The list's row is as old as the
 *   render; a computer may have been answered by another tab since. The move is
 *   worked out from what the server says NOW, and nothing is posted unless a
 *   computer really is to move in a game that is really still running.
 * - **One game at a time, and at most `CATCH_UP_MOVES` moves in each**, so a
 *   visit can never turn into a run of searches. The list hands over at most
 *   two games (`UNANSWERED_TURNS_AT_ONCE`).
 * - **It stops when the page goes.** Leaving the page aborts the reads and
 *   terminates the worker mid-thought; an answer that arrives for a game the
 *   run has left is dropped by its `id`, exactly as on the board.
 * - **A refusal is the end of that game, not a retry.** Somebody else got there
 *   first, or the position moved on: either way this browser has nothing to add
 *   and asking again would only be a second paid request.
 */
export function BotCatchUp({ games }: { games: CatchUpSeat[] }) {
  const router = useRouter();
  /*
   * The games as ONE STRING, so a re-render with the same ones does not start
   * the run again — an array prop is a new array every render, and an effect
   * keyed on it would re-read and re-think on every one. Written as JSON rather
   * than joined on a separator, because a seat key is opaque and a separator
   * inside one would silently cut it in half.
   */
  const key = JSON.stringify(games);
  const latest = useRef({ router });
  useEffect(() => {
    latest.current = { router };
  });

  useEffect(() => {
    const seats = JSON.parse(key) as CatchUpSeat[];
    if (seats.length === 0 || typeof Worker === "undefined") return;

    let stopped = false;
    const abort = new AbortController();
    let worker: Worker | null = null;
    let asked = 0;
    /** The answer to the question asked under `id`, or null — never one for an older question. */
    const answers = new Map<number, (answer: BotAnswer | null) => void>();

    /** The one worker this run thinks in, made when there is a first move to think about. */
    const thinker = (): Worker => {
      if (worker !== null) return worker;
      const made = new Worker(new URL("@/lib/gomoku/botWorker.ts", import.meta.url), { type: "module" });
      made.addEventListener("message", (event: MessageEvent<BotAnswer>) => {
        const settle = answers.get(event.data.id);
        answers.delete(event.data.id);
        settle?.(event.data);
      });
      // A worker that throws must say so rather than go quiet: a silent worker
      // and one still thinking look identical from here, and the run would wait
      // on a move that is never coming.
      made.addEventListener("error", () => {
        for (const [id, settle] of answers) {
          answers.delete(id);
          settle(null);
        }
      });
      worker = made;
      return made;
    };

    const think = (state: GameState, tier: BotTier): Promise<BotTurn | null> => {
      const made = thinker();
      asked += 1;
      const id = asked;
      const ask: BotAsk = { id, state, tier, budget: { millis: BROWSER_MOVE_MILLIS } };
      return new Promise<BotTurn | null>((resolve) => {
        const settle = (answer: BotAnswer | null) => {
          window.clearTimeout(timer);
          resolve(answer !== null && answer.ok ? answer.turn : null);
        };
        /*
         * A worker that never answers must not hold the run open for ever. It
         * has not happened, and a promise nobody settles is the one failure
         * that leaves no trace at all — so the wait is bounded and a silent
         * worker simply ends the catch-up.
         */
        const timer = window.setTimeout(() => {
          answers.delete(id);
          settle(null);
        }, CATCH_UP_TIMEOUT_MS);
        answers.set(id, settle);
        made.postMessage(ask);
      });
    };

    const read = async (id: string): Promise<GameDetail | null> => {
      const answer = await fetch(`/api/games/${id}`, { signal: abort.signal, cache: "no-store" });
      if (!answer.ok) return null;
      return (await answer.json()) as GameDetail;
    };

    /** Posts one turn the way the board does, and hands back the game as it now stands. */
    const post = async (seat: CatchUpSeat, turn: BotTurn): Promise<GameDetail | null> => {
      let game: GameDetail | null = null;
      let refused = false;
      await postTurn(turn, async (body) => {
        if (refused) return;
        const answer = await fetch(`/api/games/${seat.id}/moves`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // This reader's own seat key, as the board sends it, and `botReply` to
          // keep the server out of the answer, as the board's moves do.
          body: JSON.stringify({ token: seat.token, ...body, botReply: true }),
          signal: abort.signal,
        });
        if (!answer.ok) {
          refused = true;
          game = null;
          return;
        }
        game = (await answer.json()) as GameDetail;
      });
      return game;
    };

    /** One game, up to a few moves of it. True when anything was played. */
    const catchUp = async (seat: CatchUpSeat): Promise<boolean> => {
      let played = false;
      let detail = await read(seat.id);
      for (let move = 0; move < CATCH_UP_MOVES && detail !== null && !stopped; move += 1) {
        // What the SERVER says now, not what the list said when it rendered.
        if (detail.status !== "active") break;
        const state = settleFromRecord(replayGame(detail), detail);
        if (state.status !== GAME_STATUS.playing) break;
        const tier = botInSeat(detail, state.toPlay);
        if (tier === null) break;
        const turn = await think(state, tier);
        if (turn === null || stopped) break;
        const after = await post(seat, turn);
        // A refusal — somebody moved first, or the seat is not this browser's
        // after all. Nothing to add, and asking again would be a second request.
        if (after === null) break;
        played = true;
        detail = after;
      }
      return played;
    };

    const run = async () => {
      let played = false;
      for (const seat of seats) {
        if (stopped) break;
        played = (await catchUp(seat)) || played;
      }
      // Show it made. The rows were drawn waiting on a move that has landed since.
      if (played && !stopped) latest.current.router.refresh();
    };

    const start = () => {
      if (stopped) return;
      void run().catch(() => {
        // An aborted read on the way out of the page, or a network that went
        // away. Either way the game is where it was and the next visit tries.
      });
    };

    /*
     * VISIBLE, OR WAITING TO BE. A page opened in a background tab has nobody
     * in front of it, and this is work for the person who came back — so it
     * begins the moment the tab is looked at, and never before.
     */
    if (document.visibilityState === "visible") start();
    else {
      const onVisible = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", onVisible);
        start();
      };
      document.addEventListener("visibilitychange", onVisible);
      abort.signal.addEventListener("abort", () =>
        document.removeEventListener("visibilitychange", onVisible),
      );
    }

    return () => {
      stopped = true;
      abort.abort();
      worker?.terminate();
      worker = null;
      for (const [id, settle] of answers) {
        answers.delete(id);
        settle(null);
      }
    };
  }, [key]);

  return null;
}
