import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { decodeCells, encodeCells, symbolOf, valueOfSymbol } from "../puzzleCode";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { generateNumberPlace } from "./generate";
import { boxedLayout } from "./layout";
import { applySingles, countSolutions, guessDepth } from "./solve";

/**
 * A Number Place puzzle is a puzzle: one answer, reachable by the level's
 * reasoning, made the same way from the same seed every time.
 */
describe("generating Number Place", () => {
  const sizes = PUZZLE_SPECS.numberPlace.sizes;

  for (const size of sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size}×${size} ${level} has exactly one answer, and the answer solves it`, () => {
        for (const seed of [1, 2, 3]) {
          const puzzle = generateNumberPlace(size, level, seed);
          const givens = decodeCells(puzzle.givens, size);
          expect(givens).not.toBeNull();
          expect(countSolutions(givens!, boxedLayout(size), 2)).toBe(1);
          expect(checkSolution("numberPlace", size, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
          expect(puzzle.givens.length).toBe(size * size);
          expect(puzzle.solution).not.toContain(".");
        }
      });
    }

    it(`${size}×${size} easy yields to singles alone, and hard has fewer givens than easy`, () => {
      const easy = generateNumberPlace(size, "easy", 7);
      const hard = generateNumberPlace(size, "hard", 7);
      expect(guessDepth(decodeCells(easy.givens, size)!, boxedLayout(size))).toBe(0);
      expect(applySingles(decodeCells(easy.givens, size)!, boxedLayout(size)).solved).toBe(true);
      const count = (code: string) => [...code].filter((c) => c !== ".").length;
      expect(count(hard.givens)).toBeLessThan(count(easy.givens));
    });
  }

  it("makes the same puzzle from the same seed, and a different one from another", () => {
    const one = generateNumberPlace(9, "medium", 12345);
    const again = generateNumberPlace(9, "medium", 12345);
    const other = generateNumberPlace(9, "medium", 12346);
    expect(again).toEqual(one);
    expect(other.solution).not.toBe(one.solution);
  });

  it("makes a hard 9×9 in the time a browser can spare", () => {
    // The set-up shows "making your puzzle"; nobody should read that for long.
    const started = performance.now();
    for (const seed of [11, 12, 13]) generateNumberPlace(9, "hard", seed);
    expect((performance.now() - started) / 3).toBeLessThan(1500);
  });

  it("makes a hard 16×16 in the time a browser can spare, every box of four by four", () => {
    const started = performance.now();
    for (const seed of [21, 22, 23]) {
      const puzzle = generateNumberPlace(16, "hard", seed);
      expect(checkSolution("numberPlace", 16, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
      expect(countSolutions(decodeCells(puzzle.givens, 16)!, boxedLayout(16), 2)).toBe(1);
    }
    expect((performance.now() - started) / 3).toBeLessThan(1500);
  });

  it("leaves every smaller grid exactly as its seed always made it", () => {
    // The 16×16 is filled another way. These are what the seeds made before it existed, so a race or a kept puzzle
    // from then still makes the grid it was started on.
    expect(generateNumberPlace(4, "medium", 20260924)).toMatchObject({ givens: "....234..2..312.", solution: "1432234142133124" });
    expect(generateNumberPlace(6, "medium", 20260924)).toMatchObject({ givens: ".3...546...16......54.12..6.5..2.1.6", solution: "231465465321612534354612146253523146" });
    expect(generateNumberPlace(9, "medium", 20260924)).toMatchObject({ givens: "....7..1...59127...1...45...7...1.8...124...7.3.7981.2.9.48..21.......3.68.......", solution: "948675213365912748712834569279351486851246397436798152593487621127569834684123975" });
  });
});

describe("the cells past nine are letters", () => {
  it("writes 10 to 16 as A to G and reads them back", () => {
    expect([9, 10, 16].map(symbolOf)).toEqual(["9", "A", "G"]);
    expect(encodeCells([0, 1, 10, 16])).toBe(".1AG");
    expect(decodeCells(".1AG", 2)).toBeNull();
    const row = Array.from({ length: 16 }, (_, i) => i + 1);
    const grid = Array.from({ length: 16 }, () => row).flat();
    expect(decodeCells(encodeCells(grid), 16)).toEqual(grid);
  });

  it("reads a typed letter in either case, but a code only in capitals", () => {
    expect(valueOfSymbol("a")).toBe(10);
    expect(valueOfSymbol("G")).toBe(16);
    expect(valueOfSymbol("H")).toBe(0);
    expect(valueOfSymbol("0")).toBe(0);
    expect(decodeCells("a".padEnd(256, "."), 16)).toBeNull();
    expect(decodeCells("A".padEnd(256, "."), 16)).not.toBeNull();
  });

  it("refuses a letter past the grid's side", () => {
    expect(decodeCells("A".padEnd(81, "."), 9)).toBeNull();
  });
});
