import { xpLevelFor } from "./xpCurve";

/**
 * WHO HAS A STANDING WORTH PRINTING, AND WHAT IT IS.
 *
 * Two questions with one answer, which is why they are one module: the level
 * beside somebody's name and the XP figure in the column are the same fact seen
 * twice, and a member either has a standing or has not. Asked in three places —
 * the members directory, a person's public page, and every table of records —
 * and a rule written three times is a rule that will read three ways within a
 * fortnight.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOUGHT IS LEVEL ONE. JOHN SAID SO, AND THIS REVERSES WHAT WAS HERE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This module used to answer `null` for a member with no XP, on the argument
 * `xpBoard.ts` makes about the leaderboard: *"two hundred rows of 'Lv 1 · Insert
 * Coin · 0' would be a table about a default rather than about anybody's play."*
 * That reasoning is sound about WHO THE LEADERBOARD IS A LIST OF and wrong about
 * a badge beside a name, and the site's owner settled it in five words:
 *
 *   "Everyone is level 1 if 0xp."
 *
 * He is right, and the reason is worth keeping because it is the general case of
 * a mistake this file made: **a level is not a claim about somebody's play, it
 * is where they stand on a ladder everybody is on.** Level 1 is called Insert
 * Coin precisely because it is where a person starts. Hiding it does not spare a
 * reader a meaningless badge; it tells them the ladder does not include them,
 * which is the one thing it must not say to somebody who has just arrived.
 *
 * So the silence is gone and, with it, the trap the old rule set: a member with
 * nought was INDISTINGUISHABLE from a member whose XP nobody had read. That
 * distinction now lives where it belongs — in `MemberLevel`, whose `xp` is
 * optional and whose `undefined` means "nobody asked" and draws nothing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A PROGRAM STANDS WHERE ITS TOTAL PUTS IT, LIKE ANYONE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This module used to answer `null` for a member with an engine name, and
 * `awardXp` refused to pay one, so every computer player read "–" on every
 * table and its page drew no standing at all. That was a reading of John's
 * "Everyone is level 1 if 0xp." as "everyone who is a person", and he has
 * since said the opposite, looking at the live site:
 *
 *   "i still don't see Levels for all equally and bots don't have XP"
 *
 * So there is no second question here about WHO. A program earns under the
 * same rules as a person, from the same finished games, and stands on the same
 * ladder at the rung its total puts it on — Level 1 at nought, like anyone. The
 * one dash left on the site is a name nobody has claimed, which has no member
 * behind it to have earned anything; that is said by the table that holds such
 * rows, not here.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND A TOTAL THAT IS NOT A NUMBER IS STILL SILENCE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `xpLevelFor` floors a NaN, an infinity and a negative to 1, which is a
 * perfectly valid level that also means "nobody has earned anything yet" — the
 * shape AGENTS.md names: *a rule that cannot measure must not fire; silence is
 * the safe answer, zero is the dangerous one.* Nought is a real total and gets a
 * real answer; nonsense gets none.
 */

/** Enough of a member to decide whether they have a standing, and what it is. */
export type StandingOf = {
  xp: number;
};

/**
 * Whether this member is one the XP ladder is about at all.
 *
 * Private, and the reason both exported functions are in this file: the level
 * and the total must never disagree about whether there is anything to show.
 * A row with `Lv 1` and a dash for its total, or a `0` with no rung beside it,
 * would be two halves of one fact contradicting each other in one row.
 */
function hasStanding({ xp }: StandingOf): boolean {
  return Number.isFinite(xp) && xp >= 0;
}

/** The level to badge beside this member's name, or null for one with no standing. */
export function levelShown(member: StandingOf): number | null {
  if (!hasStanding(member)) return null;
  return xpLevelFor(member.xp);
}

/**
 * The XP total to print in this member's column, or null for one with no
 * standing.
 *
 * NOUGHT IS A NUMBER AND PRINTS AS ONE. A person who has earned nothing has
 * earned nothing, which is a fact about them and reads as one in a column of
 * tabular figures — where an em dash would read as "this is not known", the
 * thing a dash means in every other cell of the same table. Null is reserved for
 * a row where the figure genuinely cannot be had: a program, a rating row keyed
 * by a folded name, a row whose subject is a game.
 */
export function xpShown(member: StandingOf): number | null {
  if (!hasStanding(member)) return null;
  return member.xp;
}
