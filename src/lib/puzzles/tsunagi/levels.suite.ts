import { beforeAll, describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { decodeLayout, encodeAnswer, neighboursOf } from "./code";
import { difficultyScores, measureSolved, type LevelMeasure } from "./difficulty";
import { symmetryKey } from "./generate";
import { isTwist } from "./ladder";
import { TSUNAGI_LEVEL_COUNTS, loadTsunagiLevels, tsunagiBand, tsunagiLevelOf, tsunagiLevelsOf, tsunagiPuzzle } from "./levels";
import { TSUNAGI_MARKS } from "./levels/marks.data";
import { countSolutions, type SolveCount } from "./solve";

/**
 * EVERY TSUNAGI LEVEL OF ONE SIZE, PROVED AGAIN ON EVERY BUILD — the tests one
 * `levels.<size>.test.ts` runs, one file a size so vitest proves the sizes side
 * by side (on CI the 9×9 proof alone once took 31 seconds and timed out,
 * blocking a deploy). Nothing the level script did is trusted: each layout is
 * solved from scratch and must have exactly one answer, the one the file
 * stores, filling every cell. Each level is solved ONCE, before the tests, and
 * the proof, the difficulty climb and the marks all read that one solve.
 */
export function levelSuite(size: number): void {
  describe(`tsunagi at ${size}×${size}`, () => {
    let solves: SolveCount[] = [];
    beforeAll(async () => {
      await loadTsunagiLevels(size);
      solves = tsunagiLevelsOf(size).map(([givens]) => countSolutions(decodeLayout(givens, size)!, 2));
    }, 240_000);

    it("has as many levels as the board of levels counts, in whole blocks of sixteen, and at least fifty", () => {
      expect(tsunagiLevelsOf(size).length).toBe(TSUNAGI_LEVEL_COUNTS[size]);
      expect(tsunagiLevelsOf(size).length % 16).toBe(0);
      expect(tsunagiLevelsOf(size).length).toBeGreaterThanOrEqual(50);
    });

    it("proves every level has exactly one answer, the stored one, and that it fills the board", () => {
      for (const [index, [givens, answer]] of tsunagiLevelsOf(size).entries()) {
        const solved = solves[index]!;
        expect(solved.count, `level ${index + 1} has ${solved.count} answers`).toBe(1);
        expect(encodeAnswer(solved.solution!), `level ${index + 1}'s stored answer is not its answer`).toBe(answer);
        expect(answer).not.toContain(".");
        expect(checkSolution("tsunagi", size, givens, answer)).toEqual({ ok: true });
      }
    });

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

    /** Every level measured from its one solve. */
    const measured = (): LevelMeasure[] => tsunagiLevelsOf(size).map(([layout, answer], at) => measureSolved(layout, answer, size, solves[at]!)!);

    it("climbs block by block: each block's plain levels no easier on average than the block before's", () => {
      const levels = tsunagiLevelsOf(size);
      const all = measured();
      const plain = levels.flatMap(([layout], at) => (isTwist(layout) ? [] : [at]));
      const scores = difficultyScores(
        plain.map((at) => all[at]!),
        size,
      );
      const byBlock = new Map<number, number[]>();
      plain.forEach((at, index) => byBlock.set(Math.floor(at / 16), [...(byBlock.get(Math.floor(at / 16)) ?? []), scores[index]!]));
      const means = [...byBlock.values()].map((each) => each.reduce((sum, score) => sum + score, 0) / each.length);
      for (let block = 1; block < means.length; block += 1) expect(means[block]!, `block ${block + 1}`).toBeGreaterThanOrEqual(means[block - 1]!);
    });

    it("marks every level 1 to 5 by its measured score among the size's levels", () => {
      const scores = difficultyScores(measured(), size);
      expect(TSUNAGI_MARKS[size]).toBe(scores.map((score) => String(Math.min(5, 1 + Math.floor(score / 20)))).join(""));
    });
  });
}
