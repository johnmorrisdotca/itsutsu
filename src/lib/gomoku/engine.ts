import {
  DEFAULT_SETTINGS,
  DIRECTIONS,
  FIRST_STONE,
  GAME_STATUS,
  RULE_VARIANTS,
  STONES,
} from "./gomoku.constants";
import type {
  Cell,
  GameSettings,
  GameState,
  Point,
  Stone,
} from "./gomoku.types";

export function createGame(overrides: Partial<GameSettings> = {}): GameState {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, ...overrides };
  return {
    settings,
    board: new Array<Cell>(settings.size * settings.size).fill(null),
    moves: [],
    toPlay: FIRST_STONE,
    status: GAME_STATUS.playing,
    winner: null,
    winningLine: [],
  };
}

export function indexOf(size: number, point: Point): number {
  return point.row * size + point.col;
}

export function pointOf(size: number, index: number): Point {
  return { row: Math.floor(index / size), col: index % size };
}

export function isOnBoard(size: number, point: Point): boolean {
  return (
    point.row >= 0 && point.row < size && point.col >= 0 && point.col < size
  );
}

export function cellAt(state: GameState, point: Point): Cell {
  return state.board[indexOf(state.settings.size, point)];
}

export function otherStone(stone: Stone): Stone {
  return stone === STONES.black ? STONES.white : STONES.black;
}

export function isLegalMove(state: GameState, point: Point): boolean {
  return (
    state.status === GAME_STATUS.playing &&
    isOnBoard(state.settings.size, point) &&
    cellAt(state, point) === null
  );
}

/**
 * Walks from `origin` in `step` increments while the stones match, returning
 * the points visited (excluding `origin`).
 */
function runFrom(
  board: Cell[],
  size: number,
  origin: Point,
  step: Point,
  stone: Stone,
): Point[] {
  const run: Point[] = [];
  let next: Point = { row: origin.row + step.row, col: origin.col + step.col };
  while (isOnBoard(size, next) && board[indexOf(size, next)] === stone) {
    run.push(next);
    next = { row: next.row + step.row, col: next.col + step.col };
  }
  return run;
}

function lineWins(length: number, settings: GameSettings): boolean {
  if (settings.variant === RULE_VARIANTS.standard) {
    return length === settings.winLength;
  }
  return length >= settings.winLength;
}

/**
 * The winning line through `point`, if the stone there completes one. Only
 * lines through the given point are examined, which is all that can change
 * after a single move. Returns an empty array when there is no win.
 */
export function findWinningLine(
  board: Cell[],
  settings: GameSettings,
  point: Point,
): Point[] {
  const stone = board[indexOf(settings.size, point)];
  if (stone === null || stone === undefined) return [];

  for (const step of DIRECTIONS) {
    const back = runFrom(board, settings.size, point, negate(step), stone);
    const forward = runFrom(board, settings.size, point, step, stone);
    const length = back.length + 1 + forward.length;
    if (lineWins(length, settings)) {
      return [...back.reverse(), point, ...forward];
    }
  }
  return [];
}

function negate(step: Point): Point {
  return { row: -step.row, col: -step.col };
}

/**
 * Plays the stone to move at `point`. Illegal moves (occupied intersection,
 * off the board, or game already over) return the state unchanged.
 */
export function playMove(state: GameState, point: Point): GameState {
  if (!isLegalMove(state, point)) return state;

  const { settings, toPlay } = state;
  const board = state.board.slice();
  board[indexOf(settings.size, point)] = toPlay;
  const moves = [...state.moves, { ...point, stone: toPlay }];

  const winningLine = findWinningLine(board, settings, point);
  if (winningLine.length > 0) {
    return {
      ...state,
      board,
      moves,
      status: GAME_STATUS.won,
      winner: toPlay,
      winningLine,
    };
  }

  if (moves.length === board.length) {
    return { ...state, board, moves, status: GAME_STATUS.draw };
  }

  return { ...state, board, moves, toPlay: otherStone(toPlay) };
}

export function canUndo(state: GameState): boolean {
  return state.moves.length > 0;
}

/** Removes the last move. Also reopens a finished game. */
export function undoMove(state: GameState): GameState {
  if (!canUndo(state)) return state;

  const last = state.moves[state.moves.length - 1];
  const board = state.board.slice();
  board[indexOf(state.settings.size, last)] = null;

  return {
    ...state,
    board,
    moves: state.moves.slice(0, -1),
    toPlay: last.stone,
    status: GAME_STATUS.playing,
    winner: null,
    winningLine: [],
  };
}

export function lastMove(state: GameState): Point | null {
  return state.moves.length > 0 ? state.moves[state.moves.length - 1] : null;
}
