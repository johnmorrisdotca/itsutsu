"use client";

import { useCallback, useState } from "react";

/**
 * HINT, AND SHOW'S MARKS. John, 2026-09-25: "Keeping simple, should be CHECK
 * and SHOW… so LHS Check, Show, RHS Hint."
 *
 * Check says how many cells are wrong and never which; Show marks which (what
 * Hint used to do); Hint puts one right cell in. Show is paid for from the
 * Check allowance, since it answers the same question more fully, so its cost
 * is counted where a Check's is (`Checking.spend`); this keeps the cells it
 * marked, each until that cell is changed.
 *
 * Hint is chosen on the puzzle's set-up (`hints=1` in the address), off by
 * default, and never in a race, which stays a straight contest. How many times
 * it was pressed goes with the solve, so a time helped by hints is never shown
 * as one that was not.
 */
export type Hinting = {
  /** Whether Hint may be pressed on this puzzle at all. */
  allowed: boolean;
  used: number;
  /** A Hint pressed: counted, when hints are allowed. Answers whether it was. */
  spend: () => boolean;
  /** A cost that is not a press: a Jirai mine uncovered counts as a Hint does, whether or not Hint was chosen. */
  charge: (times: number) => void;
  /** The cells Show marked wrong, less any changed since. */
  marked: ReadonlySet<number>;
  /** Show pressed: mark these cells (the wrong entries the solve screen found). */
  mark: (wrong: readonly number[]) => void;
  /** A cell changed: its mark, if it had one, goes. */
  unmark: (index: number) => void;
};

export function useHints(allowed: boolean, usedBefore = 0): Hinting {
  const [used, setUsed] = useState(usedBefore);
  const [marked, setMarked] = useState<ReadonlySet<number>>(new Set());
  const spend = useCallback((): boolean => {
    if (!allowed) return false;
    setUsed((so) => so + 1);
    return true;
  }, [allowed]);
  const charge = useCallback((times: number) => setUsed((so) => so + times), []);
  const mark = useCallback((wrong: readonly number[]) => setMarked(new Set(wrong)), []);
  const unmark = useCallback((index: number) => {
    setMarked((so) => {
      if (!so.has(index)) return so;
      const next = new Set(so);
      next.delete(index);
      return next;
    });
  }, []);
  return { allowed, used, spend, charge, marked, mark, unmark };
}
