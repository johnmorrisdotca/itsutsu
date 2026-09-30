import { describe, expect, it } from "vitest";

import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { generatePuzzle } from "../generate";

import { canDeal, dealSpider, decodeMoves, encodeMoves, playSpider, replaySpider, runLength, spiderBestMove, spiderDealOfSeed, spiderDeck, spiderDeckOf, spiderLiftable, spiderMoveFor, spiderWon } from "@johnmorrisdotca/toranpu/spider";
import type { SpiderColumn, SpiderTable } from "@johnmorrisdotca/toranpu/spider";

/** A card by rank and suit letter, as the rules number it: suit × 13 + rank − 1, spades hearts diamonds clubs. */
const card = (rank: number, suit: "S" | "H" | "D" | "C") => "SHDC".indexOf(suit) * 13 + rank - 1;
const up = (...cards: number[]): SpiderColumn => ({ down: 0, cards });

/** A table built by hand: the columns given, the rest holding one card each so the stock may deal. */
function tableOf(columns: SpiderColumn[], stock: number[] = [], done: number[] = []): SpiderTable {
  const filler = Array.from({ length: 10 - columns.length }, () => up(card(13, "C")));
  return { tableau: [...columns, ...filler], stock, done };
}

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
