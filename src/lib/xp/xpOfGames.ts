import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * WHAT A MEMBER EARNED FROM EACH GAME ON A PAGE, IN ONE READ.
 *
 * John, 2026-09-25: "For all completed games, should we show the XP earned…
 * Then these tables will be much more interesting." Every award a finished game
 * pays is kept with the game's id as its subject (`xpGame.ts`: a finish, a win,
 * a long game, an upset…), so a page of games is one grouped sum over the
 * member's awards whose subject is one of them. Never once per row.
 *
 * A game that paid nothing is absent from the map, which the row says as
 * nothing at all rather than "+0".
 */
export async function xpEarnedIn(memberId: string | null, gameIds: readonly string[]): Promise<Map<string, number>> {
  if (memberId === null || gameIds.length === 0) return new Map();
  const rows = await prisma.xpEvent.groupBy({
    by: ["subject"],
    where: { memberId, subject: { in: [...gameIds] } },
    _sum: { points: true },
  });
  return new Map(rows.flatMap((row) => ((row._sum.points ?? 0) > 0 ? [[row.subject, row._sum.points ?? 0] as const] : [])));
}
