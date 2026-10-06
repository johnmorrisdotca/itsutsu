import "server-only";

import { prisma } from "@/lib/prisma";

import { meikyuuLevelOfBoard, meikyuuLevelsAt } from "../meikyuu/levels";
import { loadMeikyuuLevelsFromModule } from "../meikyuu/levelsModule";
import { isMeikyuuSize, MEIKYUU_EVERY_SIZE } from "../meikyuu/sizes";
import type { OrdinaryLevel } from "../puzzles.types";
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
    where: { memberId, kind: "meikyuu", solved: true, size: { in: [...MEIKYUU_EVERY_SIZE] } },
    orderBy: { elapsedMs: "asc" },
    select: { id: true, size: true, givens: true, elapsedMs: true },
  });
  if (rows.length === 0) return {};
  // Only the lists the member has solved something in: a member of the squares alone never reads the tall one.
  const sizes = [...new Set(rows.map((row) => row.size))];
  await loadMeikyuuLevelsFromModule(sizes);
  // A maze's level, found once for every level a size has rather than once for every solve.
  const numbers = new Map<number, Map<string, number>>(sizes.map((size) => [size, new Map(meikyuuLevelsAt(size).map((row, at) => [row.code, at + 1]))]));
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

/** The three thirds a Meikyuu solve is filed under (`meikyuuLevelBand`). */
const MEIKYUU_THIRDS: readonly OrdinaryLevel[] = ["easy", "medium", "hard"];

/**
 * The fastest solves of one level, one per member at their best: the level's
 * own leaderboard. Everybody draws through the same maze, so these times are
 * the same race run apart. On the (kind, size, level, elapsedMs) index, the
 * level being its band, then narrowed to its maze.
 */
export async function meikyuuLevelFastest(size: number, level: number): Promise<LevelFastest[]> {
  if (!isMeikyuuSize(size)) return [];
  await loadMeikyuuLevelsFromModule([size]);
  const givens = meikyuuLevelsAt(size)[level - 1]?.code;
  if (givens === undefined) return [];
  const rows = await prisma.puzzleSolve.findMany({
    // On no clock, with no Hint: a level offers neither, so a solve that says otherwise is no time to race. The maze is its givens. The third a solve was filed
    // under (its `level`) is the third its number was in when it was solved, and since package 3.0.0 the lists are in the order of the score, so the same maze may be in
    // another third now: all three are asked for, so no solve of this maze is lost to a renumbering.
    where: { kind: "meikyuu", size, level: { in: [...MEIKYUU_THIRDS] }, givens, solved: true, helped: null, hintsUsed: 0, clock: "none" },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: MEIKYUU_FASTEST_SHOWN * 4,
    select: { id: true, memberId: true, elapsedMs: true, finishedAt: true },
  });
  const seen = new Set<string>();
  return rows.filter((row) => (seen.has(row.memberId) ? false : (seen.add(row.memberId), true))).slice(0, MEIKYUU_FASTEST_SHOWN);
}

/** The level a Meikyuu solve's maze is, at its size, or null for a maze no level has: the list is read once, here, and nowhere a page does not ask. */
export async function meikyuuLevelOfSolve(size: number, givens: string): Promise<number | null> {
  if (!isMeikyuuSize(size)) return null;
  await loadMeikyuuLevelsFromModule([size]);
  return meikyuuLevelOfBoard(size, givens);
}
