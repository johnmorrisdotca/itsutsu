import type { PuzzleKind } from "../../puzzles/puzzles.types";

import { PUZZLE_COPY_JA_DRAWN } from "./puzzles.ja.drawn.constants";
import { PUZZLE_COPY_JA_MAZES } from "./puzzles.ja.mazes.constants";
import { PUZZLE_COPY_JA_NUMBERS } from "./puzzles.ja.numbers.constants";
import { PUZZLE_COPY_JA_PENCIL } from "./puzzles.ja.pencil.constants";
import type { PuzzleCopyJa } from "./puzzles.ja.types";
import { PUZZLE_COPY_JA_WORDS } from "./puzzles.ja.words.constants";

/**
 * Every puzzle's words in Japanese, joined from the files by family. Typed
 * `Record<PuzzleKind, …>`, so a puzzle with no Japanese does not compile; the
 * rest of what a puzzle must have (a line for each rule bullet, a back-translation
 * for each line, a reader's stamp) is held by `puzzles.coverage.test.ts`.
 */
export const PUZZLE_COPY_JA: Record<PuzzleKind, PuzzleCopyJa> = {
  ...PUZZLE_COPY_JA_NUMBERS,
  ...PUZZLE_COPY_JA_WORDS,
  ...PUZZLE_COPY_JA_DRAWN,
  ...PUZZLE_COPY_JA_MAZES,
  ...PUZZLE_COPY_JA_PENCIL,
};
