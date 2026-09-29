// Relative, not `@/`: the browser specs import the address helpers, and Playwright resolves no alias.
import { puzzleFor } from "../gomoku/slugs";
import type { PuzzleKind } from "../puzzles/puzzles.types";
import { kindOfAddress } from "./gameSettings";

/**
 * The puzzle an address plays: the one its slug names, or the setting of it
 * its query names (`language=french` for a Gomoji in French, `gameSettings.ts`).
 * Null for an address that names no puzzle.
 */
export function puzzleForAddress(slug: string, query: Record<string, string | string[] | undefined>): PuzzleKind | null {
  const game = puzzleFor(slug);
  return game === null ? null : (kindOfAddress(game, query) as PuzzleKind);
}
