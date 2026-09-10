import { describe, expect, it } from "vitest";

import {
  RATING_POOLS,
  RATING_POOL_DISPLAY,
  RATING_POOL_LIST,
  poolFor,
} from "./pools";

describe("which pool a game moves", () => {
  it("puts a game against a person on the ladder and one against a computer beside it", () => {
    expect(poolFor(false)).toBe(RATING_POOLS.people);
    expect(poolFor(true)).toBe(RATING_POOLS.computer);
  });

  it("says both pools in words, so no page has to invent them", () => {
    for (const pool of RATING_POOL_LIST) {
      const display = RATING_POOL_DISPLAY[pool];
      expect(display.label.length).toBeGreaterThan(0);
      expect(display.kanji.length).toBeGreaterThan(0);
      expect(display.blurb.length).toBeGreaterThan(10);
    }
  });
});

