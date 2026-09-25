"use client";

import { useCallback, useState } from "react";

/**
 * HINT: WHICH CELLS ARE WRONG, NOT HOW MANY. John, 2026-09-24: "when a user
 * wants a HINT button they can add as an option for these games... and when
 * pressed, we highlight what's wrong. Should be opposite side of CHECK button."
 *
 * Check says how many cells are wrong and never which; Hint marks them. It is
 * chosen on the puzzle's set-up (`hints=1` in the address), off by default, and
 * never in a race, which stays a straight contest. A mark stays on a cell until
 * that cell is changed. How many times it was pressed goes with the solve, so a
 * time helped by hints is never shown as one that was not.
 */
export type Hinting = {
  /** Whether Hint may be pressed on this puzzle at all. */
  allowed: boolean;
  used: number;
  /** The cells marked wrong by the last press, less any changed since. */
  marked: ReadonlySet<number>;
  /** A press: mark these cells (the wrong entries the solve screen found). */
  show: (wrong: readonly number[]) => void;
  /** A cell changed: its mark, if it had one, goes. */
  unmark: (index: number) => void;
};

export function useHints(allowed: boolean, usedBefore = 0): Hinting {
  const [used, setUsed] = useState(usedBefore);
  const [marked, setMarked] = useState<ReadonlySet<number>>(new Set());
  const show = useCallback(
    (wrong: readonly number[]) => {
      if (!allowed) return;
      setUsed((so) => so + 1);
      setMarked(new Set(wrong));
    },
    [allowed],
  );
  const unmark = useCallback((index: number) => {
    setMarked((so) => {
      if (!so.has(index)) return so;
      const next = new Set(so);
      next.delete(index);
      return next;
    });
  }, []);
  return { allowed, used, marked, show, unmark };
}
