import { describe, expect, it } from "vitest";

import { EUCHRE_DECK, euchreHeight, euchreMoves, euchrePlayable, euchreTrickWinner, euchreWinners, handPoints, playEuchre, startEuchre, suitIn } from "./euchre.ts";
import { euchreComputer, throwAway, trumpWorth } from "./euchreComputer.ts";
import { decodeEuchre, encodeEuchre } from "./euchreRules.ts";
import type { EuchreGame } from "./euchre.types.ts";

const FOUR = ["Ann", "Ben", "Cy", "Di"];

function started(seed = 7, size = 10): EuchreGame {
  const game = startEuchre(size, FOUR, undefined, seed);
  if (game === null) throw new Error("no game");
  return game;
}

function playedOut(seed: number, size = 10): EuchreGame {
  let game = started(seed, size);
  for (let step = 0; step < 5000 && game.phase !== "over"; step++) game = playEuchre(game, euchreComputer(game))!;
  return game;
}

describe("euchre", () => {
  it("plays with nine to ace, five each and one turned up, and refuses any other table", () => {
    expect(EUCHRE_DECK).toHaveLength(24);
    const game = started();
    expect(game.hands.map((hand) => hand.length)).toEqual([5, 5, 5, 5]);
    const all = [...game.hands.flat(), game.upcard];
    expect(new Set(all).size).toBe(21);
    expect(all.every((card) => EUCHRE_DECK.includes(card))).toBe(true);
    expect(startEuchre(10, ["A", "B", "C"])).toBeNull();
    expect(startEuchre(7, FOUR)).toBeNull();
  });

  it("makes the jack of trumps the right bower and its colour's jack the left, a trump of its own", () => {
    expect(euchreHeight("JH", "H")).toBe(20);
    expect(euchreHeight("JD", "H")).toBe(19);
    expect(suitIn("JD", "H")).toBe("H");
    expect(suitIn("JD", "S")).toBe("D");
    expect(euchreTrickWinner([{ seat: 0, card: "AH" }, { seat: 1, card: "JD" }, { seat: 2, card: "KH" }, { seat: 3, card: "JH" }], "H")).toBe(3);
    expect(euchreTrickWinner([{ seat: 0, card: "9C" }, { seat: 1, card: "AD" }, { seat: 2, card: "KC" }, { seat: 3, card: "TC" }], "H")).toBe(2);
  });

  it("makes the left bower follow trumps, not its own suit", () => {
    const game: EuchreGame = { ...started(), phase: "playing", trump: "H", maker: 0, toPlay: 1, trick: [{ seat: 0, card: "9D" }], hands: [[], ["JD", "AS", "TH"], [], []] };
    expect(euchrePlayable(game)).toEqual(["JD", "AS", "TH"]);
    const led: EuchreGame = { ...game, trick: [{ seat: 0, card: "9H" }] };
    expect(euchrePlayable(led)).toEqual(["JD", "TH"]);
  });

  it("gives the dealer the turned card to pick up and throw one away when it is ordered", () => {
    const game = started();
    expect(game.toPlay).toBe(1);
    const ordered = playEuchre(game, { order: true })!;
    expect(ordered.phase).toBe("discard");
    expect(ordered.toPlay).toBe(0);
    expect(ordered.maker).toBe(1);
    expect(ordered.hands[0]).toHaveLength(6);
    const thrown = playEuchre(ordered, { discard: ordered.hands[0][0] })!;
    expect(thrown.phase).toBe("playing");
    expect(thrown.hands[0]).toHaveLength(5);
    expect(thrown.toPlay).toBe(1);
  });

  it("turns the card down when all four pass, and sticks the dealer with naming a suit", () => {
    let game = started();
    for (let i = 0; i < 4; i++) game = playEuchre(game, { pass: true })!;
    expect(game.phase).toBe("call");
    expect(game.toPlay).toBe(1);
    expect(playEuchre(game, { call: game.upcard.slice(-1) as "S" })).toBeNull();
    for (let i = 0; i < 3; i++) game = playEuchre(game, { pass: true })!;
    expect(game.toPlay).toBe(0);
    expect(euchreMoves(game).some((move) => "pass" in move)).toBe(false);
    expect(playEuchre(game, { pass: true })).toBeNull();
  });

  it("scores one for three or four tricks, two for a march, and two to the defence for a euchre", () => {
    expect(handPoints(0, 3)).toEqual([1, 0]);
    expect(handPoints(0, 4)).toEqual([1, 0]);
    expect(handPoints(1, 5)).toEqual([0, 2]);
    expect(handPoints(1, 2)).toEqual([2, 0]);
  });

  it("has the dealer throw away a low card outside trumps, never an ace", () => {
    expect(throwAway(["AS", "9C", "KH", "JH", "QH", "TH"], "H")).toBe("9C");
    expect(trumpWorth(["JH", "JD", "AH"], "H")).toBeGreaterThan(trumpWorth(["9H", "TH", "QC"], "H"));
  });

  it("plays out to a winning partnership, and survives being kept and read back", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const game = playedOut(seed);
      expect(game.phase).toBe("over");
      expect(Math.max(...game.scores)).toBeGreaterThanOrEqual(10);
      const winners = euchreWinners(game);
      expect(winners).toHaveLength(2);
      expect(winners[1] - winners[0]).toBe(2);
      const back = decodeEuchre(encodeEuchre(game));
      expect(back?.scores).toEqual(game.scores);
      expect(back?.results).toEqual(game.results);
    }
  });
});
