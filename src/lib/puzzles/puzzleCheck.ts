import { decodeRegions, decodeStones } from "./hiddenStones/code";
import { decodeMoreOrLess } from "./moreOrLess/code";
import { decodeJigsaw } from "./jigsaw/code";
import { decodeKiller } from "./killer/code";
import { decodeTowers, lineFrom, TOWER_SIDES } from "./towers/code";
import { BLACK, decodeBlackAndWhite, EMPTY } from "./blackAndWhite/code";
import { boxedLayout, regionLayout, regionsAreSound, type Layout } from "./numberPlace/layout";
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
    case "moreOrLess":
      return checkMoreOrLess(size, givens, answer);
    case "jigsaw":
      return checkJigsaw(size, givens, answer);
    case "diagonal":
      return checkDiagonal(size, givens, answer);
    case "sumCages":
      return checkSumCages(size, givens, answer);
    case "towers":
      return checkTowers(size, givens, answer);
    case "blackAndWhite":
      return checkBlackAndWhite(size, givens, answer);
    default:
      return { ok: false, reason: `no check for ${kind}` };
  }
}

/** Every unit a permutation of 1..size, and every given where it was. */
function checkNumberPlace(size: number, givens: string, answer: string): PuzzleCheck {
  return checkOnLayout(boxedLayout(size), decodeCells(givens, size), answer);
}

function checkDiagonal(size: number, givens: string, answer: string): PuzzleCheck {
  return checkOnLayout(boxedLayout(size, true), decodeCells(givens, size), answer);
}

/**
 * A Jigsaw is checked against the regions it was handed, in its givens. They
 * must be sound — `size` joined regions of `size` cells — or the grid is
 * refused before it is read: regions of one cell each would make any grid
 * whose rows and columns are right look like an answer.
 */
function checkJigsaw(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeJigsaw(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid with regions" };
  if (!regionsAreSound(size, asked.regions)) return { ok: false, reason: "the regions do not divide the grid" };
  return checkOnLayout(regionLayout(size, asked.regions), asked.cells, answer);
}

/**
 * Sum Cages: a Number Place grid, and every cage it was handed holds no
 * number twice and adds to its sum. The cages come from the givens, as a
 * Jigsaw's regions do; each cell is in exactly one, which the code's shape
 * already guarantees.
 */
function checkSumCages(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeKiller(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid with cages" };
  const plain = checkOnLayout(boxedLayout(size), asked.cells, answer);
  if (!plain.ok) return plain;
  const filled = decodeCells(answer, size)!;
  for (const [at, cage] of asked.cages.entries()) {
    const values = cage.cells.map((index) => filled[index]!);
    if (new Set(values).size !== values.length) return { ok: false, reason: `cage ${at + 1} repeats a number` };
    if (values.reduce((total, value) => total + value, 0) !== cage.sum) return { ok: false, reason: `cage ${at + 1} does not add to ${cage.sum}` };
  }
  return { ok: true };
}

/** Every group of the layout holds every number once, and no given was changed. One pass over the cells. */
function checkOnLayout(layout: Layout, asked: number[] | null, answer: string): PuzzleCheck {
  const { size } = layout;
  const filled = decodeCells(answer, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid" };
  if (filled === null) return { ok: false, reason: "the answer is not a grid" };
  if (filled.some((value) => value === 0)) return { ok: false, reason: "the answer has empty cells" };
  for (let index = 0; index < asked.length; index += 1) {
    if (asked[index] !== 0 && asked[index] !== filled[index]) return { ok: false, reason: "a given was changed" };
  }
  const seen = new Array<number>(layout.groups.length).fill(0);
  for (let index = 0; index < filled.length; index += 1) {
    const bit = 1 << filled[index]!;
    for (const group of layout.groupsOf[index]!) {
      if (seen[group]! & bit) return { ok: false, reason: `${groupName(layout, group)} repeats a number` };
      seen[group]! |= bit;
    }
  }
  return { ok: true };
}

/** "row 3", "column 5", "box 2", "region 4", "a diagonal": the groups in `build`'s order. */
function groupName(layout: Layout, group: number): string {
  const { size } = layout;
  if (group < size) return `row ${group + 1}`;
  if (group < 2 * size) return `column ${group - size + 1}`;
  if (group < 3 * size) return `${layout.regionWord} ${group - 2 * size + 1}`;
  return "a diagonal";
}

function checkMoreOrLess(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeMoreOrLess(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid with marks" };
  const square = checkLatinSquare(size, asked.cells, answer);
  if (!square.ok) return square;
  const filled = decodeCells(answer, size)!;
  for (const mark of asked.marks) {
    if (!(filled[mark.less] < filled[mark.more])) return { ok: false, reason: "a mark is not true" };
  }
  return { ok: true };
}

/** Every row and column a permutation of 1..size, nothing empty, and every given where it was: More or Less and Towers alike. */
function checkLatinSquare(size: number, asked: readonly number[], answer: string): PuzzleCheck {
  const filled = decodeCells(answer, size);
  if (filled === null) return { ok: false, reason: "the answer is not a grid" };
  if (filled.some((value) => value === 0)) return { ok: false, reason: "the answer has empty cells" };
  for (let index = 0; index < asked.length; index += 1) {
    if (asked[index] !== 0 && asked[index] !== filled[index]) return { ok: false, reason: "a given was changed" };
  }
  const rows = Array.from({ length: size }, () => 0);
  const cols = Array.from({ length: size }, () => 0);
  for (let index = 0; index < filled.length; index += 1) {
    const bit = 1 << filled[index];
    const row = Math.floor(index / size);
    const col = index % size;
    if (rows[row] & bit) return { ok: false, reason: `row ${row + 1} repeats a number` };
    if (cols[col] & bit) return { ok: false, reason: `column ${col + 1} repeats a number` };
    rows[row] |= bit;
    cols[col] |= bit;
  }
  return { ok: true };
}

/**
 * Towers: a Latin square that keeps its givens, and from every clue exactly
 * that many towers show. The counting is written out here rather than taken
 * from the code's `towersSeen`, which the solver that made the puzzle uses;
 * only where each clue looks from is shared, because that is the spelling.
 */
function checkTowers(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeTowers(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a square with clues" };
  const square = checkLatinSquare(size, asked.cells, answer);
  if (!square.ok) return square;
  const filled = decodeCells(answer, size)!;
  for (const side of TOWER_SIDES) {
    for (let at = 0; at < size; at += 1) {
      const clue = asked.clues[side][at]!;
      if (clue === 0) continue;
      let tallest = 0;
      let seen = 0;
      for (const index of lineFrom(side, at, size)) {
        if (filled[index]! > tallest) {
          tallest = filled[index]!;
          seen += 1;
        }
      }
      if (seen !== clue) return { ok: false, reason: `the ${side} clue ${clue} sees ${seen}` };
    }
  }
  return { ok: true };
}

/**
 * Black and White: every cell a stone, every printed stone where it was
 * printed, every row and column half black, never three alike side by side,
 * and no two rows or two columns the same. Written out here, not taken from
 * the solver that made the puzzle.
 */
function checkBlackAndWhite(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeBlackAndWhite(givens, size);
  const filled = decodeBlackAndWhite(answer, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid of stones" };
  if (filled === null) return { ok: false, reason: "the answer is not a grid of stones" };
  if (filled.some((cell) => cell === EMPTY)) return { ok: false, reason: "the answer has empty cells" };
  if (asked.some((given, index) => given !== EMPTY && given !== filled[index])) return { ok: false, reason: "a printed stone was changed" };
  for (const direction of ["row", "column"] as const) {
    const seen = new Set<string>();
    for (let at = 0; at < size; at += 1) {
      const line = Array.from({ length: size }, (_, k) => filled[direction === "row" ? at * size + k : k * size + at]!);
      if (line.filter((cell) => cell === BLACK).length * 2 !== size) return { ok: false, reason: `${direction} ${at + 1} is not half black` };
      for (let k = 2; k < size; k += 1) {
        if (line[k] === line[k - 1] && line[k] === line[k - 2]) return { ok: false, reason: `${direction} ${at + 1} has three alike` };
      }
      const spelled = line.join("");
      if (seen.has(spelled)) return { ok: false, reason: `${direction} ${at + 1} repeats another` };
      seen.add(spelled);
    }
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
