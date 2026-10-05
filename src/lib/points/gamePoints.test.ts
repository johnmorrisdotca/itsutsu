import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { GAME_MAX_BASE, GAME_POINTS_WEIGHT, RESULT_MOST, RESULT_STEP, expectedScore, gameMax, gamePoints, type PricedResult } from "./gamePoints";

/** A Gomoku win on 15×15 on the board, even, unrated, the first of the day: 100, and nothing for the loss. */
const plain: PricedResult = {
  variant: "freestyle",
  size: 15,
  winner: "black",
  drawn: false,
  reason: "line",
  score: null,
  moveCount: 40,
  headStartFor: null,
  handicapOn: null,
  winnerExpected: null,
  earlierToday: 0,
  oneScreen: false,
};

describe("the most each game can pay", () => {
  it("is Gomoku's 100 on 15×15, 150 for Go on 19×19, 10 for tic-tac-toe, and scales with the board", () => {
    expect(gameMax("freestyle", 15)).toBe(100);
    expect(gameMax("freestyle", 9)).toBe(70);
    expect(gameMax("go", 19)).toBe(150);
    expect(gameMax("go", 9)).toBe(80);
    expect(gameMax("tictactoe", 3)).toBe(10);
    expect(gameMax("renju", 15)).toBe(110);
    expect(gameMax("connect6", 19)).toBe(140);
  });

  it("has a price for every game on every board it offers, between 10 and 150", () => {
    for (const variant of RULE_VARIANT_LIST) {
      expect(GAME_POINTS_WEIGHT[variant], variant).toBeDefined();
      for (const size of boardSizesFor(variant)) {
        const max = gameMax(variant, size);
        expect(max, `${variant} ${size}`).toBeGreaterThanOrEqual(10);
        expect(max, `${variant} ${size}`).toBeLessThanOrEqual(GAME_MAX_BASE);
      }
    }
  });

  it("holds the biggest boards to 150: Go 19×19, Canadian checkers, Halma 16×16 and Hex 19×19 were 200 and 160", () => {
    expect(gameMax("go", 19)).toBe(150);
    expect(gameMax("canadianCheckers", 12)).toBe(150);
    expect(gameMax("halma", 16)).toBe(150);
    expect(gameMax("hex", 19)).toBe(150);
    // Below the cap nothing moved.
    expect(gameMax("go", 13)).toBe(120);
    expect(gameMax("internationalDraughts", 10)).toBe(140);
  });

  it("keeps the quick games at 10 to 40, so a fast game cannot be farmed", () => {
    for (const variant of ["tictactoe", "wildTicTacToe", "notakto", "trapThree", "squareFour", "twistFour", "makerBreaker"] as const) {
      for (const size of boardSizesFor(variant)) {
        expect(gameMax(variant, size), `${variant} ${size}`).toBeGreaterThanOrEqual(10);
        expect(gameMax(variant, size), `${variant} ${size}`).toBeLessThanOrEqual(40);
      }
    }
  });
});

describe("what each result pays, as a share of the most", () => {
  it("pays a win 100% and a loss nothing: taking part is XP's, and IP is ability", () => {
    expect(gamePoints(plain)).toEqual({ black: 100, white: 0 });
    expect(gamePoints({ ...plain, winner: "white" })).toEqual({ black: 0, white: 100 });
  });

  it("pays a draw half each, and a game nobody finished nothing", () => {
    expect(gamePoints({ ...plain, winner: null, drawn: true })).toEqual({ black: 50, white: 50 });
    expect(gamePoints({ ...plain, winner: null, drawn: false })).toEqual({ black: 0, white: 0 });
  });

  it("pays a close loss something: Reversi lost 30 discs to 34 earns 20, and a rout nothing", () => {
    const reversi = { ...plain, variant: "reversi" as const, size: 8, reason: "count", score: { black: 34, white: 30 } };
    expect(gamePoints(reversi)).toEqual({ black: 100, white: 20 });
    expect(gamePoints({ ...reversi, score: { black: 60, white: 4 } })).toEqual({ black: 100, white: 0 });
  });

  it("pays a win on the clock less, and a resignation before the tenth move hardly at all", () => {
    expect(gamePoints({ ...plain, reason: "resign" })).toEqual({ black: 100, white: 0 });
    expect(gamePoints({ ...plain, reason: "resign", moveCount: 4 })).toEqual({ black: 50, white: 0 });
    expect(gamePoints({ ...plain, reason: "time" })).toEqual({ black: 80, white: 0 });
  });

  it("takes a quarter off a win the winner had help with", () => {
    expect(gamePoints({ ...plain, headStartFor: "black" }).black).toBe(75);
    expect(gamePoints({ ...plain, handicapOn: "white" }).black).toBe(75);
    // Help given to the side that lost costs the winner nothing.
    expect(gamePoints({ ...plain, headStartFor: "white" }).black).toBe(100);
  });

  it("pays an upset more and beating a much weaker player less, in a rated game", () => {
    expect(gamePoints({ ...plain, winnerExpected: 0.5 }).black).toBe(100);
    expect(gamePoints({ ...plain, winnerExpected: expectedScore(1400, 1800) }).black).toBe(140);
    expect(gamePoints({ ...plain, winnerExpected: expectedScore(1800, 1400) }).black).toBe(60);
    expect(gamePoints({ ...plain, winnerExpected: 1 }).black).toBe(50);
    expect(gamePoints({ ...plain, winnerExpected: 0 }).black).toBe(150);
  });

  it("pays the same two players less the more they play each other in a day", () => {
    expect(gamePoints({ ...plain, earlierToday: 1 })).toEqual({ black: 50, white: 0 });
    expect(gamePoints({ ...plain, earlierToday: 2 })).toEqual({ black: 25, white: 0 });
    expect(gamePoints({ ...plain, earlierToday: 9 })).toEqual({ black: 25, white: 0 });
    expect(gamePoints({ ...plain, winner: null, drawn: true, earlierToday: 1 })).toEqual({ black: 25, white: 25 });
  });

  it("rounds every result to the nearest five, and pays no result more than 200", () => {
    const results: PricedResult[] = [];
    for (const variant of RULE_VARIANT_LIST) {
      for (const size of boardSizesFor(variant)) {
        for (const winnerExpected of [null, 0, 0.17, 0.5, 0.83, 1]) {
          for (const earlierToday of [0, 1, 5]) {
            const score = { black: 31, white: 27 };
            results.push({ ...plain, variant, size, winnerExpected, earlierToday, score, reason: "line" });
            results.push({ ...plain, variant, size, winnerExpected, earlierToday, score, reason: "time", winner: "white" });
            results.push({ ...plain, variant, size, winnerExpected, earlierToday, drawn: true, winner: null });
          }
        }
      }
    }
    for (const result of results) {
      const { black, white } = gamePoints(result);
      for (const each of [black, white]) {
        expect(each % RESULT_STEP, `${result.variant} ${result.size}`).toBe(0);
        expect(each).toBeLessThanOrEqual(RESULT_MOST);
        expect(each).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("stops an upset on the biggest board at 200: 150 times the 1.5 an upset can be is 225", () => {
    expect(gamePoints({ ...plain, variant: "go", size: 19, winnerExpected: 0 }).black).toBe(200);
    expect(gamePoints({ ...plain, variant: "go", size: 19, winnerExpected: 0.5 }).black).toBe(150);
    // The same upset on a 100 game is not touched.
    expect(gamePoints({ ...plain, winnerExpected: 0 }).black).toBe(150);
  });

  it("pays nothing for a game at one screen", () => {
    expect(gamePoints({ ...plain, oneScreen: true })).toEqual({ black: 0, white: 0 });
  });
});
