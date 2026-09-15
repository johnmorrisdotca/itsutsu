import type { ShownGroup } from "./myGames.types";

/**
 * A group of the queue as a panel shows it: capped, without losing how big the
 * group really was.
 *
 * Split out of `myGames.ts` when it reached the file-size gate. These two are
 * pure — a list and a number in, a capped list and its true size out — and the
 * rest of that file is the read that fills the groups. `myGames.ts` re-exports
 * both, so every import keeps its path.
 */

/**
 * Caps a bucket for display without losing how big the bucket actually was.
 *
 * The lobby caps how many of each group it shows — a "Lately finished" list
 * running to fifty rows is a page nobody reaches the bottom of — but the
 * header above the list has to say how many the bucket actually holds, not
 * how many made it past the cap. Slicing at the call site and counting
 * separately at the display site is exactly how "Lately finished 5" came to
 * sit over a bucket of fourteen: the header read the slice's own length,
 * which is never more than the cap, whatever the bucket held. Bundling the
 * slice and the bucket's true size into one answer is what keeps a header
 * from being able to make that mistake again.
 */
export function shownGroup<T>(items: readonly T[], cap: number): ShownGroup<T> {
  const shown = items.slice(0, cap);
  return { items: shown, total: items.length, hidden: items.length - shown.length };
}

/**
 * The same bucket, for the ONE group that arrives as a page rather than whole.
 *
 * `shownGroup` above derives the total from the list it was given, which is right
 * for a complete group and would be a LIE for a page: the finished group's list
 * is five rows of however many there are, so its own length is the cap and never
 * the total. The count comes from the database (see `MyQueue.finished`), so it is
 * passed in.
 *
 * Two functions rather than one that takes an optional total, because the
 * difference between them is which fact is being trusted and a caller passing
 * nothing would get a plausible, wrong number with nothing failing. The panel
 * reads both the same way, which is the whole point: `hidden` still means "how
 * many this is not showing", and the header still cannot print the slice's length
 * and call it the total.
 */
export function pagedGroup<T>(page: readonly T[], total: number): ShownGroup<T> {
  return { items: [...page], total, hidden: Math.max(0, total - page.length) };
}
