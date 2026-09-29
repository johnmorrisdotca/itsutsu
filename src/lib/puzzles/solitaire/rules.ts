import { SEED_MOST } from "../random";
import type { PuzzleLevel } from "../puzzles.types";

import type { KlondikeRules } from "./solitaire.types";

/**
 * WHAT A SOLITAIRE'S SIZE, LEVEL AND SEED MEAN, with nothing that deals or
 * solves: the one part of the game a server reads (the solved route's check,
 * a puzzle's address), kept apart from the solver (`generate.ts`, `solve.ts`)
 * so a server function that checks a game never carries the search that made it.
 */

/** Easy, medium and hard: as many passes through the stock as you like, three, or one. */
export const SOLITAIRE_PASSES: Record<PuzzleLevel, number> = { easy: Infinity, medium: 3, hard: 1 };

/** The seeds of deals dealt as they fall, winnable or not: the top quarter of the range, clear of the daily words' block. */
export const ANY_DEAL_BLOCK = { from: 1_600_000_000, size: SEED_MOST - 1_600_000_000 + 1 } as const;

/** The rules a size and a level name: cards the stock turns, and passes through it. */
export function solitaireRules(size: number, level: PuzzleLevel): KlondikeRules {
  return { draw: size === 3 ? 3 : 1, passes: SOLITAIRE_PASSES[level] };
}

/** Whether a seed names a deal as it falls, rather than a winnable one (`generate.ts`). */
export function isAnyDeal(seed: number): boolean {
  return seed >= ANY_DEAL_BLOCK.from;
}
