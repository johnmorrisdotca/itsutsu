"use client";

import { createContext, useContext } from "react";

import type { PuzzleClock } from "@/lib/puzzles/puzzles.types";

/**
 * THE COUNTDOWN A SOLVE IS PLAYED ON, held above the solve (`PuzzlePlay`)
 * rather than passed to each kind's solve screen: `useSolve` runs it, the
 * header draws it and the card at the end says it ran out, and none of the
 * grids in between has anything to do with it. "none" where no provider is
 * above — a race, which is a contest of its own and never on a countdown.
 */
const PuzzleClockContext = createContext<PuzzleClock>("none");

export const PuzzleClockProvider = PuzzleClockContext.Provider;

export function usePuzzleClock(): PuzzleClock {
  return useContext(PuzzleClockContext);
}
