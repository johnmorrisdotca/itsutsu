import { describe, expect, it } from "vitest";

import { chooseBid, handWorth, spadesComputer, spadesView } from "./spadesComputer.ts";
import { NIL, partnershipScore, playSpades, spadesMoves, spadesPlayable, spadesTrickWinner, spadesWinners, startSpades } from "./spades.ts";
import { decodeSpades, encodeSpades } from "./spadesRules.ts";
import type { SpadesGame } from "./spades.types.ts";

const FOUR = ["Ann", "Ben", "Cy", "Di"];

function started(seed = 7, size = 500): SpadesGame {
  const game = startSpades(size, FOUR, undefined, seed);
  if (game === null) throw new Error("no game");
  return game;
}

/** Every seat bids what its computer would, to reach the first trick. */
function bid(game: SpadesGame): SpadesGame {
  let at = game;
  while (at.phase === "bidding") at = playSpades(at, spadesComputer(at))!;
  return at;
}

describe("spades", () => {
  it("deals thirteen each to four, and refuses any other table", () => {
    expect(started().hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(new Set(started().hands.flat()).size).toBe(52);
    expect(startSpades(500, ["A", "B", "C"])).toBeNull();
    expect(startSpades(400, FOUR)).toBeNull();
  });

  it("opens the bidding at the dealer's left, and the dealer's left leads once all four have bid", () => {
    const game = started();
    expect(game.phase).toBe("bidding");
    expect(game.toPlay).toBe(1);
    expect(spadesMoves(game).map((move) => ("bid" in move ? move.bid : -1))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    let at = game;
    for (const seat of [1, 2, 3, 0]) {
      expect(at.toPlay).toBe(seat);
      at = playSpades(at, { bid: 3 })!;
    }
    expect(at.phase).toBe("playing");
    expect(at.toPlay).toBe(1);
    expect(playSpades(at, { bid: 2 })).toBeNull();
    expect(playSpades(started(), { bid: 14 })).toBeNull();
  });

  it("will not let a spade be led until spades are broken, unless the leader holds nothing else", () => {
    const game = { ...bid(started()), toPlay: 0, hands: [["2S", "3H"], [], [], []] };
    expect(spadesPlayable(game)).toEqual(["3H"]);
    expect(spadesPlayable({ ...game, hands: [["2S", "5S"], [], [], []] })).toEqual(["2S", "5S"]);
    expect(spadesPlayable({ ...game, spadesBroken: true })).toEqual(["2S", "3H"]);
  });

  it("makes a player follow suit, and lets one void of it trump", () => {
    const game = { ...bid(started()), toPlay: 1, trick: [{ seat: 0, card: "4H" }], hands: [[], ["2S", "9H", "KD"], [], []] };
    expect(spadesPlayable(game)).toEqual(["9H"]);
    expect(spadesPlayable({ ...game, hands: [[], ["2S", "KD"], [], []] })).toEqual(["2S", "KD"]);
  });

  it("gives the trick to the highest spade, or else the highest card of the suit led", () => {
    expect(spadesTrickWinner([{ seat: 0, card: "4H" }, { seat: 1, card: "AH" }, { seat: 2, card: "KD" }, { seat: 3, card: "9H" }])).toBe(1);
    expect(spadesTrickWinner([{ seat: 0, card: "4H" }, { seat: 1, card: "AH" }, { seat: 2, card: "2S" }, { seat: 3, card: "9H" }])).toBe(2);
    expect(spadesTrickWinner([{ seat: 0, card: "4H" }, { seat: 1, card: "3S" }, { seat: 2, card: "2S" }, { seat: 3, card: "AD" }])).toBe(1);
  });

  it("scores a contract made, a contract set, the bags over it and a nil", () => {
    // Ann 4 and Cy 3, taking 5 and 3: seven bid, eight taken, one bag.
    expect(partnershipScore([4, 2, 3, 2], [5, 2, 3, 3], 0)).toEqual({ points: 71, bags: 1 });
    // Ben 2 and Di 2 took 2 and 3 above: made, one bag; set when they take three between them.
    expect(partnershipScore([4, 2, 3, 2], [5, 2, 3, 3], 1)).toEqual({ points: 41, bags: 1 });
    expect(partnershipScore([4, 2, 3, 2], [6, 1, 4, 2], 1)).toEqual({ points: -40, bags: 0 });
    // Nil made beside a partner's four; nil broken, its trick a bag, and the partner's bid on its own.
    expect(partnershipScore([NIL, 0, 4, 0], [0, 0, 4, 0], 0)).toEqual({ points: 140, bags: 0 });
    expect(partnershipScore([NIL, 0, 4, 0], [1, 0, 4, 0], 0)).toEqual({ points: -60, bags: 1 });
  });

  it("charges a hundred for every ten bags, and ends when a partnership reaches the total", () => {
    // A deal played to its last trick by the computers, then scored: bags carried past ten cost a hundred.
    let game = bid(started(3, 200));
    game = { ...game, bags: [9, 0] };
    const before = game.deal;
    while (game.deal === before && game.phase !== "over") game = playSpades(game, spadesComputer(game))!;
    const last = game.dealScores.at(-1)!;
    const carried = 9 + last.bags[0];
    expect(game.bags[0]).toBe(carried % 10);
  });

  it("names both partners of the higher partnership as the winners", () => {
    const over = { ...started(), phase: "over" as const, toPlay: null, scores: [510, 320] as [number, number] };
    expect(spadesWinners(over)).toEqual([0, 2]);
    expect(spadesWinners({ ...over, scores: [-510, 20] })).toEqual([1, 3]);
    expect(spadesWinners(started())).toEqual([]);
  });

  it("is kept as its moves and read back exactly", () => {
    let game = bid(started(11));
    for (let step = 0; step < 9; step += 1) game = playSpades(game, spadesComputer(game))!;
    expect(decodeSpades(encodeSpades(game))).toEqual(game);
    expect(decodeSpades(encodeSpades(game).replace('"g":"spades"', '"g":"hearts"'))).toBeNull();
  });
});

describe("the spades computer", () => {
  it("counts aces, guarded kings and long spades, and bids nil on a hand of nothing", () => {
    const strong = ["AS", "KS", "QS", "JS", "TS", "AH", "KH", "AD", "2C", "3C", "4D", "5H", "6D"];
    expect(handWorth(strong)).toBeGreaterThan(6);
    const empty = ["2C", "3C", "4C", "5D", "6D", "7D", "8H", "9H", "2H", "3H", "4H", "2S", "3S"];
    expect(chooseBid(empty, null)).toBe(NIL);
    // Never nil beside a partner's nil: a bid of one instead.
    expect(chooseBid(empty, NIL)).toBe(1);
  });

  it("sees only its own hand", () => {
    const game = bid(started());
    const view = spadesView(game);
    expect(view.hand).toEqual(game.hands[game.toPlay!]);
    expect(Object.keys(view)).not.toContain("hands");
  });

  it("leaves a trick its partner has won alone, and ducks once its partnership has made its contract", () => {
    const base = bid(started());
    // Cy (seat 2) is to play last; partner Ann led the ace of hearts and it is winning.
    const game: SpadesGame = { ...base, toPlay: 2, bids: [3, 3, 3, 3], tricks: [0, 0, 0, 0], trick: [{ seat: 3, card: "4H" }, { seat: 0, card: "AH" }, { seat: 1, card: "5H" }], hands: [[], [], ["KH", "2H", "AS"], []] };
    // Tricks still wanted: the lowest heart, keeping the king.
    expect(spadesComputer(game)).toEqual({ play: "2H" });
    // Contract made and an opponent winning with the ace: rid the hand of the king under it, a bag it might otherwise take.
    const made: SpadesGame = { ...game, trick: [{ seat: 3, card: "AH" }, { seat: 0, card: "3H" }, { seat: 1, card: "5H" }], tricks: [4, 0, 3, 0] };
    expect(spadesComputer(made)).toEqual({ play: "KH" });
  });
});
