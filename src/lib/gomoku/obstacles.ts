import {
  BLOCKED,
  HOT,
  OBSTACLE_LAYOUTS,
  STAR_POINTS,
  VARIANT_SPECS,
} from "./gomoku.constants";
import type { Cell, GameSettings, Point } from "./gomoku.types";
import { drawDistinct, seededRandom } from "./rules/random";

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

/**
 * The squares a variant scatters at random when the game starts, drawn from
 * the game's seed so a replay lands them in the same places. Dead squares
 * come first, then hotspots, all distinct, and never on the bottom row of a
 * drop game, where they would only ever be a wall.
 */
export function randomSquares(settings: GameSettings): { dead: Point[]; hot: Point[] } {
  const spec = VARIANT_SPECS[settings.variant];
  const total = spec.deadSquares + spec.hotSquares;
  if (total === 0) return { dead: [], hot: [] };

  const { size } = settings;
  const candidates = size * (size - 1);
  const random = seededRandom(settings.seed);
  const points = drawDistinct(random, total, candidates).map((index) => ({
    row: Math.floor(index / size),
    col: index % size,
  }));
  return { dead: points.slice(0, spec.deadSquares), hot: points.slice(spec.deadSquares) };
}

/** A board with the layout's obstacles already in place and nothing else on it. */
export function emptyBoard(settings: GameSettings): Cell[] {
  const board = new Array<Cell>(settings.size * settings.size).fill(null);
  for (const point of obstaclePoints(settings)) {
    board[point.row * settings.size + point.col] = BLOCKED;
  }
  const { dead, hot } = randomSquares(settings);
  for (const point of dead) board[point.row * settings.size + point.col] = BLOCKED;
  for (const point of hot) board[point.row * settings.size + point.col] = HOT;
  return board;
}
