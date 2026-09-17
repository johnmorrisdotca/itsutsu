import { createGame, legalPoints } from "./engine";
import { findWinningLine } from "./rules/lines";
import { indexOf } from "./rules/board";
import { GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, STONES } from "./gomoku.constants";
import { couldMakeLine } from "./forcedWin";
import { applyTurn } from "./opponentTurns";
import { candidatePoints } from "./threats";
import { threatWinTurn } from "./threatWin";
import type { GameState, RuleVariant, Stone } from "./gomoku.types";

/*
 * The checks behind the claims of a win by threats, shared by the quick cases
 * in `threatWin.test.ts` and the long run in `threatWin.play.test.ts`. Not a
 * test file itself, so importing it runs nothing.
 */

export type Cells = Array<[number, number]>;

/** Black and white stones laid alternately, black first, so the record is a real game. */
export function position(black: Cells, white: Cells, variant: RuleVariant = RULE_VARIANTS.freestyle, size = 15): GameState {
  let state = createGame({ variant, size } as never);
  for (let at = 0; at < Math.max(black.length, white.length); at += 1) {
    for (const [row, col] of [black[at], white[at]].filter((one) => one !== undefined)) {
      const next = applyTurn(state, { kind: MOVE_KINDS.place, row, col });
      if (next === state) throw new Error(`the engine refused ${row},${col}`);
      state = next;
    }
  }
  return state;
}

/** The points where `stone` could make five right now — near the stones, which is everywhere a five can be. */
export function fivePoints(state: GameState, stone: Stone): Array<{ row: number; col: number }> {
  const board = state.board.slice();
  const { size } = state.settings;
  const found: Array<{ row: number; col: number }> = [];
  for (const point of candidatePoints(state)) {
    const at = indexOf(size, point);
    if (board[at] !== null) continue;
    if (!couldMakeLine(board, state, stone, point, 0)) continue;
    board[at] = stone;
    if (findWinningLine(board, state.settings, point).length > 0) found.push(point);
    board[at] = null;
  }
  return found;
}

const other = (stone: Stone): Stone => (stone === STONES.black ? STONES.white : STONES.black);

/**
 * An independent check of a claimed win, with `me` to move: `me` makes five if
 * it can; blocks a five of the defender's when there is exactly one; otherwise
 * plays the finder's move. Then EVERY legal reply the defender has — not the few
 * the finder chose to read — must leave `me` still winning.
 */
export function holds(state: GameState, me: Stone, levels: number, threes: number): boolean {
  if (fivePoints(state, me).length > 0) return true;
  if (levels === 0) return false;
  const theirs = fivePoints(state, other(me));
  if (theirs.length >= 2) return false;
  let after: GameState;
  if (theirs.length === 1) {
    after = applyTurn(state, { kind: MOVE_KINDS.place, row: theirs[0].row, col: theirs[0].col });
  } else {
    const turn = threatWinTurn(state, { nodes: 1e9, until: Infinity }, threes);
    if (turn === null || turn.kind !== MOVE_KINDS.place) return false;
    after = applyTurn(state, turn);
  }
  if (after === state) return false;
  if (after.status !== GAME_STATUS.playing) return after.winner === me;
  for (const reply of legalPoints(after)) {
    const next = applyTurn(after, { kind: MOVE_KINDS.place, row: reply.row, col: reply.col });
    if (next === after) continue;
    if (next.status !== GAME_STATUS.playing) return false;
    if (!holds(next, me, levels - 1, threes)) return false;
  }
  return true;
}

