import "server-only";

import { makeGameId } from "@/lib/history/gameId";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/xp/awardXp";
import { XP_EVENTS } from "@/lib/xp/xp.constants";
import { puzzleAwards } from "@/lib/xp/xpPuzzle";
import { awardTourBonuses } from "@/lib/xp/xpTour";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { type RaceOutcome, type RaceSeat, type SeatState, canFinish, canStart, raceOutcome, seatState } from "../raceState";
import { keepSolve } from "./puzzleSolves";

/**
 * A race: two people, one puzzle, two clocks, kept in `PuzzleRace`.
 *
 * The host's browser made the puzzle and posts it whole; the server checks
 * the answer it was given against the givens once (O(cells)) and keeps
 * both, never sending the answer to a browser. Each seat's start and finish
 * are the server's stamps. A finish is checked in O(cells) against the kept
 * answer, kept as a solve, and paid; the race's winner is read off the
 * stamps by `raceState.ts` whenever anybody looks.
 */

export type RaceRow = Awaited<ReturnType<typeof raceFor>> & object;

export async function raceFor(id: string) {
  return prisma.puzzleRace.findUnique({ where: { id } });
}

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
  givens: string;
  solution: string;
  checksAllowed: number | null;
  hostMemberId: string;
  hostName: string;
}): Promise<{ id: string; guestToken: string } | { refused: string }> {
  const spec = PUZZLE_SPECS[input.kind];
  if (!spec.sizes.includes(input.size) || !spec.levels.includes(input.level)) return { refused: "no such puzzle" };
  if (input.givens.length > spec.mostCells || input.solution.length > spec.mostCells) return { refused: "not a grid of that size" };
  const verdict = checkSolution(input.kind, input.size, input.givens, input.solution);
  if (!verdict.ok) return { refused: `the answer does not solve the puzzle: ${verdict.reason}` };
  const id = await freeRaceId();
  const row = await prisma.puzzleRace.create({
    data: { id, ...input },
    select: { id: true, guestToken: true },
  });
  return row;
}

/** Which seat a member holds in a race, or null for a member in neither. */
export function seatOf(race: { hostMemberId: string; guestMemberId: string | null }, memberId: string | null): RaceSeat | null {
  if (memberId === null) return null;
  if (race.hostMemberId === memberId) return "host";
  if (race.guestMemberId === memberId) return "guest";
  return null;
}

/** The guest sits down by the seat's link: once, and never the host. */
export async function claimGuestSeat(id: string, token: string, memberId: string, name: string): Promise<"sat" | "taken" | "own" | "none"> {
  const race = await raceFor(id);
  if (race === null || race.guestToken !== token) return "none";
  if (race.hostMemberId === memberId) return "own";
  if (race.guestMemberId !== null) return race.guestMemberId === memberId ? "sat" : "taken";
  const claimed = await prisma.puzzleRace.updateMany({
    where: { id, guestMemberId: null },
    data: { guestMemberId: memberId, guestName: name },
  });
  return claimed.count === 1 ? "sat" : "taken";
}

export type RaceRead = {
  host: SeatState;
  guest: SeatState;
  outcome: RaceOutcome;
};

export function readRace(race: NonNullable<Awaited<ReturnType<typeof raceFor>>>, now = new Date()): RaceRead {
  const host = seatState({ startedAt: race.hostStartedAt, finishedAt: race.hostFinishedAt }, now);
  const guest = race.guestMemberId === null ? { state: "waiting" as const } : seatState({ startedAt: race.guestStartedAt, finishedAt: race.guestFinishedAt }, now);
  return { host, guest, outcome: raceOutcome(host, guest) };
}

/** Start a seat's clock: the server's now, written once — a second Start changes nothing. */
export async function startSeat(id: string, seat: RaceSeat, now = new Date()): Promise<"started" | "already" | "none"> {
  const race = await raceFor(id);
  if (race === null) return "none";
  const state = seat === "host" ? readRace(race, now).host : readRace(race, now).guest;
  if (!canStart(state)) return "already";
  const started = await prisma.puzzleRace.updateMany({
    where: seat === "host" ? { id, hostStartedAt: null } : { id, guestStartedAt: null, guestMemberId: { not: null } },
    data: seat === "host" ? { hostStartedAt: now } : { guestStartedAt: now },
  });
  return started.count === 1 ? "started" : "already";
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
  const verdict = checkSolution(kind, race.size, race.givens, answer);
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
  await keepSolve({ memberId, kind, size: race.size, level, givens: race.givens, elapsedMs, raceId: id, checksAllowed: race.checksAllowed, checksUsed: spent, pausedMs: 0, hintsUsed: 0 });
  const paid = await awardXp({ memberId, awards: puzzleAwards(kind, race.size, race.givens), now });
  await awardTourBonuses({ memberId, paid, variant: kind, now });

  const after = await raceFor(id);
  const outcome = after === null ? before.outcome : readRace(after, now).outcome;
  const awards = paid.awards.filter((award) => award.points > 0).map((award) => award.type as string);
  let points = paid.points;
  if (outcome.over && outcome.winner !== null) {
    const winnerId = outcome.winner === "host" ? race.hostMemberId : race.guestMemberId;
    if (winnerId !== null) {
      const won = await awardXp({ memberId: winnerId, awards: [{ type: XP_EVENTS.raceWon, subject: id }], now });
      if (winnerId === memberId && won.points > 0) {
        points += won.points;
        awards.push(XP_EVENTS.raceWon);
      }
    }
  }
  return { ok: true, elapsedMs, points, awards, outcome };
}

/** The races a member is in, newest first, for their page of a puzzle. */
export async function racesOf(memberId: string, kind: PuzzleKind, take = 50) {
  return prisma.puzzleRace.findMany({
    where: { kind, OR: [{ hostMemberId: memberId }, { guestMemberId: memberId }] },
    orderBy: { createdAt: "desc" },
    take,
  });
}
