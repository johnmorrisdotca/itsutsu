import type { WordGrid } from "./futago";

/**
 * YOTSUGO 四つ子, "quadruplets": a Gomoji with four hidden words at once, the
 * next step from Futago 双子, "twins" (`futago.ts`), whose machinery it is.
 * John, 2026-09-26: "Is it possible to make [a four-word mode] — do we have
 * enough screen real estate with our single board concept?"
 *
 * Every guess is written on all four quarters until a quarter's word is
 * found; that quarter then keeps the guesses that found it and takes no more.
 * It is found when all four words are, and ended when the guesses run out
 * first. Everything else is a Futago's: the givens are the four words joined
 * by "+" (`hiddenWordsOf`), the answer every guess run together, the score
 * each quarter's word score added (`futagoScore.ts`), and a kept run is told
 * from one or two words by its seed (`yotsugoSeed.ts`).
 *
 * THE BOARD. A Yotsugo is two boards, one over the other, each split down the
 * middle into two quarters by the play area's heavy border — the first and
 * second words on the upper board, the third and fourth on the lower — the
 * same `GomojiGrid` every Gomoji is drawn on (`WordBoards`). Each board is
 * exactly two words wide and eleven rows tall (`gomojiBoard`), so a square is
 * about 31 pixels at five letters on a 390-pixel phone, nine tenths of one
 * word's.
 *
 * THE GUESSES. Three more than one word's at every level and length, as a
 * Futago gives one more for its second word: nine at hard, ten at medium and
 * eleven at easy (`layout.ts`).
 */
export const YOTSUGO_DISPLAY = { label: "Yotsugo", kanji: "四つ子", words: "Four words" } as const;

/** How many words, and quarters, a Yotsugo has. */
export const YOTSUGO_BOARDS = 4;

/** How many more guesses than one word's a Yotsugo gives at every level: one for each word past the first. */
export const YOTSUGO_MORE_GUESSES = YOTSUGO_BOARDS - 1;

/** A Yotsugo in its Gomoji's rules, beside the Futago's (`puzzleRulesPage.ts`). */
export function yotsugoRule(grid: WordGrid): string {
  return grid === "gomojiKana"
    ? "Yotsugo 四つ子 (quadruplets), a choice at any level, hides four kana words at once, in the four quarters of two boards, the free grey word grey against all four: every guess goes to every quarter until its word is found, each kana key is split in four corners to show each quarter's colour, and there are three guesses more than for one word."
    : "Yotsugo 四つ子 (quadruplets), a choice at any level, hides four words at once, in the four quarters of two boards: every guess goes to every quarter until its word is found, each key is split in four corners to show each quarter's colour, and there are three guesses more than for one word — nine at hard at every length.";
}
