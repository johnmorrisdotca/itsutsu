"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { FUTAGO_DISPLAY } from "@/lib/puzzles/gomoji/futago";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import { YOTSUGO_DISPLAY } from "@/lib/puzzles/gomoji/yotsugo";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/** The three choices, in the order they are drawn, each with its own test id. */
const CHOICES: readonly { words: WordCount; testId: string }[] = [
  { words: 1, testId: "puzzle-futago-off" },
  { words: 2, testId: "puzzle-futago-on" },
  { words: 4, testId: "puzzle-yotsugo-on" },
];

/**
 * ONE WORD, TWO OR FOUR, chosen on a Gomoji's set-up screen: the Gomoji
 * itself, its Futago 双子 (`futago.ts`), two words at once, or its Yotsugo
 * 四つ子 (`yotsugo.ts`), four, every guess going to every word. Drawn at every
 * size and level, three to a row on a phone as the chips above them are, and
 * the line under them always the same room — two lines at 390 pixels, which
 * the two-word line once overran — so choosing never moves what is under it.
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
  chosen: WordCount;
  onChoose: (chosen: WordCount) => void;
}) {
  const grid = kind === "gomojiKana" ? "gomojiKana" : "gomoji";
  const free = grid === "gomojiKana" && level !== "hard" ? 1 : 0;
  const guesses = guessesFor(grid, size, level, free, chosen);
  const name = (words: WordCount) => (words === 4 ? YOTSUGO_DISPLAY : words === 2 ? FUTAGO_DISPLAY : { label: "One word", kanji: "一語" });
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="How many words" data-testid="puzzle-futago">
        {CHOICES.map((each) => (
          <button
            key={each.words}
            type="button"
            role="radio"
            aria-checked={chosen === each.words}
            className={`${PICK_WORD_CHIP} ${chosen === each.words ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each.words)}
            data-testid={each.testId}
          >
            {name(each.words).label} <span className="font-mincho opacity-70">{name(each.words).kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="puzzle-futago-blurb">
        {chosen === 4
          ? `Four hidden words, ${guesses} guesses: each goes to all four, and each key shows all four colours.`
          : chosen === 2
            ? `Two hidden words, ${guesses} guesses: each goes to both words, and each key shows both colours.`
            : "One hidden word, one board."}
      </p>
    </>
  );
}
