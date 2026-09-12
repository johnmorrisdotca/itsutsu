import type { SortSpec } from "@/lib/api/paging.types";

/**
 * WHAT THE XP LEADERBOARD SORTS BY, AND THE INDEX BEHIND EACH COLUMN.
 *
 * Every sortable column here is an indexed column on `Member`, and that is the
 * whole requirement rather than a nicety: a sort has to order ALL the members
 * and not just the page on screen, so a sort key with no index behind it is a
 * full scan on every press of a heading — the landing-page fault of 0.139.0
 * wearing a table header. `docs/plans/xp/XP_DESIGN.md` argues each row of the
 * table below; this is that table as code.
 *
 *   SORTABLE:
 *     xp           Member.xp        Member_xp_idx        the default, descending
 *     level        Member.xp        Member_xp_idx        the same ordering, see below
 *     last-earned  Member.xpLastAt  Member_xpLastAt_idx  nullable; null is "never"
 *     name         Member.name      —                    a convenience, never the default
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LEVEL SORTS ON `xp`, AND NOTHING WAS ADDED TO MAKE IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The curve is monotonic, so ordering by level IS ordering by XP — the same rows
 * in the same order, because a higher total can never be a lower level. The
 * heading is therefore already sortable and needs no column of its own.
 *
 * **Not storing `Member.xpLevel` to make it sortable is the decision here.** A
 * stored level is a cached copy of a table that exists precisely so it can be
 * retuned by editing numbers with no migration behind it — and the moment it is
 * retuned, every stored level is a number nobody can trust and nothing reports
 * it. `schema.prisma` says the same thing over the `xp` column.
 *
 * The two words produce the same rows and are still two words on purpose: a
 * cursor carries the word it was made under, so `sort=level:desc` pages within
 * the level ordering and a cursor from `sort=xp:desc` handed to it is refused
 * rather than honoured. They cost one row in this declaration and they let a
 * reader press the heading in front of them.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IS NOT SORTABLE, AND WHY EACH
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   RANK   is the row's place in whatever order is in force, so "sort by rank"
 *          is either the order you are already in or a request that means
 *          nothing. It is a consequence of the sort and never an input to it.
 *   NAME   IS sortable, and is the one column with no index — see below. It is a
 *          tie-break and a small-N convenience and must never be the default.
 */
export type XpBoardSortField = "xp" | "xpLastAt" | "name";

export const XP_BOARD_SORT_SPEC: SortSpec<XpBoardSortField> = {
  of: "the XP leaderboard",
  columns: [
    {
      param: "xp",
      field: "xp",
      label: "XP",
      firstPress: "desc",
      /*
       * The board's own order, and the one an index earns twice over: every visit
       * to /xp runs it whether or not anybody asked for a sort, and a level's page
       * reads a range over the same column.
       */
      index: "Member_xp_idx",
    },
    {
      param: "level",
      field: "xp",
      label: "Level",
      firstPress: "desc",
      // The same index, because it is the same ordering. See the header.
      index: "Member_xp_idx",
    },
    {
      param: "last-earned",
      field: "xpLastAt",
      label: "Last earned",
      firstPress: "desc",
      /*
       * NULLABLE, AND DECLARED SO. A member who has never earned anything has no
       * date, the nulls order last in both directions, and the cursor has to be
       * able to say "I am among the nulls now" — get that wrong in the obvious
       * direction and every member with no date simply stops existing past the
       * first page, with no error and a page that looks complete. See
       * `keysetWhere`.
       */
      nullable: true,
      index: "Member_xpLastAt_idx",
    },
    {
      param: "name",
      field: "name",
      label: "Member",
      // Ascending: A first is what a reader means by sorting a list of people.
      firstPress: "asc",
      index: null,
      unindexedBecause:
        "Member.name has no index, and this is a tie-break and a small-N convenience rather than " +
        "the default order — production holds eleven member rows, four of them people. Worth an " +
        "index past a few thousand members, which this site is nowhere near.",
    },
  ],
  fallback: { param: "xp", direction: "desc" },
  /*
   * `id`, which is `Member`'s primary key: an opaque id given once and never
   * derived from anything anybody typed. Not `email` — that is nullable for a
   * record kept for somebody who never held an account, and a keyset over a
   * column that can be null cannot say which of two tied rows it meant.
   */
  tiebreak: "id",
};
