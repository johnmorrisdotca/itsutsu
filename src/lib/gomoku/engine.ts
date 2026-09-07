import {
  DEFAULT_SETTINGS,
  DIRECTIONS,
  FIRST_STONE,
  FIRST_PLAYERS,
  GAME_STATUS,
  MOVE_KINDS,
  RULE_VARIANTS,
  SEATS,
  STONES,
  VARIANT_ALLOWS_FIRST_PLAYER_CHOICE,
} from "./gomoku.constants";
import { emptyBoard } from "./obstacles";
import type {
  Cell,
  GameSettings,
  GameState,
  Move,
  Point,
  Seat,
  Stone,
} from "./gomoku.types";

/** Narrows a cell to a played stone, excluding empties and obstacles. */
export function isStone(cell: Cell): cell is Stone {
  return cell === STONES.black || cell === STONES.white;
}

/**
 * The colour that opens. `random` is decided by `roll`, a number in [0, 1),
 * which the caller supplies so this stays pure and testable. Variants that
 * constrain black — anything but freestyle — always open with black.
 */
export function resolveOpener(settings: GameSettings, roll = 0): Stone {
  if (!VARIANT_ALLOWS_FIRST_PLAYER_CHOICE[settings.variant]) return FIRST_STONE;
  if (settings.firstPlayer === FIRST_PLAYERS.random) {
    return roll < 0.5 ? STONES.black : STONES.white;
  }
  return settings.firstPlayer;
}

export function createGame(
  overrides: Partial<GameSettings> = {},
  roll = 0,
): GameState {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, ...overrides };
  const opener = resolveOpener(settings, roll);

  return {
    settings,
    board: emptyBoard(settings),
    moves: [],
    opener,
    // Seat one always takes the opening colour, whichever that turned out to be.
    seats: {
      [opener]: SEATS.one,
      [otherStone(opener)]: SEATS.two,
    } as Record<Stone, Seat>,
    swapsUsed: { one: 0, two: 0 },
    toPlay: opener,
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

/** The seat holding `stone` right now. Swaps move seats between colours. */
export function seatOf(state: GameState, stone: Stone): Seat {
  return state.seats[stone];
}

/** The seat whose turn it is. */
export function seatToPlay(state: GameState): Seat {
  return seatOf(state, state.toPlay);
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
  if (!isStone(stone)) return [];

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

/** Every intersection still open: no stone, no obstacle. */
export function emptyPoints(state: GameState): Point[] {
  const points: Point[] = [];
  state.board.forEach((cell, index) => {
    if (cell === null) points.push(pointOf(state.settings.size, index));
  });
  return points;
}

/**
 * Plays the stone to move at `point`. Illegal moves (occupied intersection,
 * obstacle, off the board, or game already over) return the state unchanged.
 */
export function playMove(
  state: GameState,
  point: Point,
  kind: Move["kind"] = MOVE_KINDS.place,
): GameState {
  if (!isLegalMove(state, point)) return state;

  const { settings, toPlay } = state;
  const board = state.board.slice();
  board[indexOf(settings.size, point)] = toPlay;
  const moves = [...state.moves, { ...point, stone: toPlay, kind }];

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

  if (!board.includes(null)) {
    return { ...state, board, moves, status: GAME_STATUS.draw };
  }

  return { ...state, board, moves, toPlay: otherStone(toPlay) };
}

export function canSkip(state: GameState): boolean {
  return (
    state.settings.allowSkip &&
    state.status === GAME_STATUS.playing &&
    skipTarget(state) !== null
  );
}

/**
 * Where a skipped turn puts its stone: the open intersection furthest from the
 * action, picked from the corner chosen by `roll`. A skip is still a stone on
 * the board — it just spends the turn somewhere that should not matter.
 */
export function skipTarget(state: GameState, roll = 0): Point | null {
  const open = emptyPoints(state);
  if (open.length === 0) return null;

  const last = state.settings.size - 1;
  const corners: Point[] = [
    { row: 0, col: 0 },
    { row: 0, col: last },
    { row: last, col: 0 },
    { row: last, col: last },
  ];
  const corner = corners[Math.min(corners.length - 1, Math.floor(roll * 4))];
  const distance = (point: Point) =>
    Math.max(Math.abs(point.row - corner.row), Math.abs(point.col - corner.col));

  return open.reduce((best, point) =>
    distance(point) < distance(best) ? point : best,
  );
}

/** Burns the turn on a corner stone. A no-op when skipping is not allowed. */
export function skipMove(state: GameState, roll = 0): GameState {
  if (!canSkip(state)) return state;
  const target = skipTarget(state, roll);
  if (target === null) return state;
  return playMove(state, target, MOVE_KINDS.skip);
}

/**
 * Whether the seat to play may trade seats right now. This covers the
 * mechanical limits only; `analysis.ts` adds the rule that you cannot swap
 * into a position the opponent has already won.
 */
export function canSwapSeats(state: GameState): boolean {
  return (
    state.settings.allowSwap &&
    state.status === GAME_STATUS.playing &&
    state.moves.length > 0 &&
    state.swapsUsed[seatToPlay(state)] < state.settings.swapsPerSeat
  );
}

/**
 * Trades seats: the player to move hands over their colour and takes the
 * opponent's stones instead. The board is untouched and the turn passes, so a
 * swap costs you the move you were about to make.
 */
export function swapSeats(state: GameState): GameState {
  if (!canSwapSeats(state)) return state;

  const mover = seatToPlay(state);
  return {
    ...state,
    seats: {
      black: state.seats[STONES.white],
      white: state.seats[STONES.black],
    },
    swapsUsed: { ...state.swapsUsed, [mover]: state.swapsUsed[mover] + 1 },
  };
}

/**
 * Ends the game against a player who has run out of time.
 *
 * A clock is not a rule of gomoku, so the engine does not run one — but the
 * result still has to be a proper game state rather than something the UI
 * paints over the top, or the record and the board would disagree.
 */
export function winOnTime(state: GameState, loser: Stone): GameState {
  if (state.status !== GAME_STATUS.playing) return state;

  return {
    ...state,
    status: GAME_STATUS.won,
    winner: otherStone(loser),
    winningLine: [],
  };
}

export function canUndo(state: GameState): boolean {
  return state.settings.allowUndo && state.moves.length > 0;
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
