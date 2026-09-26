import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { HIDES_TEST_MEMBERS, type TestModeReader } from "@/lib/testMode/testMode";
import { SITE_SCOPE, type IpScope } from "./ipScope";
import { PUZZLE_IP_WEIGHT } from "./points.constants";

/**
 * THE IP LEADERBOARDS: who has won the most Itsutsu Points, all time or since a
 * moment (the start of this month), at one game, across one family, or across
 * the whole site. John, 2026-09-25: "EVERY game in every family is also going
 * to have a Leaderboard. So IP matters."
 *
 * ONE QUERY A BOARD, over prices already stored: a game's IP on its row
 * (`Game.blackPoints`, `payGameIp`), and a puzzle's best solve of each grid
 * times its weight (`PUZZLE_IP_WEIGHT`), as the puzzle's own board counts it.
 * Nothing is replayed or recomputed when a board is drawn.
 */
export type IpRow = { memberId: string; ip: number };

/*
 * What a board counts lives in `ipScope.ts`, which a browser may import: a
 * table drawn on the client (the ladder's further pages) builds its IP link
 * from the same scope the server counted.
 */
export { SITE_SCOPE, scopeOfFamily, scopeOfGame, type IpScope } from "./ipScope";

/**
 * Every IP earning in a scope since a moment, as one SQL fragment of
 * (memberId, ip, at, game) rows, game being the variant or the puzzle's kind: a game's price on each seat that won some, and a
 * puzzle's best solve of each grid times its weight. The one definition every
 * board, every total and the feed reads, so none of them can count
 * differently. Only members who still exist, and no Test member unless this
 * reader asked to see them. Null when the scope holds nothing to count.
 */
function earnedOf(
  scope: IpScope,
  since: Date | null,
  reader: TestModeReader,
  /** These members' rows only, by the member indexes; null for everybody's. */
  members: readonly string[] | null = null,
): Prisma.Sql | null {
  const parts: Prisma.Sql[] = [];
  const among = members === null ? null : Prisma.join(members.map((id) => Prisma.sql`${id}`));
  const black = among === null ? Prisma.empty : Prisma.sql` AND "blackMemberId" IN (${among})`;
  const white = among === null ? Prisma.empty : Prisma.sql` AND "whiteMemberId" IN (${among})`;
  const solver = among === null ? Prisma.empty : Prisma.sql` AND "memberId" IN (${among})`;
  if (members !== null && members.length === 0) return null;
  if (scope.variants.length > 0) {
    const variants = Prisma.join(scope.variants.map((variant) => Prisma.sql`${variant}`));
    const when = since === null ? Prisma.empty : Prisma.sql` AND "lastMoveAt" >= ${since}`;
    parts.push(Prisma.sql`
      SELECT "blackMemberId" AS "memberId", "blackPoints"::float AS ip, "lastMoveAt" AS at, "variant" AS game FROM "Game"
      WHERE "variant" IN (${variants}) AND "blackMemberId" IS NOT NULL AND "blackPoints" > 0${when}${black}
      UNION ALL
      SELECT "whiteMemberId", "whitePoints"::float, "lastMoveAt", "variant" FROM "Game"
      WHERE "variant" IN (${variants}) AND "whiteMemberId" IS NOT NULL AND "whitePoints" > 0${when}${white}`);
  }
  if (scope.puzzles.length > 0) {
    const kinds = Prisma.join(scope.puzzles.map((kind) => Prisma.sql`${kind}`));
    const weight = Prisma.join(
      scope.puzzles.map((kind) => Prisma.sql`WHEN ${kind} THEN ${PUZZLE_IP_WEIGHT[kind]}::float`),
      " ",
    );
    const when = since === null ? Prisma.empty : Prisma.sql` AND "finishedAt" >= ${since}`;
    // A grid counts once, at the member's best solve of it, as the puzzle's own board counts it.
    parts.push(Prisma.sql`
      SELECT "memberId", best * (CASE "kind" ${weight} ELSE 0 END) AS ip, at, "kind" AS game FROM (
        SELECT "memberId", "kind", "givens", MAX("points") AS best, MAX("finishedAt") AS at FROM "PuzzleSolve"
        WHERE "kind" IN (${kinds})${when}${solver}
        GROUP BY "memberId", "kind", "givens"
      ) AS best_of_each`);
  }
  if (parts.length === 0) return null;
  const tests = reader.showsTestMembers ? Prisma.empty : Prisma.sql`WHERE "Member"."unclaimableBecause" IS DISTINCT FROM ${UNCLAIMABLE_REASONS.test}`;
  return Prisma.sql`
    SELECT earned."memberId", earned.ip, earned.at, earned.game
    FROM (${Prisma.join(parts, " UNION ALL ")}) AS earned
    JOIN "Member" ON "Member"."id" = earned."memberId"
    ${tests}`;
}

/** Every member's IP total over `earnedOf`: the rows a board ranks and a player's place is counted in. */
function totalsOf(scope: IpScope, since: Date | null, reader: TestModeReader, members: readonly string[] | null = null): Prisma.Sql | null {
  const earned = earnedOf(scope, since, reader, members);
  if (earned === null) return null;
  return Prisma.sql`
    SELECT "memberId", ROUND(SUM(ip))::int AS ip
    FROM (${earned}) AS earned
    GROUP BY "memberId"
    HAVING ROUND(SUM(ip)) > 0`;
}

export async function ipBoardOf(
  scope: IpScope,
  since: Date | null,
  take: number,
  /** Whether this reader may see the simulated test members (`testMode.ts`): nobody but the operator in Test mode. */
  reader: TestModeReader = HIDES_TEST_MEMBERS,
): Promise<IpRow[]> {
  const totals = totalsOf(scope, since, reader);
  if (totals === null) return [];
  const rows = await prisma.$queryRaw<{ memberId: string; ip: number }[]>`
    SELECT "memberId", ip FROM (${totals}) AS totals
    ORDER BY ip DESC, "memberId" ASC
    LIMIT ${take}
  `;
  return rows.map((row) => ({ memberId: row.memberId, ip: Number(row.ip) }));
}

/** One member's IP on a board, and their place on it: null where they have none. */
export type IpStanding = { ip: number; place: number } | null;

/**
 * Where one member stands on a board: their IP, and one more than the members
 * with more. Counted over the same totals the board lists (`totalsOf`), so a
 * player's page and the board agree; members level with them share the place.
 * One query, for the one page that asks.
 */
export async function ipStandingOf(
  memberId: string,
  scope: IpScope,
  since: Date | null,
  reader: TestModeReader = HIDES_TEST_MEMBERS,
): Promise<IpStanding> {
  const totals = totalsOf(scope, since, reader);
  if (totals === null) return null;
  const rows = await prisma.$queryRaw<{ ip: number | null; above: number }[]>`
    WITH totals AS (${totals})
    SELECT (SELECT ip FROM totals WHERE "memberId" = ${memberId}) AS ip,
           (SELECT COUNT(*) FROM totals WHERE ip > (SELECT ip FROM totals WHERE "memberId" = ${memberId}))::int AS above
  `;
  const row = rows[0];
  if (row === undefined || row.ip === null) return null;
  return { ip: Number(row.ip), place: Number(row.above) + 1 };
}

/**
 * One member's IP over the whole site, all time: the figure the strip under the
 * masthead shows beside their XP. The same totals the board counts
 * (`totalsOf`), narrowed to their own rows by the member indexes — one query
 * over their games and solves, never the whole board's ranking, because it is
 * read on every page they open. Their place on the board is on their own page
 * (`PlayerIp`), where ranking everybody is paid for once.
 */
export async function ipTotalOf(memberId: string): Promise<number> {
  const totals = totalsOf(SITE_SCOPE, null, HIDES_TEST_MEMBERS, [memberId]);
  if (totals === null) return 0;
  const rows = await prisma.$queryRaw<{ ip: number }[]>`SELECT ip FROM (${totals}) AS totals`;
  return rows.length === 0 ? 0 : Number(rows[0]!.ip);
}

/** One earning of IP: who, how much, and when, for the feed to tell a day at a time. */
export type IpEarned = { memberId: string; ip: number; at: Date };

/**
 * IP earned since a moment, earning by earning, newest first: the feed's IP
 * lines, told a day at a time in the reader's zone (`ipEntries`). Some members'
 * (the reader and their buddies) or everybody's (the Everyone tab), at most
 * `take` rows — one bounded read, as every feed read is.
 */
export async function ipEarnedSince(members: readonly string[] | null, since: Date, take: number): Promise<IpEarned[]> {
  const earned = earnedOf(SITE_SCOPE, since, HIDES_TEST_MEMBERS, members);
  if (earned === null) return [];
  const rows = await prisma.$queryRaw<{ memberId: string; ip: number; at: Date }[]>`
    SELECT "memberId", ip, at FROM (${earned}) AS earned
    ORDER BY at DESC
    LIMIT ${take}
  `;
  return rows.map((row) => ({ memberId: row.memberId, ip: Number(row.ip), at: new Date(row.at) }));
}

/**
 * The reader for `ipTotalsOf` on a table whose rows the page has ALREADY
 * chosen through the reader's own filter: a Test member on it is one this
 * reader may see, so its IP is counted like anybody's rather than printed as a
 * nought. Never for a board, which chooses its own rows.
 */
export const LISTED_ALREADY: TestModeReader = { showsTestMembers: true };

/**
 * The IP totals of the members a page lists, by member id, in one query — for
 * a table of players that shows IP beside XP, never a read per row. Over the
 * whole site unless the table is one game's (its standings), where the figure
 * is that game's and leads to its games. A member who has won none is absent:
 * the page prints a nought for them, because none won is a true total, not a
 * figure unread.
 */
export async function ipTotalsOf(
  memberIds: readonly string[],
  reader: TestModeReader = HIDES_TEST_MEMBERS,
  scope: IpScope = SITE_SCOPE,
): Promise<Map<string, number>> {
  const totals = totalsOf(scope, null, reader, memberIds);
  if (totals === null) return new Map();
  const rows = await prisma.$queryRaw<{ memberId: string; ip: number }[]>`SELECT "memberId", ip FROM (${totals}) AS totals`;
  return new Map(rows.map((row) => [row.memberId, Number(row.ip)]));
}

/**
 * The IP each of some members has won at each game, member by member and game
 * by game, in one query: for a table whose every row is one game's leader (the
 * champions), where the figure beside the leader is what they won at that game
 * and leads to those games. Summed and rounded as a board sums them.
 */
export async function ipByGameOf(
  memberIds: readonly string[],
  reader: TestModeReader = HIDES_TEST_MEMBERS,
): Promise<Map<string, Map<string, number>>> {
  const earned = earnedOf(SITE_SCOPE, null, reader, memberIds);
  if (earned === null) return new Map();
  const rows = await prisma.$queryRaw<{ memberId: string; game: string; ip: number }[]>`
    SELECT "memberId", game, ROUND(SUM(ip))::int AS ip
    FROM (${earned}) AS earned
    GROUP BY "memberId", game
    HAVING ROUND(SUM(ip)) > 0
  `;
  const out = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const games = out.get(row.memberId) ?? new Map<string, number>();
    games.set(row.game, Number(row.ip));
    out.set(row.memberId, games);
  }
  return out;
}
