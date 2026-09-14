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
      { id: "a", xp: 1_275 },
      { id: "b", xp: 0 },
    ]);
    expect(map.get("a")).toBe(1_275);
    // Nought is a number and prints as one — John: "Everyone is level 1 if 0xp."
    expect(map.get("b")).toBe(0);
  });

  it("answers a program's total like anyone's — a nought is a nought", () => {
    // A program's cell used to be "–" whatever its row stored. John: "bots
    // don't have XP" — they do now, from their games, and the map says so.
    const map = standingsOf([{ id: "bot", xp: 0 }]);
    expect(map.has("bot")).toBe(true);
    expect(map.get("bot")).toBe(0);
  });

  it("holds nothing for a member it was not handed", () => {
    // A rating row whose member is not in the map is a name with nobody behind
    // it; the caller reads `undefined` and prints the unclaimed-name dash.
    expect(standingsOf([]).get("nobody")).toBeUndefined();
  });
});
