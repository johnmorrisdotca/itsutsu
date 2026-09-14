"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import useSWR, { type KeyedMutator } from "swr";

import type { GameDetail } from "@/lib/history/gameHistory.types";
import { IDLE_STOP_MS } from "./live.constants";
import { pollInterval } from "./pollCadence";

/**
 * Keeping a board current.
 *
 * The server owns the rules; this only decides how often to ask it what has
 * happened. Polling is deliberately plain — a board changes a few times a
 * minute at most, so a short poll costs less than the machinery a socket
 * would need, and it survives a phone locking and waking up.
 */

/*
 * The three numbers this spends — how often in front, how often behind, and
 * how long a background tab asks about a game where nothing happens — live in
 * `live.constants.ts` with their reasons, and the choice between them is
 * `pollInterval` in `pollCadence.ts`, where a unit test holds it.
 */

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
   * Handing the page back to the server when the game ends under the reader
   * is not done here any more. It has to agree with the address the board
   * keeps, and doing it apart from that address is what reloaded some pages
   * and froze others — see `useMatchAddress`.
   */

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
    refreshInterval: pollInterval({ polling, awake, visible }),
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
  return { game, mutate };
}
