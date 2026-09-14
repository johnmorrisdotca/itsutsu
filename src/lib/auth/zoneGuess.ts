import "server-only";

import { countryFrom } from "@/lib/social/countries";
import { COUNTRY_ZONES } from "@/lib/social/countryZones.constants";
import { XP_FALLBACK_ZONE, dayZoneFor } from "@/lib/xp/xpDay";

/**
 * WHEN DOES THIS MEMBER'S DAY END, AND HOW SURE ARE WE.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FOUR RUNGS, IN THIS ORDER, AND THE ORDER IS THE WHOLE RULE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. **A zone the member chose themselves.** Never overwritten, by anything.
 * 2. **The zone their browser reports**, learned once — see `DeviceTimeZone`.
 *    It beats a guess because it is a measurement and a guess is an inference.
 * 3. **A best guess from their country**, assigned where a member has a country
 *    and no zone. `COUNTRY_ZONES` carries the table and names the case it gets
 *    wrong (Canada, and the owner is in it).
 * 4. **UTC**, the floor, for a member with no zone, no browser answer and no
 *    country.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ONE COLUMN, THREE MEANINGS, AND HOW THEY ARE TOLD APART
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `Member.timeZone` is one string and there is no migration here to add a
 * second column saying where it came from — so provenance is DERIVED rather
 * than stored, by comparing what the row holds with what we would have guessed:
 *
 * - Nothing usable stored → `floor`. Nobody has said anything.
 * - Stored, and it is exactly the country's guess → `guessed`. Indistinguishable
 *   from something we wrote ourselves, so the browser is still allowed to
 *   replace it with a measurement.
 * - Stored, and it is anything else → `member`. Either they chose it or their
 *   browser reported it; both are better than a guess and neither may be
 *   overwritten.
 *
 * **The one case this cannot tell apart, said plainly.** A member whose country
 * is Canada who deliberately chooses `America/Toronto` — the very zone we would
 * have guessed — reads as `guessed`, so a later visit from a different zone will
 * let their browser move it. Nothing they can see changes unless they have
 * actually travelled, and their next save wins; but it is not the same promise
 * as rung 1, and pretending otherwise would be worse than writing it down. The
 * honest fix is a stored provenance — one key in the `preferences` registry,
 * which needs no migration either — and it is deliberately not done here
 * because it belongs with whoever next opens that registry.
 *
 * Pure, and nothing in here reads a database: `memberZone.ts` asks the row.
 *
 * `server-only`, and that is not tidiness. `countryFrom` reads
 * `Intl.DisplayNames`, which Node and Chromium spell differently for four of
 * the 249 countries — so a client component calling this would resolve some
 * stored countries one way on the server and another after hydration, which is
 * the 0.146.1 fault exactly. `resolveCountry` exists for callers in the
 * browser; this is for the server, where the row is.
 */

/** Which of the four rungs the zone in force came from. */
export const ZONE_FROM = {
  /** Chosen by the member, or measured by their own browser. */
  member: "member",
  /** Inferred from their country, and replaceable by a measurement. */
  guessed: "guessed",
  /** Nothing has been said at all. */
  floor: "floor",
} as const;

export type ZoneFrom = (typeof ZONE_FROM)[keyof typeof ZONE_FROM];

/**
 * The zone to guess for a country as it is WRITTEN ON A PROFILE, or null.
 *
 * The column is free text — "Canada", "canada", "CA", "Côte d'Ivoire" — so it
 * goes through `countryFrom`, which is the site's one reader of that field and
 * already folds accents and aliases. Null for anything it cannot resolve and for
 * the two codes nobody lives in: a country we cannot place is not a reason to
 * invent a day boundary.
 */
export function zoneForCountry(written: string | null | undefined): string | null {
  const country = countryFrom(written?.trim() ?? "");
  if (country === null) return null;
  return COUNTRY_ZONES[country.code] ?? null;
}

/**
 * The zone a member's days are reckoned in now, and how it got there.
 *
 * What every surface should read: `zone` to count days with, `from` to know
 * whether to say so, ask the browser, or leave well alone.
 */
export function zoneStanding({
  stored,
  country,
}: {
  stored: string | null | undefined;
  country: string | null | undefined;
}): { zone: string; from: ZoneFrom } {
  const held = dayZoneFor(stored);
  if (!held.theirs) return { zone: XP_FALLBACK_ZONE, from: ZONE_FROM.floor };
  const guess = zoneForCountry(country);
  if (guess !== null && guess === stored?.trim()) {
    return { zone: held.zone, from: ZONE_FROM.guessed };
  }
  return { zone: held.zone, from: ZONE_FROM.member };
}

/**
 * The zone to write onto a row that is being saved anyway, or null to leave the
 * column exactly as it is.
 *
 * Rung 3, and it is only ever an ASSIGNMENT into emptiness — never an overwrite.
 * A row that already holds anything the platform can read is left alone, which
 * is what makes this safe to call on every sign-in: it can do nothing the second
 * time, and nothing at all to a member who has spoken for themselves.
 */
export function zoneToAssign({
  stored,
  country,
}: {
  stored: string | null | undefined;
  country: string | null | undefined;
}): string | null {
  if (dayZoneFor(stored).theirs) return null;
  return zoneForCountry(country);
}

/**
 * Whether the browser is worth asking: nothing said, or only guessed.
 *
 * Rung 2 beating rung 3 is this one line. A member on `member` is never asked,
 * so a measurement or a choice can never be written over by a later visit.
 */
export function worthAsking(from: ZoneFrom): boolean {
  return from !== ZONE_FROM.member;
}
