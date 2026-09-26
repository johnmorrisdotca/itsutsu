/**
 * A CALENDAR MONTH IN AN ADDRESS: `month=2026-09`, in UTC.
 *
 * The monthly boards count from the first moment of this month (`startOfMonth`),
 * so a figure on one of them is a promise about the games or solves finished
 * in that month. The record's `month` filter is the way to keep it: the same
 * month, bounded the same way, on the moment a game or solve FINISHED — which
 * is what the boards read (`Game.lastMoveAt`, `PuzzleSolve.finishedAt`), not
 * when a game was set up.
 *
 * One plain value rather than a `from` and a `to`, because the question a
 * board's number answers is "this month", and an address that said two dates
 * would be one a reader could half-edit into a set nobody counted.
 */

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** The month a value names, as it is written in an address, or null for anything else. */
export function readMonth(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  return MONTH.test(text) ? text : null;
}

/** The month a moment falls in, in UTC: 2026-09-26 → "2026-09". */
export function monthOf(at: Date): string {
  return `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The first moment of a month and the first moment of the next, in UTC. */
export function monthBounds(month: string): { start: Date; end: Date } {
  const [year, index] = month.split("-").map(Number) as [number, number];
  return { start: new Date(Date.UTC(year, index - 1, 1)), end: new Date(Date.UTC(year, index, 1)) };
}

/** A month in words, for the chip that says a record was narrowed to it: "September 2026". */
export function monthWords(month: string): string {
  const [year, index] = month.split("-").map(Number) as [number, number];
  return `${MONTH_NAMES[index - 1]} ${year}`;
}
