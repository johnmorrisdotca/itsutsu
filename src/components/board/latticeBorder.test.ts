import { describe, expect, it } from "vitest";

import { borderTiles } from "./latticeBorder";

/**
 * Where the coordinates of a lattice board go — derived from the array, so
 * John's observation about the honeycomb ("one side has 1 to 6 and the other
 * 7 to 12... because of the shape") comes out of the rule rather than being
 * drawn by hand.
 */
describe("the border tiles that carry a lattice board's coordinates", () => {
  it("numbers every row of the rhombus at both ends and letters every column top and bottom", () => {
    const tiles = borderTiles("rhombus", 11);
    expect(tiles.filter((t) => t.names === "row")).toHaveLength(22);
    expect(tiles.filter((t) => t.names === "column")).toHaveLength(22);
    // Row 0 of the array is row 11: numbered in the tile before its first cell and after its last.
    expect(tiles).toContainEqual({ row: 0, col: -1, label: "11", names: "row" });
    expect(tiles).toContainEqual({ row: 0, col: 11, label: "11", names: "row" });
    // Column 0 is A, lettered above its top cell and below its bottom one.
    expect(tiles).toContainEqual({ row: -1, col: 0, label: "A", names: "column" });
    expect(tiles).toContainEqual({ row: 11, col: 0, label: "A", names: "column" });
  });

  it("splits the honeycomb's numbers across its two left edges, and its letters between top and bottom", () => {
    const tiles = borderTiles("hexagon", 11);
    // Every row numbered twice; the tiles on the slanted edges belong to the rows.
    expect(tiles.filter((t) => t.names === "row")).toHaveLength(22);
    // Rows 11 to 6 up the upper-left edge start at columns 5 down to 0; rows 5 to 1 start at column 0.
    expect(tiles).toContainEqual({ row: 0, col: 4, label: "11", names: "row" });
    expect(tiles).toContainEqual({ row: 5, col: -1, label: "6", names: "row" });
    expect(tiles).toContainEqual({ row: 10, col: -1, label: "1", names: "row" });
    // Letters: F to L along the top (the columns that start on row 0), A to F along the bottom.
    const top = tiles.filter((t) => t.row === -1).map((t) => t.label);
    expect(top).toEqual(["F", "G", "H", "J", "K", "L"]);
    const bottom = tiles.filter((t) => t.row === 11).map((t) => t.label);
    expect(bottom).toEqual(["A", "B", "C", "D", "E", "F"]);
    // A column whose top tile a row took is lettered at its bottom only — so every column is lettered once, F twice.
    const letters = tiles.filter((t) => t.names === "column").map((t) => t.label);
    expect(new Set(letters).size).toBe(11);
  });

  it("gives the star the same rule, with its tips lettered and its rows numbered at both ends", () => {
    const tiles = borderTiles("star", 17);
    expect(tiles.filter((t) => t.names === "row")).toHaveLength(34);
    // The top tip is the only cell of row 0, at column 12 (N): numbered either side, lettered above.
    expect(tiles).toContainEqual({ row: 0, col: 11, label: "17", names: "row" });
    expect(tiles).toContainEqual({ row: 0, col: 13, label: "17", names: "row" });
    expect(tiles).toContainEqual({ row: -1, col: 12, label: "N", names: "column" });
    // And the bottom tip, column 4 (E), row 1.
    expect(tiles).toContainEqual({ row: 17, col: 4, label: "E", names: "column" });
  });

  it("names each tile for the line under it when the board is turned round", () => {
    const turned = borderTiles("rhombus", 11, true);
    // The tile before array row 0 now names row 1, since the board is upside down.
    expect(turned).toContainEqual({ row: 0, col: -1, label: "1", names: "row" });
    expect(turned).toContainEqual({ row: -1, col: 0, label: "L", names: "column" });
  });

  it("never puts two labels on one tile", () => {
    for (const shape of ["rhombus", "hexagon", "star"] as const) {
      const tiles = borderTiles(shape, shape === "star" ? 17 : 11);
      const keys = tiles.map((t) => `${t.row}:${t.col}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
