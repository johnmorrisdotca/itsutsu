/**
 * The days of the week a member does not play.
 *
 * Distinct from the away range on the profile, which is a span of dates out
 * of a small yearly allowance and is meant for a holiday. This is standing:
 * somebody who never plays on a Sunday says so once, and every deadline in
 * every game steps over their Sundays for ever, without spending anything.
 *
 * A day is a day where the member is, not where the server is. Sunday in
 * Tokyo is half of Saturday and half of Sunday in London, and a player who
 * said "not on Sundays" meant their own. The member's time zone is already
 * on their profile for exactly this kind of reason; with none set, the
 * server's own days are the best guess available.
 */

const DAY_MS = 86_400_000;

/** Sunday first, as the profile lists them. */
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export const WEEKDAY_DISPLAY: Record<number, { label: string; short: string; kanji: string }> = {
  0: { label: "Sunday", short: "Sun", kanji: "日" },
  1: { label: "Monday", short: "Mon", kanji: "月" },
  2: { label: "Tuesday", short: "Tue", kanji: "火" },
  3: { label: "Wednesday", short: "Wed", kanji: "水" },
  4: { label: "Thursday", short: "Thu", kanji: "木" },
  5: { label: "Friday", short: "Fri", kanji: "金" },
  6: { label: "Saturday", short: "Sat", kanji: "土" },
};

/**
 * Somebody must play on some day.
 *
 * Taking all seven off is not a preference, it is leaving: every deadline
 * would be postponed for ever and no game either side is in could ever end.
 * Six is the most anybody may take, and the form says so.
 */
export const MOST_DAYS_OFF = 6;

/** The days a stored value really names: whole numbers 0–6, each once, and not all seven. */
export function cleanDaysOff(days: readonly number[]): number[] {
  const kept = [...new Set(days)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  return kept.length > MOST_DAYS_OFF ? [] : kept;
}

/**
 * The instant, read as if the member's own wall clock were UTC.
 *
 * This is the usual trick for asking "what day is it where they are": format
 * the moment into their zone, then read those numbers back as though they
 * were UTC. The difference between that and the real instant is their offset.
 */
function wallClockMs(at: Date, timeZone: string): number {
  if (timeZone === "") return at.getTime();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
    return Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") % 24,
      get("minute"),
      get("second"),
    );
  } catch {
    // An unknown zone is not a reason to refuse somebody a deadline.
    return at.getTime();
  }
}

/** The day of the week it is where the member is: 0 for Sunday. */
export function weekdayIn(at: Date, timeZone: string): number {
  return new Date(wallClockMs(at, timeZone)).getUTCDay();
}

/**
 * How much later a deadline falls because it lands on a day this member does
 * not play.
 *
 * A deadline that arrives on one of their days off is moved to the end of it,
 * and over a run of them to the end of the run. Nothing is given back for a
 * day off that merely passed while the clock ran: the point is not to be
 * asked to move on a day you do not play, and a deadline that has already
 * gone by on such a day is exactly that.
 *
 * The arithmetic is done on whole days of the member's own wall clock, so an
 * hour of it can be wrong across a daylight-saving change. A deadline is
 * measured in days here; being an hour out at the boundary twice a year is a
 * trade worth making for a rule anybody can predict.
 */
export function daysOffGraceMs(
  daysOff: readonly number[],
  timeZone: string,
  deadline: Date,
): number {
  const days = cleanDaysOff(daysOff);
  if (days.length === 0) return 0;

  let added = 0;
  // At most a week: `cleanDaysOff` refuses all seven, so a run always ends.
  for (let step = 0; step < 7; step += 1) {
    const at = new Date(deadline.getTime() + added);
    if (!days.includes(weekdayIn(at, timeZone))) return added;
    // To the start of their next day: what is left of this one, then on.
    const wall = wallClockMs(at, timeZone);
    added += DAY_MS - (((wall % DAY_MS) + DAY_MS) % DAY_MS);
  }
  return added;
}
