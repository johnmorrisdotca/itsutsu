import { describe, expect, it } from "vitest";

import { standingsOf } from "./xpOfMembers";

/**
 * The pure half of the one read that fills the XP column on the tables built
 * from rating rows. The query itself is a `findMany` with a `select`; what is
 * worth pinning is what the map says about each kind of member, because a
 * table reads its dash or its number straight out of it.
 */
describe("standingsOf", () => {
  it("answers a person's total, nought included, keyed by their id", () => {
    const map = standingsOf([
      { id: "a", xp: 1_275, botTier: null },
      { id: "b", xp: 0, botTier: null },
    ]);
    expect(map.get("a")).toBe(1_275);
    // Nought is a number and prints as one — John: "Everyone is level 1 if 0xp."
    expect(map.get("b")).toBe(0);
  });

  it("answers null for a program, whatever its row stores", () => {
    /*
     * A program's cell is "–", never 0 and never "Lv 1". The rule is `xpShown`'s
     * and this must hand the whole member to it, `botTier` included: a map built
     * from the `xp` column alone would print a nought for Meijin.
     */
    const map = standingsOf([{ id: "bot", xp: 0, botTier: "dan" }]);
    expect(map.has("bot")).toBe(true);
    expect(map.get("bot")).toBeNull();
  });

  it("holds nothing for a member it was not handed", () => {
    // A rating row whose member is not in the map is a name with nobody behind
    // it; the caller reads `undefined` and prints the unclaimed-name dash.
    expect(standingsOf([]).get("nobody")).toBeUndefined();
  });
});
