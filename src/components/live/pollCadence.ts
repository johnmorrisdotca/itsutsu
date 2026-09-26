import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { SeatsHere } from "@/lib/history/gameHistory.types";
import { SUITE_SERVER_ENV, reliefAllowed } from "@/lib/suiteServer";

import { POLL_FAST_MS, POLL_MS, POLL_RELIEF_FLOOR_MS } from "./live.constants";

/**
 * How often a board that is being looked at asks, in milliseconds, at the
 * cadence it is on: `base`, which is `POLL_MS` unless the board hands in the
 * interval it was given — the operator's two settings on the site panel
 * (`liveBoardIntervals`), whose defaults are `POLL_FAST_MS` and `POLL_MS`.
 *
 * `base` itself, everywhere that matters. The one exception is the dev server
 * the end-to-end suite drives, whose `RATE_LIMIT_RELIEF` divides it too —
 * handed to the browser as `LIVE_POLL_RELIEF` by next.config.ts's `env` block.
 * The two-seat specs watch one board for the other seat's move, and a
 * fifteen-second wait for every move makes them slow and their shorter waits
 * flaky. It is the rate limiter's pattern, and its two guarantees:
 *
 *  - IGNORED OUTRIGHT IN PRODUCTION, so a variable that escaped into a
 *    deployment changes nothing. Checked first, before the variable is read.
 *  - ASKED FOR, NEVER ASSUMED. Unset, empty, not a number or under one, and
 *    the answer is `base`: a cadence nobody chose is not a cadence anybody
 *    can reason about.
 *
 * It divides the visible cadence and nothing else. A hidden tab still asks
 * nothing and the idle stop is still `IDLE_STOP_MS`, so the suite cannot come
 * to rely on a board that never sleeps.
 *
 * The environment is read as a default argument, so the unit test can hand in
 * its own and the page gets the real one. Through the config's `env` rather
 * than a variable of its own, so no `.env` anywhere needs a new line; Next
 * writes the value into the bundle at build time, and at the suite's relief
 * of 20 the floor holds the board at two and a half seconds, above SWR's own
 * two-second dedupe (`POLL_RELIEF_FLOOR_MS`). Both cadences are divided and
 * floored the same way, so at the suite's relief they are both the floor.
 */
export function pollEvery(
  env: { nodeEnv: string | undefined; relief: string | undefined; suite?: string | undefined } = {
    nodeEnv: process.env.NODE_ENV,
    relief: process.env.LIVE_POLL_RELIEF,
    suite: process.env.SUITE_SERVER,
  },
  base: number = POLL_MS,
): number {
  // Production refuses it, except the suite's own production build (`suiteServer.ts`), whose marker next.config.ts writes into the bundle.
  if (!reliefAllowed({ NODE_ENV: env.nodeEnv, [SUITE_SERVER_ENV]: env.suite })) return base;
  const relief = Number(env.relief ?? "1");
  if (!Number.isFinite(relief) || relief < 1) return base;
  // Never SLOWER than asked, either: a board the operator set to two seconds stays at two under the suite.
  return Math.min(base, Math.max(POLL_RELIEF_FLOOR_MS, Math.floor(base / Math.floor(relief))));
}

/**
 * Whether the player this board is waiting on is on the site — the one
 * question that decides between `POLL_MS` and `POLL_FAST_MS`.
 *
 * THE SEAT WHOSE TURN IT IS, and only when that seat is not the reader's own.
 * On the reader's own turn nothing can arrive but a remark, so there is
 * nothing to hurry for. A spectator (no seat) is fast exactly when the player
 * to move is here, for the same reason a player is: a move is coming.
 *
 * NOT FAST where one member holds both seats, whatever the answer says — a
 * game at one screen has no other device to wait on — and never where the
 * answer has not said: `here` is null until an answer carrying it has arrived,
 * and a board that does not know asks at the ordinary cadence. A computer
 * player is never here (`gameVersion.ts`); its moves come from the browser that
 * asked for them.
 */
export function waitingOnSomebodyHere({
  here,
  toPlay,
  seat,
  blackMemberId,
  whiteMemberId,
}: {
  here: SeatsHere | null;
  toPlay: Stone;
  seat: Stone | null;
  blackMemberId: string | null;
  whiteMemberId: string | null;
}): boolean {
  if (here === null || toPlay === seat) return false;
  if (blackMemberId !== null && blackMemberId === whiteMemberId) return false;
  return here[toPlay];
}

/**
 * How often a live board asks the server what has happened, from what the
 * board knows about itself: whether its game is still being played, whether
 * it has gone to sleep for want of anything happening, whether anybody is
 * looking, and whether the player it waits on is on the site.
 *
 * Lifted out of `useLiveGame` so the cadence is held by a unit test rather
 * than by a browser; `e2e/live-poll-cadence.spec.ts` counts what a browser
 * actually sends.
 *
 * Zero is SWR's own word for "do not poll", and it means exactly that here: a
 * finished game, a board asleep, or a tab nobody is looking at. A hidden tab
 * does not ask at all any more — not slowly, not for a while. Nobody is reading
 * it, and `revalidateOnFocus` fetches the moment somebody does, so the board a
 * person comes back to is current either way. Otherwise it is `fast` while the
 * player it waits on is here, and `every` when not.
 */
export function pollInterval({
  polling,
  awake,
  visible,
  otherHere,
  every = pollEvery(),
  fast = pollEvery(undefined, POLL_FAST_MS),
}: {
  /** The game is still active, as far as the last answer said. */
  polling: boolean;
  /** Something has happened recently enough that the board is still asking. */
  awake: boolean;
  /** The tab is the one being looked at. */
  visible: boolean;
  /** The player this board waits on has been seen on the site lately — see `waitingOnSomebodyHere`. */
  otherHere: boolean;
  /** The visible cadence, `pollEvery()` unless a test hands one in. */
  every?: number;
  /** The visible cadence while the other player is here, `pollEvery(…, POLL_FAST_MS)` unless a test hands one in. */
  fast?: number;
}): number {
  if (!polling || !awake || !visible) return 0;
  return otherHere ? fast : every;
}
