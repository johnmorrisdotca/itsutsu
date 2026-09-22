import { describe, expect, it } from "vitest";

import { MOVE_FORMATS, formatsFor, readMoves } from "./readMoves";

/**
 * The corpus is the point of this file.
 *
 * John: "be flexible for badly formatted moves." Every ugly case below is a
 * shape a real list comes in — a forum post with move numbers, an email that
 * wrapped, a Japanese keyboard's full-width digits, a typist's letter O for a
 * zero, a result pasted along with the game. A reader that only handles the
 * tidy case is a reader for lists nobody has.
 */
const COORDS = [MOVE_FORMATS.coordinates, MOVE_FORMATS.sgf];

describe("reading a pasted moves list", () => {
  it("reads the plain case", () => {
    const read = readMoves("H8 K10 J9", 15, COORDS);
    expect(read.format).toBe(MOVE_FORMATS.coordinates);
    expect(read.problem).toBeNull();
    // H is the 8th column with I skipped, and row 8 of fifteen is array row 7.
    expect(read.points[0]).toEqual({ row: 7, col: 7 });
    expect(read.points).toHaveLength(3);
  });

  it("reads it run together, in lower case, and with no spaces", () => {
    expect(readMoves("h8k10j9", 15, COORDS).points).toEqual(readMoves("H8 K10 J9", 15, COORDS).points);
  });

  it("skips the column I, as a go board does", () => {
    // J is the ninth column, not the tenth, because I is never used.
    expect(readMoves("J1", 15, COORDS).points[0]).toEqual({ row: 14, col: 8 });
  });

  describe("the mess real lists come in", () => {
    const plain = readMoves("H8 K10 J9", 15, COORDS).points;

    it("drops move numbers in front", () => {
      expect(readMoves("1. H8 2. K10 3. J9", 15, COORDS).points).toEqual(plain);
      expect(readMoves("1) H8 2) K10 3) J9", 15, COORDS).points).toEqual(plain);
    });

    it("takes line breaks and tabs anywhere", () => {
      expect(readMoves("H8\n\tK10\r\n  J9\n", 15, COORDS).points).toEqual(plain);
    });

    it("takes full-width characters off a Japanese keyboard", () => {
      expect(readMoves("Ｈ８　Ｋ１０　Ｊ９", 15, COORDS).points).toEqual(plain);
    });

    it("reads the letter O as the zero it was meant to be", () => {
      expect(readMoves("H8 K1O J9", 15, COORDS).points).toEqual(plain);
    });

    it("drops a result pasted on the end", () => {
      for (const result of ["1-0", "0-1", "1/2-1/2", "resigns", "*"]) {
        expect(readMoves(`H8 K10 J9 ${result}`, 15, COORDS).points, result).toEqual(plain);
      }
    });

    it("takes a pair of numbers as column and row", () => {
      // "8,8" is the centre of a fifteen board, counting both from one.
      expect(readMoves("8,8", 15, COORDS).points[0]).toEqual({ row: 7, col: 7 });
    });
  });

  describe("saying what it could not read", () => {
    /*
     * THE HALF-READ LIST IS THE CASE THAT MATTERS. A reader that drops what it
     * cannot understand turns a misprint into a different game, silently.
     */
    it("keeps the moves before the bad one, and names it", () => {
      const read = readMoves("H8 K10 Z99 J9", 15, COORDS);
      expect(read.points).toHaveLength(2);
      expect(read.problem).toContain("Z99");
      expect(read.problem).toContain("15×15");
    });

    it("reports a word it could not read at all, rather than ignoring it", () => {
      const read = readMoves("H8 K10 what", 15, COORDS);
      expect(read.points).toHaveLength(2);
      expect(read.problem).toContain("what");
    });

    it("says so plainly when nothing in it is a move", () => {
      const read = readMoves("hello there", 15, COORDS);
      expect(read.points).toEqual([]);
      expect(read.format).toBeNull();
      expect(read.problem).toContain("Could not read any moves");
    });

    it("reads an empty box as nothing at all, which is not a complaint", () => {
      expect(readMoves("   \n ", 15, COORDS)).toEqual({ points: [], format: null, problem: null });
    });
  });

  describe("the formats these games are published in", () => {
    it("reads Othello's run-together squares", () => {
      const read = readMoves("f5d6c3", 8, formatsFor("reversi", { flips: true }));
      expect(read.format).toBe(MOVE_FORMATS.squares);
      expect(read.points).toHaveLength(3);
      // F5 on an eight board: column 5 (I is skipped but F is before it), array row 3.
      expect(read.points[0]).toEqual({ row: 3, col: 5 });
    });

    it("reads SGF, counting from the top left as SGF does", () => {
      const read = readMoves(";B[pd];W[dp]", 19, formatsFor("go", { go: true }));
      expect(read.format).toBe(MOVE_FORMATS.sgf);
      expect(read.points).toEqual([
        { row: 3, col: 15 },
        { row: 15, col: 3 },
      ]);
    });

    it("refuses an SGF pass rather than guessing at it", () => {
      const read = readMoves(";B[pd];W[]", 19, formatsFor("go", { go: true }));
      expect(read.points).toHaveLength(1);
      expect(read.problem).toContain("pass");
    });

    it("offers each game the formats it is actually published in, first one first", () => {
      expect(formatsFor("reversi", { flips: true })[0]).toBe(MOVE_FORMATS.squares);
      expect(formatsFor("go", { go: true })[0]).toBe(MOVE_FORMATS.sgf);
      expect(formatsFor("freestyle", {})[0]).toBe(MOVE_FORMATS.coordinates);
    });
  });
});
