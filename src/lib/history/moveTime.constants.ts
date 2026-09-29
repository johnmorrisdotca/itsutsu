/**
 * A shared game's clock and what running out of it costs, as plain values.
 *
 * Kept apart from the request schemas that check them (`gameSettingsSchema.ts`,
 * which re-exports these) so that a page naming a time limit does not import
 * zod to do it: the site's header reads them through My games' constants, and
 * through that import zod and all of its languages rode into every page's
 * server function, once for every group of pages (`functionSizeGate`).
 */

/** Per-move time limits a shared game may use, in milliseconds. Null is no clock. */
export const MOVE_TIME_OPTIONS = [
  null,
  5 * 60_000,
  30 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
  24 * 60 * 60_000,
  3 * 24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
] as const;

/** "turn": forfeit the move. "game": lose the game. "game-strict": lose the game, and vacation days do not delay it. */
export const TIMEOUT_PENALTIES = ["turn", "game", "game-strict"] as const;
export type TimeoutPenalty = (typeof TIMEOUT_PENALTIES)[number];

/** Three missed turns in a row lose the game under the graceful penalty. */
export const FORFEITS_TO_LOSE = 3;
