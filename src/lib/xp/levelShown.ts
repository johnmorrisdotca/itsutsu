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
 * A PROGRAM HAS NO STANDING, AND THAT IS A RULE ABOUT WHO RATHER THAN WHAT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `awardXp` refuses a program by name — `if (member.botTier !== null) return
 * refused(awards, XP_SKIP_REASONS.notAPerson, member.xp)` — and the backfill
 * skips them the same way, so every bot row on every database carries exactly
 * nought and always will. Under the old rule that fell out for free: nought was
 * silence, so the programs were silent without anybody naming them.
 *
 * It no longer falls out, so it is stated. `Lv 1` beside Meijin, which has
 * played hundreds of games and cannot climb a rung however many more it plays,
 * would be a badge about a thing that is not on the ladder at all — and
 * `xpBoard.ts` already keeps `botTier: null` out of the leaderboard for exactly
 * this reason. Here rather than in each table, because "which members have a
 * standing" is one question and three tables asking it separately would be
 * three chances to answer it differently.
 *
 * It is deliberately NOT "programs earn nothing, so they show nothing": that was
 * the old rule's phrasing and it is now indistinguishable from a person who has
 * earned nothing. This says the thing that is actually true — a program is not a
 * member the ladder is about.
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
  /** The engine that plays this member's seats, when a program does. */
  botTier?: string | null;
};

/**
 * Whether this member is one the XP ladder is about at all.
 *
 * Private, and the reason both exported functions are in this file: the level
 * and the total must never disagree about whether there is anything to show.
 * A row with `Lv 1` and a dash for its total, or a `0` with no rung beside it,
 * would be two halves of one fact contradicting each other in one row.
 */
function hasStanding({ xp, botTier }: StandingOf): boolean {
  // A non-empty engine name is a program. `Boolean(member.botTier)` is the same
  // test the player page makes, so "is this a program" reads one way everywhere.
  if (typeof botTier === "string" && botTier !== "") return false;
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
