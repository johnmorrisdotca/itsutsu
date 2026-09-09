/**
 * A capped listing with the rows that must survive the cap appended.
 *
 * Pure and named because the guarantee is otherwise untestable: on a small
 * database the rows in question are inside the limit anyway, so a test of the
 * listing passes whether or not anything holds them there. The bug only shows
 * past the limit, which is the one site nobody runs a test against.
 *
 * It knows nothing about members. What it is really about is a list ordered by
 * one thing and cut at a length, and the rows that must not be at the mercy of
 * that ordering — the computer players are never "seen", so recency puts them
 * last for ever. Kept out of members.ts because that file is about who
 * somebody is, and this is about how a list is cut.
 */
export function alwaysListed<T extends { id: string }>(capped: T[], always: T[]): T[] {
  const shown = new Set(capped.map((row) => row.id));
  return [...capped, ...always.filter((one) => !shown.has(one.id))];
}
