import {
  cellAt,
  inMovePhase,
  isStone,
  legalPoints,
  movePiece,
  mustPass,
  passTurn,
  pieceMoves,
  piecePlacements,
  placePiece,
  playMove,
  pointOf,
  quadrantCount,
  singlesLeft,
  twistBoard,
} from "./engine";
import { GAME_STATUS, MOVE_KINDS, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { TURN_CAP, UNTRIMMED_POINTS } from "./opponent.constants";
import { tengen } from "./obstacles";
import type { GameState, Point, Stone } from "./gomoku.types";
import type { BotTurn } from "./opponent.types";

/**
 * Every turn the colour to move may take, and how to take one.
 *
 * The engine already answers "may I play here" for each shape of move a game
 * on this site can have; this collects those answers into one list so a chooser
 * can weigh whole turns without knowing which family of game it is looking at.
 * Which shapes a game has is read from its spec — whether it flips, races,
 * twists, draws pieces from a queue — and never from its name.
 */

/** Which corner of the board a point sits nearest, for a stable tie-break. */
function centreDistance(size: number, point: Point): number {
  const centre = tengen(size);
  return Math.abs(point.row - centre.row) + Math.abs(point.col - centre.col);
}

/** How far the nearest stone is, or the board's width when there are none. */
function stoneDistance(state: GameState, point: Point): number {
  const { size } = state.settings;
  let nearest = size;
  state.board.forEach((cell, index) => {
    if (!isStone(cell)) return;
    const other = pointOf(size, index);
    const gap = Math.max(Math.abs(other.row - point.row), Math.abs(other.col - point.col));
    if (gap < nearest) nearest = gap;
  });
  return nearest;
}

/**
 * The points worth offering, most relevant first: near the stones already
 * down, then near the middle. Only an ordering — nothing is dropped here — so
 * that a caller trimming a long list keeps the part of the board the game is
 * actually being played on.
 */
function byRelevance(state: GameState, points: Point[]): Point[] {
  const { size } = state.settings;
  const ranked = points.map((point) => ({
    point,
    near: stoneDistance(state, point),
    middle: centreDistance(size, point),
  }));
  ranked.sort((a, b) => a.near - b.near || a.middle - b.middle);
  return ranked.map((entry) => entry.point);
}

/**
 * At most `limit` of `items`, spread evenly through the list rather than taken
 * off the front. A tetromino can be laid several hundred ways and they arrive
 * in board order, so taking the first forty would offer the top-left corner
 * and nothing else.
 *
 * Only for lists with no ordering worth keeping. A list already sorted by how
 * much each entry matters is trimmed with `best`, which keeps the front — a
 * spread through a ranked list is how a winning point gets dropped.
 */
function spread<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  const step = items.length / limit;
  const taken: T[] = [];
  for (let k = 0; k < limit; k += 1) taken.push(items[Math.floor(k * step)]);
  return taken;
}

/** The first `limit` of a list that is already in the order that matters. */
function best<T>(items: T[], limit: number): T[] {
  return items.length <= limit ? items : items.slice(0, limit);
}

/** The points holding a piece of the colour to move. */
function ownPieces(state: GameState): Point[] {
  const { size } = state.settings;
  const points: Point[] = [];
  state.board.forEach((cell, index) => {
    if (cell === state.toPlay) points.push(pointOf(size, index));
  });
  return points;
}

/** Every slide available, in the race and piece-moving games. */
function slideTurns(state: GameState, limit: number): BotTurn[] {
  const turns: BotTurn[] = [];
  for (const from of ownPieces(state)) {
    for (const to of pieceMoves(state, from)) {
      turns.push({ kind: MOVE_KINDS.move, from, row: to.row, col: to.col });
    }
  }
  return spread(turns, limit);
}

/**
 * Every way to spend a turn in a game that draws pieces from a queue: laying
 * the piece in hand, laying a single stone instead where any are left, and the
 * pass the rules force when nothing at all fits.
 */
function queueTurns(state: GameState, limit: number): BotTurn[] {
  if (mustPass(state)) return [{ kind: MOVE_KINDS.pass }];
  const placements: BotTurn[] = piecePlacements(state).map((cells) => ({
    kind: MOVE_KINDS.piece,
    cells: [...cells],
  }));
  const singles: BotTurn[] =
    singlesLeft(state) > 0
      ? byRelevance(state, legalPoints(state)).map((point) => ({
          kind: MOVE_KINDS.place,
          row: point.row,
          col: point.col,
        }))
      : [];
  // Half the room each, so a piece game never stops offering its singles.
  const half = Math.max(1, Math.floor(limit / 2));
  const kept = [...spread(placements, limit - Math.min(half, singles.length)), ...best(singles, half)];
  return kept.length === 0 ? [] : kept;
}

/** A placement, with the quarter turn that finishes it where a game owes one. */
function placementTurns(state: GameState, limit: number): BotTurn[] {
  const spec = VARIANT_SPECS[state.settings.variant];
  const { size } = state.settings;
  const points = byRelevance(state, legalPoints(state));
  // Where the mover picks the colour of the stone, each point is two turns.
  const colours: (Stone | undefined)[] = spec.anyColour
    ? [STONES.black, STONES.white]
    : [undefined];
  const twists =
    spec.quadrantSize === null
      ? [undefined]
      : quadrantTwists(size, spec.quadrantSize);
  const perPoint = colours.length * twists.length;
  /*
   * A small board is offered whole. Every point on a Hex rhombus or a twist
   * board can be the move, and trimming one to save arithmetic is how a
   * computer walks past a win — which is exactly the bug this replaced.
   */
  const room =
    size * size <= UNTRIMMED_POINTS
      ? points.length
      : Math.max(1, Math.floor(limit / perPoint));

  const turns: BotTurn[] = [];
  for (const point of best(points, room)) {
    for (const stone of colours) {
      for (const twist of twists) {
        turns.push({
          kind: MOVE_KINDS.place,
          row: point.row,
          col: point.col,
          ...(stone === undefined ? {} : { stone }),
          ...(twist === undefined ? {} : { twist }),
        });
      }
    }
  }
  return turns;
}

/**
 * Every point Go may play, plus the pass that is always on offer there — not
 * only when nothing fits, as in the piece games, but as a real choice on any
 * turn, since ending the game is something a player decides, not something
 * the position forces.
 */
function goTurns(state: GameState, limit: number): BotTurn[] {
  return [...placementTurns(state, limit), { kind: MOVE_KINDS.pass }];
}

/** Every quarter turn a twist game could finish a stone with. */
function quadrantTwists(size: number, quadrantSize: number) {
  const twists: { quadrant: number; clockwise: boolean }[] = [];
  for (let quadrant = 0; quadrant < quadrantCount(size, quadrantSize); quadrant += 1) {
    twists.push({ quadrant, clockwise: true });
    twists.push({ quadrant, clockwise: false });
  }
  return twists;
}

/**
 * Every turn available to the colour to move, at most `limit` of them.
 *
 * Empty means the game is over, or that it is not this colour's move — never
 * that the position is a deadlock, because the engine refuses to reach one.
 */
export function legalTurns(state: GameState, limit: number = TURN_CAP): BotTurn[] {
  if (state.status !== GAME_STATUS.playing) return [];
  // A stone is down and owes a quarter turn: the twist is the whole turn left.
  if (state.pendingTwist) return [];
  if (inMovePhase(state)) return slideTurns(state, limit);
  if (VARIANT_SPECS[state.settings.variant].queue !== null) return queueTurns(state, limit);
  if (VARIANT_SPECS[state.settings.variant].go) return goTurns(state, limit);
  return placementTurns(state, limit);
}

/**
 * Plays a turn through the engine. An unplayable turn returns the state it was
 * given, exactly as the engine's own functions do, so nothing here can put a
 * position on the board that the rules would not have allowed.
 */
export function applyTurn(state: GameState, turn: BotTurn): GameState {
  if (turn.kind === MOVE_KINDS.pass) return passTurn(state);
  if (turn.kind === MOVE_KINDS.move) {
    return movePiece(state, turn.from, { row: turn.row, col: turn.col });
  }
  if (turn.kind === MOVE_KINDS.piece) return placePiece(state, turn.cells);

  const played = playMove(
    state,
    { row: turn.row, col: turn.col },
    MOVE_KINDS.place,
    turn.stone ?? null,
  );
  if (played === state) return state;
  if (!played.pendingTwist) return played;
  // A twist game's move is not a move until the quadrant has turned.
  if (turn.twist === undefined) return state;
  const turned = twistBoard(played, turn.twist.quadrant, turn.twist.clockwise);
  return turned === played ? state : turned;
}

/** Whether a point on the board is empty, for the readers below. */
export function isEmpty(state: GameState, point: Point): boolean {
  return cellAt(state, point) === null;
}
