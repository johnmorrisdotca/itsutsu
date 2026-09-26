"use client";

import { useCallback, useMemo, useState } from "react";

import { useHydrated } from "@/lib/ui/hydrated";

import type { TsunagiMarks } from "./puzzles.constants";
import { keepMarksHere, keptMarks } from "./tsunagiKept";

/**
 * Colours or numbers, as this player last chose: on the account for a member
 * (the `tsunagiMarks` preference, read by the page and written with one
 * PATCH, as Gomoji's style is), in the browser for anybody else. Changing it
 * redraws at once; the level is the same either way.
 *
 * The browser's own choice is read only once the page has hydrated
 * (`useHydrated`), so the server's drawing and the first one in the browser
 * agree, and nothing sets state from an effect.
 */
export function useTsunagiMarks(initial: TsunagiMarks | null, saves: boolean): { marks: TsunagiMarks; chooseMarks: (next: TsunagiMarks) => void } {
  const hydrated = useHydrated();
  const [chosen, setChosen] = useState<TsunagiMarks | null>(null);
  const browser = useMemo(() => (hydrated && !saves ? keptMarks() : null), [hydrated, saves]);
  const marks = chosen ?? browser ?? initial ?? "colours";
  const chooseMarks = useCallback(
    (next: TsunagiMarks) => {
      setChosen(next);
      keepMarksHere(next);
      if (!saves) return;
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { tsunagiMarks: next } }),
      }).catch(() => undefined);
    },
    [saves],
  );
  return { marks, chooseMarks };
}
