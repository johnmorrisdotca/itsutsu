import { describe, expect, it } from "vitest";

import { rateGame } from "./elo";
import { scoreForBlack } from "./variantRatings";

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
