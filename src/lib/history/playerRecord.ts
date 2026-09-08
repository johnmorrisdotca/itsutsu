import "server-only";

import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";

/** A player's won-lost-drawn record, overall and by game, from the games table. */
export type PlayerRecord = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  byVariant: { variant: string; wins: number; losses: number; draws: number }[];
  recent: { id: string; variant: string; opponent: string; outcome: "won" | "lost" | "drew" }[];
};

const RECENT = 10;

/**
 * Counts every finished game the name took part in, either colour, matched
 * case-insensitively. Abandoned games are not results and are left out.
 */
export async function fetchPlayerRecord(name: string): Promise<PlayerRecord> {
  const key = playerKey(name);
  const empty: PlayerRecord = { games: 0, wins: 0, losses: 0, draws: 0, byVariant: [], recent: [] };
  if (key === "") return empty;

  const rows = await prisma.game.findMany({
    where: {
      status: "finished",
      result: { not: "abandoned" },
      OR: [
        { blackName: { equals: key, mode: "insensitive" } },
        { whiteName: { equals: key, mode: "insensitive" } },
      ],
    },
    orderBy: { playedAt: "desc" },
    select: { id: true, variant: true, blackName: true, whiteName: true, winner: true, hiddenByBlack: true, hiddenByWhite: true },
  });

  const record: PlayerRecord = { ...empty, byVariant: [], recent: [] };
  const byVariant = new Map<string, { wins: number; losses: number; draws: number }>();

  for (const game of rows) {
    const isBlack = playerKey(game.blackName) === key;
    const outcome =
      game.winner === null ? "drew" : (game.winner === "black") === isBlack ? "won" : "lost";
    record.games += 1;
    if (outcome === "won") record.wins += 1;
    else if (outcome === "lost") record.losses += 1;
    else record.draws += 1;

    const tally = byVariant.get(game.variant) ?? { wins: 0, losses: 0, draws: 0 };
    if (outcome === "won") tally.wins += 1;
    else if (outcome === "lost") tally.losses += 1;
    else tally.draws += 1;
    byVariant.set(game.variant, tally);

    // A game this player hid counts, and is not listed.
    const hidden = isBlack ? game.hiddenByBlack : game.hiddenByWhite;
    if (!hidden && record.recent.length < RECENT) {
      record.recent.push({
        id: game.id,
        variant: game.variant,
        opponent: isBlack ? game.whiteName : game.blackName,
        outcome,
      });
    }
  }

  record.byVariant = Array.from(byVariant, ([variant, tally]) => ({ variant, ...tally })).sort(
    (a, b) => b.wins + b.losses + b.draws - (a.wins + a.losses + a.draws),
  );
  return record;
}
