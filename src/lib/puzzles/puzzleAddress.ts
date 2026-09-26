import { PUZZLE_SPECS, isCheckAllowance } from "./puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";
import { isSeed } from "./random";
import { hadHeadStart, offersHeadStart } from "./gomoji/headStart";
import { isBackwardsSeed } from "./gomoji/backwardsSeed";
import { isTsunagiLevel, tsunagiBand } from "./tsunagi/levels";

/**
 * What a solve's address says: `/games/<slug>/play?size=9&level=medium&seed=…`.
 *
 * Identity in the path, the choice in the query, as every address here is
 * built. The seed is what makes the address a puzzle rather than a request
 * for one — the same seed is the same grid tomorrow, on another phone, or
 * in the other seat of a race — and it is left out only until the browser
 * has drawn one, which it then writes back into the address.
 */
export type PuzzleAsked = {
  size: number;
  level: PuzzleLevel;
  seed: number | null;
  /** How many times Check may be pressed; null, and left out of the address, for no limit. */
  checks?: number | null;
  /** Whether Hint may be pressed; false, and left out of the address, by default. */
  hints?: boolean;
  /**
   * Gomoji's Strict: every letter found must be played again, a green one in
   * its place. A set-up choice at any level (John, 2026-09-25: "have an option
   * strict mode… right now there are no real options for the game"); false,
   * and left out of the address, by default.
   */
  strict?: boolean;
  /**
   * Gomoji's Head start: keys greyed before the first guess (`headStart.ts`).
   * Easy only; false, and left out of the address, by default and at any
   * other level, whatever the address asked.
   */
  headStart?: boolean;
  /**
   * A Gomoji's Sakasa 逆さ, played backwards (`gomoji/backwards.ts`). Asked
   * for by the address until a seed is drawn, and from then said by the seed
   * itself (`isBackwardsSeed`), whatever the address says; left out of the
   * address for a Gomoji played the ordinary way and any puzzle not a word.
   */
  backwards?: boolean;
};

export const PUZZLE_PARAMS = { size: "size", level: "level", seed: "seed", checks: "checks", hints: "hints", strict: "strict", headStart: "head-start", backwards: "sakasa" } as const;

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
  /* A fixed level's seed is its number, and its band follows from it, whatever the address said (`tsunagi/levels.ts`). */
  if (spec.fixedLevels === true) {
    const number = isTsunagiLevel(size, seedAsked) ? seedAsked : null;
    return { size, level: number === null ? spec.defaultLevel : tsunagiBand(size, number), seed: number, checks: null, hints: false, strict: false };
  }
  const seed = isSeed(seedAsked) ? seedAsked : null;
  const checksAsked = Number(one(PUZZLE_PARAMS.checks));
  const checks = one(PUZZLE_PARAMS.checks) !== undefined && isCheckAllowance(checksAsked) ? checksAsked : null;
  const hints = one(PUZZLE_PARAMS.hints) === "1";
  const strict = one(PUZZLE_PARAMS.strict) === "1";
  const backwards = spec.wordGrid !== undefined && (seed === null ? one(PUZZLE_PARAMS.backwards) === "1" : isBackwardsSeed(seed));
  // A Sakasa is all grey words already, so a head start would only take letters away.
  const headStart = one(PUZZLE_PARAMS.headStart) === "1" && offersHeadStart(kind, level) && !backwards;
  // Named only when it is on: every other puzzle's address reads back as it always has.
  return { size, level, seed, checks, hints, strict, headStart, ...(backwards ? { backwards } : {}) };
}

/** The query for a solve, as `?size=…&level=…&seed=…&checks=…`, the seed left off while there is none and the checks while there is no limit. */
export function puzzleQuery(asked: PuzzleAsked): string {
  const params = new URLSearchParams({ [PUZZLE_PARAMS.size]: String(asked.size), [PUZZLE_PARAMS.level]: asked.level });
  if (asked.seed !== null) params.set(PUZZLE_PARAMS.seed, String(asked.seed));
  if (asked.checks !== undefined && asked.checks !== null) params.set(PUZZLE_PARAMS.checks, String(asked.checks));
  if (asked.hints === true) params.set(PUZZLE_PARAMS.hints, "1");
  if (asked.strict === true) params.set(PUZZLE_PARAMS.strict, "1");
  if (asked.headStart === true && asked.level === "easy" && asked.backwards !== true) params.set(PUZZLE_PARAMS.headStart, "1");
  if (asked.backwards === true) params.set(PUZZLE_PARAMS.backwards, "1");
  return `?${params.toString()}`;
}

/** What a kept run was asked as, for Continue and Resume, its Head start read back from where it is kept (`hadHeadStart`). */
export function keptRunAsked(
  kind: PuzzleKind,
  run: { size: number; level: string; seed: number; checksAllowed: number | null; hintsAllowed: boolean; strict: boolean },
): PuzzleAsked {
  const headStart = hadHeadStart(kind, run.level, run.hintsAllowed);
  return {
    size: run.size,
    level: run.level as PuzzleLevel,
    seed: run.seed,
    checks: run.checksAllowed,
    hints: headStart ? false : run.hintsAllowed,
    strict: run.strict,
    headStart,
    ...(isBackwardsSeed(run.seed) ? { backwards: true } : {}),
  };
}
