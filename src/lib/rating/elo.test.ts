import { describe, expect, it } from "vitest";
import {
  PROVISIONAL_BELOW,
  RATING_START,
  UNRATED_BELOW,
  expectedScore,
  nextRating,
  rateGame,
  tierFor,
} from "./elo";

describe("tiers", () => {
  it("moves from unrated through provisional to established", () => {
    expect(tierFor(0)).toBe("unrated");
    expect(tierFor(UNRATED_BELOW - 1)).toBe("unrated");
    expect(tierFor(UNRATED_BELOW)).toBe("provisional");
    expect(tierFor(PROVISIONAL_BELOW - 1)).toBe("provisional");
    expect(tierFor(PROVISIONAL_BELOW)).toBe("established");
  });
});

describe("expected score", () => {
  it("is even between equals and favours the higher rating", () => {
    expect(expectedScore(1600, 1600)).toBeCloseTo(0.5);
    expect(expectedScore(1800, 1600)).toBeGreaterThan(0.7);
    expect(expectedScore(1600, 1800)).toBeLessThan(0.3);
    expect(expectedScore(1600, 1800) + expectedScore(1800, 1600)).toBeCloseTo(1);
  });
});

describe("one game", () => {
  const fresh = { rating: RATING_START, ratedGames: 0 };
  const settled = { rating: RATING_START, ratedGames: 30 };

  it("moves a provisional rating further than an established one", () => {
    const provisional = nextRating(fresh, fresh, 1) - RATING_START;
    const established = nextRating(settled, settled, 1) - RATING_START;
    expect(provisional).toBe(20);
    expect(established).toBe(10);
  });

  it("is zero-sum between equals, and a draw between equals changes nothing", () => {
    const { first, second } = rateGame(settled, settled, 1);
    expect(first.rating - RATING_START).toBe(-(second.rating - RATING_START));
    const drawn = rateGame(settled, settled, 0.5);
    expect(drawn.first.rating).toBe(RATING_START);
    expect(drawn.second.rating).toBe(RATING_START);
  });

  it("rewards an upset more than an expected win", () => {
    const strong = { rating: 1900, ratedGames: 30 };
    const weak = { rating: 1600, ratedGames: 30 };
    const upset = nextRating(weak, strong, 1) - 1600;
    const expected = nextRating(strong, weak, 1) - 1900;
    expect(upset).toBeGreaterThan(expected);
  });

  it("gives a favourite by more than 400 nothing for winning, but still costs a loss", () => {
    const giant = { rating: 2100, ratedGames: 30 };
    const novice = { rating: 1600, ratedGames: 30 };
    expect(nextRating(giant, novice, 1)).toBe(2100);
    expect(nextRating(giant, novice, 0)).toBeLessThan(2100);
    // The novice still gains for the upset.
    expect(nextRating(novice, giant, 1)).toBeGreaterThan(1600);
  });

  it("counts the game for both players", () => {
    const { first, second } = rateGame(fresh, settled, 0);
    expect(first.ratedGames).toBe(1);
    expect(second.ratedGames).toBe(31);
  });
});
