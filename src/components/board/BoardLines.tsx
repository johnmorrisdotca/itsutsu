import { STAR_POINTS } from "@/lib/gomoku/gomoku.constants";
import { EDGE_LINE_WIDTH, LINE_WIDTH, STAR_RADIUS } from "./Board.constants";
import type { BoardThemeTokens } from "./board.types";

/**
 * The grid lines and star points, drawn in a coordinate space where each
 * intersection spacing is 1 unit and intersection (r, c) sits at (c+0.5, r+0.5).
 * The button grid laid over it uses the same spacing, so they stay aligned at
 * any rendered size.
 */
export function BoardLines({
  size,
  theme,
  quadrantSize = null,
}: {
  size: number;
  theme: BoardThemeTokens;
  /** Draws heavier lines between quadrants of this side, for the twist games. */
  quadrantSize?: number | null;
}) {
  const dividers =
    quadrantSize !== null && quadrantSize > 0 && size % quadrantSize === 0
      ? Array.from({ length: size / quadrantSize - 1 }, (_, i) => (i + 1) * quadrantSize)
      : [];
  const indices = Array.from({ length: size }, (_, i) => i);
  const first = 0.5;
  const last = size - 0.5;
  const widthFor = (i: number) =>
    i === 0 || i === size - 1 ? EDGE_LINE_WIDTH : LINE_WIDTH;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {indices.map((i) => (
        <line
          key={`h${i}`}
          x1={first}
          y1={i + 0.5}
          x2={last}
          y2={i + 0.5}
          strokeWidth={widthFor(i)}
          stroke={theme.line}
        />
      ))}
      {indices.map((i) => (
        <line
          key={`v${i}`}
          x1={i + 0.5}
          y1={first}
          x2={i + 0.5}
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
      {(STAR_POINTS[size] ?? []).map((point) => (
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
