import { FUTAGO_DISPLAY, type WordGrid } from "./futago";

/**
 * YOTSUGO 四つ子, "quadruplets": a Gomoji with four hidden words at once. John's
 * ticket, 2026-09-26: "Gomoji with four words at once, on one board in four
 * quarters, nine guesses". Our version of Quordle, in every Gomoji language, at
 * every size and level the one-word game has.
 *
 * Futago's machinery with four boards in place of two (`futago.ts`), so it is
 * a mode of each Gomoji, kept, scored and listed under its Gomoji's kind:
 *
 *  - its SEED is from a block of its own (`yotsugoSeed.ts`);
 *  - its GIVENS are the four words joined by "+", as a Futago's two are
 *    ("CRANE+SLATE+PLUMB+HOIST"), the kana free grey word after them, grey
 *    against all four;
 *  - the four boards are the quarters of one square, two over two, and every
 *    key is split into the same four quarters, each showing its board's colour.
 *
 * Every guess goes to every board whose word is not yet found. Five letters
 * get nine guesses on hard, Quordle's count, which is a Gomoji's six and one
 * for each word after the first; medium and easy get one more (`layout.ts`).
 */
export const YOTSUGO_DISPLAY = { label: "Yotsugo", kanji: "四つ子", words: "Four words" } as const;

/** A Yotsugo in its Gomoji's rules, after the Futago's bullet (`puzzleRulesPage.ts`), kept out of the pictures' copy as Futago's is. */
export function yotsugoRule(grid: WordGrid): string {
  return grid === "gomojiKana"
    ? "Yotsugo 四つ子 (quadruplets), a choice at any level, hides four kana words at once, one in each quarter of the board, the free grey word grey against all four: every guess goes to every board whose word is not yet found, each kana key is split into four quarters to show each board's colour, and there are three guesses more than for one word. There are four words of the day at every length as well."
    : "Yotsugo 四つ子 (quadruplets), a choice at any level, hides four words at once, one in each quarter of the board: every guess goes to every board whose word is not yet found, each key is split into four quarters to show each board's colour, and there are three guesses more than for one word (nine for five letters). There are four words of the day at every length as well.";
}

/** The mode a number of hidden words names, for a label beside them: a Futago's two, a Yotsugo's four, and none for one word. */
export function wordModeDisplay(count: number): { label: string; kanji: string; words: string } | null {
  return count === 4 ? YOTSUGO_DISPLAY : count === 2 ? FUTAGO_DISPLAY : null;
}
