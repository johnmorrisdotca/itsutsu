import { describe, expect, it } from "vitest";

import { generatePuzzle } from "./generate";
import { cellsFilled, pointsFor } from "./puzzlePoints";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS } from "./puzzles.constants";

describe("pointsFor", () => {
  it("is five a filled cell, less fifty a Check or Hint, never below nought", () => {
    expect(pointsFor("numberPlace", 4, "1.3...2.4.......", 0, 0)).toBe(5 * 12);
    expect(pointsFor("numberPlace", 4, "1.3...2.4.......", 1, 0)).toBe(5 * 12 - 50);
    expect(pointsFor("numberPlace", 4, "1.3...2.4.......", 1, 1)).toBe(0);
    expect(pointsFor("numberPlace", 4, "1.3...2.4.......", 3, 3)).toBe(0);
  });

  it("counts only the grid, never the regions, cages or clues written after it", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const size = PUZZLE_SPECS[kind].defaultSize;
      const made = generatePuzzle(kind, size, "easy", 9);
      const filled = cellsFilled(kind, size, made.givens);
      expect(filled, kind).toBeGreaterThan(0);
      expect(filled, kind).toBeLessThanOrEqual(size * size);
    }
  });

  it("scores a harder puzzle higher, because less of it is printed", () => {
    const easy = generatePuzzle("numberPlace", 9, "easy", 4);
    const hard = generatePuzzle("numberPlace", 9, "hard", 4);
    expect(pointsFor("numberPlace", 9, hard.givens, 0, 0)).toBeGreaterThan(pointsFor("numberPlace", 9, easy.givens, 0, 0));
  });
});
