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
 */
export async function fetchPlayedCounts(): Promise<Map<string, PlayedCount>> {
  const [counts, latest] = await Promise.all([
    prisma.game.groupBy({ by: ["variant"], where: { status: "finished" }, _count: { _all: true } }),
    prisma.game.findMany({
      where: { status: "finished" },
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
