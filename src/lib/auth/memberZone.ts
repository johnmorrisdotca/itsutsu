import "server-only";

/**
 * Whether this site still has no idea when a member's day ends.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A QUESTION AT ALL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `Member.timeZone` is `@default("")`, and a member only ever fills it in by
 * opening their profile and pressing "use this device's time zone". Almost
 * nobody has. Every one of those members was being reckoned in UTC — so the
 * site's owner, in Vancouver, had his day roll over at five in the afternoon,
 * and the XP ledger stayed empty on the day XP shipped because his first visit
 * of that UTC day had happened hours before the deploy.
 *
 * `xpDay.ts` had warned of precisely this in its own header since it was
 * written. The warning was not enough, because nothing ASKED the question: a
 * blank column and a chosen "UTC" produced the same day key, so no page could
 * tell them apart and nothing could go and find out.
 *
 * This is the asking, and `zoneGuess.ts` holds the order it asks in: a member
 * on rung 1 or 2 is never asked again, a member on the country guess or the bare
 * floor is, because a measurement beats an inference and anything beats nothing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND IT COSTS NOTHING
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The signed-in member's row — `currentMemberRow` — already selects `timeZone`,
 * `country` and `preferences`, where the zone's source is kept, and is `cache()`d
 * per request, so this is three fields off a row every page has read already: no
 * query, on any page, ever. It answers null for a signed-out reader and for the
 * operator without a member row, because there is no row to record a zone on —
 * and, since it reads the row the session names rather than an address, it asks
 * a member who came in with an invite code like anybody else.
 */

import { zoneSourceFrom, zoneStanding, worthAsking, type ZoneFrom } from "./zoneGuess";

import { currentMemberRow } from "./currentSession";

/** The zone in force for the signed-in member, and which rung it came from. Null for no row. */
export async function zoneStandingFor(): Promise<{ zone: string; from: ZoneFrom } | null> {
  const row = await currentMemberRow();
  if (row === null) return null;
  /* The source rides the same row: `preferences` is on the member row already. */
  return zoneStanding({ stored: row.timeZone, country: row.country, source: zoneSourceFrom(row.preferences) });
}

export async function dayZoneUnknown(): Promise<boolean> {
  const standing = await zoneStandingFor();
  if (standing === null) return false;
  return worthAsking(standing.from);
}
