import { describe, expect, it } from "vitest";

import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { generatePuzzle } from "../generate";

import { decodeMoves, encodeMoves, replaySpider, spiderDealOfSeed, spiderDeckOf } from "./code";
import { spiderBestMove, spiderLiftable, spiderMoveFor } from "./intent";
import { canDeal, dealSpider, playSpider, runLength, spiderDeck, spiderWon } from "./rules";
import type { SpiderColumn, SpiderTable } from "./spider.types";

/** A card by rank and suit letter, as the rules number it: suit × 13 + rank − 1, spades hearts diamonds clubs. */
const card = (rank: number, suit: "S" | "H" | "D" | "C") => "SHDC".indexOf(suit) * 13 + rank - 1;
const up = (...cards: number[]): SpiderColumn => ({ down: 0, cards });

/** A table built by hand: the columns given, the rest holding one card each so the stock may deal. */
function tableOf(columns: SpiderColumn[], stock: number[] = [], done: number[] = []): SpiderTable {
  const filler = Array.from({ length: 10 - columns.length }, () => up(card(13, "C")));
  return { tableau: [...columns, ...filler], stock, done };
}

describe("spider's decks and deal", () => {
  it("makes two decks of the suits asked for: eight sets of spades, four each of two suits, or two of four", () => {
    for (const suits of [1, 2, 4]) {
      const deck = spiderDeck(suits);
      expect(deck).toHaveLength(104);
      expect(new Set(deck.map((each) => Math.floor(each / 13))).size).toBe(suits);
    }
    expect(() => spiderDeck(3)).toThrow();
  });

  it("deals six to the first four columns and five to the rest, only the top face up, and fifty to the stock", () => {
    const table = dealSpider(spiderDeckOf(spiderDealOfSeed(5, 4), 4)!);
    expect(table.tableau.map((column) => column.cards.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    expect(table.tableau.every((column) => column.down === column.cards.length - 1)).toBe(true);
    expect(table.stock).toHaveLength(50);
  });

  it("reads a deal back only as two decks of its own suits", () => {
    const deal = spiderDealOfSeed(5, 2);
    expect(spiderDeckOf(deal, 2)).not.toBeNull();
    expect(spiderDeckOf(deal, 4), "two suits' deal read as four").toBeNull();
    expect(spiderDeckOf(deal.slice(1), 2)).toBeNull();
  });
});

describe("spider's rules", () => {
  it("puts a card on any card one higher, whatever its suit, and anything into an empty column", () => {
    const table = tableOf([up(card(9, "H")), up(card(8, "S")), up(card(8, "D")), { down: 0, cards: [] }]);
    expect(playSpider(table, { kind: "carry", from: 1, to: 0, count: 1 })).not.toBeNull();
    expect(playSpider(table, { kind: "carry", from: 1, to: 2, count: 1 }), "an 8 on an 8").toBeNull();
    expect(playSpider(table, { kind: "carry", from: 2, to: 3, count: 1 })).not.toBeNull();
  });

  it("moves a run as a whole only while it is one suit and in order", () => {
    const mixed = up(card(9, "S"), card(8, "H"), card(7, "H"));
    expect(runLength(mixed)).toBe(2);
    const table = tableOf([mixed, up(card(10, "D")), up(card(9, "C"))]);
    expect(playSpider(table, { kind: "carry", from: 0, to: 1, count: 3 }), "the 9 of spades is not the hearts' suit").toBeNull();
    expect(playSpider(table, { kind: "carry", from: 0, to: 2, count: 2 })!.tableau[2].cards).toEqual([card(9, "C"), card(8, "H"), card(7, "H")]);
  });

  it("turns over the card left on top, and takes a full run of one suit off by itself", () => {
    const run = Array.from({ length: 12 }, (_, at) => card(13 - at, "S"));
    const table = tableOf([{ down: 1, cards: [card(4, "D"), card(1, "S")] }, { down: 1, cards: [card(6, "C"), ...run] }]);
    const made = playSpider(table, { kind: "carry", from: 0, to: 1, count: 1 })!;
    expect(made.done).toEqual([0]);
    expect(made.tableau[1]).toEqual({ down: 0, cards: [card(6, "C")] });
    expect(made.tableau[0]).toEqual({ down: 0, cards: [card(4, "D")] });
  });

  it("deals a card onto every column, only while none is empty", () => {
    const stock = Array.from({ length: 10 }, (_, at) => card(at + 1, "H"));
    const table = tableOf([up(card(5, "S"))], stock);
    expect(canDeal(table)).toBe(true);
    const dealt = playSpider(table, { kind: "deal" })!;
    expect(dealt.stock).toHaveLength(0);
    expect(dealt.tableau.map((column) => column.cards.at(-1))).toEqual(stock);
    const gap = tableOf([{ down: 0, cards: [] }], stock);
    expect(playSpider(gap, { kind: "deal" })).toBeNull();
  });

  it("is won with eight runs made", () => {
    expect(spiderWon({ tableau: [], stock: [], done: [0, 0, 0, 0, 0, 0, 0, 0] })).toBe(true);
    expect(spiderWon({ tableau: [], stock: [], done: [0, 0, 0, 0, 0, 0, 0] })).toBe(false);
  });
});

describe("what a spider player means", () => {
  it("lifts a face-up card with the run of its own suit on it, and never a face-down one", () => {
    const table = tableOf([{ down: 1, cards: [card(2, "C"), card(9, "S"), card(8, "S")] }]);
    expect(spiderLiftable(table, { pile: "0", index: 1 })).toEqual([card(9, "S"), card(8, "S")]);
    expect(spiderLiftable(table, { pile: "0", index: 0 })).toEqual([]);
    expect(spiderMoveFor(table, { pile: "0", index: 1 }, "s")).toBeNull();
  });

  it("sends a double-tapped run to its own suit before any other card that takes it", () => {
    const table = tableOf([up(card(7, "H")), up(card(8, "S")), up(card(8, "H"))]);
    expect(spiderBestMove(table, { pile: "0", index: 0 })).toEqual({ kind: "carry", from: 0, to: 2, count: 1 });
  });
});

describe("a spider game written down and checked", () => {
  it("writes a deal as d and a carry as its columns and count, and reads them back", () => {
    const moves = [{ kind: "deal" as const }, { kind: "carry" as const, from: 3, to: 9, count: 11 }];
    expect(encodeMoves(moves)).toBe("d39b");
    expect(decodeMoves("d39b")).toEqual(moves);
    expect(decodeMoves("39"), "a carry says how many").toBeNull();
  });

  it("makes a winnable deal at every number of suits, whose line the server's check accepts", () => {
    for (const suits of [1, 2, 4]) {
      const puzzle = generatePuzzle("spider", suits, "medium", 42);
      expect(puzzle.givens).toBe(spiderDealOfSeed(puzzle.seed, suits));
      expect(checkSolution("spider", suits, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
      expect(spiderWon(replaySpider(puzzle.givens, suits, puzzle.solution)!.at(-1)!)).toBe(true);
    }
  });

  it("takes a game given up only when it was played and not won", () => {
    const puzzle = generatePuzzle("spider", 1, "medium", 42);
    const first = encodeMoves(decodeMoves(puzzle.solution)!.slice(0, 3));
    expect(checkOutOfGuesses("spider", 1, puzzle.givens, first, "medium")).toEqual({ ok: true });
    expect(checkOutOfGuesses("spider", 1, puzzle.givens, "", "medium").ok).toBe(false);
    expect(checkOutOfGuesses("spider", 1, puzzle.givens, puzzle.solution, "medium").ok).toBe(false);
  });
});
