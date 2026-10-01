"use client";

import { useEffect } from "react";

import type { DiceWarGame } from "@johnmorrisdotca/korokoro";

import { throwDiceWar, waitsOnPerson } from "@/lib/party/diceWar/diceWarThrow";

import { DICE_WAR_PAUSE_MS, DICE_WAR_PAUSE_REDUCED_MS } from "./diceWar.constants";

/**
 * THE COMPUTERS' THROW, IN THIS BROWSER, as Yacht's computer moves are
 * (`useYachtComputer`): when a war is left to computers alone, the game throws
 * for them after a pause long enough to watch the last throw, and keeps it at
 * once. A fixed pause that waits while the tab is hidden, never a poll, and
 * nothing asked of the server. (When a person is to roll, the table waits for
 * their press, and the computers' dice come with it.)
 */
export function useDiceWarComputer(game: DiceWarGame, keep: (game: DiceWarGame) => void, onThrow: (dice: number) => void): void {
  const moving = game.phase !== "over" && !waitsOnPerson(game);
  useEffect(() => {
    if (!moving) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: number | undefined;
    const move = () => {
      timer = undefined;
      const next = throwDiceWar(game);
      if (next === null) return;
      onThrow(game.rollers.length * game.dice);
      keep(next);
    };
    const wait = () => {
      if (timer === undefined && document.visibilityState === "visible") timer = window.setTimeout(move, still ? DICE_WAR_PAUSE_REDUCED_MS : DICE_WAR_PAUSE_MS);
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
  }, [moving, game, keep, onThrow]);
}
