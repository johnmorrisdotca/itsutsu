"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import type { Hinting } from "./useHints";

/**
 * The Hint press, at the other end of the row from Check and Show (John:
 * "LHS Check, Show, RHS Hint"). A hint puts one right cell in (`cellHint`).
 * Always drawn; when hints were not chosen it is disabled and says where they
 * are chosen. When they were, it says how many are used from the start, as
 * Check says how many are left, so the first press does not widen it.
 */
export function SolveHint({ hinting, onHint, disabled, racing, without }: { hinting: Hinting; onHint: () => void; disabled: boolean; racing: boolean; without?: string }) {
  // `without` is a puzzle with no hints to choose at all, saying why in its own words (a Suido level: `suido.constants.ts`).
  const say = useSpeaker();
  const why = without ?? (racing ? say.say("puzzle.solve.hintNoRace") : !hinting.allowed ? say.say("puzzle.solve.hintChosenAtSetUp") : undefined);
  return (
    <button
      type="button"
      className={`${BUTTON_BASE} ${BUTTON_QUIET} ml-auto`}
      onClick={onHint}
      disabled={disabled || !hinting.allowed}
      title={why}
      aria-description={why}
      data-testid="puzzle-hint"
      data-allowed={hinting.allowed ? "true" : "false"}
    >
      {hinting.allowed ? say.say("puzzle.solve.hintUsed", { count: String(hinting.used) }) : say.say("puzzle.solve.hint")}
    </button>
  );
}
