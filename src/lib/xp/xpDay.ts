/**
 * What day it is, for somebody.
 *
 * The day is the unit the ledger counts in: `dailyVisit` is once a day, the
 * day's allowance is a count of events with one day key, and a streak is a run
 * of them. So "what day is it" has to be answered once, in one place, and
 * answered for the right person.
 *
 * **UmaKuma hardcodes Vancouver and that would be wrong here.** It is one
 * household in one time zone. This site's members are in Japan, Estonia,
 * Canada, Russia and China, and `Member.timeZone` already holds each one's —
 * so a fixed zone would end somebody's day at five in the afternoon, break
 * their streak on a day they played, and do it silently.
 *
 * Pure, so it can be tested without a clock: every function takes the instant
 * and the zone.
 */

/** A day, as `YYYY-MM-DD`. Sorts lexicographically, which several readers rely on. */
export type DayKey = string;

/**
 * The day an instant falls on, in a member's own zone.
 *
 * `timeZone` is `Member.timeZone`, which is `@default("")` — so empty is the
 * ordinary case, not an error, and it means UTC. An UNKNOWN zone also means
 * UTC, because the alternative is throwing on a profile field a member typed:
 * a day key that is off by a few hours costs somebody one streak day, where an
 * exception costs them the page.
 *
 * Built from `Intl.DateTimeFormat` with `en-CA`, which formats as `YYYY-MM-DD`
 * natively. The locale is named rather than left to the machine on purpose:
 * this string is a stored key, and a key that reads `2026-09-12` on one deploy
 * and `12/09/2026` on another is a key nothing can group by.
 */
export function xpDayKey(now: Date, timeZone?: string | null): DayKey {
  const zone = timeZone && timeZone.length > 0 ? timeZone : "UTC";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    /* An unrecognised zone. See above: UTC rather than a throw. */
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

/**
 * Whether two instants fall on different days for this member.
 *
 * The whole of the daily-visit rule. `touchMember` already holds the stored
 * `lastSeenAt` and is about to write a new one, so asking this costs one
 * comparison on values in hand — no read, and no attempt to award on the other
 * four hundred page loads of a day.
 */
export function isNewDay(last: Date, now: Date, timeZone?: string | null): boolean {
  return xpDayKey(last, timeZone) !== xpDayKey(now, timeZone);
}

/**
 * The ISO week an instant falls in, as `YYYY-Www`. The subject for a weekend
 * award, so it is earned once a weekend rather than once a game.
 *
 * The ISO week runs Monday to Sunday, so a Saturday and the Sunday after it are
 * the same week — which is the behaviour wanted, and is the reason for using
 * ISO weeks rather than inventing a "weekend id".
 */
export function xpWeekKey(now: Date, timeZone?: string | null): string {
  const day = xpDayKey(now, timeZone);
  /* Read back as UTC midnight of that local day, so the week arithmetic below
     is about the member's day and not about the server's. */
  const at = new Date(`${day}T00:00:00Z`);
  const weekday = at.getUTCDay() === 0 ? 7 : at.getUTCDay();
  const thursday = new Date(at);
  thursday.setUTCDate(at.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Whether this instant falls at the weekend, for that member. */
export function isWeekend(now: Date, timeZone?: string | null): boolean {
  const at = new Date(`${xpDayKey(now, timeZone)}T00:00:00Z`);
  const weekday = at.getUTCDay();
  return weekday === 0 || weekday === 6;
}
