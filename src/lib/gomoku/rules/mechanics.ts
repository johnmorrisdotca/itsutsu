import {
  DIRECTIONS,
  GAME_STATUS,
  MOVE_KINDS,
  PLACEMENTS,
  STONES,
  VARIANT_SPECS,
  WIN_REASONS,
} from "../gomoku.constants";
import type { GameState, Move, Point, Stone } from "../gomoku.types";
import { indexOf, isOnBoard, isStone, otherStone } from "./board";
import { dropTarget } from "./drop";
import { rulesFor } from "./handicap";
import { findWinningLine, runThrough } from "./lines";
import { countStones, pieceDestinations, squareThrough } from "./pieces";
import { findAllWins, rotateQuadrant } from "./twist";

/**
 * The mechanics that some games add to placing a stone: where a dropped
 * stone lands, what a stone decides on arrival beyond a line, the quarter
 * turn that finishes a move in the twist games, and the slides of the games
 * with a handful of pieces. Each is consulted by `engine.ts` through the
 * variant's spec.
 */

/** A finished game. */
export function won(
  state: GameState,
  winner: Stone,
  winBy: GameState["winBy"],
  winningLine: Point[],
): GameState {
  return { ...state, status: GAME_STATUS.won, winner, winBy, winningLine };
}

/**
 * Where a stone played at `point` actually goes: the same point, or in a
 * drop game the bottom of its column. A click anywhere in a column is a play
 * in that column.
 */
export function resolvePlacement(state: GameState, point: Point): Point {
  if (VARIANT_SPECS[state.settings.variant].placement !== PLACEMENTS.drop) return point;
  return dropTarget(state.board, state.settings.size, point.col) ?? point;
}

/** Whether the colour to move has all its pieces down and must now slide one. */
export function inMovePhase(state: GameState): boolean {
  const { pieces } = VARIANT_SPECS[state.settings.variant];
  return pieces !== null && countStones(state.board, state.toPlay) >= pieces;
}

/**
 * What a stone arriving at `point` decides, if anything: a line, a square, a
 * fifth captured pair, or — in the trap game — a losing line. Null when the
 * game goes on. A win outranks a trap: four in a row is not also three.
 */
export function settleStone(state: GameState, point: Point): GameState | null {
  const { settings, board, captures } = state;
  const stone = board[indexOf(settings.size, point)];
  if (!isStone(stone)) return null;
  const spec = VARIANT_SPECS[settings.variant];

  const winningLine = findWinningLine(board, settings, point);
  if (winningLine.length > 0) return won(state, stone, WIN_REASONS.line, winningLine);

  if (spec.squareWins) {
    const square = squareThrough(board, settings.size, point, stone);
    if (square.length > 0) return won(state, stone, WIN_REASONS.square, square);
  }
  if (rulesFor(settings, stone).captures && captures[stone] >= settings.capturesToWin) {
    return won(state, stone, WIN_REASONS.captures, []);
  }
  if (spec.loseLength !== null) {
    for (const step of DIRECTIONS) {
      const run = runThrough(board, settings.size, point, step, stone);
      if (run.cells.length === spec.loseLength) {
        return won(state, otherStone(stone), WIN_REASONS.trap, run.cells);
      }
    }
  }
  return null;
}

/** Whether the colour to move owes a quarter turn before the move is complete. */
export function canTwist(state: GameState): boolean {
  return state.status === GAME_STATUS.playing && state.pendingTwist;
}

/**
 * Turns one quadrant to finish the move. The whole board is read afterwards,
 * because a turn can complete a line for either colour anywhere: one line
 * wins for its owner, a line for each is a draw, and a full board with no line
 * is a draw too.
 */
export function twistBoard(state: GameState, quadrant: number, clockwise: boolean): GameState {
  if (!canTwist(state)) return state;
  const { settings, toPlay } = state;
  const quadrantSize = VARIANT_SPECS[settings.variant].quadrantSize;
  if (quadrantSize === null) return state;
  const across = settings.size / quadrantSize;
  if (!Number.isInteger(quadrant) || quadrant < 0 || quadrant >= across * across) return state;

  const board = rotateQuadrant(state.board, settings.size, quadrantSize, quadrant, clockwise);
  const last = state.moves[state.moves.length - 1];
  const moves = [...state.moves.slice(0, -1), { ...last, twist: { quadrant, clockwise } }];
  const turned: GameState = { ...state, board, moves, pendingTwist: false };

  const wins = findAllWins(board, settings);
  if (wins.black.length > 0 && wins.white.length > 0) {
    return { ...turned, status: GAME_STATUS.draw };
  }
  if (wins.black.length > 0) return won(turned, STONES.black, WIN_REASONS.line, wins.black);
  if (wins.white.length > 0) return won(turned, STONES.white, WIN_REASONS.line, wins.white);
  if (!board.includes(null)) return { ...turned, status: GAME_STATUS.draw };

  return { ...turned, toPlay: otherStone(toPlay) };
}

/** Where a piece of the colour to move may step from `from`; empty if it may not move. */
export function pieceMoves(state: GameState, from: Point): Point[] {
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return [];
  if (!inMovePhase(state)) return [];
  if (!isOnBoard(state.settings.size, from) || state.board[indexOf(state.settings.size, from)] !== state.toPlay) return [];
  return pieceDestinations(state.board, state.settings.size, from);
}

/** Slides a piece one step. Illegal slides return the state unchanged. */
export function movePiece(state: GameState, from: Point, to: Point): GameState {
  const allowed = pieceMoves(state, from).some(
    (point) => point.row === to.row && point.col === to.col,
  );
  if (!allowed) return state;

  const { settings, toPlay } = state;
  const board = state.board.slice();
  board[indexOf(settings.size, from)] = null;
  board[indexOf(settings.size, to)] = toPlay;
  const move: Move = { ...to, stone: toPlay, kind: MOVE_KINDS.move, from };
  const moved: GameState = { ...state, board, moves: [...state.moves, move] };

  return settleStone(moved, to) ?? { ...moved, toPlay: otherStone(toPlay) };
}

