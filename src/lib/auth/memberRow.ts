import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";

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

/** What the stamp below hands back: the row as it was before "seen" was written over it. */
type SeenBefore = {
  id: string;
  lastSeenAt: Date;
  timeZone: string;
  awayUntil: Date | null;
  createdAt: Date;
  played: number;
};

/**
 * Marks a member as seen from a live board's ask, in ONE statement and with no
 * read before it — the poll route's version of `touchMember`.
 *
 * A player sitting on a board loads no page, so without this their
 * `lastSeenAt` went stale while they were plainly here, and the other seat's
 * board could not know to ask faster (`POLL_FAST_MS`). The board asks every
 * three or fifteen seconds; the stamp is still at most once a minute, by the
 * same `TOUCH_EVERY_MS`, because the condition is in the WHERE: an ask inside
 * the minute matches no row and writes nothing.
 *
 * NOT a bare `updateMany`, because the day's XP rides the stamp
 * (`awardDailyVisit`) and is decided from the stamp being REPLACED. A player on
 * a board across their midnight would otherwise have the new day stamped here
 * with nobody asking whether it was a new day, and the next page they loaded
 * would see "already seen today" and pay nothing — a lost day and a broken run.
 * So the statement hands back the row as it was (the self-join reads the
 * statement's own snapshot, before the update), and the visit is judged
 * exactly as `touchMember` judges it: one comparison, and nothing more unless
 * it opens a new day. A race with a page's own touch can only ask twice for the
 * same day, which the ledger's unique index answers once.
 *
 * A banned member is not stamped, as `touchMember` does not stamp one.
 */
export async function touchMemberFromPoll(key: MemberKey, now: Date = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - TOUCH_EVERY_MS);
  const which =
    key.by === "id" ? Prisma.sql`m.id = ${key.value}` : Prisma.sql`m.email = ${foldEmail(key.value)}`;
  const rows = await prisma.$queryRaw<SeenBefore[]>`
    UPDATE "Member" AS m SET "lastSeenAt" = ${now}
    FROM "Member" AS was
    WHERE was.id = m.id AND ${which} AND m."lastSeenAt" < ${cutoff} AND m."bannedAt" IS NULL
    RETURNING m.id, was."lastSeenAt", m."timeZone", m."awayUntil", m."createdAt", m.played
  `;
  const was = rows[0];
  if (was !== undefined) await awardDailyVisit(was, now);
}

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
