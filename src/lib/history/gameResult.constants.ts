import type { ProgressMeasure } from "@/lib/gomoku/rules/noProgress";

import type { DrawReason } from "./gameResult.types";

/**
 * HOW LONG A FINISHED GAME IS NEWS, in days.
 *
 * The result card shows the first time a player opens a game that has ended —
 * in front of them, or while they were away. Past this it is a record being read
 * back, not a result arriving: opening a month-old game from the history should
 * show the replay, not announce who won as though it had just happened. A week
 * covers anybody who plays every few days and comes back to a game that ended
 * while they were gone.
 */
export const RESULT_CARD_FRESH_DAYS = 7;

export const DAY_MS = 86_400_000;

/**
 * HOW LONG AFTER A GAME ENDS ITS XP MAY STILL BE ON ITS WAY, in milliseconds.
 *
 * A game is filed as finished in one write, and the players are paid in the writes
 * that follow it (`recordPlayed`), one seat after the other. The player whose move
 * ended the game is not answered until both are done; the other seat's board
 * learns of the ending from its poll and renders the card at once, which can be
 * between the two. A card drawn in that gap says nothing of XP, and nothing would
 * ever bring it back. Inside this long after the last move, a card with no XP
 * asks the server again (`RESULT_CARD_RETRY_MS`); after it, no XP is simply none.
 */
export const RESULT_CARD_SETTLE_MS = 10_000;

/**
 * When a card that drew before its XP landed asks again, counted from the one
 * before: twice at most, so the longest a card waits is the sum. A render is the
 * cost of each, so there are two and not a timer.
 */
export const RESULT_CARD_RETRY_MS: readonly number[] = [1_500, 4_000];

/** Every reason a game can end with nobody winning, so a list of reasons can be told apart from a win's. */
export const RESULT_DRAW_REASONS = [
  "noProgressRacing",
  "noProgressTaking",
  "noProgressPlacing",
  "noMoves",
  "repetition",
  "endgameCount",
  "length",
  "bothLines",
  "boardFull",
  "draw",
] as const;

/**
 * The draw reason for each no-progress measure (`rules/noProgress.ts`), so a
 * stall is filed under the rule that drew it. Checked against the measures, so a
 * new measure cannot arrive without a reason of its own.
 */
export const NO_PROGRESS_DRAW_REASONS = {
  racing: "noProgressRacing",
  taking: "noProgressTaking",
  placing: "noProgressPlacing",
} as const satisfies Record<ProgressMeasure, DrawReason>;
