import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { gomojiLayout } from "./layout";

/** The rows a Sakasa must survive: the ordinary count of the level the other way round, with no free word. */
export function backwardsGuesses(kind: PuzzleKind, size: number, level: PuzzleLevel): number {
  const grid = kind === "gomojiKana" ? "gomojiKana" : "gomoji";
  const mirrored: PuzzleLevel = level === "easy" ? "hard" : level === "hard" ? "easy" : "medium";
  return gomojiLayout(grid, size, mirrored, 0).guesses;
}
