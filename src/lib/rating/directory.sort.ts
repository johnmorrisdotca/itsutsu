import type { SortSpec } from "@/lib/api/paging.types";

/**
 * WHAT THE MEMBERS DIRECTORY SORTS BY — AND, JUST AS IMPORTANTLY, WHAT IT DOES
 * NOT.
 *
 * /players was the last list on this site that could not sort or page, and the
 * reason was written where its headings are drawn: its rows were a composite of
 * four reads, so there was no single query whose `orderBy` a heading could
 * reach, and the columns were not on the row anyway — played, W, L and D came
 * from a pass over the GAMES table and the rating from `Player`.
 *
 * The first half of that is now false. `Member.played`, `.won`, `.lost` and
 * `.drawn` are columns, filled by the migration and carried forward by
 * `recordPlayed` at all four endings, so six of the directory's orders are one
 * indexed `ORDER BY` over `Member`. The second half is still true of the
 * RATING, and that is why it is refused below rather than faked.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *   SORTABLE — a column on `Member`, ordered in SQL, every one indexed:
 *     the member's name · played · W · L · D · joined · last seen
 *
 *   NOT SORTABLE, and why each:
 *
 *     RATING     is not on this table, and it is not one column even where it
 *                is. A directory row shows `ratingShown(profile)`: the ladder
 *                rating where there is a settled one, and otherwise the
 *                COMPUTER pool's, marked. So the figure is a choice between two
 *                columns on a row in ANOTHER table, found by the member's id
 *                where it is bound and by their FOLDED NAME where it is not —
 *                and `Player` has no relation to `Member` by design (the schema
 *                says why: production carries decided games with null seat ids
 *                that a foreign key would have refused). There is no join here
 *                to order by, and a rating sorted in the browser would reorder
 *                one page of however many there are.
 *
 *                It is not a dead end. The Ladder tab one click away IS the
 *                by-rating view of these same people, sorts by rating on
 *                `Player_rating_idx`, and pages the same way — so the reader who
 *                wants it is sent somewhere that can actually answer, which is
 *                the honest version of refusing.
 *
 *     WIN RATE   is arithmetic on three columns, not a column. Postgres can
 *                order by the expression and not from an index, and the figure a
 *                reader sees is rounded — so "sorted by win rate" would put two
 *                rows both showing 58% in an order neither number explains.
 *                `LADDER_SORT_SPEC` refuses it for the same reason, in the same
 *                words, about the same table of records.
 *
 *     STREAK     is TWO columns, a kind and a count, and an order over them is
 *                not a number: W3 above L9 is a judgement about which run is
 *                better and nobody has made it.
 *
 *     TIER       is read off the rating, which this table cannot reach at all.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * `seen` IS THE DEFAULT ORDER AND HAS NO HEADING, WHICH IS NOT AN OVERSIGHT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * "Most recently seen first" is what /players has always meant and what its own
 * first line says. It is declared here because the fallback has to be a column
 * this spec names — and it is what every bare visit orders by, so it is the one
 * order that earns an index whatever the table's size.
 *
 * There is no column for it to be a heading over: how recently somebody was seen
 * is drawn as a MARK in the name cell (`RecencyMark`), not as a figure in a
 * column of its own, and the members table fits /players with no slack at all —
 * 1,118 pixels of table in 1,118 of box — so an eighth column has nowhere to come
 * from. `Directory` therefore offers it as a LINK under the table whenever some
 * other order is in force, which is the way back out of a sort; a control that
 * can be entered and not left is the fault only a return trip finds.
 * `directory.sort.test.ts` asserts this column is the unpressable one, so that
 * adding another by accident fails rather than passing quietly.
 */
export type DirectorySortField =
  | "lastSeenAt"
  | "name"
  | "played"
  | "won"
  | "lost"
  | "drawn"
  | "createdAt";

export const DIRECTORY_SORT_SPEC: SortSpec<DirectorySortField> = {
  of: "the members directory",
  columns: [
    {
      /*
       * The directory's own order, and the one an index earns before any other:
       * every visit to /players runs it, whether or not anybody asked for a
       * sort. It had been a scan and a sort of the whole table since the page
       * existed — 640 rows on a development database, and nothing in the code
       * saying so.
       */
      param: "seen",
      field: "lastSeenAt",
      label: "Last seen",
      firstPress: "desc",
      index: "Member_lastSeenAt_idx",
    },
    {
      /*
       * Alphabetical, which is the sort a directory of six hundred names wants
       * most and the one nothing here has ever offered. Ascending first, because
       * "most" is not the interesting end of a name.
       *
       * ON THE MEMBER'S HEADING, which is where a reader looks for it. It is the
       * only sort whose heading is the subject column rather than a figure, so
       * `RecordTable` had to learn a `subject` slot for it — every other table
       * leaves that slot out and keeps the plain heading it has always had.
       */
      param: "name",
      field: "name",
      label: "Member",
      firstPress: "asc",
      index: "Member_name_idx",
    },
    {
      param: "played",
      field: "played",
      label: "Played",
      firstPress: "desc",
      index: "Member_played_idx",
    },
    { param: "won", field: "won", label: "W", firstPress: "desc", index: "Member_won_idx" },
    { param: "lost", field: "lost", label: "L", firstPress: "desc", index: "Member_lost_idx" },
    {
      param: "drawn",
      field: "drawn",
      label: "D",
      firstPress: "desc",
      index: "Member_drawn_idx",
    },
    {
      /*
       * The one the ladder cannot offer and this can, and the reason is the
       * whole point of the shape: a join date is a `Member` column, and the
       * ladder's rows are `Player` rows keyed by a folded name.
       * `LADDER_SORT_SPEC` says so where it refuses it.
       */
      param: "joined",
      field: "createdAt",
      label: "Joined",
      firstPress: "desc",
      index: "Member_createdAt_idx",
    },
  ],
  fallback: { param: "seen", direction: "desc" },
  /*
   * `id` — the member's own opaque name for itself, which every member has and
   * no two share. Not `email`: a kept record has none, and two rows with a null
   * key are two rows a cursor cannot tell apart. The ladder's is `key` and the
   * record's is `id`, which is why this is declared rather than defaulted.
   */
  tiebreak: "id",
};
