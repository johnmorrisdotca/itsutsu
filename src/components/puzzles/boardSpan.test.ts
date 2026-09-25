import { describe, expect, it } from "vitest";

import { boardSpan } from "./WordDropGrid";

describe("a whole board for a word", () => {
  it("is square, holds every row, and leaves the same spare columns either side", () => {
    for (const [size, rows] of [
      [5, 6],
      [4, 5],
      [3, 7],
      [3, 6],
      [4, 7],
      [4, 6],
      [5, 7],
    ] as const) {
      const span = boardSpan(size, rows);
      expect(span).toBeGreaterThanOrEqual(rows);
      expect((span - size) % 2, `${size} across ${rows} rows on ${span}`).toBe(0);
      expect(span - Math.max(size, rows)).toBeLessThanOrEqual(1);
    }
  });

  it("keeps John's 3-kana board seven squares, two spare either side", () => {
    expect(boardSpan(3, 7)).toBe(7);
    expect(boardSpan(5, 6)).toBe(7);
    expect(boardSpan(4, 7)).toBe(8);
  });
});
