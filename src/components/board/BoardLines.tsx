import { STAR_POINTS } from "@/lib/gomoku/gomoku.constants";
import { EDGE_LINE_WIDTH, LINE_WIDTH, STAR_RADIUS } from "./Board.constants";
import type { BoardThemeTokens } from "./board.types";

/**
 * The grid lines and star points, drawn in a coordinate space where each
 * intersection spacing is 1 unit and intersection (r, c) sits at (c+0.5, r+0.5).
 * The button grid laid over it uses the same spacing, so they stay aligned at
 * any rendered size.
 */
/** How wide a side's band is, in cells, on the connection board. */
const BAND = 0.28;

export function BoardLines({
  size,
  theme,
  quadrantSize = null,
  cells = false,
  rhombus = false,
  checkered = false,
}: {
  size: number;
  theme: BoardThemeTokens;
  /** Draws heavier lines between quadrants of this side, for the twist games. */
  quadrantSize?: number | null;
  /** Rules the squares around the points instead of the lines through them: Othello, drop games. */
  cells?: boolean;
  /** The connection game: the same grid, slanted, with a colour on each pair of sides. */
  rhombus?: boolean;
  /** Checkers: shades every other square, so the dark squares in play read at a glance. */
  checkered?: boolean;
}) {
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
      style={rhombus ? { transform: `translateY(16.667%) skewX(${(Math.atan(0.5) * 180) / Math.PI}deg) scale(${1 / 1.5})`, transformOrigin: "top left" } : undefined}
    >
      {/* Checkers: the dark squares are the ones in play, shaded so they read at a glance. */}
      {checkered ? (
        <g aria-hidden="true">
          {Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) =>
              (row + col) % 2 === 1 ? (
                <rect key={`d${row}-${col}`} x={col} y={row} width={1} height={1} fill={theme.frame} opacity={0.22} />
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
      {indices.map((i) => (
        <line
          key={`h${i}`}
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
          x1={i + offset}
          y1={first}
          x2={i + offset}
          y2={last}
          strokeWidth={widthFor(i)}
          stroke={theme.line}
        />
      ))}
      {dividers.map((at) => (
        <g key={`q${at}`}>
          <line x1={at} y1={first} x2={at} y2={last} strokeWidth={EDGE_LINE_WIDTH * 1.5} stroke={theme.frame} />
          <line x1={first} y1={at} x2={last} y2={at} strokeWidth={EDGE_LINE_WIDTH * 1.5} stroke={theme.frame} />
        </g>
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
