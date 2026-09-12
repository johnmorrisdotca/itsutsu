import "server-only";

import { isRefusal, parseCursor, parseLimit, parseSort } from "@/lib/api/paging";
import {
  decodeCursor,
  keysetOrderBy,
  keysetWhere,
  nextCursorFrom,
  takeFor,
} from "@/lib/api/paging.cursor";
import type { PagedEnvelope, PagingRefusal, SortChoice } from "@/lib/api/paging.types";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

import { XP_BOARD_SORT_SPEC, type XpBoardSortField } from "./xpBoard.sort";

/**
 * THE XP LEADERBOARD, SORTED BY ANY OF ITS COLUMNS AND PAGED BY CURSOR.
 *
 * It consumes `src/lib/api/paging.ts` and adds nothing to it: the parameters,
 * their bounds, the opaque cursor and the `{ items, next, total }` envelope are
 * decided there and nowhere else. `ladder.ts` is the same shape one table over,
 * and the point of both is that a reader who has learned how one list on this
 * site pages has learned all of them.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHO IS ON IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Programs are excluded on `botTier: null`, in this query and not only in
 * `awardXp`.** Two places, because the awarder is where it is TRUE that a
 * program does not climb and the board is where it would be VISIBLE. Seven of
 * the eleven members on production are programs; without this the board would
 * open on a row of bots.
 *
 * **And `xp > 0`, which is the same judgement `ladder.ts` makes about an unplayed
 * rating.** A member who has never earned a point has a true total of nought and
 * no standing, and two hundred rows of "Lv 1 · Insert Coin · 0" would be a table
 * about a default rather than about anybody's play. It is a filter on WHO the
 * board is about, so it holds whatever the sort is — pressing a heading narrows
 * nothing.
 *
 * That is also what makes the empty board reachable, which it is on every
 * database today: nobody's experience is backfilled, so the board starts empty
 * and says so. An empty table is data.
 */

/** How far down the board one page reads. */
export const XP_BOARD_PAGE = 25;

/** No request may ask for more of the board than this at once. */
export const XP_BOARD_PAGE_MAX = 100;

export type XpBoardSort = SortChoice<XpBoardSortField>;

/** One member's line on the board. */
export type XpBoardRow = {
  /** Their opaque id — what `PlayerName` builds the link from, and the tiebreak. */
  id: string;
  name: string;
  xp: number;
  /** When they last earned anything, or null for never. */
  lastAt: Date | null;
};

export type XpBoardPage = PagedEnvelope<XpBoardRow> & {
  /**
   * How many members are on the board at all.
   *
   * Filled in because it is one `count` over the same `where` the page already
   * reads — the condition the convention sets for a `total`: already cheap, not
   * added so a number could be printed. It is what lets the page say "25 of 40"
   * rather than leaving a reader to guess whether scrolling ever ends.
   */
  total: number;
};

/**
 * Everybody the board is about. A sort never changes this.
 *
 * `xp: { gt: 0 }` is a range on the indexed column, so the filter is answered by
 * `Member_xp_idx` rather than in spite of it.
 */
const ON_THE_BOARD: Prisma.MemberWhereInput = { botTier: null, xp: { gt: 0 } };

/** The sort and the page the address asked for, or a refusal naming the column. */
export function readXpBoardPaging(
  params: URLSearchParams,
): { sort: XpBoardSort; limit: number; cursor: string | null } | PagingRefusal {
  const sort = parseSort(XP_BOARD_SORT_SPEC, params);
  if (isRefusal(sort)) return sort;
  return {
    sort,
    limit: parseLimit(params, { fallback: XP_BOARD_PAGE, max: XP_BOARD_PAGE_MAX }),
    cursor: parseCursor(params),
  };
}

export async function fetchXpBoardPage({
  sort,
  limit,
  cursor,
}: {
  sort: XpBoardSort;
  limit: number;
  cursor: string | null;
}): Promise<XpBoardPage> {
  const after = cursor === null ? null : decodeCursor(cursor, sort);
  const where: Prisma.MemberWhereInput =
    after === null
      ? ON_THE_BOARD
      : { AND: [ON_THE_BOARD, keysetWhere(XP_BOARD_SORT_SPEC, sort, after)] };

  const [total, read] = await Promise.all([
    prisma.member.count({ where: ON_THE_BOARD }),
    prisma.member.findMany({
      where,
      select: { id: true, name: true, xp: true, xpLastAt: true },
      orderBy: keysetOrderBy(
        XP_BOARD_SORT_SPEC,
        sort,
      ) as Prisma.MemberOrderByWithRelationInput[],
      // One further than the page, so "is there more" needs no second query.
      take: takeFor(limit),
    }),
  ]);

  const { rows, next } = nextCursorFrom(XP_BOARD_SORT_SPEC, sort, read, limit);
  return {
    items: rows.map((row) => ({ id: row.id, name: row.name, xp: row.xp, lastAt: row.xpLastAt })),
    next,
    total,
  };
}

/**
 * WHERE ONE MEMBER STANDS ON THE BOARD, AS A NUMBER.
 *
 * One `count` — the members above them — and the rank is that plus one. Asked
 * only when the reader is a member, is on the board, and is NOT among the rows
 * already on screen: a member on the first page has their own row marked, which
 * answers the question without a query. So the common case on this site costs
 * nothing at all, and the query exists for the reader who has to be told what
 * they would otherwise have to scroll for.
 *
 * **Ties share a rank, and that is the right answer rather than a limitation.**
 * Two members on the same total are level with each other; numbering one of them
 * above the other would be an order read off `id`, which is opaque and means
 * nothing to anybody. So both are told the same number.
 *
 * It is `xp` and not the sort in force on purpose. A rank is a position in the
 * ORDER OF STANDING, and "you are 4th sorted by name" is not a fact anybody
 * wants — see `XP_BOARD_SORT_SPEC` on why rank is a consequence of a sort and
 * never an input to one.
 */
export async function xpRankOf(xp: number): Promise<number | null> {
  if (xp <= 0) return null;
  const above = await prisma.member.count({
    where: { botTier: null, xp: { gt: xp } },
  });
  return above + 1;
}
