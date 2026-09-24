import { describe, expect, it } from "vitest";

import { AGE_BANDS } from "./ageBand.constants";
import { asksWithheld, isChild, mayBeEmailed, mayEmailInvites, mayReach, showsLocalTime, showsPresence } from "./childRules";

const CHILD = AGE_BANDS.under13;

/** One case per rule, each for a child, a teenager, an adult and a member never asked (PRIV-03). */
describe("what changes for a member under 13", () => {
  it("is decided by the band and nothing else; a member never asked is not treated as a child", () => {
    expect(isChild(CHILD)).toBe(true);
    for (const band of [AGE_BANDS.teen, AGE_BANDS.adult, null, undefined, ""]) expect(isChild(band)).toBe(false);
  });

  it("keeps no city, country or bio, and lets an empty one through as a clearing", () => {
    expect(asksWithheld({ city: "Vancouver" })).toBe(true);
    expect(asksWithheld({ country: "CA" })).toBe(true);
    expect(asksWithheld({ bio: "I like Go" })).toBe(true);
    expect(asksWithheld({ city: "", country: "  ", bio: undefined })).toBe(false);
  });

  it("is reached only by their own buddies", () => {
    expect(mayReach(CHILD, false)).toBe(false);
    expect(mayReach(CHILD, true)).toBe(true);
    expect(mayReach(AGE_BANDS.teen, false)).toBe(true);
    expect(mayReach(null, false)).toBe(true);
  });

  it("is never shown as here, nor their local time, whatever the switch says", () => {
    expect(showsPresence({ showOnline: true, ageBand: CHILD })).toBe(false);
    expect(showsPresence({ showOnline: true, ageBand: AGE_BANDS.adult })).toBe(true);
    expect(showsPresence({ showOnline: false, ageBand: AGE_BANDS.adult })).toBe(false);
    expect(showsLocalTime(CHILD)).toBe(false);
    expect(showsLocalTime(null)).toBe(true);
  });

  it("is never emailed, and sends no invitation by email", () => {
    expect(mayBeEmailed(CHILD)).toBe(false);
    expect(mayEmailInvites(CHILD)).toBe(false);
    expect(mayBeEmailed(AGE_BANDS.teen)).toBe(true);
    expect(mayEmailInvites(null)).toBe(true);
  });
});
