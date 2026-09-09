import { ALL_BOARD_SIZES, DEFAULT_SETTINGS, DRAW_LIMIT_SHARE } from "@/lib/gomoku/gomoku.constants";
import type { DrawLimit } from "@/lib/gomoku/gomoku.types";
import { TIME_CONTROLS, type TimeControlName } from "@/lib/clock/clock.constants";
import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";
import { DEFAULT_SESSION_SETTINGS } from "./game.constants";

/**
 * How a member likes a game set up before they have said anything about this
 * one.
 *
 * The same handful of choices were being made again on every game and on
 * every device — the board size, the switches under Advanced, the clock,
 * whether it counts. Made once here, they are where a new game starts.
 *
 * These are a starting point and nothing more. A game already under way is
 * never touched by them, and changing them mid-game changes nothing that has
 * begun: the settings on the board win, because they are what the two players
 * agreed to. That is the difference between this and the board's appearance,
 * which is a preference and follows the member everywhere at once.
 */
export type GameDefaults = {
  /** Where a new board starts, when the game does not pin its own size. */
  size: number;
  allowUndo: boolean;
  allowSkip: boolean;
  allowSwap: boolean;
  allowResize: boolean;
  /** The length a game may be given; see DrawLimit. */
  drawLimit: DrawLimit;
  /** The clock at this screen. */
  timeControl: TimeControlName;
  /** The clock in a game played from two devices; null for none. */
  moveTimeMs: number | null;
  /** Whether a shared game counts towards ratings. */
  rated: boolean;
};

export const DEFAULT_GAME_DEFAULTS: GameDefaults = {
  size: DEFAULT_SETTINGS.size,
  allowUndo: DEFAULT_SETTINGS.allowUndo,
  allowSkip: DEFAULT_SETTINGS.allowSkip,
  allowSwap: DEFAULT_SETTINGS.allowSwap,
  allowResize: DEFAULT_SETTINGS.allowResize,
  drawLimit: DEFAULT_SETTINGS.drawLimit,
  timeControl: DEFAULT_SESSION_SETTINGS.timeControl,
  moveTimeMs: null,
  rated: true,
};

function flag(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function oneOf<T>(allowed: readonly T[], value: unknown): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/**
 * The parts of a stored row that name something this site still offers.
 *
 * Read from the database as JSON, so read as whatever is in the column: a
 * board size that has been retired, a clock that no longer exists, a row
 * somebody edited. Each field is checked on its own and anything
 * unrecognisable is dropped rather than taking the rest of the member's
 * choices down with it.
 */
export function cleanGameDefaults(stored: unknown): Partial<GameDefaults> {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) return {};
  const row = stored as Record<string, unknown>;
  const clean: Partial<GameDefaults> = {};

  const size = oneOf(ALL_BOARD_SIZES, row.size);
  if (size !== undefined) clean.size = size;

  for (const key of ["allowUndo", "allowSkip", "allowSwap", "allowResize", "rated"] as const) {
    const value = flag(row[key]);
    if (value !== undefined) clean[key] = value;
  }

  const drawLimit = oneOf(Object.keys(DRAW_LIMIT_SHARE) as DrawLimit[], row.drawLimit);
  if (drawLimit !== undefined) clean.drawLimit = drawLimit;

  const timeControl = oneOf(Object.keys(TIME_CONTROLS) as TimeControlName[], row.timeControl);
  if (timeControl !== undefined) clean.timeControl = timeControl;

  // Null is a real answer here — no clock — so it is checked for by name.
  if (row.moveTimeMs === null) clean.moveTimeMs = null;
  else {
    const moveTimeMs = oneOf(MOVE_TIME_OPTIONS, row.moveTimeMs);
    if (moveTimeMs !== undefined) clean.moveTimeMs = moveTimeMs;
  }

  return clean;
}

/** A whole set from a stored one: every field, the ordinary answer where it said nothing usable. */
export function gameDefaultsFrom(stored: unknown): GameDefaults {
  return { ...DEFAULT_GAME_DEFAULTS, ...cleanGameDefaults(stored) };
}

/** The parts a new board is started from. The rest of a game's rules come from its variant. */
export function boardSettingsFrom(defaults: GameDefaults) {
  return {
    size: defaults.size,
    allowUndo: defaults.allowUndo,
    allowSkip: defaults.allowSkip,
    allowSwap: defaults.allowSwap,
    allowResize: defaults.allowResize,
    drawLimit: defaults.drawLimit,
  };
}
