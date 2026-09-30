"use client";

import { useEffect } from "react";

import { playHitotsu } from "@/lib/party/hitotsu/hitotsu";
import { hitotsuComputer, hitotsuComputerJump } from "@/lib/party/hitotsu/hitotsuComputer";
import type { HitotsuGame } from "@/lib/party/hitotsu/hitotsu.types";

import { COMPUTER_PAUSE_MS } from "../cards/cardTable.constants";

/**
 * A COMPUTER'S MOVE, ONE AT A TIME, IN THIS BROWSER, as the family card games'
 * (`useCardComputer`): after a short pause, so the table can watch the card
 * go down. With jump-in played, a computer holding a card identical to the
 * top one jumps in first — after a longer pause on a person's turn, so the
 * person has had the moment to see it coming. Waits while the tab is hidden;
 * no server is asked anything. Returns whether a computer is about to move.
 */
export function useHitotsuComputer(game: HitotsuGame, keep: (game: HitotsuGame) => void): boolean {
  const over = game.phase === "over" || game.toPlay === null;
  const jump = over ? null : hitotsuComputerJump(game);
  const turn = !over && game.computers[game.toPlay!] === true;
  const moving = jump !== null || turn;
  const wait = jump !== null && !turn ? COMPUTER_PAUSE_MS * 2 : COMPUTER_PAUSE_MS;
  useEffect(() => {
    if (!moving) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: number | undefined;
    const move = () => {
      timer = undefined;
      const next = playHitotsu(game, hitotsuComputerJump(game) ?? hitotsuComputer(game));
      if (next !== null) keep(next);
    };
    const arm = () => {
      if (timer === undefined && document.visibilityState === "visible") timer = window.setTimeout(move, still ? wait / 4 : wait);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") arm();
      else if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };
    arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [moving, wait, game, keep]);
  return turn;
}
