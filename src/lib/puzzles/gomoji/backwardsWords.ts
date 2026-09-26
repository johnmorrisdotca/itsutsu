import type { PuzzleSpec } from "../puzzles.types";
import { SAKASA_SCORE } from "./backwardsScore";

/**
 * WHAT A GOMOJI SAKASA 逆さ IS CALLED, AND WHAT A READER IS TOLD (`backwards.ts`).
 *
 * Our own name for our version of the Antiwordle idea: sakasa 逆さ is upside
 * down, the wrong way round, which is how it is played. A way of playing every
 * Gomoji rather than a puzzle of its own, so its words are a line on the set-up
 * screen and a bullet on each Gomoji's rules page. Kept here, rather than in
 * the puzzles' copy, which is stamped for their pictures
 * (`puzzleArtFingerprint.ts`) and none of which shows a Sakasa.
 */
export const BACKWARDS_DISPLAY = {
  label: "Sakasa",
  kanji: "逆さ",
  /** What it is our version of, as a Gomoji's copy says its own (`inspiredBy`). */
  inspiredBy: "Antiwordle",
} as const;

/** The line under the chips on the set-up screen, for the ordinary way and for backwards. */
export function backwardsBlurb(chosen: boolean, rows: number): string {
  return chosen
    ? `Don't find the word: fill all ${rows} rows without typing it. Every green stays, every orange is used again, and a grey is never typed twice.`
    : "Find the hidden word before the rows run out.";
}

/** The bullet on a Gomoji's rules page, in the Play section (`puzzleRulesPage.ts`). */
export function backwardsRule(grid: NonNullable<PuzzleSpec["wordGrid"]>): string {
  const unit = grid === "gomojiKana" ? "kana" : "letter";
  return `Sakasa 逆さ (the wrong way round), a choice at any level and our version of Antiwordle, turns the puzzle over: a word is hidden as ever, and the aim is never to type it. Fill every row without it and you have won; type it and the game is over. Every ${unit} you uncover must be used again, a green in its place and an orange anywhere, a grey ${unit} may never be typed again, and no word twice, so each row closes in on the one word you are avoiding. Harder is longer: easy asks for as many rows as an ordinary hard Gomoji gives, hard the whole board. There is no head start, and in kana no free grey word. Each row got through scores ${SAKASA_SCORE.row}, and getting through them all ${SAKASA_SCORE.through} more. There is a Sakasa of the day at every length, the same word for everybody.`;
}
