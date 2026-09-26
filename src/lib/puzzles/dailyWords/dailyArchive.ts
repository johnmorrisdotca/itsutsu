import type { PuzzleKind } from "../puzzles.types";
import { dailyDayPath, dailyPlayPath, shownWord } from "./dailyAddress";
import { DAILY_WORDS_EPOCH, dayAfter, dayIndexOf, mondayOf } from "./dailyDay";
import { dailyLengths, dailyWordOf } from "./dailyPools";
import type { ArchiveDay, ArchiveWeek } from "./dailyWords.types";

/**
 * THE PAST DAYS' WORDS, for the archive page: never today's, never a day to
 * come. Everything here takes today as an argument and stops the day before
 * it, so the one place that decides what is past is the page that passes
 * today in, at request time — and a page drawn earlier can only ever show
 * fewer days, never one too many.
 *
 * Kana days need their pools fetched first (`loadDailyPools`).
 */

/** The last day whose words may be shown: yesterday, or null before the first daily word has had its day. */
export function lastPastDay(today: string): string | null {
  const yesterday = dayAfter(today, -1);
  return dayIndexOf(yesterday) < 0 ? null : yesterday;
}

/** The months with a past day in them, newest first, `YYYY-MM`. */
export function archiveMonths(today: string): string[] {
  const last = lastPastDay(today);
  if (last === null) return [];
  const months: string[] = [];
  let [year, month] = last.slice(0, 7).split("-").map(Number) as [number, number];
  const first = DAILY_WORDS_EPOCH.slice(0, 7);
  for (;;) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    months.push(key);
    if (key <= first) return months;
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
}

/** The month an address asked for, if it is one there are words for; else the newest, or "all" when asked for. */
export function archiveMonthAsked(asked: string | undefined, months: readonly string[]): string {
  if (asked === "all") return "all";
  return asked !== undefined && months.includes(asked) ? asked : (months[0] ?? "all");
}

/** A past day's row: each length's word and where it is played. */
function archiveDay(kind: PuzzleKind, day: string): ArchiveDay {
  const words = dailyLengths(kind).flatMap((size) => {
    const word = dailyWordOf(kind, size, day)?.word;
    return word === undefined ? [] : [{ size, word: shownWord(kind, word), href: dailyPlayPath(kind, size, day) }];
  });
  return { day, words, dayHref: dailyDayPath(kind, day) };
}

/** The past days of a month ("all" for every one), grouped Monday to Sunday, newest first. */
export function archiveWeeks(kind: PuzzleKind, today: string, month: string): ArchiveWeek[] {
  const last = lastPastDay(today);
  if (last === null) return [];
  const weeks: { monday: string; days: ArchiveDay[] }[] = [];
  for (let day = last; dayIndexOf(day) >= 0; day = dayAfter(day, -1)) {
    if (month !== "all" && day.slice(0, 7) !== month) {
      if (day.slice(0, 7) < month) break;
      continue;
    }
    const monday = mondayOf(day);
    const week = weeks.at(-1);
    const row = archiveDay(kind, day);
    if (week !== undefined && week.monday === monday) week.days.push(row);
    else weeks.push({ monday, days: [row] });
  }
  return weeks;
}
