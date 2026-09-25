import "server-only";

import { prisma } from "@/lib/prisma";

import { pointsFor } from "../puzzlePoints";
import { PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";

/**
 * The solves the site keeps: one row per finished puzzle per member.
 *
 * Written by the two routes that check a grid (`/api/puzzles/solved` and a
 * race's finish) and read by a puzzle's page — the fastest solves at each
 * size and level, and a member's own. Every read is one indexed query; a
 * page reads nothing per row.
 */

export type KeptSolve = {
  memberId: string;
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  givens: string;
  elapsedMs: number;
  raceId?: string | null;
  /** The Check allowance it was solved under, 3 or 1, or null for no limit. */
  checksAllowed: number | null;
  checksUsed: number;
  /** Time spent paused, already off `elapsedMs`. */
  pausedMs: number;
  /** How many times Hint was pressed; a race allows none. */
  hintsUsed: number;
  /** The answer handed in, which a word puzzle's points are read from (`pointsFor`), kept so the finished puzzle can be opened again. */
  answer?: string;
  /** False for a word puzzle whose guesses ran out: kept for what it found, never counted as a solve. */
  solved?: boolean;
};

export async function keepSolve(solve: KeptSolve): Promise<void> {
  try {
    // Its leaderboard score, worked out once here so a board never sums on a view: see `pointsFor`.
    const { answer, solved = true, ...kept } = solve;
    const points = pointsFor(solve.kind, solve.size, solve.givens, solve.checksUsed, solve.hintsUsed, answer, solve.elapsedMs);
    await prisma.puzzleSolve.create({
      data: { ...kept, raceId: solve.raceId ?? null, points, solved, answer: answer ?? null },
    });
  } catch (problem) {
    /* The solve has already been checked and paid; a row that could not be
       kept is logged, never a failure the solver is shown. */
    console.error("Could not keep a puzzle solve", solve.memberId, solve.kind, problem);
  }
}

/** A fastest solve, with the Check allowance it was made under — so a one-check time is never shown as a free one. */
export type FastestSolve = { memberId: string; elapsedMs: number; finishedAt: Date; checksAllowed: number | null; hintsUsed: number | null };

/** The fastest solve at each size and level of a kind, as a map keyed `${size}:${level}`, and how many solves each has. */
export type FastestBoard = Map<string, { fastest: FastestSolve[]; solves: number }>;

export const FASTEST_SHOWN = 3;

export async function fastestSolvesOf(kind: PuzzleKind): Promise<FastestBoard> {
  const spec = PUZZLE_SPECS[kind];
  const board: FastestBoard = new Map();
  const counts = await prisma.puzzleSolve.groupBy({
    by: ["size", "level"],
    where: { kind, solved: true },
    _count: { _all: true },
  });
  for (const row of counts) board.set(`${row.size}:${row.level}`, { fastest: [], solves: row._count._all });
  /* One query per (size, level) that has any solves — at most the kind's sizes
     times its levels, each on the (kind, size, level, elapsedMs) index. */
  await Promise.all(
    [...board.keys()].map(async (key) => {
      const [size, level] = key.split(":");
      if (!spec.sizes.includes(Number(size))) return;
      const rows = await prisma.puzzleSolve.findMany({
        where: { kind, size: Number(size), level, solved: true },
        orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
        take: FASTEST_SHOWN,
        select: { memberId: true, elapsedMs: true, finishedAt: true, checksAllowed: true, hintsUsed: true },
      });
      board.get(key)!.fastest = rows;
    }),
  );
  return board;
}

export type OwnSolve = { id: string; size: number; level: string; elapsedMs: number; finishedAt: Date; raceId: string | null };

export const OWN_SOLVES_SHOWN = 50;

export async function ownSolvesOf(memberId: string, kind: PuzzleKind): Promise<OwnSolve[]> {
  return prisma.puzzleSolve.findMany({
    where: { memberId, kind, solved: true },
    orderBy: { finishedAt: "desc" },
    take: OWN_SOLVES_SHOWN,
    select: { id: true, size: true, level: true, elapsedMs: true, finishedAt: true, raceId: true },
  });
}

/** The names behind member ids, for a board of solves: one query for the page, never one per row. */
export async function memberNamesOf(ids: readonly string[]): Promise<Map<string, string>> {
  const wanted = [...new Set(ids)];
  if (wanted.length === 0) return new Map();
  const rows = await prisma.member.findMany({ where: { id: { in: wanted } }, select: { id: true, name: true } });
  return new Map(rows.map((row) => [row.id, row.name ?? ""]));
}

/** How many solves a member has of a kind, for the count that leads to the list. */
export async function ownSolveCount(memberId: string, kind: PuzzleKind): Promise<number> {
  return prisma.puzzleSolve.count({ where: { memberId, kind, solved: true } });
}

/** A Gomoji word a member has played to its end, found or not, with the guesses where they were kept. */
export type OwnWord = {
  id: string;
  size: number;
  level: string;
  givens: string;
  answer: string | null;
  solved: boolean;
  points: number;
  elapsedMs: number;
  finishedAt: Date;
};

export const OWN_WORDS_SHOWN = 50;

/**
 * A member's Gomoji words, newest first, the found and the not found alike —
 * the history John asked for: "the history of guesses/words that the user has
 * ever played? with score?" One indexed query, and how many there are in all.
 */
export async function ownWordsOf(
  memberId: string,
  kind: "gomoji" | "gomojiKana" | "gomojiMot" | "gomojiWort" = "gomoji",
): Promise<{ words: OwnWord[]; total: number }> {
  const [words, total] = await Promise.all([
    prisma.puzzleSolve.findMany({
      where: { memberId, kind },
      orderBy: [{ finishedAt: "desc" }, { id: "desc" }],
      take: OWN_WORDS_SHOWN,
      select: { id: true, size: true, level: true, givens: true, answer: true, solved: true, points: true, elapsedMs: true, finishedAt: true },
    }),
    prisma.puzzleSolve.count({ where: { memberId, kind } }),
  ]);
  return { words, total };
}

/** One finished puzzle, found or not, for the page that opens it again. */
export type FinishedSolve = {
  id: string;
  kind: string;
  size: number;
  level: string;
  givens: string;
  answer: string | null;
  solved: boolean;
  points: number;
  elapsedMs: number;
  checksAllowed: number | null;
  checksUsed: number | null;
  hintsUsed: number | null;
  raceId: string | null;
  finishedAt: Date;
};

/**
 * One of a member's own finished puzzles of a kind, or null — for somebody
 * else's solve as for none at all, so an address cannot tell a stranger that
 * a solve exists. One read on the primary key.
 */
export async function ownSolveOf(memberId: string, kind: PuzzleKind, id: string): Promise<FinishedSolve | null> {
  const row = await prisma.puzzleSolve.findUnique({
    where: { id },
    select: {
      id: true, memberId: true, kind: true, size: true, level: true, givens: true, answer: true, solved: true, points: true,
      elapsedMs: true, checksAllowed: true, checksUsed: true, hintsUsed: true, raceId: true, finishedAt: true,
    },
  });
  if (row === null || row.memberId !== memberId || row.kind !== kind) return null;
  return {
    id: row.id, kind: row.kind, size: row.size, level: row.level, givens: row.givens, answer: row.answer, solved: row.solved, points: row.points,
    elapsedMs: row.elapsedMs, checksAllowed: row.checksAllowed, checksUsed: row.checksUsed, hintsUsed: row.hintsUsed, raceId: row.raceId, finishedAt: row.finishedAt,
  };
}
