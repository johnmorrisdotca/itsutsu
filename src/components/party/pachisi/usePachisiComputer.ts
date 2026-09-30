"use client";

import { useEffect } from "react";

import { playPachisi } from "@/lib/party/pachisi/pachisi";
import type { PachisiGame } from "@/lib/party/pachisi/pachisi.types";
import { pachisiComputerMove } from "@/lib/party/pachisi/pachisiComputer";

import { PACHISI_COMPUTER_PAUSE_MS, PACHISI_COMPUTER_PAUSE_REDUCED_MS } from "./pachisi.constants";

/**
 * A COMPUTER'S MOVE, ONE AT A TIME, IN THIS BROWSER, as at every table with
 * computers (`useTrainComputer`): its throw or its move after a short pause,
 * kept at once; a pause that waits while the tab is hidden, never a poll.
 */
export function usePachisiComputer(game: PachisiGame | null | undefined, keep: (game: PachisiGame) => void, onRoll: () => void): void {
  const moving = game !== null && game !== undefined && game.phase !== "finished" && game.computers[game.toPlay] === true;
  useEffect(() => {
    if (!moving || game === null || game === undefined) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pause = still ? PACHISI_COMPUTER_PAUSE_REDUCED_MS : PACHISI_COMPUTER_PAUSE_MS;
    let timer: number | undefined;
    const move = () => {
      timer = undefined;
      const chosen = pachisiComputerMove(game);
      const next = playPachisi(game, chosen);
      if (next === null) return;
      if (chosen.kind === "roll") onRoll();
      keep(next);
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
  }, [moving, game, keep, onRoll]);
}
