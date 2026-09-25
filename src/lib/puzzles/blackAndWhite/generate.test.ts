import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { BLACK, decodeBlackAndWhite, EMPTY, encodeBlackAndWhite, linesOf, WHITE } from "./code";
import { generateBlackAndWhite } from "./generate";
import { applySingles, countSolutions, guessDepth } from "./solve";

/** The rules restated for the test, independent of the solver: half each, no three alike, no line repeated. */
function keepsTheRules(cells: readonly number[], size: number): boolean {
  const lines = linesOf(size).map((line) => line.map((index) => cells[index]));
  for (const line of lines) {
    if (line.filter((cell) => cell === BLACK).length * 2 !== size) return false;
    for (let k = 2; k < size; k += 1) if (line[k] === line[k - 1] && line[k] === line[k - 2]) return false;
  }
  const rows = lines.slice(0, size).map((line) => line.join(""));
  const cols = lines.slice(size).map((line) => line.join(""));
  return new Set(rows).size === size && new Set(cols).size === size;
}

/**
 * A Black and White puzzle is a puzzle: one answer, that answer keeping every
 * rule, every printed stone in it, and nothing printed that is not needed.
 */
describe("generating Black and White", () => {
  const spec = PUZZLE_SPECS.blackAndWhite;

  for (const size of spec.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size}×${size} ${level} has exactly one answer, and the answer keeps every rule`, () => {
        for (const seed of [1, 2]) {
          const puzzle = generateBlackAndWhite(size, level, seed);
          const givens = decodeBlackAndWhite(puzzle.givens, size)!;
          const solution = decodeBlackAndWhite(puzzle.solution, size)!;
          expect(countSolutions(givens, size, 2)).toBe(1);
          expect(keepsTheRules(solution, size)).toBe(true);
          givens.forEach((given, index) => {
            if (given !== EMPTY) expect(given).toBe(solution[index]);
          });
        }
      });
    }

    it(`${size}×${size} easy yields to looking alone`, () => {
      const easy = generateBlackAndWhite(size, "easy", 8);
      const givens = decodeBlackAndWhite(easy.givens, size)!;
      expect(guessDepth(givens, size)).toBe(0);
      expect(applySingles(givens, size).solved).toBe(true);
    });
  }

  it("keeps nothing it does not need: taking any printed stone away loosens the puzzle", () => {
    const puzzle = generateBlackAndWhite(8, "medium", 21);
    const givens = decodeBlackAndWhite(puzzle.givens, 8)!;
    givens.forEach((given, index) => {
      if (given === EMPTY) return;
      const without = givens.map((cell, at) => (at === index ? EMPTY : cell));
      expect(countSolutions(without, 8, 2) !== 1 || guessDepth(without, 8) > 1, `the stone at ${index} could be taken away`).toBe(true);
    });
  });

  it("makes the same puzzle from the same seed, and a different one from another", () => {
    const one = generateBlackAndWhite(8, "medium", 4242);
    expect(generateBlackAndWhite(8, "medium", 4242)).toEqual(one);
    expect(generateBlackAndWhite(8, "medium", 4243).solution).not.toBe(one.solution);
  });

  it("makes a hard 12×12 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [31, 32, 33]) generateBlackAndWhite(12, "hard", seed);
    expect((performance.now() - started) / 3).toBeLessThan(4000);
  });
});

describe("the Black and White glance", () => {
  it("closes a pair at both ends, fills a gap, and fills a line whose half of one colour is used", () => {
    // The first row of a 6×6, b b . w . w: the pair of blacks makes cell 2 white, and the gap in w . w makes cell 4 black.
    const grid = new Array<number>(36).fill(EMPTY);
    [BLACK, BLACK, EMPTY, WHITE, EMPTY, WHITE].forEach((cell, k) => (grid[k] = cell));
    const seen = applySingles(grid, 6).grid.slice(0, 6);
    expect(seen).toEqual([BLACK, BLACK, WHITE, WHITE, BLACK, WHITE]);
  });

  it("the check refuses three alike, an uneven line and two rows the same", () => {
    const puzzle = generateBlackAndWhite(6, "easy", 3);
    const solution = decodeBlackAndWhite(puzzle.solution, 6)!;
    expect(checkSolution("blackAndWhite", 6, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
    const flipped = solution.map((cell) => (cell === BLACK ? WHITE : BLACK));
    // Every stone turned over keeps the rules, so only the printed stones can refuse it.
    expect(checkSolution("blackAndWhite", 6, encodeBlackAndWhite(new Array(36).fill(EMPTY)), encodeBlackAndWhite(flipped))).toEqual({ ok: true });
    expect(checkSolution("blackAndWhite", 6, puzzle.givens, encodeBlackAndWhite(flipped)).ok).toBe(false);
    const copied = [...solution.slice(0, 6), ...solution.slice(0, 6), ...solution.slice(12)];
    expect(checkSolution("blackAndWhite", 6, encodeBlackAndWhite(new Array(36).fill(EMPTY)), encodeBlackAndWhite(copied)).ok).toBe(false);
    expect(checkSolution("blackAndWhite", 6, puzzle.givens, puzzle.givens).ok).toBe(false);
  });

  it("round-trips the grid, and refuses what is not one", () => {
    expect(encodeBlackAndWhite([BLACK, WHITE, EMPTY, BLACK])).toBe("bw.b");
    expect(decodeBlackAndWhite("bw.b", 2)).toEqual([BLACK, WHITE, EMPTY, BLACK]);
    expect(decodeBlackAndWhite("bw.x", 2)).toBeNull();
    expect(decodeBlackAndWhite("bw.", 2)).toBeNull();
  });
});
