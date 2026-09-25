import "server-only";

import { prisma } from "@/lib/prisma";

import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";

/**
 * The puzzles somebody has going: started on their own, not finished, kept
 * when they paused or left the page. John, 2026-09-24: "I started Numbers
 * game, paused it, then clicked away... why is it not showing up in my current
 * games list?" A puzzle lived only in its tab until then.
 *
 * One row per member per grid, rewritten each time it is kept; the oldest past
 * `RUNS_KEPT` go, so a member who starts puzzles and never finishes them holds
 * a short list, not a growing one. Every read is one indexed query.
 */
export const RUNS_KEPT = 20;

export type KeptRun = {
  memberId: string;
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  seed: number;
  checksAllowed: number | null;
  checksUsed: number;
  hintsAllowed: boolean;
  hintsUsed: number;
  /** Gomoji's Strict; false for every other puzzle. */
  strict: boolean;
  progress: string;
  /** Every grid it has been, for the scrubber (`stepLog.ts`), or null when none could be read. */
  steps: string | null;
  elapsedMs: number;
};

export async function keepRun(run: KeptRun): Promise<void> {
  const { memberId, kind, size, level, seed, ...rest } = run;
  await prisma.puzzleRun.upsert({
    where: { memberId_kind_size_level_seed: { memberId, kind, size, level, seed } },
    create: run,
    update: rest,
  });
  const over = await prisma.puzzleRun.findMany({
    where: { memberId },
    orderBy: { updatedAt: "desc" },
    skip: RUNS_KEPT,
    select: { id: true },
  });
  if (over.length > 0) await prisma.puzzleRun.deleteMany({ where: { id: { in: over.map((row) => row.id) } } });
}

/** The run of this grid, for the solve page to open where it was left, or null. */
export async function runOf(memberId: string, kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number) {
  return prisma.puzzleRun.findUnique({
    where: { memberId_kind_size_level_seed: { memberId, kind, size, level, seed } },
    select: { checksAllowed: true, checksUsed: true, hintsUsed: true, progress: true, steps: true, elapsedMs: true },
  });
}

/** Everything a member has going, most recently touched first, for their games page. */
export async function runsOf(memberId: string) {
  return prisma.puzzleRun.findMany({
    where: { memberId },
    orderBy: { updatedAt: "desc" },
    take: RUNS_KEPT,
    select: { id: true, kind: true, size: true, level: true, seed: true, checksAllowed: true, hintsAllowed: true, hintsUsed: true, strict: true, elapsedMs: true, updatedAt: true },
  });
}

/** The member's most recently touched run of one puzzle, for its page's Resume (one indexed read), or null. */
export async function latestRunOf(memberId: string, kind: PuzzleKind) {
  return prisma.puzzleRun.findFirst({
    where: { memberId, kind },
    orderBy: { updatedAt: "desc" },
    select: { size: true, level: true, seed: true, checksAllowed: true, hintsAllowed: true, strict: true },
  });
}

/** A grid finished: it is no longer going. */
export async function dropRun(memberId: string, kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number): Promise<void> {
  await prisma.puzzleRun.deleteMany({ where: { memberId, kind, size, level, seed } });
}
