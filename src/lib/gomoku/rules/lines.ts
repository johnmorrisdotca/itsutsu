import { BLOCKED, DIRECTIONS, LINE_RULES } from "../gomoku.constants";
import type {
  Cell,
  GameSettings,
  LineRule,
  Point,
  Stone,
} from "../gomoku.types";
import {
  cellAtPoint,
  indexOf,
  isOnBoard,
  isStone,
  negate,
  stepFrom,
} from "./board";
import { rulesFor } from "./handicap";

/** The line rule that applies to `stone` under these settings. */
export function lineRuleFor(settings: GameSettings, stone: Stone): LineRule {
  return rulesFor(settings, stone).lineRule;
}

/** A contiguous run of one colour along a line, with the cells just past it. */
export type Run = {
  cells: Point[];
  /** The cell before the first stone and after the last; undefined off the board. */
  ends: [Cell | undefined, Cell | undefined];
};

/**
 * Walks from `origin` in `step` increments while the stones match, returning
 * the points visited (excluding `origin`).
 */
export function runFrom(
  board: Cell[],
  size: number,
  origin: Point,
  step: Point,
  stone: Stone,
): Point[] {
  const run: Point[] = [];
  let next = stepFrom(origin, step, 1);
  while (isOnBoard(size, next) && board[indexOf(size, next)] === stone) {
    run.push(next);
    next = stepFrom(next, step, 1);
  }
  return run;
}

/** The whole run of `stone` through `point` along `step`, in line order. */
export function runThrough(
  board: Cell[],
  size: number,
  point: Point,
  step: Point,
  stone: Stone,
): Run {
  const back = runFrom(board, size, point, negate(step), stone);
  const forward = runFrom(board, size, point, step, stone);
  const cells = [...back.reverse(), point, ...forward];
  return {
    cells,
    ends: [
      cellAtPoint(board, size, stepFrom(cells[0], step, -1)),
      cellAtPoint(board, size, stepFrom(cells[cells.length - 1], step, 1)),
    ],
  };
}

/**
 * Whether a run wins under `rule`. `ends` are the two cells just beyond the
 * run, which only the caro rule looks at: a five with an enemy stone (or an
 * obstacle) at both ends is shut in and does not count.
 */
export function runWins(
  rule: LineRule,
  run: Run,
  winLength: number,
  stone: Stone,
): boolean {
  const length = run.cells.length;
  switch (rule) {
    case LINE_RULES.atLeast:
      return length >= winLength;
    case LINE_RULES.exact:
      return length === winLength;
    case LINE_RULES.exactOpen:
      return (
        length === winLength &&
        !(blocks(run.ends[0], stone) && blocks(run.ends[1], stone))
      );
  }
}

/** A cell that shuts a line in: an enemy stone or an obstacle, never the edge. */
function blocks(cell: Cell | undefined, stone: Stone): boolean {
  if (cell === undefined || cell === null) return false;
  return cell === BLOCKED || cell !== stone;
}

/**
 * The winning line through `point`, if the stone there completes one under
 * the rule that applies to its colour. Only lines through the given point are
 * examined, which is all that can change after a single move. Returns an
 * empty array when there is no win.
 */
export function findWinningLine(
  board: Cell[],
  settings: GameSettings,
  point: Point,
): Point[] {
  const stone = board[indexOf(settings.size, point)];
  if (!isStone(stone)) return [];
  const { lineRule, winLength } = rulesFor(settings, stone);

  for (const step of DIRECTIONS) {
    const run = runThrough(board, settings.size, point, step, stone);
    if (runWins(lineRule, run, winLength, stone)) return run.cells;
  }
  return [];
}
