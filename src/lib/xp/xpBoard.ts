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
import type { DirectoryWho } from "@/lib/rating/directoryFilter";
import { RECORD_SCOPES, type RecordScope } from "@/lib/rating/recordScope";

import { XP_WHO_DEFAULT, xpWhoWhere } from "./xpWho";
import type { Prisma } from "@prisma/client";

import { xpBoardSortSpec, type XpBoardSortField } from "./xpBoard.sort";
import { XP_SCOPE_DEFAULT, xpAboveWhere, xpOnBoardWhere, xpTotalIn } from "./xpScope";

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
 * WHO IS ON IT, AND WHICH TOTAL RANKS THEM
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Programs are on it, like anyone.** This query used to keep `botTier: null`,
 * with the awarder refusing programs at the other end, so that the board could
 * not open on a row of bots. John reversed that — "i still don't see Levels
 * for all equally and bots don't have XP" — so a program earns from its games
 * and stands where its total puts it. Whether a reader wants people, programs
 * or everyone is the page's filter to offer, never this query's to decide.
 *
 * **Everywhere or Itsutsu only is the page's to offer too.** John: "we will show
 * filters, that show worldwide XP ... and the Itsutsu only XP as well". Under
 * Everywhere the board ranks by `Member.xpEverywhere`, which carries the credit
 * for another site's kept record; under Itsutsu only, by `Member.xp`. The scope
 * is part of the where, the order, the cursor and the rank, so every number the
 * page prints is about the board the reader is looking at.
 *
 * **And a total above nought, which is the same judgement `ladder.ts` makes
 * about an unplayed rating.** A member who has never earned a point has a true
 * total of nought and no standing, and two hundred rows of "Lv 1 · Insert Coin ·
 * 0" would be a table about a default rather than about anybody's play. It is a
 * filter on WHO the board is about, so it holds whatever the sort is — pressing a
 * heading narrows nothing. The board can still be empty — a narrowing nobody is
 * in, a fresh database — and says so. An empty table is data.
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
  /** The total the board is ranking by: Everywhere or Itsutsu only. */
  xp: number;
  /**
   * What of `xp` is credit for another site's kept record — nought under Itsutsu
   * only, which counts none of it. What the justification line under a name
   * reports.
   */
  imported: number;
  /** When they last earned anything here, or null for never. */
  lastAt: Date | null;
  /**
   * Their own zone, "" where they have never set one — so Today and 7 days count
   * THEIR days, the ones their awards were keyed under. See `xpGains.ts`.
   */
  timeZone: string;
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

/** The sort and the page the address asked for, or a refusal naming the column. */
export function readXpBoardPaging(
  params: URLSearchParams,
  scope: RecordScope = XP_SCOPE_DEFAULT,
): { sort: XpBoardSort; limit: number; cursor: string | null } | PagingRefusal {
  const sort = parseSort(xpBoardSortSpec(scope), params);
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
  who = XP_WHO_DEFAULT,
  scope = XP_SCOPE_DEFAULT,
}: {
  sort: XpBoardSort;
  limit: number;
  cursor: string | null;
  /** People, the computer players, or everyone — see `xpWho.ts`. */
  who?: DirectoryWho;
  /** Everywhere, or Itsutsu only — see `xpScope.ts`. */
  scope?: RecordScope;
}): Promise<XpBoardPage> {
  const spec = xpBoardSortSpec(scope);
  const after = cursor === null ? null : decodeCursor(cursor, sort);
  /*
   * The narrowing is part of the where, so the page, the order, the cursor
   * and the total are all about the narrowed set — never everyone with rows
   * dropped afterwards, which would page and count a list the reader is not
   * looking at.
   */
  const onTheBoard: Prisma.MemberWhereInput = { AND: [xpOnBoardWhere(scope), xpWhoWhere(who)] };
  const where: Prisma.MemberWhereInput =
    after === null ? onTheBoard : { AND: [onTheBoard, keysetWhere(spec, sort, after)] };

  const [total, read] = await Promise.all([
    prisma.member.count({ where: onTheBoard }),
    prisma.member.findMany({
      where,
      select: { id: true, name: true, xp: true, xpEverywhere: true, xpImported: true, xpLastAt: true, timeZone: true },
      orderBy: keysetOrderBy(spec, sort) as Prisma.MemberOrderByWithRelationInput[],
      // One further than the page, so "is there more" needs no second query.
      take: takeFor(limit),
    }),
  ]);

  const { rows, next } = nextCursorFrom(spec, sort, read, limit);
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      xp: xpTotalIn(row, scope),
      imported: scope === RECORD_SCOPES.everywhere ? row.xpImported : 0,
      lastAt: row.xpLastAt,
      timeZone: row.timeZone,
    })),
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
 * It is the scope's total and not the sort in force on purpose. A rank is a
 * position in the ORDER OF STANDING, and "you are 4th sorted by name" is not a
 * fact anybody wants — see `XP_BOARD_SORT_SPEC` on why rank is a consequence of
 * a sort and never an input to one.
 */
export async function xpRankOf(
  total: number,
  who: DirectoryWho = XP_WHO_DEFAULT,
  scope: RecordScope = XP_SCOPE_DEFAULT,
): Promise<number | null> {
  if (total <= 0) return null;
  // Within the narrowing, so a rank printed under a filter is the rank within it.
  const above = await prisma.member.count({
    where: { AND: [xpAboveWhere(scope, total), xpWhoWhere(who)] },
  });
  return above + 1;
}
