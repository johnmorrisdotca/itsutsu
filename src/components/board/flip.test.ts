import { describe, expect, it } from "vitest";

import { layoutOrder } from "./flip";
import { indexOf, pointOf } from "@/lib/gomoku/engine";

describe("layoutOrder", () => {
  it("leaves an unflipped board in the order it is stored", () => {
    expect(layoutOrder(4, false)).toEqual([0, 1, 2, 3]);
  });

  it("turns a flipped board right round", () => {
    expect(layoutOrder(4, true)).toEqual([3, 2, 1, 0]);
  });

  it("is a half turn: the point drawn in a slot is the one opposite it", () => {
    /*
     * The property that matters. Whatever was at (row, col) is now drawn where
     * (size-1-row, size-1-col) was — a rotation by half a turn, not a mirror.
     * A mirror would put the board's left on its left and read as a different
     * position; a half turn is what somebody sitting on the other side sees.
     */
    for (const size of [4, 8, 9, 19]) {
      const flipped = layoutOrder(size * size, true);
      for (let slot = 0; slot < size * size; slot += 1) {
        const drawnHere = pointOf(size, flipped[slot]);
        const wouldHaveBeen = pointOf(size, slot);
        expect(drawnHere).toEqual({
          row: size - 1 - wouldHaveBeen.row,
          col: size - 1 - wouldHaveBeen.col,
        });
      }
    }
  });

  it("draws every cell exactly once, either way", () => {
    // A flip that dropped or doubled a point would be a board with a hole in it.
    for (const flipped of [false, true]) {
      const drawn = layoutOrder(81, flipped);
      expect(drawn).toHaveLength(81);
      expect(new Set(drawn).size).toBe(81);
    }
  });

  it("puts the far corner nearest, which is the whole point", () => {
    // Halma: your camp is the far corner, and flipped it should be the near one.
    const size = 8;
    const flipped = layoutOrder(size * size, true);
    // The first slot drawn is the top-left of the screen.
    expect(pointOf(size, flipped[0])).toEqual({ row: size - 1, col: size - 1 });
    expect(flipped[0]).toBe(indexOf(size, { row: size - 1, col: size - 1 }));
  });
});
