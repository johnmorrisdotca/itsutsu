import "server-only";

/**
 * The day's XP, awarded where a member is marked as seen.
 *
 * THIS RIDES `touchMember`'S WRITE AND COSTS ONE COMPARISON. `lastSeenAt` is
 * already in hand there and about to be overwritten, so "is this a new day
 * for them" is one comparison on values already held — no read, and nothing
 * attempted on the four hundred other page loads of a day. Their own zone,
 * because this site's members are in Japan, Estonia and Canada and a fixed one
 * would end somebody's day in the afternoon.
 *
 * The alternative was to call `awardXp` on every touch and let the unique
 * index refuse the repeats. That works and is wrong: a minute-throttled touch
 * is up to 1,440 award attempts a day per member, each a query, to write one
 * row. A cap or an index should not be the only thing keeping a cost down.
 *
 * It lives here rather than in `members.ts` because it is XP's rule about
 * days, not the member row's rule about presence — the row hands over what it
 * already knows and this decides whether it is worth a line in the ledger.
 * Called with the row AS IT WAS before "seen" is stamped, which is the only
 * moment the old `lastSeenAt` still says when they were last here.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT ELSE THE FIRST VISIT OF A DAY IS WORTH, AND WHAT EACH PART COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Three awards, all of them on this one write:
 *
 * - **The day itself.** One insert, no read.
 * - **Coming back from time away.** Two comparisons on values already in hand
 *   — see `backFromAwayAward` — and it goes in the same batch, so it is one
 *   more statement inside a transaction that was happening anyway.
 * - **The run of days.** ONE read, and only on a day that could be part of a
 *   run: if the stored `lastSeenAt` is not YESTERDAY for this member, the run is
 *   one and a run of one is not a milestone, so nothing is asked. A member who
 *   comes back the next day costs one indexed read of at most 366 small rows,
 *   at most once a day.
 *
 * That last guard is the whole cost design. Reading the run on every first
 * visit of a day would be a query per member per day to answer a question whose
 * answer is nearly always "one".
 */

import { prisma } from "@/lib/prisma";

import { awardXp } from "./awardXp";
import { XP_EVENTS } from "./xp.constants";
import type { XpAward } from "./xp.types";
import { isNewDay, xpDayKey, type DayKey } from "./xpDay";
import { XP_DAY_RUN_MAX, backFromAwayAward, dayRunEndingAt, dayStreakAward, isDayBefore } from "./xpHabit";

/** What this rider needs off the member row, all of it already selected. */
export type VisitingMember = {
  id: string;
  lastSeenAt: Date;
  timeZone: string | null;
  /**
   * The end of the member's away spell, or null.
   *
   * Read on the same row for nothing. It is what `backFromAway` is keyed on, and
   * the reason the award can fire exactly once per spell rather than once a day
   * for ever after one.
   */
  awayUntil: Date | null;
};

export async function awardDailyVisit(row: VisitingMember, now: Date): Promise<void> {
  if (!isNewDay(row.lastSeenAt, now, row.timeZone)) return;
  const today = xpDayKey(now, row.timeZone);

  const awards: XpAward[] = [{ type: XP_EVENTS.dailyVisit, subject: today }];
  const back = backFromAwayAward({
    awayUntil: row.awayUntil,
    lastSeenAt: row.lastSeenAt,
    now,
    dayKeyOf: (at) => xpDayKey(at, row.timeZone),
  });
  if (back !== null) awards.push(back);

  const milestone = await dayRunMilestone(row, today);
  if (milestone !== null) awards.push(milestone);

  await awardXp({ memberId: row.id, awards, now });
}

/**
 * The day-streak milestone this visit reached, or null — and no read at all
 * unless the run can be longer than one.
 *
 * The stored `lastSeenAt` is the previous visit. If its day is not the day
 * before today's, the run starts again at one today, and one is not a milestone.
 * So the only case that costs anything is the one that could pay.
 *
 * THE LEDGER IS THE RECORD OF DAYS VISITED, which is why the run is read from
 * it rather than kept in a column: one `dailyVisit` row exists per day a member
 * has been seen on — that is what the unique index means — so the rows ARE the
 * calendar, with no second definition to drift and no migration to add one.
 *
 * Today's own row is included because this is called after the batch's first
 * award has been decided but before it is written, so `today` is added by hand
 * rather than read back. That keeps it to one read instead of a write, a read
 * and a second write.
 */
async function dayRunMilestone(row: VisitingMember, today: DayKey): Promise<XpAward | null> {
  const last = xpDayKey(row.lastSeenAt, row.timeZone);
  if (!isDayBefore(last, today)) return null;

  try {
    const seen = await prisma.xpEvent.findMany({
      where: { memberId: row.id, type: XP_EVENTS.dailyVisit },
      /* Day keys sort lexicographically and the unique index is
         `(memberId, type, subject)`, so this is an ordered walk down that index
         rather than a sort. */
      orderBy: { subject: "desc" },
      take: XP_DAY_RUN_MAX,
      select: { subject: true },
    });
    const days = [today, ...seen.map((one) => one.subject)];
    return dayStreakAward(dayRunEndingAt(days, today), today);
  } catch (problem) {
    /* A run that could not be read is a milestone not paid this time, and the
       day itself still is. Never a guess at the length: a made-up run would pay
       for a week nobody kept. */
    console.error("Could not read a run of days", row.id, problem);
    return null;
  }
}
