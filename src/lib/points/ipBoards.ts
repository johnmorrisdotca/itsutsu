import "server-only";

import { Prisma } from "@prisma/client";

import { isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { PUZZLE_KIND_LIST } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { prisma } from "@/lib/prisma";
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

export async function ipBoardOf(scope: IpScope, since: Date | null, take: number): Promise<IpRow[]> {
  const parts: Prisma.Sql[] = [];
  if (scope.variants.length > 0) {
    const variants = Prisma.join(scope.variants.map((variant) => Prisma.sql`${variant}`));
    const when = since === null ? Prisma.empty : Prisma.sql` AND "lastMoveAt" >= ${since}`;
    parts.push(Prisma.sql`
      SELECT "blackMemberId" AS "memberId", "blackPoints"::float AS ip FROM "Game"
      WHERE "variant" IN (${variants}) AND "blackMemberId" IS NOT NULL AND "blackPoints" > 0${when}
      UNION ALL
      SELECT "whiteMemberId", "whitePoints"::float FROM "Game"
      WHERE "variant" IN (${variants}) AND "whiteMemberId" IS NOT NULL AND "whitePoints" > 0${when}`);
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
        WHERE "kind" IN (${kinds})${when}
        GROUP BY "memberId", "kind", "givens"
      ) AS best_of_each`);
  }
  if (parts.length === 0) return [];
  // Members who still exist only: a row a removed member left behind names nobody, and a board of "A member" says nothing.
  const rows = await prisma.$queryRaw<{ memberId: string; ip: number }[]>`
    SELECT earned."memberId", ROUND(SUM(earned.ip))::int AS ip
    FROM (${Prisma.join(parts, " UNION ALL ")}) AS earned
    JOIN "Member" ON "Member"."id" = earned."memberId"
    GROUP BY earned."memberId"
    HAVING ROUND(SUM(earned.ip)) > 0
    ORDER BY ip DESC, earned."memberId" ASC
    LIMIT ${take}
  `;
  return rows.map((row) => ({ memberId: row.memberId, ip: Number(row.ip) }));
}
