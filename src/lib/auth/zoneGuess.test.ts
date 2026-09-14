import { describe, expect, it } from "vitest";

import { COUNTRY_ZONES } from "@/lib/social/countryZones.constants";
import { XP_FALLBACK_ZONE } from "@/lib/xp/xpDay";

import { mergePreferences } from "@/lib/preferences/preferences";

import {
  ZONE_FROM,
  worthAsking,
  zoneAssignment,
  zoneForCountry,
  zoneSourceFrom,
  zoneStanding,
  zoneToAssign,
  zoneWrite,
  type ZoneWrite,
} from "./zoneGuess";
import { ZONE_SOURCE } from "./zoneSource.constants";

/**
 * WHEN A MEMBER'S DAY ENDS, AND WHICH ANSWER WINS.
 *
 * One case per rung and one case per pair of rungs, because the bug this comes
 * from was not a wrong zone — it was a site that could not tell a chosen zone
 * from a blank column, so it could neither say which it had nor go and find out.
 * Every case below is about that distinction rather than about arithmetic.
 */

describe("the guess from a country", () => {
  it("is exact where a country has one zone", () => {
    expect(zoneForCountry("Japan")).toBe("Asia/Tokyo");
    expect(zoneForCountry("Estonia")).toBe("Europe/Tallinn");
  });

  it("reads the column as the free text it is", () => {
    // `Member.country` has always been free text: people type what they like.
    expect(zoneForCountry("japan")).toBe("Asia/Tokyo");
    expect(zoneForCountry("  JP  ")).toBe("Asia/Tokyo");
    // Accents off, so the form somebody types without them still resolves.
    expect(zoneForCountry("Cote d'Ivoire")).toBe("Africa/Abidjan");
    expect(zoneForCountry("USA")).toBe("America/New_York");
  });

  it("answers nothing rather than inventing a day boundary", () => {
    expect(zoneForCountry("")).toBeNull();
    expect(zoneForCountry(null)).toBeNull();
    expect(zoneForCountry("Nowhere At All")).toBeNull();
    // Nobody lives on Bouvet Island and CLDR names no zone for it.
    expect(COUNTRY_ZONES.BV).toBeUndefined();
  });

  it("is a guess for a country with several, and gets the owner's own wrong", () => {
    /*
     * Written down as a case rather than only as a comment. Canada has
     * twenty-three zones, the guess is Ontario's because Ontario holds the most
     * people, and John is three hours west of it. A test that quietly expected
     * "America/Vancouver" here would be asserting a table that does not exist.
     */
    expect(zoneForCountry("Canada")).toBe("America/Toronto");
    expect(zoneForCountry("United States")).toBe("America/New_York");
  });

  it("names a zone the platform can actually use, for every row", () => {
    /* A typo in the table would be a member whose day key silently falls back to
       UTC for ever — the original bug, wearing a country. */
    for (const zone of Object.values(COUNTRY_ZONES)) {
      expect(() => new Intl.DateTimeFormat("en-CA", { timeZone: zone })).not.toThrow();
    }
  });
});

describe("which rung the zone in force came from", () => {
  it("floor: nothing said at all", () => {
    expect(zoneStanding({ stored: "", country: "" })).toEqual({
      zone: XP_FALLBACK_ZONE,
      from: ZONE_FROM.floor,
    });
  });

  it("floor: a country we could guess from, but nothing written on the row yet", () => {
    // The guess is not the zone in force until somebody writes it.
    expect(zoneStanding({ stored: "", country: "Canada" }).from).toBe(ZONE_FROM.floor);
  });

  it("guessed: the row holds exactly what the country would have given", () => {
    expect(zoneStanding({ stored: "America/Toronto", country: "Canada" })).toEqual({
      zone: "America/Toronto",
      from: ZONE_FROM.guessed,
    });
  });

  it("member: the row holds something else, so somebody said it or measured it", () => {
    expect(zoneStanding({ stored: "America/Vancouver", country: "Canada" })).toEqual({
      zone: "America/Vancouver",
      from: ZONE_FROM.member,
    });
  });

  it("member: UTC they chose themselves is a choice, not the floor", () => {
    /*
     * The whole reason `dayZoneFor` carries `theirs`. These two produce the same
     * day key and are not the same fact, and before the distinction existed a
     * member who deliberately set UTC was indistinguishable from one who had
     * never opened their profile.
     */
    expect(zoneStanding({ stored: "UTC", country: "" }).from).toBe(ZONE_FROM.member);
    expect(zoneStanding({ stored: "", country: "" }).from).toBe(ZONE_FROM.floor);
  });

  it("floor: a zone no platform knows is no better than none", () => {
    expect(zoneStanding({ stored: "Mars/Olympus", country: "" })).toEqual({
      zone: XP_FALLBACK_ZONE,
      from: ZONE_FROM.floor,
    });
  });
});

describe("the browser is asked only where it can improve on what we have", () => {
  it("is asked on the floor and on a guess", () => {
    expect(worthAsking(ZONE_FROM.floor)).toBe(true);
    expect(worthAsking(ZONE_FROM.guessed)).toBe(true);
  });

  it("is never asked once the answer is the member's own", () => {
    /* Rung 1 and rung 2 are both "do not touch this". A measurement beats an
       inference; nothing beats either. */
    expect(worthAsking(ZONE_FROM.member)).toBe(false);
  });
});

describe("what a sign-in writes", () => {
  it("assigns the country's guess into an empty column", () => {
    expect(zoneToAssign({ stored: "", country: "Japan" })).toBe("Asia/Tokyo");
    expect(zoneToAssign({ stored: null, country: "Canada" })).toBe("America/Toronto");
  });

  it("writes nothing at all over a zone the member chose", () => {
    // The one promise this must never break, on the one path that writes daily.
    expect(zoneToAssign({ stored: "America/Vancouver", country: "Canada" })).toBeNull();
  });

  it("writes nothing over a zone their browser measured", () => {
    expect(zoneToAssign({ stored: "Asia/Tokyo", country: "" })).toBeNull();
  });

  it("writes nothing over its own earlier guess: once, not every sign-in", () => {
    /* `admitMember` runs this on every sign-in, so "already done" has to be
       free. A guess that rewrote itself daily would be a write per sign-in for
       no change. */
    expect(zoneToAssign({ stored: "America/Toronto", country: "Canada" })).toBeNull();
  });

  it("leaves the floor alone when there is nothing to guess from", () => {
    expect(zoneToAssign({ stored: "", country: "" })).toBeNull();
    expect(zoneToAssign({ stored: "", country: "Nowhere At All" })).toBeNull();
  });
});

describe("where the zone came from, read from the row rather than inferred", () => {
  it("reads a recorded source, and nothing else", () => {
    expect(zoneSourceFrom({ timeZoneFrom: "chosen" })).toBe(ZONE_SOURCE.chosen);
    expect(zoneSourceFrom({ timeZoneFrom: "device", language: "ja" })).toBe(ZONE_SOURCE.device);
    expect(zoneSourceFrom({ timeZoneFrom: "country" })).toBe(ZONE_SOURCE.country);
  });

  it("answers null — not the registry's fallback — for a row that does not say", () => {
    /* "Not known" must not read as "chosen". Every row from before sources existed
       is this case, and it is the one that still compares. */
    expect(zoneSourceFrom(null)).toBeNull();
    expect(zoneSourceFrom({})).toBeNull();
    expect(zoneSourceFrom({ timeZoneFrom: "guessed" })).toBeNull();
    expect(zoneSourceFrom(["chosen"])).toBeNull();
  });

  it("chosen: a zone equal to the country's guess is the member's own, when they chose it", () => {
    // THE ROW THIS FIXES. Under the comparison alone it read as `guessed`.
    expect(zoneStanding({ stored: "America/Toronto", country: "Canada", source: ZONE_SOURCE.chosen })).toEqual({
      zone: "America/Toronto",
      from: ZONE_FROM.member,
    });
  });

  it("device: a measured zone is the member's own, whatever the country guesses", () => {
    expect(zoneStanding({ stored: "America/Toronto", country: "Canada", source: ZONE_SOURCE.device }).from).toBe(
      ZONE_FROM.member,
    );
  });

  it("country: a recorded guess is a guess, even once the country has moved on", () => {
    // Guessed from Canada at sign-in, country since changed: still nobody's choice.
    expect(zoneStanding({ stored: "America/Toronto", country: "Japan", source: ZONE_SOURCE.country }).from).toBe(
      ZONE_FROM.guessed,
    );
  });

  it("floor: a zone the platform cannot read counts nobody's days, whoever wrote it", () => {
    expect(zoneStanding({ stored: "Mars/Olympus", country: "", source: ZONE_SOURCE.chosen })).toEqual({
      zone: XP_FALLBACK_ZONE,
      from: ZONE_FROM.floor,
    });
  });

  it("no source: behaves exactly as it did before sources were recorded", () => {
    /* The residue of the old ambiguity, kept only for rows that cannot say. The
       cases in "which rung the zone in force came from" above pass no source at
       all and are unchanged; these say the same with null written out. */
    expect(zoneStanding({ stored: "America/Toronto", country: "Canada", source: null }).from).toBe(ZONE_FROM.guessed);
    expect(zoneStanding({ stored: "America/Vancouver", country: "Canada", source: null }).from).toBe(ZONE_FROM.member);
    expect(zoneStanding({ stored: "", country: "Canada", source: null }).from).toBe(ZONE_FROM.floor);
  });
});

/**
 * THE LADDER, WRITE BY WRITE: chosen beats device beats country beats UTC.
 *
 * A row is carried through the same decisions the site makes — a sign-in's
 * assignment, a device's report, a profile save — so each case is a sequence a
 * member could actually live through, and "beats" means "may write over".
 */
type Row = { timeZone: string; country: string; preferences: unknown };

function device(row: Row, zone: string): ZoneWrite {
  return zoneWrite({ asked: zone, from: ZONE_SOURCE.device, preferences: null, row });
}

function chosen(row: Row, zone: string): ZoneWrite {
  return zoneWrite({ asked: zone, from: undefined, preferences: null, row });
}

/** The row after a write the route accepted: the zone, and its source laid over the column. */
function after(row: Row, zone: string, write: ZoneWrite): Row {
  if (!write.ok) throw new Error(`refused: ${write.problem}`);
  return { ...row, timeZone: zone, preferences: mergePreferences(row.preferences, write.patch) };
}

function signIn(row: Row): Row {
  const assigned = zoneAssignment({ stored: row.timeZone, country: row.country, preferences: row.preferences });
  return assigned === null ? row : { ...row, ...assigned };
}

describe("chosen beats device beats country beats UTC", () => {
  it("UTC gives way to a country's guess, which records that it is one", () => {
    const floor: Row = { timeZone: "", country: "Canada", preferences: null };
    expect(zoneStanding({ stored: floor.timeZone, country: floor.country }).zone).toBe(XP_FALLBACK_ZONE);
    const guessed = signIn(floor);
    expect(guessed.timeZone).toBe("America/Toronto");
    expect(zoneSourceFrom(guessed.preferences)).toBe(ZONE_SOURCE.country);
  });

  it("a country's guess is replaced by the device ONCE, and then left alone", () => {
    const guessed = signIn({ timeZone: "", country: "Canada", preferences: null });

    const first = device(guessed, "America/Vancouver");
    expect(first).toEqual({ ok: true, patch: { timeZoneFrom: ZONE_SOURCE.device } });
    const measured = after(guessed, "America/Vancouver", first);

    // Learned once: a later trip does not move it, and a sign-in guesses nothing over it.
    expect(device(measured, "Europe/London")).toMatchObject({ ok: false, status: 409 });
    expect(signIn(measured)).toEqual(measured);
  });

  it("a device's zone gives way to the member, and the member's does not give way back", () => {
    const measured: Row = { timeZone: "Asia/Tokyo", country: "", preferences: { timeZoneFrom: "device" } };
    const write = chosen(measured, "Asia/Seoul");
    expect(write).toEqual({ ok: true, patch: { timeZoneFrom: ZONE_SOURCE.chosen } });
    expect(device(after(measured, "Asia/Seoul", write), "Asia/Tokyo")).toMatchObject({ ok: false, status: 409 });
  });

  it("a CHOSEN zone equal to the country's guess is never overwritten by a different device zone", () => {
    /* The filed row, whole. Guessed from Canada at sign-in; the member, in Toronto,
       presses "use this device's" — the same zone — and saves; then travels. */
    const guessed = signIn({ timeZone: "", country: "Canada", preferences: null });
    const mine = after(guessed, "America/Toronto", chosen(guessed, "America/Toronto"));
    expect(zoneSourceFrom(mine.preferences)).toBe(ZONE_SOURCE.chosen);

    expect(device(mine, "America/Vancouver")).toMatchObject({ ok: false, status: 409 });
    expect(signIn(mine)).toEqual(mine);
    expect(zoneStanding({ stored: mine.timeZone, country: mine.country, source: zoneSourceFrom(mine.preferences) })).toEqual({
      zone: "America/Toronto",
      from: ZONE_FROM.member,
    });
  });

  it("the member may always write, over any rung", () => {
    for (const preferences of [null, { timeZoneFrom: "country" }, { timeZoneFrom: "device" }, { timeZoneFrom: "chosen" }]) {
      expect(chosen({ timeZone: "America/Toronto", country: "Canada", preferences }, "Asia/Tokyo")).toEqual({
        ok: true,
        patch: { timeZoneFrom: ZONE_SOURCE.chosen },
      });
    }
  });

  it("clearing the zone forgets its source, so the rungs below may speak again", () => {
    const mine: Row = { timeZone: "Asia/Tokyo", country: "Japan", preferences: { timeZoneFrom: "chosen", language: "ja" } };
    const cleared = after(mine, "", chosen(mine, ""));
    expect(cleared.preferences).toEqual({ language: "ja" });
    expect(signIn(cleared).timeZone).toBe("Asia/Tokyo");
    expect(device(cleared, "Asia/Tokyo")).toMatchObject({ ok: true });
  });
});

describe("a row with no source, as every row before this was", () => {
  it("lets the device replace a zone equal to the country's guess, as it always did", () => {
    const old: Row = { timeZone: "America/Toronto", country: "Canada", preferences: { language: "en" } };
    expect(device(old, "America/Vancouver")).toEqual({ ok: true, patch: { timeZoneFrom: ZONE_SOURCE.device } });
  });

  it("refuses the device over any other zone, as it always did", () => {
    expect(device({ timeZone: "America/Vancouver", country: "Canada", preferences: null }, "Asia/Tokyo")).toMatchObject({
      ok: false,
      status: 409,
    });
  });

  it("gains a source only when its zone is next written, never in bulk", () => {
    // A sign-in over a usable zone writes nothing at all — not even a source.
    const old: Row = { timeZone: "America/Toronto", country: "Canada", preferences: null };
    expect(zoneAssignment({ stored: old.timeZone, country: old.country, preferences: old.preferences })).toBeNull();
  });
});

describe("what the route refuses, before anything is written", () => {
  const row: Row = { timeZone: "", country: "", preferences: null };

  it("a source asked for on its own, through the registry", () => {
    expect(zoneWrite({ asked: undefined, from: undefined, preferences: { timeZoneFrom: "chosen" }, row })).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("a device's word with no zone beside it, and a device reporting none", () => {
    expect(zoneWrite({ asked: undefined, from: ZONE_SOURCE.device, preferences: null, row })).toMatchObject({ ok: false, status: 400 });
    expect(device(row, "")).toMatchObject({ ok: false, status: 400 });
  });

  it("says nothing about a request that sent no zone at all", () => {
    expect(zoneWrite({ asked: undefined, from: undefined, preferences: { language: "ja" }, row })).toEqual({ ok: true, patch: {} });
  });
});

describe("what a sign-in writes, with its source", () => {
  it("keeps every other preference where it was, and leaves its input untouched", () => {
    const preferences = { language: "ja", xpWho: "computers" };
    const assigned = zoneAssignment({ stored: "", country: "Japan", preferences });
    expect(assigned).toEqual({
      timeZone: "Asia/Tokyo",
      preferences: { language: "ja", xpWho: "computers", timeZoneFrom: "country" },
    });
    expect(preferences).toEqual({ language: "ja", xpWho: "computers" });
  });

  it("writes neither zone nor source where there is nothing to guess from", () => {
    expect(zoneAssignment({ stored: "", country: "", preferences: null })).toBeNull();
  });
});
