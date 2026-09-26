import { beforeAll, describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { decodeLayout, encodeAnswer, neighboursOf } from "./code";
import { symmetryKey } from "./generate";
import { loadEveryTsunagiLevel, nextTsunagiLevel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES, tsunagiBand, tsunagiLevelOf, tsunagiLevelsOf, tsunagiPuzzle } from "./levels";
import { countSolutions } from "./solve";

/**
 * EVERY TSUNAGI LEVEL, PROVED AGAIN ON EVERY BUILD.
 *
 * The levels are data (`levels/size<n>.data.ts`), written by a script on a
 * desk. Nothing about the script is trusted here: each of the six hundred
 * layouts is solved from scratch, and must have exactly one answer, the one
 * the file stores, filling every cell. The whole proof takes a few seconds,
 * because the script kept only levels the solver settles quickly.
 */
beforeAll(loadEveryTsunagiLevel);

describe.each(TSUNAGI_SIZES.map((size) => [size, size]))("tsunagi at %i×%i", (size) => {
  it("has as many levels as the board of levels counts, and at least fifty", () => {
    expect(tsunagiLevelsOf(size).length).toBe(TSUNAGI_LEVEL_COUNTS[size]);
    expect(tsunagiLevelsOf(size).length).toBeGreaterThanOrEqual(50);
  });

  it("proves every level has exactly one answer, the stored one, and that it fills the board", () => {
    for (const [index, [givens, answer]] of tsunagiLevelsOf(size).entries()) {
      const layout = decodeLayout(givens, size);
      expect(layout, `level ${index + 1} is not a layout`).not.toBeNull();
      const solved = countSolutions(layout!, 2);
      expect(solved.count, `level ${index + 1} has ${solved.count} answers`).toBe(1);
      expect(encodeAnswer(solved.solution!), `level ${index + 1}'s stored answer is not its answer`).toBe(answer);
      expect(answer).not.toContain(".");
      expect(checkSolution("tsunagi", size, givens, answer)).toEqual({ ok: true });
    }
    // About three seconds for the hundred 9×9s on a laptop; room for a slower runner.
  }, 30_000);

  it("never sets a pair's two marbles side by side, and never a line shorter than three cells", () => {
    for (const [index, [givens, answer]] of tsunagiLevelsOf(size).entries()) {
      const layout = decodeLayout(givens, size)!;
      for (const [a, b] of layout.ends) {
        expect(neighboursOf(size, a), `level ${index + 1}: a pair sits side by side`).not.toContain(b);
        expect([...answer].filter((letter) => letter === answer[a]).length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("holds no two levels that are the same board turned or mirrored", () => {
    const keys = tsunagiLevelsOf(size).map(([givens]) => symmetryKey(givens, size));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("names each level by its layout, and files it in the third of the size it sits in", () => {
    const count = TSUNAGI_LEVEL_COUNTS[size]!;
    const puzzle = tsunagiPuzzle(size, 12);
    expect(puzzle.seed).toBe(12);
    expect(tsunagiLevelOf(size, puzzle.givens)).toBe(12);
    expect(tsunagiBand(size, 1)).toBe("easy");
    expect(tsunagiBand(size, Math.ceil(count / 2))).toBe("medium");
    expect(tsunagiBand(size, count)).toBe("hard");
  });
});

describe("the levels open a row of ten at a time", () => {
  it("opens the first row to a newcomer", () => {
    expect(openTsunagiLevels(5, new Set())).toBe(10);
    expect(nextTsunagiLevel(5, new Set())).toBe(1);
  });

  it("opens the next row only once every level of the one before is solved", () => {
    const nine = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(openTsunagiLevels(5, nine)).toBe(10);
    expect(nextTsunagiLevel(5, nine)).toBe(10);
    const ten = new Set([...nine, 10]);
    expect(openTsunagiLevels(5, ten)).toBe(20);
    expect(nextTsunagiLevel(5, ten)).toBe(11);
    // Levels solved out of the open rows do not open anything past a row left unfinished.
    expect(openTsunagiLevels(5, new Set([...nine, 11, 12]))).toBe(10);
  });

  it("opens every row when every level is solved, and offers the last", () => {
    const all = new Set(Array.from({ length: 100 }, (_, at) => at + 1));
    expect(openTsunagiLevels(6, all)).toBe(100);
    expect(nextTsunagiLevel(6, all)).toBe(100);
  });
});
