import type { PuzzleSpec } from "../puzzles.types";

/**
 * WHAT A GOMOJI NIGE 逃げ IS CALLED, AND WHAT A READER IS TOLD (`dodge.ts`).
 *
 * Our own name for our version of the Absurdle idea: nige 逃げ is running
 * away, which is all the word does. A way of playing every Gomoji rather than
 * a puzzle of its own, so its words are a line on the set-up screen and a
 * bullet on each Gomoji's rules page. Kept here, rather than in the puzzles'
 * copy, which is stamped for their pictures (`puzzleArtFingerprint.ts`) and
 * none of which shows a dodger.
 */
export const DODGE_DISPLAY = {
  label: "Nige",
  kanji: "逃げ",
  /** What it is our version of, as a Gomoji's copy says its own (`inspiredBy`). */
  inspiredBy: "Absurdle",
} as const;

/** The line under the chips on the set-up screen, for a word that sits still and for one that dodges. */
export function dodgeBlurb(chosen: boolean, rows: number): string {
  return chosen
    ? `No word is hidden yet: each guess gets the colours that leave the most words, and it is found only when nothing else is left. ${rows} guesses.`
    : "One hidden word, chosen before the first guess.";
}

/** The bullet on a Gomoji's rules page, in the Play section (`puzzleRulesPage.ts`). */
export function dodgeRule(grid: NonNullable<PuzzleSpec["wordGrid"]>): string {
  const unit = grid === "gomojiKana" ? "kana" : "letters";
  return `Nige 逃げ (running away), a choice at any level and our version of Absurdle, hides no word at all: every guess is answered with the colours that leave the most words still possible, never going back on a colour already shown, and the word is found only when your guess is the one word left. It gives every row of the board, one fewer at hard; there is no head start, and in kana no free grey word. The line under the board says how many words it still has to hide among, and when the rows run out it names one of them. There is a Nige of the day at every length as well, the same for everybody, the ${unit} and the colours the same as ever.`;
}
