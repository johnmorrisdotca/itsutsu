/**
 * The queue's fixed words: how long a running game may sit untouched before it
 * is flagged, and the groups in the order they are drawn.
 *
 * Split out of `myGames.ts` when it reached the file-size gate. That file reads
 * the database; these are facts about the queue's shape, which no read decides.
 * `myGames.ts` re-exports both, so every import of them keeps its path.
 */

/** A game nobody has touched for this long is flagged, so it can be dealt with. */
export const STALE_AFTER_DAYS = 14;

/**
 * The queue, in the order it is drawn.
 *
 * OFFERS TO YOU COME FIRST, ahead even of the games waiting on your move.
 * They are the same kind of debt — something is waiting on you — and they are
 * the more urgent one: a game waiting on a move is a game two people are
 * playing, while an offer is somebody who cannot start at all until you
 * answer. There are never many, so putting them at the top costs the rest of
 * the page nothing.
 *
 * YOUR OWN OFFERS sit with the games you are waiting on, because that is what
 * they are — after "their move", before the boards nobody has started.
 */
export const MY_GAME_GROUPS = [
  "offered",
  "yourMove",
  "theirMove",
  "offerSent",
  "unstarted",
  "hotSeat",
  "finished",
] as const;
