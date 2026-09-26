import "server-only";

import { seatName, type CurrentNames } from "@/lib/history/currentNames";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";

import { FEED_LIMITS } from "./feed.constants";
import type { NewsGameSeats, NewsRead } from "./feedNews";
import { bestTimeParts } from "./siteNews";
import { SITE_NEWS } from "./siteNews.constants";

/**
 * THE SITE'S NEWS, READ ONCE PER VISIT TO THE EVERYONE TAB: one query for the
 * rows in the window (on `SiteNews_createdAt_idx`, capped at
 * `FEED_LIMITS.newsRead`), and one for the games those rows name — a game's
 * first game is told with its players, and a first win with its game. Nothing
 * is read per line and nothing is recomputed: every row was written when it
 * happened (`siteNewsWrite.ts`).
 */

const GAME_SEATS = {
  id: true,
  variant: true,
  winner: true,
  blackName: true,
  whiteName: true,
  blackMemberId: true,
  whiteMemberId: true,
} as const;

type SeatsRow = {
  id: string;
  variant: string;
  winner: string | null;
  blackName: string;
  whiteName: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
};

export type NewsReadResult = {
  rows: NewsRead[];
  seats: SeatsRow[];
  /** The games, with each seat under the name its member goes by now. */
  games: (names: CurrentNames) => Map<string, NewsGameSeats>;
};

export async function readNews(since: Date): Promise<NewsReadResult> {
  const rows = await prisma.siteNews.findMany({
    where: { createdAt: { gte: since } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: FEED_LIMITS.newsRead,
    select: { id: true, kind: true, memberId: true, variant: true, subject: true, gameId: true, createdAt: true },
  });
  const ids = [...new Set(rows.map((row) => row.gameId).filter((id): id is string => id !== null))];
  const seats = ids.length === 0 ? [] : await prisma.game.findMany({ where: { id: { in: ids }, ...NOT_A_REFUSED_OFFER }, select: GAME_SEATS });
  return {
    rows,
    seats,
    games: (names) =>
      new Map(
        seats.map((game) => [
          game.id,
          {
            id: game.id,
            variant: game.variant,
            winner: game.winner,
            black: { memberId: game.blackMemberId, name: seatName(game.blackName, game.blackMemberId, names) },
            white: { memberId: game.whiteMemberId, name: seatName(game.whiteName, game.whiteMemberId, names) },
          },
        ]),
      ),
  };
}

/**
 * THE SOLVE EACH BEST TIME WAS, so its time on the line opens it: one query for
 * the whole page over the rows' own facts — who, which puzzle, size, level and
 * the time to the millisecond — never one per line. A record is strictly faster
 * than the one before it, so those facts name one solve; the earliest is taken
 * if two ever tie. Keyed by the news row's id.
 */
export async function bestTimeSolves(rows: readonly NewsRead[]): Promise<Map<string, string>> {
  const wanted = rows.flatMap((row) => {
    const parts = row.kind === SITE_NEWS.bestTime && row.memberId !== null ? bestTimeParts(row.subject) : null;
    return parts === null ? [] : [{ row, memberId: row.memberId as string, kind: row.variant, ...parts }];
  });
  if (wanted.length === 0) return new Map();
  const solves = await prisma.puzzleSolve.findMany({
    where: { solved: true, OR: wanted.map(({ memberId, kind, size, level, elapsedMs }) => ({ memberId, kind, size, level, elapsedMs })) },
    orderBy: { finishedAt: "asc" },
    select: { id: true, memberId: true, kind: true, size: true, level: true, elapsedMs: true },
  });
  const found = new Map<string, string>();
  for (const want of wanted) {
    const solve = solves.find((one) => one.memberId === want.memberId && one.kind === want.kind && one.size === want.size && one.level === want.level && one.elapsedMs === want.elapsedMs);
    if (solve !== undefined) found.set(want.row.id, solve.id);
  }
  return found;
}

/** Every member the news could name: the rows' own, and the seats of the games they name. */
export function newsMemberIds(news: Pick<NewsReadResult, "rows" | "seats">): string[] {
  return [
    ...news.rows.map((row) => row.memberId),
    ...news.seats.flatMap((game) => [game.blackMemberId, game.whiteMemberId]),
  ].filter((id): id is string => id !== null);
}
