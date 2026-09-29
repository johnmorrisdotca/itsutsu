"use client";

import { useCallback, useEffect, useRef } from "react";
import useSWR, { type KeyedMutator } from "swr";

import { pollEvery, pollInterval } from "@/components/live/pollCadence";
import { useBoardAwake } from "@/components/live/useBoardAwake";
import { usePageVisible } from "@/components/live/useLiveGame";
import type { OnlineTableView } from "@/lib/party/online/online.types";
import { tableWaits } from "@/lib/party/online/onlineSeats";
import type { LiveBoardIntervals } from "@/lib/site/site.types";

const fetcher = async (url: string): Promise<OnlineTableView> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not read the table.");
  return response.json();
};

/**
 * KEEPING A TABLE CURRENT, at the live board's price and with the live
 * board's own parts: `pollInterval` and `pollEvery` decide the cadence,
 * `useBoardAwake` stops it after six idle minutes, and a hidden tab asks
 * nothing (`refreshWhenHidden: false`; SWR asks the moment it is shown).
 *
 * What is the table's own is only whether to hurry — only while it waits on
 * somebody else who is here — and when to stop: once the table is over
 * (`tableWaits`); and the answer
 * the poll carries: the whole table when its version has moved, a 304 the
 * browser answers from its own copy when it has not.
 *
 * The page renders the table on the server and SWR starts from it
 * (`fallbackData`), so opening a table is one server call, not two.
 */
export function useOnlineTable(
  initial: OnlineTableView,
  intervals: LiveBoardIntervals,
): {
  view: OnlineTableView;
  mutate: KeyedMutator<OnlineTableView>;
  /** Waiting on somebody, and stopped asking for want of anything happening. */
  paused: boolean;
  resume: () => void;
  /** Whether the page asks at the fast cadence, because the seat it waits on is here. */
  hurrying: boolean;
  /** The cadence it asks at now, 0 when it does not. */
  every: number;
} {
  const visible = usePageVisible();
  const refetch = useRef<() => void>(() => {});
  const onWake = useCallback(() => refetch.current(), []);
  const { awake, stir } = useBoardAwake(onWake);
  const ordinary = pollEvery(undefined, intervals.ordinaryMs);
  const fast = pollEvery(undefined, intervals.fastMs);

  const { data, mutate } = useSWR(`/api/tables/${initial.id}`, fetcher, {
    fallbackData: initial,
    refreshInterval: (latest) => {
      const { polling, otherHere } = tableWaits(latest ?? initial);
      return pollInterval({ polling, awake, visible, otherHere, every: ordinary, fast });
    },
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    refetch.current = () => void mutate();
  }, [mutate]);

  const view = data ?? initial;
  // Anything happening at the table — a move, a seat taken or left — keeps the page awake.
  useEffect(() => {
    stir();
  }, [view.version, stir]);

  const { polling, otherHere } = tableWaits(view);
  const every = pollInterval({ polling, awake, visible, otherHere, every: ordinary, fast });
  return { view, mutate, paused: polling && !awake, resume: stir, hurrying: every > 0 && otherHere, every };
}
