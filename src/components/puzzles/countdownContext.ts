"use client";

import { createContext, useContext } from "react";

/**
 * THE COUNTDOWN A PUZZLE IS PLAYED AGAINST (`countdown.ts`), in milliseconds,
 * or null for none. Handed down by the play page (`PuzzlePlay`) and read by
 * the one clock every kind of puzzle shares (`useSolve`), so a countdown is on
 * every puzzle without each kind's solve having to carry it.
 */
export const CountdownContext = createContext<number | null>(null);

export function useCountdownMs(): number | null {
  return useContext(CountdownContext);
}
