import "server-only";

import { Prisma } from "@prisma/client";

import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { prisma } from "@/lib/prisma";
import { HIDES_TEST_MEMBERS, type TestModeReader } from "@/lib/testMode/testMode";

import type { PuzzleKind } from "../puzzles.types";

/**
 * A puzzle's leaderboard: every member's total points, counting each grid once
 * at their best solve of it (PuzzleMadness: "only a puzzle's best score
 * counts"), highest first. All time, or since a moment — the start of this
 * month for the monthly board. See `pointsFor` for what a solve scores.
 *
 * One grouped query over (kind, memberId, givens), never a sum recomputed per
 * row: the points were stored when each solve was kept.
 */
export type PointsRow = { memberId: string; points: number; puzzles: number };

export const POINTS_SHOWN = 10;
export const POINTS_WHOLE = 200;

export async function pointsBoardOf(
  kind: PuzzleKind,
  since: Date | null,
  take = POINTS_SHOWN,
  /** Whether this reader may see the simulated test members (`testMode.ts`): nobody but the operator in Test mode. */
  reader: TestModeReader = HIDES_TEST_MEMBERS,
): Promise<PointsRow[]> {
  /*
   * Members who still exist, as the IP boards count them (`ipBoards.ts`): a solve
   * a removed member left behind names nobody, and a board of "A member" rows
   * says nothing. And no Test member unless this reader asked to see them.
   */
  const tests = reader.showsTestMembers ? Prisma.empty : Prisma.sql`AND "Member"."unclaimableBecause" IS DISTINCT FROM ${UNCLAIMABLE_REASONS.test}`;
  const rows = await prisma.$queryRaw<{ memberId: string; points: bigint; puzzles: bigint }[]>`
    SELECT best_of_each."memberId", SUM(best) AS points, COUNT(*) AS puzzles
    FROM (
      SELECT "memberId", "givens", MAX("points") AS best
      FROM "PuzzleSolve"
      WHERE "kind" = ${kind} AND (${since}::timestamp IS NULL OR "finishedAt" >= ${since}::timestamp)
      GROUP BY "memberId", "givens"
    ) AS best_of_each
    JOIN "Member" ON "Member"."id" = best_of_each."memberId" ${tests}
    GROUP BY best_of_each."memberId"
    HAVING SUM(best) > 0
    ORDER BY points DESC, "memberId" ASC
    LIMIT ${take}
  `;
  return rows.map((row) => ({ memberId: row.memberId, points: Number(row.points), puzzles: Number(row.puzzles) }));
}

/** The first moment of this calendar month, in UTC: where the monthly board starts. */
export function startOfMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * The first moment of this week, Monday 00:00 in UTC: where the weekly board
 * starts. UTC, as the month is, so every reader sees one board and the week
 * turns over for everybody at once; Monday, as the ISO week and most of the
 * world's calendars begin.
 */
export function startOfWeek(now = new Date()): Date {
  const sinceMonday = (now.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - sinceMonday));
}
