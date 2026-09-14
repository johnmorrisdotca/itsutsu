/**
 * The thresholds a rivalry's one line is chosen by, written down once.
 *
 * Each is a judgement about what is worth SAYING, not a rule of any game, so
 * each says why it is the number it is. `rivalry.test.ts` pins the edges —
 * one under and exactly at — so a change to any of them is a change somebody
 * made on purpose and a test that says so.
 */

/**
 * A run of results worth naming starts at three.
 *
 * Two in a row is what a coin does a quarter of the time; "you've lost to Dan
 * twice in a row" is a sentence about luck. Three is where a run starts to read
 * as a rivalry with a shape, and it is also the first rung of the XP win-streak
 * milestones, so the site means one thing by "a streak" wherever it says it.
 */
export const RIVALRY_STREAK_WORTH_NAMING = 3;

/**
 * "A long time" is six months since the two last finished a game.
 *
 * Shorter, and a pair who play once a season would be told they have not
 * played in "3 months" every time they sit down, which is a gap in nothing but
 * the calendar. Longer, and the line John asked for — "haven't played in 2
 * years" — would only ever fire for years, and half a year away from somebody
 * is already worth mentioning before a game.
 */
export const RIVALRY_LONG_GAP_DAYS = 180;

/** A month, for saying a gap in words: whole thirty-day months, never rounded up. */
export const RIVALRY_DAYS_IN_MONTH = 30;

/** A year, for the same: whole 365-day years. A gap of 364 days is still months. */
export const RIVALRY_DAYS_IN_YEAR = 365;

const MS_IN_DAY = 24 * 60 * 60 * 1000;

/** Milliseconds in a day, for turning two moments into whole days between them. */
export const RIVALRY_MS_IN_DAY = MS_IN_DAY;

/**
 * When the line is being said.
 *
 * - `before` — two people are about to play, and the game is not in the record.
 * - `after` — a game has just been filed, and it IS in the record: "first win
 *   against Dan" is only true because this game is counted.
 * - `record` — a list of their games is being read, with no game in hand.
 */
export const RIVALRY_MOMENTS = {
  before: "before",
  after: "after",
  record: "record",
} as const;
