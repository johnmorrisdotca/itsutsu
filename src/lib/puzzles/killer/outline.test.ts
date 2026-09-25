import { describe, expect, it } from "vitest";

import { decodeKiller } from "./code";
import { generateSumCages } from "./generate";
import { cageOutline } from "./outline";

/** Every end of every line meets the end of another: each cage's outline is closed, with no gap and no overshoot. */
function closed(size: number, cageOf: (index: number) => number | undefined): boolean {
  const ends = new Map<string, number>();
  for (const s of cageOutline(size, cageOf)) {
    for (const key of [`${s.x1.toFixed(3)},${s.y1.toFixed(3)}`, `${s.x2.toFixed(3)},${s.y2.toFixed(3)}`]) ends.set(key, (ends.get(key) ?? 0) + 1);
  }
  return [...ends.values()].every((count) => count % 2 === 0);
}

describe("cageOutline", () => {
  it("closes an L with its inside corner, and a lone cell as a square", () => {
    // 2×2: an L of three cells, and the fourth on its own.
    const cages = [0, 0, 1, 0];
    expect(closed(2, (index) => cages[index])).toBe(true);
    expect(cageOutline(2, (index) => cages[index]).filter((s) => s.x1 === s.x2 || s.y1 === s.y2)).toHaveLength(cageOutline(2, (index) => cages[index]).length);
  });

  it("closes every cage of real puzzles at both sizes", () => {
    for (const size of [6, 9]) {
      for (const seed of [1, 2, 3]) {
        const read = decodeKiller(generateSumCages(size, "hard", seed).givens, size)!;
        const cageOf = new Map<number, number>();
        read.cages.forEach((cage, c) => cage.cells.forEach((index) => cageOf.set(index, c)));
        expect(closed(size, (index) => cageOf.get(index)), `${size} ${seed}`).toBe(true);
      }
    }
  });
});
