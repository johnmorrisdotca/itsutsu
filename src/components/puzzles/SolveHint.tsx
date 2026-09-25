"use client";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import type { Hinting } from "./useHints";

/**
 * The Hint press, at the other end of the row from Check (John: "Should be
 * opposite side of CHECK button… perhaps it's always there and disabled when
 * not active or chosen in options"). Always drawn; when hints were not chosen
 * it is disabled and says where they are chosen.
 */
export function SolveHint({ hinting, onHint, disabled, racing }: { hinting: Hinting; onHint: () => void; disabled: boolean; racing: boolean }) {
  const why = racing ? "No hints in a race" : !hinting.allowed ? "Hints are chosen when the puzzle is set up" : undefined;
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
      Hint{hinting.used > 0 ? ` · ${hinting.used} used` : ""}
    </button>
  );
}
