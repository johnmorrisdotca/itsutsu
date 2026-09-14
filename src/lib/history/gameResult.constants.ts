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
  "noMoves",
  "repetition",
  "endgameCount",
  "length",
  "bothLines",
  "boardFull",
  "draw",
] as const;
