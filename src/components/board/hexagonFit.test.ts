import { describe, expect, it } from "vitest";

import { HEXAGON_SPAN, HEXAGON_TRANSFORM, HEX_LATTICE, LATTICE_TRANSFORM } from "./Board.constants";
import { latticeLabelTracks } from "./margin";
import { boardSizesFor, defaultBoardFor, RULE_VARIANT_LIST, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { hexagonRadius, inHexagon } from "@/lib/gomoku/rules/hexagon";

/**
 * THE HEXAGON FILLS ITS FRAME, AND THE BOARD LISTS ARE IN ORDER.
 *
 * Both are John's, 2026-09-21, looking at the thirteen board: "Why is there
 * such a border around 13x13? If that's the largest, it shoud fill the page…
 * and the order of the Boards, on all pages should be numerical."
 *
 * The first is geometry and is checked here against the cells themselves
 * rather than against a number somebody wrote down: the hexagon's own span is
 * derived from `inHexagon` at every board the game is played on, and compared
 * with the constant the transform is built from. If a fifth board is added, or
 * the shape moves, this says so.
 */

/** Where a cell's box lands across the sheared grid, in units of the unsheared grid's width. */
function spanOfHexagon(size: number): { from: number; to: number } {
  let from = Infinity;
  let to = -Infinity;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!inHexagon(size, { row, col })) continue;
      // The shear takes (col, row) to col + row/2, and a cell is one wide.
      const left = col + (row + 0.5) / 2;
      from = Math.min(from, left);
      to = Math.max(to, left + 1);
    }
  }
  return { from: from / size, to: to / size };
}

describe("a hexagon board is fitted to the hexagon", () => {
  it("spans the same quarter-to-a-quarter-past at every board the game is played on", () => {
    for (const size of boardSizesFor("honeycomb")) {
      const span = spanOfHexagon(size);
      expect(span.from, `${size}: where the hexagon starts`).toBeCloseTo(HEXAGON_SPAN.from, 10);
      expect(span.to, `${size}: where it ends`).toBeCloseTo(HEXAGON_SPAN.to, 10);
      // And it really is two thirds of the array the game is stored in.
      expect(span.to - span.from).toBeCloseTo(HEX_LATTICE.width * (2 / 3), 10);
      expect(hexagonRadius(size)).toBe((size - 1) / 2);
    }
  });

  it("is a bigger fit than the rhombus's, and moved left to pay for it", () => {
    /*
     * The rhombus is the whole sheared grid and starts at the box's edge; the
     * hexagon is its middle two thirds, so it is drawn half again as large and
     * pulled back by the quarter it used to waste. Read off the strings,
     * because the strings are what the browser is given.
     */
    expect(LATTICE_TRANSFORM).toContain("scale(0.6666666666666666)");
    expect(LATTICE_TRANSFORM).toContain("translate(0.0000%, 21.1325%)");
    expect(HEXAGON_TRANSFORM).toMatch(/scale\(0\.95\d+\)/);
    expect(HEXAGON_TRANSFORM).toMatch(/translate\(-2[0-9.]+%, [0-9.]+%\)/);
  });

  it("gives a hexagon's coordinate strips one track per column and no lead", () => {
    // The middle row is the only one holding every column — see `latticeLabelTracks`.
    expect(latticeLabelTracks(13, "columns", true)).toBe("repeat(13, minmax(0, 1fr))");
    expect(latticeLabelTracks(13, "columns", false)).toContain("0.25fr");
    // The rows are centred in what is left of the box's height, and that is a real number.
    const rows = latticeLabelTracks(13, "rows", true);
    const edge = Number(rows.split("fr")[0]);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(13);
  });
});

describe("the boards a game is played on", () => {
  it("are listed smallest first, everywhere", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const sizes = boardSizesFor(variant);
      expect([...sizes], `${variant} lists its boards out of order`).toEqual([...sizes].sort((a, b) => a - b));
    }
  });

  it("open on the board the game declares, which is not always the smallest", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const opens = defaultBoardFor(variant);
      expect(boardSizesFor(variant), `${variant} opens on a board it does not have`).toContain(opens);
    }
    // The three that are not the smallest, said out loud so a change to one is a decision.
    expect(defaultBoardFor("halma"), "Halma's own board").toBe(16);
    expect(defaultBoardFor("honeycomb"), "the 91-cell board Hexversi is played on").toBe(11);
    expect(defaultBoardFor("go"), "the full go board").toBe(19);
  });

  it("declare that default on the row, rather than by being first in the list", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const spec = VARIANT_SPECS[variant];
      if (spec.defaultBoard === null) continue;
      expect(spec.boardSizes, `${variant} names a default board but has no boards of its own`).not.toBeNull();
      expect(spec.boardSizes, `${variant} names a default board it does not have`).toContain(spec.defaultBoard);
    }
  });
});
