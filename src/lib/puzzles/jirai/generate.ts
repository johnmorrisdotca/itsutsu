import { SEED_MOST } from "../random";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { jiraiMake } from "./board";
import { jiraiVariantOfSeed } from "./variants";

/** How many seeds on from the one asked for are tried when a seed has no puzzle. */
const SEEDS_TRIED = 40;

/**
 * A Jirai from a seed: a board Jirai has dealt and proved needs no guess, opened
 * at its middle. Jirai says a board cannot be proved by throwing, never by
 * returning a guessing one, so a seed with no puzzle names the next that has one
 * of the same way to play, as a winnable Solitaire's seed names the first deal
 * the solver wins (`pencil/generate.ts`); the page puts the address right.
 */
export function generateJirai(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const variant = jiraiVariantOfSeed(seed);
  let tried = seed;
  for (let attempt = 0; attempt < SEEDS_TRIED; attempt += 1) {
    try {
      const made = jiraiMake(size, level, tried);
      return { kind: "jirai", size, level, seed: tried, givens: made.givens, solution: made.solution };
    } catch (error) {
      // A size this way to play cannot be is a mistake, and says so at once; a seed Jirai cannot prove is not.
      if (error instanceof RangeError) throw error;
      const next = tried >= SEED_MOST ? 1 : tried + 1;
      if (jiraiVariantOfSeed(next).grid !== variant.grid || jiraiVariantOfSeed(next).shape !== variant.shape) break;
      tried = next;
    }
  }
  throw new Error(`No Jirai was made from seeds ${seed} to ${tried}.`);
}
