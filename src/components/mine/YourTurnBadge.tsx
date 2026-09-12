"use client";

import useSWR from "swr";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MY_GAMES_COPY } from "./mine.constants";

const fetcher = async (url: string): Promise<{ yourMove: number } | null> => {
  const response = await fetch(url);
  // A visitor with no session gets nothing, and shows nothing.
  return response.ok ? response.json() : null;
};

/**
 * How many games are waiting on this browser, beside "Play" in the header.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * OUT OF THE MASTHEAD'S FLOW, WHICH IS THE WHOLE OF THE FIX
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The count arrives after hydration — see below for why it cannot come off
 * the server — and until now it arrived INTO the navigation bar's flow: 27
 * pixels of badge appended to a bar that has no room for them. Measured at
 * 768, an iPad's width, the wordmark and the bar and the gap between them
 * come to exactly the container's width, so those 27 pixels wrapped the bar
 * onto a line of its own and pushed every page down 36 of them a moment
 * after load. The masthead was 61 pixels tall, then 97.
 *
 * RESERVING THE WIDTH CANNOT FIX THAT, and would make it permanent. With no
 * slack at 768 a reserved slot wraps the masthead for EVERY reader on EVERY
 * page — including the signed-out ones, who will never have a count to show
 * — which is the same 36 pixels, taken all the time instead of sometimes.
 *
 * And a reserved slot could not be the right width in any case. "1" and "14"
 * are not the same number of pixels, and the side reserving the space is
 * exactly the side that does not know which of them is coming. A width
 * reserved for an unknown number of digits is a guess that is wrong as soon
 * as somebody's eleventh game is waiting.
 *
 * So the badge is taken out of the flow instead: a pip over the corner of the
 * link it is about. It contributes nothing to the bar's width, so its arrival
 * cannot move anything, at any screen width, however many digits it turns out
 * to hold. Anchored to the Play link, which carries `relative` for it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY IT IS NOT RENDERED ON THE SERVER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Because it would cost a query on every page load for every member, which is
 * the one cost this site rules out. "Waiting on you" is not a column on any
 * row: `fetchMyGames` reads every game this browser's seat cookies or this
 * member's account sit in, replays the ones whose turn was never written down,
 * and sorts what is left. `memberRowFor` — the one row every page already
 * reads, cached per request — does not carry the count, and nothing else does.
 *
 * A cheaper `count` was considered and rejected: it can only count the rows
 * that carry a settled turn, so it would quietly under-report on every older
 * game, and a badge that says 12 when 14 are waiting is a plausible number
 * standing in for an answer nobody has. See AGENTS.md, "Nothing Answers What
 * It Cannot Answer".
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND THERE IS NO INTERVAL, WHICH IS THE OTHER HALF OF THE SAME ARGUMENT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This asked every thirty seconds. On a serverless deployment that is one
 * invocation every thirty seconds per OPEN TAB per signed-in member, for ever,
 * whether or not anybody is looking — a bill that grows with how long the site
 * is left open rather than with how much it is used. The site's owner rules
 * that out twice over: no extra cost, ever, and no interval polling on
 * principle. A count in the corner of the navigation bar is the last thing
 * that should be buying invocations by the minute.
 *
 * So it is read when there is a reason to read it:
 *
 * - **On mount**, which is on every page. `SiteHeader` is mounted by each
 *   PAGE rather than by the layout, and a page re-renders on navigation —
 *   the same mechanism the XP toasts rely on, and it is why moving around the
 *   site keeps the count current for free.
 * - **On focus**, so a tab left open behind other work is right again the
 *   moment somebody comes back to it. That is the one case an interval was
 *   really serving, and coming back to the tab is a better signal than a
 *   timer: it happens when somebody is there to read the answer.
 *
 * `dedupingInterval` is written down rather than left to the default, because
 * it is the thing that keeps "read it on every page" from meaning "read it on
 * every click". Two seconds: a burst of navigation — a double click, a run
 * through three pages — is one fetch, while a deliberate move and then a look
 * at the queue is two, which is right. Longer would be cheaper and would start
 * showing a stale count immediately after the move that changed it, which is
 * precisely when somebody is looking.
 *
 * WHAT IT COSTS, SAID PLAINLY: the count can be stale between navigations. A
 * game somebody else moves in while you sit on one page is not shown until you
 * open another page or come back to the tab. That is accepted — the move you
 * make yourself already navigates, and the alternative is a timer nobody asked
 * for on a bill nobody wants.
 */
export function YourTurnBadge() {
  const { data } = useSWR("/api/games/mine", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: true,
    dedupingInterval: 2_000,
  });
  const count = data?.yourMove ?? 0;
  return (
    /*
     * The slot is always here, empty or not, and is what a browser test waits
     * on: `data-ready` says the browser has taken this over, so "no badge" can
     * be told from "asked before the page had answered". An absence asserted
     * without that is true for a moment on every page — AGENTS.md, "An Absence
     * Is Only Meaningful After A Presence Has Been Waited For".
     *
     * `right` and no `left`, so the box shrink-wraps whatever number it is
     * handed and grows leftwards over the word rather than rightwards into the
     * next link.
     */
    <span
      className="absolute -top-2 -right-1 flex items-center"
      data-testid="your-turn-slot"
      {...readyMark(useHydrated())}
    >
      {count === 0 ? null : (
        <span
          className="inline-flex min-w-5 items-center justify-center rounded-full bg-moss px-1.5 text-[0.65rem] font-semibold text-paper"
          title={MY_GAMES_COPY.yourTurn(count)}
          aria-label={MY_GAMES_COPY.yourTurn(count)}
          data-testid="your-turn-badge"
        >
          {count}
        </span>
      )}
    </span>
  );
}
