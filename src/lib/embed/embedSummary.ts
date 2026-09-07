import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * The slice of the server an embedded board is allowed to see.
 *
 * Read-only and deliberately thin. It reports what has been played, not who
 * may play: no ids that grant anything, no invite codes, no seat tokens, and
 * no games still in progress — a live game's id is half of a seat link.
 */
export type EmbedSummary = {
  totalGames: number;
  /** Finished games, newest first. */
  recent: {
    playedAt: string;
    black: string;
    white: string;
    result: string;
    moveCount: number;
    size: number;
    variant: string;
  }[];
  /** Present only when a player was named in the request. */
  player: {
    name: string;
    played: number;
    won: number;
    lost: number;
    drawn: number;
  } | null;
};

const RECENT_LIMIT = 6;

export async function fetchEmbedSummary(
  playerName: string | null,
): Promise<EmbedSummary> {
  const finished = { status: "finished" as const };

  const [totalGames, rows] = await Promise.all([
    prisma.game.count({ where: finished }),
    prisma.game.findMany({
      where: finished,
      orderBy: [{ playedAt: "desc" }, { id: "asc" }],
      take: RECENT_LIMIT,
      select: {
        playedAt: true,
        blackName: true,
        whiteName: true,
        result: true,
        moveCount: true,
        size: true,
        variant: true,
      },
    }),
  ]);

  return {
    totalGames,
    recent: rows.map((row) => ({
      playedAt: row.playedAt.toISOString(),
      black: row.blackName,
      white: row.whiteName,
      result: row.result,
      moveCount: row.moveCount,
      size: row.size,
      variant: row.variant,
    })),
    player: playerName === null ? null : await playerRecord(playerName),
  };
}

/**
 * One player's record, matched on the name games were recorded under. Names
 * are free text, so this is a tally of a label rather than of a person.
 */
async function playerRecord(name: string): Promise<EmbedSummary["player"]> {
  const trimmed = name.trim();
  if (trimmed === "") return null;

  const asBlack = { blackName: { equals: trimmed, mode: "insensitive" as const } };
  const asWhite = { whiteName: { equals: trimmed, mode: "insensitive" as const } };
  const finished = { status: "finished" as const };

  const [blackGames, whiteGames, wonBlack, wonWhite, drawn] = await Promise.all([
    prisma.game.count({ where: { ...finished, ...asBlack } }),
    prisma.game.count({ where: { ...finished, ...asWhite } }),
    prisma.game.count({ where: { ...finished, ...asBlack, result: "black" } }),
    prisma.game.count({ where: { ...finished, ...asWhite, result: "white" } }),
    prisma.game.count({
      where: { ...finished, result: "draw", OR: [asBlack, asWhite] },
    }),
  ]);

  const played = blackGames + whiteGames;
  const won = wonBlack + wonWhite;
  return { name: trimmed, played, won, lost: played - won - drawn, drawn };
}
