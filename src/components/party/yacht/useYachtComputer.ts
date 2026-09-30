"use client";

import { useEffect } from "react";

import { YACHT_PHASES, playYacht } from "@/lib/party/yacht/yacht";
import type { YachtGame } from "@/lib/party/yacht/yacht.types";
import { yachtComputerMove } from "@/lib/party/yacht/yachtComputer";

import { YACHT_COMPUTER_PAUSE_MS, YACHT_COMPUTER_PAUSE_REDUCED_MS } from "./yacht.constants";

/**
 * A COMPUTER'S MOVE, ONE AT A TIME, IN THIS BROWSER, as Mexican Train's are
 * (`useTrainComputer`): when the seat to move is a computer's, its move
 * (`yachtComputerMove`) is made after a pause long enough to watch the dice
 * land, and kept at once, as a person's is. A fixed pause that waits while the
 * tab is hidden, never a poll, and nothing asked of the server.
 */
export function useYachtComputer(game: YachtGame | null | undefined, keep: (game: YachtGame) => void, onRoll: (dice: number) => void): void {
  const moving = game !== null && game !== undefined && game.phase === YACHT_PHASES.playing && game.computers[game.toPlay] === true;
  useEffect(() => {
    if (!moving || game === null || game === undefined) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pause = still ? YACHT_COMPUTER_PAUSE_REDUCED_MS : YACHT_COMPUTER_PAUSE_MS;
    let timer: number | undefined;
    const move = () => {
      timer = undefined;
      const chosen = yachtComputerMove(game);
      const next = playYacht(game, chosen);
      if (next === null) return;
      if (chosen.kind === "roll") onRoll(next.dice.length - next.dice.filter((_, at) => (chosen.hold & (1 << at)) !== 0).length);
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
