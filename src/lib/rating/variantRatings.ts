import "server-only";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame, tierFor, type GameScore, type RatingTier } from "./elo";
import { playerKey } from "./playerKey";
import { memberIdForName } from "./players";
import { isRateable } from "./rateable";
import { POOL_COLUMNS, RATING_POOLS, outcomeFor, poolWrite, standingIn, type RatingPool } from "./pools";

/**
 * Ratings per game, alongside the global ladder.
 *
 * The ladder on Player ranks a name against every other name whatever they
 * played, which is one list for thirty-three games. This keeps a separate Elo
 * for each variant, so being good at Notakto is a different claim from being
 * good at Renju.
 *
 * The maths is the same maths: `rateGame` from elo.ts, unchanged, applied to a
 * different pair of rows. Only shared games reach here — a game at one screen
 * is filed and never rated — so a standing is often a handful of games, and
 * `tierFor` will honestly call most of them unrated.
 */

export type VariantStanding = {
  key: string;
  name: string;
  variant: string;
  rating: number;
  ratedGames: number;
  tier: RatingTier;
  wins: number;
  losses: number;
  draws: number;
  /**
   * Which ladder these figures are from.
   *
   * Carried rather than assumed, because a page showing a standing has to be
   * able to say which one it is: a rating earned against the programs is not
   * a place among people and must never be read as one. It is also what a
   * count needs to link to the games it counted.
   */
  pool: RatingPool;
};

type StandingRow = {
  key: string;
  name: string;
  variant: string;
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
};

function toStanding(row: StandingRow, pool: RatingPool = RATING_POOLS.people): VariantStanding {
  const standing = standingIn(row as unknown as Record<string, unknown>, pool);
  return {
    key: row.key,
    name: row.name,
    variant: row.variant,
    ...standing,
    tier: tierFor(standing.ratedGames),
    pool,
  };
}

/** The score a result is worth to black, as Elo counts it. */
export function scoreForBlack(winner: "black" | "white" | null): GameScore {
  return winner === "black" ? 1 : winner === "white" ? 0 : 0.5;
}

/**
 * Moves both players' standing in one variant after a finished game.
 *
 * Mirrors `recordResult`, which owns the global ladder: an anonymous seat or
 * both seats under one name changes nothing, and a draw is half a point each.
 */
export async function recordVariantResult(
  blackName: string,
  whiteName: string,
  winner: "black" | "white" | null,
  variant: string,
  pool: RatingPool,
): Promise<void> {
  const blackKey = playerKey(blackName);
  const whiteKey = playerKey(whiteName);
  if (!isRateable(blackName, whiteName)) return;

  // Anchored to the member's id where there is one, exactly as the global
  // ladder is: one standing belongs to one person, whatever they are called.
  const [blackId, whiteId] = await Promise.all([
    memberIdForName(blackName),
    memberIdForName(whiteName),
  ]);

  const [black, white] = await Promise.all([
    prisma.playerVariantRating.upsert({
      where: { key_variant: { key: blackKey, variant } },
      create: { key: blackKey, variant, name: blackName.trim(), rating: RATING_START, memberId: blackId },
      update: { name: blackName.trim(), ...(blackId === null ? {} : { memberId: blackId }) },
    }),
    prisma.playerVariantRating.upsert({
      where: { key_variant: { key: whiteKey, variant } },
      create: { key: whiteKey, variant, name: whiteName.trim(), rating: RATING_START, memberId: whiteId },
      update: { name: whiteName.trim(), ...(whiteId === null ? {} : { memberId: whiteId }) },
    }),
  ]);

  // The same pool on both sides, per game, exactly as the global ladder does it.
  const rated = rateGame(standingIn(black, pool), standingIn(white, pool), scoreForBlack(winner));

  await prisma.$transaction([
    prisma.playerVariantRating.update({
      where: { key_variant: { key: blackKey, variant } },
      data: poolWrite(pool, rated.first.rating, rated.first.ratedGames, outcomeFor(winner, "black")) as never,
    }),
    prisma.playerVariantRating.update({
      where: { key_variant: { key: whiteKey, variant } },
      data: poolWrite(pool, rated.second.rating, rated.second.ratedGames, outcomeFor(winner, "white")) as never,
    }),
  ]);
}

/**
 * The leaderboard for one game: best first, unrated standings included.
 *
 * Tied on rating and on games played, the one who played most recently
 * stands higher, and the name settles the rest — see `fetchLeaders`. Without
 * a total order the same page shows a different fifty each time it is loaded.
 */
export async function fetchVariantLeaders(
  variant: string,
  limit: number,
  pool: RatingPool = RATING_POOLS.people,
): Promise<VariantStanding[]> {
  const columns = POOL_COLUMNS[pool];
  const rows = await prisma.playerVariantRating.findMany({
    /*
     * Somebody with a standing in THIS pool, which is not the same as somebody
     * with a row. A row is written the first time a name finishes a game of
     * this variant in either pool, so a player who has only ever played the
     * computer at Reversi has a row whose people columns are untouched — a
     * rating of 1600 over no games at all. Listing them on the ladder of
     * people would be reading the wrong half of the row and calling it a
     * standing, which is the fault the directory had until tonight.
     */
    where: { variant, [columns.ratedGames]: { gt: 0 } } as never,
    orderBy: [
      { [columns.rating]: "desc" },
      { [columns.ratedGames]: "desc" },
      { updatedAt: "desc" },
      { key: "asc" },
    ] as never,
    take: limit,
  });
  return rows.map((row) => toStanding(row, pool));
}

/**
 * Every standing one player holds, their most played game first — what a
 * player's page and the directory show under their global rating.
 */
export async function fetchVariantStandings(
  name: string,
  memberId?: string | null,
): Promise<VariantStanding[]> {
  const key = playerKey(name);
  const mine = memberId != null && memberId !== "" ? memberId : null;
  if (key === "" && mine === null) return [];
  /*
   * Every game they have actually played, said under the right heading.
   *
   * A row exists from the first finished game in EITHER pool, so reading the
   * people columns alone put a player who has only ever played the computer
   * on the ladder of people at the starting rating over no games at all.
   * Filtering that out fixed the false line and left a different fault behind:
   * the game vanished from their page entirely, and "you have never played
   * Reversi" is not true of somebody who has played it twenty times.
   *
   * So neither. A standing is shown from the pool that earned it, and says
   * which pool that was. Nothing is invented and nothing is hidden.
   */
  const rows = await prisma.playerVariantRating.findMany({
    /*
     * Standings they have actually earned, for the same reason the ladder
     * asks: a row exists from the first finished game in EITHER pool, so
     * without this a player who has only played the computer at a game is
     * shown holding a standing among people at the starting rating over no
     * games at all.
     *
     * What that leaves out is that they play this game at all, which their
     * computer-pool standing would say — a gap, and a smaller fault than a
     * figure nobody earned. It wants its own decision rather than a filter.
     */
    /*
     * Found by the member where there is one, and by the folded name where
     * there is not. A standing is keyed by the name it was earned under, and
     * that key does not move when somebody renames — so a member who changed
     * their display name lost every per-game standing off their own page. See
     * `fetchPlayerRecord`, which had the same fault for the same reason.
     */
    where: {
      ...(mine === null ? { key } : { OR: [{ memberId: mine }, ...(key === "" ? [] : [{ key }])] }),
      AND: [{ OR: [{ ratedGames: { gt: 0 } }, { computerRatedGames: { gt: 0 } }] }],
    },
    orderBy: [{ ratedGames: "desc" }, { rating: "desc" }],
  });
  /*
   * One line per STANDING rather than per row, because a row can hold two.
   * Somebody who has played both people and programs at a game has earned two
   * separate things, and merging them is the one operation these pools exist
   * to forbid — so they are two lines, and the page marks which is which.
   *
   * Filtering to standings actually earned was right and, on its own, made a
   * player who had only played programs vanish from their own record entirely.
   * That was the fix taking away a false line and leaving no line at all.
   */
  return rows.flatMap((row) => {
    const held: VariantStanding[] = [];
    if (row.ratedGames > 0) held.push(toStanding(row, RATING_POOLS.people));
    if (row.computerRatedGames > 0) held.push(toStanding(row, RATING_POOLS.computer));
    return held;
  });
}

/** One game's standing at a glance: who leads it, and how much play is behind that. */
export type VariantChampion = {
  variant: string;
  leader: VariantStanding;
  /** Names with a standing in this game. */
  players: number;
  /** Rated games played under it. A game moves two standings, so it is counted once here. */
  games: number;
};

/**
 * The champion of every game that has one, from every standing best first.
 * Pure, so the picking is testable without a database: the first standing
 * seen for a variant leads it, and every later one only adds to the tallies.
 */
export function championsOf(standings: readonly VariantStanding[]): Map<string, VariantChampion> {
  const champions = new Map<string, VariantChampion>();
  for (const standing of standings) {
    const entry = champions.get(standing.variant);
    if (entry === undefined) {
      champions.set(standing.variant, { variant: standing.variant, leader: standing, players: 1, games: standing.ratedGames });
    } else {
      entry.players += 1;
      entry.games += standing.ratedGames;
    }
  }
  for (const entry of champions.values()) entry.games = Math.round(entry.games / 2);
  return champions;
}

/**
 * The best-rated player at every game, keyed by variant. A variant nobody
 * has played rated is simply absent. This reads every standing, which is
 * members times games at most — small for a club, and one query.
 */
export async function fetchChampions(): Promise<Map<string, VariantChampion>> {
  const rows = await prisma.playerVariantRating.findMany({
    // The comment above says a variant nobody has played rated is simply
    // absent, and until this line that was a description of what was meant
    // rather than of what happened: every row counted, including the ones
    // whose only games were against a program. A game whose "champion" never
    // beat a person is not a champion, and the players and games tallies
    // beside the name counted the same rows.
    where: { ratedGames: { gt: 0 } },
    orderBy: [{ rating: "desc" }, { ratedGames: "desc" }],
  });
  return championsOf(rows.map((row) => toStanding(row)));
}
