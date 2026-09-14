import "server-only";

import { Prisma } from "@prisma/client";

import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { fetchPlayedCounts } from "@/lib/history/gameCounts";
import { prisma } from "@/lib/prisma";
import { POOL_COLUMNS, RATING_POOLS, type RatingPool } from "@/lib/rating/pools";
import { levelShown } from "@/lib/xp/levelShown";
import { xpByMemberId } from "@/lib/xp/xpOfMembers";

import type { CatalogueStats, GameStats, TopPlayerShown } from "./catalogue.types";
import {
  LADDER_ORDER,
  familyFiguresOf,
  sinceLastPlayed,
  topPlayersOf,
  type LadderEntry,
} from "./catalogueFigures";

/**
 * EVERY FIGURE ON THE GAMES INDEX, IN A FIXED NUMBER OF READS.
 *
 * The index lists thirty-nine games, three ways, and it is the page a stranger
 * is most likely to open. A read per game would be thirty-nine round trips per
 * view, per visitor — the cost-per-call-times-call-count fault this repository
 * has paid for before. So it is five reads whatever the catalogue holds, and
 * none of them scales with the number of games:
 *
 *  1. finished games by variant: count and latest date, one `groupBy`;
 *  2. the latest game of each, by those dates — at most one row per game;
 *  3. the top of every game's ladder among people, `DISTINCT ON (variant)`;
 *  4. the same for the ladder against the computer;
 *  5. the XP of the top players, for the level beside each name — one `IN`.
 *
 * 1 and 2 are `fetchPlayedCounts`, which the page already read. 3 and 4 run
 * beside it, and 5 waits on them.
 */
export async function fetchCatalogueStats(now: Date = new Date()): Promise<CatalogueStats> {
  const [counts, people, computer] = await Promise.all([
    fetchPlayedCounts(),
    topOfLadder(RATING_POOLS.people),
    topOfLadder(RATING_POOLS.computer),
  ]);
  const tops = topPlayersOf([...people, ...computer]);
  const xp = await xpByMemberId([...tops.values()].map((top) => top.memberId));

  const shown = (top: LadderEntry): TopPlayerShown => {
    const total = top.memberId === null ? undefined : xp.get(top.memberId);
    return {
      name: top.name,
      memberId: top.memberId,
      pool: top.pool,
      wins: top.wins,
      losses: top.losses,
      draws: top.draws,
      // `xpShown` has already answered null for a program; a name with no
      // member behind it is absent from the map.
      level: total === undefined || total === null ? null : levelShown({ xp: total }),
    };
  };

  const games: Record<string, GameStats> = {};
  for (const variant of RULE_VARIANT_LIST) {
    const count = counts.get(variant);
    const top = tops.get(variant);
    games[variant] = {
      variant,
      played: count?.played ?? 0,
      last:
        count?.last == null
          ? null
          : { since: sinceLastPlayed(new Date(count.last.playedAt), now), gameId: count.last.id },
      top: top === undefined ? null : shown(top),
    };
  }

  const played = new Map([...counts].map(([variant, count]) => [variant, count.played]));
  const families: CatalogueStats["families"] = {};
  for (const family of GAME_FAMILIES) {
    const figures = familyFiguresOf(family.games, played, tops);
    families[family.key] = {
      ...figures,
      crowns:
        figures.crowns?.kind === "held"
          ? { ...figures.crowns, holder: shown(figures.crowns.holder) }
          : figures.crowns,
    };
  }
  return { games, families };
}

/** A row as the ladder query returns it, in the pool's own columns renamed to the shared ones. */
type LadderRow = Omit<LadderEntry, "pool">;

/**
 * The top standing of every game on one ladder, one row per game.
 *
 * `DISTINCT ON` rather than every standing: this table is members times games,
 * and the suite alone has left thousands of rows on one variant of the
 * development database. The order is `LADDER_ORDER`, the same words the
 * standings page sorts by, so the row kept here is the row that page puts
 * first. Between the two ladders `topPlayersOf` decides.
 *
 * Column names come from `POOL_COLUMNS`, never typed here, and are constants
 * in this repository — `Prisma.raw` is given nothing a reader sent.
 */
async function topOfLadder(pool: RatingPool): Promise<LadderEntry[]> {
  const columns = POOL_COLUMNS[pool];
  const column = (name: string) => Prisma.raw(`"${name}"`);
  const sortColumn: Record<(typeof LADDER_ORDER)[number]["field"], string> = {
    rating: columns.rating,
    ratedGames: columns.ratedGames,
    updatedAt: "updatedAt",
    key: "key",
  };
  const order = Prisma.raw(
    LADDER_ORDER.map(({ field, direction }) => `"${sortColumn[field]}" ${direction.toUpperCase()}`).join(", "),
  );
  const rows = await prisma.$queryRaw<LadderRow[]>`
    SELECT DISTINCT ON ("variant")
      "key", "name", "memberId", "variant", "updatedAt",
      ${column(columns.rating)} AS "rating",
      ${column(columns.ratedGames)} AS "ratedGames",
      ${column(columns.wins)} AS "wins",
      ${column(columns.losses)} AS "losses",
      ${column(columns.draws)} AS "draws"
    FROM "PlayerVariantRating"
    WHERE ${column(columns.ratedGames)} > 0
    ORDER BY "variant", ${order}
  `;
  return rows.map((row) => ({ ...row, pool }));
}
