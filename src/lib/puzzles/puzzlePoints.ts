import { rowsFor } from "./wordDrop/code";
import type { PuzzleKind } from "./puzzles.types";

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

/** The cells a solver filled: every cell of a Hidden Stones grid, the letters of a WordDrop word, the unprinted ones of every other. */
export function cellsFilled(kind: PuzzleKind, size: number, givens: string): number {
  const area = size * size;
  if (kind === "hiddenStones") return area;
  if (kind === "wordDrop") return size;
  return [...givens.slice(0, area)].filter((cell) => cell === ".").length;
}

/**
 * A word puzzle has no cells to fill: what it rewards is finding the word in
 * fewer guesses. Five points a letter for the row that found it and for every
 * row it did not need, so a five-letter word in one guess is 150, in six 25.
 */
export function wordPoints(size: number, answer: string): number {
  const used = Math.max(1, Math.ceil(answer.length / size));
  return POINTS_A_CELL * size * Math.max(1, rowsFor(size) - used + 1);
}

export function pointsFor(kind: PuzzleKind, size: number, givens: string, checksUsed: number, hintsUsed: number, answer = ""): number {
  if (kind === "wordDrop") return wordPoints(size, answer);
  return Math.max(0, POINTS_A_CELL * cellsFilled(kind, size, givens) - POINTS_A_HELP * (checksUsed + hintsUsed));
}
