import type { BoardThemeTokens } from "./board.types";
import { hexagonPoints } from "./BoardLines";
import { HEX_LATTICE, LINE_WIDTH, type LatticeFit } from "./Board.constants";

/**
 * THE WOOD UNDER A LATTICE BOARD, MARKED ALL THE WAY ACROSS.
 *
 * John, 2026-09-22, on the Chinese Checkers board: "it looks like a totally
 * different style than the other hexagonal or other designs… I feel like it
 * should look like a regular board with a star pattern in it… I would prefer
 * to see a board that has some sort of dots or markings on the entire board
 * yet we have a noticeable and playable star pattern. This would go for the
 * other patterns that we have as well where it's also an hex."
 *
 * A go board rules every line, and a piece stands on some of them: the board
 * is the whole square and the game is what is played on it. The three boards
 * on the hexagon lattice did the opposite — the star, the hexagon and the
 * rhombus each floated on bare wood, and the wood outside them had no
 * markings at all, so each read as a shape cut out and laid down rather than
 * as a board. And each did it differently: dots for the star, cells for the
 * honeycomb, a paper cut to a rhombus for Hex.
 *
 * This is the same faint lattice under all three, drawn across the whole
 * square. The playable shape then sits ON a board, in the full-strength
 * markings each game already had — the star's holes, the honeycomb's cells,
 * Hex's lines and bands — and it is noticeable because it is the part of the
 * board that is marked in full.
 *
 * BEYOND THE ARRAY, deliberately. Every lattice board is a square array
 * sheared and fitted to its shape, and the sheared array is a rhombus that
 * does not cover the square it is drawn in — the corners outside it would be
 * bare. So the ground is drawn over whatever tiles cross the box, on the same
 * transform, and the playing area's own clip trims it to the board. A few
 * hundred faint marks that never change.
 *
 * FAINT, not shaded. The board's own cells are the game; these say only
 * "this wood is a board". Half the stroke and a third of the opacity is what
 * reads as texture rather than as a second grid.
 *
 * ONE MARKING, THE CELL'S OUTLINE, because the three boards are drawn one
 * way now — see the lattice branch of `BoardLines`. A first draft gave the
 * star and the rhombus dots and the honeycomb cells, and John, with the three
 * side by side, asked why boards with the same moves looked so different.
 */


export function LatticeGround({
  size,
  theme,
  fit,
}: {
  size: number;
  theme: BoardThemeTokens;
  /** The fit this board's lattice takes — the same one its tiles are drawn with. */
  fit: LatticeFit;
}) {
  /*
   * EXACTLY THE TILES THAT TOUCH THE BOX, worked out from the fit rather than
   * by a fixed margin. A margin of half the board was enough for the star and
   * the hexagon and left the far corner bare once the rhombus gained its ring
   * of border tiles and shrank to make room; a margin big enough for that
   * would draw thousands of tiles nobody sees on the others. So: for each row
   * that crosses the box, the columns that cross it, and no more.
   */
  const cellW = fit.scale / size;
  const cellH = (HEX_LATTICE.height * fit.scale) / size;
  const rowFrom = Math.floor(-fit.top / cellH) - 1;
  const rowTo = Math.ceil((1 - fit.top) / cellH) + 1;
  const tiles: { row: number; col: number }[] = [];
  for (let row = rowFrom; row <= rowTo; row += 1) {
    // A cell at column c of row r starts at box x = left + (c + 0.5 r) cellW: solve for the columns in [0, 1].
    const shift = 0.5 * (row + 0.5);
    const colFrom = Math.floor((0 - fit.left) / cellW - shift) - 1;
    const colTo = Math.ceil((1 - fit.left) / cellW - shift) + 1;
    for (let col = colFrom; col <= colTo; col += 1) tiles.push({ row, col });
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      // The extra rows and columns fall outside the viewBox on purpose, and are clipped by the board.
      overflow="visible"
      style={{ transform: fit.transform, transformOrigin: "top left" }}
      data-testid="lattice-ground"
    >
      <g opacity={0.32}>
        {tiles.map(({ row, col }) => (
          <polygon
            key={`${row}:${col}`}
            points={hexagonPoints(col + 0.5, row + 0.5)}
            fill="none"
            stroke={theme.line}
            strokeWidth={LINE_WIDTH / 2}
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}
