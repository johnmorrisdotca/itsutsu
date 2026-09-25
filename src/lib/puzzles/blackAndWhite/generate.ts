import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled } from "../random";
import { EMPTY, encodeBlackAndWhite } from "./code";
import { countSolutions, guessDepth, someSolution, type Grid } from "./solve";

/**
 * Making a Black and White puzzle, in the browser, from a seed.
 *
 * A full grid first, found by the solver with the colour at each guess drawn
 * from the seed; then every stone of it tried for removal, in a seeded order,
 * kept out only while the puzzle stays unique and within its level. What is
 * left printed is all needed.
 *
 * Deterministic in the seed, like every generator here.
 */

const LEVELS: Record<PuzzleLevel, number> = { easy: 0, medium: 1, hard: Infinity };

export function generateBlackAndWhite(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  const solution = someSolution(new Array<number>(size * size).fill(EMPTY), size, random);
  if (solution === null) throw new Error(`No ${size}×${size} Black and White grid exists.`);
  const allowed = LEVELS[level];
  const fits = (grid: Grid): boolean => countSolutions(grid, size, 2) === 1 && (allowed === Infinity || guessDepth(grid, size, allowed) <= allowed);

  const givens: Grid = [...solution];
  for (const index of shuffled(givens.map((_, i) => i), random)) {
    const stone = givens[index]!;
    givens[index] = EMPTY;
    if (!fits(givens)) givens[index] = stone;
  }
  return { kind: "blackAndWhite", size, level, seed, givens: encodeBlackAndWhite(givens), solution: encodeBlackAndWhite(solution) };
}
