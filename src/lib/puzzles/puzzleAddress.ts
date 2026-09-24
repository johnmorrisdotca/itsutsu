import { PUZZLE_SPECS } from "./puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";
import { isSeed } from "./random";

/**
 * What a solve's address says: `/games/<slug>/play?size=9&level=medium&seed=…`.
 *
 * Identity in the path, the choice in the query, as every address here is
 * built. The seed is what makes the address a puzzle rather than a request
 * for one — the same seed is the same grid tomorrow, on another phone, or
 * in the other seat of a race — and it is left out only until the browser
 * has drawn one, which it then writes back into the address.
 */
export type PuzzleAsked = { size: number; level: PuzzleLevel; seed: number | null };

export const PUZZLE_PARAMS = { size: "size", level: "level", seed: "seed" } as const;

/** The size and level a query asks for, or the kind's defaults where it asks for nothing usable. */
export function puzzleAsked(kind: PuzzleKind, query: Record<string, string | string[] | undefined>): PuzzleAsked {
  const spec = PUZZLE_SPECS[kind];
  const one = (key: string): string | undefined => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const sizeAsked = Number(one(PUZZLE_PARAMS.size));
  const size = spec.sizes.includes(sizeAsked) ? sizeAsked : spec.defaultSize;
  const levelAsked = one(PUZZLE_PARAMS.level) as PuzzleLevel | undefined;
  const level = levelAsked !== undefined && spec.levels.includes(levelAsked) ? levelAsked : spec.defaultLevel;
  const seedAsked = Number(one(PUZZLE_PARAMS.seed));
  const seed = isSeed(seedAsked) ? seedAsked : null;
  return { size, level, seed };
}

/** The query for a solve, as `?size=…&level=…&seed=…`, the seed left off while there is none. */
export function puzzleQuery(asked: PuzzleAsked): string {
  const params = new URLSearchParams({ [PUZZLE_PARAMS.size]: String(asked.size), [PUZZLE_PARAMS.level]: asked.level });
  if (asked.seed !== null) params.set(PUZZLE_PARAMS.seed, String(asked.seed));
  return `?${params.toString()}`;
}
