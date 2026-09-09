import { describe, expect, it } from "vitest";

import { RATING_START } from "./elo";
import {
  EMPTY_STANDING,
  RATING_POOLS,
  RATING_POOL_DISPLAY,
  RATING_POOL_LIST,
  combinedStanding,
  combinedTier,
  poolFor,
} from "./pools";
import type { PoolStanding } from "./pools";

const standing = (over: Partial<PoolStanding>): PoolStanding => ({ ...EMPTY_STANDING, ...over });

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

describe("the two pools read as one figure", () => {
  it("is the starting rating for somebody who has played nothing", () => {
    const both = combinedStanding(EMPTY_STANDING, EMPTY_STANDING);
    expect(both.rating).toBe(RATING_START);
    expect(both.ratedGames).toBe(0);
  });

  it("is the ladder rating for somebody who has only played people", () => {
    const both = combinedStanding(standing({ rating: 1750, ratedGames: 30 }), EMPTY_STANDING);
    expect(both.rating).toBe(1750);
    expect(both.ratedGames).toBe(30);
  });

  it("is the computer rating for somebody who has only played the computer", () => {
    const both = combinedStanding(EMPTY_STANDING, standing({ rating: 1420, ratedGames: 12 }));
    expect(both.rating).toBe(1420);
  });

  it("leans towards the pool with the games in it, not towards the middle", () => {
    // Forty games against people at 1800, two against the computer at 1200.
    const both = combinedStanding(
      standing({ rating: 1800, ratedGames: 40 }),
      standing({ rating: 1200, ratedGames: 2 }),
    );
    expect(both.rating).toBe(Math.round((1800 * 40 + 1200 * 2) / 42));
    expect(both.rating).toBeGreaterThan(1770);
  });

  it("adds up the games themselves, because both pools happened", () => {
    const both = combinedStanding(
      standing({ ratedGames: 6, wins: 4, losses: 1, draws: 1 }),
      standing({ ratedGames: 5, wins: 1, losses: 3, draws: 1 }),
    );
    expect(both).toMatchObject({ ratedGames: 11, wins: 5, losses: 4, draws: 2 });
  });

  it("settles a rating on the games in both pools together", () => {
    // Two games in each pool is four games, which is past unrated.
    expect(combinedTier(standing({ ratedGames: 2 }), standing({ ratedGames: 2 }))).toBe("provisional");
    expect(combinedTier(standing({ ratedGames: 1 }), standing({ ratedGames: 1 }))).toBe("unrated");
    expect(combinedTier(standing({ ratedGames: 15 }), standing({ ratedGames: 15 }))).toBe("established");
  });
});
