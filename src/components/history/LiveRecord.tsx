"use client";

import { HistoryTable } from "./HistoryTable";
import { Pager } from "./Pager";
import { countText } from "@/lib/rating/figures";
import type { GameSummary, Pagination } from "@/lib/history/gameHistory.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { useLiveScroll } from "@/lib/ui/useLiveScroll";

/**
 * THE RECORD, WITH THE PAGES AFTER THE FIRST ONE ARRIVING AS THE READER GETS
 * TO THEM.
 *
 * The first page is rendered on the server, by `RecordPage`, and handed here as
 * `first`. Everything this adds is an enhancement on top of a page that already
 * worked: with no JavaScript, or before React has attached, or after a failed
 * fetch, what is on screen is the server's page and the pager — which is exactly
 * what was there before this component existed.
 *
 * ONE CONTROL AT A TIME, NEVER BOTH. A pager and a scroller are two ways to ask
 * for the next page, and a page offering both leaves a reader wondering whether
 * pressing Next will lose what they have scrolled. So the pager is what is
 * there until live scrolling is actually working, and then it is replaced by a
 * line saying how much of the record is on screen.
 *
 * WHICH IS DECIDED BY `from`, NOT BY THE CURRENT CURSOR, and the difference is
 * the whole correctness of the swap. Reading the live cursor would bring the
 * pager back the moment a reader scrolled to the END of the record — and it
 * would come back saying "Page 1 of 12" to somebody with all twelve pages in
 * front of them. `from` is a fact about the server's page that does not change:
 * null means the record fitted in one page and the pager is the honest control;
 * anything else means there is more to scroll to.
 *
 * WAITING FOR HYDRATION IS NOT COSMETIC. `useHydrated` is false on the server,
 * so the server renders the pager and the browser swaps it — which is the only
 * order that leaves a working control on screen at every moment. It also gives
 * a browser test something real to wait for: `ready(page, "live-record")` is the
 * moment scrolling starts appending rather than a guess about how fast the page
 * was.
 */
export function LiveRecord({
  first,
  from,
  pagination,
  endpoint,
  at,
  params,
}: {
  /** The server's own page, already rendered against the same filters. */
  first: GameSummary[];
  /** Where that page ended, or null when it was the whole record. */
  from: string | null;
  pagination: Pagination;
  /** The listing address the next pages come from, with the filters and no cursor. */
  endpoint: string;
  /** Where the pager's links point, when the pager is what is on screen. */
  at: string;
  params: Record<string, string>;
}) {
  const hydrated = useHydrated();
  const { more, next, loading, failed, sentinel } = useLiveScroll<GameSummary>({
    endpoint,
    from,
  });

  /*
   * There is more to scroll to, the browser has taken over, and nothing has
   * gone wrong. Any one of those being false means the pager.
   */
  const scrolling = from !== null && hydrated && !failed;
  const shown = first.length + more.length;

  return (
    <div className="flex flex-col gap-4" data-testid="live-record" {...readyMark(hydrated)}>
      <HistoryTable items={[...first, ...more]} />

      {scrolling ? (
        <>
          {/*
            The element the observer watches. It has to be BELOW the list and
            have height, or an observer with a look-ahead margin can be
            intersecting from the moment the page loads and read every page at
            once — which is the fetch-on-a-timer this exists to avoid, arriving
            by another door.
          */}
          <div ref={sentinel} className="h-8" aria-hidden data-testid="record-sentinel" />
          <p className="text-sm text-muted" aria-live="polite" data-testid="record-progress">
            {next === null ? (
              <>
                All {countText(pagination.total)} game{pagination.total === 1 ? "" : "s"} shown.
              </>
            ) : (
              <>
                {countText(shown)} of {countText(pagination.total)} shown
                {loading ? " — reading more…" : ". Keep scrolling for more."}
              </>
            )}
          </p>
        </>
      ) : (
        <>
          {/*
            Said out loud rather than left as a pager that silently reappeared.
            A reader who was scrolling and is now looking at page links deserves
            to know why the behaviour changed under them.
          */}
          {failed ? (
            <p className="text-sm text-muted" data-testid="record-scroll-failed">
              More games could not be loaded just now — the pages below still work.
            </p>
          ) : null}
          <Pager pagination={pagination} params={params} basePath={at} />
        </>
      )}
    </div>
  );
}
