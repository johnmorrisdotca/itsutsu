import { STAR_POINTS } from "@/lib/gomoku/gomoku.constants";
import { EDGE_LINE_WIDTH, LATTICE_TRANSFORM, LINE_WIDTH, STAR_RADIUS } from "./Board.constants";
import type { BoardThemeTokens } from "./board.types";

/**
 * The grid lines and star points, drawn in a coordinate space where each
 * intersection spacing is 1 unit and intersection (r, c) sits at (c+0.5, r+0.5).
 * The button grid laid over it uses the same spacing, so they stay aligned at
 * any rendered size.
 */
/** How wide a side's band is, in cells, on the connection board. */
const BAND = 0.28;

/**
 * The third family of lines on the connection board, as segments in grid
 * space, one per short diagonal of the rhombus: through the points with
 * `row + col` equal, corner to corner but not the two lone corners. The
 * rows and the slanted columns are the ordinary rules through the points;
 * once the whole drawing is sheared onto the lattice these run at 120° to
 * them, and the three together rule the board as a wooden one is ruled.
 * Each is the line of the engine's own `{ row: 1, col: -1 }` neighbour.
 */
function shortDiagonals(size: number): { key: number; x1: number; y1: number; x2: number; y2: number }[] {
  const last = size - 1;
  return Array.from({ length: 2 * last - 1 }, (_, i) => {
    const sum = i + 1;
    const top = Math.max(0, sum - last);
    const bottom = Math.min(sum, last);
    return { key: sum, x1: sum - top + 0.5, y1: top + 0.5, x2: sum - bottom + 0.5, y2: bottom + 0.5 };
  });
}

export function BoardLines({
  size,
  theme,
  quadrantSize = null,
  cells = false,
  rhombus = false,
  checkered = false,
  hidden = false,
}: {
  size: number;
  theme: BoardThemeTokens;
  /** Draws heavier lines between quadrants of this side, for the twist games. */
  quadrantSize?: number | null;
  /** Rules the squares around the points instead of the lines through them: Othello, drop games. */
  cells?: boolean;
  /**
   * The connection game: the grid sheared onto the hexagon lattice, a colour
   * on each pair of sides, and — drawn on the lines — the third family of
   * rules that makes it a triangular lattice with the stones on its crossings.
   */
  rhombus?: boolean;
  /** Checkers: shades every other square, so the dark squares in play read at a glance. */
  checkered?: boolean;
  /**
   * Chinese Checkers: most of the square this board is embedded in is not
   * part of the hexagram at all, so a full grid of lines across it would
   * mark space no piece can ever stand on. Rather than draw a grid trimmed
   * to a star's true outline, none is drawn; the pieces and the shaded
   * points carry the board on their own.
   */
  hidden?: boolean;
}) {
  if (hidden) return null;
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
      style={rhombus ? { transform: LATTICE_TRANSFORM, transformOrigin: "top left" } : undefined}
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
      {/*
        * Each colour owns two sides, and a player has to be able to see which
        * at a glance, so they are bands rather than lines: black along the top
        * and bottom, white down the left and right.
        */}
      {rhombus ? (
        <g>
          <rect x={0} y={0} width={size} height={BAND} fill="#22231f" opacity={0.85} />
          <rect x={0} y={size - BAND} width={size} height={BAND} fill="#22231f" opacity={0.85} />
          <rect x={0} y={0} width={BAND} height={size} fill="#fffef9" opacity={0.9} />
          <rect x={size - BAND} y={0} width={BAND} height={size} fill="#fffef9" opacity={0.9} />
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
      {rhombus && !cells
        ? shortDiagonals(size).map((d) => (
            <line key={`d${d.key}`} data-line={`d${d.key}`} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} strokeWidth={LINE_WIDTH} stroke={theme.line} />
          ))
        : null}
      {dividers.map((at) => (
        <g key={`q${at}`}>
          <line x1={at} y1={first} x2={at} y2={last} strokeWidth={EDGE_LINE_WIDTH * 1.5} stroke={theme.frame} />
          <line x1={first} y1={at} x2={last} y2={at} strokeWidth={EDGE_LINE_WIDTH * 1.5} stroke={theme.frame} />
        </g>
      ))}
      {(cells || rhombus ? [] : (STAR_POINTS[size] ?? [])).map((point) => (
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
