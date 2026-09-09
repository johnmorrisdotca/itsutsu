import type { Cell, Point, Stone } from "../gomoku.types";
import { cellAtPoint, indexOf, isOnBoard, samePoint, stepFrom } from "./board";

/**
 * Chinese Checkers: a hexagram (Star of David) board, one point of it
 * filled with each side's pieces at the start, racing to be first to fill
 * the point directly opposite. A move is a step to a neighbouring empty
 * cell, or a jump over an adjacent piece of either colour into the empty
 * cell straight beyond it, with a chain of jumps in the same move — exactly
 * Halma's mechanic (see `camps.ts`), translated from a square board's eight
 * directions onto a hex lattice's six. Nothing is ever captured.
 *
 * The board is embedded in a square Point{row,col} grid the way Hex's
 * rhombus is: the six directions below are axial hex-grid steps, and
 * `inStar` marks which cells of the square actually belong to the
 * hexagram. Every other cell is sealed off with the same `BLOCKED` obstacle
 * the drop games scatter at random — here laid down once, by shape, when
 * the game is created.
 */

/**
 * How many rows deep each of the star's six points is. The board's centre
 * hexagon has the same radius, and the standard 121-hole set is radius 4:
 * a 61-cell hexagon plus six 10-cell points.
 */
export const STAR_RADIUS = 4;

/** The side of the square array a star of this radius is embedded in. */
export function starSize(radius: number = STAR_RADIUS): number {
  return 4 * radius + 1;
}

/** Where the hexagram's own centre sits in the embedding array. */
function centreOf(radius: number): number {
  return radius * 2;
}

/**
 * Cube coordinates for `point`, centred on the board's own middle: the same
 * axial system `rules/hex.ts` reads its six neighbours from, x+y+z=0.
 */
function cubeOf(radius: number, point: Point): { x: number; y: number; z: number } {
  const x = point.col - centreOf(radius);
  const z = point.row - centreOf(radius);
  return { x, y: -(x + z), z };
}

/**
 * Whether `point` is one of the hexagram's playable cells.
 *
 * A hexagram of radius N is provably the union of two triangles of side 3N,
 * centred on the same point and each the other rotated 180°: {min(x,y,z) >=
 * -N} is one triangle, {max(x,y,z) <= N} the other, and their overlap —
 * where both hold — is exactly the centre hexagon of radius N. For N=4 that
 * union comes to 121 cells, ten to a point, which is the board this game is
 * always sold with.
 */
export function inStar(radius: number, point: Point): boolean {
  const { x, y, z } = cubeOf(radius, point);
  return Math.min(x, y, z) >= -radius || Math.max(x, y, z) <= radius;
}

/** The six axial directions a hex lattice touches its neighbours along. */
const DIRECTIONS: readonly Point[] = [
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
];

/** Every cell of one of the star's six points: the ten cells `radius` rows out from the centre hexagon, in direction `side`. */
function pointCells(radius: number, side: "top" | "bottom"): Point[] {
  const mid = centreOf(radius);
  const rows =
    side === "top"
      ? Array.from({ length: radius }, (_, i) => -2 * radius + i)
      : Array.from({ length: radius }, (_, i) => radius + 1 + i);
  const points: Point[] = [];
  for (const dr of rows) {
    for (let dc = -2 * radius; dc <= 2 * radius; dc += 1) {
      const point = { row: mid + dr, col: mid + dc };
      if (inStar(radius, point)) points.push(point);
    }
  }
  return points;
}

/** Pieces a side has: the cells of one point, ten on the standard board. */
export function starCampSize(radius: number): number {
  return pointCells(radius, "top").length;
}

/**
 * The squares of a colour's home point: black starts at the top, white at
 * the bottom, the same "black starts near, white starts far" convention
 * `camps.ts` uses for Halma's corners.
 */
export function starCampSquares(radius: number, stone: Stone): Point[] {
  return pointCells(radius, stone === "black" ? "top" : "bottom");
}

/** Whose home point `point` lies in, or null outside both. */
export function starCampOf(radius: number, point: Point): Stone | null {
  if (pointCells(radius, "top").some((square) => samePoint(square, point))) return "black";
  if (pointCells(radius, "bottom").some((square) => samePoint(square, point))) return "white";
  return null;
}

/** Every piece on the board when the game starts: each colour filling its own point. */
export function starStartingPieces(radius: number): { point: Point; stone: Stone }[] {
  return [
    ...starCampSquares(radius, "black").map((point) => ({ point, stone: "black" as const })),
    ...starCampSquares(radius, "white").map((point) => ({ point, stone: "white" as const })),
  ];
}

/**
 * Where a piece at `from` may go: any empty neighbouring cell along the six
 * hex directions, or the end of any chain of jumps over an adjacent piece of
 * either colour into the empty cell straight beyond it. Identical to
 * `campMoves`, six directions in place of eight; the hexagram's own shape is
 * enforced by the `BLOCKED` cells outside it, never checked here directly.
 */
export function starMoves(board: Cell[], size: number, from: Point): Point[] {
  const empty = (point: Point) => isOnBoard(size, point) && cellAtPoint(board, size, point) === null;
  const steps = DIRECTIONS.map((step) => stepFrom(from, step, 1)).filter(empty);

  const seen = new Set<number>([indexOf(size, from)]);
  const landings: Point[] = [];
  const queue: Point[] = [from];
  while (queue.length > 0) {
    const at = queue.shift() as Point;
    for (const step of DIRECTIONS) {
      const over = stepFrom(at, step, 1);
      const beyond = stepFrom(at, step, 2);
      if (!isOnBoard(size, over) || cellAtPoint(board, size, over) === null) continue;
      if (!empty(beyond)) continue;
      const key = indexOf(size, beyond);
      if (seen.has(key)) continue;
      seen.add(key);
      landings.push(beyond);
      queue.push(beyond);
    }
  }

  const stepKeys = new Set(steps.map((point) => indexOf(size, point)));
  return [...steps, ...landings.filter((point) => !stepKeys.has(indexOf(size, point)))];
}

/**
 * Whether `stone` has won: the far point — the other colour's home — is
 * full, and at least one piece in it is theirs. The same rule as Halma's
 * `campFilled`, read against a star point instead of a square corner.
 */
export function starFilled(board: Cell[], size: number, radius: number, stone: Stone): boolean {
  const far = starCampSquares(radius, stone === "black" ? "white" : "black");
  if (far.length === 0) return false;
  let own = 0;
  for (const point of far) {
    const cell = cellAtPoint(board, size, point);
    if (cell === null) return false;
    if (cell === stone) own += 1;
  }
  return own > 0;
}

/** How many of `stone`'s pieces stand in the far point. */
export function starPiecesHome(board: Cell[], size: number, radius: number, stone: Stone): number {
  const far = starCampSquares(radius, stone === "black" ? "white" : "black");
  return far.filter((point) => cellAtPoint(board, size, point) === stone).length;
}
