"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import type { Checking } from "./solveShared";

/**
 * SHOW, beside Check: the cells that are wrong, marked on the grid until each
 * is changed. John, 2026-09-25: "Keeping simple, should be CHECK and SHOW… so
 * LHS Check, Show, RHS Hint." It answers Check's question more fully, so it is
 * paid for from the same allowance: with three checks, three presses of either.
 */
export function SolveShow({ checking, onShow, disabled }: { checking: Checking; onShow: () => void; disabled: boolean }) {
  const say = useSpeaker();
  const spent = checking.left === 0;
  return (
    <button
      type="button"
      className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
      onClick={onShow}
      disabled={disabled || spent}
      title={say.say(spent ? "puzzle.solve.showSpent" : "puzzle.solve.showWords")}
      data-testid="puzzle-show"
    >
      {say.say("puzzle.solve.show")}
    </button>
  );
}
