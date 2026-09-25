"use client";

import { useCallback, useState } from "react";

/**
 * EVERY STATE A PUZZLE'S GRID HAS BEEN IN, TO STEP BACK THROUGH.
 *
 * John, 2026-09-25, at a puzzle with nothing to review: "we have no scrubber…
 * the scrubber can probably go directly below the board… full board width.
 * controls below it. Hidden move list that can reveal when opened."
 *
 * The solve components keep only the grid as it is now, so this keeps each
 * grid it has been: a new state is noticed while rendering (the pattern React
 * gives for state derived from a prop), not in an effect, so nothing is drawn
 * twice. `shown` is the grid at the step being looked at; `reviewing` says it
 * is an earlier one, which the solve component draws read-only.
 *
 * A puzzle picked up again from My games opens with the steps it was kept
 * with (`opening`, read from its step log), so the scrubber goes back past the
 * moment it was left; without them the first step is the grid it opened with.
 */
export function useStepHistory<T>(current: T, opening: readonly T[] | null = null): {
  steps: readonly T[];
  viewing: number;
  shown: T;
  reviewing: boolean;
  go: (index: number) => void;
} {
  // The kept steps end on the grid it opened with; that last one is `current` itself, so a new grid is noticed by identity.
  const [steps, setSteps] = useState<readonly T[]>(() => (opening === null || opening.length === 0 ? [current] : [...opening.slice(0, -1), current]));
  const [viewing, setViewing] = useState(() => (opening === null || opening.length === 0 ? 0 : opening.length - 1));
  const latest = steps.length - 1;
  // A grid we have not seen: a new step, and the view follows it to the end.
  if (current !== steps[latest]) {
    setSteps([...steps, current]);
    setViewing(steps.length);
  }
  const go = useCallback((index: number) => setViewing(Math.max(0, Math.min(index, steps.length - 1))), [steps.length]);
  const at = Math.min(viewing, latest);
  return { steps, viewing: at, shown: steps[at] as T, reviewing: at < latest, go };
}
