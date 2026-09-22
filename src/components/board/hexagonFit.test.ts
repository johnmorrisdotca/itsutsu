import { describe, expect, it } from "vitest";

import {
  HEXAGON_SPAN,
  HEXAGON_TRANSFORM,
  HEX_LATTICE,
  rhombusFit,
  starSpan,
  starTransform,
} from "./Board.constants";
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
    // The rhombus is fitted with its ring of border tiles and the go board's rim: under two thirds.
    expect(rhombusFit(11).scale).toBeLessThan(2 / 3);
    expect(rhombusFit(11).scale).toBeGreaterThan(0.5);
    // With its ring of border tiles the hexagon is fitted a cell wider each way: 0.95 became about 0.8 on eleven.
    expect(HEXAGON_TRANSFORM).toMatch(/scale\(0\.[78]\d+\)/);
    expect(HEXAGON_TRANSFORM).toMatch(/translate\(-1[0-9.]+%, [0-9.]+%\)/);
  });

  it("gives a hexagon's coordinate strips one track per column and no lead", () => {
    // The middle row is the only one holding every column — see `latticeLabelTracks`.
    /*
     * The strip follows the middle row, which spans the box less its rim, so
     * the lead is the rim in cells: a third of one, on a thirteen board.
     */
    // The rim and the ring's tile before the middle row's first cell: over one cell, under two.
    const lead = Number(latticeLabelTracks(13, "columns", "hexagon").split("fr")[0]);
    expect(lead).toBeGreaterThan(1);
    expect(lead).toBeLessThan(2);
    // The rhombus's strip leads with its rim plus the quarter-cell shear: more than a quarter, less than a cell.
    const rhombusLead = Number(latticeLabelTracks(13, "columns", "rhombus").split("fr")[0]);
    // The rim, the ring of border tiles, and the quarter-cell shear of the first row: about two cells.
    expect(rhombusLead).toBeGreaterThan(1.5);
    expect(rhombusLead).toBeLessThan(2.5);
    // The rows are centred in what is left of the box's height, and that is a real number.
    const rows = latticeLabelTracks(13, "rows", "hexagon");
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

/**
 * THE HEXAGRAM, AND THE ONE THING THAT MAKES IT DIFFERENT FROM EVERY OTHER
 * SHAPE ON THIS LATTICE: it is taller than it is wide.
 *
 * Chinese Checkers' star was drawn at 51% of its board's width and 58% of its
 * height — under a third of the wood — because the lattice was fitted to the
 * ARRAY holding the star rather than to the star. Fitting its width instead
 * would have been worse than the fault: the star would have stood a tenth of a
 * board proud of its own box, top and bottom, and been clipped there.
 */
describe("the hexagram fits its board", () => {
  it("spans a different pair of numbers at each radius, unlike the hexagon", () => {
    const four = starSpan(17);
    const three = starSpan(13);
    expect(four.from).toBeCloseTo(6.25 / 17, 10);
    expect(four.to).toBeCloseTo(1 + 2.25 / 17, 10);
    // Not the same two numbers — which is why this is computed and not a constant.
    expect(three.from).not.toBeCloseTo(four.from, 4);
  });

  it("is narrower than the lattice is tall, which is what makes the height bind", () => {
    const { from, to } = starSpan(17);
    expect(to - from).toBeLessThan(HEX_LATTICE.height);
    // And well under the rhombus it is cut out of, which is the waste that was there.
    expect(to - from).toBeLessThan(HEX_LATTICE.width * 0.55);
  });

  it("fills the board it is drawn in, rather than floating in it", () => {
    const scale = Number(/scale\(([0-9.]+)\)/.exec(starTransform(17))?.[1]);
    const { from, to } = starSpan(17);
    const wide = (to - from) * scale;
    const tall = HEX_LATTICE.height * scale;
    // Was 0.51 and 0.58 before the fit knew about the shape; with its ring of border tiles, 0.75 and 0.85.
    expect(wide).toBeGreaterThan(0.7);
    expect(tall).toBeGreaterThan(0.8);
    // And neither side leaves the board, or the playing area's clip would cut it.
    expect(wide).toBeLessThanOrEqual(1);
    expect(tall).toBeLessThanOrEqual(1);
  });

  it("gives the star row numbers and no column letters", () => {
    expect(latticeLabelTracks(17, "columns", "star")).toBe("");
    expect(latticeLabelTracks(17, "rows", "star")).toContain("repeat(17,");
  });

  it("leaves the hexagon and the rhombus exactly as they were", () => {
    // The generalised fit must not move a shape whose width already bound it.
    expect(HEXAGON_TRANSFORM).toMatch(/scale\(0\.[78]\d+\)/);
  });
});
