import "server-only";

import { prisma } from "@/lib/prisma";

import { meikyuuLevelBand } from "../meikyuu/levelCounts";
import { meikyuuLevelOfBoard, meikyuuLevelsAt } from "../meikyuu/levels";
import { loadMeikyuuLevelsFromModule } from "../meikyuu/levelsModule";
import { MEIKYUU_SIZES } from "../meikyuu/sizes";
import type { LevelFastest } from "./tsunagiRecords";

/**
 * MEIKYUU'S RECORDS, read from the solves every puzzle keeps (`PuzzleSolve`):
 * no table of its own. A level is known by its recipe, which a solve keeps as
 * its givens, so "which levels has this member solved" and "who is fastest on
 * level 12" are each one indexed read over rows that already exist — and a
 * solve is found by the maze, never by a number, so a level renumbered later
 * keeps every solve of it.
 */

/** A member's best on one level: the time, and the solve it was, to open again. */
export type MeikyuuLevelBest = { elapsedMs: number; solveId: string };

/** Every level a member has solved, by size and then level number, each with their best time on it. */
export type MeikyuuSolved = Record<number, Record<number, MeikyuuLevelBest>>;

export async function meikyuuSolvedBy(memberId: string): Promise<MeikyuuSolved> {
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, kind: "meikyuu", solved: true, size: { in: [...MEIKYUU_SIZES] } },
    orderBy: { elapsedMs: "asc" },
    select: { id: true, size: true, givens: true, elapsedMs: true },
  });
  if (rows.length === 0) return {};
  await loadMeikyuuLevelsFromModule();
  // A maze's level, found once for every level a size has rather than once for every solve.
  const numbers = new Map<number, Map<string, number>>(MEIKYUU_SIZES.map((size) => [size, new Map(meikyuuLevelsAt(size).map((row, at) => [row.code, at + 1]))]));
  const out: MeikyuuSolved = {};
  for (const row of rows) {
    const level = numbers.get(row.size)?.get(row.givens);
    if (level === undefined) continue;
    // Fastest first, so the first seen is the best.
    (out[row.size] ??= {})[level] ??= { elapsedMs: row.elapsedMs, solveId: row.id };
  }
  return out;
}

export const MEIKYUU_FASTEST_SHOWN = 5;

/**
 * The fastest solves of one level, one per member at their best: the level's
 * own leaderboard. Everybody draws through the same maze, so these times are
 * the same race run apart. On the (kind, size, level, elapsedMs) index, the
 * level being its band, then narrowed to its maze.
 */
export async function meikyuuLevelFastest(size: number, level: number): Promise<LevelFastest[]> {
  await loadMeikyuuLevelsFromModule();
  const givens = meikyuuLevelsAt(size)[level - 1]?.code;
  if (givens === undefined) return [];
  const rows = await prisma.puzzleSolve.findMany({
    // On no clock, with no Hint: a level offers neither, so a solve that says otherwise is no time to race.
    where: { kind: "meikyuu", size, level: meikyuuLevelBand(size, level), givens, solved: true, helped: null, hintsUsed: 0, clock: "none" },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: MEIKYUU_FASTEST_SHOWN * 4,
    select: { id: true, memberId: true, elapsedMs: true, finishedAt: true },
  });
  const seen = new Set<string>();
  return rows.filter((row) => (seen.has(row.memberId) ? false : (seen.add(row.memberId), true))).slice(0, MEIKYUU_FASTEST_SHOWN);
}

/** The level a Meikyuu solve's maze is, at its size, or null for a maze no level has: the list is read once, here, and nowhere a page does not ask. */
export async function meikyuuLevelOfSolve(size: number, givens: string): Promise<number | null> {
  await loadMeikyuuLevelsFromModule();
  return meikyuuLevelOfBoard(size, givens);
}
