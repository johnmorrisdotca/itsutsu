import { boundsOf, squareAt, type GridVerdict, type Tiles } from "../grid.ts";
import { tileFace } from "../tileFace.ts";

/** How a tile on the table stands: part of a sound crossword, in a run that is not a word, or apart from the rest. */
export type TileMark = "sound" | "misspelt" | "apart";

export type BoardSquare = {
  square: string;
  row: number;
  col: number;
  /** The tile standing there, or null for an empty square. */
  tile: string | null;
  glyph: string;
  wild: boolean;
  mark: TileMark | null;
};

export type BoardModel = { rows: number; cols: number; squares: BoardSquare[] };

/** How many empty squares are kept round the tiles on every side, so there is always room to build out. */
export const BOARD_MARGIN = 2;
/** The fewest squares a side, so an empty or small table is still a table. */
export const BOARD_LEAST = 7;

/**
 * THE PART OF THE TABLE TO DRAW, for a grid and its verdict: the tiles and a
 * margin round them, at least `BOARD_LEAST` a side, each square with its tile,
 * what is printed on it, and how it stands. Row by row, left to right. The
 * grid itself has no edges; this is only the window a board shows it through.
 */
export function boardModel(tiles: Tiles, verdict: GridVerdict | null, glyphOf: (tile: string) => string = (tile) => tileFace(tile).glyph): BoardModel {
  const bounds = boundsOf(tiles) ?? { top: 0, left: 0, bottom: 0, right: 0 };
  let top = bounds.top - BOARD_MARGIN;
  let left = bounds.left - BOARD_MARGIN;
  let rows = bounds.bottom - bounds.top + 1 + BOARD_MARGIN * 2;
  let cols = bounds.right - bounds.left + 1 + BOARD_MARGIN * 2;
  if (rows < BOARD_LEAST) {
    top -= Math.floor((BOARD_LEAST - rows) / 2);
    rows = BOARD_LEAST;
  }
  if (cols < BOARD_LEAST) {
    left -= Math.floor((BOARD_LEAST - cols) / 2);
    cols = BOARD_LEAST;
  }
  const squares: BoardSquare[] = [];
  for (let row = top; row < top + rows; row += 1) {
    for (let col = left; col < left + cols; col += 1) {
      const square = squareAt(row, col);
      const tile = tiles.get(square) ?? null;
      const mark: TileMark | null =
        tile === null || verdict === null ? null : verdict.misspelt.has(square) ? "misspelt" : verdict.apart.has(square) ? "apart" : "sound";
      squares.push({ square, row, col, tile, glyph: tile === null ? "" : glyphOf(tile), wild: tile !== null && tileFace(tile).wild, mark });
    }
  }
  return { rows, cols, squares };
}
