import { POLL_MS, POLL_RELIEF_FLOOR_MS } from "./live.constants";

/**
 * How often a board that is being looked at asks, in milliseconds.
 *
 * `POLL_MS`, everywhere that matters. The one exception is the dev server the
 * end-to-end suite drives, which may set `NEXT_PUBLIC_LIVE_POLL_RELIEF` to
 * divide it: the two-seat specs watch one board for the other seat's move, and
 * a fifteen-second wait for every move makes them slow and their shorter waits
 * flaky. It is the rate limiter's pattern, and its two guarantees:
 *
 *  - IGNORED OUTRIGHT IN PRODUCTION, so a variable that escaped into a
 *    deployment changes nothing. Checked first, before the variable is read.
 *  - ASKED FOR, NEVER ASSUMED. Unset, empty, not a number or under one, and
 *    the answer is `POLL_MS`: a cadence nobody chose is not a cadence anybody
 *    can reason about.
 *
 * It divides the visible cadence and nothing else. A hidden tab still asks
 * nothing and the idle stop is still `IDLE_STOP_MS`, so the suite cannot come
 * to rely on a board that never sleeps.
 *
 * The environment is read as a default argument, so the unit test can hand in
 * its own and the page gets the real one. `NEXT_PUBLIC_` because the cadence
 * is decided in the browser, where Next writes the value in at build time.
 */
export function pollEvery(
  env: { nodeEnv: string | undefined; relief: string | undefined } = {
    nodeEnv: process.env.NODE_ENV,
    relief: process.env.NEXT_PUBLIC_LIVE_POLL_RELIEF,
  },
): number {
  if (env.nodeEnv === "production") return POLL_MS;
  const relief = Number(env.relief ?? "1");
  if (!Number.isFinite(relief) || relief < 1) return POLL_MS;
  return Math.max(POLL_RELIEF_FLOOR_MS, Math.floor(POLL_MS / Math.floor(relief)));
}

/**
 * How often a live board asks the server what has happened, from what the
 * board knows about itself: whether its game is still being played, whether
 * it has gone to sleep for want of anything happening, and whether anybody is
 * looking.
 *
 * Lifted out of `useLiveGame` so the cadence is held by a unit test rather
 * than by a browser; `e2e/live-poll-cadence.spec.ts` counts what a browser
 * actually sends.
 *
 * Zero is SWR's own word for "do not poll", and it means exactly that here: a
 * finished game, a board asleep, or a tab nobody is looking at. A hidden tab
 * does not ask at all any more — not slowly, not for a while. Nobody is reading
 * it, and `revalidateOnFocus` fetches the moment somebody does, so the board a
 * person comes back to is current either way.
 */
export function pollInterval({
  polling,
  awake,
  visible,
  every = pollEvery(),
}: {
  /** The game is still active, as far as the last answer said. */
  polling: boolean;
  /** Something has happened recently enough that the board is still asking. */
  awake: boolean;
  /** The tab is the one being looked at. */
  visible: boolean;
  /** The visible cadence, `pollEvery()` unless a test hands one in. */
  every?: number;
}): number {
  if (!polling || !awake || !visible) return 0;
  return every;
}
