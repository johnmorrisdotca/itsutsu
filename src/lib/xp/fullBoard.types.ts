import type { DayKey } from "./xpDay";

/**
 * The vocabulary of the full-board awards: what a game looks like to the
 * evaluation, and what one day came to.
 *
 * Kept apart from `fullBoard.ts` for the reason every types module here is:
 * the server read (`fullBoardServer.ts`) is checked against these by the
 * compiler, so a column the evaluation needs is a column the read must select.
 */

export type BoardStone = "black" | "white";

/** One move, as far as the evaluation needs it: who made it, and when. */
export type BoardMove = { stone: string; at: Date };

/** One game a member is seated in, as the evaluation reads it. */
export type BoardGame = {
  id: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  /** A game at one screen: both seats share one token. Never counts. */
  hotSeat: boolean;
  /** When the row was made. */
  playedAt: Date;
  /** When each seat was taken, where that was recorded. */
  blackClaimedAt: Date | null;
  whiteClaimedAt: Date | null;
  /**
   * When the game ended — `Game.lastMoveAt` on a finished row, which every
   * ending writes (a move, a resignation, a timeout, a cancellation, a settled
   * position). Null while it is still being played.
   */
  finishedAt: Date | null;
  /** Every move, oldest first. */
  moves: readonly BoardMove[];
  /**
   * Whose move it is now, for a game still being played: the stored turn
   * (`settledPosition`). Null where it was never written or the game is over —
   * which the evaluation reads as "cannot tell", never as anybody's turn.
   */
  toPlayNow: BoardStone | null;
};

/** What one of the member's days came to. */
export type BoardDay = {
  day: DayKey;
  /** The most games counting toward a full board at any one moment of the day. */
  peak: number;
  /** A full board at some moment of the day. */
  full: boolean;
  /** Nothing had been waiting on this member's move for more than a day, at the day's end. */
  keptUp: boolean;
  /** At least one move by this member that day, in a game that counts. */
  moved: boolean;
  /** The games that broke `keptUp`, for a report and a test. */
  overdue: string[];
};
