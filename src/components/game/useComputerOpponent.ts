"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { seatToPlay } from "@/lib/gomoku/rules/seats";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { BotAnswer, BotAsk } from "@/lib/gomoku/botWorker";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { Seat } from "@/lib/gomoku/gomoku.types";
import type { GameActions, GameSession } from "./game.types";

/**
 * A computer player sitting at the practice board, thinking in this browser.
 *
 * The chooser it runs is the same one the server runs, unchanged — see
 * `botWorker.ts` for why that is the whole point rather than a convenience.
 * What this file does is decide WHEN to ask, and what to do with an answer
 * that arrives late.
 *
 * **Late answers are the only hard part.** The board does not stop while the
 * worker thinks: the person can undo, jump back through the record, start a
 * new game, or change the settings under it. An answer to a position nobody is
 * standing in any more must be dropped rather than played, or a stone appears
 * from a game that no longer exists. Every ask carries a number, only the
 * newest number is accepted, and the number moves whenever the position does.
 */
export function useComputerOpponent({
  session,
  actions,
  seat,
  tier,
}: {
  session: GameSession;
  actions: GameActions;
  /** The seat the computer holds, or null when two people are playing. */
  seat: Seat | null;
  tier: BotTier;
}) {
  const worker = useRef<Worker | null>(null);
  const asked = useRef(0);
  const [thinking, setThinking] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // The pieces of the answer's handler that change every render, kept off the
  // worker's lifetime: rebuilding the worker each move would throw away a
  // thread mid-thought and start the position again from nothing.
  const latest = useRef({ actions, session });
  // Written in an effect rather than during render: a ref touched while
  // rendering is read by React's own rules as a value the render depends on,
  // and it is the opposite — this exists so the worker's handler can reach
  // today's actions without the worker being rebuilt when they change.
  useEffect(() => {
    latest.current = { actions, session };
  });

  useEffect(() => {
    if (seat === null) return;
    const made = new Worker(new URL("@/lib/gomoku/botWorker.ts", import.meta.url), { type: "module" });
    worker.current = made;

    made.addEventListener("message", (event: MessageEvent<BotAnswer>) => {
      const answer = event.data;
      // An answer about a position that has since been left. Nothing is wrong;
      // it is simply no longer about this game.
      if (answer.id !== asked.current) return;
      setThinking(false);
      if (!answer.ok) {
        setFailed(answer.reason);
        return;
      }
      // `null` is "no turn to take", which the engine may legitimately say.
      if (answer.turn !== null) latest.current.actions.playTurn(answer.turn);
    });

    made.addEventListener("error", (event) => {
      setThinking(false);
      setFailed(event.message || "the computer player stopped");
    });

    return () => {
      // A new number first, so an answer already in flight is ignored even if
      // it lands between here and the thread actually stopping.
      asked.current += 1;
      made.terminate();
      worker.current = null;
      setThinking(false);
    };
  }, [seat]);

  const { state, reviewing } = session;
  const toPlay = state.status === GAME_STATUS.playing ? seatToPlay(state) : null;
  const mine = seat !== null && toPlay === seat;

  useEffect(() => {
    // Not its turn, nobody sitting there, or the person is reading the record
    // rather than playing — in none of those is a move wanted.
    if (!mine || reviewing || worker.current === null) {
      return;
    }
    asked.current += 1;
    const ask: BotAsk = { id: asked.current, state, tier };
    setThinking(true);
    setFailed(null);
    worker.current.postMessage(ask);
  }, [mine, reviewing, state, tier]);

  /** Give up on the move in flight — used when the seat is handed back to a person. */
  const stop = useCallback(() => {
    asked.current += 1;
    setThinking(false);
  }, []);

  return { thinking, failed, stop };
}
