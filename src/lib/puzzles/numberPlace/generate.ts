import { encodeCells } from "../puzzleCode";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled, type Random } from "../random";
import { boxedLayout, type Layout } from "./layout";
import { countSolutions, guessDepth, type Grid } from "./solve";

/**
 * Making a Number Place puzzle, in the browser, from a seed.
 *
 * Two steps. Fill a whole grid by backtracking with the values tried in a
 * seeded order, so the seed decides the grid. Then take cells away in a
 * seeded order, keeping each removal only while the puzzle still has
 * exactly one answer AND stays within the level: an easy puzzle must go on
 * yielding to singles, a medium one to a single guess, a hard one to
 * whatever it takes. The removal stops at the level's floor of givens, so a
 * hard 9×9 does not run every one of its 81 cells past the solver for the
 * sake of two more blanks.
 *
 * Everything here is deterministic in the seed, which a race needs: two
 * browsers, one seed, one grid. Change this file and every seed makes a
 * different puzzle — a race in flight is unaffected because it stores the
 * givens rather than the seed, and a solo solve is a new puzzle either way.
 */

/**
 * How deep a guess the level allows, and where its removal stops.
 *
 * The floor is a count of givens left, by side. Below it the solver's
 * answer rarely changes and the time does; above it a 9×9 hard puzzle
 * would be a medium one with a different label.
 */
const LEVELS: Record<PuzzleLevel, { depth: number; floor: Record<number, number> }> = {
  easy: { depth: 0, floor: { 4: 9, 6: 20, 9: 40 } },
  medium: { depth: 1, floor: { 4: 7, 6: 15, 9: 31 } },
  hard: { depth: Infinity, floor: { 4: 5, 6: 11, 9: 24 } },
};

/** A full grid: every cell a value, every row, column and box a permutation. */
/**
 * A whole grid, filled cell by cell in reading order with the values tried in
 * a seeded order. Classic Number Place has always been filled this way, and
 * keeps it: the same seed must go on making the same puzzle (see the note at
 * the top). The groups come from the layout, so the diagonals are honoured
 * the same way.
 */
function fillInOrder(layout: Layout, random: Random): Grid {
  const { size } = layout;
  const grid: Grid = new Array<number>(size * size).fill(0);
  const values = Array.from({ length: size }, (_, i) => i + 1);
  const taken = new Array<number>(layout.groups.length).fill(0);
  const fill = (index: number): boolean => {
    if (index === grid.length) return true;
    const groups = layout.groupsOf[index]!;
    let blocked = 0;
    for (const group of groups) blocked |= taken[group]!;
    for (const value of shuffled(values, random)) {
      const bit = 1 << value;
      if (blocked & bit) continue;
      grid[index] = value;
      for (const group of groups) taken[group]! |= bit;
      if (fill(index + 1)) return true;
      for (const group of groups) taken[group]! &= ~bit;
      grid[index] = 0;
    }
    return false;
  };
  fill(0);
  return grid;
}

/**
 * The givens: the solution with cells taken away in a seeded order, each
 * removal kept only while the puzzle still has one answer and stays within
 * the level, down to the level's floor. Shared by every puzzle on a layout.
 */
export function carve(solution: Grid, layout: Layout, level: PuzzleLevel, floor: number, random: Random): Grid {
  const { depth } = LEVELS[level];
  const givens = [...solution];
  let left = givens.length;
  for (const index of shuffled(givens.map((_, i) => i), random)) {
    if (left <= floor) break;
    const value = givens[index]!;
    givens[index] = 0;
    const stillOne = countSolutions(givens, layout, 2) === 1 && guessDepth(givens, layout) <= depth;
    if (stillOne) left -= 1;
    else givens[index] = value;
  }
  return givens;
}

export function generateNumberPlace(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  const layout = boxedLayout(size);
  const solution = fillInOrder(layout, random);
  const givens = carve(solution, layout, level, LEVELS[level].floor[size]!, random);
  return { kind: "numberPlace", size, level, seed, givens: encodeCells(givens), solution: encodeCells(solution) };
}

/**
 * Diagonal: Number Place with the two long diagonals as groups too. Filled
 * the classic way on the diagonal layout; the extra groups mean fewer givens
 * are needed for one answer, so its floors sit a little lower.
 */
export function generateDiagonal(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  const layout = boxedLayout(size, true);
  const solution = fillInOrder(layout, random);
  const givens = carve(solution, layout, level, DIAGONAL_FLOOR[level][size]!, random);
  return { kind: "diagonal", size, level, seed, givens: encodeCells(givens), solution: encodeCells(solution) };
}

/** Where a Diagonal's removal stops, by level and side: a few below the classic floors. */
const DIAGONAL_FLOOR: Record<PuzzleLevel, Record<number, number>> = {
  easy: { 6: 16, 9: 34 },
  medium: { 6: 12, 9: 27 },
  hard: { 6: 9, 9: 21 },
};
