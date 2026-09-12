/**
 * What each XP level costs, and why these numbers.
 *
 * XP is the second of two ladders here, and the two are deliberately
 * independent. A **rating** says how well you play: it is pooled, per variant,
 * and only rated games move it. XP says you turned up and tried things, which
 * is why an unrated hot-seat game pays it and a game you lost still pays for
 * being finished. Neither ladder can be bought with the other.
 *
 * **Two parts.** Levels 1-10 are a flat ramp - 20, 40, 60 up to 200 - because
 * early progress should be quick and legible rather than clever. A casual
 * player reaches level 11 inside their first month, which is what makes
 * somebody keep going; a ladder whose first rungs already compound gives a new
 * member nothing to hold on to.
 *
 * From level 11 the cost compounds at 2.415% a level, doubling every 29. The
 * rate is not chosen, it is solved: level 11 continues the ramp at 220 so there
 * is no step down at the handoff, and the rate is whatever carries the
 * remaining ninety levels to the target total from there. Setting the flat part
 * and the compounding part independently is how UmaKuma once produced a level
 * 10 costing 250 followed by a level 11 costing 83 - a ladder that got *easier*
 * at the exact moment it was supposed to start biting.
 *
 * **The total is 68,155, and it is calibrated against a person rather than an
 * average.** `docs/plans/xp/XP_DESIGN.md` sets out the two players it was
 * solved for, from the event catalogue in `xp.constants.ts`:
 *
 * - **Committed** - signs in daily, finishes about two games a day and wins
 *   half: roughly 60 XP a day, 21,900 a year. Reaches level 64 in a year, 86 in
 *   two and **100 at about three years**, which is the target.
 * - **Casual** - four days a week, three finished games a week: roughly 100 XP
 *   a week, 5,200 a year. Level 11 in a month, 33 in a year, 58 at three years
 *   - a real standing that never maxes, which is the point of having a top.
 *
 * The one-off awards - a first game of each of the 39 variants, each of the 11
 * families, each computer grade - come to 3,740 XP, which is level 21 on its
 * own. That is deliberate rather than incidental: most of the games here have
 * barely been played, and the economy is pointed at that.
 *
 * **Every cost ends in a 0 or a 5.** John's rule on UmaKuma, and it earns its
 * place: a level costing 1,447 reads as a number a machine produced, where
 * 1,445 reads as a number somebody chose. Rounding can flatten two neighbours
 * into equality, so any cost that lands at or below the one before it is nudged
 * up five - which is why the table is stored rather than computed, and why
 * `xpCurve.test.ts` asserts the whole sequence strictly increases rather than
 * trusting the generator that made it.
 *
 * **Held as a table so it can be retuned by editing numbers.** There is no
 * migration behind it, and a curve nobody can adjust is a curve that stays
 * wrong. `docs/plans/xp/curve.py` regenerates the whole sequence from a target
 * total; change the target and paste, rather than hand-editing one row - the
 * shape is the decision, and a single edited row is not a shape.
 *
 * **The names are somewhere else, on purpose.** `levelNames.constants.ts` says
 * what each level is called. Retuning the economy renames nobody, and renaming
 * a level moves no number.
 */

/** The top of the ladder. */
export const XP_LEVELS = 100;

/** Cost of reaching each level, level 1 first. */
export const XP_LEVEL_COST: readonly number[] = [
  20, 40, 60, 80, 100, 120, 140, 160, 180, 200,
  220, 225, 230, 235, 240, 250, 255, 260, 265, 275,
  280, 285, 295, 300, 305, 315, 320, 330, 340, 345,
  355, 365, 370, 380, 390, 400, 410, 420, 430, 440,
  450, 460, 470, 485, 495, 505, 520, 530, 545, 560,
  570, 585, 600, 615, 630, 645, 660, 675, 690, 710,
  725, 745, 760, 780, 800, 815, 835, 855, 880, 900,
  920, 945, 965, 990, 1015, 1035, 1060, 1090, 1115, 1140,
  1170, 1195, 1225, 1255, 1285, 1315, 1350, 1380, 1415, 1450,
  1485, 1520, 1555, 1595, 1630, 1670, 1710, 1755, 1795, 1840,
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
