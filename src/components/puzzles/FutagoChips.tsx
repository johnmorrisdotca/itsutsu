"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { FUTAGO_DISPLAY } from "@/lib/puzzles/gomoji/futago";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/**
 * ONE WORD OR TWO, chosen on a Gomoji's set-up screen: the Gomoji itself, or
 * its Futago 双子 (`futago.ts`), two words at once, every guess going to both
 * boards. Drawn at every size and level, and its line under it always one line
 * of the same room, so choosing it never moves what is under it.
 */
export function FutagoChips({
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
  const grid = kind === "gomojiKana" ? "gomojiKana" : "gomoji";
  const free = grid === "gomojiKana" && level !== "hard" ? 1 : 0;
  const guesses = guessesFor(grid, size, level, free, 2);
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="How many words" data-testid="puzzle-futago">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={chosen === each}
            className={`${PICK_WORD_CHIP} ${chosen === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each)}
            data-testid={`puzzle-futago-${each ? "on" : "off"}`}
          >
            {each ? FUTAGO_DISPLAY.label : "One word"} <span className="font-mincho opacity-70">{each ? FUTAGO_DISPLAY.kanji : "一語"}</span>
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="puzzle-futago-blurb">
        {chosen
          ? `Two hidden words at once, ${guesses} guesses for both: every guess goes to both boards, and each key shows both boards' colours.`
          : "One hidden word, one board."}
      </p>
    </>
  );
}
