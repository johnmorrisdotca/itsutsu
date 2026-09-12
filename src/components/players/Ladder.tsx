import Link from "next/link";

import { LadderMore } from "./LadderMore";
import { LADDER_SORT_SPEC } from "@/lib/rating/ladder.sort";
import { fetchLadderPage, readLadderPaging } from "@/lib/rating/ladder";
import { isRefusal } from "@/lib/api/paging";
import type { RecordSort } from "./recordSort";

/**
 * The site ladder: everybody by rating, best first — and by any other column
 * they press.
 *
 * The per-game ladders live on /champions, and this says so — a rating here
 * is across every game, which is not what somebody who wants to know the best
 * Reversi player is asking.
 *
 * Every column after the name is drawn by `RecordTable`, which is the same
 * table the members list, the computer players, a member's own record and
 * every per-game ladder use. This page used to put the rating second and the
 * counts after it; the members list put the counts first and the rating
 * seventh. Both were reasonable and the pair of them was the thing John was
 * looking at.
 *
 * WHICH FIVE OF THE TEN HEADINGS SORT is `LADDER_SORT_SPEC`'s decision, and it
 * writes down why each of the other five cannot: win rate is arithmetic on three
 * columns and rounded besides, a streak is two columns with no order over them,
 * a tier is a coarser sort by rating, and Joined is on a table this does not
 * read. Faking any of those in the browser would reorder twenty-five rows of
 * however many there are and present the result as the ladder.
 *
 * THE TABLE ITSELF IS IN `LadderMore.tsx`, which is a client component, and the
 * split is load-bearing rather than tidiness: this file imports
 * `fetchLadderPage`, which imports `server-only`. A row builder shared between
 * the two would pull that into the browser bundle and the build would fail — so
 * everything a browser draws lives over there, and this file reads the database
 * and hands down what it found.
 */
export async function Ladder({
  /** The address as it stands, so a heading's press keeps the tab and the rest. */
  query,
}: {
  query: string;
}) {
  const params = new URLSearchParams(query);
  const asked = readLadderPaging(params);
  /*
   * A refused sort is the record's own choice one page over: the reader gets the
   * ladder they came for and a line saying the order was not applied. A 400 in
   * the middle of a page of tabs would be an error somebody who followed a stale
   * link cannot act on.
   */
  const refused = isRefusal(asked);
  const paging = refused
    ? (readLadderPaging(new URLSearchParams()) as Exclude<typeof asked, { error: string }>)
    : asked;
  const page = await fetchLadderPage(paging);

  const sort: RecordSort = {
    at: "/players",
    // The address as a string: this crosses into a client component. See `RecordSort`.
    query,
    spec: LADDER_SORT_SPEC,
    current: paging.sort,
    /*
     * The five headings the database can order by, named against the slots
     * `RecordTable` draws. The other four slots are left out, which is what
     * makes them plain text — see `LADDER_SORT_SPEC` for the reason each cannot
     * be ordered by, and `recordSort.coverage.test.ts` for the gate that refuses
     * a word this spec does not have.
     */
    by: { played: "played", won: "won", lost: "lost", drawn: "drawn", rating: "rating" },
  };

  return (
    <div className="flex flex-col gap-4" data-testid="ladder-section">
      <p className="text-sm text-muted">
        Ratings are Elo, starting at 1600. A player is unrated for the first few games,
        provisional while the rating settles, and established after twenty. Press a heading to
        sort by it. Each game keeps a ladder of its own too: see the{" "}
        <Link href="/champions" className="underline underline-offset-4" data-testid="champions-link">
          champions <span className="font-mincho">名人</span>
        </Link>
        .
      </p>
      {refused ? (
        <p className="text-sm text-muted" data-testid="ladder-sort-refused">
          That was not an order the ladder has, so this is the ladder by rating.
        </p>
      ) : null}
      <LadderMore
        first={page.items}
        from={page.next}
        total={page.total}
        endpoint={`/api/ladder?${ladderEndpoint(paging.sort, paging.limit)}`}
        sort={sort}
      />
    </div>
  );
}

/** The listing address the next pages come from, without a cursor. */
function ladderEndpoint(
  sort: RecordSort["current"],
  limit: number,
): string {
  const api = new URLSearchParams();
  api.set("sort", `${sort.column.param}:${sort.direction}`);
  api.set("limit", String(limit));
  return api.toString();
}
