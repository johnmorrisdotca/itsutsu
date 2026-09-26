"use client";

import { useCallback, useMemo, useState } from "react";

import { useHydrated } from "@/lib/ui/hydrated";

import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { keepFillHere, keepMarksHere, keptFill, keptMarks } from "./tsunagiKept";

/**
 * One of Tsunagi's looks, as this player last chose it: on the account for a
 * member (a preference, read by the page and written with one PATCH, as
 * Gomoji's style is), in the browser for anybody else. Changing it redraws at
 * once; the level is the same either way.
 *
 * The browser's own choice is read only once the page has hydrated
 * (`useHydrated`), so the server's drawing and the first one in the browser
 * agree, and nothing sets state from an effect.
 */
function useTsunagiLook<T extends string>(
  preference: "tsunagiMarks" | "tsunagiFill",
  initial: T | null,
  saves: boolean,
  fallback: T,
  here: { read: () => T | null; keep: (value: T) => void },
): [T, (next: T) => void] {
  const hydrated = useHydrated();
  const [chosen, setChosen] = useState<T | null>(null);
  const { read, keep } = here;
  const browser = useMemo(() => (hydrated && !saves ? read() : null), [hydrated, saves, read]);
  const value = chosen ?? browser ?? initial ?? fallback;
  const choose = useCallback(
    (next: T) => {
      setChosen(next);
      keep(next);
      if (!saves) return;
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { [preference]: next } }),
      }).catch(() => undefined);
    },
    [saves, keep, preference],
  );
  return [value, choose];
}

const MARKS_HERE = { read: keptMarks, keep: keepMarksHere };
const FILL_HERE = { read: keptFill, keep: keepFillHere };

/** Colours or numbers: how the pairs are told apart (the `tsunagiMarks` preference). */
export function useTsunagiMarks(initial: TsunagiMarks | null, saves: boolean): { marks: TsunagiMarks; chooseMarks: (next: TsunagiMarks) => void } {
  const [marks, chooseMarks] = useTsunagiLook("tsunagiMarks", initial, saves, "colours", MARKS_HERE);
  return { marks, chooseMarks };
}

/** Marbles or lines: whether a line's cells hold marbles of its colour (the `tsunagiFill` preference). */
export function useTsunagiFill(initial: TsunagiFill | null, saves: boolean): { fill: TsunagiFill; chooseFill: (next: TsunagiFill) => void } {
  const [fill, chooseFill] = useTsunagiLook("tsunagiFill", initial, saves, "marbles", FILL_HERE);
  return { fill, chooseFill };
}
