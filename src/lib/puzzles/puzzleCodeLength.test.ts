import { beforeAll, describe, expect, it } from "vitest";

import { generatePuzzle, prepareEveryPuzzle } from "./generate";

// The kana WordDrop is made from a list loaded a length at a time: load them all before anything is made.
beforeAll(prepareEveryPuzzle);
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
});
