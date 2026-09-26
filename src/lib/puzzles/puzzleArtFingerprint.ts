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
  "src/components/puzzles/PuzzleBoard.tsx",
  "src/components/puzzles/PuzzleGrid.tsx",
  "src/components/puzzles/HiddenStonesGrid.tsx",
  "src/components/puzzles/TowerRing.tsx",
  "src/components/puzzles/BlackAndWhiteGrid.tsx",
  "src/components/puzzles/GomojiGrid.tsx",
  "src/components/puzzles/TsunagiGrid.tsx",
  "src/components/puzzles/KumimojiTable.tsx",
  "src/components/puzzles/kumimoji.constants.ts",
  "src/components/puzzles/puzzles.constants.ts",
  "src/components/board/StoneMark.tsx",
  "src/lib/puzzles/numberPlace/generate.ts",
  "src/lib/puzzles/hiddenStones/generate.ts",
  "src/lib/puzzles/hiddenStones/regions.ts",
  "src/lib/puzzles/moreOrLess/generate.ts",
  "src/lib/puzzles/jigsaw/generate.ts",
  "src/lib/puzzles/killer/generate.ts",
  "src/lib/puzzles/killer/outline.ts",
  "src/lib/puzzles/towers/generate.ts",
  "src/lib/puzzles/blackAndWhite/generate.ts",
  "src/lib/puzzles/blackAndWhite/solve.ts",
  "src/lib/puzzles/kumimoji/generate.ts",
  "src/lib/puzzles/numberPlace/layout.ts",
  "src/lib/puzzles/numberPlace/solve.ts",
  "e2e/puzzle-screenshots.spec.ts",
];

export function readPuzzleArtFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(PUZZLE_ART_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })));
  } catch {
    return null;
  }
}
