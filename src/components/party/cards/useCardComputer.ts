"use client";

import { useEffect } from "react";

import type { CardGameRules } from "@/lib/cardGames/cardGames.types";

import { COMPUTER_PAUSE_MS } from "./cardTable.constants";

/**
 * A COMPUTER'S MOVE, ONE AT A TIME, IN THIS BROWSER. When the seat to move is
 * a computer's, its move (`rules.computer`, which sees only what that seat
 * could see) is made after a short pause, so the table can watch the card go
 * down, and kept at once as a person's is; the next computer's follows the
 * same way. A pause that waits while the tab is hidden, never a poll, and
 * nothing asked of the server. As Mexican Train's (`useTrainComputer`).
 */
export function useCardComputer<S, M>(rules: CardGameRules<S, M>, game: S, keep: (game: S) => void): boolean {
  const seat = rules.over(game) ? null : rules.toPlay(game);
  const moving = seat !== null && rules.seats(game).computers[seat] === true;
  useEffect(() => {
    if (!moving) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: number | undefined;
    const move = () => {
      timer = undefined;
      const next = rules.play(game, rules.computer(game));
      if (next !== null) keep(next);
    };
    const wait = () => {
      if (timer === undefined && document.visibilityState === "visible") timer = window.setTimeout(move, still ? COMPUTER_PAUSE_MS / 4 : COMPUTER_PAUSE_MS);
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
  }, [moving, rules, game, keep]);
  return moving;
}
