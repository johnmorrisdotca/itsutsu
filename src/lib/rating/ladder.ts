import "server-only";

import {
  decodeCursor,
  keysetOrderBy,
  keysetWhere,
  nextCursorFrom,
  takeFor,
} from "@/lib/api/paging.cursor";
import { isRefusal, parseCursor, parseLimit, parseSort } from "@/lib/api/paging";
import type { PagedEnvelope, PagingRefusal, SortChoice } from "@/lib/api/paging.types";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

import { LADDER_SORT_SPEC, type LadderSortField } from "./ladder.sort";
import { type PlayerProfile, toProfile } from "./players";

/**
 * THE SITE LADDER, SORTED BY ANY OF ITS COLUMNS AND PAGED BY CURSOR.
 *
 * It was `fetchLeaders(50)`: one order, one page, and a cap that said nothing
 * about the fifty-first player. The cap is now a page, which is the honest
 * version of it — the reader is told how many there are and can reach all of
 * them — and every column the database can order by is a heading they can press.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT THE OLD ORDER DID THAT THIS DOES NOT, SAID OUT LOUD
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The order was `rating desc, ratedGames desc, updatedAt desc, key asc`, and its
 * comment gave the reason: a new site is a wall of people on the same rating,
 * and an order nobody chose changes between two loads of the same page. That
 * requirement is DETERMINISM, and `(rating desc, key asc)` has it — `key` is
 * unique, so the list is the same list twice running.
 *
 * What is gone is the PREFERENCE inside an exact tie: among two players on 1600,
 * the one who had played more, and then more recently, used to stand higher. A
 * cursor points at one column plus the primary key, so a four-column order
 * cannot be paged without a cursor carrying three values — more surface than
 * this convention should have for a preference.
 *
 * That preference has become a CONTROL instead, which is more than it was: there
 * is a Played heading now, and pressing it orders by exactly the figure the old
 * tiebreak was reaching for. A reader can ask for what the order used to assume.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHO IS ON IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `ratedGames > 0`, unchanged: a rating nobody has played for is the starting
 * 1600, and fifty of those at the top of the ladder would be a table about a
 * default rather than about anybody's play. It is a filter on WHO the ladder is
 * about, so it stays whatever the sort is — pressing a heading narrows nothing.
 */

/** How far down the ladder one page reads. */
export const LADDER_PAGE = 25;

/** No request may ask for more of the ladder than this at once. */
export const LADDER_PAGE_MAX = 100;

export type LadderSort = SortChoice<LadderSortField>;

export type LadderPage = PagedEnvelope<PlayerProfile> & {
  /**
   * How many players are on the ladder at all.
   *
   * Filled in because it is one `count` over the same `where` — the condition the
   * convention sets for a `total`: already cheap, not added so a number can be
   * printed. It is what lets the page say "25 of 9" rather than leaving a reader
   * to guess whether scrolling will ever end.
   */
  total: number;
};

/** Everybody the ladder is about. A sort never changes this. */
const ON_THE_LADDER: Prisma.PlayerWhereInput = { ratedGames: { gt: 0 } };

/** The sort and the page the address asked for, or a refusal naming the column. */
export function readLadderPaging(
  params: URLSearchParams,
): { sort: LadderSort; limit: number; cursor: string | null } | PagingRefusal {
  const sort = parseSort(LADDER_SORT_SPEC, params);
  if (isRefusal(sort)) return sort;
  return {
    sort,
    limit: parseLimit(params, { fallback: LADDER_PAGE, max: LADDER_PAGE_MAX }),
    cursor: parseCursor(params),
  };
}

export async function fetchLadderPage({
  sort,
  limit,
  cursor,
}: {
  sort: LadderSort;
  limit: number;
  cursor: string | null;
}): Promise<LadderPage> {
  const after = cursor === null ? null : decodeCursor(cursor, sort);
  const where: Prisma.PlayerWhereInput =
    after === null
      ? ON_THE_LADDER
      : { AND: [ON_THE_LADDER, keysetWhere(LADDER_SORT_SPEC, sort, after)] };

  const [total, read] = await Promise.all([
    prisma.player.count({ where: ON_THE_LADDER }),
    prisma.player.findMany({
      where,
      orderBy: keysetOrderBy(LADDER_SORT_SPEC, sort) as Prisma.PlayerOrderByWithRelationInput[],
      // One further than the page, so "is there more" needs no second query.
      take: takeFor(limit),
    }),
  ]);

  const { rows, next } = nextCursorFrom(LADDER_SORT_SPEC, sort, read, limit);
  return { items: rows.map(toProfile), next, total };
}
