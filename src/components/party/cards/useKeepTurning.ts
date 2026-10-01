"use client";

import { useEffect } from "react";

import { KEEP_TURNING_MS } from "./cardTable.constants";

/**
 * "KEEP TURNING", for a game with one press and nothing to choose (War): while
 * it is on and it is a person's turn, `turn` is called after a short pause,
 * again after each turn, until the game ends or it is switched off. A browser
 * timer that waits while the tab is hidden, never a poll, and nothing asked of
 * the server; as the computers' own moves are (`useCardComputer`).
 */
export function useKeepTurning(on: boolean, moves: number, turn: () => void): void {
  useEffect(() => {
    if (!on) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: number | undefined;
    const fire = () => {
      timer = undefined;
      turn();
    };
    const wait = () => {
      if (timer === undefined && document.visibilityState === "visible") timer = window.setTimeout(fire, still ? KEEP_TURNING_MS / 3 : KEEP_TURNING_MS);
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
    // `moves` re-arms the timer after every turn; `turn` is a fresh closure each render and would do so too, but that is what it is for.
  }, [on, moves]); // eslint-disable-line react-hooks/exhaustive-deps
}
