import "server-only";

import { prisma } from "@/lib/prisma";

import { tobiishiLevelOfBoard, tobiishiRefOf, tobiishiCodeOf } from "../tobiishi/levels";
import { TOBIISHI_SIZES, tobiishiBand } from "../tobiishi/sizes";
import type { LevelFastest } from "./tsunagiRecords";

/**
 * TOBIISHI'S RECORDS, read from the solves every puzzle keeps (`PuzzleSolve`): no
 * table of its own. A level is known by its code, which a solve keeps as its givens, so
 * "which levels has this member solved" and "who is fastest on level 12" are each one
 * indexed read over rows that already exist, and a solve is found by the level's name,
 * never by a number, so a level renumbered later keeps every solve of it.
 */

/** A member's best on one level: the time, and the solve it was, to open again. */
export type TobiishiLevelBest = { elapsedMs: number; solveId: string };

/** Every level a member has solved, by length and then level number, each with their best time on it. */
export type TobiishiSolved = Record<number, Record<number, TobiishiLevelBest>>;

export async function tobiishiSolvedBy(memberId: string): Promise<TobiishiSolved> {
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, kind: "tobiishi", solved: true, size: { in: [...TOBIISHI_SIZES] } },
    orderBy: { elapsedMs: "asc" },
    select: { id: true, size: true, givens: true, elapsedMs: true },
  });
  const out: TobiishiSolved = {};
  for (const row of rows) {
    const level = tobiishiLevelOfBoard(row.size, row.givens);
    if (level === null) continue;
    // Fastest first, so the first seen is the best.
    (out[row.size] ??= {})[level] ??= { elapsedMs: row.elapsedMs, solveId: row.id };
  }
  return out;
}

export const TOBIISHI_FASTEST_SHOWN = 5;

/**
 * The fastest solves of one level, one per member at their best: the level's own
 * leaderboard. Everybody plays the same board, so these times are the same race run
 * apart. On the (kind, size, level, elapsedMs) index, the level being its band (a length
 * is one band), then narrowed to its code.
 */
export async function tobiishiLevelFastest(size: number, level: number): Promise<LevelFastest[]> {
  const ref = tobiishiRefOf(size, level);
  if (ref === null) return [];
  const rows = await prisma.puzzleSolve.findMany({
    // On no clock, with no Hint: a level offers neither, so a solve that says otherwise is no time to race.
    where: { kind: "tobiishi", size, level: tobiishiBand(size), givens: tobiishiCodeOf(ref), solved: true, helped: null, hintsUsed: 0, clock: "none" },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: TOBIISHI_FASTEST_SHOWN * 4,
    select: { id: true, memberId: true, elapsedMs: true, finishedAt: true },
  });
  const seen = new Set<string>();
  return rows.filter((row) => (seen.has(row.memberId) ? false : (seen.add(row.memberId), true))).slice(0, TOBIISHI_FASTEST_SHOWN);
}

/** The level a Tobiishi solve's board is, at its length, or null for a code no level has. */
export function tobiishiLevelOfSolve(size: number, givens: string): number | null {
  return tobiishiLevelOfBoard(size, givens);
}
