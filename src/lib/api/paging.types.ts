/**
 * The shapes of the one paging convention. See `paging.ts` for the parsing and
 * `paging.cursor.ts` for the cursor itself.
 */

export type SortDirection = "asc" | "desc";

/**
 * ONE SORTABLE COLUMN, DECLARED WITH THE INDEX THAT MAKES IT CHEAP.
 *
 * The `index` field is the point of this type and the reason a sort is declared
 * rather than derived. A sort over a column nothing indexes is a full scan and
 * a sort of every row that matched — invisible at a hundred rows, and the exact
 * fault taken off the landing page in 0.139.0 at ten thousand. So every
 * sortable column has to say which index answers it, and a column with none has
 * to say why that is acceptable.
 *
 * `index: null` with no `unindexedBecause` does not type-check (see
 * `SortColumn`'s two variants), because "nobody wrote one down" and "nothing
 * backs this and here is why that is fine" must not look the same in source.
 * That is Nothing Answers What It Cannot Answer applied to a declaration: a
 * missing index is information, and the type makes it impossible to omit
 * silently.
 */
type SortColumnBase<Field extends string> = {
  /**
   * The word in the address — `played`, `rating`, `moves`.
   *
   * Plain words, never the column's own camelCase name: an address is read by
   * people, and `?sort=moveCount` tells a reader they are looking at a database.
   * The field keeps its own name, and this is the only thing a link may contain.
   */
  readonly param: string;
  /** The column the read orders by. */
  readonly field: Field;
  /** The heading a table draws over it. */
  readonly label: string;
  /**
   * Which way round the FIRST press sorts.
   *
   * Descending for anything where "most" is the interesting end — a rating, a
   * count of games, a date — and ascending for a name. A heading that starts
   * ascending on a count makes the first press show the emptiest rows, which
   * nobody has ever wanted, and the reader has to press twice to find out.
   */
  readonly firstPress: SortDirection;
  /**
   * Whether this column holds nulls, which changes the keyset arithmetic and
   * cannot be guessed from the field name.
   *
   * A nullable column orders nulls last in both directions — a game recorded
   * with no clock has no duration, and interleaving those with real durations
   * would be an order nobody asked for — so the cursor has to be able to say
   * "I am among the nulls now". See `keysetWhere`.
   */
  readonly nullable?: boolean;
};

export type SortColumn<Field extends string> = SortColumnBase<Field> &
  (
    | {
        /** The index that answers this sort, by its name in the database. */
        readonly index: string;
        readonly unindexedBecause?: never;
      }
    | {
        /** Nothing indexes this column. */
        readonly index: null;
        /**
         * Why an unindexed sort is acceptable on this list — required, and the
         * reason is expected to name the size at which it stops being true.
         */
        readonly unindexedBecause: string;
      }
  );

/**
 * Everything one list will sort by, and what it does when nobody asked.
 *
 * Declared per list rather than inferred, so that adding a sort is a decision
 * with an index behind it instead of a column name reaching the database from a
 * query string.
 */
export type SortSpec<Field extends string> = {
  /** What this list is, for the message an unknown column is refused with. */
  readonly of: string;
  readonly columns: readonly SortColumn<Field>[];
  /** The order a request with no `sort` gets. Must name one of `columns`. */
  readonly fallback: { readonly param: string; readonly direction: SortDirection };
  /**
   * THE PRIMARY KEY, WHICH BREAKS EVERY TIE THE SORT COLUMN LEAVES.
   *
   * Required, and not defaulted to `"id"`, because it is not always `id` and a
   * wrong one is not a cosmetic mistake: a cursor built on a column that does
   * not uniquely identify a row cannot say which of two tied rows it meant, so
   * the page after it repeats some and skips others. `Game` is keyed by `id` and
   * `Player` by `key` — two of the first two lists on this convention already
   * disagree, which is the argument for stating it rather than assuming it.
   *
   * A default would have been forgotten at exactly the call site where it was
   * wrong, and nothing would have failed: `key` and `id` are both strings, and a
   * keyset over the wrong one pages plausibly and incorrectly.
   */
  readonly tiebreak: string;
};

/** A sort that has been checked against a spec: the column, and which way. */
export type SortChoice<Field extends string> = {
  readonly column: SortColumn<Field>;
  readonly direction: SortDirection;
  /** True when the reader asked for this, false when it is the spec's fallback. */
  readonly asked: boolean;
};

/**
 * Where one page ended, as the client gets it: an opaque string.
 *
 * Opaque on purpose. A client that can read a cursor will eventually build one,
 * and then the server's ordering is something two programs have an opinion
 * about. See `paging.cursor.ts` for what is inside it and why the sort is part
 * of it.
 */
export type Cursor = string;

/** Where a page ended, before it is encoded. */
export type CursorPosition = {
  /** The sort column's value on the last row, or null where that column was null. */
  readonly value: string | number | null;
  /** That row's id, which breaks every tie the sort column leaves. */
  readonly id: string;
  /** The sort this position is a position in. See `decodeCursor`. */
  readonly sort: { readonly param: string; readonly direction: SortDirection };
};

/**
 * THE ONE ENVELOPE every paged listing here returns.
 *
 * `next` is a cursor or null, and null means "that was the last page" — not
 * "ask again later" and not "something went wrong". A live scroller stops on
 * null and never asks again, which is why it is the only way this convention
 * says the end has been reached.
 *
 * `total` is OPTIONAL and stays optional. It is filled in where a count was
 * already being run for another reason and left out otherwise: a count over a
 * filtered set is a second query on every page turn, and adding one purely so a
 * number can be printed is a cost per page view with nothing behind it. A list
 * with no `total` shows no total; it does not show a guess.
 */
export type PagedEnvelope<Item> = {
  readonly items: readonly Item[];
  readonly next: Cursor | null;
  readonly total?: number;
};

/** What a refused listing parameter says, for the route to turn into a 400. */
export type PagingRefusal = { readonly error: string };
