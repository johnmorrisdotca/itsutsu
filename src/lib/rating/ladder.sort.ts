import type { SortSpec } from "@/lib/api/paging.types";

/**
 * WHAT THE SITE LADDER SORTS BY — AND, JUST AS IMPORTANTLY, WHAT IT DOES NOT.
 *
 * `RecordTable` draws ten columns and only five of them can be ordered by the
 * database. The other five are refused rather than faked, which is the whole
 * reason this is a declaration: a heading that looks like the others and sorts
 * the loaded page in the browser lies the moment there is a second page, and a
 * heading that is simply missing looks like somebody forgot.
 *
 *   SORTABLE — a column on `Player`, ordered in SQL:
 *     played · W · L · D · rating
 *
 *   NOT SORTABLE, and why each:
 *     WIN RATE   is arithmetic on three columns, not a column. Postgres can
 *                order by the expression, but not from an index, and the figure
 *                a reader sees is rounded — so "sorted by win rate" would put
 *                two rows both showing 58% in an order neither number explains.
 *     STREAK     is TWO columns, a kind and a count, and an order over them is
 *                not a number: W3 above L9 is a judgement about which run is
 *                better, and nobody has made it. `rating/streak.ts` says the
 *                same thing about why a null streak prints an em dash.
 *     TIER       is read off the rating and the number of rated games together,
 *                so sorting by it would be a coarser sort by rating with ties
 *                broken by nothing a reader can see. The rating column is
 *                already the honest version of that request.
 *     JOINED     is a `Member` column and this table's rows come from `Player`,
 *                which is keyed by the name a rating was earned under. The
 *                ladder does not read it, so it cannot order by it.
 *
 * THE INDEX SITUATION, checked against production on 2026-09-12: `Player` holds
 * nine rows. Four of the five sortable columns have no index and do not need
 * one — nine rows is smaller than the page Postgres would read an index from.
 * `rating` has one because the ladder's DEFAULT order is the one that runs on
 * every visit to /players, and that is the ordering worth an index whatever the
 * table's size.
 */
export type LadderSortField =
  | "ratedGames"
  | "wins"
  | "losses"
  | "draws"
  | "rating";

const TINY_TABLE =
  "No index, and none wanted: Player holds nine rows on production, fewer than one index " +
  "page. Worth revisiting past a few thousand rated names, which this site is nowhere near.";

export const LADDER_SORT_SPEC: SortSpec<LadderSortField> = {
  of: "the ladder",
  columns: [
    {
      param: "rating",
      field: "rating",
      label: "Rating",
      firstPress: "desc",
      /*
       * The ladder's own order, and the one an index earns: every visit to
       * /players runs it, whether or not anybody asked for a sort.
       */
      index: "Player_rating_idx",
    },
    {
      param: "played",
      field: "ratedGames",
      label: "Played",
      firstPress: "desc",
      index: null,
      unindexedBecause: TINY_TABLE,
    },
    {
      param: "won",
      field: "wins",
      label: "W",
      firstPress: "desc",
      index: null,
      unindexedBecause: TINY_TABLE,
    },
    {
      param: "lost",
      field: "losses",
      label: "L",
      firstPress: "desc",
      index: null,
      unindexedBecause: TINY_TABLE,
    },
    {
      param: "drawn",
      field: "draws",
      label: "D",
      firstPress: "desc",
      index: null,
      unindexedBecause: TINY_TABLE,
    },
  ],
  fallback: { param: "rating", direction: "desc" },
};
