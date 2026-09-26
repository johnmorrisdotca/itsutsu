import { describe, expect, it } from "vitest";

import { squareAt } from "./grid";
import { TABLE, edgePan, fitView, keepInReach, overflows, panView, squareUnder, tableArea, zoomView } from "./tableView";

/** A kumimoji table with tiles on these squares. */
const tilesOn = (...squares: [number, number][]) => new Map(squares.map(([row, col]) => [squareAt(row, col), "a"]));

describe("the kumimoji table", () => {
  it("shows the tiles' extent and a margin of two all round, and the margin alone on an empty table", () => {
    expect(tableArea(new Map())).toEqual({ top: -2, left: -2, rows: 5, cols: 5 });
    expect(tableArea(tilesOn([0, 0], [0, 1], [0, 2]))).toEqual({ top: -2, left: -2, rows: 5, cols: 7 });
    expect(tableArea(tilesOn([-4, 3], [5, 3]))).toEqual({ top: -6, left: 1, rows: 14, cols: 5 });
    // A square being typed into is kept in view, beyond the tiles.
    expect(tableArea(tilesOn([0, 0]), [squareAt(0, 4)]).cols).toBe(9);
  });

  it("fits a small grid with big tiles, centred, and zooms out as the grid spreads", () => {
    const small = fitView(tableArea(tilesOn([0, 0], [0, 1], [0, 2])), 600, 480);
    expect(small.tile).toBe(TABLE.tileMost);
    // Centred: square (0, 1), the middle tile, is in the middle of the screen.
    expect(small.x + 1.5 * small.tile).toBeCloseTo(300, 0);
    expect(fitView(tableArea(tilesOn([0, 0], [0, 1], [0, 2])), 358, 480).tile).toBe(Math.floor(358 / 7));
    const wider = fitView(tableArea(tilesOn([0, 0], [0, 6])), 358, 480);
    expect(wider.tile).toBeLessThan(small.tile);
    expect(wider.tile).toBe(Math.floor(358 / 11));
  });

  it("never draws a tile smaller than a thumb, and pans past that", () => {
    const area = tableArea(tilesOn([0, 0], [0, 20]));
    const view = fitView(area, 358, 480);
    expect(view.tile).toBe(TABLE.tileLeast);
    expect(overflows(area, view, 358, 480)).toBe(true);
    expect(overflows(tableArea(tilesOn([0, 0])), fitView(tableArea(tilesOn([0, 0])), 358, 480), 358, 480)).toBe(false);
  });

  it("zooms about the point under the fingers, between the least and the most", () => {
    const view = { tile: 40, x: 100, y: 50 };
    const under = squareUnder(view, 220, 170);
    const zoomed = zoomView(view, 1.5, 220, 170);
    expect(zoomed.tile).toBe(60);
    expect(squareUnder(zoomed, 220, 170)).toEqual(under);
    expect(zoomView(view, 0.1, 0, 0).tile).toBe(TABLE.tileLeast);
    expect(zoomView(view, 10, 0, 0).tile).toBe(TABLE.zoomMost);
  });

  it("pans, and never so far that the crossword is lost", () => {
    const area = tableArea(tilesOn([0, 0]));
    const view = fitView(area, 358, 480);
    expect(panView(view, 10, -5)).toEqual({ ...view, x: view.x + 10, y: view.y - 5 });
    const lost = keepInReach(panView(view, 5000, 5000), area, 358, 480);
    expect(lost.x + area.left * lost.tile).toBeLessThan(358);
    expect(lost.y + area.top * lost.tile).toBeLessThan(480);
  });

  it("pans toward the edge a dragged tile is held near, and not at all in the middle", () => {
    expect(edgePan(179, 240, 358, 480)).toEqual({ dx: 0, dy: 0 });
    expect(edgePan(2, 240, 358, 480).dx).toBeGreaterThan(0);
    expect(edgePan(356, 240, 358, 480).dx).toBeLessThan(0);
    expect(edgePan(179, 478, 358, 480).dy).toBeLessThan(0);
  });
});
