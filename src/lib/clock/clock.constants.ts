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

export const TIME_CONTROL_DISPLAY: Record<
  TimeControlName,
  { label: string; kanji: string; description: string }
> = {
  none: {
    label: "No clock",
    kanji: "無制限",
    description: "Take as long as you like.",
  },
  blitz: {
    label: "Blitz",
    kanji: "早碁",
    description: "3 minutes, then three 10-second periods.",
  },
  rapid: {
    label: "Rapid",
    kanji: "速碁",
    description: "10 minutes, then three 30-second periods.",
  },
  classical: {
    label: "Classical",
    kanji: "持ち時間",
    description: "30 minutes, then five 1-minute periods.",
  },
};

/** How often the clock is recomputed while a player is thinking. */
export const CLOCK_TICK_MS = 200;

/** Below this, the clock reads in tenths and turns urgent. */
export const CLOCK_URGENT_MS = 10_000;
