/**
 * Which game to play next, and the order a queue of them reads in.
 *
 * Pure, and separate from `myGames.ts` because that file reaches the database
 * and this rule has to be checkable without one — and because the same rule is
 * wanted in two places: the order the "Your move" list is drawn in, and which
 * game somebody is taken to after they move.
 *
 * OLDEST FIRST, which is the opposite of every other list on this site. A
 * record reads newest first because it is history and the last thing that
 * happened is the interesting one. A queue of games waiting on YOU is not
 * history; it is a debt, and the one that has been waiting longest is the one
 * somebody is most likely to be wondering about. The elder correspondence
 * sites all worked this way, and John plays several games at once.
 */
export type Waiting = { since: string };

/** Longest-waiting first. The tie is broken so two games cannot swap places between reads. */
export function waitingFirst<T extends Waiting>(a: T, b: T): number {
  return a.since.localeCompare(b.since);
}

/**
 * The next game to be taken to, or null when nothing is waiting.
 *
 * `exclude` is the game just played: after a move, that board is the one place
 * somebody has definitely finished with, and it may still be in the list for
 * a moment — a game where a move takes a turn rather than ending it can come
 * straight back round to you.
 */
export function nextWaiting<T extends Waiting & { game: { id: string } }>(
  yourMove: readonly T[],
  exclude?: string,
): T | null {
  const queue = [...yourMove]
    .filter((one) => one.game.id !== exclude)
    .sort(waitingFirst);
  return queue[0] ?? null;
}
