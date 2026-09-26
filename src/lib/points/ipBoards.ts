import "server-only";

import { Prisma } from "@prisma/client";

import { isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { PUZZLE_KIND_LIST } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { prisma } from "@/lib/prisma";
import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { HIDES_TEST_MEMBERS, type TestModeReader } from "@/lib/testMode/testMode";
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

/** What a board counts: some games, some puzzles. */
export type IpScope = { variants: readonly RuleVariant[]; puzzles: readonly PuzzleKind[] };

/** One game's board, or one puzzle's. */
export function scopeOfGame(key: RuleVariant | PuzzleKind): IpScope {
  return isPuzzleKind(key) ? { variants: [], puzzles: [key] } : { variants: [key], puzzles: [] };
}

/** One family's board: every game and puzzle at home in it. */
export function scopeOfFamily(familyKey: string): IpScope | null {
  const family = GAME_FAMILIES.find((one) => one.key === familyKey);
  if (family === undefined) return null;
  return {
    variants: family.games.filter((game): game is RuleVariant => !isPuzzleKind(game)),
    puzzles: family.games.filter((game): game is PuzzleKind => isPuzzleKind(game)),
  };
}

/** The site's board: everything. */
export const SITE_SCOPE: IpScope = { variants: RULE_VARIANT_LIST, puzzles: PUZZLE_KIND_LIST };

/**
 * Every member's IP in a scope since a moment, as one SQL fragment of
 * (memberId, ip) rows: the query both a board and one player's place on it
 * read, so the two can never count differently. Null when the scope holds
 * nothing to count.
 */
function totalsOf(
  scope: IpScope,
  since: Date | null,
  reader: TestModeReader,
  /** One member's rows only, by the member indexes: their own total, not the whole board's. */
  only: string | null = null,
): Prisma.Sql | null {
  const parts: Prisma.Sql[] = [];
  const black = only === null ? Prisma.empty : Prisma.sql` AND "blackMemberId" = ${only}`;
  const white = only === null ? Prisma.empty : Prisma.sql` AND "whiteMemberId" = ${only}`;
  const solver = only === null ? Prisma.empty : Prisma.sql` AND "memberId" = ${only}`;
  if (scope.variants.length > 0) {
    const variants = Prisma.join(scope.variants.map((variant) => Prisma.sql`${variant}`));
    const when = since === null ? Prisma.empty : Prisma.sql` AND "lastMoveAt" >= ${since}`;
    parts.push(Prisma.sql`
      SELECT "blackMemberId" AS "memberId", "blackPoints"::float AS ip FROM "Game"
      WHERE "variant" IN (${variants}) AND "blackMemberId" IS NOT NULL AND "blackPoints" > 0${when}${black}
      UNION ALL
      SELECT "whiteMemberId", "whitePoints"::float FROM "Game"
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
      SELECT "memberId", best * (CASE "kind" ${weight} ELSE 0 END) AS ip FROM (
        SELECT "memberId", "kind", "givens", MAX("points") AS best FROM "PuzzleSolve"
        WHERE "kind" IN (${kinds})${when}${solver}
        GROUP BY "memberId", "kind", "givens"
      ) AS best_of_each`);
  }
  if (parts.length === 0) return null;
  // Members who still exist only: a row a removed member left behind names nobody, and a board of "A member" says nothing.
  // And no simulated test member unless this reader asked to see them — the rule `hiddenMembersWhere` keeps, in SQL.
  const tests = reader.showsTestMembers ? Prisma.empty : Prisma.sql`WHERE "Member"."unclaimableBecause" IS DISTINCT FROM ${UNCLAIMABLE_REASONS.test}`;
  return Prisma.sql`
    SELECT earned."memberId", ROUND(SUM(earned.ip))::int AS ip
    FROM (${Prisma.join(parts, " UNION ALL ")}) AS earned
    JOIN "Member" ON "Member"."id" = earned."memberId"
    ${tests}
    GROUP BY earned."memberId"
    HAVING ROUND(SUM(earned.ip)) > 0`;
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
  const totals = totalsOf(SITE_SCOPE, null, HIDES_TEST_MEMBERS, memberId);
  if (totals === null) return 0;
  const rows = await prisma.$queryRaw<{ ip: number }[]>`SELECT ip FROM (${totals}) AS totals`;
  return rows.length === 0 ? 0 : Number(rows[0]!.ip);
}
