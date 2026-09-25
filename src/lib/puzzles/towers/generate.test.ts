import { describe, expect, it } from "vitest";

import { decodeCells } from "../puzzleCode";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { cluesOf, decodeTowers, encodeTowers, lineFrom, noClues, TOWER_SIDES, towersSeen } from "./code";
import { generateTowers } from "./generate";
import { applySingles, countSolutions, guessDepth } from "./solve";

/**
 * A Towers puzzle is a puzzle: one answer, every clue true of it, nothing in
 * it that is not needed, made the same way from the same seed.
 */
describe("generating Towers", () => {
  const spec = PUZZLE_SPECS.towers;

  for (const size of spec.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size}×${size} ${level} has exactly one answer, and the answer keeps every clue`, () => {
        for (const seed of [1, 2, 3]) {
          const puzzle = generateTowers(size, level, seed);
          const asked = decodeTowers(puzzle.givens, size)!;
          const solution = decodeCells(puzzle.solution, size)!;
          expect(asked).not.toBeNull();
          expect(countSolutions(asked.cells, size, asked.clues, 2)).toBe(1);
          const truth = cluesOf(solution, size);
          for (const side of TOWER_SIDES) {
            asked.clues[side].forEach((clue, at) => {
              if (clue !== 0) expect(clue).toBe(truth[side][at]);
            });
          }
          asked.cells.forEach((given, index) => {
            if (given !== 0) expect(given).toBe(solution[index]);
          });
        }
      });
    }

    it(`${size}×${size} easy yields to reasoning alone`, () => {
      const easy = generateTowers(size, "easy", 8);
      const asked = decodeTowers(easy.givens, size)!;
      expect(guessDepth(asked.cells, size, asked.clues)).toBe(0);
      expect(applySingles(asked.cells, size, asked.clues).solved).toBe(true);
    });
  }

  it("keeps nothing it does not need: taking any clue away loosens the puzzle", () => {
    const puzzle = generateTowers(5, "medium", 21);
    const asked = decodeTowers(puzzle.givens, 5)!;
    for (const side of TOWER_SIDES) {
      asked.clues[side].forEach((clue, at) => {
        if (clue === 0) return;
        const without = { ...asked.clues, [side]: asked.clues[side].map((each, i) => (i === at ? 0 : each)) };
        const loosened = countSolutions(asked.cells, 5, without, 2) !== 1 || guessDepth(asked.cells, 5, without) > 1;
        expect(loosened, `the ${side} clue at ${at} could be taken away`).toBe(true);
      });
    }
  });

  it("makes the same puzzle from the same seed, and a different one from another", () => {
    const one = generateTowers(5, "medium", 4242);
    expect(generateTowers(5, "medium", 4242)).toEqual(one);
    expect(generateTowers(5, "medium", 4243).solution).not.toBe(one.solution);
  });

  it("makes a hard 7×7 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [31, 32, 33]) generateTowers(7, "hard", seed);
    // Four seconds: the gate runs its five lanes side by side.
    expect((performance.now() - started) / 3).toBeLessThan(4000);
  });
});

describe("the Towers code and its geometry", () => {
  it("counts the towers that show: each one taller than all before it", () => {
    expect(towersSeen([1, 2, 3, 4])).toBe(4);
    expect(towersSeen([4, 1, 2, 3])).toBe(1);
    expect(towersSeen([2, 1, 4, 3])).toBe(2);
  });

  it("looks along each side's line from that side, nearest cell first", () => {
    // A 3×3, cells 0..8 row-major.
    expect(lineFrom("top", 1, 3)).toEqual([1, 4, 7]);
    expect(lineFrom("bottom", 1, 3)).toEqual([7, 4, 1]);
    expect(lineFrom("left", 2, 3)).toEqual([6, 7, 8]);
    expect(lineFrom("right", 2, 3)).toEqual([8, 7, 6]);
  });

  it("round-trips the cells and the clues, and refuses what is not one of them", () => {
    const clues = noClues(2);
    clues.top = [2, 0];
    clues.right = [0, 1];
    const code = encodeTowers([0, 2, 0, 0], clues);
    // The cells, then the top, bottom, left and right sides.
    expect(code).toBe(".2.." + "2." + ".." + ".." + ".1");
    expect(decodeTowers(code, 2)).toEqual({ cells: [0, 2, 0, 0], clues });
    expect(decodeTowers(code.slice(1), 2)).toBeNull();
    expect(decodeTowers(`${code.slice(0, -1)}3`, 2)).toBeNull();
  });
});
