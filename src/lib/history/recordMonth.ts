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

/** Which span a board's figure counted: a month, a week, or neither for all time. */
export type RecordPeriod = { month: string | null; week: string | null };

export const ALL_TIME: RecordPeriod = { month: null, week: null };

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

/*
 * A WEEK IN AN ADDRESS: `week=2026-09-21`, the Monday it starts on, in UTC.
 *
 * The weekly boards count from Monday 00:00 UTC (`startOfWeek`), so a figure on
 * one of them is a promise about what finished in those seven days, and the
 * record's `week` filter keeps it the way `month` keeps a month's. Named by its
 * Monday rather than an ISO week number, because a date is what a reader can
 * check against a calendar, and the chip says it in words anyway.
 */

const WEEK = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The week a value names — a real date that is a Monday — as written in an address, or null for anything else. */
export function readWeek(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  const parts = WEEK.exec(text);
  if (parts === null) return null;
  const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const at = new Date(Date.UTC(year, month - 1, day));
  // A date that rolled over (2026-02-30) is not one, and a week starts on a Monday.
  if (at.getUTCFullYear() !== year || at.getUTCMonth() !== month - 1 || at.getUTCDate() !== day) return null;
  return at.getUTCDay() === 1 ? text : null;
}

/** The week a moment falls in, as its Monday in UTC: 2026-09-26 → "2026-09-21". */
export function weekOf(at: Date): string {
  const monday = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()) - ((at.getUTCDay() + 6) % 7) * DAY_MS);
  return monday.toISOString().slice(0, 10);
}

/** The first moment of a week and the first moment of the next, in UTC. */
export function weekBounds(week: string): { start: Date; end: Date } {
  const start = new Date(`${week}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 7 * DAY_MS) };
}

/** A week in words, for the chip that says a record was narrowed to it: "the week of 21 September 2026". */
export function weekWords(week: string): string {
  const [year, month, day] = week.split("-").map(Number) as [number, number, number];
  return `the week of ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}
