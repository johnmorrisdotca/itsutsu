import { describe, expect, it } from "vitest";

import { dealPoints, dealSizes, ohHellBids, ohHellMoves, ohHellPlayable, ohHellTrickWinner, ohHellWinners, playOhHell, startOhHell } from "./ohHell";
import { chooseOhHellBid, ohHellComputer, ohHellWorth } from "./ohHellComputer";
import { decodeOhHell, encodeOhHell } from "./ohHellRules";
import type { OhHellGame } from "./ohHell.types";

const FOUR = ["Ann", "Ben", "Cy", "Di"];

function started(seed = 7, size = 13, players = FOUR): OhHellGame {
  const game = startOhHell(size, players, undefined, seed);
  if (game === null) throw new Error("no game");
  return game;
}

function playedOut(seed: number, size = 13, players = FOUR): OhHellGame {
  let game = started(seed, size, players);
  for (let step = 0; step < 5000 && game.phase !== "over"; step++) game = playOhHell(game, ohHellComputer(game))!;
  return game;
}

describe("oh hell", () => {
  it("deals one card, then two, up to seven, and in the long game back down to one", () => {
    expect(dealSizes(7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(dealSizes(13)).toEqual([1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1]);
    const game = started();
    expect(game.hands.map((hand) => hand.length)).toEqual([1, 1, 1, 1]);
    expect(game.hands.flat()).not.toContain(game.turned);
    expect(game.trump).toBe(game.turned.slice(-1));
    expect(startOhHell(13, ["A", "B"])).toBeNull();
    expect(startOhHell(10, FOUR)).toBeNull();
  });

  it("will not let the dealer bid the number that makes the bids add up to the tricks there are", () => {
    let game = started();
    expect(game.toPlay).toBe(1);
    expect(ohHellBids(game)).toEqual([0, 1]);
    game = playOhHell(game, { bid: 0 })!;
    game = playOhHell(game, { bid: 1 })!;
    game = playOhHell(game, { bid: 0 })!;
    expect(game.toPlay).toBe(0);
    expect(ohHellBids(game)).toEqual([1]);
    expect(playOhHell(game, { bid: 0 })).toBeNull();
    game = playOhHell(game, { bid: 1 })!;
    expect(game.phase).toBe("playing");
    expect(game.toPlay).toBe(1);
  });

  it("makes a player follow suit, and gives the trick to the highest trump", () => {
    const game: OhHellGame = { ...started(), phase: "playing", trump: "H", toPlay: 1, trick: [{ seat: 0, card: "KS" }], hands: [[], ["2S", "AH", "3D"], [], []] };
    expect(ohHellPlayable(game)).toEqual(["2S"]);
    expect(ohHellPlayable({ ...game, hands: [[], ["AH", "3D"], [], []] })).toEqual(["AH", "3D"]);
    expect(ohHellTrickWinner([{ seat: 0, card: "KS" }, { seat: 1, card: "2H" }, { seat: 2, card: "AS" }], "H")).toBe(1);
    expect(ohHellTrickWinner([{ seat: 0, card: "KS" }, { seat: 1, card: "AD" }, { seat: 2, card: "3S" }], "H")).toBe(0);
  });

  it("scores ten and the bid for exactly the bid, and nothing otherwise", () => {
    expect(dealPoints(0, 0)).toBe(10);
    expect(dealPoints(3, 3)).toBe(13);
    expect(dealPoints(2, 3)).toBe(0);
    expect(dealPoints(2, 1)).toBe(0);
  });

  it("bids what a hand is worth, the nearest it may", () => {
    expect(ohHellWorth(["AH", "KH", "AS"], "H", 4)).toBeGreaterThan(2);
    expect(ohHellWorth(["2C", "3D", "4S"], "H", 4)).toBe(0);
    expect(chooseOhHellBid(1.2, [0, 1, 2])).toBe(1);
    expect(chooseOhHellBid(1.2, [0, 2])).toBe(2);
  });

  it("plays out at three and at four, every deal kept, and survives being kept and read back", () => {
    for (const players of [FOUR, ["Ann", "Ben", "Cy"]]) {
      for (const seed of [1, 2, 3]) {
        const game = playedOut(seed, 13, players);
        expect(game.phase).toBe("over");
        expect(game.dealScores).toHaveLength(13);
        for (const row of game.dealScores) expect(row.bids.reduce((a, b) => a + b, 0)).not.toBe(row.cards);
        expect(ohHellWinners(game).length).toBeGreaterThan(0);
        expect(ohHellMoves(game)).toEqual([]);
        const back = decodeOhHell(encodeOhHell(game));
        expect(back?.scores).toEqual(game.scores);
      }
    }
  });
});
