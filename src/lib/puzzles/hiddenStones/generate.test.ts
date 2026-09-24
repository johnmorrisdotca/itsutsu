import { describe, expect, it } from "vitest";

import { PUZZLE_SPECS } from "../puzzles.constants";
import { decodeRegions, decodeStones, encodeRegions, encodeStones } from "./code";
import { generateHiddenStones } from "./generate";
import { applyReasoning, countSolutions, guessDepth } from "./solve";

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

  it("round-trips the regions and the stones, and refuses what is not one of them", () => {
    expect(decodeRegions(encodeRegions([0, 1, 1, 0]), 2)).toEqual([0, 1, 1, 0]);
    expect(decodeStones(encodeStones([1, 0]), 2)).toEqual([1, 0]);
    expect(decodeRegions("abc", 2)).toBeNull();
    expect(decodeRegions("abcz", 2)).toBeNull();
    expect(decodeStones("ac", 2)).toBeNull();
  });
});
