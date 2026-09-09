import { expect } from "vitest";
import { cellAt, otherStone, undoMove } from "./engine";
import { GAME_STATUS } from "./gomoku.constants";
import type { Cell, GameState, Point, Stone } from "./gomoku.types";

/**
 * The checkers family, restated by hand: forced capture, chained jumps,
 * crowning and the no-move win, worked out fresh here rather than read from
 * rules/checkers.ts, so a wrong table there cannot agree with itself.
 */

export function isCheckers(variant: string): boolean {
  return variant === "checkers";
}

const CHECKER_DIAGONALS: readonly Point[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

/** The diagonals open to a piece, worked out from scratch rather than read from the rule module. */
function checkerDirections(stone: Stone, king: boolean): Point[] {
  if (king) return [...CHECKER_DIAGONALS];
  return CHECKER_DIAGONALS.filter((step) => (stone === "black" ? step.row === 1 : step.row === -1));
}

function checkerCellAt(board: readonly Cell[], size: number, row: number, col: number): Cell | undefined {
  return row < 0 || col < 0 || row >= size || col >= size ? undefined : board[row * size + col];
}

function isKingByHand(kings: readonly Point[], at: Point): boolean {
  return kings.some((point) => point.row === at.row && point.col === at.col);
}

/** Every jump a piece at `from` could make, computed independently of rules/checkers.ts. */
function jumpsByHand(
  board: readonly Cell[],
  kings: readonly Point[],
  size: number,
  from: Point,
  stone: Stone,
): { to: Point; captured: Point }[] {
  const enemy = otherStone(stone);
  const king = isKingByHand(kings, from);
  const jumps: { to: Point; captured: Point }[] = [];
  for (const step of checkerDirections(stone, king)) {
    const captured = { row: from.row + step.row, col: from.col + step.col };
    const to = { row: from.row + step.row * 2, col: from.col + step.col * 2 };
    if (checkerCellAt(board, size, to.row, to.col) !== null) continue;
    if (checkerCellAt(board, size, captured.row, captured.col) !== enemy) continue;
    jumps.push({ to, captured });
  }
  return jumps;
}

function anyJumpByHand(board: readonly Cell[], kings: readonly Point[], size: number, stone: Stone): boolean {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row * size + col] !== stone) continue;
      if (jumpsByHand(board, kings, size, { row, col }, stone).length > 0) return true;
    }
  }
  return false;
}

function anyMoveByHand(board: readonly Cell[], kings: readonly Point[], size: number, stone: Stone): boolean {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row * size + col] !== stone) continue;
      const point = { row, col };
      if (jumpsByHand(board, kings, size, point, stone).length > 0) return true;
      for (const step of checkerDirections(stone, isKingByHand(kings, point))) {
        const to = { row: row + step.row, col: col + step.col };
        if (checkerCellAt(board, size, to.row, to.col) === null) return true;
      }
    }
  }
  return false;
}

function sortedPoints(points: readonly Point[]): Point[] {
  return [...points].sort((a, b) => a.row - b.row || a.col - b.col);
}

/**
 * What must hold after a checkers move: a step or a capture, the forced-
 * capture rule honoured, crowning on the far row, a chain that keeps the
 * turn exactly when another capture is waiting, and a no-move win that
 * really is one.
 */
export function checkCheckersMove(before: GameState, after: GameState, from: Point, to: Point, seed: number) {
  const where = `checkers seed ${seed}, move ${from.row},${from.col} to ${to.row},${to.col}`;
  const size = after.settings.size;
  const mover = before.toPlay;

  const distance = Math.max(Math.abs(from.row - to.row), Math.abs(from.col - to.col));
  expect([1, 2], `${where}: moved neither one square nor a jump`).toContain(distance);
  expect(cellAt(after, from), `${where}: piece still at its origin`).toBeNull();
  expect(cellAt(after, to), `${where}: piece did not arrive`).toBe(mover);

  const isCapture = distance === 2;
  const forced = anyJumpByHand(before.board, before.kings, size, mover);
  expect(isCapture || !forced, `${where}: a capture was available and this move was not one`).toBe(true);

  let captured: Point | null = null;
  if (isCapture) {
    captured = { row: (from.row + to.row) / 2, col: (from.col + to.col) / 2 };
    expect(cellAt(before, captured), `${where}: nothing to capture at the midpoint`).toBe(otherStone(mover));
    expect(cellAt(after, captured), `${where}: the captured piece is still on the board`).toBeNull();
  }
  const changed = after.board.filter((cell, index) => cell !== before.board[index]).length;
  expect(changed, `${where}: more cells changed than a step or a capture explains`).toBe(isCapture ? 3 : 2);
  const takenTally = after.captures[mover] - before.captures[mover];
  expect(takenTally, `${where}: captures tally does not match the piece lifted`).toBe(isCapture ? 1 : 0);

  const wasKing = isKingByHand(before.kings, from);
  const farRow = mover === "black" ? size - 1 : 0;
  const crownedNow = !wasKing && to.row === farRow;
  expect(isKingByHand(after.kings, to), `${where}: king status at the landing square is wrong`).toBe(
    wasKing || crownedNow,
  );
  expect(isKingByHand(after.kings, from), `${where}: a king was left behind at the square it moved from`).toBe(false);

  // A chain keeps the turn only on a capture that did not just crown the piece, and only when another is waiting.
  const wouldContinue =
    isCapture && !crownedNow && jumpsByHand(after.board, after.kings, size, to, mover).length > 0;
  if (wouldContinue) {
    expect(after.chainAt, `${where}: a waiting capture did not keep the turn`).toEqual(to);
    expect(after.toPlay, `${where}: the turn passed mid-chain`).toBe(mover);
    expect(after.status, `${where}: the game ended mid-chain`).toBe(GAME_STATUS.playing);
  } else {
    expect(after.chainAt, `${where}: the chain did not close`).toBeNull();
    if (after.status === GAME_STATUS.playing) {
      expect(after.toPlay, `${where}: the turn did not pass`).toBe(otherStone(mover));
    } else if (after.status === GAME_STATUS.won) {
      expect(after.winBy, `${where}: won by something other than being blocked`).toBe("blocked");
      expect(after.winner, `${where}: the wrong side won`).toBe(mover);
      expect(
        anyMoveByHand(after.board, after.kings, size, otherStone(mover)),
        `${where}: declared the other side blocked, but it has a move`,
      ).toBe(false);
    }
  }

  if (after.settings.allowUndo) {
    const undone = undoMove(after);
    expect(undone.board, `${where}: undo did not restore the board`).toEqual(before.board);
    expect(undone.toPlay, `${where}: undo did not restore the turn`).toBe(before.toPlay);
    // The kings are a set, not a sequence, so only the membership has to match.
    expect(sortedPoints(undone.kings), `${where}: undo did not restore the kings`).toEqual(
      sortedPoints(before.kings),
    );
    expect(undone.chainAt, `${where}: undo did not restore the chain`).toEqual(before.chainAt);
  }
}
