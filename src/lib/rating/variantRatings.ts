import "server-only";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame, tierFor, type GameScore, type RatingTier } from "./elo";
import { playerKey } from "./playerKey";
import { isReservedKey } from "./reservedKeys";

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

  const [black, white] = await Promise.all([
    prisma.playerVariantRating.upsert({
      where: { key_variant: { key: blackKey, variant } },
      create: { key: blackKey, variant, name: blackName.trim(), rating: RATING_START },
      update: { name: blackName.trim() },
    }),
    prisma.playerVariantRating.upsert({
      where: { key_variant: { key: whiteKey, variant } },
      create: { key: whiteKey, variant, name: whiteName.trim(), rating: RATING_START },
      update: { name: whiteName.trim() },
    }),
  ]);

  const rated = rateGame(
    { rating: black.rating, ratedGames: black.ratedGames },
    { rating: white.rating, ratedGames: white.ratedGames },
    scoreForBlack(winner),
  );

  await prisma.$transaction([
    prisma.playerVariantRating.update({
      where: { key_variant: { key: blackKey, variant } },
      data: {
        rating: rated.first.rating,
        ratedGames: rated.first.ratedGames,
        wins: { increment: winner === "black" ? 1 : 0 },
        losses: { increment: winner === "white" ? 1 : 0 },
        draws: { increment: winner === null ? 1 : 0 },
      },
    }),
    prisma.playerVariantRating.update({
      where: { key_variant: { key: whiteKey, variant } },
      data: {
        rating: rated.second.rating,
        ratedGames: rated.second.ratedGames,
        wins: { increment: winner === "white" ? 1 : 0 },
        losses: { increment: winner === "black" ? 1 : 0 },
        draws: { increment: winner === null ? 1 : 0 },
      },
    }),
  ]);
}

/** The leaderboard for one game: best first, unrated standings included. */
export async function fetchVariantLeaders(variant: string, limit: number): Promise<VariantStanding[]> {
  const rows = await prisma.playerVariantRating.findMany({
    where: { variant },
    orderBy: [{ rating: "desc" }, { ratedGames: "desc" }],
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
