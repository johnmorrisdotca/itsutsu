import { describe, expect, it } from "vitest";

import { rateGame, tierFor } from "./elo";
import { RATING_POOLS } from "./pools";
import { championsOf, scoreForBlack, type VariantStanding } from "./variantRatings";

/**
 * The database side of variantRatings is exercised end to end; what is worth
 * pinning here is the scoring, because getting it backwards would quietly
 * rate every game the wrong way round for one colour.
 */
describe("scoreForBlack", () => {
  it("scores a win, a loss and a draw from black's side", () => {
    expect(scoreForBlack("black")).toBe(1);
    expect(scoreForBlack("white")).toBe(0);
    expect(scoreForBlack(null)).toBe(0.5);
  });

  it("moves the two ratings in opposite directions by the same amount", () => {
    const even = { rating: 1600, ratedGames: 0 };
    const rated = rateGame(even, { ...even }, scoreForBlack("black"));
    expect(rated.first.rating).toBeGreaterThan(1600);
    expect(rated.second.rating).toBeLessThan(1600);
    expect(rated.first.rating - 1600).toBe(1600 - rated.second.rating);
  });

  it("leaves two even players level after a draw, and counts the game", () => {
    const even = { rating: 1600, ratedGames: 3 };
    const rated = rateGame(even, { ...even }, scoreForBlack(null));
    expect(rated.first.rating).toBe(1600);
    expect(rated.second.rating).toBe(1600);
    expect(rated.first.ratedGames).toBe(4);
  });
});

describe("championsOf", () => {
  const standing = (variant: string, name: string, rating: number, ratedGames: number): VariantStanding => ({
    key: name.toLowerCase(),
    name,
    variant,
    rating,
    ratedGames,
    tier: tierFor(ratedGames),
    pool: RATING_POOLS.people,
    wins: 0,
    losses: 0,
    draws: 0,
  });

  it("crowns the first standing seen for each game and tallies the rest", () => {
    const champions = championsOf([
      standing("renju", "Aki", 1700, 24),
      standing("notakto", "Ren", 1620, 1),
      standing("renju", "Sora", 1640, 10),
      standing("renju", "Mio", 1500, 4),
      standing("notakto", "Aki", 1580, 1),
    ]);
    expect(champions.get("renju")?.leader.name).toBe("Aki");
    expect(champions.get("renju")?.players).toBe(3);
    expect(champions.get("renju")?.games).toBe(19);
    expect(champions.get("notakto")?.leader.name).toBe("Ren");
    expect(champions.get("notakto")?.games).toBe(1);
    expect(champions.has("freestyle")).toBe(false);
  });

  it("is empty when nobody has played rated", () => {
    expect(championsOf([]).size).toBe(0);
  });
});
