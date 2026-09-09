import type { Cell, GameSettings, Point, Stone } from "../gomoku.types";
import { cellAtPoint, indexOf, isOnBoard, stepFrom } from "./board";

/**
 * Draughts on the diagonals: stepping, jumping, forced capture, crowning.
 *
 * Halma proved a piece-moving game fits this engine — a fixed handful of
 * pieces, a move that goes from one square to another, and a win that is not
 * a line. Checkers is that plus the two things Halma has no answer for: a
 * jump takes the piece it crosses, and a piece that reaches the far side
 * becomes something with different powers.
 *
 * This module is the whole of those rules and knows nothing about GameState.
 * It is given a board, the size, and which squares hold kings, and answers
 * questions. Kings are held outside the board because a Cell is a colour and
 * nothing else — see `Kings` below.
 *
 * The rules are English draughts, the game sold as Checkers: men move and
 * jump forward only, a king moves and jumps one square in any diagonal
 * direction, capture is compulsory, and a jump that can be continued must be.
 * The flying kings of the international game are a different game and would
 * be a different variant.
 */

/**
 * Which squares hold kings, by board index.
 *
 * A Cell is `Stone | Blocked | Hot | Worm | null`, and adding two more colours
 * to it would put a king in front of every switch on the board — the line
 * reader, the flip games, the drop games — none of which have any business
 * knowing what a king is. So the crown is kept beside the board rather than
 * in it, as a set of the squares that carry one. It is derived state: replay
 * lays the same moves down and arrives at the same set.
 */
export type Kings = ReadonlySet<number>;

/** The four diagonals, as steps. */
const DIAGONALS: readonly Point[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

/**
 * The dark squares, which are the only ones the game is played on.
 *
 * Row 0 column 0 is light, so a square is dark when its coordinates differ in
 * parity. Half the board is never touched, which is why a checkers position
 * looks sparse next to a gomoku one holding the same number of stones.
 */
export function isPlayable(point: Point): boolean {
  return (point.row + point.col) % 2 === 1;
}

/** Which way a man of this colour moves: black down the board, white up it. */
function forward(stone: Stone): number {
  return stone === "black" ? 1 : -1;
}

/** The directions a piece may move: forward only for a man, all four for a king. */
function directionsFor(stone: Stone, king: boolean): readonly Point[] {
  if (king) return DIAGONALS;
  const ahead = forward(stone);
  return DIAGONALS.filter((step) => step.row === ahead);
}

/**
 * The row a colour is crowned on: the far edge from where it started. Black
 * starts at the top and is crowned on the last row; white the other way.
 */
export function crownRow(size: number, stone: Stone): number {
  return stone === "black" ? size - 1 : 0;
}

/** Whether landing here makes a king of a man of this colour. */
export function crowns(size: number, stone: Stone, at: Point): boolean {
  return at.row === crownRow(size, stone);
}

/**
 * Where each colour's pieces stand at the start: the dark squares of the
 * three rows nearest each player, which is twelve a side on the 8×8 board.
 */
export function startingPieces(settings: GameSettings): { point: Point; stone: Stone }[] {
  const { size } = settings;
  const rows = ROWS_OF_PIECES[size] ?? Math.max(1, Math.floor(size / 2) - 1);
  const pieces: { point: Point; stone: Stone }[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const point = { row, col };
      if (!isPlayable(point)) continue;
      if (row < rows) pieces.push({ point, stone: "black" });
      else if (row >= size - rows) pieces.push({ point, stone: "white" });
    }
  }
  return pieces;
}

/** How many rows of pieces each side starts with, by board size. */
const ROWS_OF_PIECES: Record<number, number> = { 8: 3, 10: 4 };

/** Every piece of this colour on the board. */
export function piecesOf(board: Cell[], size: number, stone: Stone): Point[] {
  const points: Point[] = [];
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] === stone) points.push({ row: Math.floor(index / size), col: index % size });
  }
  return points;
}

/** A step to an empty diagonal neighbour. Never legal while a capture is on offer. */
function stepsFrom(board: Cell[], size: number, kings: Kings, from: Point, stone: Stone): Point[] {
  const king = kings.has(indexOf(size, from));
  return directionsFor(stone, king)
    .map((step) => stepFrom(from, step, 1))
    .filter((to) => isOnBoard(size, to) && cellAtPoint(board, size, to) === null);
}

/** One jump: over an enemy piece, into the empty square straight beyond it. */
export type Jump = {
  /** Where the jumping piece lands. */
  to: Point;
  /** The square of the piece it takes. */
  over: Point;
};

/** The single jumps a piece at `from` can make right now. */
export function jumpsFrom(board: Cell[], size: number, kings: Kings, from: Point, stone: Stone): Jump[] {
  const king = kings.has(indexOf(size, from));
  const jumps: Jump[] = [];
  for (const step of directionsFor(stone, king)) {
    const over = stepFrom(from, step, 1);
    const to = stepFrom(from, step, 2);
    if (!isOnBoard(size, to)) continue;
    const crossed = cellAtPoint(board, size, over);
    // Only an enemy piece may be jumped, and only into an empty square.
    if (crossed !== otherColour(stone)) continue;
    if (cellAtPoint(board, size, to) !== null) continue;
    jumps.push({ to, over });
  }
  return jumps;
}

function otherColour(stone: Stone): Stone {
  return stone === "black" ? "white" : "black";
}

/**
 * A whole capturing turn: the squares landed on, in order, and the pieces
 * taken.
 *
 * A jump that can be continued must be, so a capturing move is the whole
 * chain rather than its first leg. The chain is searched with the board as it
 * would stand mid-move — each taken piece is lifted before the next jump is
 * looked for, because a piece already jumped cannot be jumped again.
 *
 * Crowning ends the turn. A man that reaches the far row becomes a king and
 * stops there even if the king it has just become could jump again, which is
 * the rule in the English game and the one place the two families disagree
 * most often.
 */
export type Capture = {
  /** Each square landed on, in order; the last is where the piece ends. */
  landings: Point[];
  /** Every piece taken, in the order they were taken. */
  taken: Point[];
  /** Whether the piece is a king at the end of the move. */
  crowned: boolean;
};

export function capturesFrom(
  board: Cell[],
  size: number,
  kings: Kings,
  from: Point,
  stone: Stone,
): Capture[] {
  const king = kings.has(indexOf(size, from));
  const chains: Capture[] = [];

  const walk = (at: Point, asKing: boolean, taken: Point[], landings: Point[], lifted: Cell[]) => {
    const next = jumpsFrom(lifted, size, asKing ? withKingAt(size, kings, at) : withoutKingAt(size, kings, at), at, stone);
    const promoted = !asKing && crowns(size, stone, at);
    // A man crowned by the jump stops; a king goes on while it can.
    if (next.length === 0 || (promoted && landings.length > 0)) {
      if (landings.length > 0) chains.push({ landings, taken, crowned: asKing || promoted });
      return;
    }
    for (const jump of next) {
      const after = lifted.slice();
      after[indexOf(size, jump.over)] = null;
      after[indexOf(size, at)] = null;
      after[indexOf(size, jump.to)] = stone;
      walk(jump.to, asKing, [...taken, jump.over], [...landings, jump.to], after);
    }
  };

  walk(from, king, [], [], board.slice());
  return chains;
}

/** A king set with `at` added, for a piece that has just been crowned mid-move. */
function withKingAt(size: number, kings: Kings, at: Point): Kings {
  const next = new Set(kings);
  next.add(indexOf(size, at));
  return next;
}

/** A king set with `at` treated as a man, for a piece that has moved off its old square. */
function withoutKingAt(size: number, kings: Kings, at: Point): Kings {
  const next = new Set(kings);
  next.delete(indexOf(size, at));
  return next;
}

/**
 * Every move a colour may make, with capture compulsory.
 *
 * If any piece can take, only taking moves are offered — that is the rule
 * that makes checkers a game of forcing rather than of shuffling, and it is
 * why it is answered here for the whole colour rather than per piece. A
 * colour with no move at all has lost, which the caller decides.
 */
export type CheckersMove = {
  from: Point;
  /** Where the piece ends. */
  to: Point;
  /** The squares landed on along the way; one entry for a simple step. */
  landings: Point[];
  /** Pieces taken, empty for a step. */
  taken: Point[];
  crowned: boolean;
};

export function movesFor(board: Cell[], size: number, kings: Kings, stone: Stone): CheckersMove[] {
  const mine = piecesOf(board, size, stone);

  const captures: CheckersMove[] = [];
  for (const from of mine) {
    for (const chain of capturesFrom(board, size, kings, from, stone)) {
      const to = chain.landings[chain.landings.length - 1];
      captures.push({ from, to, landings: chain.landings, taken: chain.taken, crowned: chain.crowned });
    }
  }
  if (captures.length > 0) return captures;

  const steps: CheckersMove[] = [];
  for (const from of mine) {
    for (const to of stepsFrom(board, size, kings, from, stone)) {
      steps.push({
        from,
        to,
        landings: [to],
        taken: [],
        crowned: kings.has(indexOf(size, from)) || crowns(size, stone, to),
      });
    }
  }
  return steps;
}

/** Whether this colour has anything to play. A colour that has not, has lost. */
export function hasMove(board: Cell[], size: number, kings: Kings, stone: Stone): boolean {
  return movesFor(board, size, kings, stone).length > 0;
}
