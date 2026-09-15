import { LADDER_STRENGTH } from "./ladderStrength.data";
import type { LadderMeasurement, LadderStrengthTable } from "./ladderStrength.types";
import type { RuleVariant } from "./gomoku.types";

/**
 * How the graded computer players measured at one game — or nothing.
 *
 * Null in three cases, and each is "this cannot be answered" rather than an
 * answer, which is AGENTS.md's "Nothing Answers What It Cannot Answer" applied
 * to a table that goes stale the moment a grade's code changes:
 *
 *  - the game has never been measured: there is no row;
 *  - the row measured different code: its fingerprint is not `fingerprint`;
 *  - the current code's fingerprint could not be read: `fingerprint` is null.
 *
 * A stale measurement is confidently wrong, which is worse than none, so it is
 * not returned. It is not an error either: regenerating is hours of CPU, and a
 * bot change must still be able to ship before anybody has spent them.
 *
 * Pure — the table and the fingerprint are handed in — so it is tested without
 * a file system. `readLadderFingerprint` is the server's way of finding the
 * current fingerprint.
 */
export function measuredLadder(
  variant: RuleVariant,
  fingerprint: string | null,
  table: LadderStrengthTable = LADDER_STRENGTH,
): LadderMeasurement | null {
  if (fingerprint === null) return null;
  const row = table[variant];
  if (row === undefined) return null;
  return row.fingerprint === fingerprint ? row : null;
}
