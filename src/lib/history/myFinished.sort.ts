import type { SortSpec } from "@/lib/api/paging.types";

/**
 * WHAT THE QUEUE'S FINISHED GROUP ORDERS BY, AND WHAT PAGES IT.
 *
 * Its own module beside `gameHistory.sort.ts`, `ladder.sort.ts` and
 * `xpHistory.sort.ts`, for their reason rather than for tidiness:
 * `paging.coverage.test.ts` imports every spec on the site to check it, and a
 * spec declared inside the module that queries would drag `server-only` and a
 * `PrismaClient` into that gate.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE COLUMN IS A PAIR, AND THE READ IS TWO RUNS BECAUSE OF IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A game's age on this page is `lastMoveAt ?? playedAt` — `MyGame.since`, which
 * is what each row prints ("3 days ago") and what `staysInMyList` measures. It
 * is not one column, and Prisma cannot order by a `COALESCE`.
 *
 * So the read is the move `myListWindow` already makes for the same expression:
 * TWO BRANCHES THAT PARTITION THE ROWS, since `lastMoveAt` is either null or it
 * is not. `myFinished.ts` reads one page from each run — the rows with a last
 * move ordered by this column, the rows without one ordered by `playedAt` — and
 * merges them. Both runs take the SAME cursor, because a position in the merged
 * order is "(age, id) after this", which is the identical comparison in either
 * run with only the column that holds the age differing. See `keysetWhere`.
 *
 * This column is the one declared because it holds all but a handful of the
 * rows: `lastMoveAt` is stamped at creation by `createLiveGame` and moved by
 * every move and every ending, so a null means a row some other path wrote. The
 * null run's order is `playedAt`, which `Game_playedAt_idx` answers.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE INDEX, WHICH WAS MEASURED RATHER THAN ASSUMED
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `retention.ts` says an index on `lastMoveAt` "could not improve on that and
 * would be read by nothing else". That was true while the column was only a
 * FILTER over the member's own rows, and it stopped being true the moment the
 * column became an ORDER: read with `EXPLAIN (ANALYZE, BUFFERS)` on the
 * development database on 2026-09-12, for the member holding 571 finished games
 * of 6,411, one page of six goes from
 *
 *   296 buffers / 0.97 ms   bitmap-OR of the three member indexes, then a
 *                           top-N heapsort of all 571 rows
 *   58 buffers / 0.12 ms    backward scan of `Game_lastMoveAt_idx`, 7 rows
 *                           examined, incremental sort
 *
 * and for a member holding 19 of 6,411 the planner DECLINES the index and takes
 * the heapsort (32 buffers / 0.14 ms) — correctly, because scanning a global
 * index to find six of somebody's rows is worse the sparser they are. Which is
 * the property worth stating: with or without the index the cost is bounded by
 * the member's own rows, and the `LIMIT` is what stops 571 of them reaching
 * Node. The index is a sixfold win for the heaviest reader on the page they
 * open daily, and costs one B-tree on a table Postgres holds in a few pages.
 */
/**
 * The two columns that can hold a finished game's age — `lastMoveAt` where it
 * has one, `playedAt` where it does not.
 *
 * A UNION although only one of them is declared below, and that is the point:
 * the null run's read orders by `playedAt` and its keyset comparison is built
 * from a choice naming that field, so the type has to admit it or `myFinished.ts`
 * would need a cast to say a thing that is true. A cast there would also make
 * any OTHER wrong field name compile.
 */
export type MyFinishedField = "lastMoveAt" | "playedAt";

export const MY_FINISHED_SORT: SortSpec<MyFinishedField> = {
  of: "your finished games",
  columns: [
    {
      /*
       * There is one order and a reader cannot ask for another, so the word
       * never appears in an address today. It is still declared, because the
       * cursor carries it and `decodeCursor` refuses a cursor whose sort is not
       * the one being asked for — which is how a stale link starts the list
       * again instead of paging from a position in an ordering that is gone.
       */
      param: "finished",
      field: "lastMoveAt",
      label: "Finished",
      // Newest first: a group called "Lately finished" means the last few.
      firstPress: "desc",
      /*
       * NOT `nullable`, and this is the one flag worth getting right. The
       * convention's nullable handling orders nulls LAST and lets a cursor say
       * "I am among the nulls now" — which is a DIFFERENT order from this one.
       * A finished game with no `lastMoveAt` is not sorted last here; it is
       * sorted by `playedAt`, in its proper place among the rest, by the second
       * run. Declaring it nullable would put the null run at the end of the
       * list and hand out cursors that skip it, which is exactly the fault
       * `keysetWhere`'s own comment describes.
       */
      index: "Game_lastMoveAt_idx",
    },
  ],
  fallback: { param: "finished", direction: "desc" },
  // A game is keyed by the eight characters in its every address.
  tiebreak: "id",
};

/**
 * How many finished games the queue shows without being asked — the number the
 * group has printed since it existed, now the size of a page rather than the
 * size of a slice of everything.
 */
export const MY_FINISHED_PAGE = 5;

/**
 * And how many when the reader opens the group with `?all=finished`.
 *
 * The convention's own default, which is what `/history` and the ledger hand
 * back: a screenful and a bit. "Show all" cannot mean ALL any more — that was
 * the read this change exists to remove — so it means one full page with the
 * true total above it and a way on to the next, which is the same promise every
 * other list on this site keeps.
 */
export const MY_FINISHED_PAGE_OPEN = 20;

/** The most anybody may ask for at once, however they ask. */
export const MY_FINISHED_PAGE_MAX = 50;
