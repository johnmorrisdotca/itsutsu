import { BLOCKED, STAR_POINTS } from "@/lib/gomoku/gomoku.constants";
import type { Cell } from "@/lib/gomoku/gomoku.types";
import { hexagonSealed, inHexagon } from "@/lib/gomoku/rules/hexagon";
import { STAR_RADIUS as HEXAGRAM_RADIUS, inStar, starCampOf } from "@/lib/gomoku/rules/chineseCheckers";
import type { LatticeShape } from "./margin";
import { EDGE_LINE_WIDTH, HEX_LATTICE, LINE_WIDTH, STAR_RADIUS } from "./Board.constants";
import type { BoardThemeTokens } from "./board.types";

/**
 * The grid lines and star points, drawn in a coordinate space where each
 * intersection spacing is 1 unit and intersection (r, c) sits at (c+0.5, r+0.5).
 * The button grid laid over it uses the same spacing, so they stay aligned at
 * any rendered size.
 */
/** The two sides' colours on Hex's border tiles: black owns the top and bottom rows, white the left and right columns. */
const EDGE = { black: "#22231f", white: "#fffef9" } as const;

/**
 * HEX'S BORDER, AS A RING OF TILES ROUND THE RHOMBUS.
 *
 * John, 2026-09-22: "I have a better idea than drawing those lines. You would
 * actually just fill out an entire row of hexagons, dark or light and that
 * would simulate the same thing and actually eliminate those issues." The
 * bands were rectangles along the rhombus's edges, painted over the tiles,
 * and where black met white at a corner one lay on the other. So the border
 * is one more row of tiles above and below, in black, and one more column
 * either side, in white — the same tiles as the board, so nothing is painted
 * over anything.
 *
 * NO CORNER TILES. A real board splits each corner between the two colours,
 * because its two edges have to meet somewhere — but nothing here is in play
 * on the border at all, and John, looking at the four split tiles: "They are
 * never in play... those are really not needed." The rows are the board's
 * width, the columns its height, and the corners stay faint ground.
 */
function RhombusBorder({ size }: { size: number }) {
  /*
   * One more row above and below in black, one more column either side in
   * white. The coordinates that sit in them are HTML over the board
   * (`LatticeCoordinates`), in the same type as every other board's, so
   * nothing is drawn here but the tiles.
   */
  const tiles: { row: number; col: number; edge: "black" | "white" }[] = [];
  for (let col = 0; col < size; col += 1) tiles.push({ row: -1, col, edge: "black" }, { row: size, col, edge: "black" });
  for (let row = 0; row < size; row += 1) tiles.push({ row, col: -1, edge: "white" }, { row, col: size, edge: "white" });
  return (
    <g data-border="rhombus">
      {tiles.map((tile) => (
        <polygon
          key={`${tile.row}:${tile.col}`}
          points={hexagonPoints(tile.col + 0.5, tile.row + 0.5)}
          fill={EDGE[tile.edge]}
          opacity={0.88}
          data-edge={tile.edge}
        />
      ))}
    </g>
  );
}

/**
 * THE HONEYCOMB'S CELLS, as one hexagon each in grid space.
 *
 * The whole drawing is sheared onto the lattice by LATTICE_TRANSFORM, so a
 * hexagon that is regular on screen is not regular here: it is a regular
 * hexagon pulled back through the shear's inverse. Its six vertices sit at a
 * third of the way to each of the three neighbouring-cell corners — 1/√3 of
 * the lattice spacing, at 30°, 90°, 150° and so on, the pointy-top cell whose
 * neighbours lie at 0°, 60° and 120° — and each is then unslanted:
 * scaleY(1/cos30°) followed by skewX(-30°). Worked out once; a polygon per
 * cell then reads as a honeycomb once the SVG takes the lattice transform.
 *
 * Drawn a touch under full size so the strokes of neighbouring cells do not
 * fight: the gap between cells is what makes a honeycomb read as cells at all,
 * and it is the one thing the grey-hexagon boards of the elder sites lack.
 */
const HEXAGON_VERTICES: readonly [number, number][] = (() => {
  const reach = (1 / Math.sqrt(3)) * 0.94;
  const tan30 = Math.tan(Math.PI / 6);
  return Array.from({ length: 6 }, (_, k) => {
    const angle = (Math.PI / 6) + (k * Math.PI) / 3;
    const vx = reach * Math.cos(angle);
    const vy = reach * Math.sin(angle);
    const y = vy / HEX_LATTICE.height;
    return [vx - y * tan30, y] as [number, number];
  });
})();

export function hexagonPoints(cx: number, cy: number): string {
  return HEXAGON_VERTICES.map(([dx, dy]) => `${(cx + dx).toFixed(4)},${(cy + dy).toFixed(4)}`).join(" ");
}


export function BoardLines({
  size,
  theme,
  quadrantSize = null,
  cells = false,
  checkered = false,
  lattice = null,
}: {
  size: number;
  theme: BoardThemeTokens;
  /** Draws heavier lines between quadrants of this side, for the twist games. */
  quadrantSize?: number | null;
  /** Rules the squares around the points instead of the lines through them: Othello, drop games. */
  cells?: boolean;
  /** Checkers: shades every other square, so the dark squares in play read at a glance. */
  checkered?: boolean;
  /**
   * A board on the hexagon lattice — Hex's rhombus, Chinese Checkers' star,
   * the honeycomb — drawn as hexagon cells on its own fit. Null for a square
   * board, which is ruled below.
   */
  lattice?: { shape: LatticeShape; board: readonly Cell[]; transform: string } | null;
}) {
  if (lattice !== null) {
    const { shape, board, transform } = lattice;
    /*
     * ONE DRAWING FOR ALL THREE LATTICE BOARDS, since 2026-09-22. John, with
     * the three side by side: "All three boards have ideally the same shape or
     * movements yet they all look kind of different… can the rhombus look
     * slightly different to look more like the centre image?" The centre
     * image was the honeycomb, and its cells are what a board on this lattice
     * IS: Hex's traditional board is a rhombus of hexagon cells (the triangle
     * of lines it used to be drawn as is only the dual of that), and a star of
     * hexagon cells is what a Chinese Checkers board looks like with tiles
     * instead of holes. So every playable cell is a filled hexagon, the
     * sealed centre of the honeycomb is a hexagon of frame colour, and the
     * wood beyond the shape carries the same outline faintly (`LatticeGround`).
     *
     * Hex keeps the one thing that is its rules: a colour on each pair of
     * sides. Drawn as bands under the cells along the rhombus's edges, they
     * show as the board's two coloured borders, which is how a Hex board is
     * made.
     */
    const inShape = (point: { row: number; col: number }): boolean =>
      shape === "hexagon" ? inHexagon(size, point) : shape === "star"
          ? // The hexagram's radius from its own rules, NOT `STAR_RADIUS` here, which is a go board's star-point dot.
            inStar(HEXAGRAM_RADIUS, point)
          : true;
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        overflow="visible"
        style={{ transform, transformOrigin: "top left" }}
        data-lattice={shape}
      >
        {shape === "rhombus" ? <RhombusBorder size={size} /> : null}
        {board.map((cell, index) => {
          const point = { row: Math.floor(index / size), col: index % size };
          if (!inShape(point)) return null;
          const sealed = shape === "hexagon" && hexagonSealed(size, point) && cell === BLOCKED;
          /*
           * The star's two camps, tinted on the tile. It used to be a square
           * painted over the cell by `Intersection`, which on a hexagon spills
           * onto the six neighbours: pale parallelograms lying across the
           * tiles, which John rightly called a painting issue.
           */
          const camp = shape === "star" ? starCampOf(HEXAGRAM_RADIUS, point) : null;
          const points = hexagonPoints(point.col + 0.5, point.row + 0.5);
          return (
            <g key={index}>
              <polygon
                points={points}
                fill={sealed ? theme.frame : theme.playSquare}
                stroke={theme.line}
                strokeWidth={LINE_WIDTH}
                strokeLinejoin="round"
                data-cell={sealed ? "sealed" : "open"}
              />
              {camp !== null ? (
                <polygon
                  points={points}
                  fill={camp === "black" ? "rgba(20, 20, 20, 0.16)" : "rgba(255, 255, 255, 0.34)"}
                  stroke="none"
                  data-camp={camp}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    );
  }
  const dividers =
    quadrantSize !== null && quadrantSize > 0 && size % quadrantSize === 0
      ? Array.from({ length: size / quadrantSize - 1 }, (_, i) => (i + 1) * quadrantSize)
      : [];
  // On the lines there are `size` rules through the points at i+0.5; in the
  // squares there are `size + 1` rules along the edges at i.
  const count = cells ? size + 1 : size;
  const indices = Array.from({ length: count }, (_, i) => i);
  const offset = cells ? 0 : 0.5;
  const first = offset;
  const last = size - offset;
  const widthFor = (i: number) =>
    i === 0 || i === count - 1 ? EDGE_LINE_WIDTH : LINE_WIDTH;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/*
        * Checkers: the dark squares are the ones in play, shaded so they read
        * at a glance — which is the whole board here, since every piece stands
        * on one and every move runs along them.
        *
        * From `playSquare`, the theme's own token for exactly this. It used to
        * be `frame` at 22%, and that did not read: a contrast of 1.24 on kaya
        * and 1.06 on sumi, where a plain square and a square in play were the
        * same colour to the eye. See `playSquare` in board.types.ts for why no
        * opacity on the frame could have fixed it.
        */}
      {checkered ? (
        <g aria-hidden="true">
          {Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) =>
              (row + col) % 2 === 1 ? (
                <rect key={`d${row}-${col}`} x={col} y={row} width={1} height={1} fill={theme.playSquare} />
              ) : null,
            ),
          )}
        </g>
      ) : null}
      {/* Each line says which it is, so a browser test can ask where two of them meet. */}
      {indices.map((i) => (
        <line
          key={`h${i}`}
          data-line={`h${i}`}
          x1={first}
          y1={i + offset}
          x2={last}
          y2={i + offset}
          strokeWidth={widthFor(i)}
          stroke={theme.line}
        />
      ))}
      {indices.map((i) => (
        <line
          key={`v${i}`}
          data-line={`v${i}`}
          x1={i + offset}
          y1={first}
          x2={i + offset}
          y2={last}
          strokeWidth={widthFor(i)}
          stroke={theme.line}
        />
      ))}
      {(cells ? [] : (STAR_POINTS[size] ?? [])).map((point) => (
        <circle
          key={`s${point.row}-${point.col}`}
          cx={point.col + 0.5}
          cy={point.row + 0.5}
          r={STAR_RADIUS}
          fill={theme.star}
        />
      ))}
    </svg>
  );
}
