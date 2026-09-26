import "server-only";

import { prisma } from "@/lib/prisma";

import { guessesTaken } from "../gomoji/guessesTaken";
import type { PuzzleKind } from "../puzzles.types";
import { givensOfWord, hiddenWordOf } from "../dailyWords/dailyAddress";
import { dailyWordSeed, dayAfter, dayStart } from "../dailyWords/dailyDay";
import { backwardsDailySeed, backwardsGivensPrefix } from "../gomoji/backwardsSeed";
import type { DailyFastest, DailyStatus } from "../dailyWords/dailyWords.types";

/**
 * WHAT HAS BEEN PLAYED OF A DAY'S WORDS: the reader's own, for the buttons,
 * and everybody's fastest, for the day's page.
 *
 * A day's word is kept as every Gomoji is — a solve row when it ends, a run
 * while it is half done — so nothing new is written for it and these only
 * read. Two indexed queries for the buttons whatever the number of lengths,
 * and one per length for the day's page. Nothing polls: each is one page load.
 */

/**
 * The reader's standing with each length's word today: the solves they
 * finished today of this kind (on `[memberId, finishedAt]`), matched to the
 * words by what they hid, and the runs they left at today's seed.
 */
export async function dailyStatusesOf(
  memberId: string,
  kind: PuzzleKind,
  day: string,
  words: ReadonlyMap<number, string>,
): Promise<Map<number, DailyStatus>> {
  const [solves, runs] = await Promise.all([
    prisma.puzzleSolve.findMany({
      where: { memberId, kind, finishedAt: { gte: dayStart(day), lt: dayStart(dayAfter(day)) } },
      orderBy: { finishedAt: "asc" },
      select: { id: true, size: true, level: true, givens: true, answer: true, solved: true, elapsedMs: true },
    }),
    prisma.puzzleRun.findMany({ where: { memberId, kind, seed: dailyWordSeed(day) }, select: { size: true } }),
  ]);
  const statuses = new Map<number, DailyStatus>();
  for (const [size, word] of words) {
    const played = solves.filter((solve) => solve.size === size && hiddenWordOf(kind, size, solve.givens) === word);
    // Found beats missed: a word found on a second go is found.
    const found = played.find((solve) => solve.solved);
    const any = found ?? played[0];
    if (any !== undefined) {
      const guesses = guessesTaken(kind, size, any.level, any.givens, any.answer);
      statuses.set(size, any.solved ? { state: "found", elapsedMs: any.elapsedMs, guesses, solveId: any.id } : { state: "missed", guesses });
    } else if (runs.some((run) => run.size === size)) statuses.set(size, { state: "going" });
    else statuses.set(size, { state: "notYet" });
  }
  return statuses;
}

/**
 * The reader's standing with today's Sakasa at each length (`backwards.ts`):
 * the solves they finished today whose givens begin with the day's Sakasa's
 * seed (`backwardsGivensPrefix`), and the runs they left at that seed. Its
 * word differs by length and comes from no pool, so the seed in its givens is
 * what it is matched by. The same two indexed reads. Got through is "found",
 * caught is "missed", as a Sakasa's own ending says.
 */
export async function dailyBackwardsStatusesOf(memberId: string, kind: PuzzleKind, day: string, sizes: readonly number[]): Promise<Map<number, DailyStatus>> {
  const seed = backwardsDailySeed(day);
  const [solves, runs] = await Promise.all([
    prisma.puzzleSolve.findMany({
      where: { memberId, kind, givens: { startsWith: backwardsGivensPrefix(seed) }, finishedAt: { gte: dayStart(day), lt: dayStart(dayAfter(day)) } },
      orderBy: { finishedAt: "asc" },
      select: { id: true, size: true, level: true, givens: true, answer: true, solved: true, elapsedMs: true },
    }),
    prisma.puzzleRun.findMany({ where: { memberId, kind, seed }, select: { size: true } }),
  ]);
  const statuses = new Map<number, DailyStatus>();
  for (const size of sizes) {
    const played = solves.filter((solve) => solve.size === size);
    const any = played.find((solve) => solve.solved) ?? played[0];
    if (any !== undefined) {
      const guesses = guessesTaken(kind, size, any.level, any.givens, any.answer);
      statuses.set(size, any.solved ? { state: "found", elapsedMs: any.elapsedMs, guesses, solveId: any.id } : { state: "missed", guesses });
    } else if (runs.some((run) => run.size === size)) statuses.set(size, { state: "going" });
    else statuses.set(size, { state: "notYet" });
  }
  return statuses;
}

/** How many of the fastest a day's page shows at each length. */
export const DAILY_FASTEST_SHOWN = 10;

/**
 * The fastest finds of one word at one length, whenever they were played —
 * on its day or later from the archive — at any level, which each row says.
 * One query on the kind and size, narrowed to the word's givens.
 */
export async function fastestOfWord(kind: PuzzleKind, size: number, word: string): Promise<DailyFastest[]> {
  const givens = givensOfWord(kind, word);
  const rows = await prisma.puzzleSolve.findMany({
    where: {
      kind,
      size,
      solved: true,
      OR: [{ givens: givens.exactly }, ...(givens.before === undefined ? [] : [{ givens: { startsWith: givens.before } }])],
    },
    orderBy: [{ elapsedMs: "asc" }, { finishedAt: "asc" }],
    take: DAILY_FASTEST_SHOWN,
    select: { id: true, memberId: true, elapsedMs: true, level: true, givens: true, answer: true, hintsUsed: true },
  });
  return rows.map((row) => ({
    solveId: row.id,
    memberId: row.memberId,
    elapsedMs: row.elapsedMs,
    level: row.level,
    hintsUsed: row.hintsUsed,
    guesses: guessesTaken(kind, size, row.level, row.givens, row.answer),
  }));
}
