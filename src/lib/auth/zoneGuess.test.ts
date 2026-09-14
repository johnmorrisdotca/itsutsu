import { describe, expect, it } from "vitest";

import { COUNTRY_ZONES } from "@/lib/social/countryZones.constants";
import { XP_FALLBACK_ZONE } from "@/lib/xp/xpDay";

import { ZONE_FROM, worthAsking, zoneForCountry, zoneStanding, zoneToAssign } from "./zoneGuess";

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
