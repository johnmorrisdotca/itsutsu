import "server-only";

import { prisma } from "@/lib/prisma";

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

export async function pointsBoardOf(kind: PuzzleKind, since: Date | null, take = POINTS_SHOWN): Promise<PointsRow[]> {
  const rows = await prisma.$queryRaw<{ memberId: string; points: bigint; puzzles: bigint }[]>`
    SELECT "memberId", SUM(best) AS points, COUNT(*) AS puzzles
    FROM (
      SELECT "memberId", "givens", MAX("points") AS best
      FROM "PuzzleSolve"
      WHERE "kind" = ${kind} AND (${since}::timestamp IS NULL OR "finishedAt" >= ${since}::timestamp)
      GROUP BY "memberId", "givens"
    ) AS best_of_each
    GROUP BY "memberId"
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
