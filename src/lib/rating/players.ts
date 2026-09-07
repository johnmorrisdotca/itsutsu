import "server-only";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame, tierFor, type GameScore, type RatingTier } from "./elo";

/**
 * Players by name. There are no accounts, so a name is an identity: the
 * folded form is the key, and the record and rating belong to whoever types
 * it. That is the honest limit of a site without sign-in, and the README says
 * so. Anonymous seats — a blank name — are never rated and never recorded.
 */

import { playerKey } from "./playerKey";

export { playerKey };

export type PlayerProfile = {
  key: string;
  name: string;
  rating: number;
  ratedGames: number;
  tier: RatingTier;
  wins: number;
  losses: number;
  draws: number;
};

function toProfile(row: {
  key: string;
  name: string;
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
}): PlayerProfile {
  return { ...row, tier: tierFor(row.ratedGames) };
}

export async function fetchPlayer(name: string): Promise<PlayerProfile | null> {
  const key = playerKey(name);
  if (key === "") return null;
  const row = await prisma.player.findUnique({ where: { key } });
  return row === null ? null : toProfile(row);
}

/** The top players by rating, established ones first. */
export async function fetchLeaders(limit: number): Promise<PlayerProfile[]> {
  const rows = await prisma.player.findMany({
    where: { ratedGames: { gt: 0 } },
    orderBy: [{ rating: "desc" }, { ratedGames: "desc" }],
    take: limit,
  });
  return rows.map(toProfile);
}

/**
 * Records one finished game between two named players: win, loss and draw
 * tallies for both, and a rating exchange. A game with a blank name on
 * either side changes nothing, and a draw scores a half each.
 */
export async function recordResult(
  blackName: string,
  whiteName: string,
  winner: "black" | "white" | null,
): Promise<void> {
  const blackKey = playerKey(blackName);
  const whiteKey = playerKey(whiteName);
  if (blackKey === "" || whiteKey === "" || blackKey === whiteKey) return;

  const [black, white] = await Promise.all([
    prisma.player.upsert({
      where: { key: blackKey },
      create: { key: blackKey, name: blackName.trim(), rating: RATING_START },
      update: { name: blackName.trim() },
    }),
    prisma.player.upsert({
      where: { key: whiteKey },
      create: { key: whiteKey, name: whiteName.trim(), rating: RATING_START },
      update: { name: whiteName.trim() },
    }),
  ]);

  const blackScore: GameScore = winner === "black" ? 1 : winner === "white" ? 0 : 0.5;
  const rated = rateGame(
    { rating: black.rating, ratedGames: black.ratedGames },
    { rating: white.rating, ratedGames: white.ratedGames },
    blackScore,
  );

  await prisma.$transaction([
    prisma.player.update({
      where: { key: blackKey },
      data: {
        rating: rated.first.rating,
        ratedGames: rated.first.ratedGames,
        wins: { increment: winner === "black" ? 1 : 0 },
        losses: { increment: winner === "white" ? 1 : 0 },
        draws: { increment: winner === null ? 1 : 0 },
      },
    }),
    prisma.player.update({
      where: { key: whiteKey },
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
