import { dailyWordSeed, dayOfDailyWordSeed } from "../dailyWords/dailyDay";
import { DAILY_SEED_BLOCK, type Random } from "../random";

/**
 * THE SEEDS OF A YOTSUGO (`yotsugo.ts`), four words at once, found again by
 * their seed alone as a Futago's are (`futagoSeed.ts`, whose note gives the
 * reason): a kept run is its kind, size, level and seed, and nothing else, so
 * the seed is what says a run hides four words.
 *
 * Like a Futago's, they come from the daily words' block, which `freshSeed`
 * never draws from, and from a part of it no day names: the dates from the
 * year 3000, which `dayOfDailyWordSeed` refuses (the daily words run to the
 * end of 2999). The block is 1,030,000,000 to 1,049,999,999.
 *
 *  - A DAY'S YOTSUGO is the day's seed and ten million more: its year's "20"
 *    read as "30", so 2026-10-03, whose word is played at 1020261003, has its
 *    four words at 1030261003. Days to the end of 2099, as a Futago's.
 *  - ANY OTHER YOTSUGO is drawn from the rest of the block, 1,031,000,000 up,
 *    nineteen million seeds that no day of any kind can name.
 *
 * So a seed in this block is a Yotsugo and no other seed is, and neither
 * `freshSeed` nor `freshFutagoSeed` ever makes one.
 */
export const YOTSUGO_SEED_BLOCK = { from: DAILY_SEED_BLOCK.from + 30_000_000, size: 20_000_000 } as const;

/** How far a day's Yotsugo seed is above the day's one-word seed: "20" of its year read as "30". */
const DAY_SHIFT = 10_000_000;

/** Where the drawn Yotsugo seeds start: after every day a Yotsugo's daily seed can name (years 2000 to 2099). */
const DRAWN_FROM = YOTSUGO_SEED_BLOCK.from + 1_000_000;

/** Whether a seed is a Yotsugo's: four words, not one or two. */
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
  const day = seed - DAY_SHIFT;
  // The day's own seed is in the daily block's years 2000 to 2099; `dayOfDailyWordSeed` reads the date and refuses one before the first word.
  return dayOfDailyWordSeed(day);
}
