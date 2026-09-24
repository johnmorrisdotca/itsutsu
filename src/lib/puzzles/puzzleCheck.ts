import { decodeRegions, decodeStones } from "./hiddenStones/code";
import { boxOf } from "./numberPlace/boxes";
import { decodeCells } from "./puzzleCode";
import { PUZZLE_SPECS } from "./puzzles.constants";
import type { PuzzleCheck, PuzzleKind } from "./puzzles.types";

/**
 * Whether an answer solves a puzzle: the one check the server also runs.
 *
 * O(cells), no search, nothing remembered between calls. A browser runs it
 * to say "done"; `POST /api/puzzles/solved` runs it before paying, so a
 * member is paid for a grid that is right and not for a grid that was
 * posted. It refuses rather than repairs: a grid of the wrong size, a
 * value out of range or a given moved is a "no" with its reason, never a
 * best guess at what was meant.
 *
 * The rules of each kind are restated here rather than shared with its
 * solver on purpose — the solver is what MADE the puzzle, and a check that
 * reads the solver's mind proves only that the solver agrees with itself.
 */
export function checkSolution(kind: PuzzleKind, size: number, givens: string, answer: string): PuzzleCheck {
  if (!PUZZLE_SPECS[kind].sizes.includes(size)) return { ok: false, reason: `no ${kind} at ${size}` };
  switch (kind) {
    case "numberPlace":
      return checkNumberPlace(size, givens, answer);
    case "hiddenStones":
      return checkHiddenStones(size, givens, answer);
    default:
      return { ok: false, reason: `no check for ${kind}` };
  }
}

/** Every unit a permutation of 1..size, and every given where it was. */
function checkNumberPlace(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeCells(givens, size);
  const filled = decodeCells(answer, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid" };
  if (filled === null) return { ok: false, reason: "the answer is not a grid" };
  if (filled.some((value) => value === 0)) return { ok: false, reason: "the answer has empty cells" };
  for (let index = 0; index < asked.length; index += 1) {
    if (asked[index] !== 0 && asked[index] !== filled[index]) return { ok: false, reason: "a given was changed" };
  }
  const rows = Array.from({ length: size }, () => 0);
  const cols = Array.from({ length: size }, () => 0);
  const boxes = Array.from({ length: size }, () => 0);
  for (let index = 0; index < filled.length; index += 1) {
    const bit = 1 << filled[index];
    const row = Math.floor(index / size);
    const col = index % size;
    const box = boxOf(size, index);
    if (rows[row] & bit) return { ok: false, reason: `row ${row + 1} repeats a number` };
    if (cols[col] & bit) return { ok: false, reason: `column ${col + 1} repeats a number` };
    if (boxes[box] & bit) return { ok: false, reason: `box ${box + 1} repeats a number` };
    rows[row] |= bit;
    cols[col] |= bit;
    boxes[box] |= bit;
  }
  return { ok: true };
}

/** One stone per row (the answer's shape), every column and region once, and no two stones touching. */
function checkHiddenStones(size: number, givens: string, answer: string): PuzzleCheck {
  const regions = decodeRegions(givens, size);
  const stones = decodeStones(answer, size);
  if (regions === null) return { ok: false, reason: "the regions are not a grid" };
  if (stones === null) return { ok: false, reason: "the answer is not a stone in every row" };
  const columns = new Set<number>();
  const used = new Set<number>();
  for (let row = 0; row < size; row += 1) {
    const col = stones[row];
    if (columns.has(col)) return { ok: false, reason: `column ${col + 1} has two stones` };
    columns.add(col);
    const region = regions[row * size + col];
    if (used.has(region)) return { ok: false, reason: "a region has two stones" };
    used.add(region);
    if (row > 0 && Math.abs(col - stones[row - 1]) < 2) return { ok: false, reason: `the stones in rows ${row} and ${row + 1} touch` };
  }
  return { ok: true };
}
