import "server-only";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { awardDailyVisit } from "@/lib/xp/dailyVisit";

import { foldEmail } from "./foldEmail";
import type { MemberKey } from "./memberKey.types";

/** How often "last seen" is written: once a minute is plenty for a who's-here list. */
const TOUCH_EVERY_MS = 60_000;

/**
 * The member row behind a session, read ONCE PER REQUEST.
 *
 * Every server-rendered page asks who is here, and several parts of one page
 * ask it separately — the header, the list, the page itself — each of which
 * was a query. React's `cache` keeps the first answer for the rest of the
 * request, so the third component to ask costs nothing. Outside a render, in
 * a route handler, it is a plain read, as before.
 *
 * It carries everything a page wants from this row on the way past: whether
 * the member is still welcome, when they were last seen, and their standing
 * preferences. A preference is read by riding this query, never by adding
 * one — see `preferencesFor` — because a store that cost a query per page is
 * the thing one JSON column was chosen over a table to avoid.
 *
 * BY THE KEY THE SESSION CARRIES, which is the member's id — or, for a Google
 * cookie minted before sessions carried one, the folded address. It was the
 * address alone, which a member who came in with an invite code does not have.
 * Every caller asks through `currentMemberRow`, which always asks by the same
 * key, so one request never reads the row twice under two names.
 */
export const memberRowFor = cache(async (by: MemberKey["by"], value: string) =>
  prisma.member.findUnique({
    where: by === "id" ? { id: value } : { email: foldEmail(value) },
    select: {
      id: true,
      /* The name, for the few things that need to say who is acting and used to
         take it from Google's word in the cookie — a member who came in with a
         code has no Google word to take. */
      name: true,
      lastSeenAt: true,
      bannedAt: true,
      preferences: true,
      timeZone: true,
      /* XP rides this read for the same reason a preference does. `xpFlash` is
         the toast a member has not been shown yet, and it must reach the
         masthead on every page without a query of its own — see
         `src/lib/xp/xpFlash.ts`. `id` comes along because `currentMemberId`
         was paying for a second `findUnique` to get it. */
      xp: true,
      /* Both other totals, for the badge and the board's Everywhere: see
         `xpForBadge` in `src/lib/xp/xpScope.ts`. Columns on the same row. */
      xpEverywhere: true,
      xpImported: true,
      xpFlash: true,
      /* And the end of their away spell, which is what `backFromAway` is keyed
         on. A column on a row being read anyway, so "are they back" costs two
         comparisons rather than a query — see `xpHabit.ts`. */
      awayUntil: true,
      /* And when they joined and how many games they have finished, which is
         all an anniversary needs — comparisons on the same row, see
         `anniversaryAwards` in `xpHabit.ts`. */
      createdAt: true,
      played: true,
      /* And where they say they are, which is the third rung of the time-zone
         order: a member with a country and no zone is guessed rather than left
         on UTC. Another field off the same row — see `zoneGuess.ts`. */
      country: true,
    },
  }),
);

/**
 * Marks a member as seen, and says whether they are still allowed in.
 *
 * Every server-rendered page asks who is here, and this is the read that
 * answers it, so the ban is checked in the same breath rather than costing a
 * query of its own. A banned member is "gone" from that moment: the next
 * request they make is the one that stops working.
 *
 * Cached per request like the read underneath it, so a page that asks three
 * times writes "seen" at most once — three callers handed the same stale
 * stamp would otherwise each have written it.
 */
export const touchMember = cache(async (by: MemberKey["by"], value: string): Promise<{ banned: boolean }> => {
  const row = await memberRowFor(by, value);
  if (row === null) return { banned: false };
  if (row.bannedAt !== null) return { banned: true };
  const now = new Date();
  if (now.getTime() - row.lastSeenAt.getTime() >= TOUCH_EVERY_MS) {
    /* The day's XP rides this write — see `awardDailyVisit`, which is handed
       the row as it was, before "seen" is stamped over the old `lastSeenAt`. */
    await prisma.member.update({ where: { id: row.id }, data: { lastSeenAt: now } });
    await awardDailyVisit(row, now);
  }
  return { banned: false };
});

/**
 * Whether this address is shut out, for the places that have not read the row
 * already — the two doors where Google has named an address and no session
 * exists yet, and the operator's check. By address, because that is what those
 * doors hold.
 */
export async function isBanned(email: string): Promise<boolean> {
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { bannedAt: true },
  });
  return row?.bannedAt != null;
}
