/**
 * How long autoplay shows each position before the next: long enough to see
 * where the stone went and what it took, short enough that a sixty-move game
 * plays through in under a minute.
 */
export const REPLAY_STEP_MS = 800;

/** The names of the replay's buttons, the same under a finished game and beside a board on one screen: what a screen reader says, and the hover note. */
export const REPLAY_BUTTONS = {
  start: "Start",
  back: "Back",
  play: "Play",
  pause: "Pause",
  forward: "Forward",
  end: "End",
} as const;

/**
 * What the four stepping buttons DRAW. John, 2026-09-25: "Scrubber should
 * always be only 1 line. meaning we might use < and > arrows just for the back
 * and forward, keeping Play as text." Start Back Play Forward End in words
 * wrapped to two lines in a game's side column; arrows for the four and Play
 * in words fit one line in the narrowest column the row is drawn in.
 */
export const REPLAY_GLYPHS = {
  start: "«",
  back: "‹",
  forward: "›",
  end: "»",
} as const;
