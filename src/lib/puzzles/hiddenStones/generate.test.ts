import { describe, expect, it } from "vitest";

import { PUZZLE_SPECS } from "../puzzles.constants";
import { decodeRegions, decodeStones, encodeRegions, encodeStones } from "./code";
import { generateHiddenStones } from "./generate";
import { applyReasoning, countSolutions, guessDepth } from "./solve";

/** Two grids as they were made before 12×12 was climbed: sizes up to ten must go on making exactly these. */
const PINNED_7_EASY = "ccbbbbaccbcbbbccccbddecccbddeeecdddfeeddggffggggg";
const PINNED_10_HARD = "bbbbbbbaaabbbgbbbdddccggbbedddcgggbeeedfcgggijeeffggiiijjeefhggiijjeffhgiiiijjffhiiiiijjjjhiiiijjjjj";

/**
 * A Hidden Stones puzzle is a puzzle: one answer, its stones where the rules
 * allow, made the same way from the same seed.
 */
describe("generating Hidden Stones", () => {
  const spec = PUZZLE_SPECS.hiddenStones;

  for (const size of spec.sizes) {
    it(`${size}×${size} has exactly one answer, and the answer keeps every rule`, () => {
      for (const seed of [1, 2, 3]) {
        const puzzle = generateHiddenStones(size, "easy", seed);
        const regions = decodeRegions(puzzle.givens, size)!;
        const stones = decodeStones(puzzle.solution, size)!;
        expect(regions).not.toBeNull();
        expect(stones).not.toBeNull();
        expect(countSolutions(size, regions, 2)).toBe(1);
        // Every column once, no two consecutive rows within one, every region once.
        expect([...stones].sort((a, b) => a - b)).toEqual(Array.from({ length: size }, (_, i) => i));
        for (let row = 1; row < size; row += 1) expect(Math.abs(stones[row] - stones[row - 1])).toBeGreaterThanOrEqual(2);
        expect(new Set(stones.map((col, row) => regions[row * size + col])).size).toBe(size);
        // Every region is one connected piece.
        expect(new Set(regions).size).toBe(size);
      }
    });
  }

  it("makes an easy puzzle reasoning alone finishes, and a hard one it does not", () => {
    const easy = generateHiddenStones(7, "easy", 11);
    const regions = decodeRegions(easy.givens, 7)!;
    expect(guessDepth(7, regions)).toBe(0);
    expect(applyReasoning(7, regions).solved).toBe(true);
    const hard = generateHiddenStones(7, "hard", 11);
    expect(guessDepth(7, decodeRegions(hard.givens, 7)!)).toBeGreaterThanOrEqual(1);
  });

  it("makes the same puzzle from the same seed, and a different one from another", () => {
    const one = generateHiddenStones(8, "easy", 4242);
    expect(generateHiddenStones(8, "easy", 4242)).toEqual(one);
    expect(generateHiddenStones(8, "easy", 4243).givens).not.toBe(one.givens);
  });

  it("makes a 10×10 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [21, 22, 23]) generateHiddenStones(10, "hard", seed);
    // Four seconds: the gate runs its five lanes side by side, and this measured 2.2 s under that load.
    expect((performance.now() - started) / 3).toBeLessThan(4000);
  });

  it("has no hard 4×4 to make: two answers are possible, and looking always tells them apart", () => {
    // Every column once and no two consecutive rows within one column of each other: at four sides, 2413 and 3142 alone.
    const orders = (left: number[]): number[][] => (left.length === 0 ? [[]] : left.flatMap((col) => orders(left.filter((c) => c !== col)).map((rest) => [col, ...rest])));
    const answers = orders([0, 1, 2, 3]).filter((cols) => cols.every((col, row) => row === 0 || Math.abs(col - cols[row - 1]) >= 2));
    expect(answers.map((cols) => cols.join("")).sort()).toEqual(["1302", "2031"]);
    for (let seed = 1; seed <= 40; seed += 1) {
      const grid = decodeRegions(generateHiddenStones(4, "hard", seed).givens, 4)!;
      expect(applyReasoning(4, grid).solved).toBe(true);
    }
    expect(PUZZLE_SPECS.hiddenStones.levelsAt?.[4]).toEqual(["easy"]);
  });

  it("climbs a 12×12 to one answer at each level, in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [31, 32, 33]) {
      const easy = generateHiddenStones(12, "easy", seed);
      const easyRegions = decodeRegions(easy.givens, 12)!;
      expect(applyReasoning(12, easyRegions).solved).toBe(true);
      const hard = generateHiddenStones(12, "hard", seed);
      const hardRegions = decodeRegions(hard.givens, 12)!;
      expect(countSolutions(12, hardRegions, 2)).toBe(1);
      expect(applyReasoning(12, hardRegions).solved).toBe(false);
      expect(decodeStones(hard.solution, 12)).not.toBeNull();
    }
    // Six grids; measured at about a third of a second each on their own, so four seconds leaves the gate's parallel lanes room.
    expect((performance.now() - started) / 6).toBeLessThan(4000);
  });

  it("makes the grid it always made at the sizes up to ten, so a seed already played is the same puzzle", () => {
    expect(generateHiddenStones(7, "easy", 20260924).givens).toBe(PINNED_7_EASY);
    expect(generateHiddenStones(10, "hard", 21).givens).toBe(PINNED_10_HARD);
  });

  it("round-trips the regions and the stones, and refuses what is not one of them", () => {
    expect(decodeRegions(encodeRegions([0, 1, 1, 0]), 2)).toEqual([0, 1, 1, 0]);
    expect(decodeStones(encodeStones([1, 0]), 2)).toEqual([1, 0]);
    expect(decodeRegions("abc", 2)).toBeNull();
    expect(decodeRegions("abcz", 2)).toBeNull();
    expect(decodeStones("ac", 2)).toBeNull();
  });
});
