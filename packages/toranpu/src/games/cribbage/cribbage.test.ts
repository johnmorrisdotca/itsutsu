import { describe, expect, it } from "vitest";

import { cribbageMoves, cribbageWinners, pegPoints, playCribbage, showCount, startCribbage } from "./cribbage.ts";
import { chooseCrib, choosePeg, cribbageComputer } from "./cribbageComputer.ts";
import { decodeCribbage, encodeCribbage } from "./cribbageRules.ts";
import type { CribbageGame } from "./cribbage.types.ts";

const TWO = ["Ann", "Ben"];

function started(seed = 7, size = 121): CribbageGame {
  const game = startCribbage(size, TWO, undefined, seed);
  if (game === null) throw new Error("no game");
  return game;
}

function playedOut(seed: number, size = 121): CribbageGame {
  let game = started(seed, size);
  for (let step = 0; step < 5000 && game.phase !== "over"; step++) game = playCribbage(game, cribbageComputer(game))!;
  return game;
}

describe("cribbage", () => {
  it("deals six each to two, the dealer's other hand laying away first, and refuses any other table", () => {
    const game = started();
    expect(game.hands.map((hand) => hand.length)).toEqual([6, 6]);
    expect(game.toPlay).toBe(1);
    expect(cribbageMoves(game)).toHaveLength(15);
    expect(startCribbage(121, ["A", "B", "C"])).toBeNull();
    expect(startCribbage(100, TWO)).toBeNull();
  });

  it("cuts the starter once both have laid two to the crib, and the other hand leads the pegging", () => {
    let game = started();
    game = playCribbage(game, { crib: [game.hands[1][0], game.hands[1][1]] })!;
    expect(game.toPlay).toBe(0);
    expect(game.starter).toBeNull();
    expect(playCribbage(game, { crib: [game.hands[0][0], game.hands[0][0]] })).toBeNull();
    game = playCribbage(game, { crib: [game.hands[0][0], game.hands[0][1]] })!;
    expect(game.phase).toBe("pegging");
    expect(game.crib).toHaveLength(4);
    expect(game.starter).not.toBeNull();
    expect(game.hands.map((hand) => hand.length)).toEqual([4, 4]);
    expect(game.toPlay).toBe(1);
  });

  it("counts the famous hands: twenty-nine, and a double double run for twenty-four", () => {
    expect(showCount(["5H", "5D", "5C", "JS"], "5S").total).toBe(29);
    expect(showCount(["4H", "5S", "6D", "6C"], "5H")).toEqual({ fifteens: 8, pairs: 4, runs: 12, flush: 0, nobs: 0, total: 24 });
    expect(showCount(["2H", "4H", "6H", "8H"], "KS").flush).toBe(4);
    expect(showCount(["2H", "4H", "6H", "8H"], "KS", true).flush).toBe(0);
    expect(showCount(["2H", "4H", "6H", "8H"], "KH", true).flush).toBe(5);
  });

  it("pegs fifteens, thirty-ones, pairs and runs in any order", () => {
    expect(pegPoints(["7H", "8S"], 15)).toEqual({ points: 2, why: ["fifteen"] });
    expect(pegPoints(["9H", "9S"], 18)).toEqual({ points: 2, why: ["a pair"] });
    expect(pegPoints(["9H", "9S", "9D"], 27).points).toBe(6);
    expect(pegPoints(["4H", "6S", "5D"], 15)).toEqual({ points: 5, why: ["fifteen", "a run of 3"] });
    expect(pegPoints(["KH", "KS", "AD", "AS"], 22).points).toBe(2);
  });

  it("will not let the count pass thirty-one, and gives the go to whoever played last", () => {
    const base = playCribbage(playCribbage(started(), { crib: [started().hands[1][0], started().hands[1][1]] })!, { crib: [started().hands[0][0], started().hands[0][1]] })!;
    const game: CribbageGame = { ...base, toPlay: 1, count: 25, run: [], hands: [["KH", "QS"], ["5D", "9C"]], peg: null };
    expect(cribbageMoves(game)).toEqual([{ play: "5D" }]);
    const after = playCribbage(game, { play: "5D" })!;
    expect(after.peg).toEqual({ seat: 1, points: 1, why: ["go"] });
    expect(after.count).toBe(0);
    expect(after.toPlay).toBe(0);
    expect(after.scores[1]).toBe(base.scores[1] + 1);
  });

  it("lays away the fives and pegs the fifteen when it can", () => {
    expect(chooseCrib(["5H", "5S", "JD", "KC", "2H", "9S"], true).sort()).not.toContain("5H");
    expect(choosePeg({ seat: 0, dealer: 1, phase: "pegging", hand: ["2S", "5H"], count: 10, run: ["TD"] })).toBe("5H");
    expect(choosePeg({ seat: 0, dealer: 1, phase: "pegging", hand: ["5S", "3H", "KD"], count: 0, run: [] })).toBe("3H");
  });

  it("plays out to the first to the total, and survives being kept and read back", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const game = playedOut(seed);
      expect(game.phase).toBe("over");
      const [winner] = cribbageWinners(game);
      expect(game.scores[winner]).toBeGreaterThanOrEqual(121);
      expect(game.scores[1 - winner]).toBeLessThan(121);
      const back = decodeCribbage(encodeCribbage(game));
      expect(back?.scores).toEqual(game.scores);
      expect(back?.results).toEqual(game.results);
    }
  });
});
