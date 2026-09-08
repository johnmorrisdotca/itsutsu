import "server-only";

import { replayGame } from "@/lib/gomoku/replay";
import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { SUMMARY_SELECT, toGameMove, toSummary } from "./gameHistory";
import type { GameSummary } from "./gameHistory.types";

/** A game nobody has touched for this long is flagged, so it can be dealt with. */
export const STALE_AFTER_DAYS = 14;

export const MY_GAME_GROUPS = ["yourMove", "theirMove", "unstarted", "finished"] as const;
export type MyGameGroup = (typeof MY_GAME_GROUPS)[number];

export type MyGame = {
  game: GameSummary;
  /** The colour this browser holds in it. */
  seat: Stone;
  group: MyGameGroup;
  /** Whose turn it is, while the game runs. */
  toPlay: Stone | null;
  /** When something last happened, as an ISO string. */
  since: string;
  /** Running, but nobody has moved for a fortnight. */
  stale: boolean;
};

export type MyGames = Record<MyGameGroup, MyGame[]>;

/**
 * Sorts a browser's seats into the queue the turn-based sites taught: the
 * games waiting on you first, then the ones you are waiting on, the ones
 * nobody has started, and the ones that are over. There is no account here,
 * so "your games" means the seats this browser holds — which is what the
 * cookies say.
 */
export async function fetchMyGames(claims: Map<string, string>, now = new Date()): Promise<MyGames> {
  const groups: MyGames = { yourMove: [], theirMove: [], unstarted: [], finished: [] };
  if (claims.size === 0) return groups;

  const rows = await prisma.game.findMany({
    where: { id: { in: [...claims.keys()] } },
    select: {
      ...SUMMARY_SELECT,
      blackToken: true,
      whiteToken: true,
      moves: { select: MOVE_COLUMNS, orderBy: { number: "asc" } },
    },
  });

  for (const row of rows) {
    const token = claims.get(row.id);
    const seat =
      token === row.blackToken ? STONES.black : token === row.whiteToken ? STONES.white : null;
    // A cookie that fits neither seat is stale itself; it names no game of ours.
    if (seat === null) continue;

    const game = toSummary(row);
    const state = replayGame({ ...game, moves: row.moves.map(toGameMove) });
    const running = game.status === "active" && state.status === GAME_STATUS.playing;
    const since = game.lastMoveAt ?? game.playedAt;
    const group: MyGameGroup = !running
      ? "finished"
      : game.moveCount === 0
        ? "unstarted"
        : state.toPlay === seat
          ? "yourMove"
          : "theirMove";

    groups[group].push({
      game,
      seat,
      group,
      toPlay: running ? state.toPlay : null,
      since,
      stale: running && now.getTime() - new Date(since).getTime() > STALE_AFTER_DAYS * 86_400_000,
    });
  }

  // Newest activity first within each group; the queue is read top down.
  for (const group of MY_GAME_GROUPS) {
    groups[group].sort((a, b) => b.since.localeCompare(a.since));
  }
  return groups;
}

const MOVE_COLUMNS = {
  number: true,
  row: true,
  col: true,
  stone: true,
  kind: true,
  fromRow: true,
  fromCol: true,
  twistQuadrant: true,
  twistClockwise: true,
  cells: true,
} as const;
