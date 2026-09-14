"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * A live board's address, kept on the position as play goes on — and the one
 * hand-back to the server when the game ends under the reader.
 *
 * ONE HOOK, BECAUSE AS TWO EFFECTS THEY FOUGHT. The board wrote its address
 * with the native `history.replaceState`, and `useLiveGame` called
 * `router.refresh()` when the game settled, promising "nothing flickers and
 * nothing is lost". Neither was true for most endings:
 *
 * - Next takes a native `replaceState` into its router as its own address
 *   ("pushState and replaceState calls integrate into the Next.js Router" —
 *   docs, getting-started/linking-and-navigating, Native History API; the
 *   patch is in next/dist/client/components/app-router.js, which dispatches a
 *   restore with the new URL and the tree the router already holds). The
 *   match opens as `/match/<id>`, the `[id]` route, and the address moves to
 *   `/match/<id>/<n>`, the `[move]` route. From then on the router's address
 *   names one route while its tree is the other's.
 * - `router.refresh()` asks for the router's address with the router's tree
 *   (refresh-reducer.js). The server answers for the `[move]` route, the tree
 *   does not match, and Next retries and then falls back to loading the whole
 *   document again (ppr-navigations.js). Seen as `/5?_rsc`, `/6?_rsc`, then a
 *   document load of `/6` — in CI's trace and on every board that had seen a
 *   move land since it opened.
 * - A board that had seen nothing land was worse off. Its router still held
 *   `/match/<id>`, so the refresh was consistent — but the move that ended the
 *   game also moved the address, in the same commit and just after it, and the
 *   restore that dispatched overtook the refresh. The answer came back and was
 *   never applied: the page stayed the live board for good.
 *
 * Proved by taking the native write away: with it gone, both boards made one
 * request each and became the record in place.
 *
 * So while the game is being played the address is still written natively —
 * a request to the server on every move, from every board, only to move a
 * number in the address bar, is a cost this site does not pay. At the ending
 * nothing is written natively: the page NAVIGATES to the position's address,
 * so the router fetches the route that address actually names, and the new
 * address and the filed page arrive together. The one case a refresh is right
 * for is a page whose address never moved — it opened on this very position
 * and nothing has landed since — where the router's address and tree still
 * agree, and asking for what it holds is exactly the question.
 *
 * It fires at most once per mount. `settled` is a state rather than a poll
 * callback because a poll is only one way the ending arrives — a winning move
 * of your own, a resignation and a flag claimed on time all put the finished
 * game into the cache with no fetch callback ever seeing it. See
 * `settledSinceRendered`.
 */
export function useMatchAddress({
  basePath,
  played,
  settled,
}: {
  /** The match's own address; undefined on a board that keeps no address. */
  basePath: string | undefined;
  /** Moves on the board, which is the position the address names. */
  played: number;
  /** The game has ended since this page was drawn as a live board. */
  settled: boolean;
}): void {
  const router = useRouter();
  const handedBack = useRef(false);
  /** Where this page opened, read before this hook ever writes the address. */
  const openedAt = useRef<string | null>(null);

  useEffect(() => {
    if (openedAt.current === null) openedAt.current = window.location.pathname;
    const position = basePath === undefined ? null : `${basePath}/${played}`;

    if (settled) {
      if (handedBack.current) return;
      handedBack.current = true;
      if (position === null || position === openedAt.current) router.refresh();
      else router.replace(position, { scroll: false });
      return;
    }

    if (position !== null && window.location.pathname !== position) {
      window.history.replaceState(null, "", position);
    }
  }, [basePath, played, settled, router]);
}
