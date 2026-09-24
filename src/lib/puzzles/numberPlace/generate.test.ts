import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { decodeCells } from "../puzzleCode";
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
});
