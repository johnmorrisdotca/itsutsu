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
}: {
  size: number;
  theme: BoardThemeTokens;
}) {
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
