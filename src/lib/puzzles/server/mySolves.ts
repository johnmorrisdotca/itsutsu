import "server-only";

import { prisma } from "@/lib/prisma";

import { guessesTaken, type GuessesTaken } from "../gomoji/guessesTaken";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";

/**
 * THE PUZZLES A MEMBER HAS SOLVED, newest first, a page at a time: the
 * Completed half of My games' Puzzles tab. John, 2026-09-25: "where will the
 * completed puzzles go… where are the scores?!" Each row carries what the
 * solve was worth on the leaderboard (`points`), its time, and the help it
 * took, since a time with three Checks is not the same time as one with none.
 *
 * Paged like the Completed games tab: twenty at a time, the next page named by
 * the last row's id (a cursor is a position in the list, not a page number),
 * over the `[memberId, finishedAt]` index. One read for the page and one count.
 */
export const MY_SOLVES_PAGE = 20;

export type MySolve = {
  id: string;
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  elapsedMs: number;
  finishedAt: Date;
  points: number;
  /** Null where it was not recorded: a solve kept before the allowance existed. */
  checksUsed: number | null;
  hintsUsed: number | null;
  raceId: string | null;
  /** False for a word whose guesses ran out: kept, scored for what it found, and shown as not found. */
  solved: boolean;
  /** A word's guesses beside its time, 3 of 6 (`guessesTaken`); null for every other puzzle. */
  guesses: GuessesTaken | null;
};

export type MySolvesPage = { solves: MySolve[]; total: number; next: string | null };

export async function mySolvesPage(memberId: string, cursor: string | null): Promise<MySolvesPage> {
  const [rows, total] = await Promise.all([
    prisma.puzzleSolve.findMany({
      where: { memberId },
      orderBy: [{ finishedAt: "desc" }, { id: "desc" }],
      take: MY_SOLVES_PAGE + 1,
      ...(cursor === null ? {} : { cursor: { id: cursor }, skip: 1 }),
      select: { id: true, kind: true, size: true, level: true, elapsedMs: true, finishedAt: true, points: true, checksUsed: true, hintsUsed: true, raceId: true, solved: true, givens: true, answer: true },
    }),
    prisma.puzzleSolve.count({ where: { memberId } }),
  ]);
  const page = rows
    .slice(0, MY_SOLVES_PAGE)
    .map(({ givens, answer, ...row }) => ({ ...row, guesses: guessesTaken(row.kind as PuzzleKind, row.size, row.level, givens, answer) })) as MySolve[];
  return { solves: page, total, next: rows.length > MY_SOLVES_PAGE ? page.at(-1)!.id : null };
}
