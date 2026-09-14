import { describe, expect, it } from "vitest";

import { DIRECTORY_WHO } from "@/lib/rating/directoryFilter";

import { XP_WHO_DEFAULT, askedXpWho, xpWhoHref, xpWhoWhere } from "./xpWho";

describe("who the XP board is about, as the address asks", () => {
  it("reads the three choices the players page offers, and nothing else", () => {
    expect(askedXpWho({ who: "people" })).toBe(DIRECTORY_WHO.people);
    expect(askedXpWho({ who: "computers" })).toBe(DIRECTORY_WHO.computers);
    expect(askedXpWho({ who: "everyone" })).toBe(DIRECTORY_WHO.everyone);
    expect(askedXpWho({ who: ["computers", "people"] })).toBe(DIRECTORY_WHO.computers);
  });

  it("says nothing was asked for an address that names no who, or one this board does not offer", () => {
    // Null rather than the default: nothing said is what lets the remembered answer stand.
    expect(askedXpWho({})).toBeNull();
    expect(askedXpWho({ who: "robots" })).toBeNull();
    expect(askedXpWho({ who: "" })).toBeNull();
  });

  it("defaults to everyone, as the players page does", () => {
    expect(XP_WHO_DEFAULT).toBe(DIRECTORY_WHO.everyone);
  });
});

describe("the narrowing as the database applies it", () => {
  it("is a where on the engine name, and nothing at all for everyone", () => {
    expect(xpWhoWhere(DIRECTORY_WHO.people)).toEqual({ botTier: null });
    expect(xpWhoWhere(DIRECTORY_WHO.computers)).toEqual({ botTier: { not: null } });
    expect(xpWhoWhere(DIRECTORY_WHO.everyone)).toEqual({});
  });
});

describe("a chip's address", () => {
  it("keeps the sort, drops the cursor and the count-from, and always names the who", () => {
    expect(xpWhoHref("/xp", "sort=name&cursor=abc&from=25", DIRECTORY_WHO.people)).toBe("/xp?sort=name&who=people");
    expect(xpWhoHref("/xp", "", DIRECTORY_WHO.everyone)).toBe("/xp?who=everyone");
    expect(xpWhoHref("/xp/levels/5", "", DIRECTORY_WHO.computers)).toBe("/xp/levels/5?who=computers");
  });

  it("replaces a who already in the address rather than adding a second", () => {
    expect(xpWhoHref("/xp", "who=people", DIRECTORY_WHO.computers)).toBe("/xp?who=computers");
  });
});
