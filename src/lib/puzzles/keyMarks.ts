import { markGuess, type LetterMark } from "./wordDrop/code";
import { kanaBase, markKanaGuess, type KanaMark } from "./wordDropKana/kanaMarks";

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
