import "server-only";

import { prisma } from "@/lib/prisma";
import { NOT_A_REFUSED_OFFER } from "./offers";

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
  /*
   * TWO READS, EACH ONE ROW PER GAME AT MOST, and that is a fix rather than a
   * restyle. The latest game used to be `findMany({ distinct: ["variant"] })`,
   * and Prisma does `distinct` IN MEMORY unless the `nativeDistinct` preview is
   * on, which it is not here: it fetched every finished game on the site to
   * keep one per kind. The development database holds seven thousand; the
   * games index reads this on every render, for strangers too.
   *
   * So the count and the date of the latest game come out of one `groupBy`,
   * and the second read asks only for the games at those dates — a handful of
   * rows however many games there are.
   *
   * Both ask finished and not abandoned, WRITTEN OUT in each. That set is the
   * record's own `outcome=decided` — `buildGameWhere` keeps finished games
   * that are not refused offers, and `decided` drops every abandoned one — so
   * a count from here links to `?outcome=decided` and opens exactly the games
   * it counted.
   */
  const counts = await prisma.game.groupBy({
    by: ["variant"],
    where: { status: "finished", result: { not: "abandoned" } },
    _count: { _all: true },
    _max: { playedAt: true },
  });
  const at = counts.flatMap((row) =>
    row._max.playedAt === null ? [] : [{ variant: row.variant, playedAt: row._max.playedAt }],
  );
  const latest =
    at.length === 0
      ? []
      : await prisma.game.findMany({
          where: { status: "finished", result: { not: "abandoned" }, OR: at },
          // Two games of one kind finished in the same millisecond: the id settles it.
          orderBy: [{ playedAt: "desc" }, { id: "asc" }],
          select: { id: true, variant: true, blackName: true, whiteName: true, playedAt: true },
        });
  const result = new Map<string, PlayedCount>();
  for (const row of counts) result.set(row.variant, { played: row._count._all, last: null });
  for (const row of latest) {
    const entry = result.get(row.variant) ?? { played: 0, last: null };
    if (entry.last !== null) continue;
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
    // And not an offer somebody refused: nobody played it, so it is not one of
    // the "played games" this panel exists to show. See `offers.ts`.
    where: { variant, status: "finished", ...NOT_A_REFUSED_OFFER },
    orderBy: { playedAt: "desc" },
    take: limit,
    select: { id: true, blackName: true, whiteName: true, blackMemberId: true, whiteMemberId: true, result: true, moveCount: true, playedAt: true },
  });
  return rows.map((row) => ({ ...row, playedAt: row.playedAt.toISOString() }));
}
