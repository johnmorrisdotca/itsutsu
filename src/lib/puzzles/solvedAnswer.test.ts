import { describe, expect, it } from "vitest";

import { generatePuzzle } from "./generate";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS } from "./puzzles.constants";
import type { PuzzleKind } from "./puzzles.types";
import { solvedAnswerOf } from "./solvedAnswer";

const GRIDS = PUZZLE_KIND_LIST.filter((kind) => PUZZLE_SPECS[kind].helps !== false) as PuzzleKind[];

/*
 * An old solve kept no answer, and its page drew the grid as dealt. Every grid
 * here has one answer, so the solver that made it finds it again from the
 * givens alone — the answer the generator had, character for character.
 */
describe("the answer worked out from a puzzle's givens", () => {
  for (const kind of GRIDS) {
    const spec = PUZZLE_SPECS[kind];
    for (const size of spec.offered) {
      for (const level of spec.levels) {
        it(`${kind} ${size} ${level}: the generator's own solution`, () => {
          for (const seed of [11, 4242]) {
            const puzzle = generatePuzzle(kind, size, level, seed);
            expect(solvedAnswerOf(kind, size, level, puzzle.givens)).toBe(puzzle.solution);
          }
        });
      }
    }
  }

  it("names no answer for a word, whose answer is its guesses", () => {
    const puzzle = generatePuzzle("gomoji", 5, "medium", 11);
    expect(solvedAnswerOf("gomoji", 5, "medium", puzzle.givens)).toBeNull();
  });

  it("names none for givens that do not read, rather than a guess", () => {
    expect(solvedAnswerOf("numberPlace", 4, "easy", "nonsense")).toBeNull();
    expect(solvedAnswerOf("hiddenStones", 5, "easy", "")).toBeNull();
  });

  it("names none for a grid with more than one answer: an empty 4×4 has hundreds", () => {
    expect(solvedAnswerOf("numberPlace", 4, "easy", ".".repeat(16))).toBeNull();
  });
});
