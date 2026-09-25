import { latinSquare } from "../moreOrLess/generate";
import { encodeCells } from "../puzzleCode";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled } from "../random";
import { cluesOf, encodeTowers, TOWER_SIDES, type TowerClues, type TowerSide } from "./code";
import { countSolutions, guessDepth, type Grid } from "./solve";

/**
 * Making a Towers puzzle, in the browser, from a seed.
 *
 * A seeded Latin square first, and every clue it makes true around its edge.
 * Givens are added only if the clues alone are not yet a puzzle of the level
 * asked for, which with all of them showing is rare. Then, in a seeded order,
 * every given and after them every clue is tried for removal, kept out only
 * while the puzzle stays unique and within its level. Givens go first so that
 * what is left leans on the clues, which are the puzzle; what remains is all
 * needed, as the rules page promises.
 *
 * Deterministic in the seed, like every generator here.
 */

const LEVELS: Record<PuzzleLevel, number> = { easy: 0, medium: 1, hard: Infinity };

export function generateTowers(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  const solution = latinSquare(size, random);
  const allowed = LEVELS[level];
  // Unique, and within the level: a hard puzzle may be as deep as it likes, so its depth is never measured.
  const fits = (grid: Grid, clues: TowerClues): boolean =>
    countSolutions(grid, size, clues, 2) === 1 && (allowed === Infinity || guessDepth(grid, size, clues, allowed) <= allowed);

  const clues = cluesOf(solution, size);
  const givens: Grid = new Array<number>(size * size).fill(0);
  for (const index of shuffled(givens.map((_, i) => i), random)) {
    if (fits(givens, clues)) break;
    givens[index] = solution[index]!;
  }
  for (const index of shuffled(givens.map((_, i) => i), random)) {
    if (givens[index] === 0) continue;
    const value = givens[index]!;
    givens[index] = 0;
    if (!fits(givens, clues)) givens[index] = value;
  }
  const places: { side: TowerSide; at: number }[] = TOWER_SIDES.flatMap((side) => Array.from({ length: size }, (_, at) => ({ side, at })));
  for (const { side, at } of shuffled(places, random)) {
    const clue = clues[side][at]!;
    clues[side][at] = 0;
    if (!fits(givens, clues)) clues[side][at] = clue;
  }
  return { kind: "towers", size, level, seed, givens: encodeTowers(givens, clues), solution: encodeCells(solution) };
}
