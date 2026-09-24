import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { decodeCells, encodeCells } from "../puzzleCode";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { boxedLayout, regionLayout, regionsAreSound } from "../numberPlace/layout";
import { applySingles, countSolutions, guessDepth } from "../numberPlace/solve";
import { generateDiagonal } from "../numberPlace/generate";
import { seededRandom } from "../random";
import { decodeJigsaw, encodeJigsaw } from "./code";
import { generateJigsaw, shakeRegions } from "./generate";

/**
 * JIGSAW AND DIAGONAL: Number Place on other groups, made in the browser from
 * a seed, each with exactly one answer the server's one-pass check accepts.
 */
describe("generating a Jigsaw", () => {
  for (const size of PUZZLE_SPECS.jigsaw.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size}×${size} ${level} has exactly one answer, on irregular regions, and the answer solves it`, () => {
        for (const seed of [1, 2, 3]) {
          const puzzle = generateJigsaw(size, level, seed);
          const asked = decodeJigsaw(puzzle.givens, size);
          expect(asked).not.toBeNull();
          expect(regionsAreSound(size, asked!.regions)).toBe(true);
          expect(countSolutions(asked!.cells, regionLayout(size, asked!.regions), 2)).toBe(1);
          expect(checkSolution("jigsaw", size, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
        }
      });
    }

    it(`${size}×${size} easy yields to singles alone`, () => {
      const easy = decodeJigsaw(generateJigsaw(size, "easy", 7).givens, size)!;
      const layout = regionLayout(size, easy.regions);
      expect(guessDepth(easy.cells, layout)).toBe(0);
      expect(applySingles(easy.cells, layout).solved).toBe(true);
    });
  }

  it("shakes regions that are sound and never a plain row or column, over many seeds", () => {
    for (const size of PUZZLE_SPECS.jigsaw.sizes) {
      for (let seed = 1; seed <= 200; seed += 1) {
        const region = shakeRegions(size, seededRandom(seed));
        expect(regionsAreSound(size, region)).toBe(true);
        for (let group = 0; group < size; group += 1) {
          const cells = region.flatMap((value, index) => (value === group ? [index] : []));
          expect(new Set(cells.map((index) => Math.floor(index / size))).size).toBeGreaterThan(1);
          expect(new Set(cells.map((index) => index % size)).size).toBeGreaterThan(1);
        }
      }
    }
  });

  it("makes the same puzzle from the same seed", () => {
    expect(generateJigsaw(9, "medium", 12345)).toEqual(generateJigsaw(9, "medium", 12345));
  });

  it("makes a hard 9×9 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [11, 12, 13]) generateJigsaw(9, "hard", seed);
    expect((performance.now() - started) / 3).toBeLessThan(1500);
  });

  it("refuses a grid that breaks a region, and regions that do not divide the grid", () => {
    const puzzle = generateJigsaw(5, "medium", 4);
    const asked = decodeJigsaw(puzzle.givens, 5)!;
    // A correct Latin square that ignores the regions: the rows shifted by one each.
    const latin = Array.from({ length: 25 }, (_, index) => ((Math.floor(index / 5) + (index % 5)) % 5) + 1);
    const breaks = checkSolution("jigsaw", 5, encodeJigsaw(new Array<number>(25).fill(0), asked.regions), encodeCells(latin));
    expect(breaks.ok).toBe(regionLayout(5, asked.regions).groups.slice(10).every((cells) => new Set(cells.map((i) => latin[i])).size === 5));
    // Regions that do not divide the grid: region 0 takes six cells and region 4 four. Refused before the grid is read.
    const unsound = encodeJigsaw(new Array<number>(25).fill(0), Array.from({ length: 25 }, (_, i) => (i === 24 ? 0 : i % 5)));
    expect(checkSolution("jigsaw", 5, unsound, encodeCells(latin))).toEqual({ ok: false, reason: "the regions do not divide the grid" });
  });
});

describe("generating a Diagonal", () => {
  for (const size of PUZZLE_SPECS.diagonal.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size}×${size} ${level} has exactly one answer with both diagonals whole, and the answer solves it`, () => {
        for (const seed of [1, 2, 3]) {
          const puzzle = generateDiagonal(size, level, seed);
          const givens = decodeCells(puzzle.givens, size)!;
          const solution = decodeCells(puzzle.solution, size)!;
          expect(solution).not.toContain(0);
          expect(countSolutions(givens, boxedLayout(size, true), 2)).toBe(1);
          expect(new Set(Array.from({ length: size }, (_, i) => solution[i * size + i])).size).toBe(size);
          expect(new Set(Array.from({ length: size }, (_, i) => solution[i * size + size - 1 - i])).size).toBe(size);
          expect(checkSolution("diagonal", size, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
        }
      });
    }
  }

  it("refuses a plain Number Place answer whose diagonals repeat", () => {
    const puzzle = generateDiagonal(9, "medium", 5);
    const solution = decodeCells(puzzle.solution, 9)!;
    // Swap two digits everywhere: still a valid plain grid and diagonal grid, so instead break a diagonal by swapping two rows in a band.
    const swapped = [...solution.slice(9, 18), ...solution.slice(0, 9), ...solution.slice(18)];
    const verdict = checkSolution("diagonal", 9, encodeCells(new Array<number>(81).fill(0)), encodeCells(swapped));
    const diagonalWhole = new Set(Array.from({ length: 9 }, (_, i) => swapped[i * 9 + i])).size === 9 && new Set(Array.from({ length: 9 }, (_, i) => swapped[i * 9 + 8 - i])).size === 9;
    expect(verdict.ok).toBe(diagonalWhole);
  });

  it("makes a hard 9×9 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [11, 12, 13]) generateDiagonal(9, "hard", seed);
    expect((performance.now() - started) / 3).toBeLessThan(1500);
  });
});
