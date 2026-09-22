import { isOnBoard } from "@/lib/gomoku/rules/board";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import { pendingMove, type PendingMove } from "./pendingMove";

/**
 * MOVING A PLACED STONE ONE POINT AT A TIME, BEFORE IT IS SENT.
 *
 * John, 2026-09-21: "in mobile, the buttons are small, targets are hard to
 * hit." A 19×19 go board on a 390-pixel phone gives cells 17.6 pixels across,
 * against the 44 a finger wants, and no amount of layout changes that: the
 * board is already the width of the screen and nineteen into 390 is what it
 * is.
 *
 * So the answer is not a bigger target, it is a CORRECTABLE one. The stone is
 * already placed and not yet sent — that flow shipped in 0.225.0 — and this
 * makes the gap between "I hit the wrong point" and "I have to start the move
 * over" one press instead of two. A near miss is the common miss.
 *
 * THE ENGINE DECIDES, NOT THIS. Every nudge is a new placement offered to
 * `pendingMove`, which offers it to `applyTurn`, so a nudge onto an occupied
 * point, a forbidden shape or a sealed cell comes back null and the arrow is
 * simply not offered. Nothing here reads the board to decide what is legal,
 * which AGENTS.md is explicit about, and a drop game gets the right answer for
 * free: sideways lands in the next column, and up or down is refused by the
 * rules because gravity has already chosen the row.
 */

/** The four directions, as steps in the array — screen directions on an unflipped board. */
export const NUDGES = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
} as const;

export type NudgeDirection = keyof typeof NUDGES;

export const NUDGE_DIRECTIONS = Object.keys(NUDGES) as readonly NudgeDirection[];

/**
 * WHICH BOARDS GET ARROWS, and it is a question about geometry rather than
 * about size.
 *
 * A square grid's rows and columns are what a reader sees, so "left" is the
 * point to the left and the arrow tells the truth. A board on the HEXAGON
 * LATTICE is a square array sheared, so row−1 is up and to the right on
 * screen and there are six neighbours rather than four: an up arrow there
 * would move the stone somewhere the arrow does not point, which is worse
 * than no arrow. Those boards are also the roomy ones — the honeycomb's cells
 * are 43 pixels on the same phone the go board's are 17.6 — so the shape that
 * cannot have arrows is the shape that least needs them.
 *
 * A game whose turn is a piece moving from one square to another is left out
 * for its own reason: what would be nudged is the DESTINATION of a move that
 * also has an origin, and a jump chain in Halma or Chinese Checkers is a
 * sequence rather than a point. Only a placement has one point to move.
 */
export function boardTakesNudges(state: GameState): boolean {
  const spec = VARIANT_SPECS[state.settings.variant];
  return !spec.hexagon && !spec.chineseCheckers && !spec.connects;
}

/**
 * The same move one point over, or null when there is no such move.
 *
 * FROM THE STATE BEFORE THE MOVE, never from the preview. `pending.after` is
 * the board with this stone already on it, so nudging from there would ask the
 * engine to play a second stone in a position the first one had already
 * changed — the captures would be wrong, and in a game that ends on a line the
 * preview may not even be a position anybody may move in.
 */
export function nudgedMove(
  state: GameState,
  pending: PendingMove,
  direction: NudgeDirection,
): PendingMove | null {
  const turn = pending.turn;
  // Only a placement has a single point to move; see `boardTakesNudges`.
  if (turn.kind !== "place") return null;
  const step = NUDGES[direction];
  const row = turn.row + step.row;
  const col = turn.col + step.col;
  if (!isOnBoard(state.settings.size, { row, col })) return null;
  const moved = pendingMove(state, { ...turn, row, col });
  /*
   * AND A NUDGE THAT CHANGES NOTHING IS NOT ONE. In a drop game any empty cell
   * of a column with room plays that column, so nudging a disc UP is a legal
   * placement that lands in exactly the same square — an arrow that lights up,
   * accepts the press, and leaves the board where it was. Gravity already
   * chose the row; only the column is the player's to move.
   *
   * Read off the position rather than off a list of which games route their
   * moves: any game that decides where a move really lands gets the right
   * answer here without being named, and a new one cannot be forgotten.
   */
  if (moved === null || samePosition(moved.after.board, pending.after.board)) return null;
  return moved;
}

/** Whether two boards hold the same thing in every cell. */
function samePosition(a: GameState["board"], b: GameState["board"]): boolean {
  return a.length === b.length && a.every((cell, index) => cell === b[index]);
}

/**
 * Every direction that leads somewhere, worked out once for the row of
 * arrows — so a direction that cannot be taken is DISABLED rather than
 * offered and then refused. A button that does nothing when pressed is the
 * thing this is here to avoid on a small screen.
 */
export function nudgesAvailable(state: GameState, pending: PendingMove | null): Set<NudgeDirection> {
  const found = new Set<NudgeDirection>();
  if (pending === null || !boardTakesNudges(state)) return found;
  for (const direction of NUDGE_DIRECTIONS) {
    if (nudgedMove(state, pending, direction) !== null) found.add(direction);
  }
  return found;
}

/**
 * The other way round, for a board a reader has TURNED.
 *
 * A player sitting on the far side sees row+1 up the screen, so an arrow
 * pointing up has to step the array the other way — otherwise the control
 * lies about itself on exactly the board where nobody can check by eye. The
 * mapping lives here, beside the directions it is about, and the component
 * applies it where the screen is known.
 */
export const OPPOSITE: Record<NudgeDirection, NudgeDirection> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
