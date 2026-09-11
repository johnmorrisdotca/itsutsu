import { describe, expect, it } from "vitest";

import { EDGE_LINE_WIDTH } from "./Board.constants";
import { GO_BOARD_RIM, labelEdge, labelTracks, playingAreaInset } from "./margin";

/** Every board size this site actually draws, smallest to largest. */
const SIZES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 19];

/**
 * The bare surface left outside a squares board's outermost rule, as a
 * fraction of the board's width. Restated here by hand rather than imported:
 * the point of the module is that this comes out the same on every board, and
 * a check that reuses its arithmetic could not tell.
 */
function visibleRim(size: number): number {
  const inset = playingAreaInset(size, true);
  const cell = (1 - 2 * inset) / size;
  return inset - (EDGE_LINE_WIDTH / 2) * cell;
}

describe("playingAreaInset", () => {
  it("leaves a board drawn on the lines alone — it has its own half-cell", () => {
    for (const size of SIZES) expect(playingAreaInset(size, false)).toBe(0);
  });

  it("shows the same rim as a go board on every size of squares board", () => {
    for (const size of SIZES) expect(visibleRim(size)).toBeCloseTo(GO_BOARD_RIM, 12);
  });

  it("is the go board's own half-cell where the board IS a go board", () => {
    // 19×19 drawn in the squares and 19×19 drawn on the lines are the same picture.
    expect(playingAreaInset(19, true)).toBeCloseTo(0.5 / 19, 3);
  });

  it("gives the small boards the larger share, because their rules are thicker", () => {
    // A cell is a third of a 3×3 and a nineteenth of a 19×19, so the edge rule
    // drawn around it eats a much bigger part of the margin.
    expect(playingAreaInset(3, true)).toBeGreaterThan(playingAreaInset(19, true));
  });

  it("refuses a size it cannot measure rather than returning a plausible number", () => {
    expect(playingAreaInset(0, true)).toBe(0);
    expect(playingAreaInset(-1, true)).toBe(0);
  });
});

describe("labelTracks", () => {
  it("puts each label track exactly over its cell", () => {
    for (const size of SIZES) {
      const inset = playingAreaInset(size, true);
      const edge = labelEdge(size, inset);
      const total = 2 * edge + size;
      // The end track is the rim; each middle track is one cell of the board.
      expect(edge / total).toBeCloseTo(inset, 12);
      expect(1 / total).toBeCloseTo((1 - 2 * inset) / size, 12);
    }
  });

  it("is the plain strip when there is no rim", () => {
    expect(labelEdge(19, 0)).toBe(0);
    expect(labelTracks(19, 0)).toBe("0fr repeat(19, minmax(0, 1fr)) 0fr");
  });

  it("names both ends, so the labels are centred rather than pushed along", () => {
    const tracks = labelTracks(8, playingAreaInset(8, true));
    expect(tracks.startsWith("0.")).toBe(true);
    expect(tracks.endsWith("fr")).toBe(true);
    expect(tracks).toContain("repeat(8, minmax(0, 1fr))");
  });
});
