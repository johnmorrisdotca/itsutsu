import { levelNameRow } from "./levelNames";
import { XP_LEVELS, xpForLevel } from "./xpCurve";

/**
 * THE HUNDRED RUNGS AS ONE LIST, SO THE PAGE THAT DRAWS THEM DOES NO ARITHMETIC.
 *
 * `/xp/levels` shows the whole ladder: what each rung is called, what it cost to
 * get there, and what it costs to leave. Two files hold those facts — the names
 * in `levelNames.constants.ts` and the costs in `xpCurve.ts` — and they are kept
 * apart on purpose, so joining them is a job somebody has to do. It is done here
 * rather than in the page, for the reason every list on this site has a module
 * behind it: a page is the wrong place to keep a rule, and a rule in a page
 * cannot be tested.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE STEP IS SUBTRACTED, NOT LOOKED UP
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XP_LEVEL_COST[level - 2]` is the cost of climbing from `level - 1`, and that
 * off-by-two is exactly the kind of index nobody gets right twice: the array is
 * "cost of reaching each level, level 1 first" while `xpForLevel(1)` is 0, so the
 * first entry is the price of level TWO. Subtracting two cumulative totals says
 * the same thing with no index in it at all, and it is right at both ends
 * without a special case — level 1 costs nothing because nobody climbed to it,
 * and level 100 is a step like any other.
 */

/** One rung: what it is called, what it cost, and what it cost to climb. */
export type LadderRung = {
  level: number;
  /** The catalogue's name, or the floor — see `xpLevelName`. */
  name: string;
  /** The Japanese name, or empty where there is none. Ready for `Paired`. */
  kanji: string;
  note: string;
  /** Total XP a member must hold to stand here. Zero at level 1. */
  toReach: number;
  /** XP climbed from the rung below. Zero at level 1, where nobody climbed. */
  step: number;
  /** A round number worth marking. See `LEVEL_MILESTONES`. */
  milestone: boolean;
};

/**
 * The rungs a reader counts by.
 *
 * Ten is the first month of casual play and the end of the flat ramp, so it is
 * where the curve itself changes shape. Twenty-five, fifty and seventy-five are
 * quarters, and a hundred is the top. They are marked because a hundred
 * undifferentiated rows is a wall: the eye needs somewhere to land, and these are
 * the numbers somebody would screenshot.
 *
 * A row rather than a computed `level % 25 === 0`, because 10 is in it and 20 is
 * not — the shape of the curve is a decision and not an arithmetic property.
 */
export const LEVEL_MILESTONES: readonly number[] = [10, 25, 50, 75, 100];

/**
 * THE XP A LEVEL SPANS: FROM ITS OWN COST, UP TO BUT NOT INCLUDING THE NEXT.
 *
 * `to` IS NULL AT THE TOP, and that null is the whole reason this is a function
 * rather than two calls to `xpForLevel` at the call site. `xpForLevel` CLAMPS its
 * argument to the top of the ladder, so `xpForLevel(101)` answers
 * `xpForLevel(100)` — a perfectly valid number that, used as a ceiling, would
 * make level 100's range `[68155, 68155)` and empty. Every member at the top of
 * the ladder would vanish from their own level's page, with nothing failing and
 * the page looking complete.
 *
 * That is AGENTS.md's "a guard returning a plausible value for I do not know",
 * and null is the answer instead: there is no ceiling above level 100, so the
 * caller is told there is none rather than handed a number that reads as one.
 */
export function levelXpRange(level: number): { from: number; to: number | null } | null {
  if (!Number.isInteger(level) || level < 1 || level > XP_LEVELS) return null;
  return {
    from: xpForLevel(level),
    to: level === XP_LEVELS ? null : xpForLevel(level + 1),
  };
}

/** One rung, or null for a level the ladder does not have. */
export function ladderRung(level: number): LadderRung | null {
  const row = levelNameRow(level);
  if (row === null) return null;
  const toReach = xpForLevel(level);
  return {
    level,
    name: row.name,
    kanji: row.kanji ?? "",
    note: row.note,
    toReach,
    // See the header: two cumulative totals, and no off-by-two to get wrong.
    step: level <= 1 ? 0 : toReach - xpForLevel(level - 1),
    milestone: LEVEL_MILESTONES.includes(level),
  };
}

/**
 * The whole ladder, level 1 first.
 *
 * Built rather than stored, so it cannot drift from the two files it is made of.
 * It is a hundred objects over a hundred-element array in memory and the page
 * that draws it is server-rendered, so this is not a cost worth caching — and a
 * cached copy of a table meant to be retuned is the fault `xpCurve.ts` refuses
 * for the level itself.
 */
export function levelLadder(): LadderRung[] {
  const rungs: LadderRung[] = [];
  for (let level = 1; level <= XP_LEVELS; level += 1) {
    const rung = ladderRung(level);
    if (rung !== null) rungs.push(rung);
  }
  return rungs;
}
