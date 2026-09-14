import "server-only";

import type { Prisma } from "@prisma/client";

import { cleanPreferences, mergePreferences } from "@/lib/preferences/preferences";
import type { PreferencePatch } from "@/lib/preferences/preferences.types";
import { countryFrom } from "@/lib/social/countries";
import { COUNTRY_ZONES } from "@/lib/social/countryZones.constants";
import { XP_FALLBACK_ZONE, dayZoneFor } from "@/lib/xp/xpDay";

import { ZONE_SOURCE, type ZoneSource } from "./zoneSource.constants";

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
 * THE ZONE SAYS WHEN, AND ITS SOURCE SAYS WHO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `Member.timeZone` is the zone. Where it came from is `timeZoneFrom` in the
 * preferences registry, written by whatever writes the zone: `country` by a
 * sign-in's guess, `device` by the browser, `chosen` by the member's profile.
 * Nothing infers it. So:
 *
 * - Nothing usable stored → `floor`. Nobody has said anything.
 * - Source `chosen` or `device` → `member`. Both beat a guess, neither may be
 *   written over by anything automatic.
 * - Source `country` → `guessed`, so the browser may still replace it.
 *
 * **Rows with no source, and why they still compare.** Every row written before
 * sources existed has none, and no source is NOT KNOWN — not "chosen", not
 * "guessed". For those rows alone the old reading stands: a zone exactly equal
 * to the country's guess is taken as a guess, anything else as the member's own.
 * That is the residue of the old ambiguity, with its one wrong case — a member
 * who chose the very zone we would have guessed reads as a guess until the zone
 * is next written. It is deliberately not settled in bulk: writing `chosen` onto
 * those rows would be a judgement nobody made, and writing `country` would be
 * the bug itself. It disappears row by row, as each zone is next written and
 * gains a source.
 *
 * `server-only`, and that is not tidiness. `countryFrom` reads
 * `Intl.DisplayNames`, which Node and Chromium spell differently for four of
 * the 249 countries — so a client component calling this would resolve some
 * stored countries one way on the server and another after hydration, which is
 * the 0.146.1 fault exactly. `resolveCountry` exists for callers in the
 * browser; this is for the server, where the row is.
 *
 * Pure, and nothing in here reads a database: `memberZone.ts` asks the row.
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
 * Where a member's zone came from, as their preferences column records it, or
 * null when it does not say.
 *
 * Through `cleanPreferences`, never `preferencesFrom`: the filled-in view would
 * hand a row with no source the registry's fallback, and "not known" would read
 * as an answer. Null is the answer for every row written before sources existed.
 */
export function zoneSourceFrom(preferences: unknown): ZoneSource | null {
  return cleanPreferences(preferences).timeZoneFrom ?? null;
}

/**
 * The zone a member's days are reckoned in now, and how it got there.
 *
 * What every surface should read: `zone` to count days with, `from` to know
 * whether to say so, ask the browser, or leave well alone. `source` is the
 * recorded one — pass what `zoneSourceFrom` answers, null included.
 */
export function zoneStanding({
  stored,
  country,
  source = null,
}: {
  stored: string | null | undefined;
  country: string | null | undefined;
  source?: ZoneSource | null;
}): { zone: string; from: ZoneFrom } {
  const held = dayZoneFor(stored);
  /* A zone the platform cannot read counts nobody's days, whoever wrote it, so it
     is the floor — and the browser may fill it. The profile refuses such a zone
     when it is saved, so this is a zone the platform stopped knowing, not a
     choice the site is ignoring. */
  if (!held.theirs) return { zone: XP_FALLBACK_ZONE, from: ZONE_FROM.floor };
  if (source === ZONE_SOURCE.chosen || source === ZONE_SOURCE.device) {
    return { zone: held.zone, from: ZONE_FROM.member };
  }
  if (source === ZONE_SOURCE.country) return { zone: held.zone, from: ZONE_FROM.guessed };
  /* No source: a row from before sources were recorded. The old comparison, and
     only here — see "Rows with no source" above. */
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
 * What a sign-in writes about the zone: the country's guess AND that it is one,
 * or null to write nothing.
 *
 * The two travel together or not at all. A guess written without its source is
 * a row that has to be compared to be read, which is the ambiguity this closes;
 * the source is laid over the preferences the row already holds, so every other
 * preference stays where it was. Shaped as the columns `admitMember` spreads
 * into the update it was making anyway.
 */
export function zoneAssignment({
  stored,
  country,
  preferences,
}: {
  stored: string | null | undefined;
  country: string | null | undefined;
  preferences: unknown;
}): { timeZone: string; preferences: Prisma.InputJsonObject } | null {
  const guess = zoneToAssign({ stored, country });
  if (guess === null) return null;
  const merged = mergePreferences(preferences, { timeZoneFrom: ZONE_SOURCE.country });
  return { timeZone: guess, preferences: merged as Prisma.InputJsonObject };
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

/** What `/api/me` may do with a zone it has been sent: the source to record beside it, or why not. */
export type ZoneWrite =
  | { ok: true; patch: PreferencePatch }
  | { ok: false; status: 400 | 409; problem: string };

/**
 * How a profile write records where its zone came from — or refuses.
 *
 * A zone arriving through `/api/me` is the member's choice, unless the request
 * says it is a device reporting (`timeZoneFrom: "device"`, which only
 * `DeviceTimeZone` sends). The two are not alike:
 *
 * - **Chosen** is always taken, over anything, because it is the member's own
 *   door. A cleared zone forgets its source too — "never said" is got back to
 *   whole, and the rungs below may speak again.
 * - **Device** is taken only where `worthAsking` would have asked — the SAME
 *   rule `LearnTimeZone` mounts the sender by, so what the page offers and what
 *   the server accepts cannot disagree. Refused with 409 otherwise: a page
 *   rendered before the member chose, a second tab, a race with their own save.
 *   The browser swallows the refusal, and the choice stands.
 *
 * And the source is never taken on its own, through the registry, because a
 * record of where a zone came from that no zone came with records nothing.
 *
 * Decided before anything is written, so a refusal half-applies nothing.
 */
export function zoneWrite({
  asked,
  from,
  preferences,
  row,
}: {
  /** The `timeZone` in the request, already trimmed; undefined when it has none. */
  asked: string | undefined;
  /** The `timeZoneFrom` in the request. */
  from: typeof ZONE_SOURCE.device | undefined;
  /** The registry change the same request asked for, if any. */
  preferences: PreferencePatch | null;
  row: { timeZone: string | null; country: string | null; preferences: unknown };
}): ZoneWrite {
  if (preferences !== null && preferences.timeZoneFrom !== undefined) {
    return { ok: false, status: 400, problem: "Where a time zone came from is recorded with the zone, not set on its own." };
  }
  if (asked === undefined) {
    if (from !== undefined) return { ok: false, status: 400, problem: "A time zone's source needs the time zone." };
    return { ok: true, patch: {} };
  }
  if (from === ZONE_SOURCE.device) {
    if (asked === "") return { ok: false, status: 400, problem: "A device that reports no time zone has nothing to record." };
    const standing = zoneStanding({ stored: row.timeZone, country: row.country, source: zoneSourceFrom(row.preferences) });
    if (!worthAsking(standing.from)) {
      return { ok: false, status: 409, problem: "This time zone is the member's own; a device does not write over it." };
    }
    return { ok: true, patch: { timeZoneFrom: ZONE_SOURCE.device } };
  }
  return { ok: true, patch: { timeZoneFrom: asked === "" ? null : ZONE_SOURCE.chosen } };
}
