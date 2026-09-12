/**
 * How long a finished game stays in a member's own list.
 *
 * A player's queue is a working list: the games waiting on them, the ones
 * they are waiting on, and the ones just over. Keeping every finished game
 * there for ever turns it into an archive nobody scrolls to the bottom of,
 * and the games that still want something get pushed down by games that
 * want nothing.
 *
 * This hides them from that one list and from nowhere else. The record at
 * /history keeps every game exactly as it always has, the ratings are
 * untouched, and the games are still reachable by their own addresses — the
 * setting is about what a player is shown when they open their queue, not
 * about what the site remembers.
 */

import type { Prisma } from "@prisma/client";

/** Windows a member may choose, in days. Zero keeps everything. */
export const KEEP_FINISHED_DAYS = [0, 7, 14, 30, 90] as const;

export type KeepFinishedDays = (typeof KEEP_FINISHED_DAYS)[number];

export const KEEP_FINISHED_DISPLAY: Record<number, { label: string; kanji: string }> = {
  0: { label: "For ever", kanji: "無期限" },
  7: { label: "A week", kanji: "一週間" },
  14: { label: "A fortnight", kanji: "二週間" },
  30: { label: "A month", kanji: "一月" },
  90: { label: "Three months", kanji: "三月" },
};

/** The default: nothing disappears from anybody's list unless they ask. */
export const KEEP_FINISHED_DEFAULT = 0;

/** Whether a stored number is one of the windows on offer. */
export function isKeepFinishedDays(days: number): days is KeepFinishedDays {
  return (KEEP_FINISHED_DAYS as readonly number[]).includes(days);
}

/**
 * Whether a finished game still belongs in the player's own list.
 *
 * `since` is when the game last had something happen — its final move, or
 * when it was filed if it never had one. A window of zero keeps everything,
 * which is what a member who has never touched the setting gets.
 */
export function staysInMyList(since: string, keepDays: number, now: Date): boolean {
  if (!Number.isFinite(keepDays) || keepDays <= 0) return true;
  const age = now.getTime() - new Date(since).getTime();
  if (!Number.isFinite(age)) return true;
  return age <= keepDays * 86_400_000;
}

/**
 * THE SAME WINDOW, AS A `where`, SO THE ROWS PAST IT ARE NEVER READ.
 *
 * `staysInMyList` above decided this correctly and decided it too late. The
 * queue's query had no date bound at all: it read every game the member had
 * ever sat in, replayed the ones that could not answer for themselves, sorted
 * the lot, and then threw away everything outside the window — on `/play`, on
 * every `/api/games/mine` the badge asks for, and on every advance to the next
 * game. One member on a development database holds 559 of them and John's own
 * account will hold 559 eventually; work that grows with how much somebody has
 * played, on a page they open every day, is the cost this site rules out.
 *
 * So the bound goes in the query and the JavaScript check STAYS. It is not
 * belt-and-braces: the two answer different halves. This one knows the dates,
 * which are columns; the other knows whether a game is OVER, which for an
 * active row can take a replay (`settleEnded` — a Reversi board that filled up
 * is finished with nothing written down). A `where` cannot ask that, so this
 * one is deliberately the looser of the two and the second check is what
 * narrows it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT MUST NEVER DROP A ROW THE SECOND CHECK WOULD KEEP
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A row dropped here is not shown, whatever the rest of the file thinks — so
 * the four branches are the kinds of row that are never hidden, plus the
 * window itself:
 *
 *  1. `status: "active"` — a game still being played is never hidden however
 *     old it has grown, and neither is one nobody has started. The rows the
 *     engine has ended while the row still says active come through here too,
 *     which is the looseness above: `staysInMyList` then drops them exactly as
 *     it did before.
 *  2. An offer NOBODY HAS ANSWERED — never hidden either, for a stronger
 *     reason than age: somebody cannot start at all until it is answered. A
 *     pending offer is written `status: "active"`, so branch 1 already covers
 *     every one there is today; this branch says the rule rather than relying
 *     on that, because anything that ever filed an unanswered offer as
 *     finished would otherwise make old offers silently vanish. Spelt as the
 *     columns `offerState` reads, in the order it reads them.
 *  3. and 4. THE WINDOW, which is `since = lastMoveAt ?? playedAt` — a game's
 *     age is its last move where it has one, else when it was played — and
 *     `gte` because `staysInMyList` keeps a game whose age is EXACTLY the
 *     window (`age <= keepDays * 86_400_000` is `since >= now - that`). Two
 *     branches rather than a COALESCE so that Prisma can express it; they
 *     partition the rows, since `lastMoveAt` is either null or it is not.
 *     `retention.test.ts` proves the pair agrees with `staysInMyList` over
 *     every combination of the two columns rather than leaving that to the eye.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT SERVES EACH BRANCH, AND WHY NOTHING HERE NEEDS AN INDEX OF ITS OWN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This is ANDed onto the queue's seat `OR`, which is where the selectivity
 * is: `Game_blackMemberId_idx`, `Game_whiteMemberId_idx` and
 * `Game_offeredToMemberId_idx` for the three ways a game is a member's, and
 * the primary key for the seat cookies' `id IN (…)`. Postgres bitmap-ORs
 * those and applies this as a filter over the member's own rows, which is
 * already the smallest set anything here could scan. An index on `status` or
 * on `lastMoveAt` could not improve on that and would be read by nothing
 * else, so none is added.
 *
 * NULL, NOT A WINDOW OF ZERO, for "there is no bound" — a `keepDays` of 0
 * means KEEP EVERYTHING (see `KEEP_FINISHED_DISPLAY`, "For ever"), and it is
 * the default, so a zero read as a window would hide every finished game on
 * the site. An empty `{}` would be a where that filters nothing while reading
 * like one that was meant to.
 *
 * AND THE CASE THIS DOES NOT FIX, SAID PLAINLY. At `keepDays === 0` there is
 * no bound to put in, so a member keeping everything still reads every
 * finished game they have ever played — the default, and John's own setting.
 * Bounding that one needs the finished group to page by cursor, and it cannot
 * yet: which bucket a game lands in depends on whose turn it is, the order
 * within the group is `COALESCE(lastMoveAt, playedAt)` with no index on that
 * expression, and `shownGroup` promises the bucket's TRUE size above the five
 * rows it prints, which a page cannot answer without a count of its own. That
 * is a larger change than a bound and it is not this one. See `MyGamesList`,
 * which already argues why this page is not a cursor list.
 */
export function myListWindow(keepDays: number, now: Date): Prisma.GameWhereInput | null {
  if (!Number.isFinite(keepDays) || keepDays <= 0) return null;
  const oldest = new Date(now.getTime() - keepDays * 86_400_000);
  return {
    OR: [
      { status: "active" },
      { offeredAt: { not: null }, declinedAt: null, withdrawnAt: null },
      { lastMoveAt: { gte: oldest } },
      { lastMoveAt: null, playedAt: { gte: oldest } },
    ],
  };
}
