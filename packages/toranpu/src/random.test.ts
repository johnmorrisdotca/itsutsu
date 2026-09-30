import { describe, expect, it } from "vitest";

import { seededRandom, shuffled } from "./random.ts";

describe("the seeded stream", () => {
  // Pinned: every saved game is dealt again from its seed, so these numbers must never change.
  it("gives the same numbers for the same seed, for ever", () => {
    const random = seededRandom(42);
    expect([random(), random(), random()]).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099]);
  });

  it("shuffles the same way for the same seed, and leaves the list given alone", () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffled(list, seededRandom(7))).toEqual([7, 6, 9, 2, 3, 4, 5, 8, 10, 1]);
    expect(list).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("stays in [0, 1)", () => {
    const random = seededRandom(1);
    for (let at = 0; at < 10_000; at += 1) {
      const n = random();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
