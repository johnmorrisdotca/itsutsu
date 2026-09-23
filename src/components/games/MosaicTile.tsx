import { BOARD_GRIDS } from "@/lib/gomoku/gomoku.constants";
import type { MosaicTile as Tile } from "@/lib/catalogue/realGames";

import { pictureBox } from "./picture";

/**
 * One finished game's final position, drawn small: the wood, the lines (or the
 * squares, for a game played in them), and the stones where they ended.
 * A plain SVG rather than the playing board — a dozen of them sit on one page,
 * and none of them is played on.
 */
export function MosaicTile({ tile, grid }: { tile: Tile; grid: string }) {
  const { width } = pictureBox("regular");
  const n = tile.size;
  const cells = grid === BOARD_GRIDS.cells;
  // Points sit on the crossings, or in the middle of the squares.
  const step = cells ? 100 / n : 100 / (n + 1);
  const at = (i: number) => (cells ? step * (i + 0.5) : step * (i + 1));
  const lines = cells
    ? Array.from({ length: n + 1 }, (_, i) => i * step)
    : Array.from({ length: n }, (_, i) => at(i));
  const from = cells ? 0 : at(0);
  const to = cells ? 100 : at(n - 1);
  const radius = step * 0.44;

  return (
    <svg viewBox="0 0 100 100" width={width} height={width} className="rounded-md" aria-hidden="true">
      <rect x="0" y="0" width="100" height="100" fill="#e2ba7a" />
      {lines.map((p) => (
        <g key={p} stroke="#5b3d1c" strokeWidth={0.4} opacity={0.7}>
          <line x1={from} y1={p} x2={to} y2={p} />
          <line x1={p} y1={from} x2={p} y2={to} />
        </g>
      ))}
      {[...tile.board].map((cell, index) => {
        if (cell === ".") return null;
        const cx = at(index % n);
        const cy = at(Math.floor(index / n));
        if (cell === "x") return <rect key={index} x={cx - radius} y={cy - radius} width={radius * 2} height={radius * 2} fill="#5b3d1c" opacity={0.55} />;
        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={radius}
            fill={cell === "b" ? "#1a1a1a" : "#f4f2ec"}
            stroke={cell === "b" ? "#000" : "#9a9a9a"}
            strokeWidth={0.4}
          />
        );
      })}
    </svg>
  );
}
