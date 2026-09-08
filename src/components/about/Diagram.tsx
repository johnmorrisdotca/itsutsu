import type { ReactNode } from "react";

import type { DiagramProps, DiagramStone } from "./about.types";

/** One intersection or cell, in user units. */
const UNIT = 24;
/** Paper around the grid. */
const MARGIN = 14;
/** A stone's radius, a little under half a unit so neighbours do not touch. */
const RADIUS = UNIT * 0.44;

/**
 * A board position drawn as a figure, the way a go book prints one. It is an
 * SVG built from a list of stones, so it is crisp at any size, follows the
 * page's colours in the dark, and needs no image file. Five-in-a-row games
 * sit on the lines; Othello and the drop games sit in the cells.
 */
export function Diagram({ rows, cols, grid, stones, caption, label }: DiagramProps) {
  const onLines = grid === "lines";
  const span = (n: number) => (onLines ? n - 1 : n) * UNIT;
  const width = MARGIN * 2 + span(cols);
  const height = MARGIN * 2 + span(rows);
  const at = (i: number) => MARGIN + (onLines ? i : i + 0.5) * UNIT;
  const lineAt = (i: number) => (onLines ? at(i) : MARGIN + i * UNIT);
  const lineCount = (n: number) => (onLines ? n : n + 1);

  return (
    <figure className="mx-auto flex w-full max-w-xs flex-col items-center gap-2" data-testid="about-diagram">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={label}>
        <rect
          width={width}
          height={height}
          rx={6}
          fill={onLines ? "var(--ivory)" : "var(--moss-soft)"}
          stroke="var(--rule-strong)"
        />
        {Array.from({ length: lineCount(rows) }, (_, i) => (
          <line
            key={`r${i}`}
            x1={lineAt(0)}
            x2={lineAt(lineCount(cols) - 1)}
            y1={lineAt(i)}
            y2={lineAt(i)}
            stroke="var(--rule-strong)"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: lineCount(cols) }, (_, i) => (
          <line
            key={`c${i}`}
            x1={lineAt(i)}
            x2={lineAt(i)}
            y1={lineAt(0)}
            y2={lineAt(lineCount(rows) - 1)}
            stroke="var(--rule-strong)"
            strokeWidth={1}
          />
        ))}
        {stones.map((stone) => (
          <Stone key={`${stone.row}-${stone.col}`} stone={stone} x={at(stone.col)} y={at(stone.row)} />
        ))}
      </svg>
      <figcaption className="text-center text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

function Stone({ stone, x, y }: { stone: DiagramStone; x: number; y: number }): ReactNode {
  const black = stone.colour === "black";
  return (
    <g>
      {stone.ring ? (
        <circle cx={x} cy={y} r={RADIUS + 3} fill="none" stroke="var(--shu)" strokeWidth={2} />
      ) : null}
      <circle
        cx={x}
        cy={y}
        r={RADIUS}
        fill={black ? "var(--ink)" : "var(--ivory)"}
        stroke="var(--ink)"
        strokeWidth={1}
        strokeDasharray={stone.taken ? "3 2" : undefined}
        opacity={stone.taken ? 0.55 : 1}
      />
      {stone.label ? (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
          fill={black ? "var(--ivory)" : "var(--ink)"}
        >
          {stone.label}
        </text>
      ) : null}
    </g>
  );
}
