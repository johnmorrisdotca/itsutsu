import "server-only";

import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { prisma } from "@/lib/prisma";

import { ACTIVE_GAME_LIMIT } from "./activeGames";
import { seatedLive } from "./myFinished";

/** The member's game in progress at one game, and how many more they have at it. */
export type GoingAt = {
  /** The game to continue: the one moved in most recently. */
  id: string;
  /** The others at the same game, counted to `ACTIVE_GAME_LIMIT`; `more` says there are further ones. */
  others: number;
  more: boolean;
};

/**
 * THE GAME A MEMBER WOULD CONTINUE AT ONE GAME'S FRONT DOOR, or null when they
 * have none going there.
 *
 * ONE small read per signed-in view of that page: the member's seats (the same
 * `seatedLive` the games-at-once limit counts, so "going" means one thing on
 * this site) narrowed to the game, newest move first, at most one row past the
 * limit. No per-row work: the others are counted from the rows that came back,
 * and nothing replays a position. A game whose engine verdict is already
 * written as over is left out (`settledStatus`); null means nobody has judged
 * it, which is not the same as over, so it stays.
 */
export async function goingAt(memberId: string, variant: string): Promise<GoingAt | null> {
  const rows = await prisma.game.findMany({
    where: { AND: [seatedLive(memberId), { variant }, { OR: [{ settledStatus: null }, { settledStatus: GAME_STATUS.playing }] }] },
    orderBy: [{ lastMoveAt: { sort: "desc", nulls: "last" } }, { playedAt: "desc" }],
    take: ACTIVE_GAME_LIMIT + 1,
    select: { id: true },
  });
  const [first] = rows;
  if (first === undefined) return null;
  return { id: first.id, others: Math.min(rows.length - 1, ACTIVE_GAME_LIMIT), more: rows.length > ACTIVE_GAME_LIMIT };
}
