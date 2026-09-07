import { DIRECTIONS } from "../gomoku.constants";
import type { Cell, GameSettings, Point, Stone } from "../gomoku.types";
import { cellAtPoint, indexOf, isStone, stepFrom } from "./board";
import { rulesFor } from "./handicap";

/** How many enemy stones a flank takes: always a pair, as the name 二抜き says. */
const PAIR = 2;

/**
 * The enemy stones a stone of `stone` landing on `point` would capture: every
 * pair of enemy stones in a straight line from it with another friendly stone
 * immediately beyond. Empty outside the capture variants.
 *
 * Only the closing stone captures. A pair that moves *into* a flanked position
 * is safe, which is what makes the game playable rather than a bloodbath.
 */
export function capturesFrom(
  board: Cell[],
  settings: GameSettings,
  stone: Stone,
  point: Point,
): Point[] {
  if (!rulesFor(settings, stone).captures) return [];

  const { size } = settings;
  const taken: Point[] = [];

  for (const step of DIRECTIONS) {
    for (const sign of [1, -1]) {
      const along = { row: step.row * sign, col: step.col * sign };
      const pair = [stepFrom(point, along, 1), stepFrom(point, along, 2)];
      const beyond = stepFrom(point, along, PAIR + 1);

      const flanked = pair.every((cell) => {
        const value = cellAtPoint(board, size, cell);
        return isStone(value ?? null) && value !== stone;
      });
      if (flanked && cellAtPoint(board, size, beyond) === stone) taken.push(...pair);
    }
  }
  return taken;
}

/** The board with `points` lifted off it. */
export function removeStones(board: Cell[], size: number, points: Point[]): Cell[] {
  if (points.length === 0) return board;
  const next = board.slice();
  for (const point of points) next[indexOf(size, point)] = null;
  return next;
}

/** Pairs captured, from the stones removed. */
export function pairsIn(points: Point[]): number {
  return points.length / PAIR;
}
