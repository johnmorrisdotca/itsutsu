import type { Cell, GameState, Point, Stone } from "../gomoku.types";
import { cellAtPoint, indexOf, isOnBoard, otherStone, samePoint, stepFrom } from "./board";

/**
 * Checkers: pieces stand on the board from the start and move diagonally,
 * one square at a time. Capturing is a jump over an adjacent enemy piece
 * into the empty square beyond, and it is forced — a colour with any capture
 * available may not play a plain step instead. A piece that captures and can
 * capture again from where it lands keeps going in the same move, but a man
 * that is crowned partway through always stops there; only a king may carry
 * a chain on past its own promotion, on a later move. A colour with no legal
 * move, whether it has no pieces left or every one is shut in, has lost.
 */

/** Checkers is played on one colour of square only: the board's own dark squares. */
export function isDarkSquare(point: Point): boolean {
  return (point.row + point.col) % 2 === 1;
}

/** The row a man of `stone` is crowned on reaching. */
function farRow(size: number, stone: Stone): number {
  return stone === "black" ? size - 1 : 0;
}

/** Every piece on the board when the game starts: three rows of dark squares, each side. */
export function checkersStartingPieces(size: number): { point: Point; stone: Stone }[] {
  const pieces: { point: Point; stone: Stone }[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const point = { row, col };
      if (!isDarkSquare(point)) continue;
      if (row < 3) pieces.push({ point, stone: "black" });
      else if (row >= size - 3) pieces.push({ point, stone: "white" });
    }
  }
  return pieces;
}

const DIAGONALS: readonly Point[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

/** The diagonals open to a piece: every way for a king, forward only for a man. */
function directionsFor(stone: Stone, isKing: boolean): readonly Point[] {
  if (isKing) return DIAGONALS;
  return DIAGONALS.filter((step) => (stone === "black" ? step.row === 1 : step.row === -1));
}

/** Whether the piece at `at`, if any, is a king. */
export function isKingAt(kings: readonly Point[], at: Point): boolean {
  return kings.some((point) => samePoint(point, at));
}

/** Where a piece at `from` may step with no capture: an empty diagonal neighbour. */
export function checkersSteps(
  board: Cell[],
  size: number,
  from: Point,
  stone: Stone,
  isKing: boolean,
): Point[] {
  return directionsFor(stone, isKing)
    .map((step) => stepFrom(from, step, 1))
    .filter((point) => isOnBoard(size, point) && cellAtPoint(board, size, point) === null);
}

/** The jumps a piece at `from` may make: the enemy piece taken, and where the jump lands. */
export function checkersCaptures(
  board: Cell[],
  kings: readonly Point[],
  size: number,
  from: Point,
  stone: Stone,
): { to: Point; captured: Point }[] {
  const isKing = isKingAt(kings, from);
  const enemy = otherStone(stone);
  const jumps: { to: Point; captured: Point }[] = [];
  for (const step of directionsFor(stone, isKing)) {
    const over = stepFrom(from, step, 1);
    const to = stepFrom(from, step, 2);
    if (!isOnBoard(size, to) || cellAtPoint(board, size, to) !== null) continue;
    if (cellAtPoint(board, size, over) !== enemy) continue;
    jumps.push({ to, captured: over });
  }
  return jumps;
}

/** Whether any of `stone`'s pieces on the board has a capture available right now. */
export function checkersHasCapture(
  board: Cell[],
  kings: readonly Point[],
  size: number,
  stone: Stone,
): boolean {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const point = { row, col };
      if (board[indexOf(size, point)] !== stone) continue;
      if (checkersCaptures(board, kings, size, point, stone).length > 0) return true;
    }
  }
  return false;
}

/** Whether `stone` has any legal move at all: a capture first, or failing that, a step. */
export function checkersHasAnyMove(
  board: Cell[],
  kings: readonly Point[],
  size: number,
  stone: Stone,
): boolean {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const point = { row, col };
      if (board[indexOf(size, point)] !== stone) continue;
      if (checkersCaptures(board, kings, size, point, stone).length > 0) return true;
      if (checkersSteps(board, size, point, stone, isKingAt(kings, point)).length > 0) return true;
    }
  }
  return false;
}

/**
 * Where a piece at `from` may go this move.
 *
 * A piece already mid-chain may only continue capturing, and only that piece
 * may move at all. Otherwise, if any of the colour's pieces can capture, only
 * a capture is offered, from whichever pieces have one — the forced-capture
 * rule. Failing both, a plain step.
 */
export function checkersMoves(state: GameState, from: Point): Point[] {
  const { board, kings, chainAt, toPlay } = state;
  const { size } = state.settings;
  if (board[indexOf(size, from)] !== toPlay) return [];
  if (chainAt !== null) {
    if (!samePoint(from, chainAt)) return [];
    return checkersCaptures(board, kings, size, from, toPlay).map((jump) => jump.to);
  }
  if (checkersHasCapture(board, kings, size, toPlay)) {
    return checkersCaptures(board, kings, size, from, toPlay).map((jump) => jump.to);
  }
  return checkersSteps(board, size, from, toPlay, isKingAt(kings, from));
}

/** What a step or a capture from `from` to `to` does to the board and the kings on it. */
export type CheckersMoveResult = {
  board: Cell[];
  kings: Point[];
  /** The enemy square taken, if this was a capture. */
  captured: Point | null;
  /** Whether the captured piece was itself a king, for undo. */
  capturedWasKing: boolean;
  /** Whether the moving piece was already a king before this move, for undo. */
  wasKing: boolean;
  /** Whether this move continued a chain already under way, for undo. */
  continuedChain: boolean;
  /** Whether the same piece must go on capturing before the turn can pass. */
  continues: boolean;
};

export function applyCheckersMove(state: GameState, from: Point, to: Point): CheckersMoveResult {
  const { board: prevBoard, kings: prevKings, toPlay, chainAt } = state;
  const { size } = state.settings;
  const wasKing = isKingAt(prevKings, from);
  const isCapture = Math.abs(from.row - to.row) === 2;

  const board = prevBoard.slice();
  board[indexOf(size, from)] = null;
  board[indexOf(size, to)] = toPlay;
  let captured: Point | null = null;
  let capturedWasKing = false;
  if (isCapture) {
    captured = { row: (from.row + to.row) / 2, col: (from.col + to.col) / 2 };
    capturedWasKing = isKingAt(prevKings, captured);
    board[indexOf(size, captured)] = null;
  }

  let kings = prevKings.filter(
    (point) => !samePoint(point, from) && (captured === null || !samePoint(point, captured)),
  );
  const crownedNow = !wasKing && to.row === farRow(size, toPlay);
  if (wasKing || crownedNow) kings = [...kings, to];

  // A man that is crowned on this very jump always stops: only a king may carry a chain on.
  const continues =
    isCapture && !crownedNow && checkersCaptures(board, kings, size, to, toPlay).length > 0;

  return {
    board,
    kings,
    captured,
    capturedWasKing,
    wasKing,
    continuedChain: chainAt !== null && samePoint(chainAt, from),
    continues,
  };
}
