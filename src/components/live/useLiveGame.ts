"use client";

import { useState, useSyncExternalStore } from "react";
import useSWR, { type KeyedMutator } from "swr";

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

  const { data, mutate } = useSWR(`/api/games/${initial.id}`, fetcher, {
    fallbackData: initial,
    refreshInterval: polling ? (visible ? POLL_MS : BACKGROUND_POLL_MS) : 0,
    onSuccess: (latest) => setPolling(latest.status === "active"),
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

  return { game: data ?? initial, mutate };
}
