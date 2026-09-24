/**
 * How long autoplay shows each position before the next: long enough to see
 * where the stone went and what it took, short enough that a sixty-move game
 * plays through in under a minute.
 */
export const REPLAY_STEP_MS = 800;

/** The words on the replay's buttons, the same under a finished game and beside a board on one screen. */
export const REPLAY_BUTTONS = {
  start: "Start",
  back: "Back",
  play: "Play",
  pause: "Pause",
  forward: "Forward",
  end: "End",
} as const;
