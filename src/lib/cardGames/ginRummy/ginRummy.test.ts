import { describe, expect, it } from "vitest";

import { chooseThrow, ginComputer, ginSensible, ginView, wanted } from "./ginComputer";
import { GIN_BONUS, UNDERCUT_BONUS, bestLayout, deadwoodIn, ginMoves, isMeld, layOff, meldsIn, playGin, startGin } from "./ginRummy";
import { decodeGin, encodeGin } from "./ginRummyRules";
import type { GinGame } from "./ginRummy.types";

function started(seed = 7, size = 100): GinGame {
  const game = startGin(size, ["Ann", "Ben"], undefined, seed);
  if (game === null) throw new Error("no game");
  return game;
}

/** A game at the throw, the seat to move holding these eleven cards and the other these ten. */
function atThrow(mine: string[], theirs: string[], extra: Partial<GinGame> = {}): GinGame {
  return { ...started(), phase: "discard", toPlay: 0, hands: [mine, theirs], taken: null, ...extra };
}

describe("gin rummy", () => {
  it("deals ten each, turns one card up, and refuses any table but two", () => {
    const game = started();
    expect(game.hands.map((hand) => hand.length)).toEqual([10, 10]);
    expect(game.discard).toHaveLength(1);
    expect(game.stock).toHaveLength(31);
    expect(startGin(100, ["A", "B", "C"])).toBeNull();
    expect(startGin(120, ["A", "B"])).toBeNull();
  });

  it("knows a meld: three or four of a rank, or three in a row of one suit with the ace low", () => {
    expect(isMeld(["7C", "7D", "7H"])).toBe(true);
    expect(isMeld(["AS", "2S", "3S"])).toBe(true);
    expect(isMeld(["QS", "KS", "AS"])).toBe(false);
    expect(isMeld(["4H", "5H", "7H"])).toBe(false);
    expect(isMeld(["4H", "5D", "6H"])).toBe(false);
    expect(meldsIn(["7C", "7D", "7H", "7S"])).toHaveLength(5);
  });

  it("lays a hand out to leave the least deadwood, choosing between a set and a run that share a card", () => {
    // 7♥ fits the sevens and the hearts run; the run and the other sevens together leave nothing.
    const hand = ["5H", "6H", "7H", "7C", "7D", "7S", "KC", "KD", "KS", "2C"];
    const layout = bestLayout(hand);
    expect(layout.deadwood).toEqual(["2C"]);
    expect(deadwoodIn(hand)).toBe(2);
  });

  it("takes a turn as a draw and then a throw, and never the card just taken straight back", () => {
    let game = started();
    expect(ginMoves(game)).toEqual([{ draw: "stock" }, { draw: "discard" }]);
    const top = game.discard[0];
    game = playGin(game, { draw: "discard" })!;
    expect(game.taken).toBe(top);
    expect(game.picked[0]).toEqual([top]);
    expect(playGin(game, { discard: top })).toBeNull();
    const other = game.hands[0].find((card) => card !== top)!;
    game = playGin(game, { discard: other })!;
    expect(game.toPlay).toBe(1);
    expect(game.phase).toBe("draw");
    expect(game.picked[0]).toEqual([top]);
  });

  it("refuses a knock with more than ten of deadwood", () => {
    const game = atThrow(["AS", "2S", "3S", "7C", "7D", "7H", "9C", "9D", "KH", "QD", "JC"], ["2H", "3H", "4C", "5D", "6S", "8S", "TC", "TD", "4S", "5S"]);
    expect(playGin(game, { knock: "JC" })).toBeNull();
  });

  it("scores a knock as the difference, and lays off onto the knocker's melds first", () => {
    // Ann keeps A♠2♠3♠, 7♣7♦7♥, 9♣9♦9♥ and the 4♣ (four of deadwood) after throwing the K♥.
    const mine = ["AS", "2S", "3S", "7C", "7D", "7H", "9C", "9D", "9H", "4C", "KH"];
    // Ben holds the 4♠ and 7♠, which lay off onto Ann's run and set.
    const theirs = ["4S", "7S", "KC", "KD", "QC", "JD", "TC", "8D", "6H", "5C"];
    const game = playGin(atThrow(mine, theirs), { knock: "KH" })!;
    const result = game.results[0];
    expect(result.kind).toBe("knock");
    expect(result.laidOff.sort()).toEqual(["4S", "7S"]);
    // Ben's deadwood: K Q J 10 K = 50, 8 + 6 + 5 = 19: 69, less Ann's 4.
    expect(result.points).toBe(65);
    expect(game.scores).toEqual([65, 0]);
    expect(game.hand).toBe(1);
  });

  it("scores gin with 25 more and nothing laid off, and an undercut for the other player", () => {
    const mine = ["AS", "2S", "3S", "7C", "7D", "7H", "9C", "9D", "9H", "TH", "KH"];
    const theirs = ["4S", "KC", "KD", "KS", "QC", "QD", "QH", "2D", "2H", "AD"];
    // Ann's ten melded after throwing the K♥: gin, 25 and Ben's 1+2+2+4 = 9 (the 4♠ may not be laid off).
    const gin = playGin(atThrow(["AS", "2S", "3S", "7C", "7D", "7H", "9C", "9D", "9H", "9S", "KH"], theirs), { knock: "KH" })!;
    expect(gin.results[0]).toMatchObject({ kind: "gin", points: GIN_BONUS + 9, winner: 0, laidOff: [] });
    // Knocking with the ten of hearts as deadwood (10): Ben lays the 4♠ off onto Ann's run and keeps 5, an undercut, 5 and 25 to Ben.
    const under = playGin(atThrow(mine, theirs), { knock: "KH" })!;
    expect(under.results[0]).toMatchObject({ kind: "undercut", winner: 1, points: 5 + UNDERCUT_BONUS, laidOff: ["4S"] });
  });

  it("draws the hand when the stock is down to two with nobody out", () => {
    const game = { ...started(), phase: "discard" as const, stock: ["2C", "3C"], toPlay: 0 };
    const next = playGin(game, { discard: game.hands[0][0] })!;
    expect(next.results[0].kind).toBe("drawn");
    expect(next.hand).toBe(1);
    expect(next.scores).toEqual([0, 0]);
  });

  it("lays a run off one card at a time, so a six can follow the five", () => {
    const { laidOff } = layOff(["5H", "6H", "KC"], [["2H", "3H", "4H"]]);
    expect(laidOff).toEqual(["5H", "6H"]);
  });

  it("is kept as its moves and read back exactly", () => {
    let game = started(11);
    for (let step = 0; step < 30 && game.phase !== "over"; step += 1) game = playGin(game, ginComputer(game))!;
    expect(decodeGin(encodeGin(game))).toEqual(game);
  });
});

describe("the gin rummy computer", () => {
  it("takes the discard only when it goes into a meld", () => {
    const hand = ["7C", "7D", "2S", "5H", "9C", "JD", "KS", "3D", "8H", "QC"];
    expect(wanted(hand, "7H")).toBe(true);
    expect(wanted(hand, "4S")).toBe(false);
  });

  it("throws the card that leaves the least deadwood, the highest of those that tie", () => {
    const view = { hand: ["7C", "7D", "7H", "2S", "3S", "4S", "KC", "5D", "9H", "AH", "QS"], phase: "discard" as const, top: null, taken: null, theirPicks: [] };
    expect(chooseThrow(view)).toBe("KC");
    // Not the king the other player is collecting kings for, when the queen costs the same.
    expect(chooseThrow({ ...view, theirPicks: ["KD"] })).toBe("QS");
  });

  it("sees its own hand and the table, never the other hand or the stock", () => {
    const game = started();
    expect(Object.keys(ginView(game)).sort()).toEqual(["hand", "phase", "taken", "theirPicks", "top"]);
  });

  it("the gate's player knocks whenever it can", () => {
    const game = atThrow(["AS", "2S", "3S", "7C", "7D", "7H", "9C", "9D", "9H", "4C", "KH"], ["2H", "3H", "4D", "5D", "6S", "8S", "TC", "TD", "4S", "5S"]);
    expect("knock" in ginSensible(game, () => 0.5)).toBe(true);
  });
});
