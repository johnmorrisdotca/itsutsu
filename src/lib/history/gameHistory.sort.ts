import {
  isRefusal,
  parseCursor,
  parseLimit,
  parseSort,
} from "@/lib/api/paging";
import type {
  PagingRefusal,
  SortChoice,
  SortColumn,
  SortDirection,
  SortSpec,
} from "@/lib/api/paging.types";

import { GAME_PAGE_SIZE_DEFAULT, GAME_PAGE_SIZE_MAX } from "./gameHistory.constants";

/**
 * WHAT THE RECORD SORTS BY, AND WHICH INDEX ANSWERS EACH.
 *
 * The record is the biggest list on this site and the one every count on every
 * page links into, so it is the list whose ordering has to be cheap. Two of
 * these four columns have no index, which is written down beside them rather
 * than discovered later: at 117 finished games on production today that is a
 * scan of a table Postgres holds in a single page, and it is the fault taken
 * off the landing page in 0.139.0 at ten thousand rows.
 *
 * THE NUMBER AT WHICH THAT STOPS BEING TRUE, so the next reader does not have
 * to guess: a few thousand games. A bot-against-bot batch is eighty games in an
 * evening and `pnpm bots:play` exists, so this table can grow by more in a
 * night than it has in its life. When it does, the answer is
 * `@@index([moveCount])` and `@@index([durationMs])` in one migration — not a
 * sort quietly removed from the headings, because a column a reader has been
 * able to sort by does not become unsortable without them noticing.
 *
 * Neither unindexed sort is NEW here: both have been in `GAME_SORT_BY` and
 * offered by the filter bar's sort select since /history existed. What is new
 * is that the cost is stated in the same place the sort is declared.
 */
export type GameSortField = "playedAt" | "moveCount" | "size" | "durationMs";

const UNINDEXED =
  "No index. 117 finished games on production, which Postgres sorts in memory from a single " +
  "page; worth an index past a few thousand, which a bot batch could reach in one night.";

export const GAME_SORT_SPEC: SortSpec<GameSortField> = {
  of: "the record",
  columns: [
    {
      param: "played",
      field: "playedAt",
      // "Date played" and not "Played": it is what the filter bar has always
      // said, and this label now feeds that select as well as any heading.
      label: "Date played",
      // Newest first, which is what the record means by default and what every
      // link into it from a count expects to land on.
      firstPress: "desc",
      index: "Game_playedAt_idx",
    },
    {
      param: "moves",
      field: "moveCount",
      label: "Length",
      firstPress: "desc",
      index: null,
      unindexedBecause: UNINDEXED,
    },
    {
      param: "size",
      field: "size",
      label: "Board size",
      firstPress: "desc",
      /*
       * The compound index's LEADING column, which is what makes it usable
       * here: `(size, playedAt)` answers an order by size, and would not
       * answer an order by playedAt. Named rather than assumed, because a
       * compound index that happens to contain a column is not an index on it.
       */
      index: "Game_size_playedAt_idx",
    },
    {
      param: "duration",
      field: "durationMs",
      label: "Time taken",
      firstPress: "desc",
      /*
       * Nullable, and that is the whole reason this flag exists. A game
       * recorded without a clock has no duration, those sort LAST in both
       * directions rather than interleaving with real ones, and a cursor has to
       * be able to say "I am among the nulls now" or every unclocked game
       * vanishes past the first page. See `keysetWhere`.
       */
      nullable: true,
      index: null,
      unindexedBecause: UNINDEXED,
    },
  ],
  fallback: { param: "played", direction: "desc" },
  // A game is keyed by the eight characters in its every address.
  tiebreak: "id",
};

/** The spec's column for a Prisma field, for the code that still speaks fields. */
export function gameSortColumn(field: GameSortField): SortColumn<GameSortField> {
  const column = GAME_SORT_SPEC.columns.find((one) => one.field === field);
  if (column === undefined) throw new Error(`The record does not sort by "${field}".`);
  return column;
}

/**
 * A stored query's sort as the cursor helpers want it.
 *
 * `GameHistoryQuery` carries the column and direction flat, because that is the
 * shape every filter and every page has read for months. The keyset functions
 * want the spec's own row for that column — the nullability and the word in the
 * address live there — so this is the one conversion, done in one place, rather
 * than each read assembling its own and one of them getting the nullability
 * wrong.
 */
export function gameSortChoice(query: {
  sortBy: GameSortField;
  sortDir: SortDirection;
  sortAsked?: boolean;
}): SortChoice<GameSortField> {
  return {
    column: gameSortColumn(query.sortBy),
    direction: query.sortDir,
    asked: query.sortAsked ?? true,
  };
}

/**
 * What the address calls a sort, read off the declaration rather than from a
 * second table beside it.
 *
 * This used to be a `SORT_WORDS` map maintained next to `GAME_SORT_BY`, which
 * is two lists that have to agree about four things. They are one list now: the
 * word, the column, the heading and the index are one row, and the filter bar's
 * options are built from it.
 */
export function sortWord(field: GameSortField): string {
  return gameSortColumn(field).param;
}

/** Every sort the record offers, in the order the filter bar shows them. */
export const GAME_SORT_COLUMNS = GAME_SORT_SPEC.columns;

/** Sorting and paging, parsed off one address. Filters are `toGameHistoryQuery`'s. */
export type GameListingPaging = {
  sort: SortChoice<GameSortField>;
  /** How many rows the page holds. */
  limit: number;
  /** Where the previous page ended, or null for the first. */
  cursor: string | null;
};

export function readGamePaging(url: URL): GameListingPaging | PagingRefusal {
  const sort = parseSort(GAME_SORT_SPEC, url.searchParams);
  if (isRefusal(sort)) return sort;
  return {
    sort,
    limit: parseLimit(url.searchParams, {
      fallback: GAME_PAGE_SIZE_DEFAULT,
      max: GAME_PAGE_SIZE_MAX,
    }),
    cursor: parseCursor(url.searchParams),
  };
}
