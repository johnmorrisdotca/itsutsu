import { markGuess, type LetterMark } from "./gomoji/code";
import { kanaBase, markKanaGuess, type KanaMark } from "./gomojiKana/kanaMarks";

/**
 * WHAT EACH KEY OF A WORD PUZZLE SHOWS: the best mark its letter has had on
 * the board so far. The live screens colour their keyboards from it, and the
 * replay after a game colours its keyboard from the guesses up to the step
 * being looked at, so the two can never disagree.
 */
const LETTER_RANK: Record<LetterMark, number> = { hit: 3, near: 2, miss: 1 };

/** English: by letter, in its place over elsewhere over not in the word. */
export function letterKeyMarks(guesses: readonly string[], hidden: string): Map<string, LetterMark> {
  const best = new Map<string, LetterMark>();
  for (const guess of guesses) {
    const marks = markGuess(guess, hidden);
    [...guess].forEach((letter, at) => {
      const mark = marks[at]!;
      const was = best.get(letter);
      if (was === undefined || LETTER_RANK[mark] > LETTER_RANK[was]) best.set(letter, mark);
    });
  }
  return best;
}

/**
 * Kana: by base (ぱ counts for the は key), green over orange over yellow over
 * grey. John, 2026-09-25: "I think the yellow CHI should also be yellow in the
 * keyboard."
 */
const KANA_RANK: Record<KanaMark, number> = { hit: 4, near: 3, kin: 2, miss: 1 };

export function kanaKeyMarks(rows: readonly string[], word: string): Map<string, KanaMark> {
  const best = new Map<string, KanaMark>();
  for (const row of rows) {
    const marks = markKanaGuess([...row], [...word]);
    [...row].forEach((kana, at) => {
      const mark = marks[at]!.mark;
      const base = kanaBase(kana);
      const was = best.get(base);
      if (was === undefined || KANA_RANK[mark] > KANA_RANK[was]) best.set(base, mark);
    });
  }
  return best;
}

/**
 * How many times each letter is in the row being typed: its key is ringed at
 * one and carries a count at two or more. John, 2026-09-25: "add Count chips
 * on a letter when it is selected more than once." The row being typed only —
 * the guesses already sent are on the board, and the chip is about what is
 * being chosen now. A kana counts by its base, so ぱ and は are two of は.
 */
export function typedCounts(slots: readonly string[], keyOf: (letter: string) => string = (letter) => letter): Map<string, number> {
  const counts = new Map<string, number>();
  for (const slot of slots) {
    if (slot === "") continue;
    const key = keyOf(slot);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
