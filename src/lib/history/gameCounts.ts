import "server-only";

import { prisma } from "@/lib/prisma";

/** How many games of a kind have been finished here, and the latest one. */
export type PlayedCount = {
  played: number;
  last: { id: string; blackName: string; whiteName: string; playedAt: string } | null;
};

/**
 * Finished games by kind, for the catalogue: the count says which games the
 * site's players actually play, and the latest game is a door into the record.
 *
 * `result: { not: "abandoned" }` on both queries, matching `playerRecord.ts` —
 * read for every player-level "Played" — which has always left abandoned
 * games out: they are not a result. Without it this count and a player's own
 * page would disagree the first time a game is abandoned; dormant today only
 * because production holds no such row yet.
 */
export async function fetchPlayedCounts(): Promise<Map<string, PlayedCount>> {
  const [counts, latest] = await Promise.all([
    prisma.game.groupBy({
      by: ["variant"],
      where: { status: "finished", result: { not: "abandoned" } },
      _count: { _all: true },
    }),
    prisma.game.findMany({
      where: { status: "finished", result: { not: "abandoned" } },
      orderBy: { playedAt: "desc" },
      distinct: ["variant"],
      select: { id: true, variant: true, blackName: true, whiteName: true, playedAt: true },
    }),
  ]);
  const result = new Map<string, PlayedCount>();
  for (const row of counts) result.set(row.variant, { played: row._count._all, last: null });
  for (const row of latest) {
    const entry = result.get(row.variant) ?? { played: 0, last: null };
    entry.last = { id: row.id, blackName: row.blackName, whiteName: row.whiteName, playedAt: row.playedAt.toISOString() };
    result.set(row.variant, entry);
  }
  return result;
}

/** One line of a game, for a page that lists a few of them beside the rules. */
export type RecentGame = {
  id: string;
  blackName: string;
  whiteName: string;
  /** Whose seats these were, so a name can link to the person rather than the spelling. */
  blackMemberId: string | null;
  whiteMemberId: string | null;
  result: string;
  moveCount: number;
  playedAt: string;
};

/**
 * The last few games of one kind, for the page that explains that kind.
 *
 * A rules page had a staged screenshot and a line of prose, and the games
 * people had actually played were a small text link below four blocks of
 * rules. John, on that page: "where are the played games????" — and there
 * were four of them, filed, one click away and invisible.
 *
 * Finished games only. A game still being played belongs to the two people
 * playing it; a rules page is somewhere to read about the game, and an
 * unfinished board is not a thing to read.
 */
export async function recentGamesOf(variant: string, limit = 5): Promise<RecentGame[]> {
  const rows = await prisma.game.findMany({
    where: { variant, status: "finished" },
    orderBy: { playedAt: "desc" },
    take: limit,
    select: { id: true, blackName: true, whiteName: true, blackMemberId: true, whiteMemberId: true, result: true, moveCount: true, playedAt: true },
  });
  return rows.map((row) => ({ ...row, playedAt: row.playedAt.toISOString() }));
}
