import { describe, expect, it } from "vitest";

import { cagedLayout } from "../numberPlace/layout";
import { countSolutions } from "../numberPlace/solve";
import { checkSolution } from "../puzzleCheck";
import { decodeCells } from "../puzzleCode";
import { decodeKiller, encodeKiller } from "./code";
import { generateSumCages } from "./generate";

/**
 * Sum Cages (our Killer Sudoku): the cages are what is new, so the tests are
 * about the cages — that each adds to its printed sum and holds no number
 * twice, that the cages with their sums have exactly one answer, and that the
 * check refuses a grid that is right as Number Place and wrong in a cage.
 */
describe("sumCages", () => {
  for (const size of [6, 9]) {
    for (const level of ["easy", "medium", "hard"] as const) {
      it(`${size}×${size} ${level}: every cage adds to its sum, holds no number twice, and the puzzle has one answer`, () => {
        const puzzle = generateSumCages(size, level, 17);
        const read = decodeKiller(puzzle.givens, size)!;
        const solution = decodeCells(puzzle.solution, size)!;
        expect(read.cages.flatMap((cage) => cage.cells).sort((a, b) => a - b)).toEqual(Array.from({ length: size * size }, (_, i) => i));
        for (const cage of read.cages) {
          const values = cage.cells.map((index) => solution[index]!);
          expect(new Set(values).size).toBe(values.length);
          expect(values.reduce((a, b) => a + b, 0)).toBe(cage.sum);
        }
        // Printed numbers are exactly the cages of one cell.
        read.cells.forEach((value, index) => {
          const alone = read.cages.some((cage) => cage.cells.length === 1 && cage.cells[0] === index);
          expect(value !== 0, `cell ${index}`).toBe(alone);
        });
        expect(countSolutions(read.cells, cagedLayout(size, read.cages), 2)).toBe(1);
      });
    }
  }

  it("the harder level has bigger cages and fewer printed numbers than the easy one", () => {
    const shape = (level: "easy" | "hard") => {
      const read = decodeKiller(generateSumCages(9, level, 23).givens, 9)!;
      return { biggest: Math.max(...read.cages.map((cage) => cage.cells.length)), printed: read.cells.filter((v) => v !== 0).length };
    };
    const easy = shape("easy");
    const hard = shape("hard");
    expect(hard.biggest).toBeGreaterThan(easy.biggest);
    expect(hard.printed).toBeLessThan(easy.printed);
  });

  it("reads back the code it writes, and refuses a code that names a cage with no sum", () => {
    const cages = [
      { cells: [0, 1], sum: 3 },
      { cells: [2, 3], sum: 7 },
    ];
    const cells = [0, 0, 0, 0];
    // A 2×2 is no puzzle; this is only the code's shape.
    const code = encodeKiller(cells, cages);
    expect(decodeKiller(code, 2)).toEqual({ cells, cages });
    expect(decodeKiller(code.slice(0, -2), 2)).toBeNull();
  });

  it("the check refuses a grid that is right as Number Place and wrong in a cage", () => {
    const puzzle = generateSumCages(6, "easy", 5);
    expect(checkSolution("sumCages", 6, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
    // The same grid with two whole bands swapped: every row, column and box still right; the cages are not.
    const grid = decodeCells(puzzle.solution, 6)!;
    const swapped = [...grid.slice(12, 24), ...grid.slice(0, 12), ...grid.slice(24)];
    const blank = ".".repeat(36) + puzzle.givens.slice(36);
    const verdict = checkSolution("sumCages", 6, blank, swapped.join(""));
    expect(verdict.ok).toBe(false);
  });
});
