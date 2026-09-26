"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { FUTAGO_BOARDS, FUTAGO_DISPLAY, YOTSUGO_BOARDS } from "@/lib/puzzles/gomoji/futago";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import { YOTSUGO_DISPLAY } from "@/lib/puzzles/gomoji/yotsugo";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/** How many words a Gomoji hides: one, a Futago's two or a Yotsugo's four. */
export type WordCount = 1 | typeof FUTAGO_BOARDS | typeof YOTSUGO_BOARDS;

const CHOICES: readonly { words: WordCount; label: string; kanji: string; testId: string }[] = [
  { words: 1, label: "One word", kanji: "一語", testId: "puzzle-futago-off" },
  { words: FUTAGO_BOARDS, label: FUTAGO_DISPLAY.label, kanji: FUTAGO_DISPLAY.kanji, testId: "puzzle-futago-on" },
  { words: YOTSUGO_BOARDS, label: YOTSUGO_DISPLAY.label, kanji: YOTSUGO_DISPLAY.kanji, testId: "puzzle-yotsugo-on" },
];

/**
 * ONE WORD, TWO OR FOUR, chosen on a Gomoji's set-up screen: the Gomoji
 * itself, its Futago 双子 (`futago.ts`), two words at once, or its Yotsugo
 * 四つ子 (`yotsugo.ts`), four, every guess going to every board. Three chips in
 * one row at every width, and the line under them always the same room, so
 * choosing one never moves what is under it.
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
            {each.label} <span className="font-mincho opacity-70">{each.kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="puzzle-futago-blurb">
        {chosen === YOTSUGO_BOARDS
          ? `Four hidden words at once, one in each quarter of the board, ${guesses} guesses for all four: every guess goes to every board, and each key shows all four colours.`
          : chosen === FUTAGO_BOARDS
            ? `Two hidden words at once, ${guesses} guesses for both: every guess goes to both boards, and each key shows both boards' colours.`
            : "One hidden word, one board."}
      </p>
    </>
  );
}
