import "server-only";

import { Prisma } from "@prisma/client";

import { monthBounds } from "@/lib/history/recordMonth";
import { prisma } from "@/lib/prisma";

import { guessesTaken, type GuessesTaken } from "../gomoji/guessesTaken";
import { PUZZLE_RECORD_SORTS, type PuzzleRecordAsked } from "../puzzleRecordAddress";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import type { FinishedSolve } from "./puzzleSolves";

/**
 * A PUZZLE'S RECORD: every solve of it kept here, by everybody, newest first or
 * fastest first, narrowed by who, what size and level, and which month. John,
 * 2026-09-26, on a puzzle's standings: "No way to view played games.. clicking
 * a name takes us to profile and no links to the Game Played History viewer."
 * This is that viewer for a puzzle, and what every time and every points
 * figure on a puzzle's boards leads into.
 *
 * One read for the page, one count, and — when a member is named — one more
 * for which of their solves the points board counted. Nothing per row.
 */

export const PUZZLE_RECORD_PAGE = 50;

export type RecordSolve = {
  id: string;
  memberId: string;
  size: number;
  level: PuzzleLevel;
  elapsedMs: number;
  points: number;
  solved: boolean;
  finishedAt: Date;
  raceId: string | null;
  checksUsed: number | null;
  hintsUsed: number | null;
  guesses: GuessesTaken | null;
};

/** A member's points on the board, and exactly which of their solves made them. */
export type RecordTally = { points: number; puzzles: number; counted: ReadonlySet<string> };

export type PuzzleRecord = {
  solves: RecordSolve[];
  total: number;
  /** Present when the record is one member's: the board's figure for them, and the rows it came from. */
  tally: RecordTally | null;
};

function whereOf(kind: PuzzleKind, asked: PuzzleRecordAsked): Prisma.PuzzleSolveWhereInput {
  const month = asked.month === null ? null : monthBounds(asked.month);
  return {
    kind,
    ...(asked.member !== null ? { memberId: asked.member } : {}),
    ...(asked.size !== null ? { size: asked.size } : {}),
    ...(asked.level !== null ? { level: asked.level } : {}),
    ...(month !== null ? { finishedAt: { gte: month.start, lt: month.end } } : {}),
    // Fastest first is the fastest board's order, and a word not found has no time to rank.
    ...(asked.sort === PUZZLE_RECORD_SORTS.fastest ? { solved: true } : {}),
  };
}

/** One page of a puzzle's record. */
export async function puzzleRecordOf(kind: PuzzleKind, asked: PuzzleRecordAsked): Promise<PuzzleRecord> {
  const where = whereOf(kind, asked);
  const orderBy: Prisma.PuzzleSolveOrderByWithRelationInput[] =
    asked.sort === PUZZLE_RECORD_SORTS.fastest
      ? [{ elapsedMs: "asc" }, { finishedAt: "asc" }, { id: "asc" }]
      : [{ finishedAt: "desc" }, { id: "desc" }];
  const [rows, total, tally] = await Promise.all([
    prisma.puzzleSolve.findMany({
      where,
      orderBy,
      skip: (asked.page - 1) * PUZZLE_RECORD_PAGE,
      take: PUZZLE_RECORD_PAGE,
      select: {
        id: true, memberId: true, size: true, level: true, elapsedMs: true, points: true, solved: true, finishedAt: true,
        raceId: true, checksUsed: true, hintsUsed: true, givens: true, answer: true,
      },
    }),
    prisma.puzzleSolve.count({ where }),
    asked.member === null ? null : tallyOf(kind, asked.member, asked.month),
  ]);
  const solves = rows.map(({ givens, answer, ...row }) => ({
    ...row,
    level: row.level as PuzzleLevel,
    guesses: guessesTaken(kind, row.size, row.level, givens, answer),
  }));
  return { solves, total, tally };
}

/**
 * A MEMBER'S POINTS AT A PUZZLE, THE WAY ITS BOARD COUNTS THEM, AND THE ROWS
 * THAT MADE THEM: each grid once, at their best solve of it (`pointsBoardOf`),
 * the earliest of equal bests. So the figure a board links from is the figure
 * the record prints, and the reader can see which rows it is the sum of.
 */
export async function tallyOf(kind: PuzzleKind, memberId: string, month: string | null): Promise<RecordTally> {
  const bounds = month === null ? null : monthBounds(month);
  const when = bounds === null ? Prisma.empty : Prisma.sql` AND "finishedAt" >= ${bounds.start} AND "finishedAt" < ${bounds.end}`;
  const rows = await prisma.$queryRaw<{ id: string; points: number }[]>`
    SELECT DISTINCT ON ("givens") "id", "points"
    FROM "PuzzleSolve"
    WHERE "kind" = ${kind} AND "memberId" = ${memberId}${when}
    ORDER BY "givens", "points" DESC, "finishedAt" ASC, "id" ASC
  `;
  return {
    points: rows.reduce((sum, row) => sum + Number(row.points), 0),
    puzzles: rows.length,
    counted: new Set(rows.map((row) => row.id)),
  };
}

/** One finished puzzle of a kind, ANYBODY'S, with who solved it — or null for an address that names none. */
export async function anySolveOf(kind: PuzzleKind, id: string): Promise<(FinishedSolve & { memberId: string }) | null> {
  const row = await prisma.puzzleSolve.findUnique({
    where: { id },
    select: {
      id: true, memberId: true, kind: true, size: true, level: true, givens: true, answer: true, steps: true, solved: true, points: true,
      elapsedMs: true, checksAllowed: true, checksUsed: true, hintsUsed: true, raceId: true, finishedAt: true,
    },
  });
  return row === null || row.kind !== kind ? null : row;
}

/** Whether a member has finished this very grid themselves: one count on the (kind, memberId, givens) index. */
export async function finishedSameGrid(memberId: string | null, kind: PuzzleKind, givens: string): Promise<boolean> {
  if (memberId === null) return false;
  return (await prisma.puzzleSolve.count({ where: { kind, memberId, givens } })) > 0;
}

/** How many solves a member has of each puzzle, for their page: one grouped read. */
export async function solveCountsOf(memberId: string): Promise<{ kind: PuzzleKind; solves: number }[]> {
  const rows = await prisma.puzzleSolve.groupBy({ by: ["kind"], where: { memberId }, _count: { _all: true } });
  return rows
    .map((row) => ({ kind: row.kind as PuzzleKind, solves: row._count._all }))
    .sort((a, b) => b.solves - a.solves || a.kind.localeCompare(b.kind));
}
