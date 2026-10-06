import "server-only";

import { prisma } from "@/lib/prisma";

import { suidoBigSizeOf } from "../suido/bigLevels";
import { suidoBigBoardOf, suidoBigLevelBand, suidoBigLevelOfBoard, suidoBoardOf, suidoLevelBand, suidoLevelOfBoard } from "../suido/levels";
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
  const out: SuidoSolved = {};
  for (const row of rows) {
    // A board's level is named by its hash (`suidoLevelOfBoard`): no size's boards are read here.
    const level = suidoLevelOfBoard(row.size, row.givens);
    if (level === null) continue;
    // Fastest first, so the first seen is the best.
    (out[row.size] ??= {})[level] ??= { elapsedMs: row.elapsedMs, solveId: row.id };
  }
  return out;
}

/**
 * Every level of the big-pieces set a member has solved, by the level's number in the set (1 to 64), each with their best time on it. A level of the set
 * is a level of its own size, so its solve is a solve at that size; every board of the set carries big pieces (`;b` in its code) and no level by size does,
 * so the read narrows to those and each is named by its hash.
 */
export async function suidoBigSolvedBy(memberId: string): Promise<Record<number, SuidoLevelBest>> {
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, kind: "suido", solved: true, givens: { contains: ";b" } },
    orderBy: { elapsedMs: "asc" },
    select: { id: true, givens: true, elapsedMs: true },
  });
  const out: Record<number, SuidoLevelBest> = {};
  for (const row of rows) {
    const level = suidoBigLevelOfBoard(row.givens);
    if (level !== null) out[level] ??= { elapsedMs: row.elapsedMs, solveId: row.id };
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
  // A level's board is not here, only its hash and its first characters: the solves that start so are found, and kept if the board is the level's.
  const known = suidoBoardOf(size, level);
  if (known === undefined) return [];
  const rows = await prisma.puzzleSolve.findMany({
    // On no clock, with no Hint: a level offers neither, so a solve that says otherwise is no time to race.
    where: { kind: "suido", size, level: suidoLevelBand(size, level), givens: { startsWith: known.prefix }, solved: true, helped: null, hintsUsed: 0, clock: "none" },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: SUIDO_FASTEST_SHOWN * 4,
    select: { id: true, memberId: true, elapsedMs: true, finishedAt: true, givens: true },
  });
  const seen = new Set<string>();
  return rows
    .filter((row) => suidoLevelOfBoard(size, row.givens) === level)
    .filter((row) => (seen.has(row.memberId) ? false : (seen.add(row.memberId), true)))
    .slice(0, SUIDO_FASTEST_SHOWN)
    .map(({ givens: _board, ...rest }) => rest);
}

/** The fastest solves of one level of the big-pieces set, one per member at their best: found as a size's are, by the level's size, its third of the set and its board. */
export async function suidoBigLevelFastest(level: number): Promise<LevelFastest[]> {
  const known = suidoBigBoardOf(level);
  const size = suidoBigSizeOf(level);
  if (known === undefined || size === null) return [];
  const rows = await prisma.puzzleSolve.findMany({
    where: { kind: "suido", size, level: suidoBigLevelBand(level), givens: { startsWith: known.prefix }, solved: true, helped: null, hintsUsed: 0, clock: "none" },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: SUIDO_FASTEST_SHOWN * 4,
    select: { id: true, memberId: true, elapsedMs: true, finishedAt: true, givens: true },
  });
  const seen = new Set<string>();
  return rows
    .filter((row) => suidoBigLevelOfBoard(row.givens) === level)
    .filter((row) => (seen.has(row.memberId) ? false : (seen.add(row.memberId), true)))
    .slice(0, SUIDO_FASTEST_SHOWN)
    .map(({ givens: _board, ...rest }) => rest);
}
