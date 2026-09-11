"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import useSWR, { type KeyedMutator } from "swr";

import { settledSinceRendered } from "@/lib/history/settle";
import type { GameDetail } from "@/lib/history/gameHistory.types";

/**
 * Keeping a board current.
 *
 * The server owns the rules; this only decides how often to ask it what has
 * happened. Polling is deliberately plain — a board changes a few times a
 * minute at most, so a short poll costs less than the machinery a socket
 * would need, and it survives a phone locking and waking up.
 */

/** How often a waiting board asks whether the other side has moved. */
const POLL_MS = 2500;

/**
 * How often it asks while the tab is in the background.
 *
 * The board must still be current when a phone is unlocked or a tab is
 * brought forward, but nobody is reading it in the meantime, so it need not
 * be current every two and a half seconds. At that rate one forgotten tab on
 * an unfinished game asks the server thirty-four thousand times a day, and
 * every ask is a database read no cache can stand in front of.
 */
const BACKGROUND_POLL_MS = 30_000;

/**
 * How long a background tab keeps asking about a game where nothing is
 * happening, before it stops asking altogether.
 *
 * These are games played over days. A tab left open on one where neither side
 * has moved for an hour is not waiting for anything, and thirty seconds is
 * still two and a half thousand questions a day to be told the same thing.
 * Nothing is lost by stopping: `revalidateOnFocus` fetches the moment the tab
 * is looked at again, so the board a person comes back to is current whether
 * it was asking or not. A move landing resets the hour.
 */
const IDLE_STOP_MS = 60 * 60 * 1000;

const fetcher = async (url: string): Promise<GameDetail> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load the game.");
  return response.json();
};

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** Whether this tab is the one being looked at. */
function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    // On the server, and for the first paint, assume somebody is looking: a
    // board that starts slow and speeds up reads worse than the reverse.
    () => true,
  );
}

/**
 * The game as it stands, kept up to date for as long as it is being played.
 *
 * A finished game has nothing left to poll for, so the asking stops the
 * moment one comes back settled.
 */
export function useLiveGame(initial: GameDetail): {
  game: GameDetail;
  mutate: KeyedMutator<GameDetail>;
} {
  const [polling, setPolling] = useState(initial.status === "active");
  const visible = usePageVisible();
  const [lastMove, setLastMove] = useState(initial.lastMoveAt ?? initial.playedAt);
  const [asleep, setAsleep] = useState(false);

  /*
   * Handing the page back to the server when the game ends under the reader.
   *
   * The board settles itself — `settleFromRecord` — so the result banner is
   * right without this. What is NOT right is everything around the board: the
   * server chose the live presentation when the page was rendered, and a match
   * that has finished wants the filed one, with the rematch, the two names and
   * the applause on it. See `settledSinceRendered` for how the two came apart.
   *
   * `router.refresh()` re-renders the server components in place and keeps
   * client state, so nothing flickers and nothing is lost. It fires at most
   * once per mount, the moment the game reads as settled — one request at the
   * end of a game, on a page that has just stopped polling.
   *
   * Watched as a STATE rather than hung off the poll's `onSuccess`, because a
   * poll is only one of the ways the ending arrives. Playing the winning move
   * yourself puts the finished game straight into the cache with
   * `mutate(…, { revalidate: false })`, which no fetch callback ever sees; so
   * would a resignation or a flag claimed on time. Asking what the status IS
   * covers every route to it, including the ones added later.
   */
  const router = useRouter();
  const handedBack = useRef(false);

  /*
   * The hour is counted by a timer, not by a clock read while rendering. A
   * game where nothing is happening is exactly the case where nothing changes
   * — a poll that comes back identical re-renders nothing — so a comparison
   * made during render would never notice the hour go by. The timeout fires
   * on its own, and a move landing changes `lastMove`, which starts it again.
   */
  useEffect(() => {
    if (visible) return;
    const remaining = IDLE_STOP_MS - (Date.now() - new Date(lastMove).getTime());
    const timer = setTimeout(() => setAsleep(true), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [visible, lastMove]);

  // Being looked at is enough on its own; sleep only ever applies to a tab
  // nobody is watching.
  const awake = visible || !asleep;

  const { data, mutate } = useSWR(`/api/games/${initial.id}`, fetcher, {
    fallbackData: initial,
    refreshInterval: polling && awake ? (visible ? POLL_MS : BACKGROUND_POLL_MS) : 0,
    onSuccess: (latest) => {
      setPolling(latest.status === "active");
      // A move landing starts the idle hour again.
      setLastMove(latest.lastMoveAt ?? latest.playedAt);
      /*
       * Having just heard from the server is the definition of awake. This is
       * also what brings a slept tab back: returning to it revalidates on
       * focus, and that answer lands here.
       */
      setAsleep(false);
    },
    /*
     * Keep polling while the tab is in the background, slowly. This is a game
     * played over minutes on two phones — the board has to be current the
     * moment someone looks at it, not a poll interval later — and
     * `revalidateOnFocus` is what delivers that: attention returning fetches
     * at once. Between glances a background tab need not ask every two and a
     * half seconds, and asking anyway is how one forgotten tab came to cost
     * tens of thousands of uncached reads a day.
     */
    refreshWhenHidden: true,
    revalidateOnFocus: true,
  });

  const game = data ?? initial;
  useEffect(() => {
    if (handedBack.current) return;
    if (!settledSinceRendered(initial.status, game.status)) return;
    handedBack.current = true;
    router.refresh();
  }, [initial.status, game.status, router]);

  return { game, mutate };
}
