import { encodeCells } from "../puzzleCode";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled, type Random } from "../random";
import { encodeMoreOrLess, type Mark } from "./code";
import { countSolutions, guessDepth, type Grid } from "./solve";

/**
 * Making a More or Less puzzle, in the browser, from a seed.
 *
 * A seeded Latin square first; then marks on a third of the edges, chosen
 * at random; then givens added one at a time until the solver counts one
 * answer within the level's depth; then every given and every mark tried
 * for removal, in a seeded order, keeping the removal only while the puzzle
 * stays unique and within its level. What is left is the puzzle: nothing in
 * it is there for decoration, which is what the rules page promises.
 *
 * Deterministic in the seed, like every generator here.
 */

const LEVELS: Record<PuzzleLevel, number> = { easy: 0, medium: 1, hard: Infinity };
const MARK_SHARE = 0.35;

function latinSquare(size: number, random: Random): Grid {
  const grid: Grid = new Array<number>(size * size).fill(0);
  const values = Array.from({ length: size }, (_, i) => i + 1);
  const rows = new Array<number>(size).fill(0);
  const cols = new Array<number>(size).fill(0);
  const fill = (index: number): boolean => {
    if (index === grid.length) return true;
    const row = Math.floor(index / size);
    const col = index % size;
    for (const value of shuffled(values, random)) {
      const bit = 1 << value;
      if ((rows[row] | cols[col]) & bit) continue;
      grid[index] = value;
      rows[row] |= bit;
      cols[col] |= bit;
      if (fill(index + 1)) return true;
      rows[row] &= ~bit;
      cols[col] &= ~bit;
      grid[index] = 0;
    }
    return false;
  };
  fill(0);
  return grid;
}

/** Every edge between two cells, as the mark the answer makes true on it. */
function everyMark(solution: Grid, size: number): Mark[] {
  const marks: Mark[] = [];
  for (let index = 0; index < solution.length; index += 1) {
    const col = index % size;
    for (const other of [col < size - 1 ? index + 1 : -1, index + size < solution.length ? index + size : -1]) {
      if (other === -1) continue;
      marks.push(solution[index] < solution[other] ? { less: index, more: other } : { less: other, more: index });
    }
  }
  return marks;
}

export function generateMoreOrLess(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  const solution = latinSquare(size, random);
  const allowed = LEVELS[level];
  // Unique, and within the level: a hard puzzle may be as deep as it likes, so its depth is never measured.
  const fits = (grid: Grid, marks: Mark[]): boolean =>
    countSolutions(grid, size, marks, 2) === 1 && (allowed === Infinity || guessDepth(grid, size, marks, allowed) <= allowed);

  let marks = shuffled(everyMark(solution, size), random).slice(0, Math.round(everyMark(solution, size).length * MARK_SHARE));
  const givens: Grid = new Array<number>(size * size).fill(0);
  // Givens until it is a puzzle of the level asked for.
  for (const index of shuffled(givens.map((_, i) => i), random)) {
    if (fits(givens, marks)) break;
    givens[index] = solution[index];
  }
  // Then nothing that is not needed: each given and each mark, in a seeded order.
  for (const index of shuffled(givens.map((_, i) => i), random)) {
    if (givens[index] === 0) continue;
    const value = givens[index];
    givens[index] = 0;
    if (!fits(givens, marks)) givens[index] = value;
  }
  for (const mark of shuffled(marks, random)) {
    const without = marks.filter((each) => each !== mark);
    if (fits(givens, without)) marks = without;
  }
  return { kind: "moreOrLess", size, level, seed, givens: encodeMoreOrLess(givens, marks, size), solution: encodeCells(solution) };
}
