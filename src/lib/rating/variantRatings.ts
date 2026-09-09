import "server-only";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame, tierFor, type GameScore, type RatingTier } from "./elo";
import { playerKey } from "./playerKey";
import { memberIdForName } from "./players";
import { isReservedKey } from "./reservedKeys";
import { outcomeFor, poolWrite, standingIn, type RatingPool } from "./pools";

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

function toStanding(row: StandingRow): VariantStanding {
  return { ...row, tier: tierFor(row.ratedGames) };
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
  if (
    blackKey === "" ||
    whiteKey === "" ||
    blackKey === whiteKey ||
    isReservedKey(blackKey) ||
    isReservedKey(whiteKey)
  ) {
    return;
  }

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
export async function fetchVariantLeaders(variant: string, limit: number): Promise<VariantStanding[]> {
  const rows = await prisma.playerVariantRating.findMany({
    where: { variant },
    orderBy: [
      { rating: "desc" },
      { ratedGames: "desc" },
      { updatedAt: "desc" },
      { key: "asc" },
    ],
    take: limit,
  });
  return rows.map(toStanding);
}

/**
 * Every standing one player holds, their most played game first — what a
 * player's page and the directory show under their global rating.
 */
export async function fetchVariantStandings(name: string): Promise<VariantStanding[]> {
  const key = playerKey(name);
  if (key === "") return [];
  const rows = await prisma.playerVariantRating.findMany({
    where: { key },
    orderBy: [{ ratedGames: "desc" }, { rating: "desc" }],
  });
  return rows.map(toStanding);
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
    orderBy: [{ rating: "desc" }, { ratedGames: "desc" }],
  });
  return championsOf(rows.map(toStanding));
}
