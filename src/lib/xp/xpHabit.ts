import { XP_EVENTS, dayStreakMilestoneFor } from "./xp.constants";
import type { XpAward } from "./xp.types";
import { type DayKey } from "./xpDay";

/**
 * Turning up: the run of days, and coming back from time away.
 *
 * Pure, and separate from `dailyVisit.ts` — which is the rider that pays — for
 * the same reason `xpGame.ts` is separate from `xpGameServer.ts`: a rule about
 * days can then be checked against a list of days rather than against a clock
 * and a database.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE DAY KEY IS THE ARITHMETIC
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every function here works on `YYYY-MM-DD` strings that `xpDayKey` has already
 * produced in the member's own zone, never on instants. That is deliberate: the
 * question "did they visit yesterday" is about THEIR days, and asking it of two
 * `Date`s means asking it in the server's zone — which for a member in Tokyo
 * silently moves the boundary by nine hours and ends a streak on a day they
 * played. Reading the key back as UTC midnight is the same trick `xpWeekKey`
 * uses, and it makes the arithmetic exact rather than nearly right.
 */

/**
 * How far back a run of days is read.
 *
 * The longest milestone is a year, so a run longer than that has already been
 * paid for every milestone there is and its exact length no longer matters. The
 * cap is what makes the read bounded: 366 small rows, once, on the day a run
 * could have reached something.
 */
export const XP_DAY_RUN_MAX = 366;

/** The day before this one. */
export function previousDayKey(day: DayKey): DayKey {
  const at = new Date(`${day}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() - 1);
  return at.toISOString().slice(0, 10);
}

/** Whether `earlier` is the day immediately before `day`. */
export function isDayBefore(earlier: DayKey, day: DayKey): boolean {
  return previousDayKey(day) === earlier;
}

/**
 * The length of the run of consecutive days ending on `today`, given the days
 * this member has been seen on.
 *
 * `days` is every day key the ledger holds a visit for — in any order, and
 * duplicates do not matter, because a set is what the question is about. Nought
 * when `today` is not among them, which is not a run of nought: it means this
 * day has no visit recorded, so there is nothing to be the end of.
 */
export function dayRunEndingAt(days: readonly DayKey[], today: DayKey): number {
  const seen = new Set(days);
  if (!seen.has(today)) return 0;
  let run = 1;
  let day = previousDayKey(today);
  while (seen.has(day) && run < XP_DAY_RUN_MAX) {
    run += 1;
    day = previousDayKey(day);
  }
  return run;
}

/**
 * The milestone a run of days has just reached, keyed on the day it was reached.
 *
 * Keyed on the DAY rather than on nothing, so a member who keeps a hundred-day
 * run going is paid for the hundredth day once and for a later hundredth day
 * again — a year's run is priced to repeat, and a once-ever subject would make
 * it a one-off. `dayStreakMilestoneFor` answers only at exactly 7, 30, 100 and
 * 365, so day 8 asks for nothing.
 */
export function dayStreakAward(run: number, today: DayKey): XpAward | null {
  const milestone = dayStreakMilestoneFor(run);
  return milestone === null ? null : { type: milestone, subject: today };
}

/**
 * Whether this visit is the first one after a spell of time away.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO COMPARISONS ON VALUES ALREADY IN HAND, AND IT FIRES ONCE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The away range is already on the profile and `lastSeenAt` is already read by
 * the write this rides. So "they are back" is: the away spell has ended, and
 * they had not been seen since it ended. The second half is what makes this the
 * RETURN rather than every day after it — without it, a member who set away
 * dates once would have an award attempted on every first-visit-of-a-day for
 * ever, refused by the index each time, which is leaning on the index to keep a
 * cost down.
 *
 * `awayUntil` alone decides it. `awayFrom` says when the spell started and a
 * member can perfectly well visit during their own time off, which is why the
 * test is about the END of it.
 */
export function backFromAwayAward({
  awayUntil,
  lastSeenAt,
  now,
  dayKeyOf,
}: {
  awayUntil: Date | null;
  lastSeenAt: Date;
  now: Date;
  /** The day key for an instant, in this member's zone. */
  dayKeyOf: (at: Date) => DayKey;
}): XpAward | null {
  if (awayUntil === null) return null;
  const ended = awayUntil.getTime();
  if (now.getTime() < ended) return null;
  /* Seen since it ended: they never went anywhere, or they have already been
     welcomed back. */
  if (lastSeenAt.getTime() >= ended) return null;
  /* Keyed on the spell that ended, so a second holiday is a second welcome. The
     day rather than the instant, because that is what a member would read. */
  return { type: XP_EVENTS.backFromAway, subject: dayKeyOf(awayUntil) };
}
