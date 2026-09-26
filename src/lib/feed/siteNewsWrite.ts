import "server-only";

import { botTierFor, isBotId } from "@/lib/bots/bots";
import { prisma } from "@/lib/prisma";
import { fetchLadderLeader } from "@/lib/rating/variantRatings";
import { RATING_POOLS, type RatingPool } from "@/lib/rating/pools";

import {
  PROGRAM_IDS,
  bestTimeNews,
  firstGameNews,
  firstPlaceNews,
  firstResultNews,
  hardBotNews,
  mayBeFirstGame,
  type LadderLeader,
  type NewsGame,
  type NewsSide,
  type SiteNewsRow,
} from "./siteNews";

/**
 * THE SITE'S NEWS, WRITTEN WHEN IT HAPPENS. Each writer rides a write the site
 * was already making — a game ending (`recordPlayed`), a result being rated
 * (`recordResult`), a solve being kept (`keepSolve`) — and adds at most one
 * or two small indexed reads to it. Nothing here runs on a timer, on a page
 * view, or per move.
 *
 * NEWS NEVER COSTS A GAME. Every writer catches its own failure and logs it:
 * a line on the feed that did not get written is a smaller loss than a result
 * that did not get recorded, and the caller has already done the work that
 * matters by the time it gets here.
 *
 * Written with `skipDuplicates`, which is `ON CONFLICT DO NOTHING`: the unique
 * on (kind, variant, subject) is what makes a once-ever fact once, and a second
 * writer arriving at the same fact is simply told it has been told.
 */

async function tell(rows: readonly SiteNewsRow[]): Promise<void> {
  if (rows.length === 0) return;
  await prisma.siteNews.createMany({ data: [...rows], skipDuplicates: true });
}

/**
 * Whether any earlier game of this variant could have been its first, by
 * `mayBeFirstGame`'s rule restated for the database: both seats bound, to two
 * different members, not both programs, finished and not abandoned. One
 * `findFirst` on `Game_variant_status_idx`, stopping at the first it meets.
 */
async function playedBefore(game: NewsGame): Promise<boolean> {
  const earlier = await prisma.game.findFirst({
    where: {
      variant: game.variant,
      status: "finished",
      result: { not: "abandoned" },
      id: { not: game.id },
      blackMemberId: { not: null },
      whiteMemberId: { not: null },
      NOT: [
        { blackMemberId: { equals: prisma.game.fields.whiteMemberId } },
        { blackMemberId: { in: [...PROGRAM_IDS] }, whiteMemberId: { in: [...PROGRAM_IDS] } },
      ],
    },
    select: { id: true },
  });
  return earlier !== null;
}

/**
 * Whether a person had beaten this program at this game before. Asked only on
 * the rare win over a top grade, so the news is right on a site whose history
 * started before the news did — the backfill writes the old firsts, and this
 * keeps a later win from claiming one in the meantime.
 */
async function beatenBefore(game: NewsGame, botId: string): Promise<boolean> {
  const earlier = await prisma.game.findFirst({
    where: {
      variant: game.variant,
      status: "finished",
      id: { not: game.id },
      OR: [
        { blackMemberId: botId, winner: "white", whiteMemberId: { notIn: [...PROGRAM_IDS] } },
        { whiteMemberId: botId, winner: "black", blackMemberId: { notIn: [...PROGRAM_IDS] } },
      ],
    },
    select: { id: true },
  });
  return earlier !== null;
}

/** A top grade beaten at this game, if it was, and nobody had before. */
async function hardBotRow(game: NewsGame): Promise<SiteNewsRow | null> {
  if (game.winner !== "black" && game.winner !== "white") return null;
  const winnerId = game.winner === "black" ? game.blackMemberId : game.whiteMemberId;
  const loserId = game.winner === "black" ? game.whiteMemberId : game.blackMemberId;
  if (winnerId === null || loserId === null) return null;
  const row = hardBotNews(game, winnerId, loserId, botTierFor(loserId));
  if (row === null) return null;
  return (await beatenBefore(game, loserId)) ? null : row;
}

/**
 * A GAME HAS ENDED: its first game ever, a member's first win or loss, a top
 * grade beaten. Called by `recordPlayed` once per decided game, after the
 * tallies it reads `wonBefore` and `lostBefore` from have been written.
 */
export async function tellFinishedGame(game: NewsGame, sides: readonly NewsSide[]): Promise<void> {
  try {
    const rows = sides.map((side) => firstResultNews(game, side)).filter((row): row is SiteNewsRow => row !== null);
    if (mayBeFirstGame(game) && !(await playedBefore(game))) rows.push(firstGameNews(game));
    const beaten = await hardBotRow(game);
    if (beaten !== null) rows.push(beaten);
    await tell(rows);
  } catch (problem) {
    console.error("Could not write the site's news for a finished game", game.id, problem);
  }
}

/**
 * Who led this game's ladder of people before a result, for `tellFirstPlace`
 * to compare with afterwards. Undefined where it could not be read, or where
 * the result is not on the ladder of people: first place is a place among
 * people, and a program's standing is not one.
 */
export async function leaderBefore(variant: string, pool: RatingPool): Promise<LadderLeader | null | undefined> {
  if (pool !== RATING_POOLS.people) return undefined;
  try {
    return await fetchLadderLeader(variant, pool);
  } catch (problem) {
    console.error("Could not read a ladder's leader for the site's news", variant, problem);
    return undefined;
  }
}

/**
 * A RATED RESULT HAS BEEN RECORDED: did it put one of its own two players at
 * the top of the game's ladder of people? The same leader the ladder shows,
 * read by the ladder's own order (`fetchLadderLeader`), before and after.
 */
export async function tellFirstPlace(
  variant: string,
  gameId: string | null,
  before: LadderLeader | null | undefined,
  seatKeys: readonly string[],
): Promise<void> {
  if (before === undefined || gameId === null) return;
  try {
    const after = await fetchLadderLeader(variant, RATING_POOLS.people);
    const row = firstPlaceNews(variant, gameId, before, after, seatKeys);
    if (row !== null && !isBotId(row.memberId)) await tell([row]);
  } catch (problem) {
    console.error("Could not write the site's news for a new leader", variant, problem);
  }
}

/** A solve about to be kept, as much as a best time needs. */
export type NewsSolve = { memberId: string; kind: string; size: number; level: string; elapsedMs: number; solved: boolean };

/**
 * The fastest solve so far at this kind, size and level, read before the new
 * one is kept: one row off `PuzzleSolve_kind_size_level_elapsedMs_idx`, as
 * the fastest board reads it. Null where there is none; undefined where it
 * could not be read, which tells nothing.
 */
export async function bestBefore(solve: NewsSolve): Promise<number | null | undefined> {
  if (!solve.solved) return undefined;
  try {
    const best = await prisma.puzzleSolve.findFirst({
      where: { kind: solve.kind, size: solve.size, level: solve.level, solved: true },
      orderBy: { elapsedMs: "asc" },
      select: { elapsedMs: true },
    });
    return best?.elapsedMs ?? null;
  } catch (problem) {
    console.error("Could not read the best time for the site's news", solve.kind, problem);
    return undefined;
  }
}

/** A SOLVE HAS BEEN KEPT: was it a new best time? */
export async function tellSolve(solve: NewsSolve, before: number | null | undefined): Promise<void> {
  if (before === undefined) return;
  try {
    const row = bestTimeNews(solve, before);
    if (row !== null) await tell([row]);
  } catch (problem) {
    console.error("Could not write the site's news for a best time", solve.kind, problem);
  }
}

