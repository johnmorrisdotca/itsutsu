import { inHexagon } from "@/lib/gomoku/rules/hexagon";
import { STAR_RADIUS as HEXAGRAM_RADIUS, inStar } from "@/lib/gomoku/rules/chineseCheckers";
import { columnLetter, rowNumber } from "@/lib/gomoku/notation";
import type { LatticeShape } from "./Board.constants";

/**
 * WHERE A LATTICE BOARD'S COORDINATES GO: in the ring of tiles round its shape.
 *
 * John, 2026-09-22: "we should be adding the numbers or letters that we find
 * at the edge of the board, also centred nicely into these hexagonal borders
 * so that it's easy to identify" — and then, of the honeycomb: "one side of
 * the edges will have numbers like one through six and then the other side
 * will have numbers seven through 12... that just seems to be how it works
 * because of the shape."
 *
 * It is, and this is why. On a sheared array a row is a horizontal line of
 * cells and a column a slanted one, and every row and every column of the
 * shape STARTS somewhere on its edge and ENDS somewhere else on it. So each
 * row is numbered in the tile just before its first cell and the tile just
 * after its last, and each column is lettered in the tile just above its
 * first cell and the tile just below its last — the same rule for the
 * rhombus, the hexagon and the star.
 *
 * On a hexagon the two slanted edges are where the rows start AND where the
 * first columns start, so one tile would have to say both. The row wins, and
 * a column whose top tile is taken is lettered at its bottom only. That is
 * what puts the numbers 11 to 6 up one left edge and 5 to 1 down the other,
 * and the letters along the top and bottom: John's observation, derived
 * rather than drawn by hand, so it comes out right on every size.
 */
export type BorderTile = {
  row: number;
  col: number;
  label: string;
  /** Which kind of line it names, which decides its colour on the rhombus. */
  names: "row" | "column";
};

/** Whether the shape holds this cell of its array. */
function inShape(shape: LatticeShape, size: number, row: number, col: number): boolean {
  if (row < 0 || col < 0 || row >= size || col >= size) return false;
  if (shape === "hexagon") return inHexagon(size, { row, col });
  if (shape === "star") return inStar(HEXAGRAM_RADIUS, { row, col });
  return true;
}

/**
 * The labelled tiles, in the array's own coordinates: rows first, so a tile
 * a row and a column both reach is the row's.
 *
 * `flipped` names each tile for the line ACTUALLY under it on a board turned
 * round — the tiles never move, the cells beneath them do.
 */
export function borderTiles(shape: LatticeShape, size: number, flipped = false): BorderTile[] {
  const tiles = new Map<string, BorderTile>();
  const key = (row: number, col: number) => `${row}:${col}`;
  const put = (row: number, col: number, label: string, names: BorderTile["names"]) => {
    if (!tiles.has(key(row, col))) tiles.set(key(row, col), { row, col, label, names });
  };
  const rowName = (row: number) => String(rowNumber(size, flipped ? size - 1 - row : row));
  const colName = (col: number) => columnLetter(flipped ? size - 1 - col : col);

  for (let row = 0; row < size; row += 1) {
    const cols = Array.from({ length: size }, (_, col) => col).filter((col) => inShape(shape, size, row, col));
    if (cols.length === 0) continue;
    put(row, cols[0]! - 1, rowName(row), "row");
    put(row, cols[cols.length - 1]! + 1, rowName(row), "row");
  }
  for (let col = 0; col < size; col += 1) {
    const rows = Array.from({ length: size }, (_, row) => row).filter((row) => inShape(shape, size, row, col));
    if (rows.length === 0) continue;
    put(rows[0]! - 1, col, colName(col), "column");
    put(rows[rows.length - 1]! + 1, col, colName(col), "column");
  }
  return [...tiles.values()];
}
