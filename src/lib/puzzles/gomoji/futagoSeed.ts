import { dailyWordSeed, dayOfDailyWordSeed } from "../dailyWords/dailyDay";
import { DAILY_SEED_BLOCK, type Random } from "../random";

/**
 * THE SEEDS OF A FUTAGO (`futago.ts`), and the reason a seed says whether it
 * is one.
 *
 * A kept run is found again by its kind, size, level and seed, and nothing
 * else (`PuzzleRun`), so the seed is the one thing that can tell a two-word
 * run from a one-word run of the same Gomoji without a column of its own. It
 * can only do that from seeds nothing has ever used: every seed outside the
 * daily words' block may already be somebody's one-word Gomoji, so a Futago's
 * seeds are the part of that block no day can name — the dates before 2000,
 * which `dayOfDailyWordSeed` refuses because they come before the first daily
 * word. The block is 1,000,000,000 to 1,019,999,999.
 *
 *  - A DAY'S FUTAGO is the day's seed less twenty million: the date without
 *    its "20", so 2026-10-03, whose word is played at 1020261003, has its two
 *    words at 1000261003. Days to the end of 2099.
 *  - ANY OTHER FUTAGO is drawn from the rest of the block, 1,001,000,000 up,
 *    nineteen million seeds that no day of either kind can name.
 *
 * So a seed in the block is a Futago and no other seed is, and `freshSeed`,
 * which never draws from the daily block, never makes one by accident.
 */
export const FUTAGO_SEED_BLOCK = { from: DAILY_SEED_BLOCK.from, size: 20_000_000 } as const;

/** How far a day's Futago seed is below the day's one-word seed: the "20" of its year. */
const DAY_SHIFT = 20_000_000;

/** Where the drawn Futago seeds start: after every day a Futago's daily seed can name (years 2000 to 2099). */
const DRAWN_FROM = FUTAGO_SEED_BLOCK.from + 1_000_000;

/** Whether a seed is a Futago's: two words, not one. */
export function isFutagoSeed(seed: number): boolean {
  return Number.isInteger(seed) && seed >= FUTAGO_SEED_BLOCK.from && seed < FUTAGO_SEED_BLOCK.from + FUTAGO_SEED_BLOCK.size;
}

/** A new Futago seed for a puzzle nobody asked for by number. */
export function freshFutagoSeed(random: Random = Math.random): number {
  return DRAWN_FROM + Math.floor(random() * (FUTAGO_SEED_BLOCK.from + FUTAGO_SEED_BLOCK.size - DRAWN_FROM));
}

/** The seed a day's two words are played at: 2026-10-03 → 1000261003. */
export function futagoDailySeed(day: string): number {
  return dailyWordSeed(day) - DAY_SHIFT;
}

/** The day a Futago seed names, or null for a drawn one, a seed that is no Futago's, or a day before the first daily word. */
export function dayOfFutagoSeed(seed: number): string | null {
  if (!isFutagoSeed(seed) || seed >= DRAWN_FROM) return null;
  return dayOfDailyWordSeed(seed + DAY_SHIFT);
}
