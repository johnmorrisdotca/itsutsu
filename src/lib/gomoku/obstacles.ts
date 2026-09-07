import {
  BLOCKED,
  OBSTACLE_LAYOUTS,
  STAR_POINTS,
} from "./gomoku.constants";
import type { Cell, GameSettings, Point } from "./gomoku.types";

/** The centre intersection — tengen (天元) — which never carries an obstacle. */
export function tengen(size: number): Point {
  const middle = Math.floor(size / 2);
  return { row: middle, col: middle };
}

/**
 * The intersections sealed off by the settings' obstacle layout. `hoshi` takes
 * the star points out of play but leaves tengen open, so the centre of the
 * board is still contestable.
 */
export function obstaclePoints(settings: GameSettings): Point[] {
  if (settings.obstacles !== OBSTACLE_LAYOUTS.hoshi) return [];

  const centre = tengen(settings.size);
  return (STAR_POINTS[settings.size] ?? []).filter(
    (point) => point.row !== centre.row || point.col !== centre.col,
  );
}

/** A board with the layout's obstacles already in place and nothing else on it. */
export function emptyBoard(settings: GameSettings): Cell[] {
  const board = new Array<Cell>(settings.size * settings.size).fill(null);
  for (const point of obstaclePoints(settings)) {
    board[point.row * settings.size + point.col] = BLOCKED;
  }
  return board;
}
