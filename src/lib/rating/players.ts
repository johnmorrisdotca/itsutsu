import "server-only";

import { prisma } from "@/lib/prisma";
import { tierFor, type RatingTier } from "./elo";
import { RATING_POOLS } from "./pools";
import { streakIn, type Streak } from "./streak";

/**
 * Players by name. There are no accounts, so a name is an identity: the
 * folded form is the key, and the record and rating belong to whoever types
 * it. That is the honest limit of a site without sign-in, and the README says
 * so. Anonymous seats — a blank name — are never rated and never recorded.
 */

import { playerKey } from "./playerKey";
import { ratingShown } from "./shownRecord";

export { playerKey };

export type PlayerProfile = {
  key: string;
  name: string;
  /**
   * The member this record belongs to, or null for one with nobody behind it.
   *
   * Carried so that a link to this person can be built from their ID rather
   * than from their name. A link built from the name put a member's whole
   * surname in the markup under a screen showing only "Hanako M." — see
   * `playerPath`.
   */
  memberId: string | null;

  rating: number;
  ratedGames: number;
  tier: RatingTier;
  wins: number;
  losses: number;
  draws: number;
  /**
   * The same figures for games played against the computer players, which are
   * scored in a pool of their own so a game against a program never moves
   * where somebody stands among the people.
   *
   * A computer player has nothing BUT this: it never plays a person-against-
   * person game, so its ordinary rating sits at its starting value for ever
   * and its wins and losses stay at nought. A page that read the ordinary
   * figures for a bot would say it had never played, however many games it
   * had just finished.
   */
  computer: { rating: number; ratedGames: number; wins: number; losses: number; draws: number; streak: Streak | null };
  /**
   * The run on the ladder of people: rated games in that pool and nothing
   * else, so it matches the wins and losses above it exactly.
   */
  streak: Streak | null;
  /**
   * The run across every rated game played here, whichever pool scored it.
   *
   * A THIRD NUMBER RATHER THAN THE SUM OF TWO, and it has to be. `gamesPlayed`
   * adds the two pools' counts because a game is a game; a run cannot be added
   * that way, because it depends on the order the two pools' games interleave
   * in — which neither pool's own run records. So it is stored alongside them
   * and is what the members list and a member's own headline show, since
   * those are the figures counting both pools.
   */
  ratedStreak: Streak | null;
};

export function toProfile(row: {
  key: string;
  name: string;
  memberId: string | null;
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
  computerRating: number;
  computerRatedGames: number;
  computerWins: number;
  computerLosses: number;
  computerDraws: number;
  // The streak columns, read through `streakIn` so the pair is only ever
  // believed together. Typed loosely here because the row comes straight from
  // Prisma and the guard is in one place rather than in this shape.
  peopleStreakKind?: string | null;
  peopleStreakCount?: number;
  computerStreakKind?: string | null;
  computerStreakCount?: number;
  ratedStreakKind?: string | null;
  ratedStreakCount?: number;
}): PlayerProfile {
  const {
    computerRating,
    computerRatedGames,
    computerWins,
    computerLosses,
    computerDraws,
    peopleStreakKind: _peopleKind,
    peopleStreakCount: _peopleCount,
    computerStreakKind: _computerKind,
    computerStreakCount: _computerCount,
    ratedStreakKind: _ratedKind,
    ratedStreakCount: _ratedCount,
    ...people
  } = row;
  const columns = row as unknown as Record<string, unknown>;
  return {
    ...people,
    tier: tierFor(row.ratedGames),
    computer: {
      rating: computerRating,
      ratedGames: computerRatedGames,
      wins: computerWins,
      losses: computerLosses,
      draws: computerDraws,
      streak: streakIn(columns, RATING_POOLS.computer),
    },
    streak: streakIn(columns, RATING_POOLS.people),
    ratedStreak: streakIn(columns, "all"),
  };
}

export async function fetchPlayer(name: string, memberId?: string | null): Promise<PlayerProfile | null> {
  /*
   * THE MEMBER FIRST, THE NAME AFTER, and the order is the whole fix.
   *
   * `key` is the folded name a record was earned under, and it does not move
   * when somebody renames. So a rating looked up by today's name finds
   * nothing and the page prints zeros — one column away from the row holding
   * the answer. That is what happened to a twelve-year-old who renamed on
   * this site's own advice: seven games played, "0 games" on her page.
   *
   * `memberId` is on the row already and indexed; the migration that put it
   * there (0.73.0, 0.75.0) stopped before the lookups followed. This is the
   * lookups following.
   *
   * The name remains the answer for a record with NO member behind it — a
   * name typed into a game at one screen, or a record kept from another site
   * — which is most of what this table holds and must keep working.
   */
  if (memberId != null && memberId !== "") {
    const owned = await prisma.player.findFirst({ where: { memberId } });
    if (owned !== null) return toProfile(owned);
  }
  const key = playerKey(name);
  if (key === "") return null;
  const row = await prisma.player.findUnique({ where: { key } });
  return row === null ? null : toProfile(row);
}

/**
 * The top players by rating, established ones first.
 *
 * The order among equals is settled rather than left to the database. A new
 * site is a wall of people on the same rating with the same number of games,
 * and an order nobody chose is an order that changes between two loads of the
 * same page: a name moves up, another disappears off the end, and nothing
 * happened. Among a tie the one who played most recently stands higher, and
 * the name settles the rest, so the list is the same list twice running.
 */
export async function fetchLeaders(limit: number): Promise<PlayerProfile[]> {
  const rows = await prisma.player.findMany({
    where: { ratedGames: { gt: 0 } },
    orderBy: [
      { rating: "desc" },
      { ratedGames: "desc" },
      { updatedAt: "desc" },
      { key: "asc" },
    ],
    take: limit,
  });
  return rows.map(toProfile);
}

/**
 * The member who plays under this name, by id, or null when nobody does.
 *
 * Matched on the folded name, which is how every other part of this site
 * decides that two spellings are one person. It is not how identity will
 * work for ever — that is what the id is for — but it is how a name typed
 * into a game finds the account it belongs to today.
 */
export async function memberIdForName(name: string): Promise<string | null> {
  const key = playerKey(name);
  if (key === "") return null;
  const rows = await prisma.member.findMany({ select: { id: true, name: true } });
  return rows.find((row) => playerKey(row.name) === key)?.id ?? null;
}


/**
 * The rating worth showing beside a batch of names at once, keyed by the
 * folded name each was asked by.
 *
 * For the noticeboard's rating filter, which asks this once for every seat
 * on the board rather than once per row — the same reason `toDirectory`
 * fetches every player row it needs in a single query instead of one per
 * member. A name nobody has a settled rating for maps to null, the same
 * "nothing to show" `ratingShown` already uses, rather than to a starting
 * figure nobody earned.
 */
export async function ratingsByName(names: readonly string[]): Promise<Map<string, number | null>> {
  const keys = [...new Set(names.map(playerKey).filter((key) => key !== ""))];
  if (keys.length === 0) return new Map();
  const rows = await prisma.player.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((row) => [row.key, ratingShown(toProfile(row))?.rating ?? null]));
  return new Map(keys.map((key) => [key, byKey.get(key) ?? null]));
}

