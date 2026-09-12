import { LEVEL_NAMES, type LevelName } from "./levelNames.constants";
import { XP_LEVELS } from "./xpCurve";

/**
 * THE JOIN BETWEEN THE LADDER'S NUMBERS AND THE LADDER'S NAMES, AND THE ONLY
 * DOOR TO EITHER.
 *
 * `levelNames.constants.ts` is a catalogue of a hundred rows and
 * `xpCurve.ts` is a table of a hundred costs, and the two are kept apart on
 * purpose: retuning the economy renames nobody, and renaming a level moves no
 * number. What they need between them is one lookup, and this is it.
 *
 * **Nothing reads `LEVEL_NAMES` directly.** `XP_DESIGN.md` says so, and the
 * reason is the fallback below rather than tidiness: a caller indexing the array
 * itself gets `undefined` for a level the catalogue does not have, and
 * `undefined.name` on a profile page is a crash where a plain `Level 101` is a
 * rank nobody has bothered to name yet. One door means the floor is in one
 * place and cannot be forgotten at the call site that needed it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE FLOOR IS A FLOOR, NOT A FEATURE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `Level 42` is what a level with no row is called. It is honest — that IS the
 * level — and it is legible, so a page renders and a reader is told something
 * true. It is not an invitation to ship levels without names: the catalogue is
 * held to exactly one hundred rows by `levelNames.test.ts`, so the only way to
 * reach the fallback today is to ask about a level the ladder does not have.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY A NUMBER THAT IS NOT A LEVEL GETS AN EM DASH AND NOT A NUMBER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Only an integer names a level, so `xpLevelName(4.7)` has no answer. The two
 * obvious ways to produce one are both worse than saying nothing:
 *
 *   - **Truncating** answers a question that was not asked. 4.7 would come back
 *     "Joystick", which is level 4's name, and the caller would have been told
 *     its rounding was a lookup. That is a value that happens to be in range
 *     standing in for "I do not know" — the exact fault AGENTS.md names.
 *   - **Interpolating anyway** puts `Level NaN` on a page, which is a reader
 *     being shown a JavaScript artefact.
 *
 * So the number is dropped and the em dash takes its place, which is how this
 * site already spells "there is no value here" — `rating/streak.ts` prints one
 * for a member with no finished game. It never throws, because a badge beside a
 * name is not worth a 500, and every real caller is upstream of `xpLevelFor`,
 * which only ever returns an integer between 1 and 100.
 */

/** What a level with no name is called. `42` is the level, and it is true. */
function floorName(level: number): string {
  return Number.isInteger(level) ? `Level ${level}` : "Level —";
}

/**
 * The catalogue's row for a level, or null when it has none.
 *
 * For the pages that want more than the name — the ladder at `/xp/levels` and a
 * level's own page, which show the kanji and the note. Null rather than a
 * part-filled row, because "level 101 is called nothing" and "level 101 is
 * called the empty string" must not look the same to the page drawing it.
 */
export function levelNameRow(level: number): LevelName | null {
  if (!Number.isInteger(level) || level < 1 || level > XP_LEVELS) return null;
  return LEVEL_NAMES[level - 1] ?? null;
}

/**
 * What a level is called: the catalogue's name, or `Level 42` when it has none.
 *
 * The one lookup every badge, toast and table cell goes through. It is a read of
 * a hundred-element array in memory, so a list showing a level beside every name
 * costs nothing — which is the reason the level is derived from `Member.xp` and
 * never stored beside it.
 */
export function xpLevelName(level: number): string {
  return levelNameRow(level)?.name ?? floorName(level);
}

/**
 * Where a level's own page lives.
 *
 * One definition, because four things link to it — the badge beside a name, the
 * ladder's hundred rows, a level page's own neighbours, and the leaderboard —
 * and an address written out four times is an address that moves in three places
 * the day it changes. `playerPath` in `rating/playerKey.ts` is here for the same
 * reason.
 *
 * The number goes in the PATH and not a query, because a level is a thing and
 * not a filter: `/xp/levels/42` is that rung, the way `/players/<id>` is that
 * person. The address rules in this repository are explicit about it.
 */
export function levelPath(level: number): string {
  return `/xp/levels/${level}`;
}

/**
 * A level's Japanese name, or the empty string.
 *
 * Empty rather than null so it can be handed straight to `Paired`, which already
 * reads an empty kanji as "there is none, so do not pair anything". Most of the
 * hundred have no kanji and that is normal — the catalogue says so — so a page
 * asking for one must not have to branch on two kinds of absence.
 */
export function xpLevelKanji(level: number): string {
  return levelNameRow(level)?.kanji ?? "";
}
