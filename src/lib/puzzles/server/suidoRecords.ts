import "server-only";

import { prisma } from "@/lib/prisma";

import { loadSuidoLevelsAt, suidoLevelBand, suidoLevelOfBoard, suidoLevelsAt } from "../suido/levels";
import { SUIDO_LEVEL_SIZES } from "../suido/sizes";
import type { LevelFastest } from "./tsunagiRecords";

/**
 * SUIDO'S RECORDS, read from the solves every puzzle keeps (`PuzzleSolve`):
 * no table of its own. A level is known by its board, which a solve keeps as
 * its givens, so "which levels has this member solved" and "who is fastest on
 * level 12" are each one indexed read over rows that already exist — and a
 * solve is found by the board, never by a number, so a level renumbered later
 * keeps every solve of it.
 *
 * A solve of a board made from a seed has givens that are no level's, and is
 * left out of all of it.
 */

/** A member's best on one level: the time, and the solve it was, to open again. */
export type SuidoLevelBest = { elapsedMs: number; solveId: string };

/** Every level a member has solved, by size and then level number, each with their best time on it. */
export type SuidoSolved = Record<number, Record<number, SuidoLevelBest>>;

export async function suidoSolvedBy(memberId: string): Promise<SuidoSolved> {
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, kind: "suido", solved: true, size: { in: [...SUIDO_LEVEL_SIZES] } },
    orderBy: { elapsedMs: "asc" },
    select: { id: true, size: true, givens: true, elapsedMs: true },
  });
  const sizes = [...new Set(rows.map((row) => row.size))];
  await Promise.all(sizes.map((size) => loadSuidoLevelsAt(size)));
  // A board's level, found once for every board a size has rather than once for every solve.
  const numbers = new Map<number, Map<string, number>>(sizes.map((size) => [size, new Map(suidoLevelsAt(size).map(([code], at) => [code, at + 1]))]));
  const out: SuidoSolved = {};
  for (const row of rows) {
    const level = numbers.get(row.size)?.get(row.givens);
    if (level === undefined) continue;
    // Fastest first, so the first seen is the best.
    (out[row.size] ??= {})[level] ??= { elapsedMs: row.elapsedMs, solveId: row.id };
  }
  return out;
}

export const SUIDO_FASTEST_SHOWN = 5;

/**
 * The fastest solves of one level, one per member at their best: the level's
 * own leaderboard. Everybody plays the same board, so these times are the
 * same race run apart. On the (kind, size, level, elapsedMs) index, the level
 * being its band, then narrowed to its board.
 */
export async function suidoLevelFastest(size: number, level: number): Promise<LevelFastest[]> {
  await loadSuidoLevelsAt(size);
  const givens = suidoLevelsAt(size)[level - 1]?.[0];
  if (givens === undefined || suidoLevelOfBoard(size, givens) === null) return [];
  const rows = await prisma.puzzleSolve.findMany({
    // On no clock, with no Hint: a level offers neither, so a solve that says otherwise is no time to race.
    where: { kind: "suido", size, level: suidoLevelBand(size, level), givens, solved: true, helped: null, hintsUsed: 0, clock: "none" },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: SUIDO_FASTEST_SHOWN * 4,
    select: { id: true, memberId: true, elapsedMs: true, finishedAt: true },
  });
  const seen = new Set<string>();
  return rows.filter((row) => (seen.has(row.memberId) ? false : (seen.add(row.memberId), true))).slice(0, SUIDO_FASTEST_SHOWN);
}
