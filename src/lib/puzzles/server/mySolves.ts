import "server-only";

import { solveHelpOf, type SolveHelp } from "../solveHelp";
import { prisma } from "@/lib/prisma";

import { guessesTaken, type GuessesTaken } from "../gomoji/guessesTaken";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";

/**
 * THE PUZZLES A MEMBER HAS SOLVED, newest first, a page at a time, on
 * My games' Completed tab. John, 2026-09-25: "where will the
 * completed puzzles go… where are the scores?!" Each row carries what the
 * solve was worth on the leaderboard (`points`), its time, and the help it
 * took, since a time with three Checks is not the same time as one with none.
 *
 * Listed in the Completed tab's one list beside every other kind of game, paged
 * with them by the time each ended, over the `[memberId, finishedAt]` index.
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
  /** How it was helped (`solveHelp.ts`), or null for none. */
  helped: SolveHelp | null;
  /** The countdown it was played on, "none" for none. */
  clock: string;
};

/** A page of solves: the rows, and whether any older one is left. */
export type MySolvesBefore = { solves: MySolve[]; more: boolean };

/**
 * The member's solves finished strictly before `before` (or the newest),
 * `limit` of them: the puzzles' share of the Completed tab, whose one list pages
 * every kind of game by the time it ended (`completed.ts`).
 */
export async function mySolvesBefore(memberId: string, before: Date | null, limit: number = MY_SOLVES_PAGE): Promise<MySolvesBefore> {
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, ...(before === null ? {} : { finishedAt: { lt: before } }) },
    orderBy: [{ finishedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: { id: true, kind: true, size: true, level: true, elapsedMs: true, finishedAt: true, points: true, checksUsed: true, hintsUsed: true, raceId: true, solved: true, givens: true, answer: true, helped: true, clock: true },
  });
  const solves = rows
    .slice(0, limit)
    .map(({ givens, answer, helped, ...row }) => ({ ...row, helped: solveHelpOf(helped), guesses: guessesTaken(row.kind as PuzzleKind, row.size, row.level, givens, answer) })) as MySolve[];
  return { solves, more: rows.length > limit };
}

/** How many puzzles a member has finished: the Completed tab's share of its count, read on the tabs that do not list them. */
export async function mySolvesCount(memberId: string): Promise<number> {
  return prisma.puzzleSolve.count({ where: { memberId } });
}
