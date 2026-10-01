import type { PuzzleKind } from "./puzzles.types";
import { suidoLevelOfSeed } from "./suido/seed";

/**
 * WHICH LEVEL A RUN IS OF, for a puzzle that has fixed levels beside, or in
 * place of, the boards it makes: Tsunagi's seed IS its level's number (every
 * Tsunagi is a level), and Suido's seed names a level only in the block kept
 * for them (`suido/seed.ts`), every other seed being a board made at random.
 * Null for a seed that names no level, and for every kind without any.
 * Read where a page says "Level 12" in place of a seed's number.
 */
export function fixedLevelOf(kind: PuzzleKind, seed: number): number | null {
  if (kind === "tsunagi") return Number.isInteger(seed) && seed >= 1 ? seed : null;
  if (kind === "suido") return suidoLevelOfSeed(seed);
  return null;
}

/** The words on the button to the next level: plain when it is the one after, and saying why when it is further back. */
export function nextLevelLabel(after: number, next: number): string {
  return next === after + 1 ? `Level ${next} →` : `Level ${next}, the first one you have not finished →`;
}
