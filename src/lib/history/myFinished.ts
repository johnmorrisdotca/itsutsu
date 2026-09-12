import "server-only";

import type { Prisma } from "@prisma/client";

import {
  decodeCursor,
  encodeCursor,
  keysetOrderBy,
  keysetWhere,
  takeFor,
} from "@/lib/api/paging.cursor";
import type { Cursor, CursorPosition, SortChoice } from "@/lib/api/paging.types";
import { prisma } from "@/lib/prisma";

import { QUEUE_SELECT, type SeatRow } from "./myGamesRows";
import { NOT_A_REFUSED_OFFER } from "./offers";
import {
  MY_FINISHED_SORT,
  type MyFinishedField,
} from "./myFinished.sort";

/**
 * ONE PAGE OF THE QUEUE'S FINISHED GROUP.
 *
 * The read this module exists to bound: `/play` and every `/api/games/mine` the
 * badge asks for used to bring back EVERY game the member had ever sat in.
 * 0.169.3 put the member's retention window into the query, which fixed it for
 * everybody who has chosen a window — and left the DEFAULT, "keep finished games
 * for ever", reading the lot, because there is no date to bound it with. John's
 * own account holds 571 finished games on the development database.
 *
 * So the finished group pages, and nothing else here does. See `myGames.ts` for
 * the split and why the other groups must stay a complete read.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO RUNS, ONE CURSOR, BECAUSE THE ORDER IS A `COALESCE`
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The order is the age the page prints, `lastMoveAt ?? playedAt`, and Prisma
 * cannot order by an expression. `myListWindow` met the same wall and answered
 * it the same way: two branches that PARTITION the rows, since `lastMoveAt` is
 * either null or it is not.
 *
 * Each run is read one page deep and the two are merged. That is correct rather
 * than approximate, and the reason is the standard one for merging sorted runs:
 * the first N of a merge of two ordered lists can only come from the first N of
 * each, so reading N+1 from each is enough to produce the page AND to know
 * whether anything follows it.
 *
 * BOTH RUNS TAKE THE SAME CURSOR. A position in the merged order is "(age, id)
 * strictly after this one", which is the identical comparison in either run with
 * only the column holding the age differing — so `keysetWhere` builds it twice
 * from one position, and the arithmetic stays in the one place that is tested.
 * Two positions in one cursor would be two things to keep in step for no gain.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IS NOT READ HERE, AND WHY THE HALVES CANNOT OVERLAP
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `FINISHED_ONLY` and `DEBT_ONLY` are exact complements, written out rather than
 * one derived from the other with a `NOT`, because a reader has to be able to
 * see that they are. A row is in exactly one of them:
 *
 *   FINISHED_ONLY   status is not active AND it is not an offer in any state
 *   DEBT_ONLY       status IS active, OR it is an offer in some state
 *
 * The offer columns are in both because A REFUSED OFFER IS FILED `status:
 * finished` (see `offers.ts`) and it is not a finished GAME — it belongs to the
 * offerer's own group, complete, however old it is. Dropping that from the debt
 * read would have made a decline disappear as soon as the page past it filled
 * up, which is the one thing on `/play` somebody has to be told.
 */

/**
 * A finished game, as far as this read is concerned. The complement of `DEBT_ONLY`.
 *
 * `NOT_A_REFUSED_OFFER` rather than `declinedAt: null, withdrawnAt: null` typed
 * out again: it is THE predicate every listing of games needs, and a second
 * spelling of it is a thing that can come to disagree with the first. This is
 * also the answer `offers.coverage.test.ts` asks every read of the `Game` table
 * for, and the one that applies here — a declined offer is filed `status:
 * finished`, so a read asking for "not active" sees it unless it is told not to.
 *
 * `offeredAt: null` is on top of that and is a different claim: it excludes an
 * offer NOBODY HAS ANSWERED, which belongs to the offerer's own group and is
 * never hidden by age. Nothing files one of those as finished today, so this is
 * the rule said rather than a case being handled — see `myListWindow`'s second
 * branch, which says it for the same reason.
 */
export const FINISHED_ONLY = {
  status: { not: "active" },
  offeredAt: null,
  ...NOT_A_REFUSED_OFFER,
} as const satisfies Prisma.GameWhereInput;

/** Everything the queue must read completely: anything running, and every offer. */
export const DEBT_ONLY = {
  OR: [
    { status: "active" },
    { offeredAt: { not: null } },
    { declinedAt: { not: null } },
    { withdrawnAt: { not: null } },
  ],
} as const satisfies Prisma.GameWhereInput;

/** The one order this list has. Nobody may ask for another, so nothing parses one. */
const NEWEST_FIRST: SortChoice<MyFinishedField> = {
  column: MY_FINISHED_SORT.columns[0],
  direction: MY_FINISHED_SORT.fallback.direction,
  /*
   * `asked: false` because no reader chose it. It only decides how a heading
   * flips, and this list has no heading to press.
   */
  asked: false,
};

/**
 * The same order, read off the column that holds the age in the null run.
 *
 * A derived choice rather than a second declared column: `MY_FINISHED_SORT`
 * lists what a READER may ask for, and there is one answer — "newest first".
 * Which column that means is an implementation of the pair, and declaring
 * `playedAt` as a second sortable column would offer an order nothing wants and
 * make `sortWords` name it in an address.
 */
const NEWEST_FIRST_BY_PLAYED: SortChoice<MyFinishedField> = {
  ...NEWEST_FIRST,
  column: { ...NEWEST_FIRST.column, field: "playedAt" },
};

export type MyFinishedPage = {
  /** The page, newest first, already merged across the two runs. */
  rows: SeatRow[];
  /** Where the page ended, or null when it was the last one. */
  next: Cursor | null;
};

/**
 * A row's age as this list orders by it: its last move, else when it was played.
 *
 * The same expression as `MyGame.since` and as `myListWindow`'s two date
 * branches. Three readers of one rule, which is a thing to keep an eye on — but
 * they want it in three shapes (a Date to compare, an ISO string to print, a
 * `where` to send) and `retention.test.ts` already proves the pair of them agree.
 */
function ageOf(row: Pick<SeatRow, "lastMoveAt" | "playedAt">): Date {
  return row.lastMoveAt ?? row.playedAt;
}

/**
 * Newest age first, ties broken by the id ascending — the same order both runs
 * were read in, so the merge cannot disagree with either of them.
 *
 * PLAIN `<` RATHER THAN `localeCompare`, because the tiebreak has to mean what
 * Postgres's `id > …` means in the cursor or a page boundary could repeat a row
 * or skip one. A game's id is `[0-9a-z]{4}-[0-9a-z]{4}` — a fixed shape, so the
 * hyphen is only ever compared against another hyphen and the three orderings
 * (this one, `en_US.utf8`, ICU) cannot differ. Checked against the database on
 * 2026-09-12 rather than assumed.
 */
function newestFirst(a: SeatRow, b: SeatRow): number {
  const diff = ageOf(b).getTime() - ageOf(a).getTime();
  if (diff !== 0) return diff;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** One run of the pair: the rows with a last move, or the rows without one. */
async function oneRun(
  seats: Prisma.GameWhereInput,
  window: Prisma.GameWhereInput | null,
  part: { branch: Prisma.GameWhereInput; by: SortChoice<MyFinishedField> },
  after: CursorPosition | null,
  limit: number,
): Promise<SeatRow[]> {
  return prisma.game.findMany({
    where: {
      ...FINISHED_ONLY,
      ...part.branch,
      /*
       * THE SEATS, THE WINDOW AND THE KEYSET ALL IN AN `AND`, never spread over
       * the `where`. Each of the three is itself an `OR` and one object cannot
       * hold two, so spreading them would silently replace one with another —
       * the trap `myListWindow`'s own comment names, one layer along, where
       * there are now three of them rather than one.
       */
      AND: [
        seats,
        ...(window === null ? [] : [window]),
        ...(after === null ? [] : [keysetWhere(MY_FINISHED_SORT, part.by, after)]),
      ],
    },
    /*
     * THE ORDER COMES OFF THE SAME CHOICE THE KEYSET DID. `keysetOrderBy` rather
     * than a literal, because the order and the comparison are two halves of one
     * claim: a page ordered any other way than the cursor was built for repeats
     * rows and skips rows, and a literal here would agree by coincidence until
     * somebody added a tiebreaker to one of them.
     */
    orderBy: keysetOrderBy(MY_FINISHED_SORT, part.by) as Prisma.GameOrderByWithRelationInput[],
    take: takeFor(limit),
    select: QUEUE_SELECT,
  });
}

/**
 * One page of the member's finished games, newest first.
 *
 * `seats` is the three-way `OR` that says which games are theirs and `window`
 * the retention bound, both built by `myGames.ts` so that the two halves of the
 * split are narrowed by one definition rather than two.
 *
 * AN UNREADABLE CURSOR STARTS THE LIST AGAIN rather than being refused. That is
 * the convention's one parameter answered by carrying on, and the reason applies
 * exactly here: a cursor is something this site handed out, so a stale one means
 * a link from before rather than a reader who did anything wrong, and the first
 * page is never the wrong answer to it.
 */
export async function myFinishedPage(input: {
  seats: Prisma.GameWhereInput;
  window: Prisma.GameWhereInput | null;
  limit: number;
  cursor: Cursor | null;
}): Promise<MyFinishedPage> {
  const after = input.cursor === null ? null : decodeCursor(input.cursor, NEWEST_FIRST);

  /*
   * BOTH RUNS AT ONCE. They are independent reads of one page each, so waiting
   * for the first before asking for the second would add a round trip to every
   * visit for nothing. The null run is empty for almost every member — a null
   * `lastMoveAt` means a row `createLiveGame` did not write — and it is still
   * asked for, because "almost every" is a fact about today's rows.
   */
  const [withMove, withoutMove] = await Promise.all([
    oneRun(input.seats, input.window, { branch: { lastMoveAt: { not: null } }, by: NEWEST_FIRST }, after, input.limit),
    oneRun(input.seats, input.window, { branch: { lastMoveAt: null }, by: NEWEST_FIRST_BY_PLAYED }, after, input.limit),
  ]);

  const merged = [...withMove, ...withoutMove].sort(newestFirst);
  const rows = merged.slice(0, input.limit);
  /*
   * ONE MORE ROW THAN THE PAGE IS WHAT ANSWERS "IS THERE MORE", and it is asked
   * of the MERGE rather than of either run. A run that came back short may still
   * sit beside one that did not, and a run that came back long may have every
   * one of its extra rows older than the page's last — either way the merged
   * length is the only thing that knows. `takeFor` on each run is what makes
   * that available: see `nextCursorFrom`, whose argument this is.
   */
  if (merged.length <= input.limit) return { rows, next: null };

  const last = rows[rows.length - 1];
  return {
    rows,
    next: encodeCursor({
      /*
       * The AGE, not the column. A cursor over `lastMoveAt` alone could not
       * point at a row in the null run, and the next page asks both runs for
       * "after this age" — which is the whole reason one cursor serves two.
       */
      value: ageOf(last).toISOString(),
      id: last.id,
      sort: { param: NEWEST_FIRST.column.param, direction: NEWEST_FIRST.direction },
    }),
  };
}

/**
 * How many finished games the member has, over exactly the set the page is a
 * page of.
 *
 * ONE INDEXED AGGREGATE, AND ONLY WHEN THE PAGE IS NOT THE WHOLE GROUP — see
 * `myGames.ts`, which asks for it only when a cursor came back. That is what
 * keeps it off the reader who has three finished games, which is most of them.
 *
 * WHAT IT COSTS, measured on the development database on 2026-09-12 for the
 * member holding 571 of them: 290 buffers and 0.38 ms, the same bitmap-OR of
 * the three member indexes the page's own read is bounded by. It is genuinely
 * new work — today's whole-list read got the number free as an array's length —
 * and it is kept because `shownGroup` prints the group's TRUE size and
 * `?all=finished` promises to page to exactly that many. A count that is a
 * guess, or a heading that stops saying how many there are, both break the
 * promise this site has a build gate about.
 */
export async function myFinishedTotal(input: {
  seats: Prisma.GameWhereInput;
  window: Prisma.GameWhereInput | null;
}): Promise<number> {
  return prisma.game.count({
    where: {
      ...FINISHED_ONLY,
      AND: [input.seats, ...(input.window === null ? [] : [input.window])],
    },
  });
}
