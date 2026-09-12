import Link from "next/link";

import { ariaSort, sortHref } from "@/lib/api/paging";
import type { SortChoice, SortColumn, SortSpec } from "@/lib/api/paging.types";

import { HEAD } from "./PlayerRecord";

/**
 * A SORTABLE HEADING, ONCE, FOR EVERY RECORD TABLE ON THE SITE.
 *
 * `RecordTable` is already the one table of records — the ladder, the members
 * list, the computer players, a player's own breakdown and every per-game
 * standing draw the same ten columns in the same order. So the headings become
 * sortable in one place, and every one of those tables gets it the day its page
 * hands down a `RecordSort`.
 *
 * A HEADING IS A LINK, not a button, and that is the whole design:
 *
 * - **The sort is in the address**, so a sorted view can be linked, bookmarked,
 *   opened in a new tab and read by somebody with no JavaScript. That is the
 *   same reasoning `HistoryFilters` has always kept about filters, and it is why
 *   sorting could never be component state.
 * - **It therefore pages correctly.** A client-side sort of the rows already
 *   loaded lies the moment there is a second page: it reorders twenty-five of
 *   nine hundred and presents the result as the ladder.
 * - **It is keyboard-reachable for free**, because it is an anchor.
 *
 * A COLUMN WITH NO SORT IS PLAIN TEXT, deliberately. Win rate is arithmetic on
 * three columns, a streak is two columns with no order over them, and Joined is
 * on a table the ladder does not read — see `LADDER_SORT_SPEC`, which says so
 * for each. A heading that looked like the others and sorted the loaded page in
 * the browser would be worse than one that does nothing, because a reader would
 * believe it.
 */

/**
 * The headings a record table can sort by, and which sort word each presses.
 *
 * A slot with no word is a column this table cannot order by, and it renders as
 * text. The words are checked against the spec by `recordSort.coverage.test.ts`,
 * because a word the spec does not have would be a link to a 400 — and `sortBy`
 * throws rather than quietly drawing plain text, so the mistake is loud where it
 * is made rather than invisible where it is seen.
 */
export type RecordSortSlots = {
  /**
   * The SUBJECT heading — "Member", "Player", "Game" — which is a sort on
   * exactly one table and plain text on every other.
   *
   * The members directory presses it to sort by name, which is the order a
   * directory of six hundred people wants most and the one nothing here has
   * ever offered. Nobody else can: the ladder's rows are keyed by a folded name
   * and a table of GAMES has no name to order by at all, so leaving the slot out
   * is what keeps their headings exactly as they were.
   *
   * It is here rather than a prop of its own because the subject column is a
   * column like the others from a sorting point of view, and a second mechanism
   * for one heading is how this file ended up being written: five tables, four
   * column orders.
   */
  subject?: string;
  played?: string;
  won?: string;
  lost?: string;
  drawn?: string;
  winRate?: string;
  streak?: string;
  rating?: string;
  tier?: string;
  joined?: string;
};

export type RecordSortSlot = keyof RecordSortSlots;

/**
 * Everything a table needs to draw its headings as links.
 *
 * `query` IS A STRING AND NOT A `URLSearchParams`, and it was the latter for
 * about an hour. A record table can sit inside a client component — the ladder's
 * does, so that it can append pages as a reader scrolls — and only serializable
 * values cross that boundary: a `URLSearchParams` arrives as a plain object with
 * none of its methods, and the page answers 500 on `query.get is not a
 * function`. A string is the same information and survives the crossing, so the
 * type says string and every reader of it builds its own.
 */
export type RecordSort = {
  /** The address this table lives at — where a press lands. */
  at: string;
  /** Everything else in the query, so a press keeps the filters and the tab. */
  query: string;
  spec: SortSpec<string>;
  current: SortChoice<string>;
  by: RecordSortSlots;
};

/**
 * The spec's row for a word a table says it presses.
 *
 * Thrown rather than defaulted, for the reason `parseSort`'s fallback is: this is
 * a mistake in a declaration, and the two ways of being quiet about it are both
 * worse. Drawing plain text would hide a heading that should sort; drawing a link
 * to a word the spec lacks would send a reader to a 400.
 * `recordSort.coverage.test.ts` runs in `pnpm test:unit`, so it never ships.
 */
function columnFor(sort: RecordSort, word: string): SortColumn<string> {
  const column = sort.spec.columns.find((one) => one.param === word);
  if (column === undefined) {
    throw new Error(`${sort.spec.of} has no sort called "${word}", but a heading presses it.`);
  }
  return column;
}

/**
 * One heading: a link when this table sorts by it, text when it does not.
 *
 * The arrow shows the direction IN FORCE rather than the direction a press would
 * produce, because that is what a reader is asking the table — "which way is
 * this?" — and a control that previews its own effect leaves them unable to read
 * the current state at all. `aria-sort` says the same thing in words, so the
 * arrow is not the only place it is said.
 */
export function SortableHead({
  sort,
  slot,
  children,
  title,
}: {
  sort: RecordSort | undefined;
  slot: RecordSortSlot;
  children: React.ReactNode;
  title?: string;
}) {
  const word = sort?.by[slot];
  if (sort === undefined || word === undefined) {
    return (
      <th className={HEAD} title={title}>
        {children}
      </th>
    );
  }

  const column = columnFor(sort, word);
  const way = ariaSort(sort.current, column);
  const inForce = way !== "none";

  return (
    <th className={HEAD} aria-sort={way} title={title}>
      <Link
        href={sortHref(sort.at, new URLSearchParams(sort.query), sort.current, column)}
        className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
        data-testid="sortable-head"
        data-sort={word}
        /*
         * Which way it is NOW, for a reader who cannot see the arrow. Not what a
         * press would do: `aria-sort` above already says the state, and a label
         * describing the effect would contradict it.
         */
        aria-label={
          inForce
            ? `${column.label}, sorted ${way}. Press to reverse.`
            : `Sort by ${column.label}`
        }
      >
        {children}
        <span aria-hidden className={inForce ? "text-ink-soft" : "text-muted opacity-40"}>
          {inForce ? (sort.current.direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}
