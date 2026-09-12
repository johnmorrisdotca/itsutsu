import { ASKING } from "@/components/ui/ui.constants";
import type { Asking } from "@/components/ui/ui.types";

/**
 * Holding the advance while a question is on the screen.
 *
 * `useAdvanceToNextGame` carries a player to their next waiting game the moment
 * a move ends their turn — John asked for it: "you play your move, then the
 * next game opens up". It happens a moment AFTER the move, because it is a
 * POST, a redraw and then a read of the queue, which on a CI trace was about
 * three hundred milliseconds. Somebody who plays a stone and reaches straight
 * for Resign or Cancel opens the confirm inside that window, and the navigation
 * took the board, the button and the question away together: the trace said
 * "element was detached from the DOM" and named the resign dialog.
 *
 * A question is a sentence somebody is in the middle of reading, so nothing
 * moves while one is up. What happens when it comes down depends on HOW:
 *
 *  - WAVED AWAY, and the move still stands. The held advance goes ahead, which
 *    is the feature working as asked — the player has finished with this board
 *    either way, they only changed their mind about giving it up.
 *  - ANSWERED, and the game is ending. The held advance is dropped: a
 *    resignation, like a win, is a result worth looking at, and the button's
 *    own after-ending path decides where to go from there.
 *
 * Pure, and beside the hook rather than inside it, so every path can be
 * checked without a browser. Vitest runs on `environment: node` here and
 * cannot render a hook; it can check all seven of these.
 */

/** The advance, and whether anything on the screen is stopping it. */
export type AdvanceHold<T> = {
  /** A question is up, so nothing may move the board out from under it. */
  asked: boolean;
  /** An advance that arrived while the question was up, waiting on its answer. */
  waiting: T | null;
};

/** Nothing asked, nothing waiting: what a board starts a move on. */
export const NOTHING_HELD: AdvanceHold<never> = { asked: false, waiting: null };

/**
 * Either a move has ended a turn, or the question has changed state. One union
 * so the hook has one call for all four and cannot answer three of them and
 * forget the fourth.
 */
export type AdvanceEvent<T> = { kind: "move"; move: T } | { kind: Asking };

/**
 * The hold after this event, and the advance to carry out NOW — null for
 * "nothing, and that is an answer", never a stand-in value.
 */
export function advanceHold<T>(
  hold: AdvanceHold<T>,
  event: AdvanceEvent<T>,
): { hold: AdvanceHold<T>; now: T | null } {
  if (event.kind === "move") {
    // A second move while the question is up replaces the first: the board
    // just played is the one somebody has finished with.
    if (hold.asked) return { hold: { ...hold, waiting: event.move }, now: null };
    return { hold, now: event.move };
  }
  if (event.kind === ASKING.asked) return { hold: { ...hold, asked: true }, now: null };
  /*
   * Down, either way, so the slot is emptied either way. Dropping it on an
   * answer covers the refusal too: a resign the server would not take leaves
   * the player where they are rather than on a board they never chose, and
   * leaves nothing latched to fire at the next question.
   */
  return {
    hold: { asked: false, waiting: null },
    now: event.kind === ASKING.dismissed ? hold.waiting : null,
  };
}
