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

import { DIRECTORY_SORT_SPEC, type DirectorySortField } from "./directory.sort";
import { membersWithSettledRatings } from "./directorySettled";
import { EVER_SEEN, NEVER_SEEN, directoryWhere, narrowsAnything } from "./directoryWhere";
import type { DirectoryFilter } from "./directoryFilter";
import { toDirectory, type DirectoryEntry } from "./directoryRows";

/**
 * THE MEMBERS DIRECTORY, SORTED BY ANY OF ITS COLUMNS AND PAGED BY CURSOR.
 *
 * It was `fetchDirectory(200)` and two reads beside it: the two hundred most
 * recently seen members, the programs, the kept records, narrowed in memory,
 * and then a pass over the GAMES table for everybody's played count. Four reads
 * assembled into an array, which is why the table's headings could not sort —
 * there was no query whose `orderBy` a heading could reach, and the figures were
 * not on the rows anyway.
 *
 * Both halves of that are answered here. The tally is four columns on `Member`
 * now (see the migration, and `playedRun.ts` which keeps them), so the read is
 * ONE ordered query over one table; and the two hundred is a PAGE rather than a
 * cut, so nobody falls off the end of it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT "PAGE 2 OF THE DIRECTORY" MEANS FOR A PROGRAM, AND FOR SOMEBODY
 * REMEMBERED HERE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This is the question the shape had to answer, and it is not a detail: those
 * rows were APPENDED PAST THE CAP by design. A computer player is never "seen",
 * because it never signs in, and somebody remembered here never signs in
 * either — so both sink to the bottom of a recency order and stay there. Under
 * the old cut they vanished entirely once the site had more members than the
 * limit, which is what `alwaysListed` and `fetchComputerPlayers` were written
 * to prevent, each with the reason beside it.
 *
 * The answer is two rules, and the split is between an order NOBODY ASKED FOR
 * and an order somebody did:
 *
 *   - UNDER THE DIRECTORY'S OWN ORDER — most recently seen first, which is what
 *     a bare /players means — they are PINNED to the first page, after the
 *     people, exactly where the old append put them. And they are LIFTED OUT of
 *     the paged read while that happens, so pinning them cannot also show them
 *     again eleven pages later: they appear once, on page one, as they do today.
 *
 *   - UNDER A SORT SOMEBODY PRESSED, they are ordinary rows and take the place
 *     their figures give them. Pinning inside an asked-for order is the thing
 *     that would be a lie: "most played" has to include the programs, which
 *     have played more than anybody, and a reader who pressed Played and found
 *     seven rows held at the top regardless would be reading an order that is
 *     not the one they asked for.
 *
 * Neither rule can hide them, and that is what makes the split safe rather than
 * clever: the narrowing `?who=computers` lists every program whatever the
 * order, the Computers tab lists them with their grades, and the Remembered tab
 * is the kept records' own page. The pin is a courtesy on the front page, not
 * the only way to reach anybody.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT ONE PAGE COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   1 · the page itself — `Member`, keyset over the sort's own index
 *   1 · `Member.count()`, for how many members there are
 *   1 · `Member.count({ where })`, ONLY when the reader narrowed something
 *   1 · the pinned rows — only under the default order, and at most nine rows
 *   2 · the rating rows, in `toDirectory`: by member id and by folded name
 *
 * Five or six reads, against seven before, and the one that is gone is the
 * expensive one: `fetchPlayedTallies` read every decided game either seat of
 * which was bound to any of the two hundred members on the page. The counts are
 * columns now, so a page of the directory reads no game at all.
 */

/** How many members one page of the directory holds. */
export const DIRECTORY_PAGE = 50;

/** No request may ask for more of the directory at once than the old cap held. */
export const DIRECTORY_PAGE_MAX = 200;

export type DirectorySort = SortChoice<DirectorySortField>;

export type DirectoryPaging = {
  sort: DirectorySort;
  limit: number;
  cursor: string | null;
};

export type DirectoryPage = PagedEnvelope<DirectoryEntry> & {
  /**
   * How many members match the narrowing, and how many there are at all.
   *
   * TWO NUMBERS BECAUSE THE FILTER BAR HAS ALWAYS PRINTED BOTH — "3 of 15
   * listed" means three match and fifteen exist — and a paged list must not
   * quietly re-point that sentence at the page. `matching` is what the bar
   * counts; how many of them are ON SCREEN is a separate line under the table,
   * because it is a fact about the page rather than about the narrowing.
   *
   * `matching` costs nothing when nobody narrowed anything: it is `total`, and
   * the second count is not run. See `narrowsAnything`.
   */
  matching: number;
  total: number;
  /**
   * How many rows at the end of `items` were pinned there rather than paged
   * into place — see the rules above. Nought under any asked-for sort.
   */
  pinned: number;
};

/** The sort and the page the address asked for, or a refusal naming the column. */
export function readDirectoryPaging(
  params: URLSearchParams,
): DirectoryPaging | PagingRefusal {
  const sort = parseSort(DIRECTORY_SORT_SPEC, params);
  if (isRefusal(sort)) return sort;
  return {
    sort,
    limit: parseLimit(params, { fallback: DIRECTORY_PAGE, max: DIRECTORY_PAGE_MAX }),
    cursor: parseCursor(params),
  };
}

/** The paging a refused sort falls back to: the directory's own order. */
export function directoryPagingFallback(): DirectoryPaging {
  const asked = readDirectoryPaging(new URLSearchParams());
  if (isRefusal(asked)) throw new Error("The directory's own order is not a sort it declares.");
  return asked;
}

export async function fetchDirectoryPage({
  paging,
  filter,
  now,
}: {
  paging: DirectoryPaging;
  filter: DirectoryFilter;
  /** When "seen lately" is being measured from, so a page is testable. */
  now: Date;
}): Promise<DirectoryPage> {
  const { sort, limit, cursor } = paging;
  /*
   * Only when asked for. The settled narrowing is three small reads and the
   * other two filters are clauses, so a directory nobody has narrowed pays
   * nothing at all for the one that costs something.
   */
  const settledIds = filter.settled ? await membersWithSettledRatings() : null;
  const narrowed = directoryWhere(filter, settledIds, now.getTime());

  /*
   * The pin only applies to the order nobody asked for. `asked` is false for a
   * bare address and for one whose sort was refused — both of which are reading
   * the directory's own arrangement, and both of which should get the programs
   * on the front page.
   */
  const pinning = !sort.asked;
  /*
   * `EVER_SEEN` and not `{ NOT: NEVER_SEEN }`. The negation is correct boolean
   * logic and wrong SQL — a NULL `unclaimableBecause` makes the inner OR
   * UNKNOWN and `NOT UNKNOWN` selects nothing — and it produced a directory of
   * nine rows that read as a working page. `directoryWhere.ts` says it at
   * length, beside both halves.
   */
  const paged: Prisma.MemberWhereInput = pinning ? { AND: [narrowed, EVER_SEEN] } : narrowed;

  const after = cursor === null ? null : decodeCursor(cursor, sort);
  const where: Prisma.MemberWhereInput =
    after === null ? paged : { AND: [paged, keysetWhere(DIRECTORY_SORT_SPEC, sort, after)] };

  const [total, matching, read, pinned] = await Promise.all([
    prisma.member.count(),
    narrowsAnything(filter) ? prisma.member.count({ where: narrowed }) : null,
    prisma.member.findMany({
      where,
      orderBy: keysetOrderBy(
        DIRECTORY_SORT_SPEC,
        sort,
      ) as Prisma.MemberOrderByWithRelationInput[],
      // One further than the page, so "is there more" needs no second query.
      take: takeFor(limit),
    }),
    /*
     * The pinned rows, and only on the FIRST page of the default order: a
     * courtesy on the front page is not a header repeated down a list. They go
     * through the same narrowing as everybody else, so asking for People alone
     * still leaves the programs out — which is what `filterDirectory` did to
     * the appended rows before this, and what the filter bar promises.
     */
    pinning && cursor === null
      ? prisma.member.findMany({ where: { AND: [narrowed, NEVER_SEEN] } })
      : [],
  ]);

  const { rows, next } = nextCursorFrom(DIRECTORY_SORT_SPEC, sort, read, limit);
  const shown = [...rows, ...pinned];
  return {
    items: await toDirectory(shown),
    next,
    matching: matching ?? total,
    total,
    pinned: pinned.length,
  };
}
