import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST } from "./gomoku.constants";
import { GAME_SLUGS, gamePath, matchPath, recordPath, seatPath, slugFor, variantFor } from "./slugs";

describe("game slugs", () => {
  it("gives every variant a slug of its own", () => {
    const slugs = RULE_VARIANT_LIST.map(slugFor);
    expect(new Set(slugs).size).toBe(RULE_VARIANT_LIST.length);
  });

  it("reads like an address: lowercase letters, digits and hyphens only", () => {
    for (const slug of Object.values(GAME_SLUGS)) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("round-trips", () => {
    for (const variant of RULE_VARIANT_LIST) {
      expect(variantFor(slugFor(variant))).toBe(variant);
    }
  });

  it("names plain gomoku by the name people know", () => {
    expect(variantFor("gomoku")).toBe("freestyle");
  });

  it("names nothing for an address that is not a game", () => {
    expect(variantFor("freestyle")).toBeNull();
    expect(variantFor("")).toBeNull();
    expect(variantFor("Gomoku")).toBeNull();
  });

  it("builds the paths a match lives at", () => {
    expect(gamePath("freestyle")).toBe("/games/gomoku");
    expect(matchPath("dropFour", "abc")).toBe("/games/drop-four/abc");
    expect(matchPath("dropFour", "abc", 12)).toBe("/games/drop-four/abc/12");
    expect(seatPath("renju", "abc", "tok")).toBe("/games/renju/abc/seat/tok");
    expect(recordPath("abc")).toBe("/history/abc");
    expect(recordPath("abc", 5)).toBe("/history/abc/5");
  });
});
