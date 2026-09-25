import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import { prisma } from "@/lib/prisma";
import { currentNamesFor } from "./currentNames";
import { toSummary } from "./gameHistory";
import { FINISHED_ONLY } from "./myFinished";
import type { MyGame } from "./myGames.types";
import { QUEUE_SELECT } from "./myGamesRows";

/**
 * A MEMBER'S STARRED GAMES. John, 2026-09-25: "ability to favourite your game,
 * it moves to the top".
 *
 * A star is on a finished game the member sat in, and the Completed tab lists
 * the starred ones first, in a panel of their own above the finished list (the
 * one that pages), newest star first. They stay in the finished list as well,
 * starred, where their date puts them: the list is every game that ended, and
 * the panel is the ones the member asked to keep in front of them. A star keeps
 * a game in the panel however old it grows, past the member's window for
 * finished games — that is what asking to keep it means.
 *
 * Every read is one indexed query: the member's stars by their key, or the
 * stars among a page's ids.
 */

/** The most starred games the panel shows; the rest are still starred, and in the finished list. */
export const FAVOURITES_SHOWN = 50;

/** Which of these games the member has starred, in one read over the page's ids. */
export async function favouritesAmong(memberId: string | null, gameIds: readonly string[]): Promise<Set<string>> {
  if (memberId === null || gameIds.length === 0) return new Set();
  const rows = await prisma.gameFavourite.findMany({
    where: { memberId, gameId: { in: [...gameIds] } },
    select: { gameId: true },
  });
  return new Set(rows.map((row) => row.gameId));
}

/**
 * The member's starred games that are over, newest star first, as rows of their
 * games list, and how many there are: counted only when the panel is full, so
 * the heading never prints the cap as the total.
 */
export async function favouriteGamesOf(memberId: string | null): Promise<{ rows: MyGame[]; total: number }> {
  if (memberId === null) return { rows: [], total: 0 };
  const stars = await prisma.gameFavourite.findMany({
    where: { memberId, game: FINISHED_ONLY },
    orderBy: [{ createdAt: "desc" }, { gameId: "asc" }],
    take: FAVOURITES_SHOWN,
    select: { game: { select: QUEUE_SELECT } },
  });
  const rows = stars.map((star) => star.game);
  const names = await currentNamesFor(rows);
  const games = rows.flatMap((row): MyGame[] => {
    const seat = row.blackMemberId === memberId ? STONES.black : row.whiteMemberId === memberId ? STONES.white : null;
    // A star outlives nothing it should not: a seat no longer the member's names no game of theirs.
    if (seat === null) return [];
    const game = toSummary(row, names);
    return [{ game, seat, group: "finished", offer: null, offerSide: null, toPlay: null, since: game.lastMoveAt ?? game.playedAt, stale: false }];
  });
  const total = rows.length < FAVOURITES_SHOWN ? games.length : await prisma.gameFavourite.count({ where: { memberId, game: FINISHED_ONLY } });
  return { rows: games, total };
}

export type FavouriteAnswer = "starred" | "unstarred" | "not-yours";

/**
 * Stars a game or takes the star off, for a member who sat in it. Anybody
 * else's game answers `not-yours` and writes nothing; so does a game that does
 * not exist. Starring twice, or unstarring a game never starred, is the same
 * answer as once.
 */
export async function setFavourite(memberId: string, gameId: string, on: boolean): Promise<FavouriteAnswer> {
  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { blackMemberId: true, whiteMemberId: true } });
  if (game === null || (game.blackMemberId !== memberId && game.whiteMemberId !== memberId)) return "not-yours";
  if (on) {
    await prisma.gameFavourite.upsert({ where: { memberId_gameId: { memberId, gameId } }, create: { memberId, gameId }, update: {} });
    return "starred";
  }
  await prisma.gameFavourite.deleteMany({ where: { memberId, gameId } });
  return "unstarred";
}
