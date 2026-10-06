import type { TimeControl } from "./clock.types";

/**
 * The presets, named for the pace they produce rather than for their numbers.
 * `none` is a game with no clock at all, which stays the default — a clock
 * changes how a casual game feels, so it has to be asked for.
 */
export const TIME_CONTROLS = {
  none: { mainMs: 0, byoyomiMs: 0, periods: 0 },
  blitz: { mainMs: 3 * 60_000, byoyomiMs: 10_000, periods: 3 },
  rapid: { mainMs: 10 * 60_000, byoyomiMs: 30_000, periods: 3 },
  classical: { mainMs: 30 * 60_000, byoyomiMs: 60_000, periods: 5 },
} as const satisfies Record<string, TimeControl>;

export type TimeControlName = keyof typeof TIME_CONTROLS;

export { TIME_CONTROL_DISPLAY } from "./clockNames.constants";

/** How often the clock is recomputed while a player is thinking. */
export const CLOCK_TICK_MS = 200;

/** Below this, the clock reads in tenths and turns urgent. */
export const CLOCK_URGENT_MS = 10_000;
