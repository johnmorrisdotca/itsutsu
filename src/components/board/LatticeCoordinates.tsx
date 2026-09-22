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
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-testid="lattice-coordinates">
      {borderTiles(shape, size, flipped).map((tile) => {
        const x = fit.left + (tile.col + 0.5 + 0.5 * (tile.row + 0.5)) * cellW;
        const y = fit.top + (tile.row + 0.5) * cellH;
        // Hex's rows are numbered on white tiles and its columns lettered on black ones.
        const onBlack = shape === "rhombus" && tile.names === "column";
        return (
          <span
            key={`${tile.row}:${tile.col}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[0.65rem] leading-none font-medium select-none"
            style={{ left: `${x * 100}%`, top: `${y * 100}%`, color: onBlack ? "#e9e5d9" : theme.coordinate }}
            data-coordinate={tile.label}
          >
            {tile.label}
          </span>
        );
      })}
    </div>
  );
}
