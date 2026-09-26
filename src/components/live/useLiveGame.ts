"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import useSWR, { type KeyedMutator } from "swr";

import type { Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import type { GameDetail, SeatsHere } from "@/lib/history/gameHistory.types";
import type { LiveBoardIntervals } from "@/lib/site/site.types";
import { pollEvery, pollInterval, waitingOnSomebodyHere } from "./pollCadence";
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
 *  - every `POLL_MS` (fifteen seconds) while somebody is looking at it, and
 *    every `POLL_FAST_MS` (three) while the player it is waiting on is on the
 *    site — John's one exception, see `POLL_FAST_MS`;
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
 * will eat up CPU time." Then, 2026-09-26, playing a friend phone to phone:
 * "Waiting 15 seconds is too long." The numbers live in `live.constants.ts`
 * with their reasons, the choice between them is `pollInterval`, and
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
 * one comes back settled. `seat` is the reader's own colour, or null for a
 * spectator: a board hurries only for a move somebody else is to make.
 * `intervals` are the operator's two numbers from the site panel, read where
 * the page rendered — so a change reaches a board at its next page load.
 */
export function useLiveGame(
  initial: GameDetail,
  seat: Stone | null,
  intervals: LiveBoardIntervals,
): {
  game: GameDetail;
  mutate: KeyedMutator<GameDetail>;
  /** The game is in play and the board has stopped asking for want of anything happening. */
  paused: boolean;
  /** Wakes a paused board, which asks at once. */
  resume: () => void;
  /** Whether the board is asking at all right now, and when its last answer came, for the countdown. */
  asking: boolean;
  answeredAt: () => number;
  /** The cadence this board asks at while awake and looked at, for the page to say. */
  pollEvery: number;
  /** Whether that is the fast cadence, because the player it waits on is here. */
  hurrying: boolean;
} {
  const [polling, setPolling] = useState(initial.status === "active");
  const visible = usePageVisible();
  const every = pollEvery(undefined, intervals.ordinaryMs);
  const fast = pollEvery(undefined, intervals.fastMs);
  /*
   * WHO IS HERE, AS LAST SAID. Only the polled answer carries it; a move's own
   * answer, a clock's and a remark's go into the cache without it, and nobody
   * left because somebody moved. So it is kept from the last answer that said,
   * rather than read off whatever the cache holds — and null until one has,
   * which asks at the ordinary cadence.
   */
  const [here, setHere] = useState<SeatsHere | null>(initial.here ?? null);
  /*
   * Whether this board is waiting on somebody who is here — decided below from
   * the game SWR hands back, and held here because the cadence has to be handed
   * to SWR before that game is. See the end of the hook.
   */
  const [otherHere, setOtherHere] = useState(false);

  /*
   * Waking asks at once, through SWR's own mutate — which does not exist until
   * `useSWR` below has run, so the wake reaches it through a ref.
   */
  const refetch = useRef<() => void>(() => {});
  const onWake = useCallback(() => refetch.current(), []);
  const { awake, stir } = useBoardAwake(onWake);

  /*
   * WHEN THE LAST ANSWER ARRIVED, so the page can say when the next ask is
   * due. `useSWR`'s `refreshInterval` is a timer nothing outside can read, so
   * the moment of each answer is written down in `onSuccess` and the countdown
   * is arithmetic on it — client-side only, no request of its own, and no
   * React state: a state update a second changed how often the board asked
   * under the cadence spec's fake clock, which is the one thing a countdown
   * to the next ask must not do.
   */
  const answeredAt = useRef<number>(0);
  const interval = pollInterval({ polling, awake, visible, otherHere, every, fast });
  const { data, mutate } = useSWR(`/api/games/${initial.id}`, fetcher, {
    fallbackData: initial,
    refreshInterval: interval,
    onSuccess: (latest) => {
      setPolling(latest.status === "active");
      const said = latest.here;
      if (said !== undefined) setHere((was) => (was?.black === said.black && was?.white === said.white ? was : said));
      // The moment of this answer, for the countdown to the next ask. A ref, not state: nothing re-renders for it.
      answeredAt.current = clockNow();
    },
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    refetch.current = () => void mutate();
  }, [mutate]);

  /*
   * ANY CHANGE ON THE BOARD KEEPS IT AWAKE — a move from either side, a
   * reaction, an offer, the clock, a name — however it arrived. A board that is
   * changing is never put to sleep.
   *
   * A change in CONTENT, not in the object. SWR usually hands back the same
   * object for an identical answer, and this used to trust that; but a new
   * object with the same game in it arrived at the very moment a board fell
   * asleep once the picture of every position was drawn beside it by itself,
   * and each one woke the board again — polling for the whole hour the idle
   * rule exists to stop. So the game is compared by what it says. The string
   * is a few kilobytes, made only when SWR hands over a new object.
   *
   * WHO IS HERE IS LEFT OUT. Somebody arriving or leaving is not something
   * happening on the board, and a player who dips in and out of the site must
   * not keep their opponent's board awake past `IDLE_STOP_MS`.
   */
  const content = useMemo(() => JSON.stringify(data === undefined ? null : { ...data, here: null }), [data]);
  useEffect(() => {
    stir();
  }, [content, stir]);

  const game = data ?? initial;
  /*
   * WHOSE TURN IT IS, from the engine, once per game SWR hands over. Any answer
   * can change it — the other seat's move from a poll, or the reader's own from
   * the move's answer — and the reader's own move is exactly when the board
   * starts waiting on somebody, so it is read off whatever the cache now holds.
   */
  const toPlay = useMemo(() => replayGame(game).toPlay, [game]);
  const waiting = waitingOnSomebodyHere({
    here,
    toPlay,
    seat,
    blackMemberId: game.blackMemberId,
    whiteMemberId: game.whiteMemberId,
  });
  /*
   * Handed back to the state the cadence above was worked out from: React
   * renders again at once, before anything is committed, so SWR is given the
   * new cadence in the same moment the game that changed it arrives — rather
   * than finishing a fifteen-second wait it started before the reader moved.
   */
  if (waiting !== otherHere) setOtherHere(waiting);

  // A stable getter, so the countdown can read the moment without anything re-rendering.
  const readAnsweredAt = useCallback(() => answeredAt.current, []);
  return {
    game,
    mutate,
    paused: polling && !awake,
    resume: stir,
    pollEvery: otherHere ? fast : every,
    hurrying: otherHere,
    // Asking at all: active, awake and looked at. Otherwise there is no next check to count down to.
    asking: interval > 0,
    answeredAt: readAnsweredAt,
  };
}

/** The clock, read from a callback — outside render, whatever the linter takes an inline callback for. */
function clockNow(): number {
  return Date.now();
}
