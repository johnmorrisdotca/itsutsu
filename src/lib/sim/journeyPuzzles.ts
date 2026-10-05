import { price } from "@/lib/points/ladder";
import { PUZZLE_SPECS, levelsFor } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/**
 * WHAT A SIMULATED SOLVE EARNS: its price on the puzzle ladder
 * (`src/lib/points/ladder.ts`) at the puzzle's usual size, with no help taken.
 * The real figure also takes off for help, and for a word or a tile game for
 * how well it was played, which a projection of thousands of solves does not
 * play out; the price is what a clean solve pays, so this is the top of what
 * the real site would give.
 */
export function approxPuzzleIp(kind: PuzzleKind, level: PuzzleLevel): number {
  const size = PUZZLE_SPECS[kind].defaultSize;
  return price(kind, size, levelsFor(kind, size).includes(level) ? level : PUZZLE_SPECS[kind].defaultLevel);
}

/** Whether this puzzle kind can be "played out" without being solved (only the word puzzles can). */
export function isWordPuzzle(kind: PuzzleKind): boolean {
  return kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop" || kind === "koushi";
}

/** Chance a single attempt at this level is solved rather than played out or abandoned. Approximate, not measured. */
export function approxSolveChance(level: PuzzleLevel): number {
  return level === "easy" ? 0.95 : level === "medium" ? 0.85 : 0.7;
}
