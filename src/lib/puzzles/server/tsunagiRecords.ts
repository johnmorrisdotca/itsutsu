import "server-only";

import { prisma } from "@/lib/prisma";

import { loadTsunagiLevels, TSUNAGI_SIZES, tsunagiBand, tsunagiLevelOf, tsunagiLevelsOf } from "../tsunagi/levels";

/**
 * TSUNAGI'S RECORDS, read from the solves every puzzle keeps (`PuzzleSolve`):
 * no table of its own. A level is known by its layout, which a solve keeps as
 * its givens, so "which levels has this member solved" and "who is fastest on
 * level 12" are each one indexed read over rows that already exist.
 */

/** A member's best on one level: the time, and the solve it was, to open again. */
export type LevelBest = { elapsedMs: number; solveId: string };

/** Every level a member has solved, by size and then level number, each with their best time on it. */
export type TsunagiSolved = Record<number, Record<number, LevelBest>>;

export async function tsunagiSolvedBy(memberId: string): Promise<TsunagiSolved> {
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, kind: "tsunagi", solved: true },
    orderBy: { elapsedMs: "asc" },
    select: { id: true, size: true, givens: true, elapsedMs: true },
  });
  const out: TsunagiSolved = {};
  const sizes = [...new Set(rows.map((row) => row.size))].filter((size) => (TSUNAGI_SIZES as readonly number[]).includes(size));
  await Promise.all(sizes.map((size) => loadTsunagiLevels(size)));
  for (const row of rows) {
    if (!sizes.includes(row.size)) continue;
    const level = tsunagiLevelOf(row.size, row.givens);
    if (level === null) continue;
    const bySize = (out[row.size] ??= {});
    // Fastest first, so the first seen is the best.
    bySize[level] ??= { elapsedMs: row.elapsedMs, solveId: row.id };
  }
  return out;
}

/** A fastest time on one level, by anybody. */
export type LevelFastest = { memberId: string; elapsedMs: number; finishedAt: Date };

export const LEVEL_FASTEST_SHOWN = 5;

/**
 * The fastest solves of one level, one per member at their best: the level's
 * own leaderboard. Everybody plays the same board, so these times are the
 * same race run apart. On the (kind, size, level, elapsedMs) index, the level
 * being its band, then narrowed to its layout.
 */
export async function tsunagiLevelFastest(size: number, level: number): Promise<LevelFastest[]> {
  await loadTsunagiLevels(size);
  const givens = tsunagiLevelsOf(size)[level - 1]?.[0];
  if (givens === undefined) return [];
  const rows = await prisma.puzzleSolve.findMany({
    where: { kind: "tsunagi", size, level: tsunagiBand(size, level), givens, solved: true },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: LEVEL_FASTEST_SHOWN * 4,
    select: { memberId: true, elapsedMs: true, finishedAt: true },
  });
  const seen = new Set<string>();
  return rows.filter((row) => (seen.has(row.memberId) ? false : (seen.add(row.memberId), true))).slice(0, LEVEL_FASTEST_SHOWN);
}
