import { DAILY_WORD_LAST_OFFSET, dailyWordSeed, dayOfDailyWordSeed } from "../dailyWords/dailyDay";
import { DAILY_SEED_BLOCK, type Random } from "../random";

/**
 * THE SEEDS OF A YOTSUGO (`yotsugo.ts`), which say it is one, as a Futago's
 * do (`futagoSeed.ts`): a kept run is found by its seed, so the seed is what
 * tells four words from one or two.
 *
 * They are the part of the daily words' block no day names: the dates from
 * the year 3000 on, which `dayOfDailyWordSeed` refuses (`DAILY_WORD_LAST_OFFSET`).
 * The block is 1,030,000,000 to 1,099,999,999.
 *
 *  - A DAY'S YOTSUGO is the day's seed and ten million: the date with its "20"
 *    made "30", so 2026-10-03, whose word is played at 1020261003, has its
 *    four words at 1030261003. Days to the end of 2099.
 *  - ANY OTHER YOTSUGO is drawn from the rest of the block, 1,031,000,000 up.
 *
 * `freshSeed` never draws from the daily block, so it never makes one by accident.
 */
export const YOTSUGO_SEED_BLOCK = { from: DAILY_SEED_BLOCK.from + DAILY_WORD_LAST_OFFSET, size: DAILY_SEED_BLOCK.size - DAILY_WORD_LAST_OFFSET } as const;

/** How far a day's Yotsugo seed is above the day's one-word seed. */
const DAY_SHIFT = 10_000_000;

/** Where the drawn Yotsugo seeds start: after every day a Yotsugo's daily seed can name (years 2000 to 2099). */
const DRAWN_FROM = YOTSUGO_SEED_BLOCK.from + 1_000_000;

/** Whether a seed is a Yotsugo's: four words. */
export function isYotsugoSeed(seed: number): boolean {
  return Number.isInteger(seed) && seed >= YOTSUGO_SEED_BLOCK.from && seed < YOTSUGO_SEED_BLOCK.from + YOTSUGO_SEED_BLOCK.size;
}

/** A new Yotsugo seed for a puzzle nobody asked for by number. */
export function freshYotsugoSeed(random: Random = Math.random): number {
  return DRAWN_FROM + Math.floor(random() * (YOTSUGO_SEED_BLOCK.from + YOTSUGO_SEED_BLOCK.size - DRAWN_FROM));
}

/** The seed a day's four words are played at: 2026-10-03 → 1030261003. */
export function yotsugoDailySeed(day: string): number {
  return dailyWordSeed(day) + DAY_SHIFT;
}

/** The day a Yotsugo seed names, or null for a drawn one, a seed that is no Yotsugo's, or a day before the first daily word. */
export function dayOfYotsugoSeed(seed: number): string | null {
  if (!isYotsugoSeed(seed) || seed >= DRAWN_FROM) return null;
  return dayOfDailyWordSeed(seed - DAY_SHIFT);
}
