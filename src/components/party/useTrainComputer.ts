"use client";

import { useEffect } from "react";

import { TRAIN_PHASES, computerMove, peopleAt, playTrain } from "@johnmorrisdotca/domino";
import type { TrainGame } from "@johnmorrisdotca/domino";

import { TRAIN_COMPUTER_PAUSE_MS, TRAIN_COMPUTER_PAUSE_REDUCED_MS } from "./party.constants";

/** Whether the computer in the seat to move has something to do: its turn, or — at a table of computers only — dealing the next round. */
export function computerToMove(game: TrainGame): boolean {
  if (game.phase === TRAIN_PHASES.playing) return game.computers[game.toPlay] === true;
  return game.phase === TRAIN_PHASES.roundOver && peopleAt(game).length === 0;
}

/**
 * A COMPUTER'S MOVE, ONE AT A TIME, IN THIS BROWSER. When the seat to move is
 * a computer's, its move (`computerMove`) is made after a short pause, so the
 * table can watch the tile go down, and kept at once, as a person's is; the
 * next computer's follows the same way. A fixed pause that waits while the
 * tab is hidden, never a poll, and nothing asked of the server: the whole of
 * the computer is the rules and a few lines of judgement in `trainComputer.ts`.
 *
 * Nothing but the kept game is state here, so a reload part way through a
 * run of computer turns simply carries on from the last one kept.
 */
export function useTrainComputer(game: TrainGame | null | undefined, keep: (game: TrainGame) => void): void {
  const moving = game !== null && game !== undefined && computerToMove(game);
  useEffect(() => {
    if (!moving || game === null || game === undefined) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pause = still ? TRAIN_COMPUTER_PAUSE_REDUCED_MS : TRAIN_COMPUTER_PAUSE_MS;
    let timer: number | undefined;
    const move = () => {
      timer = undefined;
      const next = playTrain(game, computerMove(game));
      if (next !== null) keep(next);
    };
    const wait = () => {
      if (timer === undefined && document.visibilityState === "visible") timer = window.setTimeout(move, pause);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") wait();
      else if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };
    wait();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [moving, game, keep]);
}
