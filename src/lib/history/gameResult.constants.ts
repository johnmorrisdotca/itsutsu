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

/** Every reason a game can end with nobody winning, so a list of reasons can be told apart from a win's. */
export const RESULT_DRAW_REASONS = [
  "unfinishable",
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
