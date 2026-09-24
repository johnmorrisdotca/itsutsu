import type { PictureSize } from "@/components/games/games.types";
import { pictureBox } from "@/components/games/picture";
import { NUMBER_PLACE_BOXES } from "@/lib/puzzles/numberPlace/boxes";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * A size tile's picture on the puzzle set-up: the grid at that size, its
 * boxes drawn heavier, at one of the site's three picture sizes — never a
 * pixel count of its own (`PICTURE_PX`, through `pictureBox`).
 */
export function PuzzleSizeMark({ kind, size, picture }: { kind: PuzzleKind; size: number; picture: PictureSize }) {
  const boxes = kind === "numberPlace" ? NUMBER_PLACE_BOXES[size] : null;
  const pad = 0.5;
  const lines = Array.from({ length: size + 1 }, (_, i) => i);
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
      className="shrink-0"
      style={pictureBox(picture)}
      aria-hidden="true"
      data-testid="puzzle-size-mark"
      data-size={size}
      data-picture={picture}
    >
      <rect x={0} y={0} width={size} height={size} rx={0.2} fill="var(--ivory)" stroke="var(--ink)" strokeWidth={0.18} />
      {lines.map((i) => {
        const heavy = boxes !== null && i !== 0 && i !== size;
        const heavyRow = heavy && i % boxes.rows === 0;
        const heavyCol = heavy && i % boxes.cols === 0;
        return (
          <g key={i}>
            <line x1={0} x2={size} y1={i} y2={i} stroke={heavyRow ? "var(--ink)" : "var(--rule-strong)"} strokeWidth={heavyRow ? 0.16 : 0.05} />
            <line y1={0} y2={size} x1={i} x2={i} stroke={heavyCol ? "var(--ink)" : "var(--rule-strong)"} strokeWidth={heavyCol ? 0.16 : 0.05} />
          </g>
        );
      })}
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.55} fontWeight={600} fill="var(--ink)" opacity={0.85}>
        {size}
      </text>
    </svg>
  );
}
