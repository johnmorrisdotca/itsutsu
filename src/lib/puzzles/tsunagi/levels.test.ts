import { beforeAll, describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { decodeLayout, encodeAnswer, neighboursOf } from "./code";
import { symmetryKey } from "./generate";
import { firstUnsolvedTsunagiLevel, loadEveryTsunagiLevel, nextLevelLabel, nextTsunagiLevel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES, tsunagiBand, tsunagiLevelOf, tsunagiLevelsOf, tsunagiPuzzle } from "./levels";
import { countSolutions } from "./solve";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";

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

  // Its own allowance, as the every-variant simulation has: 256 boards re-proved took 30.7 s at 9×9 on a CI runner (0.391.1),
  // over the 30 s default. A timeout here is the runner's speed, not a board without one answer, which fails on its own.
  it("proves every level has exactly one answer, the stored one, and that it fills the board", { timeout: 180_000 }, () => {
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

  it("fits every level's layout and answer within what the solve and race routes accept", () => {
    // A walled 9×9 layout ran to 109 characters when the route took 81, and every solve of it was refused (2026-09-26).
    for (const [givens, answer] of tsunagiLevelsOf(size)) {
      for (const code of [givens, answer]) {
        expect(code.length, givens).toBeLessThanOrEqual(PUZZLE_SPECS.tsunagi.mostCells);
        expect(code.length, givens).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
      }
    }
  });

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

describe("the levels open a block of sixteen at a time", () => {
  const upTo = (last: number) => Array.from({ length: last }, (_, at) => at + 1);

  it("opens the first block to a newcomer", () => {
    expect(openTsunagiLevels(5, new Set())).toBe(16);
    expect(nextTsunagiLevel(5, new Set())).toBe(1);
  });

  it("opens the next block only once every level of the one before is solved", () => {
    const fifteen = new Set(upTo(15));
    expect(openTsunagiLevels(5, fifteen)).toBe(16);
    expect(nextTsunagiLevel(5, fifteen)).toBe(16);
    const sixteen = new Set(upTo(16));
    expect(openTsunagiLevels(5, sixteen)).toBe(32);
    expect(nextTsunagiLevel(5, sixteen)).toBe(17);
    // Levels solved past the open blocks open nothing beyond a block left unfinished.
    expect(openTsunagiLevels(5, new Set([...fifteen, 17, 18]))).toBe(16);
  });

  it("opens every block when every level is solved, and offers the last", () => {
    expect(openTsunagiLevels(6, new Set(upTo(256)))).toBe(256);
    expect(nextTsunagiLevel(6, new Set(upTo(256)))).toBe(256);
    // 4×4's twelve blocks.
    expect(openTsunagiLevels(4, new Set(upTo(192)))).toBe(192);
  });

  it("has whole blocks at every size: 256 a size, 192 at 4×4", () => {
    for (const size of TSUNAGI_SIZES) expect(TSUNAGI_LEVEL_COUNTS[size]! % 16, `${size}×${size}`).toBe(0);
    expect(TSUNAGI_LEVEL_COUNTS[4]).toBe(192);
    for (const size of TSUNAGI_SIZES.filter((each) => each !== 4)) expect(TSUNAGI_LEVEL_COUNTS[size]).toBe(256);
  });
});

describe("the next level is the lowest one not yet solved", () => {
  it("sends somebody who solved only level 10 back to level 1, never on to 11", () => {
    // John's screenshot: level 10 solved on its own, and "Level 11 →" offered.
    const solved = new Set([10]);
    expect(firstUnsolvedTsunagiLevel(5, solved)).toBe(1);
    expect(openTsunagiLevels(5, solved)).toBe(16);
    expect(nextLevelLabel(10, 1)).toBe("Level 1, the first one you have not finished →");
  });

  it("names the gap, and says the level after plainly when that is the gap", () => {
    expect(firstUnsolvedTsunagiLevel(5, new Set([1, 2, 4, 5]))).toBe(3);
    expect(nextLevelLabel(5, 3)).toBe("Level 3, the first one you have not finished →");
    expect(firstUnsolvedTsunagiLevel(5, new Set([1, 2, 3]))).toBe(4);
    expect(nextLevelLabel(3, 4)).toBe("Level 4 →");
  });

  it("goes on to the next block once a block is all solved, and to nothing once every level is", () => {
    const block = new Set(Array.from({ length: 16 }, (_, at) => at + 1));
    expect(firstUnsolvedTsunagiLevel(7, block)).toBe(17);
    const all = new Set(Array.from({ length: 256 }, (_, at) => at + 1));
    expect(firstUnsolvedTsunagiLevel(7, all)).toBeNull();
  });
});
