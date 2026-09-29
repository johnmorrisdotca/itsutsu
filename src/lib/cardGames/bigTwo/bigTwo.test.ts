import { describe, expect, it } from "vitest";

import { bigTwoCharge, bigTwoMayPlay, bigTwoMoves, playBigTwo, startBigTwo } from "./bigTwo";
import { bigTwoComputer } from "./bigTwoComputer";
import { bigTwoBeats, bigTwoCard, bigTwoPlays, bigTwoValue } from "./bigTwoHands";
import type { BigTwoGame } from "./bigTwo.types";

const value = (cards: string[]) => bigTwoValue(cards)!;

function started(players = 4, seed = 3): BigTwoGame {
  return startBigTwo(3, new Array<string>(players).fill(""), undefined, seed)!;
}

/** A game in play with these hands and this on the table. */
function at(hands: string[][], extra: Partial<BigTwoGame> = {}): BigTwoGame {
  return { ...started(), hands, pile: null, passed: hands.map(() => false), opening: null, toPlay: 0, ...extra };
}

describe("big two", () => {
  it("orders the pack three of diamonds lowest and two of spades highest", () => {
    expect(bigTwoCard("3D")).toBe(0);
    expect(bigTwoCard("2S")).toBe(51);
    expect(bigTwoCard("AS")).toBeLessThan(bigTwoCard("2D"));
    expect(bigTwoCard("KH")).toBeLessThan(bigTwoCard("KS"));
  });

  it("knows the five-card hands and ranks them straight, flush, full house, four of a kind, straight flush", () => {
    expect(value(["3D", "4C", "5H", "6S", "7D"]).kind).toBe("straight");
    expect(value(["3D", "8D", "5D", "JD", "KD"]).kind).toBe("flush");
    expect(value(["9D", "9C", "9H", "4S", "4D"]).kind).toBe("fullHouse");
    expect(value(["9D", "9C", "9H", "9S", "4D"]).kind).toBe("fourKind");
    expect(value(["3H", "4H", "5H", "6H", "7H"]).kind).toBe("straightFlush");
    expect(bigTwoBeats(value(["3D", "8D", "5D", "JD", "KD"]), value(["TD", "JC", "QH", "KS", "AD"]))).toBe(true);
    expect(bigTwoBeats(value(["3D", "3C", "3H", "4S", "4D"]), value(["3S", "8S", "5S", "JS", "KS"]))).toBe(true);
  });

  it("puts no two in a straight, and wraps none", () => {
    expect(bigTwoValue(["JD", "QC", "KH", "AS", "2D"])).toBeNull();
    expect(bigTwoValue(["AD", "2C", "3H", "4S", "5D"])).toBeNull();
    expect(value(["TD", "JC", "QH", "KS", "AD"]).kind).toBe("straight");
  });

  it("beats a pair only with a higher pair, and never with a single or a five", () => {
    expect(bigTwoBeats(value(["5D", "5S"]), value(["5C", "5H"]))).toBe(true);
    expect(bigTwoBeats(value(["2S"]), value(["5C", "5H"]))).toBe(false);
    expect(bigTwoBeats(value(["4D", "4S"]), value(["5C", "5H"]))).toBe(false);
  });

  it("finds every play a hand can make", () => {
    const plays = bigTwoPlays(["3D", "3C", "4H", "5S", "6D", "7C"]).map((cards) => cards.join(" "));
    expect(plays).toContain("3D 3C");
    expect(plays).toContain("3D 4H 5S 6D 7C");
    expect(plays).toContain("3C 4H 5S 6D 7C");
    expect(plays.filter((play) => play.split(" ").length === 5)).toHaveLength(2);
  });

  it("deals thirteen each to four, and the three of diamonds leads and must be played", () => {
    const game = started();
    expect(game.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(game.opening).toBe("3D");
    expect(game.hands[game.toPlay!]).toContain("3D");
    expect(bigTwoMoves(game).every((move) => "play" in move && move.play.includes("3D"))).toBe(true);
  });

  it("deals seventeen each to three and the last card to the three of diamonds", () => {
    const game = started(3);
    expect(game.hands.map((hand) => hand.length).sort()).toEqual([17, 17, 18]);
    expect(game.hands.find((hand) => hand.length === 18)).toContain("3D");
  });

  it("holds a pass until the trick is over, then the last to play leads anything", () => {
    let game = at([["5D", "9S"], ["6D", "TD"], ["4S", "7C"], ["3C", "8H"]]);
    game = playBigTwo(game, { play: ["5D"] })!;
    game = playBigTwo(game, { pass: true })!;
    expect(game.toPlay).toBe(2);
    game = playBigTwo(game, { play: ["7C"] })!;
    game = playBigTwo(game, { play: ["8H"] })!;
    // Seat 0 answers; seat 1 passed and waits.
    expect(game.toPlay).toBe(0);
    game = playBigTwo(game, { pass: true })!;
    expect(game.toPlay).toBe(2);
    game = playBigTwo(game, { pass: true })!;
    expect(game.pile).toBeNull();
    expect(game.toPlay).toBe(3);
    expect(bigTwoMoves(game).some((move) => "pass" in move)).toBe(false);
  });

  it("charges a point a card, double for ten, treble for thirteen", () => {
    expect([1, 9, 10, 12, 13].map(bigTwoCharge)).toEqual([1, 9, 20, 24, 39]);
  });

  it("ends the deal when somebody goes out, and the fewest points after the last deal wins", () => {
    const last = at([["2S"], ["3D", "4D"], ["5D", "6D", "7D"], ["8D"]], { size: 1 });
    const end = playBigTwo(last, { play: ["2S"] })!;
    expect(end.phase).toBe("over");
    expect(end.deals[0]).toEqual({ winner: 0, charged: [0, 2, 3, 1] });
    expect(end.toPlay).toBeNull();
  });

  it("refuses a play the table does not allow", () => {
    const game = at([["5D", "5S"], ["6D"], ["4S"], ["3C"]], { pile: { seat: 3, cards: ["9C"] } });
    expect(bigTwoMayPlay(game, ["5S"])).toBe(false);
    expect(playBigTwo(game, { play: ["5D", "5S"] })).toBeNull();
  });

  it("the computer keeps its twos for later, and stops the last card with its highest single", () => {
    const early = at([["2S", "4D", "5C", "6H", "8C", "9D", "TS", "JH"], ["3C", "4H", "5H", "6C", "7C"], ["3D", "4C", "5D", "6S", "7S"], ["3H", "4S", "5S", "6D", "7D"]], { pile: { seat: 3, cards: ["KS"] } });
    expect(bigTwoComputer(early)).toEqual({ pass: true });
    const danger = at([["2S", "4D", "9D", "AS"], ["3C"], ["3D", "4C", "5D"], ["3H", "3S"]], { pile: { seat: 1, cards: ["8C"] } });
    expect(bigTwoComputer(danger)).toEqual({ play: ["2S"] });
  });
});
