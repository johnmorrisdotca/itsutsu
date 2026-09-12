import type { SortSpec } from "@/lib/api/paging.types";

/**
 * WHAT A MEMBER'S OWN XP LEDGER SORTS BY — AND WHAT IT REFUSES TO.
 *
 * Its own module, beside `gameHistory.sort.ts` and `ladder.sort.ts`, and for
 * their reason rather than for tidiness: `paging.coverage.test.ts` imports every
 * spec on the site to check it, and a spec declared inside the module that
 * queries would drag `server-only` and a `PrismaClient` into that gate. Both of
 * those files are deliberately free of the database, so this one is too.
 *
 *   SORTABLE — one column, `XpEvent.createdAt`, either way round:
 *     earned
 *
 *   NOT SORTABLE, and why:
 *     XP      `points` has no index. The convention's rule is that a sortable
 *             column is an indexed column, because a sort orders ALL of a
 *             member's events and not the page being shown — so a heading here
 *             would be a full scan of the ledger on every press, which is the
 *             landing-page fault of 0.139.0 wearing a table header.
 *     FOR     the same, for `type`. And it would be an order over a key rather
 *             than over the label a reader sees: `dailyVisit` sorts before
 *             `gameWon` while "A new day" sorts after "Game won", so the column
 *             would not be in the order it appears to be in.
 *     ABOUT   not a column at all. What a row is about is decided by reading its
 *             subject against its type — see `xpAboutFor` — and there is nothing
 *             in the database to order by.
 *
 * Ascending costs nothing, reads from the same index, and is the one a member
 * wants when they go looking for the first thing they ever earned.
 */
export const XP_LEDGER_SORT: SortSpec<"createdAt"> = {
  of: "your XP",
  columns: [
    {
      param: "earned",
      field: "createdAt",
      label: "Earned",
      firstPress: "desc",
      /** The index XP-02's migration put there for exactly this read. */
      index: "XpEvent_memberId_createdAt_idx",
    },
  ],
  fallback: { param: "earned", direction: "desc" },
  /*
   * `XpEvent` is keyed by `id`, and the convention makes that a statement rather
   * than an assumption for a good reason: `Game` is keyed by `id` and `Player`
   * by `key`, so two of the first lists on this convention already disagree. A
   * keyset built over a column that does not uniquely identify a row pages
   * plausibly and incorrectly — and the tiebreaker does real work on nearly
   * every page of THIS list, because four awards land in one transaction when a
   * game ends, so identical timestamps are the ordinary case rather than a
   * coincidence.
   */
  tiebreak: "id",
};

/** A screenful of awards. More than a game list's twenty: a row is one line. */
export const XP_LEDGER_PAGE = 25;

/** And the most anybody may ask for at once. */
export const XP_LEDGER_PAGE_MAX = 100;
