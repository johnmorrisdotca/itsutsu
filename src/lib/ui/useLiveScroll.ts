"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PagedEnvelope } from "@/lib/api/paging.types";

/**
 * LIVE SCROLLING, AS AN ENHANCEMENT AND NOT AS THE LIST.
 *
 * The server renders the first page and a pager that works with no JavaScript.
 * This appends the pages after it, in the browser, when the reader gets near the
 * end — and where it cannot, the pager is still there. That order matters: the
 * list is built so that the enhancement failing leaves a working page behind,
 * rather than built on the enhancement with a fallback bolted under it.
 *
 * NOTHING HERE RUNS ON A TIMER. A fetch happens when a reader scrolls near the
 * end of what they have, and at no other moment. John's objection to interval
 * polling is about what it costs — a page that asks every few seconds asks
 * whether anybody is reading it or not, on every open tab, for ever — and an
 * `IntersectionObserver` is the version of this that costs one request per page
 * a person actually reached.
 *
 * CURSORS, NOT OFFSETS, and this is the consumer that could not have been built
 * honestly without them. Appending `skip: 20` after a game has finished above
 * the page shows a row twice; appending after one is deleted skips a row
 * entirely. Either way the reader is looking at a list that is quietly wrong and
 * nothing says so. See the head of `paging.cursor.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT WILL NOT DO, AND WHY EACH IS DELIBERATE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * - **It does not revalidate.** A page already fetched is never fetched again —
 *   no refetch on focus, no refetch on reconnect. A record is a record; rows do
 *   not change once they are written, and re-reading them would be a cost with
 *   nothing behind it.
 * - **It does not retry for ever.** One failure stops it and reports `failed`,
 *   which is what brings the pager back. Retrying silently would leave a reader
 *   scrolling at the end of a list that has more in it and no way to say so.
 * - **It never loads two pages at once.** The observer can fire twice before
 *   React has re-rendered, so the cursor in flight is held in a ref rather than
 *   in state — state is the thing that has not updated yet.
 */

export type LiveScrollState<Item> = {
  /** The pages appended after the server's, in order. Never includes the first. */
  more: Item[];
  /** Where the list has got to; null once it is complete. */
  next: string | null;
  loading: boolean;
  /**
   * A fetch failed and this has given up.
   *
   * The one state the caller MUST act on: it is what says the pager has to come
   * back. Silence here would leave a reader at the bottom of a partial list with
   * nothing on the page admitting there is more.
   */
  failed: boolean;
  /** A callback ref for the element at the end of the list. */
  sentinel: (node: HTMLElement | null) => void;
};

/** How far before the end of the list to start reading the next page. */
const LOOK_AHEAD = "400px";

type Pages<Item> = {
  /** Which request these pages belong to. See `asked` below. */
  asked: string;
  items: Item[];
  next: string | null;
  failed: boolean;
};

export function useLiveScroll<Item>({
  endpoint,
  from,
}: {
  /**
   * The listing address WITHOUT a cursor — filters, sort and limit included.
   * A `cursor` is appended to it for each page.
   */
  endpoint: string;
  /** The cursor the server's own page ended at, or null when it was the whole list. */
  from: string | null;
}): LiveScrollState<Item> {
  /*
   * WHICH REQUEST THESE PAGES BELONG TO.
   *
   * A reader changing the sort or a filter gets a new server render, and this
   * component keeps its React state across it — so without something to compare,
   * the pages appended under the OLD ordering would still be sitting below the
   * new first page. Rows from two different sorts, interleaved, with nothing
   * saying so.
   *
   * Read THROUGH rather than reset in an effect: an effect runs after the render
   * that used the stale list, so there would be one frame showing the wrong
   * rows. Comparing here means the wrong rows are never rendered at all.
   */
  const asked = `${endpoint}|${from ?? ""}`;
  const [pages, setPages] = useState<Pages<Item>>(() => ({
    asked,
    items: [],
    next: from,
    failed: false,
  }));
  const current: Pages<Item> =
    pages.asked === asked ? pages : { asked, items: [], next: from, failed: false };

  const [loading, setLoading] = useState(false);
  /** The cursor being fetched, so an observer firing twice cannot fetch it twice. */
  const inFlight = useRef<string | null>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const load = useCallback(
    async (cursor: string) => {
      if (inFlight.current !== null) return;
      inFlight.current = cursor;
      setLoading(true);
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("cursor", cursor);
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`The record answered ${response.status}.`);
        const body = (await response.json()) as PagedEnvelope<Item>;
        if (!Array.isArray(body.items)) throw new Error("That was not a page of anything.");

        setPages((held) => {
          /*
           * The answer to a request nobody is waiting for any more. A reader who
           * changed the sort while this was in the air has a different list on
           * screen now, and appending to it would mix two orderings.
           */
          if (held.asked !== asked) return held;
          return {
            asked,
            items: [...held.items, ...body.items],
            next: typeof body.next === "string" && body.next !== "" ? body.next : null,
            failed: false,
          };
        });
      } catch {
        /*
         * Given up, and said so. `failed` is what brings the pager back — see
         * the head of this file. Nothing is logged: a reader who lost their
         * connection mid-scroll does not need a console entry, they need the
         * control that still works.
         */
        setPages((held) => (held.asked === asked ? { ...held, failed: true } : held));
      } finally {
        inFlight.current = null;
        setLoading(false);
      }
    },
    [asked, endpoint],
  );

  useEffect(() => {
    if (node === null) return;
    if (current.next === null || current.failed) return;
    const cursor = current.next;

    /*
     * A browser too old for this simply never scrolls a page in, and the pager
     * is what it has. That is the enhancement failing safe rather than a feature
     * detection wrapped round a polyfill.
     */
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void load(cursor);
      },
      { rootMargin: LOOK_AHEAD },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, current.next, current.failed, load]);

  return {
    more: current.items,
    next: current.next,
    loading,
    failed: current.failed,
    sentinel: setNode,
  };
}
