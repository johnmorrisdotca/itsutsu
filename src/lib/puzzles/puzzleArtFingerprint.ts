import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fingerprintOf } from "../gomoku/ladderFingerprint.ts";

/**
 * The files that decide how a puzzle's picture looks: the grid, its look,
 * and the scene the picture is taken of. The same idea as
 * `boardArtFingerprint.ts` for the boards, kept apart so that a change to a
 * puzzle's grid asks for the puzzles' pictures to be re-taken and not the
 * forty-five boards', and the other way about.
 */
export const PUZZLE_ART_FILES: readonly string[] = [
  "src/components/puzzles/PuzzleGrid.tsx",
  "src/components/puzzles/HiddenStonesGrid.tsx",
  "src/components/puzzles/puzzles.constants.ts",
  "src/lib/puzzles/numberPlace/generate.ts",
  "src/lib/puzzles/hiddenStones/generate.ts",
  "e2e/puzzle-screenshots.spec.ts",
];

export function readPuzzleArtFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(PUZZLE_ART_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })));
  } catch {
    return null;
  }
}
