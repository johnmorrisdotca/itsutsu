"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { dodgeBlurb, DODGE_DISPLAY } from "@/lib/puzzles/gomoji/dodgeWords";
import { dodgeGuesses } from "@/lib/puzzles/gomoji/dodgePlay";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * A WORD THAT SITS STILL OR ONE THAT DODGES, chosen on a Gomoji's set-up
 * screen: the Gomoji itself, or its Nige 逃げ (`dodge.ts`). Drawn at every size
 * and level, its line under it always the same room, so choosing it never
 * moves what is under it.
 */
export function DodgeChips({
  kind,
  size,
  offered,
  chosen,
  onChoose,
}: {
  kind: PuzzleKind;
  size: number;
  /** Whether this language can dodge (`offersDodge`): the row is drawn either way, so choosing a language never moves what is under it. */
  offered: boolean;
  chosen: boolean;
  onChoose: (chosen: boolean) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Whether the word dodges" data-testid="puzzle-dodge">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={offered && chosen === each}
            disabled={!offered}
            className={`${PICK_WORD_CHIP} ${offered && chosen === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each)}
            data-testid={`puzzle-dodge-${each ? "on" : "off"}`}
          >
            {each ? DODGE_DISPLAY.label : "Sits still"} <span className="font-mincho opacity-70">{each ? DODGE_DISPLAY.kanji : "隠れ"}</span>
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="puzzle-dodge-blurb">
        {offered ? dodgeBlurb(chosen, dodgeGuesses(kind, size)) : "Pop culture words are found from their category, so none of them dodges: choose another word list to play a Nige."}
      </p>
    </>
  );
}
