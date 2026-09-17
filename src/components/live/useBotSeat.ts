"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { botInSeat } from "@/lib/bots/bots";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { otherStone } from "@/lib/gomoku/rules/board";
import { BROWSER_MOVE_MILLIS } from "@/lib/gomoku/botWorker.constants";
import type { BotAnswer, BotAsk } from "@/lib/gomoku/botWorker";
import type { BotTurn } from "@/lib/gomoku/opponent.types";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";

/**
 * The computer's move in a LIVE game, thought out in this browser.
 *
 * Every computer move on this site has been worked out inside a paid function,
 * on a quarter-second budget, and that is the one cost here that grows with how
 * good the opponent is. Measured across forty-four games, the top two grades
 * were playing the SAME move 94% of the time, because neither reached the depth
 * they are supposed to differ by before the clock stopped them. The ladder was
 * capped by money, not by its knobs.
 *
 * So the person waiting for the move works it out instead. Their machine is
 * idle, it costs nobody anything, and a move may take seconds rather than
 * milliseconds — which measured 78% wins over the same grade on the server's
 * budget, across thirty-six games with no draws.
 *
 * **The server still decides.** This posts a move like any other, through the
 * same route and with this player's own seat token, and `appendMove` re-checks
 * it against the engine. What the browser is trusted with is WHICH legal move
 * the computer plays, and nothing else.
 *
 * **It is not the only path.** A player who closes the tab mid-think leaves the
 * computer still to move, and the next read of their games — the list, or the
 * badge beside Play — finds it past a minute's grace and plays it on the
 * server (`unansweredBotTurns`). This is the fast, free path; that is the net.
 */
/**
 * ON — and why it was off, because the reason is worth more than the flag.
 *
 * `botReply` tells the server not to work the computer's answer out, because
 * this browser will. Claiming that and then failing to post is the worst
 * outcome available: the game simply stops, waiting on a move nobody is
 * working on. So this stayed off while a real browser showed the worker built,
 * the ask sent, and no answer ever coming back.
 *
 * The worker was fine. The page was leaving. After a move that hands the turn
 * to somebody else, the board carries its player on to their next waiting game
 * (`useAdvanceToNextGame`) — and with the server no longer answering inside the
 * request, a computer to move looked exactly like that. The board unmounted,
 * the worker was terminated mid-thought, and on a database with other games
 * waiting the reply could never arrive. `carriesOnwardFrom` now stays put while
 * a computer is to move, as it always effectively did.
 *
 * And the one real hole is closed on the server rather than hoped away: a tab
 * shut mid-thought leaves a computer's move nobody is making, and the next
 * read of that player's games plays it (`unansweredBotTurns`).
 */
const BROWSER_ANSWERS_LIVE_GAMES = true;

export function useBotSeat({
  state,
  seats,
  mySeat,
  send,
  enabled,
}: {
  state: GameState;
  /** Who holds each colour, so a computer's turn can be told from a person's. */
  seats: { blackMemberId?: string | null; whiteMemberId?: string | null };
  /** The colour this browser is playing, or null for somebody watching. */
  mySeat: Stone | null;
  /** The same poster a click goes through. One door for every move. */
  send: (body: Record<string, unknown>) => Promise<void>;
  enabled: boolean;
}) {
  const worker = useRef<Worker | null>(null);
  const asked = useRef(0);
  const [thinking, setThinking] = useState(false);
  const latest = useRef({ send });

  useEffect(() => {
    latest.current = { send };
  });

  const toPlay = state.status === GAME_STATUS.playing ? state.toPlay : null;
  const botToPlay = toPlay !== null && botInSeat(seats, toPlay) !== null;
  /*
   * Only the person SITTING OPPOSITE answers for the computer. A watcher has no
   * seat and no token, and two browsers both answering would post the same turn
   * twice — the second arriving after the position moved on, where the engine
   * refuses it and the player sees an error about a move they never made.
   */
  const mine =
    enabled && botToPlay && mySeat !== null && mySeat !== toPlay && typeof Worker !== "undefined";

  useEffect(() => {
    if (!mine) return;
    const made = new Worker(new URL("@/lib/gomoku/botWorker.ts", import.meta.url), { type: "module" });
    worker.current = made;

    made.addEventListener("message", (event: MessageEvent<BotAnswer>) => {
      const answer = event.data;
      // An answer about a position this game has since left. Not an error —
      // simply no longer about this board.
      if (answer.id !== asked.current) return;
      setThinking(false);
      if (!answer.ok || answer.turn === null) return;
      void post(answer.turn, latest.current.send);
    });

    made.addEventListener("error", () => setThinking(false));

    return () => {
      asked.current += 1;
      made.terminate();
      worker.current = null;
      setThinking(false);
    };
  }, [mine]);

  /*
   * ASKED ONCE PER POSITION, AND THE DEPENDENCIES ARE WHY.
   *
   * `state` and `seats` are rebuilt on every render — `seats` is an object
   * literal in the caller — so an effect keyed on them re-runs constantly. Each
   * run bumped the ask number, and the worker's answer, carrying the number it
   * was asked under, then failed the `answer.id !== asked.current` test and was
   * thrown away. Every time. The browser had told the server not to bother
   * (`botReply`), so the computer simply never moved: a game that hangs, with
   * nothing in the console and nothing on the server to say so.
   *
   * Keyed on the POSITION instead — how many moves are down, and whose turn it
   * is — which changes exactly when there is a new question to ask. The state
   * itself is read through a ref, so a re-render with the same position does
   * not disturb a worker already thinking about it.
   */
  const position = `${state.moves.length}:${state.toPlay}:${state.status}`;
  const board = useRef({ state, seats });
  // Written in an effect, never during render: the rule React's own lint keeps.
  useEffect(() => {
    board.current = { state, seats };
  });

  useEffect(() => {
    if (!mine || worker.current === null) return;
    const { state: now, seats: who } = board.current;
    const tier = botInSeat(who, now.toPlay);
    if (tier === null) return;
    asked.current += 1;
    setThinking(true);
    worker.current.postMessage({
      id: asked.current,
      state: now,
      tier,
      budget: { millis: BROWSER_MOVE_MILLIS },
    } satisfies BotAsk);
  }, [mine, position]);

  /** Gives up on the move in flight, for a seat being handed back to a person. */
  const stop = useCallback(() => {
    asked.current += 1;
    setThinking(false);
  }, []);

  /*
   * Whether this browser will answer for the computer at all — which is what
   * the move route is told, so it can skip working the reply out on a paid
   * function. True only where a worker can genuinely be made: `Worker` is
   * missing in a server render and in an old browser, and claiming the job
   * without being able to do it would leave the game waiting for a move
   * nobody is working on.
   */
  const answering =
    BROWSER_ANSWERS_LIVE_GAMES &&
    enabled &&
    mySeat !== null &&
    // Only opposite a computer. Against a person there is no reply to work out,
    // and a move claiming one would be a claim about nothing.
    botInSeat(seats, otherStone(mySeat)) !== null &&
    typeof Worker !== "undefined";

  return { thinking, answering, stop };
}

/**
 * One turn, in the shapes the moves route takes.
 *
 * Written out rather than derived, because the route's body is an interface and
 * an interface is worth stating. A twist is the one turn that is two requests:
 * it rides on the stone that owes it, and the route updates the stone's row
 * rather than adding one, so the stone has to land first.
 */
async function post(turn: BotTurn, send: (body: Record<string, unknown>) => Promise<void>): Promise<void> {
  if (turn.kind === "pass") {
    await send({ pass: true });
    return;
  }
  if (turn.kind === "piece") {
    await send({ cells: turn.cells });
    return;
  }
  if (turn.kind === "move") {
    await send({ row: turn.row, col: turn.col, from: turn.from });
    return;
  }
  await send(turn.stone === undefined ? { row: turn.row, col: turn.col } : { row: turn.row, col: turn.col, stone: turn.stone });
  if (turn.twist !== undefined) await send({ twist: turn.twist });
}
