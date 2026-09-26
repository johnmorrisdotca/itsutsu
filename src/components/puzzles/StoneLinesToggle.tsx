"use client";

import { useCallback, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";

/** Where this browser's answer is kept, as the Gomoji keys' is (`WordKeysToggle`): a view of the grid, not a fact about the account. */
const KEPT = "itsutsu.stoneLines";

/**
 * WHETHER A HIDDEN STONES GRID DRAWS EACH STONE'S LINES (`StoneLines`),
 * remembered in this browser from one puzzle to the next, off until the
 * player turns it on. The solve is drawn in the browser only (`ssr: false`),
 * so reading the kept answer as the state starts cannot differ from a
 * server's drawing.
 */
export function useStoneLines(): { on: boolean; toggle: () => boolean } {
  const [on, setOn] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(KEPT) === "on";
    } catch {
      return false;
    }
  });
  const toggle = useCallback((): boolean => {
    const now = !on;
    setOn(now);
    try {
      window.localStorage.setItem(KEPT, now ? "on" : "off");
    } catch {
      // Kept for this page only.
    }
    return now;
  }, [on]);
  return { on, toggle };
}

/**
 * LINES, beside Hint and only where hints were chosen. John, 2026-09-26: "the
 * button could be called LINES and only appears when Hints are on... and next
 * to the Hint button is OK." A help like Hint, so it is counted as one: once
 * a puzzle, the first time the lines are drawn while its clock runs
 * (`HiddenStonesSolve`), and the Hint button's count says so.
 */
export function StoneLinesToggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      className={`${BUTTON_BASE} ${on ? BUTTON_STRONG : BUTTON_QUIET}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={on}
      title="A line from every stone along its row and column. Counts as one hint."
      data-testid="puzzle-lines"
      data-on={on ? "true" : "false"}
    >
      Lines
    </button>
  );
}
