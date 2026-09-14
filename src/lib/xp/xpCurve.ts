/**
 * What each XP level costs, and why these numbers.
 *
 * XP is the second of two ladders here, and the two are deliberately
 * independent. A **rating** says how well you play: it is pooled, per variant,
 * and only rated games move it. XP says you turned up and tried things, which
 * is why an unrated hot-seat game pays it and a game you lost still pays for
 * being finished. Neither ladder can be bought with the other — though beating
 * somebody rated well above you is worth more XP, which is the one place the
 * rating is READ (`xpUpset.ts`), and nothing ever writes one from the other.
 *
 * **The top is exactly 999,999 XP, and Level 100 is the last rung.** John: "you
 * need 999,999 to get to the top level". Every other cost ends in 0 or 5, which
 * reads as a number somebody chose — but that is this generator's rounding, not
 * his rule, and where the two disagree his number wins. So rounding lands the
 * table on 999,995 and LEVEL 100's OWN RUNG takes the last four: it costs
 * 61,404, the one cost here that does not end in 0 or 5. `xpForLevel(100)` is
 * 999,999, `xpLevelFor(999_998)` is 99, and there is no level 101 —
 * `xpForLevel` clamps at the top.
 *
 * **Three parts, and each boundary is a step he named** — "need to get harder
 * after 10, 20 etc":
 *
 * - **Reaching levels 2-10 is a flat ramp**: 50, 100, up to 450, which is 2,250
 *   XP in all and a quarter of one percent of the ladder. Quick and legible,
 *   because a ladder whose first rungs already compound gives a new member
 *   nothing to hold on to.
 * - **Level 11 costs 700**, half as much again as level 10, and from there
 *   every level compounds. The first hardening, and one a player can feel.
 * - **Level 21 costs a quarter more than level 20**, the second, and the rate
 *   keeps rising — 2.47% a level at 12, climbing steadily to 7.41% at 100. A
 *   RISING rate is what makes the last stretch a climb rather than more of the
 *   same: the last ten levels cost 457,000 XP, 46% of the whole ladder.
 *
 * **The rate is solved, not chosen.** `docs/plans/xp/curve.py` fixes the ramp,
 * the two steps and how far the rate rises, and solves the starting rate so the
 * rounded table lands on the target. Setting the parts independently is how
 * UmaKuma once produced a level 10 costing 250 followed by a level 11 costing 83
 * - a ladder that got *easier* at the moment it was supposed to start biting.
 *
 * **What it takes, at the prices in `xp.constants.ts`** — the working, and the
 * trade John was asked to see, is in `docs/plans/xp/XP_DESIGN.md`:
 *
 * - A won game against a person pays 100 and the day's allowance is six games,
 *   so the fastest honest climb is about 222,000 XP a year. Level 100 is four
 *   and a half years of winning six games against people every single day.
 * - A committed member — daily, two games a day, winning half — earns about
 *   50,000 a year after the first. Level 50 in about a year, level 75 in four,
 *   level 100 in roughly nineteen. That is the arithmetic of 999,999 at these
 *   prices, and it is stated rather than hidden: the top is a lifetime's standing,
 *   which is what a figure with six nines in it asks for.
 *
 * **Rounded so the shape shows.** Costs round to 5 below 1,000, to 25 below
 * 10,000 and to 50 above: 61,437 reads as a machine's arithmetic and 61,400 as a
 * decision. Rounding can flatten two neighbours into equality, so a cost landing
 * at or below the one before it is nudged up a step, and the few fives rounding
 * leaves between the table and the target are laid on the cheapest compounding
 * rows, where 5 is the natural unit; what is left below five goes on Level 100's
 * own rung, as above. That is why the table is stored rather than
 * computed, and why `xpCurve.test.ts` asserts the whole sequence strictly
 * increases rather than trusting the generator that made it.
 *
 * **Held as a table so it can be retuned by editing numbers.** There is no
 * migration behind it, and a curve nobody can adjust is a curve that stays
 * wrong. Run `python3 docs/plans/xp/curve.py` and paste what it prints, rather
 * than hand-editing one row - the shape is the decision, and a single edited row
 * is not a shape. A retune moves every member's LEVEL at once and no member's XP:
 * the level is derived from `Member.xp`, which is a sum of what was paid.
 *
 * **The names are somewhere else, on purpose.** `levelNames.constants.ts` says
 * what each level is called. Retuning the economy renames nobody, and renaming
 * a level moves no number.
 */

/** The top of the ladder. */
export const XP_LEVELS = 100;

/**
 * One entry per level-up: the price of reaching level 2, then level 3, and so on
 * up to level 100. NINETY-NINE rungs — level 1 is free and there is no level 101
 * — so the table's plain sum is the top, exactly 999,999. A hundredth entry would
 * be the price of a rung that does not exist: a number in range that means
 * nothing, and one an honest sum of this table would read as part of the climb.
 */
export const XP_LEVEL_COST: readonly number[] = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 700,
  720, 740, 755, 775, 795, 815, 840, 865, 890, 1100,
  1150, 1175, 1225, 1250, 1300, 1350, 1375, 1425, 1475, 1525,
  1600, 1650, 1700, 1775, 1850, 1900, 1975, 2075, 2150, 2250,
  2325, 2425, 2525, 2650, 2750, 2875, 3000, 3150, 3300, 3450,
  3600, 3775, 3950, 4150, 4350, 4575, 4800, 5050, 5325, 5600,
  5875, 6200, 6525, 6875, 7275, 7675, 8100, 8550, 9050, 9575,
  10150, 10750, 11350, 12050, 12800, 13550, 14400, 15300, 16250, 17300,
  18400, 19550, 20850, 22200, 23700, 25250, 26950, 28800, 30750, 32900,
  35200, 37650, 40300, 43150, 46300, 49600, 53250, 57150, 61404,
];

/** Running total to reach a level, so a progress bar needs no loop. */
const CUMULATIVE: readonly number[] = XP_LEVEL_COST.reduce<number[]>((running, cost, index) => {
  running.push((running[index - 1] ?? 0) + cost);
  return running;
}, []);

/** Total XP needed to stand at `level`. Level 1 is where everybody starts. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  const capped = Math.min(Math.max(2, Math.trunc(level)), XP_LEVELS);
  return CUMULATIVE[capped - 2];
}

/**
 * The level an amount of XP has earned.
 *
 * A lookup, not a query. Every list that shows a level shows it beside a name
 * it already fetched, so this has to be free - which is the reason the level is
 * derived from `Member.xp` and never stored beside it. A stored level is a
 * cached copy of this table, and this table is meant to be retuned.
 */
export function xpLevelFor(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  for (let level = XP_LEVELS; level >= 2; level -= 1) {
    if (xp >= xpForLevel(level)) return level;
  }
  return 1;
}

export type XpStanding = {
  level: number;
  /** XP earned since reaching this level. */
  into: number;
  /** XP this level needs in total. Zero at the top, where there is no next. */
  span: number;
  /** 0-1 through the current level; 1 at the top. */
  ratio: number;
  /** XP still to go. Zero at the top. */
  toNext: number;
};

/** Everything a badge or a progress bar needs, from one number. */
export function xpStanding(xp: number): XpStanding {
  const level = xpLevelFor(xp);
  if (level >= XP_LEVELS) return { level, into: 0, span: 0, ratio: 1, toNext: 0 };
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const span = ceiling - floor;
  const into = Math.max(0, xp - floor);
  return { level, into, span, ratio: span === 0 ? 1 : into / span, toNext: Math.max(0, ceiling - xp) };
}

/**
 * Whether this award is what moved somebody's level.
 *
 * Asked with the totals either side of one award, which `awardXp` holds inside
 * its transaction - so nothing needs storing to answer it. A big award can
 * carry somebody through more than one level; the caller is told the level they
 * arrived at, and `from` says where they started if it wants to name every rung.
 */
export function levelCrossed(before: number, after: number): { from: number; to: number } | null {
  const from = xpLevelFor(before);
  const to = xpLevelFor(after);
  return to > from ? { from, to } : null;
}
