import { WORD_SCORE, type WordScore } from "../gomoji/wordScore";
import { kanaBase, markKanaGuess } from "./kanaMarks";

/**
 * WHAT A KANA WORD SCORES, won or lost, on English's scale (`wordScore`) so
 * the two boards read alike. A guess's weight is the rows still to come.
 *
 *  - PLACED: a place first played plain green, 10 × that guess's weight.
 *  - ELSEWHERE: a kana of the word never placed but found another way — orange,
 *    or green with an arrow — 4 × the weight of the guess that first showed it.
 *  - COLUMN: a place never found either way whose column a yellow once named,
 *    1 × that guess's weight: it says which column, not which kana.
 *  - FOUND and SPEED: as English — the word 250 and 25 a row left, and up to
 *    50 for a word found inside a minute.
 *
 * A lost word never had every place plain green in one guess, so at best all
 * but one went in on the first row and the last on the second — 290 at five
 * kana, 170 at three — while a word found on its last row is 300 and 280
 * (`kanaScore.test.ts`). Only a word with no kana and no column found scores 0.
 */
export const KANA_COLUMN = 1;

export type KanaScore = WordScore & { column: number };

export function kanaScore(word: string, guesses: readonly string[], rows: number, elapsedMs: number): KanaScore {
  const target = [...word];
  const played = guesses.map((guess) => [...guess]);
  const marks = played.map((guess) => markKanaGuess(guess, target));
  const weight = (row: number) => rows - row;
  const plainAt = (row: number, at: number) => {
    const mark = marks[row]![at]!;
    return mark.mark === "hit" && !mark.wrongSize && !mark.wrongMark;
  };

  const placedAt = target.map((_, at) => marks.findIndex((_, row) => plainAt(row, at)));
  const placed = placedAt.reduce((sum, row) => sum + (row === -1 ? 0 : WORD_SCORE.placed * weight(row)), 0);

  /* Found another way, counted per base as English counts a doubled letter: those placed are paid first. */
  let elsewhere = 0;
  const foundOtherwise = new Set<number>();
  for (const base of new Set(target.map(kanaBase))) {
    const places = target.flatMap((kana, at) => (kanaBase(kana) === base ? [at] : []));
    const unplaced = places.filter((at) => placedAt[at] === -1);
    const placedCount = places.length - unplaced.length;
    const shown = played.map((guess, row) => guess.filter((kana, at) => kanaBase(kana) === base && (marks[row]![at]!.mark === "hit" || marks[row]![at]!.mark === "near")).length);
    unplaced.forEach((place, index) => {
      const row = shown.findIndex((count) => count >= placedCount + index + 1);
      if (row !== -1) {
        elsewhere += WORD_SCORE.elsewhere * weight(row);
        foundOtherwise.add(place);
      }
    });
  }

  /* A column named by a yellow, for a place found no other way. */
  let column = 0;
  target.forEach((_, at) => {
    if (placedAt[at] !== -1 || foundOtherwise.has(at)) return;
    const row = marks.findIndex((row) => row[at]!.mark === "kin");
    if (row !== -1) column += KANA_COLUMN * weight(row);
  });

  const foundRow = guesses.indexOf(word);
  const found = foundRow === -1 ? 0 : WORD_SCORE.found + WORD_SCORE.rowLeft * (rows - 1 - foundRow);
  const late = Math.max(0, elapsedMs - WORD_SCORE.speedFreeMs);
  const speed = foundRow === -1 ? 0 : Math.max(0, WORD_SCORE.speedMost - Math.floor(late / WORD_SCORE.speedStepMs));
  return { placed, elsewhere, column, found, speed, total: placed + elsewhere + column + found + speed };
}
