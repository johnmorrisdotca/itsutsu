import { describe, expect, it } from "vitest";

import { stepEntry } from "./stepEntry";

describe("stepEntry", () => {
  it("counts up from empty, empties after the largest, and starts again", () => {
    const taps: number[] = [];
    let value = 0;
    for (let tap = 0; tap < 7; tap += 1) {
      value = stepEntry(value, 5);
      taps.push(value);
    }
    expect(taps).toEqual([1, 2, 3, 4, 5, 0, 1]);
  });

  it("goes as high as the grid's size and no higher, at every size a puzzle is made", () => {
    for (const size of [4, 5, 6, 7, 9]) {
      expect(stepEntry(size - 1, size)).toBe(size);
      expect(stepEntry(size, size)).toBe(0);
    }
  });
});
