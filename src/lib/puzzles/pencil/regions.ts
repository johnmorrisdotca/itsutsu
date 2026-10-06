import { checkRegions, generateRegions, isRegionsBoard, solveRegions, type RegionsBoard } from "@johnmorrisdotca/kazu/regions";

import type { PuzzleCheck } from "../puzzles.types";
import { BLANK, charFix, charMissing, charWrong, symbolFor, valueOf } from "./codes";
import type { PencilEngine } from "./pencil.types";

/**
 * REGIONS, number the regions by their size: Kazu's (`@johnmorrisdotca/kazu/regions`).
 *
 * The givens, and the code a reader writes, are a character a cell: `.` for
 * an empty cell, else the number in it, one character (1 to 9 and then
 * letters, as Kazu's Sudoku writes its Giant). A code starts as the givens,
 * which a reader cannot change, and ends as the whole grid.
 */

/** The board the givens are, or null for givens that are not one. */
export function regionsBoardOf(size: number, givens: string): RegionsBoard | null {
  const entries = regionsEntriesOf(size, givens);
  if (entries === null) return null;
  const board = { width: size, height: size, givens: entries };
  return isRegionsBoard(board) ? board : null;
}

/** The numbers a code writes (0 for an empty cell), or null for a code that is not a grid of them. */
export function regionsEntriesOf(size: number, code: string): number[] | null {
  if (code.length !== size * size) return null;
  const entries: number[] = [];
  for (const character of code) {
    const value = character === BLANK ? 0 : valueOf(character);
    if (value === null || value > size * size) return null;
    entries.push(value);
  }
  return entries;
}

const codeOf = (entries: readonly number[]): string => entries.map((value) => (value === 0 ? BLANK : (symbolFor(value) ?? "?"))).join("");

export const regions: PencilEngine = {
  codeLength: (size) => size * size,
  make(size, level, seed) {
    const made = generateRegions(size, size, level, seed);
    return { givens: codeOf(made.givens), solution: codeOf(made.solution) };
  },
  reads: (size, givens) => regionsBoardOf(size, givens) !== null,
  blank: (_size, givens) => givens,
  fits: (size, code) => regionsEntriesOf(size, code) !== null,
  check(size, givens, answer): PuzzleCheck {
    const board = regionsBoardOf(size, givens);
    if (board === null) return { ok: false, reason: "the givens are not a Regions board" };
    const entries = regionsEntriesOf(size, answer);
    if (entries === null) return { ok: false, reason: "the answer is not a grid of numbers" };
    if (board.givens.some((given, at) => given !== 0 && given !== entries[at])) return { ok: false, reason: "a printed number was changed" };
    const verdict = checkRegions(board, entries);
    if (verdict.ok && verdict.complete) return { ok: true };
    return { ok: false, reason: verdict.complete ? "a region is not as big as its number, or two regions of one size touch" : "some cells are empty" };
  },
  solve(size, givens) {
    const board = regionsBoardOf(size, givens);
    if (board === null) return null;
    const found = solveRegions(board, undefined, { limit: 2 });
    return found.complete && found.count === 1 && found.solution !== null ? codeOf(found.solution) : null;
  },
  wrong: (_size, code, solution) => charWrong(code, solution),
  missing: (_size, code, solution) => charMissing(code, solution),
  fix: (_size, code, solution) => charFix(code, solution),
  work: (_size, givens) => [...givens].filter((character) => character === BLANK).length,
};
