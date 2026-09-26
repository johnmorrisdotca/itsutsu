import { decodeGuesses, decodeHidden, type GomojiLanguage } from "./gomoji/code";
import { wordScore } from "./gomoji/wordScore";
import { decodeKanaGivens, decodeKanaGuesses } from "./gomojiKana/kanaCode";
import { baseGuesses, guessesFor } from "./gomoji/layout";
import { kanaScore } from "./gomojiKana/kanaScore";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * WHAT A SOLVE SCORES ON A PUZZLE'S LEADERBOARD, as PuzzleMadness scores its
 * own (their `getScore`, read 2026-09-24): five points for every cell the
 * solver filled in, less fifty for every time they asked for help — here a
 * Check or a Hint — and never below nought. Printed cells score nothing, so a
 * harder puzzle is worth more simply because less of it is printed, and the
 * clock never costs anything; the fastest times are their own board.
 *
 * John, 2026-09-24, on PuzzleMadness: "I want leaderboards, which we have...
 * but these are so prominent and easy to read… Find out how they score these."
 * See docs/plans/numbers/NUM-11-puzzle-leaderboards.md.
 *
 * Worked out once, when a solve is kept (`keepSolve`), and stored with it, so a
 * board is one grouped query rather than a sum recomputed on every view.
 */
export const POINTS_A_CELL = 5;
export const POINTS_A_HELP = 50;

/** The cells a solver filled: every cell of a Hidden Stones grid, the letters of a Gomoji word, the unprinted ones of every other. */
export function cellsFilled(kind: PuzzleKind, size: number, givens: string): number {
  const area = size * size;
  if (kind === "hiddenStones") return area;
  if (kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort") return size;
  return [...givens.slice(0, area)].filter((cell) => cell === ".").length;
}

/**
 * A word puzzle has no cells to fill: it scores every letter it found, sooner
 * for more, the word itself, the rows it did not need and the time it took
 * (`wordScore`), and a word lost scores what it found. Read from the guesses,
 * run together as they are handed in.
 */
export function wordPoints(size: number, givens: string, answer: string, elapsedMs: number, level?: PuzzleLevel, lang: GomojiLanguage = "en"): number {
  const hidden = decodeHidden(givens, size, lang);
  const guesses = decodeGuesses(answer, size, lang);
  // Weighed by the guesses the level gave (`layout.ts`); with no level, the published count. Mot and Wort are laid out as English is.
  const rows = level === undefined ? baseGuesses("gomoji", size) : guessesFor("gomoji", size, level, 0);
  return hidden === null || guesses === null ? 0 : wordScore(hidden, guesses, rows, elapsedMs).total;
}

/** A kana word, scored as English's is on the same scale (`kanaScore`). */
export function kanaPoints(size: number, givens: string, answer: string, elapsedMs: number, level?: PuzzleLevel): number {
  const puzzle = decodeKanaGivens(givens, size);
  const guesses = decodeKanaGuesses(answer, size);
  if (puzzle === null || guesses === null) return 0;
  const rows = level === undefined ? baseGuesses("gomojiKana", size) : guessesFor("gomojiKana", size, level, puzzle.grey === null ? 0 : 1);
  return kanaScore(puzzle.word, guesses, rows, elapsedMs).total;
}

export function pointsFor(
  kind: PuzzleKind,
  size: number,
  givens: string,
  checksUsed: number,
  hintsUsed: number,
  answer = "",
  elapsedMs = 0,
  level?: PuzzleLevel,
): number {
  /* A word's one help is its Head start, kept as a hint (`headStart.ts`) and priced as one: a free guess's worth off, never below nought. */
  const helped = (points: number) => Math.max(0, points - POINTS_A_HELP * hintsUsed);
  if (kind === "gomoji") return helped(wordPoints(size, givens, answer, elapsedMs, level));
  if (kind === "gomojiMot") return helped(wordPoints(size, givens, answer, elapsedMs, level, "fr"));
  if (kind === "gomojiWort") return helped(wordPoints(size, givens, answer, elapsedMs, level, "de"));
  if (kind === "gomojiKana") return helped(kanaPoints(size, givens, answer, elapsedMs, level));
  return Math.max(0, POINTS_A_CELL * cellsFilled(kind, size, givens) - POINTS_A_HELP * (checksUsed + hintsUsed));
}
