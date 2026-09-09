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
