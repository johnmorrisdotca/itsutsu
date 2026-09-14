import { playerKey } from "./playerKey";

/** What choosing among a member's `Player` rows needs to know about each. */
export type OwnedRow = { key: string; updatedAt: Date };

/**
 * Which of a member's `Player` rows is THEIR row, when they have more than one.
 *
 * A `Player` row is keyed by the folded name a record was earned under, and a
 * rename does not move the key — so somebody who played under two names can
 * own two rows. Asking the database for "the first row with this memberId" and
 * no order is asking it to choose, and it is allowed to choose differently on
 * two loads of one page: the player page would show one rating while the link
 * under its counts resolved the other. None exist today, which is exactly why a
 * nondeterministic pick would go unnoticed until one did.
 *
 * So the choice is made here, once, for every caller:
 *
 *  1. the row whose key is the member's CURRENT name, because that is the name
 *     the site shows and the one their new games are recorded under;
 *  2. otherwise the row touched most recently — a rated result writes the row,
 *     so this is the name they last played under;
 *  3. and the key, only so that two rows touched in the same instant still
 *     come out in one order.
 *
 * Null for no rows, which the callers read as "no record behind this member".
 */
export function ownedRow<T extends OwnedRow>(rows: readonly T[], currentName: string): T | null {
  if (rows.length === 0) return null;
  const current = playerKey(currentName);
  if (current !== "") {
    const named = rows.find((row) => row.key === current);
    if (named !== undefined) return named;
  }
  return [...rows].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.key.localeCompare(b.key),
  )[0];
}
