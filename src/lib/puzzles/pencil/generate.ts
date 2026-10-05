import { SEED_MOST } from "../random";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { pencilEngine } from "./engines";
import type { PencilKind } from "./pencil.types";

/** How many seeds on from the one asked for are tried when a seed has no puzzle: Kazu stops, rather than return a board it has not proved, and a seed in a hundred has none at Kakuro. */
const SEEDS_TRIED = 40;

/**
 * A pencil puzzle from a seed: Kazu's board and its one answer, as the site
 * keeps a puzzle.
 *
 * Kazu makes a puzzle only when it can prove its answer is the only one, and
 * says so by throwing when it cannot (seed 97 at Kakuro, one in a hundred). A
 * seed with no puzzle names the next that has one, as a winnable Solitaire's
 * seed names the first deal the solver wins (`solitaire/generate.ts`): the
 * puzzle carries the seed it was made from, `PuzzlePlay` puts the address right
 * to say it, and the same seed is the same puzzle in every browser for ever.
 */
export function generatePencil(kind: PencilKind, size: number, level: PuzzleLevel, seed: number): Puzzle {
  let tried = seed;
  for (let attempt = 0; attempt < SEEDS_TRIED; attempt += 1) {
    try {
      const made = pencilEngine(kind).make(size, level, tried);
      return { kind, size, level, seed: tried, givens: made.givens, solution: made.solution };
    } catch (error) {
      // A size the kind does not make is not a seed with no puzzle; it is a mistake, and says so at once.
      if (error instanceof RangeError && /no (Cross Sums|Hitori) at/.test(error.message)) throw error;
      tried = tried >= SEED_MOST ? 1 : tried + 1;
    }
  }
  throw new Error(`No ${kind} puzzle was made from seeds ${seed} to ${tried}.`);
}
