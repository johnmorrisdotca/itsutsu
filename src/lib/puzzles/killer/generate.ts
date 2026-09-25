import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, type Random } from "../random";
import { boxedLayout, cagedLayout, neighbours } from "../numberPlace/layout";
import { countSolutionsWithin, fillLayout } from "../numberPlace/solve";
import { encodeCells } from "../puzzleCode";
import { encodeKiller, type Cage } from "./code";

/**
 * Making a Sum Cages puzzle, in the browser, from a seed: a filled Number Place
 * grid, cut into cages whose sums are printed, and no numbers printed at all
 * beyond the odd cage of one cell.
 *
 * THE CAGES ARE GROWN BY JOINING, NOT CUT. Every cell starts as a cage of its
 * own — a grid of printed numbers, which has one answer — and two neighbouring
 * cages are joined only while the puzzle still has exactly one answer, the
 * joined cage holds no number twice, and it is no bigger than the level allows.
 * It stops at the level's count of cages. That is Number Place's carving the
 * other way up: there a given is taken away while one answer remains; here two
 * sums become one. The answer is checked with a step budget, and a join whose
 * check runs past it is not made — "I stopped looking" is not "one answer".
 *
 * Deterministic in the seed, as a race needs.
 */

/** The biggest cage, and how many cages to stop at, by level and side. */
const SHAPE: Record<PuzzleLevel, { biggest: number; cages: Record<number, number> }> = {
  easy: { biggest: 3, cages: { 6: 17, 9: 38 } },
  medium: { biggest: 4, cages: { 6: 14, 9: 31 } },
  hard: { biggest: 5, cages: { 6: 12, 9: 27 } },
};

/** Steps the answer check may take for one join before the join is passed over. */
const CHECK_BUDGET = 4_000;

/** Joins tried, per cell, before the cages are taken as they stand. */
const JOINS_PER_CELL = 12;

/**
 * Joins refused in a row, per side, after which the cages are taken as they
 * stand. Near the level's count most joins would leave two answers, and each
 * refusal is a full search: a run of them is the grid saying it is done.
 */
const REFUSED_IN_A_ROW_PER_SIDE = 3;

export function generateSumCages(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  for (;;) {
    const solution = fillLayout(boxedLayout(size), random);
    if (solution === null) continue;
    const cages = joinCages(size, solution, level, random);
    // A cage of one cell is printed as its number too, as it would be in a newspaper's.
    const single = new Set(cages.flatMap((cage) => (cage.cells.length === 1 ? cage.cells : [])));
    const cells = solution.map((value, index) => (single.has(index) ? value : 0));
    return { kind: "sumCages", size, level, seed, givens: encodeKiller(cells, cages), solution: encodeCells(solution) };
  }
}

function joinCages(size: number, solution: readonly number[], level: PuzzleLevel, random: Random): Cage[] {
  const { biggest, cages: target } = SHAPE[level];
  const want = target[size] ?? Math.round(size * size * 0.4);
  let cages: Cage[] = solution.map((value, index) => ({ cells: [index], sum: value }));
  const blank = new Array<number>(size * size).fill(0);
  let refused = 0;
  for (let tried = 0; tried < JOINS_PER_CELL * size * size && cages.length > want && refused < REFUSED_IN_A_ROW_PER_SIDE * size; tried += 1) {
    const cageOf = new Array<number>(size * size);
    cages.forEach((cage, c) => cage.cells.forEach((index) => (cageOf[index] = c)));
    /*
     * The smallest cages first, most of the time: a cage of one cell is a
     * printed number, and a Sum Cages puzzle is the one with next to none of
     * those. The rest of the time any cage, so the shapes are not all grown
     * from the same few.
     */
    const smallest = Math.min(...cages.map((cage) => cage.cells.length));
    const pool = random() < 0.8 ? cages.flatMap((cage, c) => (cage.cells.length === smallest ? [c] : [])) : cages.map((_, c) => c);
    const a = pool[Math.floor(random() * pool.length)]!;
    const touching = [...new Set(cages[a]!.cells.flatMap((index) => neighbours(size, index)).map((index) => cageOf[index]!))].filter((c) => c !== a);
    if (touching.length === 0) continue;
    const b = touching[Math.floor(random() * touching.length)]!;
    const cells = [...cages[a]!.cells, ...cages[b]!.cells];
    if (cells.length > biggest) continue;
    const values = cells.map((index) => solution[index]!);
    if (new Set(values).size !== values.length) continue;
    const joined: Cage = { cells: cells.sort((x, y) => x - y), sum: values.reduce((total, value) => total + value, 0) };
    const next = cages.filter((_, c) => c !== a && c !== b).concat(joined);
    // A cage of one cell is a printed number: the check sees it as a given, as the solver would.
    const givens = blank.map((_, index) => (next[cageIndex(next, index)]!.cells.length === 1 ? solution[index]! : 0));
    if (countSolutionsWithin(givens, cagedLayout(size, next), 2, CHECK_BUDGET) === 1) {
      cages = next;
      refused = 0;
    } else refused += 1;
  }
  // In reading order of each cage's first cell, so the code and the sums read top to bottom.
  return cages.sort((x, y) => x.cells[0]! - y.cells[0]!);
}

function cageIndex(cages: readonly Cage[], index: number): number {
  return cages.findIndex((cage) => cage.cells.includes(index));
}
