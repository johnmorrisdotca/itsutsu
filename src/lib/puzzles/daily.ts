/**
 * TODAY'S PUZZLE: one seed a day, the same for everybody.
 *
 * Gomoji's row "a word of the day" (2026-09-25): the seed is the day's date in
 * UTC written as a number, 2026-09-25 → 20260925, so every reader asking for
 * today's puzzle at a size and level meets the same grid, tomorrow's is another,
 * and the address it resolves to is an ordinary one — shareable, and kept like
 * any other when it is left half done. The day turns at midnight UTC for
 * everybody, which is what makes it one puzzle rather than one per zone.
 */
export function dailySeed(now: Date): number {
  return now.getUTCFullYear() * 10_000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
}

/** The address flag that asks for today's puzzle rather than a seed. */
export const DAILY_PARAM = "daily";
