import { beforeAll, describe, expect, it } from "vitest";

import { generatePuzzle, prepareEveryPuzzle } from "./generate";

// The kana Gomoji is made from a list loaded a length at a time: load them all before anything is made.
beforeAll(prepareEveryPuzzle);
import { guessesFor } from "./gomoji/layout";
import { PUZZLE_CODE_LONGEST, PUZZLE_KIND_LIST, PUZZLE_SPECS } from "./puzzles.constants";

/*
 * Every puzzle a browser can make fits what the routes accept. The solved
 * route capped a code at 100 characters, and a 9×9 Jigsaw (162) and a 7×7 More
 * or Less (133) were refused as bad requests — solved, and never kept or paid.
 */
describe("puzzle codes fit the routes", () => {
  it("at every kind and size, the givens and the answer are within the kind's mostCells and the routes' cap", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const spec = PUZZLE_SPECS[kind];
      for (const size of spec.sizes) {
        const made = generatePuzzle(kind, size, spec.levels[0]!, 3);
        for (const code of [made.givens, made.solution]) {
          expect(code.length, `${kind} ${size}`).toBeLessThanOrEqual(spec.mostCells);
          expect(code.length, `${kind} ${size}`).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
        }
      }
    }
  });

  /*
   * A word puzzle hands in every guess it made, not the one word, so its
   * longest answer is the most guesses its most generous level gives, each a
   * word long. The check above measured the word alone, and passed while every
   * medium solve found on the seventh guess was refused (John's MUSTY,
   * 2026-09-26: "Not a grid of that size", solved and never kept).
   */
  it("at every word puzzle, size and level, every guess the level gives fits what the solved route accepts", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const spec = PUZZLE_SPECS[kind];
      if (spec.wordGrid === undefined) continue;
      const grid = spec.wordGrid;
      for (const size of spec.sizes) {
        for (const level of spec.levels) {
          // The kana version may give a free grey word; the most guesses is the larger of the two.
          const most = Math.max(guessesFor(grid, size, level, 0), grid === "gomojiKana" ? guessesFor(grid, size, level, 1) : 0);
          expect(most * size, `${kind} ${size} ${level}: ${most} guesses of ${size}`).toBeLessThanOrEqual(spec.mostCells);
          expect(most * size, `${kind} ${size} ${level}`).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
        }
      }
    }
  });
});
