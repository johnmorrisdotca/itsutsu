import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * How long autoplay shows each position before the next: long enough to see
 * where the stone went and what it took, short enough that a sixty-move game
 * plays through in under a minute.
 */
export const REPLAY_STEP_MS = 800;

/** The names of the replay's buttons, the same under a finished game and beside a board on one screen: what a screen reader says, and the hover note. */
export const REPLAY_BUTTONS = {
  start: "replay.start",
  back: "replay.back",
  play: "replay.play",
  pause: "replay.pause",
  forward: "replay.forward",
  end: "replay.end",
} as const satisfies Record<string, PhraseKey>;

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

/** A move count's two unseen sizers, its longest wording and what its start is called, in the same grid cell as the count (`MoveCount`). */
export const MOVE_COUNT_SIZERS =
  "before:invisible before:col-start-1 before:row-start-1 before:content-[attr(data-longest)] after:invisible after:col-start-1 after:row-start-1 after:content-[attr(data-start)]";
