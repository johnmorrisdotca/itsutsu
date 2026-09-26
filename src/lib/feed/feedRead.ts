import "server-only";

import type { Prisma } from "@prisma/client";

import { NO_CURRENT_NAMES, seatName, type CurrentNames } from "@/lib/history/currentNames";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { prisma } from "@/lib/prisma";
import { buddyMemberIds } from "@/lib/social/buddies";
import { ignoredMemberIds } from "@/lib/social/ignores";
import { IMPORTED_XP_TYPES } from "@/lib/xp/importedXp.constants";
import { xpForBadge } from "@/lib/xp/xpScope";

import { DAY_MS, FEED_LIMITS } from "./feed.constants";
import { ipEarnedSince } from "@/lib/points/ipBoards";

import { gameEntry, ipEntries, orderFeed, puzzleEntries, xpEntries } from "./feed";
import type { FeedEntry, FeedGameRow, FeedPerson, FeedSeatStanding, FeedXpDay } from "./feed.types";
import { everyoneMayShow, mayBeNamed } from "./feedEveryone";
import { addedEntries, gamesToldByNews, newsEntries } from "./feedNews";
import { newsMemberIds, readNews } from "./feedNewsRead";
import { GAME_ADDED } from "@/lib/catalogue/gameAdded.data";

/**
 * THE FEED'S READS: once per page view, never on a timer and never polled.
 *
 * Every read is one indexed query over a bounded window (`FEED_LIMITS`), and
 * nothing is read per line: the members a page names are read together, the
 * experience is summed by the database a day at a time, and the rules that
 * turn rows into lines are `feed.ts`'s, pure.
 */

/** Who is reading, as much of their row as the feed needs. */
export type FeedReader = {
  id: string;
  timeZone: string;
  xp: number;
  xpEverywhere: number;
};

/** The columns a line needs off a game. */
const GAME_SELECT = {
  id: true,
  variant: true,
  status: true,
  result: true,
  winner: true,
  playedAt: true,
  lastMoveAt: true,
  blackName: true,
  whiteName: true,
  blackMemberId: true,
  whiteMemberId: true,
  hiddenByBlack: true,
  hiddenByWhite: true,
} as const satisfies Prisma.GameSelect;

type GameRow = Prisma.GameGetPayload<{ select: typeof GAME_SELECT }>;

/** Newest first by when it ended, where a game has a last move; then by when it began. */
const NEWEST_FIRST: Prisma.GameOrderByWithRelationInput[] = [
  { lastMoveAt: { sort: "desc", nulls: "last" } },
  { playedAt: "desc" },
];

/** Games that moved, or began, inside the window. */
function inWindow(since: Date): Prisma.GameWhereInput {
  return { OR: [{ lastMoveAt: { gte: since } }, { lastMoveAt: null, playedAt: { gte: since } }] };
}

function windowStart(now: Date): Date {
  return new Date(now.getTime() - FEED_LIMITS.windowDays * DAY_MS);
}

function feedRow(row: GameRow, names: CurrentNames): FeedGameRow {
  return {
    id: row.id,
    variant: row.variant,
    status: row.status,
    result: row.result,
    winner: row.winner,
    playedAt: row.playedAt,
    lastMoveAt: row.lastMoveAt,
    black: { memberId: row.blackMemberId, name: seatName(row.blackName, row.blackMemberId, names), hidden: row.hiddenByBlack },
    white: { memberId: row.whiteMemberId, name: seatName(row.whiteName, row.whiteMemberId, names), hidden: row.hiddenByWhite },
  };
}

type Standing = { id: string; name: string; ageBand: string | null; botTier: string | null; bannedAt: Date | null; unclaimableBecause: string | null };

/** The members a page names, in one read: current names, and what the Everyone tab asks of each. */
async function membersOf(ids: Iterable<string>): Promise<Map<string, Standing>> {
  const wanted = [...new Set(ids)];
  if (wanted.length === 0) return new Map();
  const rows = await prisma.member.findMany({
    where: { id: { in: wanted } },
    select: { id: true, name: true, ageBand: true, botTier: true, bannedAt: true, unclaimableBecause: true },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

function namesOf(members: ReadonlyMap<string, Standing>): CurrentNames {
  const names = new Map<string, string>();
  for (const member of members.values()) {
    const name = member.name.trim();
    if (name !== "") names.set(member.id, name);
  }
  return names.size === 0 ? NO_CURRENT_NAMES : names;
}

function seatIds(rows: readonly GameRow[]): string[] {
  return rows.flatMap((row) => [row.blackMemberId, row.whiteMemberId]).filter((id): id is string => id !== null);
}

/**
 * THE READER AND THE PEOPLE THEY KEEP: games begun and finished, experience a
 * day at a time, levels reached, and puzzles solved.
 *
 * A buddy's games are their games — a buddy under 13 included, whose games,
 * record and XP this site does not hide (`childRules.ts`, rule 5). What the
 * feed does not do is follow a buddy into a game they hid from their own list.
 */
export async function readMineFeed(reader: FeedReader, now = new Date()): Promise<FeedEntry[]> {
  const since = windowStart(now);
  const buddies = await buddyMemberIds(reader.id);
  const people = [reader.id, ...buddies];

  const [games, earned, credited, solves, won] = await Promise.all([
    prisma.game.findMany({
      where: {
        AND: [{ OR: [{ blackMemberId: { in: people } }, { whiteMemberId: { in: people } }] }, inWindow(since)],
        offeredAt: null,
        ...NOT_A_REFUSED_OFFER,
      },
      orderBy: NEWEST_FIRST,
      take: FEED_LIMITS.gamesRead,
      select: GAME_SELECT,
    }),
    xpByDay(people, since, false),
    xpByDay(people, since, true),
    prisma.puzzleSolve.findMany({
      // Solved ones: the feed says "solved", and a word that ran out is not news.
      where: { memberId: { in: people }, finishedAt: { gte: since }, solved: true },
      orderBy: { finishedAt: "desc" },
      take: FEED_LIMITS.puzzlesRead,
      select: { id: true, memberId: true, kind: true, finishedAt: true },
    }),
    // IP won by the reader and their buddies, earning by earning, from the same SQL the boards count.
    ipEarnedSince(people, since, FEED_LIMITS.ipRead),
  ]);

  const members = await membersOf([...people, ...seatIds(games)]);
  const names = namesOf(members);
  const persons = new Map<string, FeedPerson>(
    people.map((id) => [id, { memberId: id, name: members.get(id)?.name ?? "" }]),
  );
  const followed = new Set(buddies);
  const totals = await xpTotals(reader, [...buddies]);

  const lines: FeedEntry[] = [
    ...games.map((row) => gameEntry(feedRow(row, names), followed, reader.id)).filter((line): line is FeedEntry => line !== null),
    ...xpEntries([...earned, ...credited], totals, persons, reader.id),
    ...puzzleEntries(solves, reader.timeZone, persons, reader.id),
    ...ipEntries(won, reader.timeZone, persons, reader.id),
  ];
  return orderFeed(lines, FEED_LIMITS.entries);
}

/** Each member's experience, summed a day at a time by the database, earned here or credited. */
async function xpByDay(people: readonly string[], since: Date, imported: boolean): Promise<FeedXpDay[]> {
  const rows = await prisma.xpEvent.groupBy({
    by: ["memberId", "dayKey"],
    where: {
      memberId: { in: [...people] },
      createdAt: { gte: since },
      type: imported ? { in: [...IMPORTED_XP_TYPES] } : { notIn: [...IMPORTED_XP_TYPES] },
    },
    _sum: { points: true },
    _max: { createdAt: true },
  });
  return rows
    .filter((row) => row._max.createdAt !== null)
    .map((row) => ({
      memberId: row.memberId,
      dayKey: row.dayKey,
      points: row._sum.points ?? 0,
      imported,
      lastAt: row._max.createdAt as Date,
    }));
}

/**
 * Today's totals, as the badge counts them, for walking levels back. The
 * reader's is on the row the page already read; the buddies' are one read.
 */
async function xpTotals(reader: FeedReader, buddies: readonly string[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>([[reader.id, xpForBadge(reader)]]);
  if (buddies.length === 0) return totals;
  const rows = await prisma.member.findMany({
    where: { id: { in: [...buddies] } },
    select: { id: true, xp: true, xpEverywhere: true },
  });
  for (const row of rows) totals.set(row.id, xpForBadge(row));
  return totals;
}

/**
 * GAMES FINISHED LATELY, BY EVERYBODY, THAT MAY BE SHOWN TO EVERYBODY.
 *
 * Finished and decided or drawn, both seats a member, neither seat hidden —
 * then every row put to `everyoneMayShow`, which lets through only adults and
 * programs. Also left out: a game with a member banned from the site, and a
 * game with somebody the reader has chosen to ignore.
 */
export async function readEveryoneFeed(readerId: string | null, now = new Date(), zone: string | null = null): Promise<FeedEntry[]> {
  const since = windowStart(now);
  const [games, ignored, news, won] = await Promise.all([
    prisma.game.findMany({
      where: {
        AND: [inWindow(since)],
        status: { not: "active" },
        result: { not: "abandoned" },
        blackMemberId: { not: null },
        whiteMemberId: { not: null },
        hiddenByBlack: false,
        hiddenByWhite: false,
        offeredAt: null,
        ...NOT_A_REFUSED_OFFER,
      },
      orderBy: NEWEST_FIRST,
      take: FEED_LIMITS.gamesRead,
      select: GAME_SELECT,
    }),
    readerId === null ? Promise.resolve(new Set<string>()) : ignoredMemberIds(readerId),
    readNews(since),
    // Everybody's IP, earning by earning: told a day at a time, only of those this tab may name (below).
    ipEarnedSince(null, since, FEED_LIMITS.ipRead),
  ]);

  const members = await membersOf([...seatIds(games), ...newsMemberIds(news), ...won.map((one) => one.memberId)]);
  const names = namesOf(members);
  const standing = (id: string | null): FeedSeatStanding => {
    const member = id === null ? undefined : members.get(id);
    return member === undefined ? null : { ageBand: member.ageBand, botTier: member.botTier };
  };
  const welcome = (id: string | null) => id !== null && !ignored.has(id) && members.get(id)?.bannedAt == null;

  /* The site's news, under the same rule as the games: see `feedNews.ts`. A
     test member is never named to anybody here — the feed does not read the
     operator's Test Mode yet — and neither is a member the games would leave out. */
  const told = newsEntries(news.rows, news.games(names), {
    nameOf: (id) => members.get(id)?.name.trim() ?? "",
    mayName: (id) => id !== null && mayBeNamed(standing(id)) && welcome(id) && members.get(id)?.unclaimableBecause !== UNCLAIMABLE_REASONS.test,
  });
  const alreadyTold = gamesToldByNews(told);

  const lines = games
    .filter((row) => !alreadyTold.has(row.id))
    .filter((row) => everyoneMayShow([standing(row.blackMemberId), standing(row.whiteMemberId)]))
    .filter((row) => welcome(row.blackMemberId) && welcome(row.whiteMemberId))
    .map((row) => {
      const shown = feedRow(row, names);
      /* Told from the winner's side, or Black's on a draw: every seat here is "followed". */
      const everybody = new Set(seatIds([row]));
      return gameEntry(shown, everybody, readerId);
    })
    .filter((line): line is FeedEntry => line !== null);
  /*
   * IP WON, under the games' own rule: only somebody this tab may name — an
   * adult or a program (`mayBeNamed`), not banned, not ignored by the reader,
   * and never a Test member. A child's winnings are theirs and their buddies'
   * to see, on the other tab.
   */
  const nameable = (id: string) => mayBeNamed(standing(id)) && welcome(id) && members.get(id)?.unclaimableBecause !== UNCLAIMABLE_REASONS.test;
  const shownWon = won.filter((one) => nameable(one.memberId));
  const winners = new Map<string, FeedPerson>(shownWon.map((one) => [one.memberId, { memberId: one.memberId, name: members.get(one.memberId)?.name ?? "" }]));
  const ipLines = ipEntries(shownWon, zone, winners, readerId);
  return orderFeed([...lines, ...told, ...ipLines, ...addedEntries(GAME_ADDED, now, FEED_LIMITS.windowDays)], FEED_LIMITS.entries);
}
