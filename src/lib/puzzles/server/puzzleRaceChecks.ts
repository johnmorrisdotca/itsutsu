import "server-only";

import { makeGameId } from "@/lib/history/gameId";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/xp/awardXp";
import { XP_EVENTS } from "@/lib/xp/xp.constants";
import { puzzleAwards } from "@/lib/xp/xpPuzzle";
import { awardTourBonuses } from "@/lib/xp/xpTour";

import { preparePuzzleOnServer } from "../prepareOnServer";
import { checkSolution } from "../puzzleCheck";
import { PUZZLE_SPECS, levelsFor } from "../puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import type { KumimojiLanguage, KumimojiLength } from "../kumimoji/kumimoji.types";
import { type RaceOutcome, type RaceSeat, canFinish } from "../raceState";
import { raceFor, readRace, settleIfOver } from "./puzzleRaces";
import { keepSolve } from "./puzzleSolves";

/**
 * THE TWO MOMENTS OF A RACE THAT CHECK AN ANSWER: making one, and a seat
 * handing its answer in. Apart from the reads (`puzzleRaces.ts`) because a
 * check reads the word lists through `prepareOnServer.ts`, and only the API
 * routes that make and finish a race may carry those; a page never imports
 * this module.
 */

/** A free race id, in a game's shape. */
async function freeRaceId(tries = 5): Promise<string> {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const id = makeGameId();
    const taken = await prisma.puzzleRace.findUnique({ where: { id }, select: { id: true } });
    if (taken === null) return id;
  }
  throw new Error("Could not find a free race id.");
}

export async function createRace(input: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  seed: number;
  language?: KumimojiLanguage;
  gameLength?: KumimojiLength;
  doubleSet?: boolean;
  diagonals?: boolean;
  givens: string;
  solution: string;
  checksAllowed: number | null;
  hostMemberId: string;
  hostName: string;
}): Promise<{ id: string; guestToken: string } | { refused: string }> {
  const spec = PUZZLE_SPECS[input.kind];
  const language = input.kind === "kumimoji" ? input.language ?? "english" : "english";
  const gameLength = input.kind === "kumimoji" ? input.gameLength ?? "short" : "short";
  const doubleSet = input.kind === "kumimoji" && language === "english" && (input.doubleSet ?? false);
  const diagonals = input.kind === "kumimoji" && (input.diagonals ?? false);
  if (!spec.sizes.includes(input.size) || !levelsFor(input.kind, input.size).includes(input.level)) return { refused: "no such puzzle" };
  if (input.givens.length > spec.mostCells || input.solution.length > spec.mostCells) return { refused: "not a grid of that size" };
  await preparePuzzleOnServer(input.kind, input.size, language, input.seed);
  const verdict = checkSolution(input.kind, input.size, input.givens, input.solution, input.level, { gameLength, language, doubleSet, diagonals });
  if (!verdict.ok) return { refused: `the answer does not solve the puzzle: ${verdict.reason}` };
  const id = await freeRaceId();
  const row = await prisma.puzzleRace.create({
    data: { id, ...input, language, gameLength, doubleSet, diagonals },
    select: { id: true, guestToken: true },
  });
  return row;
}

export type FinishResult =
  | { ok: true; elapsedMs: number; points: number; awards: string[]; outcome: RaceOutcome }
  | { ok: false; reason: string; status: 404 | 409 | 422 };

/**
 * A seat hands its answer in. Checked against the kept answer's rules in
 * O(cells); a wrong grid is refused and the clock runs on. A right one is
 * stamped, kept as a solve at the server's elapsed, and paid — and if that
 * settles the race, the winner is paid `raceWon`.
 */
export async function finishSeat(
  id: string,
  seat: RaceSeat,
  memberId: string,
  answer: string,
  checksUsed: number,
  now = new Date(),
): Promise<FinishResult> {
  const race = await raceFor(id);
  if (race === null) return { ok: false, reason: "no such race", status: 404 };
  const kind = race.kind as PuzzleKind;
  const level = race.level as PuzzleLevel;
  const before = readRace(race, now);
  const mine = seat === "host" ? before.host : before.guest;
  if (!canFinish(mine)) return { ok: false, reason: mine.state === "finished" ? "already finished" : mine.state === "gaveUp" ? "the sitting is over" : "not started", status: 409 };
  if (answer.length > PUZZLE_SPECS[kind].mostCells) return { ok: false, reason: "not a grid of that size", status: 422 };
  const language = kind === "kumimoji" ? race.language as KumimojiLanguage : "english";
  await preparePuzzleOnServer(kind, race.size, language, race.seed);
  const verdict = checkSolution(kind, race.size, race.givens, answer, level, { gameLength: race.gameLength as KumimojiLength, language, doubleSet: race.doubleSet, diagonals: race.diagonals });
  if (!verdict.ok) return { ok: false, reason: verdict.reason, status: 422 };

  const stamped = await prisma.puzzleRace.updateMany({
    where: seat === "host" ? { id, hostFinishedAt: null, hostStartedAt: { not: null } } : { id, guestFinishedAt: null, guestStartedAt: { not: null } },
    data: seat === "host" ? { hostFinishedAt: now } : { guestFinishedAt: now },
  });
  if (stamped.count !== 1) return { ok: false, reason: "already finished", status: 409 };
  const startedAt = (seat === "host" ? race.hostStartedAt : race.guestStartedAt) ?? now;
  const elapsedMs = now.getTime() - startedAt.getTime();

  /* A race cannot pause, and its checks are bounded by the race's allowance whatever a browser says. */
  const spent = race.checksAllowed === null ? checksUsed : Math.min(checksUsed, race.checksAllowed);
  await keepSolve({ memberId, kind, size: race.size, level, givens: race.givens, elapsedMs, raceId: id, checksAllowed: race.checksAllowed, checksUsed: spent, pausedMs: 0, hintsUsed: 0, answer });
  const paid = await awardXp({ memberId, awards: puzzleAwards(kind, race.size, race.givens), now });
  await awardTourBonuses({ memberId, paid, variant: kind, now });

  const { outcome, wonPoints } = await settleIfOver(race, memberId, before.outcome, now);
  const awards = paid.awards.filter((award) => award.points > 0).map((award) => award.type as string);
  if (wonPoints > 0) awards.push(XP_EVENTS.raceWon);
  return { ok: true, elapsedMs, points: paid.points + wonPoints, awards, outcome };
}
