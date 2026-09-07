import {
  DEFAULT_SETTINGS,
  FIRST_STONE,
  FIRST_PLAYERS,
  GAME_STATUS,
  MOVE_KINDS,
  OPENING_RULES,
  OPENING_STAGES,
  SEATS,
  STONES,
  VARIANT_SPECS,
  WIN_REASONS,
} from "./gomoku.constants";
import { emptyBoard } from "./obstacles";
import {
  indexOf,
  isOnBoard,
  otherStone,
  pointOf,
} from "./rules/board";
import { capturesFrom, pairsIn, removeStones } from "./rules/captures";
import { forbiddenAt } from "./rules/forbidden";
import { hasHandicap, rulesFor } from "./rules/handicap";
import { findWinningLine } from "./rules/lines";
import {
  applyOpeningChoice,
  initialOpening,
  openingAfterMove,
  openingAllows,
} from "./rules/opening";
import { stonesLeftInTurn } from "./rules/turns";
import type {
  Cell,
  ForbiddenPattern,
  GameSettings,
  GameState,
  Move,
  OpeningChoice,
  OpeningRule,
  Point,
  Seat,
  Stone,
} from "./gomoku.types";

/*
 * The rules of the game. Every function here takes a `GameState` and returns
 * a new one; the variant-specific reading — winning lines, forbidden shapes,
 * captures, turn length, openings — lives in `rules/` and is consulted through
 * the variant's spec, never by switching on its name.
 */

export { indexOf, isOnBoard, isStone, otherStone, pointOf } from "./rules/board";
export { findWinningLine } from "./rules/lines";
export { hasHandicap, rulesFor } from "./rules/handicap";
export { forbiddenAt, forbiddenPoints } from "./rules/forbidden";
export {
  canChooseColour,
  canExtendOpening,
  chooseColour,
  extendOpening,
} from "./rules/opening";

/** Openings that move colours between seats, which a colour-bound handicap cannot survive. */
const SWAPPING_OPENINGS: readonly GameSettings["opening"][] = [
  OPENING_RULES.swap,
  OPENING_RULES.swap2,
  OPENING_RULES.rif,
];

/**
 * The openings these settings may use: what the variant offers, less the
 * colour-swapping ones when a handicap is bound to a colour.
 */
export function availableOpenings(settings: GameSettings): OpeningRule[] {
  const offered = VARIANT_SPECS[settings.variant].openings;
  return hasHandicap(settings)
    ? offered.filter((opening) => !SWAPPING_OPENINGS.includes(opening))
    : [...offered];
}

/**
 * Settings that agree with their variant: a pinned line length wins over the
 * player's choice, an opening the variant does not offer falls back to free,
 * and a handicap rules out the openings that swap colours. Applied on creation
 * so a state can never carry a contradiction.
 */
export function normaliseSettings(settings: GameSettings): GameSettings {
  const spec = VARIANT_SPECS[settings.variant];
  return {
    ...settings,
    winLength: spec.winLength ?? settings.winLength,
    opening: availableOpenings(settings).includes(settings.opening)
      ? settings.opening
      : OPENING_RULES.free,
  };
}

/**
 * The colour that opens. `random` is decided by `roll`, a number in [0, 1),
 * which the caller supplies so this stays pure and testable. Variants that
 * constrain black, and every opening protocol, put black on move one.
 */
export function resolveOpener(settings: GameSettings, roll = 0): Stone {
  if (!VARIANT_SPECS[settings.variant].allowFirstPlayerChoice) return FIRST_STONE;
  if (settings.opening !== OPENING_RULES.free) return FIRST_STONE;
  if (settings.firstPlayer === FIRST_PLAYERS.random) {
    return roll < 0.5 ? STONES.black : STONES.white;
  }
  return settings.firstPlayer;
}

export function createGame(
  overrides: Partial<GameSettings> = {},
  roll = 0,
): GameState {
  const settings = normaliseSettings({ ...DEFAULT_SETTINGS, ...overrides });
  const opener = resolveOpener(settings, roll);
  // Seat one always takes the opening colour, whichever that turned out to be.
  const seats = {
    [opener]: SEATS.one,
    [otherStone(opener)]: SEATS.two,
  } as Record<Stone, Seat>;

  return {
    settings,
    board: emptyBoard(settings),
    moves: [],
    opener,
    seats,
    swapsUsed: { one: 0, two: 0 },
    captures: { black: 0, white: 0 },
    opening: initialOpening(settings, opener, seats),
    toPlay: opener,
    status: GAME_STATUS.playing,
    winner: null,
    winBy: null,
    winningLine: [],
  };
}

export function cellAt(state: GameState, point: Point): Cell {
  return state.board[indexOf(state.settings.size, point)];
}

/** The seat holding `stone` right now. Swaps move seats between colours. */
export function seatOf(state: GameState, stone: Stone): Seat {
  return state.seats[stone];
}

/**
 * The seat whose turn it is. During a swap opening one seat lays every stone
 * and then the other decides, whatever colour those stones are.
 */
export function seatToPlay(state: GameState): Seat {
  return state.opening.actor ?? seatOf(state, state.toPlay);
}

/**
 * Whether the colour to move may play `point`: on the board, empty, allowed by
 * the opening, and not a shape the variant forbids that colour.
 */
export function isLegalMove(state: GameState, point: Point): boolean {
  return (
    state.status === GAME_STATUS.playing &&
    isOnBoard(state.settings.size, point) &&
    cellAt(state, point) === null &&
    openingAllows(state, point) &&
    forbiddenAt(state.board, state.settings, state.toPlay, point) === null
  );
}

/** Why the colour to move may not play `point`, when a forbidden shape is why. */
export function forbiddenReason(state: GameState, point: Point): ForbiddenPattern | null {
  return forbiddenAt(state.board, state.settings, state.toPlay, point);
}

/** Every intersection the colour to move may play right now. */
export function legalPoints(state: GameState): Point[] {
  return emptyPoints(state).filter((point) => isLegalMove(state, point));
}

/** Every intersection still open: no stone, no obstacle. */
export function emptyPoints(state: GameState): Point[] {
  const points: Point[] = [];
  state.board.forEach((cell, index) => {
    if (cell === null) points.push(pointOf(state.settings.size, index));
  });
  return points;
}

/** Stones the colour to move still has to place before the turn passes. */
export function stonesLeft(state: GameState): number {
  return stonesLeftInTurn(state.settings, state.moves, state.toPlay);
}

/**
 * Plays the stone to move at `point`. Illegal moves (occupied intersection,
 * obstacle, off the board, forbidden shape, outside the opening, or game
 * already over) return the state unchanged.
 */
export function playMove(
  state: GameState,
  point: Point,
  kind: Move["kind"] = MOVE_KINDS.place,
): GameState {
  if (!isLegalMove(state, point)) return state;

  const { settings, toPlay } = state;
  const captured = capturesFrom(state.board, settings, toPlay, point);
  let board = state.board.slice();
  board[indexOf(settings.size, point)] = toPlay;
  board = removeStones(board, settings.size, captured);

  const move: Move = { ...point, stone: toPlay, kind };
  if (captured.length > 0) move.captured = captured;
  const moves = [...state.moves, move];
  const captures = {
    ...state.captures,
    [toPlay]: state.captures[toPlay] + pairsIn(captured),
  };
  const placed: GameState = { ...state, board, moves, captures };

  const winningLine = findWinningLine(board, settings, point);
  if (winningLine.length > 0) {
    return won(placed, toPlay, WIN_REASONS.line, winningLine);
  }
  if (rulesFor(settings, toPlay).captures && captures[toPlay] >= settings.capturesToWin) {
    return won(placed, toPlay, WIN_REASONS.captures, []);
  }
  if (!board.includes(null)) {
    return { ...placed, status: GAME_STATUS.draw };
  }

  const stays = stonesLeftInTurn(settings, moves, toPlay) > 0;
  return {
    ...placed,
    toPlay: stays ? toPlay : otherStone(toPlay),
    opening: openingAfterMove(placed),
  };
}

function won(
  state: GameState,
  winner: Stone,
  winBy: GameState["winBy"],
  winningLine: Point[],
): GameState {
  return { ...state, status: GAME_STATUS.won, winner, winBy, winningLine };
}

export function canSkip(state: GameState): boolean {
  if (!state.settings.allowSkip || state.status !== GAME_STATUS.playing) return false;
  const target = skipTarget(state);
  return target !== null && isLegalMove(state, target);
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
 * into a position the opponent has already won. Not while an opening protocol
 * is still settling who holds which colour, and never under a handicap, which
 * belongs to a colour and would otherwise change hands with it.
 */
export function canSwapSeats(state: GameState): boolean {
  return (
    state.settings.allowSwap &&
    !hasHandicap(state.settings) &&
    state.status === GAME_STATUS.playing &&
    state.opening.stage === OPENING_STAGES.done &&
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
  return won(state, otherStone(loser), WIN_REASONS.time, []);
}

export function canUndo(state: GameState): boolean {
  return state.settings.allowUndo && state.moves.length > 0;
}

/**
 * Removes the last move, putting back anything it captured. Also reopens a
 * finished game. The opening is left as it stands: a colour choice is a
 * decision, not a stone, and is not undone by lifting one.
 */
export function undoMove(state: GameState): GameState {
  if (!canUndo(state)) return state;

  const last = state.moves[state.moves.length - 1];
  const { size } = state.settings;
  const board = state.board.slice();
  board[indexOf(size, last)] = null;
  for (const point of last.captured ?? []) {
    board[indexOf(size, point)] = otherStone(last.stone);
  }

  return {
    ...state,
    board,
    moves: state.moves.slice(0, -1),
    captures: {
      ...state.captures,
      [last.stone]: state.captures[last.stone] - pairsIn(last.captured ?? []),
    },
    toPlay: last.stone,
    status: GAME_STATUS.playing,
    winner: null,
    winBy: null,
    winningLine: [],
  };
}

export function lastMove(state: GameState): Point | null {
  return state.moves.length > 0 ? state.moves[state.moves.length - 1] : null;
}

/**
 * Replays a record through the engine: every position it passed through,
 * including the ones a swap-opening decision produced. When the record runs
 * out of decisions while a choice is pending, the chooser is assumed to have
 * kept their colour, which is all a store without seat data can say.
 *
 * Stops at the first move that will not replay, since the record no longer
 * fits the rules from there.
 */
export function replayMoves(
  start: GameState,
  moves: readonly Point[],
  choices: readonly OpeningChoice[] = [],
): GameState[] {
  const timeline = [start];
  let pending = 0;

  for (const move of moves) {
    let current = timeline[timeline.length - 1];
    if (current.opening.stage === OPENING_STAGES.choosing) {
      const choice = choices[pending] ?? current.toPlay;
      pending += 1;
      current = applyOpeningChoice(current, choice);
      if (current.opening.stage === OPENING_STAGES.choosing) break;
      timeline.push(current);
    }
    const next = playMove(current, { row: move.row, col: move.col });
    if (next === current) break;
    timeline.push(next);
  }
  return timeline;
}
