import { markGuess } from "./code";

/**
 * WHAT A GOMOJI WORD SCORES, won or lost. John, 2026-09-25: "lost words
 * would give you more than 0 for getting some GREEN and some yellow. like time
 * gives you some points, number of guesses, number of green, sooner the better
 * green, yellows, number of yellows, etc." and "0 points is only possible for
 * never hitting even one letter".
 *
 * Every letter of the word is worth something the first time it is found, and
 * more the sooner: a guess's WEIGHT is the rows that were still to come when
 * it was made, so the first row of six weighs 6 and the last weighs 1.
 *
 *  - PLACED: a letter in its place, 10 × the weight of the guess that first
 *    put it there.
 *  - ELSEWHERE: a letter of the word found but never placed, 4 × the weight of
 *    the guess that first showed it.
 *  - FOUND: the word itself, 10 for every place of every guess the board
 *    gives (`foundBonus`: 300 for five letters and six guesses, 450 for nine),
 *    and 25 for every guess left unused.
 *  - SPEED: a word found inside a minute, 50, one fewer for every six seconds
 *    after that, nothing after six minutes. The browser's clock, as every solo
 *    time here is; a lost word earns none, or giving up fast would pay.
 *
 * So a word with no letter ever found scores 0 and nothing else does, and any
 * word found is worth more than any word lost, however many guesses the level
 * gives (`layout.ts`). A lost word never had every letter in place in one
 * guess, so at best all but one went in on the first row and the last on the
 * second: 10 × (letters × guesses − 1). A word found on its last row has every
 * place (10 × letters) and the bonus (10 × letters × guesses), which is more
 * (`wordScore.test.ts` holds it at every size and level). Everything but the time is read from the
 * guesses, which the server has checked, so the server works it out itself.
 */
export const WORD_SCORE = {
  placed: 10,
  elsewhere: 4,
  rowLeft: 25,
  speedMost: 50,
  speedFreeMs: 60_000,
  speedStepMs: 6_000,
} as const;

export type WordScore = { placed: number; elsewhere: number; found: number; speed: number; total: number };

/** Finding the word: 10 for every place of every guess the board gives, so it grows with the board. */
export function foundBonus(size: number, rows: number): number {
  return WORD_SCORE.placed * size * rows;
}

/** `rows` is how many guesses the puzzle gives (`guessesFor`), which sets every weight. */
export function wordScore(hidden: string, guesses: readonly string[], rows: number, elapsedMs: number): WordScore {
  const size = hidden.length;
  const weight = (row: number) => rows - row;
  const marks = guesses.map((guess) => markGuess(guess, hidden));

  /* Each place, at the first guess that put its letter there. */
  const placedAt = [...hidden].map((_, at) => marks.findIndex((row) => row[at] === "hit"));
  const placed = placedAt.reduce((sum, row) => sum + (row === -1 ? 0 : WORD_SCORE.placed * weight(row)), 0);

  /*
   * Each letter found elsewhere and never placed. A letter twice in the word
   * is two letters: the second is found at the first guess that showed it
   * twice. Those already placed are counted first, so a letter is paid once.
   */
  let elsewhere = 0;
  for (const letter of new Set(hidden)) {
    const inWord = [...hidden].filter((each) => each === letter).length;
    const placedCount = [...hidden].filter((each, at) => each === letter && placedAt[at] !== -1).length;
    const shown = marks.map((row, index) => [...guesses[index]!].filter((each, at) => each === letter && row[at] !== "miss").length);
    for (let nth = placedCount + 1; nth <= inWord; nth += 1) {
      const row = shown.findIndex((count) => count >= nth);
      if (row !== -1) elsewhere += WORD_SCORE.elsewhere * weight(row);
    }
  }

  const foundRow = guesses.indexOf(hidden);
  const found = foundRow === -1 ? 0 : foundBonus(size, rows) + WORD_SCORE.rowLeft * (rows - 1 - foundRow);
  const late = Math.max(0, elapsedMs - WORD_SCORE.speedFreeMs);
  const speed = foundRow === -1 ? 0 : Math.max(0, WORD_SCORE.speedMost - Math.floor(late / WORD_SCORE.speedStepMs));
  return { placed, elsewhere, found, speed, total: placed + elsewhere + found + speed };
}
