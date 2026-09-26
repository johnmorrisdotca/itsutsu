import { DAILY_SEED_BLOCK } from "../random";

/**
 * THE DAYS OF THE DAILY WORDS, and the seeds that name them.
 *
 * A day is its date in UTC, written `2026-10-03`. It turns at midnight UTC for
 * everybody, as `dailySeed` in `daily.ts` always has, which is what makes it
 * one word for the whole site rather than one per time zone.
 *
 * A day's puzzle is an ordinary address with a seed in it, so it is kept,
 * resumed, raced and shared like any other. The seed is the date with a
 * thousand million in front — 2026-10-03 is 1020261003 — inside the block
 * `freshSeed` never draws from (`DAILY_SEED_BLOCK`), so the address can be read
 * by eye and no random word is ever mistaken for a day's.
 */

/**
 * The first day of the daily words, day 0 of the first cycle. Every day's word
 * counts from it, so it is NEVER MOVED once the words have gone live: moving
 * it by one day moves every word, past ones included, to another day.
 */
export const DAILY_WORDS_EPOCH = "2026-09-26";

const DAY_MS = 86_400_000;

/** The UTC day a moment falls in, `YYYY-MM-DD`. */
export function dayKeyOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Whether a text is a real date written `YYYY-MM-DD`: 2026-02-30 is not. */
export function isDayKey(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const at = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(at) && dayKeyOf(new Date(at)) === text;
}

/** Midnight UTC at the start of a day. */
export function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** How many days a day is after the first daily word: 0 for the epoch, negative before it. */
export function dayIndexOf(day: string): number {
  return Math.round((dayStart(day).getTime() - dayStart(DAILY_WORDS_EPOCH).getTime()) / DAY_MS);
}

/** The day `index` days after the epoch. */
export function dayKeyAt(index: number): string {
  return dayKeyOf(new Date(dayStart(DAILY_WORDS_EPOCH).getTime() + index * DAY_MS));
}

/** The day before or after, `by` days on. */
export function dayAfter(day: string, by = 1): string {
  return dayKeyOf(new Date(dayStart(day).getTime() + by * DAY_MS));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * A day as a page prints it, "Sat 3 Oct 2026". Written out here rather than
 * through `Intl`, which spells dates by the zone and language of whoever
 * renders (`localTime.coverage.test.ts`): a day is a calendar date, the same
 * everywhere, and so is its name.
 */
export function dayLabel(day: string, withYear = true): string {
  const at = dayStart(day);
  const date = `${WEEKDAYS[at.getUTCDay()]} ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]!.slice(0, 3)}`;
  return withYear ? `${date} ${at.getUTCFullYear()}` : date;
}

/** A month, `2026-10`, as "October 2026". */
export function monthLabel(month: string): string {
  const [year, number] = month.split("-");
  return `${MONTHS[Number(number) - 1] ?? month} ${year}`;
}

/** The Monday of a day's week (weeks run Monday to Sunday, as ISO counts them). */
export function mondayOf(day: string): string {
  return dayAfter(day, -((dayStart(day).getUTCDay() + 6) % 7));
}

/** The seed a day's word is played at: 2026-10-03 → 1020261003. */
export function dailyWordSeed(day: string): number {
  return DAILY_SEED_BLOCK.from + Number(day.replaceAll("-", ""));
}

/**
 * The day a seed names, or null for a seed that names none: outside the
 * block, not a real date, or before the first daily word. Null is the answer
 * for every ordinary seed, and it means "draw the word as always".
 */
export function dayOfDailyWordSeed(seed: number): string | null {
  const offset = seed - DAILY_SEED_BLOCK.from;
  if (!Number.isInteger(offset) || offset < 0 || offset >= DAILY_SEED_BLOCK.size) return null;
  const digits = String(offset).padStart(8, "0");
  const day = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  if (!isDayKey(day) || dayIndexOf(day) < 0) return null;
  return day;
}
