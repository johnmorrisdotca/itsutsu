import { COORDINATE_FIT, COORDINATE_REM } from "./Board.constants";
import type { BoardThemeTokens } from "./board.types";
import { HEX_LATTICE, type LatticeFit, type LatticeShape } from "./Board.constants";
import { borderTiles } from "./latticeBorder";

/**
 * THE COORDINATES OF A LATTICE BOARD, ON ITS BORDER TILES, IN THE SAME TYPE AS
 * EVERY OTHER BOARD'S.
 *
 * John, 2026-09-22: "my point about the font and colour and size stands where
 * it should be the same small size that you see on the edge of any of the
 * regular boards and this makes it subtle and doesn't stand out."
 *
 * So they are not SVG text. Text inside the board's SVG is scaled with the
 * lattice, so it would be six pixels on a phone and fourteen at a desk while
 * the square boards' labels stay at 0.65rem everywhere. These are the same
 * HTML spans the square boards' strips use — the same size, weight and
 * colour token — laid over the board at the centre of each border tile, which
 * the fit's own numbers give: a cell at column c of row r has its centre at
 * (c + 0.5 + 0.5(r + 0.5)) cells across the sheared grid and (r + 0.5) rows
 * down it.
 *
 * On Hex's black tiles the coordinate colour would vanish, so those take a
 * light one; everywhere else it is `theme.coordinate`, as on the strips.
 *
 * AND NEVER TALLER THAN THE ROW IT SITS ON. 0.65rem is 10.4px; on Hex at 19
 * the rows are 8.8px apart on a phone-sized board, so the labels ran into each
 * other. John, 2026-09-22: "19x19 hex board is so small the text is too big".
 *
 * The ceiling is the row spacing, not a smaller fixed size, because the board
 * is responsive: the same label sits on an 8.8px row at 330px wide and a
 * 14.9px row at 560px. A fixed size small enough for the phone would be
 * needlessly small at a desk, and one that fits the desk still collides on the
 * phone. `cqw` is a percent of the board's own width, so the cap follows the
 * board at every width, and `min` keeps 0.65rem wherever it fits — which is
 * every board but the biggest Hex, so nothing else on the site changes.
 */
export function LatticeCoordinates({
  shape,
  size,
  fit,
  theme,
  flipped,
}: {
  shape: LatticeShape;
  size: number;
  fit: LatticeFit;
  theme: BoardThemeTokens;
  flipped: boolean;
}) {
  const cellW = fit.scale / size;
  const cellH = (HEX_LATTICE.height * fit.scale) / size;
  /*
   * The label's ceiling, as a percent of the board's width. `cellH` is the row
   * spacing as a fraction of the board, and the board is square, so a percent
   * of its width is a percent of its height too. The gap below 1 is what keeps
   * two rows from touching rather than merely not overlapping.
   */
  const ceiling = `${(cellH * 100 * COORDINATE_FIT).toFixed(3)}cqw`;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      data-testid="lattice-coordinates"
      /*
       * The container the ceiling is measured against. On this box rather than
       * the board, so nothing else inherits size containment: it is already
       * absolutely positioned at `inset-0`, so its width IS the board's and it
       * has no layout of its own to disturb.
       */
      style={{ containerType: "inline-size" }}
    >
      {borderTiles(shape, size, flipped).map((tile) => {
        const x = fit.left + (tile.col + 0.5 + 0.5 * (tile.row + 0.5)) * cellW;
        const y = fit.top + (tile.row + 0.5) * cellH;
        // Hex's rows are numbered on white tiles and its columns lettered on black ones.
        const onBlack = shape === "rhombus" && tile.names === "column";
        return (
          <span
            key={`${tile.row}:${tile.col}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 leading-none font-medium select-none"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              color: onBlack ? "#e9e5d9" : theme.coordinate,
              fontSize: `min(${COORDINATE_REM}rem, ${ceiling})`,
            }}
            data-coordinate={tile.label}
          >
            {tile.label}
          </span>
        );
      })}
    </div>
  );
}
