import "server-only";

import { prisma } from "@/lib/prisma";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";

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
 *
 * THE SAME FUNCTION THE REST OF THE SITE COUNTS WITH, rather than a second
 * reading of the games table. This used to run `blackGames + whiteGames` as
 * two separate counts with no dedup for a game played against yourself —
 * both seats carry the one name, so that game satisfied both counts and was
 * added in twice. `fetchPlayerRecord` reads one row per finished game and
 * counts it once, which is the same rule `fetchPlayedTallies` states for
 * every other page: a game against yourself is one game, counted once, from
 * the black seat. This is the number a third-party page gets embedded with,
 * so it has to agree with the number Itsutsu shows on every page of its own.
 */
async function playerRecord(name: string): Promise<EmbedSummary["player"]> {
  const trimmed = name.trim();
  if (trimmed === "") return null;

  const record = await fetchPlayerRecord(trimmed);
  return { name: trimmed, played: record.games, won: record.wins, lost: record.losses, drawn: record.draws };
}
