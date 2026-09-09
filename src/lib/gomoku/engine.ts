import { createGame } from "./rules/creation";
import { settleDrawLimit } from "./rules/drawLimit";
export { canBeDrawn, drawnByLength, movesBeforeDraw } from "./rules/drawLimit";
import { flipLegal, playFlip, undoFlip } from "./rules/flips";
import {
  GAME_STATUS,
  MOVE_KINDS,
  NO_POINT,
  OPENING_STAGES,
  PLACEMENTS,
  STONES,
  VARIANT_SPECS,
  WIN_REASONS,
} from "./gomoku.constants";
import { indexOf, isOnBoard, otherStone, pointOf, samePoint } from "./rules/board";
import { capturesFrom, removeStones, stonesIn } from "./rules/captures";
import { forbiddenAt } from "./rules/forbidden";
import { areaWinner, goLegal, playGoMove } from "./rules/go";
import { applyOpeningChoice, openingAfterMove, openingAllows } from "./rules/opening";
import {
  blockedByGiveaway,
  clearBottomRow,
  inMovePhase,
  movePiece,
  resolvePlacement,
  restoreBottomRow,
  restsOnSomething,
  settleStone,
  twistBoard,
  won,
} from "./rules/mechanics";
import {
  footprintFits,
  isPieceInHand,
  piecePlacements,
  singlesUsedBy,
} from "./rules/queue";
import { winningLineFor } from "./rules/lines";
import { stonesLeftInTurn } from "./rules/turns";
import { rotateQuadrant } from "./rules/twist";
import type {
  Cell,
  ForbiddenPattern,
  GameState,
  Move,
  MoveInput,
  OpeningChoice,
  PieceCell,
  Point,
  Stone,
} from "./gomoku.types";

/*
 * The rules of the game. Every function here takes a `GameState` and returns
 * a new one; the variant-specific reading — winning lines, forbidden shapes,
 * captures, turn length, openings — lives in `rules/` and is consulted through
 * the variant's spec, never by switching on its name.
 */

export { indexOf, isOnBoard, isStone, otherStone, pointOf } from "./rules/board";
export {
  availableOpenings,
  createGame,
  normaliseSettings,
  resolveOpener,
} from "./rules/creation";
export {
  canSwapSeats,
  forfeitTurn,
  resign,
  seatOf,
  seatToPlay,
  swapSeats,
  winOnTime,
} from "./rules/seats";
export { findWinningLine } from "./rules/lines";
export { hasHandicap, rulesFor } from "./rules/handicap";
export { forbiddenAt, forbiddenPoints } from "./rules/forbidden";
export { centreSquares, discCount, flipsAt, hasFlipMove, inLayingPhase } from "./rules/flips";
export { campOf, campSize, campSquares, piecesHome } from "./rules/camps";
export { checkersHasCapture, isDarkSquare, isKingAt } from "./rules/checkers";
export { STAR_RADIUS, starCampOf, starCampSize, starPiecesHome, starSize } from "./rules/chineseCheckers";
export { groupAt, KOMI, scoreArea } from "./rules/go";
export {
  canGrowBoard,
  canShrinkBoard,
  growBoard,
  nextBoardSize,
  previousBoardSize,
  shrinkBoard,
} from "./rules/growth";
export { dropTarget, landingPoints } from "./rules/drop";
export { quadrantCount, quadrantOrigin } from "./rules/twist";
export {
  canTwist,
  inMovePhase,
  movePiece,
  pieceMoves,
  resolvePlacement,
  twistBoard,
} from "./rules/mechanics";
export {
  footprintAt,
  footprintFits,
  orientCells,
  orientations,
  piecePlacements,
  queuedPiece,
  upcomingPieces,
} from "./rules/queue";
export {
  canChooseColour,
  canExtendOpening,
  chooseColour,
  extendOpening,
} from "./rules/opening";

export function cellAt(state: GameState, point: Point): Cell {
  return state.board[indexOf(state.settings.size, point)];
}

/**
 * Whether the colour to move may play `point`: on the board, empty, allowed by
 * the opening, not a shape the variant forbids that colour, the landing cell
 * of its column in a drop game, and not while a twist or a slide is owed.
 */
export function isLegalMove(state: GameState, point: Point): boolean {
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return false;
  if (!isOnBoard(state.settings.size, point) || cellAt(state, point) !== null) return false;
  // The flipping games: legal means "turns something", and nothing else applies.
  if (VARIANT_SPECS[state.settings.variant].flips) return flipLegal(state, point);
  // Go: legal means not suicide and not the ko point; no opening, no forbidden shape.
  if (VARIANT_SPECS[state.settings.variant].go) return goLegal(state.board, state.settings.size, point, state.toPlay, state.koPoint);
  if (inMovePhase(state)) return false;
  // In a piece game a lone stone is a single, and there are only so many.
  if (VARIANT_SPECS[state.settings.variant].queue !== null && singlesLeft(state) <= 0) return false;
  const landing = resolvePlacement(state, point);
  if (landing.row !== point.row || landing.col !== point.col) return false;
  const spec = VARIANT_SPECS[state.settings.variant];
  if (spec.placement === PLACEMENTS.edge && !restsOnSomething(state, point)) return false;
  if (spec.misere && spec.placement === PLACEMENTS.drop && blockedByGiveaway(state, point)) return false;
  return (
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

/** Single stones the colour to move may still lay instead of a piece. */
export function singlesLeft(state: GameState): number {
  const { singles } = VARIANT_SPECS[state.settings.variant];
  return Math.max(0, singles - singlesUsedBy(state.moves, state.toPlay));
}

/**
 * Lays the piece in hand on `cells`. The cells must be that piece in some
 * orientation, on empty points. A piece carries both colours, so it can
 * finish a line for either side: one line wins for its owner, whoever laid
 * it; a line for each is a draw.
 */
export function placePiece(state: GameState, cells: readonly PieceCell[]): GameState {
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return state;
  if (!isPieceInHand(state, cells)) return state;
  const { settings, toPlay } = state;
  if (!footprintFits(state.board, settings.size, cells)) return state;

  const board = state.board.slice();
  for (const cell of cells) board[indexOf(settings.size, cell)] = cell.stone;
  const move: Move = {
    row: cells[0].row,
    col: cells[0].col,
    stone: toPlay,
    kind: MOVE_KINDS.piece,
    cells: [...cells],
  };
  const laid: GameState = { ...state, board, moves: [...state.moves, move] };

  const lines: Record<Stone, Point[]> = { black: [], white: [] };
  for (const cell of cells) {
    if (lines[cell.stone].length === 0) {
      lines[cell.stone] = winningLineFor(board, settings, cell, cell.stone);
    }
  }
  if (lines.black.length > 0 && lines.white.length > 0) {
    return { ...laid, status: GAME_STATUS.draw };
  }
  if (lines.black.length > 0) return won(laid, STONES.black, WIN_REASONS.line, lines.black);
  if (lines.white.length > 0) return won(laid, STONES.white, WIN_REASONS.line, lines.white);
  if (!board.includes(null)) return { ...laid, status: GAME_STATUS.draw };
  return settleDrawLimit({ ...laid, toPlay: otherStone(toPlay) });
}

/**
 * Whether the colour to move has nothing to lay: no footprint fits the piece
 * in hand and no single is left. Then the turn passes, on the record.
 */
export function mustPass(state: GameState): boolean {
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return false;
  if (VARIANT_SPECS[state.settings.variant].queue === null) return false;
  if (singlesLeft(state) > 0 && legalPoints(state).length > 0) return false;
  return piecePlacements(state).length === 0;
}

/** Whether passing is on offer: forced in a piece game with nothing to lay, free at any point in Go. */
export function canPass(state: GameState): boolean {
  if (mustPass(state)) return true;
  if (state.status !== GAME_STATUS.playing || state.pendingTwist) return false;
  return VARIANT_SPECS[state.settings.variant].go;
}

/**
 * Takes a turn without a stone. Two passes end a piece game as a draw; in Go
 * they end it by area count instead, since passing there is a real choice,
 * not a sign nobody can move. A replay passes at the same point either way.
 */
export function passTurn(state: GameState): GameState {
  if (!canPass(state)) return state;
  const move: Move = { ...NO_POINT, stone: state.toPlay, kind: MOVE_KINDS.pass, koPointBefore: state.koPoint };
  const passed: GameState = { ...state, moves: [...state.moves, move], koPoint: null };
  const previous = state.moves[state.moves.length - 1];
  if (previous !== undefined && previous.kind === MOVE_KINDS.pass) {
    if (VARIANT_SPECS[state.settings.variant].go) {
      return won(passed, areaWinner(passed.board, passed.settings.size), WIN_REASONS.territory, []);
    }
    return { ...passed, status: GAME_STATUS.draw };
  }
  return settleDrawLimit({ ...passed, toPlay: otherStone(state.toPlay) });
}

/**
 * Plays the stone to move at `point`. Illegal moves (occupied intersection,
 * obstacle, off the board, forbidden shape, outside the opening, or game
 * already over) return the state unchanged.
 */
export function playMove(
  state: GameState,
  where: Point,
  kind: Move["kind"] = MOVE_KINDS.place,
  chosen: Stone | null = null,
): GameState {
  const point = resolvePlacement(state, where);
  if (!isLegalMove(state, point)) return state;

  const { settings, toPlay } = state;
  const spec = VARIANT_SPECS[settings.variant];
  /*
   * The flipping games settle themselves — a disc that turns nothing is not a
   * legal move, and the game ends when neither colour can move — so their
   * whole turn happens in playFlip and the length is checked on the way out.
   */
  if (spec.flips) return settleDrawLimit(playFlip(state, point));
  // Go settles its own move: a capture, maybe a fresh ko point, and the turn passes.
  if (spec.go) return playGoMove(state, point);
  // The colour of the stone: the mover's, unless the game lets them choose, or fixes it.
  const stone = spec.singleColour ? STONES.black : spec.anyColour ? (chosen ?? toPlay) : toPlay;
  const captured = capturesFrom(state.board, settings, stone, point);
  let board = state.board.slice();
  board[indexOf(settings.size, point)] = stone;
  board = removeStones(board, settings.size, captured);

  const move: Move = { ...point, stone, kind };
  if (stone !== toPlay) move.by = toPlay;
  if (captured.length > 0) move.captured = captured;
  const moves = [...state.moves, move];
  const captures = {
    ...state.captures,
    [stone]: state.captures[stone] + stonesIn(captured),
  };
  const placed: GameState = { ...state, board, moves, captures };

  const decided = settleStone(placed, point, toPlay);
  if (decided !== null) return decided;

  // A twist game's move is not over until a quadrant has turned.
  if (spec.quadrantSize !== null) return { ...placed, pendingTwist: true };

  // The falling-block rule: a full bottom row goes, and the move remembers it.
  let after = placed;
  if (spec.lineClear) {
    const cleared = clearBottomRow(board, settings.size);
    if (cleared !== null) {
      const remembered = { ...move, cleared: cleared.cleared };
      after = { ...placed, board: cleared.board, moves: [...state.moves, remembered] };
    }
  }

  if (!after.board.includes(null)) {
    // A full board: the giveaway games give it to whoever opened, the breaker game to the breaker.
    if (spec.misere) return won(after, state.opener, WIN_REASONS.full, []);
    if (spec.makerBreaker) return won(after, STONES.white, WIN_REASONS.full, []);
    return { ...after, status: GAME_STATUS.draw };
  }

  const stays = stonesLeftInTurn(settings, after.moves, toPlay) > 0;
  return settleDrawLimit({
    ...after,
    toPlay: stays ? toPlay : otherStone(toPlay),
    opening: openingAfterMove(after),
  });
}

export function canSkip(state: GameState): boolean {
  if (!state.settings.allowSkip || state.status !== GAME_STATUS.playing) return false;
  if (state.pendingTwist || inMovePhase(state)) return false;
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

export function canUndo(state: GameState): boolean {
  return state.settings.allowUndo && state.moves.length > 0;
}

/**
 * Removes the last move, putting back anything it captured, a piece where it
 * came from, and a twisted quadrant the way it was. Also reopens a finished
 * game. The opening is left as it stands: a colour choice is a decision, not
 * a stone, and is not undone by lifting one.
 */
export function undoMove(state: GameState): GameState {
  if (!canUndo(state)) return state;
  // A flipped disc is not on the record; the flipping games rebuild instead.
  if (VARIANT_SPECS[state.settings.variant].flips) {
    return undoFlip(state, createGame(state.settings));
  }

  const last = state.moves[state.moves.length - 1];
  const { size } = state.settings;
  const spec = VARIANT_SPECS[state.settings.variant];
  const quadrantSize = spec.quadrantSize;
  let board = state.board.slice();
  if (last.twist !== undefined && quadrantSize !== null) {
    board = rotateQuadrant(board, size, quadrantSize, last.twist.quadrant, !last.twist.clockwise);
  }
  if (last.cleared !== undefined) board = restoreBottomRow(board, size, last.cleared);
  if (last.kind === MOVE_KINDS.piece) {
    for (const cell of last.cells ?? []) board[indexOf(size, cell)] = null;
  } else if (last.kind !== MOVE_KINDS.pass) {
    board[indexOf(size, last)] = null;
  }
  if (last.from !== undefined) board[indexOf(size, last.from)] = last.stone;
  for (const point of last.captured ?? []) {
    board[indexOf(size, point)] = otherStone(last.stone);
  }

  // Checkers: put a king back where it moved from, a captured king back on the board, and reopen its chain.
  let kings = state.kings;
  let chainAt: Point | null = null;
  if (spec.checkers && last.from !== undefined) {
    const from = last.from;
    kings = state.kings.filter((point) => !samePoint(point, last));
    if (last.wasKing) kings = [...kings, from];
    const capturedPoint = last.captured?.[0];
    if (capturedPoint !== undefined && last.capturedWasKing) kings = [...kings, capturedPoint];
    chainAt = last.continuedChain ? from : null;
  }
  const koPoint = last.koPointBefore ?? null; // Go: back to what it was before this move.

  return {
    ...state,
    board,
    kings,
    chainAt,
    koPoint,
    pendingTwist: false,
    moves: state.moves.slice(0, -1),
    captures: {
      ...state.captures,
      [last.stone]: state.captures[last.stone] - stonesIn(last.captured ?? []),
    },
    toPlay: last.by ?? last.stone,
    status: GAME_STATUS.playing,
    winner: null,
    winBy: null,
    winningLine: [],
  };
}

export function lastMove(state: GameState): Point | null {
  const last = state.moves[state.moves.length - 1];
  return last === undefined || last.kind === MOVE_KINDS.pass ? null : last;
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
  moves: readonly MoveInput[],
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
    const point = { row: move.row, col: move.col };
    let next =
      move.kind === MOVE_KINDS.pass
        ? passTurn(current)
        : move.cells !== undefined
          ? placePiece(current, move.cells)
          : move.from !== undefined
            ? movePiece(current, { row: move.from.row, col: move.from.col }, point)
            : playMove(
                current,
                point,
                MOVE_KINDS.place,
                move.stone === STONES.black || move.stone === STONES.white ? move.stone : null,
              );
    if (next === current) break;
    timeline.push(next);
    // A recorded twist is part of the same move, and lands in the same replay step.
    if (move.twist !== undefined) {
      const turned = twistBoard(next, move.twist.quadrant, move.twist.clockwise);
      if (turned === next) break;
      timeline.push(turned);
      next = turned;
    }
  }
  return timeline;
}
