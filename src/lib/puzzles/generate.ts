import { generateHiddenStones } from "./hiddenStones/generate";
import { generateMoreOrLess } from "./moreOrLess/generate";
import { generateJigsaw } from "./jigsaw/generate";
import { generateDiagonal, generateNumberPlace } from "./numberPlace/generate";
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
      return generateMoreOrLess(size, level, seed);
    case "jigsaw":
      return generateJigsaw(size, level, seed);
    case "diagonal":
      return generateDiagonal(size, level, seed);
  }
}
