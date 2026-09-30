import { describe, expect, it } from "vitest";

import { checkSolution, checkOutOfGuesses } from "../puzzleCheck";
import { generatePuzzle } from "../generate";

import { checkFreeCell } from "./check";
import { dealOfSeed, decodeMoves, deckOf, encodeMoves, replayFreeCell } from "./code";
import type { FreeCellTable } from "./freecell.types";
import { freeCellFinishingMoves, freeCellLiftable, freeCellMoveFor, freeCellStuck } from "./intent";
import { dealFreeCell, freeCellWon, mostCarried, playFreeCell, runLength } from "./rules";

/** A card by rank and suit letter, as the rules number it: suit × 13 + rank − 1, spades hearts diamonds clubs. */
const card = (rank: number, suit: "S" | "H" | "D" | "C") => "SHDC".indexOf(suit) * 13 + rank - 1;

/** A table built by hand: columns bottom up, the cells, and the foundations' counts. */
function tableOf(columns: number[][], cells: (number | null)[] = [null, null, null, null], foundation = [0, 0, 0, 0]): FreeCellTable {
  const tableau = [...columns, ...Array.from({ length: 8 - columns.length }, () => [])];
  return { tableau, cells, foundation };
}

describe("freecell's deal", () => {
  it("deals the whole deck face up into eight columns, seven cards in the first four and six in the rest", () => {
    const table = dealFreeCell(deckOf(dealOfSeed(11))!, 4);
    expect(table.tableau.map((column) => column.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
    expect(new Set(table.tableau.flat()).size).toBe(52);
    expect(table.cells).toEqual([null, null, null, null]);
  });

  it("gives the table the free cells asked for, and refuses none or five", () => {
    expect(dealFreeCell(deckOf(dealOfSeed(11))!, 2).cells).toHaveLength(2);
    expect(() => dealFreeCell(deckOf(dealOfSeed(11))!, 0)).toThrow();
    expect(() => dealFreeCell(deckOf(dealOfSeed(11))!, 5)).toThrow();
  });
});

describe("freecell's rules", () => {
  it("builds down in alternating colours, and any card goes into an empty column", () => {
    const table = tableOf([[card(8, "S")], [card(7, "H")], [card(7, "C")]]);
    expect(playFreeCell(table, { from: "2", to: "1", count: 1 })).not.toBeNull();
    expect(playFreeCell(table, { from: "3", to: "1", count: 1 }), "a black 7 on a black 8").toBeNull();
    expect(playFreeCell(table, { from: "3", to: "5", count: 1 })).not.toBeNull();
  });

  it("puts any card in an empty cell, one card a cell, and only on the cells the table has", () => {
    const table = tableOf([[card(8, "S"), card(2, "D")]], [null, null]);
    const held = playFreeCell(table, { from: "1", to: "a", count: 1 })!;
    expect(held.cells).toEqual([card(2, "D"), null]);
    expect(playFreeCell(held, { from: "1", to: "a", count: 1 }), "the cell is full").toBeNull();
    expect(playFreeCell(held, { from: "1", to: "c", count: 1 }), "a two-cell table has no third").toBeNull();
  });

  it("builds a foundation up from its Ace, and never takes a card back from it", () => {
    const table = tableOf([[card(2, "H"), card(1, "H")]]);
    const one = playFreeCell(table, { from: "1", to: "H", count: 1 })!;
    expect(one.foundation).toEqual([0, 1, 0, 0]);
    expect(playFreeCell(table, { from: "1", to: "S", count: 1 }), "an Ace of hearts on the spades").toBeNull();
    expect(playFreeCell(one, { from: "H", to: "2", count: 1 })).toBeNull();
  });

  it("carries a run only as far as the cells and the empty columns could, a card at a time", () => {
    // A run of four on a black 9, onto a red 10 — with no free cells and no empty column, one card at most.
    const run = [card(9, "S"), card(8, "H"), card(7, "C"), card(6, "D")];
    const full = tableOf([run, [card(10, "D")], [card(1, "S")], [card(1, "H")], [card(1, "D")], [card(1, "C")], [card(2, "S")], [card(2, "H")]], [card(3, "S"), card(3, "H"), card(3, "D"), card(3, "C")]);
    expect(runLength(run)).toBe(4);
    expect(mostCarried(full, false)).toBe(1);
    expect(playFreeCell(full, { from: "1", to: "2", count: 4 })).toBeNull();
    // Two cells free: three cards; an empty column as well: six.
    const roomy = { ...full, cells: [null, null, card(3, "D"), card(3, "C")] };
    expect(mostCarried(roomy, false)).toBe(3);
    expect(playFreeCell(roomy, { from: "1", to: "2", count: 4 })).toBeNull();
    const roomier = { ...roomy, tableau: roomy.tableau.map((column, at) => (at === 7 ? [] : column)) };
    expect(mostCarried(roomier, false)).toBe(6);
    expect(playFreeCell(roomier, { from: "1", to: "2", count: 4 })!.tableau[1]).toEqual([card(10, "D"), ...run]);
  });

  it("does not count the column a run is going into as room to carry it", () => {
    const run = [card(9, "S"), card(8, "H"), card(7, "C")];
    const table = tableOf([run, [card(1, "S")], [card(1, "H")], [card(1, "D")], [card(1, "C")], [card(2, "S")], [card(2, "H")]], [null, card(3, "H"), card(3, "D"), card(3, "C")]);
    // One free cell and one empty column (the eighth): two cards into it, not four.
    expect(mostCarried(table, true)).toBe(2);
    expect(playFreeCell(table, { from: "1", to: "8", count: 3 })).toBeNull();
    expect(playFreeCell(table, { from: "1", to: "8", count: 2 })).not.toBeNull();
  });
});

describe("what a freecell player means", () => {
  it("lifts a card with the run in order on it, and nothing out of order", () => {
    const table = tableOf([[card(4, "C"), card(9, "S"), card(8, "H")]]);
    expect(freeCellLiftable(table, { pile: "1", index: 1 })).toEqual([card(9, "S"), card(8, "H")]);
    expect(freeCellLiftable(table, { pile: "1", index: 0 })).toEqual([]);
  });

  it("reads a drop on a full cell as the next free one", () => {
    const table = tableOf([[card(4, "C")]], [card(5, "H"), null, null, null]);
    expect(freeCellMoveFor(table, { pile: "1", index: 0 }, "a")).toEqual({ from: "1", to: "b", count: 1 });
  });

  it("finishes by itself only once every card left can go home in turn", () => {
    // The spades from King down to Ace in one column, every other suit home: thirteen moves home.
    const spades = Array.from({ length: 13 }, (_, at) => card(13 - at, "S"));
    expect(freeCellFinishingMoves(tableOf([spades], [null, null, null, null], [0, 13, 13, 13]))).toHaveLength(13);
    // The Two over the Ace: a move is still the player's to make.
    const swapped = [...spades.slice(0, 11), card(1, "S"), card(2, "S")];
    expect(freeCellFinishingMoves(tableOf([swapped], [null, null, null, null], [0, 13, 13, 13]))).toBeNull();
  });

  it("is stuck only where no card can move at all", () => {
    expect(freeCellStuck(dealFreeCell(deckOf(dealOfSeed(3))!, 4))).toBe(false);
  });
});

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
