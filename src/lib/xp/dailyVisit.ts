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
 */
import { awardXp } from "./awardXp";
import { XP_EVENTS } from "./xp.constants";
import { isNewDay, xpDayKey } from "./xpDay";

export async function awardDailyVisit(
  row: { id: string; lastSeenAt: Date; timeZone: string | null },
  now: Date,
): Promise<void> {
  if (!isNewDay(row.lastSeenAt, now, row.timeZone)) return;
  await awardXp({
    memberId: row.id,
    awards: [{ type: XP_EVENTS.dailyVisit, subject: xpDayKey(now, row.timeZone) }],
    now,
  });
}
