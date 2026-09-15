"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import useSWR, { type KeyedMutator } from "swr";

import type { GameDetail } from "@/lib/history/gameHistory.types";
import { pollEvery, pollInterval } from "./pollCadence";
import { useBoardAwake } from "./useBoardAwake";

/**
 * Keeping a board current, at a price the site can pay.
 *
 * The server owns the rules; this only decides when to ask it what has
 * happened. Polling is deliberately plain — a board changes a few times a
 * minute at most, and a held connection is a service this site does not buy —
 * but every ask is a function call on a paid account, so it asks as little as
 * a person watching the board would notice:
 *
 *  - every `POLL_MS` (fifteen seconds) while somebody is looking at it;
 *  - never from a hidden tab — `revalidateOnFocus` asks the moment it is shown;
 *  - not at all once `IDLE_STOP_MS` pass with nothing happening, on the board
 *    or from the reader, until a press, a key, focus or the tab being shown
 *    wakes it and it asks at once;
 *  - and not after the player's own move, whose answer is the new board
 *    (`SharedGame`'s `send` puts it in the cache without asking again).
 *
 * It was every two and a half seconds in front and every thirty behind, for an
 * hour after the last move: about 1,400 function calls an hour from one board
 * left open. John, 2026-09-15: "we have to stop doing things like that that
 * will eat up CPU time." The numbers live in `live.constants.ts` with their
 * reasons, the choice between them is `pollInterval`, and
 * `e2e/live-poll-cadence.spec.ts` counts what a browser really sends.
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
 * The game as it stands, kept up to date for as long as it is being played
 * and somebody is there to see it.
 *
 * A finished game has nothing left to poll for, so the asking stops the moment
 * one comes back settled.
 */
export function useLiveGame(initial: GameDetail): {
  game: GameDetail;
  mutate: KeyedMutator<GameDetail>;
  /** The game is in play and the board has stopped asking for want of anything happening. */
  paused: boolean;
  /** Wakes a paused board, which asks at once. */
  resume: () => void;
  /** The cadence this board asks at while awake and looked at, for the page to say. */
  pollEvery: number;
} {
  const [polling, setPolling] = useState(initial.status === "active");
  const visible = usePageVisible();
  const every = pollEvery();

  /*
   * Waking asks at once, through SWR's own mutate — which does not exist until
   * `useSWR` below has run, so the wake reaches it through a ref.
   */
  const refetch = useRef<() => void>(() => {});
  const onWake = useCallback(() => refetch.current(), []);
  const { awake, stir } = useBoardAwake(onWake);

  const { data, mutate } = useSWR(`/api/games/${initial.id}`, fetcher, {
    fallbackData: initial,
    refreshInterval: pollInterval({ polling, awake, visible, every }),
    onSuccess: (latest) => setPolling(latest.status === "active"),
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    refetch.current = () => void mutate();
  }, [mutate]);

  /*
   * ANY CHANGE ON THE BOARD KEEPS IT AWAKE. SWR hands back the same object when
   * an answer is identical to the last, so a new `data` is a real change — a
   * move from either side, a reaction, an offer, the clock, a name — however
   * it arrived. A board that is changing is never put to sleep.
   */
  useEffect(() => {
    stir();
  }, [data, stir]);

  const game = data ?? initial;
  return { game, mutate, paused: polling && !awake, resume: stir, pollEvery: every };
}
