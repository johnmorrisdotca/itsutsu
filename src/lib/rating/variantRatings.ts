import "server-only";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame, tierFor, type GameScore, type RatingTier } from "./elo";
import { playerKey } from "./playerKey";

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
  if (blackKey === "" || whiteKey === "" || blackKey === whiteKey) return;

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
