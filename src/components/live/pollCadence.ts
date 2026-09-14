import { BACKGROUND_POLL_MS, POLL_MS } from "./live.constants";

/**
 * How often a live board asks the server what has happened, from what the
 * board knows about itself: whether its game is still being played, whether a
 * background tab has gone to sleep on it, and whether anybody is looking.
 *
 * Lifted out of `useLiveGame` so the cadence is held by a unit test rather
 * than by a browser. A spec cannot afford to wait out a thirty-second
 * background poll, and the one that looked as though it did — `go-live-pass`,
 * failing at 0.184.0 — turned out to be racing something else entirely, which
 * is the argument for the background path being proved where no timing can
 * blur it.
 *
 * Zero is SWR's own word for "do not poll", and it means exactly that here: a
 * finished game, or a tab asleep on one nobody is playing.
 */
export function pollInterval({
  polling,
  awake,
  visible,
}: {
  /** The game is still active, as far as the last answer said. */
  polling: boolean;
  /** Being looked at, or hidden but not yet asleep. */
  awake: boolean;
  /** The tab is the one being looked at. */
  visible: boolean;
}): number {
  if (!polling || !awake) return 0;
  return visible ? POLL_MS : BACKGROUND_POLL_MS;
}
