import { XP_ONE_MORE_GAME } from "./xp.constants";
import { levelCrossed, xpStanding } from "./xpCurve";

/**
 * The level a toast may mention, or nothing.
 *
 * Two cases and no third:
 *
 * - **A level was crossed.** `reached: true`, and the toast says so outright.
 * - **The award left them within one game of the next one.** `reached: false`,
 *   and the toast adds a quiet "Next level" line.
 *
 * **Not on every award**, which is the other thing the toast's interface allows.
 * A daily-visit toast carrying a progress line every single day turns a courtesy
 * that goes away on its own into a status panel following a reader round the
 * site. The nudge earns its place by being rare — and by being true:
 * `XP_ONE_MORE_GAME` is what one finished win pays, so "one more game" is
 * something a reader can go and do, where a percentage of a level's span is a
 * number nobody can act on.
 *
 * Null at the top of the ladder, where there is no next level. Not level 100
 * with `reached: false`, which would read as a level somebody is approaching
 * while already standing on it.
 */
export function levelNote(before: number, after: number): { level: { level: number; reached: boolean } } | null {
  const crossed = levelCrossed(before, after);
  if (crossed !== null) return { level: { level: crossed.to, reached: true } };

  const standing = xpStanding(after);
  if (standing.span === 0) return null;
  if (standing.toNext > XP_ONE_MORE_GAME) return null;
  return { level: { level: standing.level + 1, reached: false } };
}
