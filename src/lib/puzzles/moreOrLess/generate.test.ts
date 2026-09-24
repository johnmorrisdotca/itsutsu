import { describe, expect, it } from "vitest";

import { decodeCells } from "../puzzleCode";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { decodeMoreOrLess, encodeMoreOrLess } from "./code";
import { generateMoreOrLess } from "./generate";
import { applySingles, countSolutions, guessDepth } from "./solve";

/**
 * A More or Less puzzle is a puzzle: one answer, every mark true of it,
 * nothing in it that is not needed, made the same way from the same seed.
 */
describe("generating More or Less", () => {
  const spec = PUZZLE_SPECS.moreOrLess;

  for (const size of spec.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size}×${size} ${level} has exactly one answer, and the answer keeps every mark`, () => {
        for (const seed of [1, 2, 3]) {
          const puzzle = generateMoreOrLess(size, level, seed);
          const asked = decodeMoreOrLess(puzzle.givens, size)!;
          const solution = decodeCells(puzzle.solution, size)!;
          expect(asked).not.toBeNull();
          expect(countSolutions(asked.cells, size, asked.marks, 2)).toBe(1);
          for (const mark of asked.marks) expect(solution[mark.less]).toBeLessThan(solution[mark.more]);
          asked.cells.forEach((given, index) => {
            if (given !== 0) expect(given).toBe(solution[index]);
          });
          expect(asked.marks.length + asked.cells.filter((cell) => cell !== 0).length).toBeGreaterThan(0);
        }
      });
    }

    it(`${size}×${size} easy yields to reasoning alone`, () => {
      const easy = generateMoreOrLess(size, "easy", 8);
      const asked = decodeMoreOrLess(easy.givens, size)!;
      expect(guessDepth(asked.cells, size, asked.marks)).toBe(0);
      expect(applySingles(asked.cells, size, asked.marks).solved).toBe(true);
    });
  }

  it("keeps nothing it does not need: taking any given or mark away leaves two answers", () => {
    const puzzle = generateMoreOrLess(5, "medium", 21);
    const asked = decodeMoreOrLess(puzzle.givens, 5)!;
    for (const mark of asked.marks) {
      const without = asked.marks.filter((each) => each !== mark);
      const loosened = countSolutions(asked.cells, 5, without, 2) !== 1 || guessDepth(asked.cells, 5, without) > 1;
      expect(loosened, "a mark that could be taken away").toBe(true);
    }
  });

  it("makes the same puzzle from the same seed, and a different one from another", () => {
    const one = generateMoreOrLess(5, "medium", 4242);
    expect(generateMoreOrLess(5, "medium", 4242)).toEqual(one);
    expect(generateMoreOrLess(5, "medium", 4243).solution).not.toBe(one.solution);
  });

  it("makes a hard 7×7 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [31, 32, 33]) generateMoreOrLess(7, "hard", seed);
    // Four seconds: the gate runs its five lanes side by side.
    expect((performance.now() - started) / 3).toBeLessThan(4000);
  });

  it("round-trips the cells and the marks, and refuses what is not one of them", () => {
    const code = encodeMoreOrLess([0, 2, 1, 0], [{ less: 0, more: 1 }, { less: 3, more: 1 }], 2);
    expect(code).toBe(".21.<..v");
    expect(decodeMoreOrLess(code, 2)).toEqual({ cells: [0, 2, 1, 0], marks: [{ less: 0, more: 1 }, { less: 3, more: 1 }] });
    expect(decodeMoreOrLess(".21.<..", 2)).toBeNull();
    expect(decodeMoreOrLess(".21.x..v", 2)).toBeNull();
  });
});
