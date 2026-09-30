import { describe, expect, it } from "vitest";

import { checkSolution, checkOutOfGuesses } from "../puzzleCheck";
import { generatePuzzle } from "../generate";

import { checkFreeCell } from "./check";
import { dealFreeCell, dealOfSeed, deckOf, decodeMoves, encodeMoves, freeCellFinishingMoves, freeCellLiftable, freeCellMoveFor, freeCellStuck, freeCellWon, mostCarried, playFreeCell, replayFreeCell, runLength } from "@johnmorrisdotca/toranpu/freecell";
import type { FreeCellTable } from "@johnmorrisdotca/toranpu/freecell";

/** A card by rank and suit letter, as the rules number it: suit × 13 + rank − 1, spades hearts diamonds clubs. */
const card = (rank: number, suit: "S" | "H" | "D" | "C") => "SHDC".indexOf(suit) * 13 + rank - 1;

/** A table built by hand: columns bottom up, the cells, and the foundations' counts. */
function tableOf(columns: number[][], cells: (number | null)[] = [null, null, null, null], foundation = [0, 0, 0, 0]): FreeCellTable {
  const tableau = [...columns, ...Array.from({ length: 8 - columns.length }, () => [])];
  return { tableau, cells, foundation };
}

describe("a freecell game written down and checked", () => {
  it("writes a carry between columns with its count, and reads it back", () => {
    const moves = [
      { from: "1" as const, to: "a" as const, count: 1 },
      { from: "2" as const, to: "3" as const, count: 12 },
      { from: "b" as const, to: "H" as const, count: 1 },
    ];
    expect(encodeMoves(moves)).toBe("1a23cbH");
    expect(decodeMoves("1a23cbH")).toEqual(moves);
    expect(decodeMoves("12"), "a column to a column says how many").toBeNull();
    expect(decodeMoves("1x")).toBeNull();
  });

  it("makes a winnable deal at every number of cells, whose line the server's check accepts", () => {
    for (const cells of [4, 3, 2]) {
      const puzzle = generatePuzzle("freecell", cells, "medium", 42);
      expect(puzzle.givens).toBe(dealOfSeed(puzzle.seed));
      expect(checkSolution("freecell", cells, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
      const tables = replayFreeCell(puzzle.givens, cells, puzzle.solution)!;
      expect(freeCellWon(tables.at(-1)!)).toBe(true);
      // The line is not accepted at fewer cells than it was won with, where it would carry more than the room allows or use a cell the table lacks.
      if (cells > 2) expect(checkFreeCell(2, puzzle.givens, puzzle.solution).ok).toBe(false);
    }
  });

  it("takes a game given up only when it was played and not won", () => {
    const puzzle = generatePuzzle("freecell", 4, "medium", 42);
    const first = encodeMoves(decodeMoves(puzzle.solution)!.slice(0, 3));
    expect(checkOutOfGuesses("freecell", 4, puzzle.givens, first, "medium")).toEqual({ ok: true });
    expect(checkOutOfGuesses("freecell", 4, puzzle.givens, "", "medium").ok).toBe(false);
    expect(checkOutOfGuesses("freecell", 4, puzzle.givens, puzzle.solution, "medium").ok).toBe(false);
  });
});
