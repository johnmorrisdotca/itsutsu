"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { backwardsBlurb, BACKWARDS_DISPLAY } from "@/lib/puzzles/gomoji/backwardsWords";
import { backwardsGuesses } from "@/lib/puzzles/gomoji/backwardsRows";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/**
 * FIND THE WORD OR AVOID IT, chosen on a Gomoji's set-up screen: the Gomoji
 * itself, or its Sakasa 逆さ (`backwards.ts`). Drawn at every size and level,
 * its line under it always the same room, so choosing it never moves what is
 * under it.
 */
export function BackwardsChips({
  kind,
  size,
  level,
  chosen,
  onChoose,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  chosen: boolean;
  onChoose: (chosen: boolean) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Whether the word is found or avoided" data-testid="puzzle-backwards">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={chosen === each}
            className={`${PICK_WORD_CHIP} ${chosen === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each)}
            data-testid={`puzzle-backwards-${each ? "on" : "off"}`}
          >
            {each ? BACKWARDS_DISPLAY.label : "Find it"} <span className="font-mincho opacity-70">{each ? BACKWARDS_DISPLAY.kanji : "探す"}</span>
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="puzzle-backwards-blurb">
        {backwardsBlurb(chosen, backwardsGuesses(kind, size, level))}
      </p>
    </>
  );
}
