import { generateHiddenStones } from "./hiddenStones/generate";
import { generateNumberPlace } from "./numberPlace/generate";
import type { Puzzle, PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * A puzzle of any kind, from a seed: the one door the solve page, the
 * screenshot scene and the coverage gate go through. Each kind's generator
 * lives beside its solver; this is only the dispatch, so a kind that is
 * listed with no generator fails to compile rather than to run.
 */
export function generatePuzzle(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number): Puzzle {
  switch (kind) {
    case "numberPlace":
      return generateNumberPlace(size, level, seed);
    case "hiddenStones":
      return generateHiddenStones(size, level, seed);
    case "moreOrLess":
      throw new Error("More or Less is not made yet: see docs/plans/numbers/NUM-04");
  }
}
