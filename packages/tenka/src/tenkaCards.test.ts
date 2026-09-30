import { describe, expect, it } from "vitest";

import { TENKA_DECK, cardKind, cardTerritory, isSet, isWild, setsIn, tradeValue } from "./tenkaCards.ts";

/** Tenka's cards: a card for every territory in three kinds, two wild, sets of three, and what a set is worth. */

// Cards 0, 3, 6 are land; 1, 4, 7 sea; 2, 5, 8 air (dealt round the map in turn). 42 and 43 are wild.
const LAND = [0, 3, 6];
const SEA = [1, 4, 7];
const AIR = [2, 5, 8];

describe("the cards", () => {
  it("are forty-two territories' and two wild, fourteen of each kind", () => {
    expect(TENKA_DECK.length).toBe(44);
    const kinds = TENKA_DECK.map(cardKind);
    expect(kinds.filter((kind) => kind === "land").length).toBe(14);
    expect(kinds.filter((kind) => kind === "sea").length).toBe(14);
    expect(kinds.filter((kind) => kind === "air").length).toBe(14);
    expect(kinds.filter((kind) => kind === "wild").length).toBe(2);
    expect(isWild(42) && isWild(43)).toBe(true);
    expect(cardTerritory(17)).toBe(17);
    expect(cardTerritory(43)).toBeNull();
  });

  it("make a set three alike, one of each, or any two with a wild card", () => {
    expect(isSet(LAND)).toBe(true);
    expect(isSet(SEA)).toBe(true);
    expect(isSet([0, 1, 2])).toBe(true);
    expect(isSet([0, 1, 42])).toBe(true);
    expect(isSet([0, 3, 42])).toBe(true);
    expect(isSet([0, 42, 43])).toBe(true);
    expect(isSet([0, 3, 1])).toBe(false);
    expect(isSet([AIR[0], AIR[1], SEA[0]])).toBe(false);
    // Not three, or not three different cards.
    expect(isSet([0, 1])).toBe(false);
    expect(isSet([0, 0, 0])).toBe(false);
    expect(isSet([0, 1, 2, 3])).toBe(false);
  });

  it("finds every set in a hand", () => {
    expect(setsIn([0, 3, 1])).toEqual([]);
    expect(setsIn([0, 3, 6])).toEqual([[0, 3, 6]]);
    expect(setsIn([6, 3, 0, 1])).toEqual([[0, 3, 6]]);
    expect(setsIn([0, 1, 2, 3])).toEqual([
      [0, 1, 2],
      [1, 2, 3],
    ]);
    // Five cards always hold a set: that is why five must be traded.
    for (let a = 0; a < 44; a += 7) expect(setsIn([a % 44, (a + 1) % 44, (a + 3) % 44, (a + 4) % 44, (a + 6) % 44]).length).toBeGreaterThan(0);
  });

  it("trade on the escalating schedule: 4, 6, 8, 10, 12, 15, then five more each", () => {
    expect(Array.from({ length: 9 }, (_, trades) => tradeValue(trades))).toEqual([4, 6, 8, 10, 12, 15, 20, 25, 30]);
  });
});
