import {
  BOARD_SIZES,
  GAME_STATUS,
  OBSTACLE_LAYOUTS,
} from "../gomoku.constants";
import { VARIANT_SPECS } from "../gomoku.constants";
import type { Cell, GameState, Move, Point } from "../gomoku.types";
import { emptyBoard } from "../obstacles";

/**
 * Growing the board mid-game.
 *
 * A game that has run out of room is not necessarily a game that has run out
 * of ideas, so a bigger board gives both players somewhere to go. The stones
 * keep their positions relative to each other — the old board is re-centred on
 * the new one — because anything else would rewrite the game that had been
 * played rather than continue it.
 *
 * Growing does not pass the turn, and that is a correctness requirement rather
 * than a kindness. A growth places no stone, so nothing records that it
 * happened; if it changed whose turn it was, replaying the move list would
 * alternate colours differently from the game that was actually played, and a
 * stored game would no longer reproduce itself. It is also the better rule:
 * a bigger board helps both players, so charging the grower a tempo would
 * make growing strictly bad for whoever asked.
 *
 * For the same reason growth is only offered on an open board. Obstacles are
 * derived from the board size, so a grown game would start its replay with the
 * larger size's star points — which are not the ones it was played with.
 */

/** The next size up, or null when the board is already the largest. */
export function nextBoardSize(size: number): number | null {
  const larger = BOARD_SIZES.filter((option) => option > size);
  return larger.length > 0 ? Math.min(...larger) : null;
}

/**
 * How far the old board shifts when centred on the new one.
 *
 * Both sizes are odd, so the difference is even and the offset is exact: the
 * centre point stays the centre point, and no stone is nudged off-centre.
 */
export function growthOffset(from: number, to: number): number {
  return Math.floor((to - from) / 2);
}

export function canGrowBoard(state: GameState): boolean {
  // A game played on a board of its own size cannot grow out of it.
  if (VARIANT_SPECS[state.settings.variant].boardSizes !== null) return false;
  return (
    state.settings.allowGrowth &&
    state.status === GAME_STATUS.playing &&
    // See the note above: obstacles are derived from size, so they would not
    // survive a replay of a grown game.
    state.settings.obstacles === OBSTACLE_LAYOUTS.none &&
    nextBoardSize(state.settings.size) !== null
  );
}

function shift(point: Point, offset: number): Point {
  return { row: point.row + offset, col: point.col + offset };
}

/**
 * Returns the game on a larger board, or the state unchanged when it cannot
 * grow. Every stone, every recorded move and the winning line all move
 * together, so the record still replays to the position on the screen.
 */
export function growBoard(state: GameState): GameState {
  if (!canGrowBoard(state)) return state;

  const from = state.settings.size;
  const to = nextBoardSize(from);
  if (to === null) return state;

  const offset = growthOffset(from, to);
  const settings = { ...state.settings, size: to };

  /*
   * Start from the larger board's own obstacle layout — the star points of a
   * 13×13 are not those of a 9×9 — then lay the stones over it. A stone
   * always wins the intersection: a game in progress cannot have a stone
   * evicted by a pattern that only exists at the new size.
   */
  const board: Cell[] = emptyBoard(settings);
  state.board.forEach((cell, index) => {
    if (cell === null) return;
    const point = shift(
      { row: Math.floor(index / from), col: index % from },
      offset,
    );
    const target = point.row * to + point.col;
    // Obstacles from the old layout are dropped; the new layout replaces them.
    if (cell !== "blocked") board[target] = cell;
  });

  const moves: Move[] = state.moves.map((move) => ({
    ...move,
    ...shift(move, offset),
  }));

  return {
    ...state,
    settings,
    board,
    moves,
    winningLine: state.winningLine.map((point) => shift(point, offset)),
  };
}
