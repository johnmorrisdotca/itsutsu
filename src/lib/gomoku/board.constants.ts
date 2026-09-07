import type { Point } from "./gomoku.types";

/** The geometry of the board: the directions a line runs, star points, and column letters. */

/**
 * The four line orientations through a point. Each is checked in both its
 * forward and reverse sense, so four entries cover all eight neighbours.
 */
export const DIRECTIONS: readonly Point[] = [
  { row: 0, col: 1 }, // horizontal
  { row: 1, col: 0 }, // vertical
  { row: 1, col: 1 }, // diagonal, top-left to bottom-right
  { row: 1, col: -1 }, // diagonal, top-right to bottom-left
];

/**
 * Hoshi (star point) positions drawn on the board, by board size: the four
 * corner points, plus tengen at the centre, and for 19×19 the side points too.
 */
export const STAR_POINTS: Record<number, readonly Point[]> = {
  9: starGrid([2, 4, 6], [2, 6]),
  13: starGrid([3, 6, 9], [3, 9]),
  15: starGrid([3, 7, 11], [3, 11]),
  19: starGrid([3, 9, 15], [3, 9, 15]),
};

/**
 * Builds a star layout from `corners` (the outer ring) plus the centre of
 * `all`. Passing every coordinate as a corner gives the full 3×3 go layout.
 */
function starGrid(all: number[], corners: number[]): Point[] {
  const centre = all[Math.floor(all.length / 2)];
  const points = corners.flatMap((row) => corners.map((col) => ({ row, col })));
  if (!points.some((p) => p.row === centre && p.col === centre)) {
    points.push({ row: centre, col: centre });
  }
  return points.sort((a, b) => a.row - b.row || a.col - b.col);
}

/** Column letters used in coordinate labels, left to right. "I" is skipped as in go. */
export const COLUMN_LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
