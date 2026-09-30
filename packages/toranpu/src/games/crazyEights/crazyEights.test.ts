import { describe, expect, it } from "vitest";

import { crazyEightsMoves, crazyMatches, crazyPoints, playCrazyEights, startCrazyEights } from "./crazyEights.ts";
import { crazyEightsComputer } from "./crazyEightsComputer.ts";
import type { CrazyEightsGame } from "./crazyEights.types.ts";

function started(players = 3, seed = 3): CrazyEightsGame {
  return startCrazyEights(100, new Array<string>(players).fill(""), undefined, seed)!;
}

function at(hands: string[][], discard: string[], stock: string[], extra: Partial<CrazyEightsGame> = {}): CrazyEightsGame {
  const top = discard[discard.length - 1];
  return { ...started(hands.length), hands, discard, stock, suit: top[1] as CrazyEightsGame["suit"], toPlay: 0, drawn: null, passes: 0, ...extra };
}

describe("crazy eights", () => {
  it("deals seven each to two, five each to more, and never starts the pile on an eight", () => {
    expect(started(2).hands.map((hand) => hand.length)).toEqual([7, 7]);
    expect(started(4).hands.map((hand) => hand.length)).toEqual([5, 5, 5, 5]);
    for (let seed = 1; seed < 40; seed += 1) expect(started(3, seed).discard[0][0]).not.toBe("8");
  });

  it("matches the suit or the rank, and an eight goes on anything", () => {
    const game = at([["5C"]], ["9H"], []);
    expect(crazyMatches(game, "2H")).toBe(true);
    expect(crazyMatches(game, "9S")).toBe(true);
    expect(crazyMatches(game, "8D")).toBe(true);
    expect(crazyMatches(game, "5C")).toBe(false);
  });

  it("an eight names the suit that must follow", () => {
    const game = at([["8C", "4D"], ["5H", "6S"]], ["9H"], ["2C"]);
    expect(crazyEightsMoves(game).filter((move) => "play" in move && move.play === "8C")).toHaveLength(4);
    expect(playCrazyEights(game, { play: "8C" })).toBeNull();
    const after = playCrazyEights(game, { play: "8C", suit: "S" })!;
    expect(after.suit).toBe("S");
    expect(crazyEightsMoves(after)).toEqual([{ play: "6S" }]);
  });

  it("draws one card when nothing will go: a card that plays may be played or kept; one that does not ends the turn", () => {
    const stuck = at([["5C", "6C"], ["2D"]], ["9H"], ["KH", "3S"]);
    expect(crazyEightsMoves(stuck)).toEqual([{ draw: true }]);
    const drew = playCrazyEights(stuck, { draw: true })!;
    expect(drew.drawn).toBe("KH");
    expect(crazyEightsMoves(drew)).toEqual([{ play: "KH" }, { pass: true }]);
    expect(playCrazyEights(drew, { play: "5C" })).toBeNull();
    const nothing = playCrazyEights(at([["5C"], ["2D"]], ["9H"], ["3S"]), { draw: true })!;
    expect(nothing.toPlay).toBe(1);
  });

  it("shuffles the discards under the top card into a new stock when the stock runs out", () => {
    const game = at([["5C"], ["2D"]], ["4D", "6D", "9H"], []);
    const drew = playCrazyEights(game, { draw: true })!;
    expect(drew.turnovers).toBe(1);
    expect(drew.discard).toEqual(["9H"]);
    expect(drew.hands[0]).toHaveLength(2);
  });

  it("the first out scores what the others hold: fifty an eight, ten a picture, one an ace", () => {
    expect(["8S", "KD", "AH", "7C"].map(crazyPoints)).toEqual([50, 10, 1, 7]);
    const game = at([["4H"], ["8S", "KD"], ["AH"]], ["9H"], ["2C"], { size: 200 });
    const after = playCrazyEights(game, { play: "4H" })!;
    expect(after.results[0]).toEqual({ winners: [0], points: 61, blocked: false });
    expect(after.scores[0]).toBe(61);
  });

  it("a hand nobody can play or draw in is blocked, and the least held wins it", () => {
    let game = at([["5C"], ["KC"]], ["9H"], []);
    game = playCrazyEights(game, { pass: true })!;
    game = playCrazyEights(game, { pass: true })!;
    expect(game.results[0]).toEqual({ winners: [0], points: 10, blocked: true });
  });

  it("the first to the game's size wins", () => {
    const game = at([["4H"], ["8S", "8D"]], ["9H"], ["2C"], { size: 100 });
    const end = playCrazyEights(game, { play: "4H" })!;
    expect(end.phase).toBe("over");
    expect(end.toPlay).toBeNull();
  });

  it("the computer saves its eights, and calls the suit it holds most of", () => {
    expect(crazyEightsComputer(at([["8C", "4H", "JH"], ["2D"]], ["9H"], ["2C"]))).toEqual({ play: "JH" });
    expect(crazyEightsComputer(at([["8C", "4S", "JS", "2D"], ["2D"]], ["9H"], ["2C"]))).toEqual({ play: "8C", suit: "S" });
    const drewEight = at([["5C", "6C", "8D"], ["2D"]], ["9H"], [], { drawn: "8D" });
    expect(crazyEightsComputer(drewEight)).toEqual({ pass: true });
  });
});
