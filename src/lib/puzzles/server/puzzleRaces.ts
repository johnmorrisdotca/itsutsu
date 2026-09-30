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
import { type RaceOutcome, type RaceSeat, type SeatState, canFinish, canGiveUp, canStart, raceOutcome, seatState } from "../raceState";
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
  await preparePuzzleOnServer(input.kind, input.size, language);
  const verdict = checkSolution(input.kind, input.size, input.givens, input.solution, input.level, { gameLength, language, doubleSet, diagonals });
  if (!verdict.ok) return { refused: `the answer does not solve the puzzle: ${verdict.reason}` };
  const id = await freeRaceId();
  const row = await prisma.puzzleRace.create({
    data: { id, ...input, language, gameLength, doubleSet, diagonals },
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
  const host = seatState({ startedAt: race.hostStartedAt, finishedAt: race.hostFinishedAt, gaveUpAt: race.hostGaveUpAt }, now);
  const guest = race.guestMemberId === null ? { state: "waiting" as const } : seatState({ startedAt: race.guestStartedAt, finishedAt: race.guestFinishedAt, gaveUpAt: race.guestGaveUpAt }, now);
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
  const language = kind === "kumimoji" ? race.language as KumimojiLanguage : "english";
  await preparePuzzleOnServer(kind, race.size, language);
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

/** Read the race again after a seat settled; if that ended it, pay the winner `raceWon` once (its subject is the race). */
async function settleIfOver(race: RaceRow, memberId: string, fallback: RaceOutcome, now: Date): Promise<{ outcome: RaceOutcome; wonPoints: number }> {
  const after = await raceFor(race.id);
  const outcome = after === null ? fallback : readRace(after, now).outcome;
  if (!outcome.over || outcome.winner === null) return { outcome, wonPoints: 0 };
  const winnerId = outcome.winner === "host" ? race.hostMemberId : race.guestMemberId;
  if (winnerId === null) return { outcome, wonPoints: 0 };
  const won = await awardXp({ memberId: winnerId, awards: [{ type: XP_EVENTS.raceWon, subject: race.id }], now });
  return { outcome, wonPoints: winnerId === memberId ? won.points : 0 };
}

/**
 * A seat ends unsolved — a word puzzle whose guesses ran out. Stamped once,
 * only while the seat is solving, so the race settles now instead of at the
 * end of the sitting; if the other seat has already finished, it is paid its
 * win here. Nothing to check: giving up only ever costs the seat that does it.
 */
export async function giveUpSeat(id: string, seat: RaceSeat, memberId: string, now = new Date()): Promise<{ ok: true; outcome: RaceOutcome } | { ok: false; reason: string; status: 404 | 409 }> {
  const race = await raceFor(id);
  if (race === null) return { ok: false, reason: "no such race", status: 404 };
  const before = readRace(race, now);
  const mine = seat === "host" ? before.host : before.guest;
  if (!canGiveUp(mine)) return { ok: false, reason: mine.state === "finished" ? "already finished" : mine.state === "gaveUp" ? "already over" : "not started", status: 409 };
  const stamped = await prisma.puzzleRace.updateMany({
    where: seat === "host"
      ? { id, hostStartedAt: { not: null }, hostFinishedAt: null, hostGaveUpAt: null }
      : { id, guestStartedAt: { not: null }, guestFinishedAt: null, guestGaveUpAt: null },
    data: seat === "host" ? { hostGaveUpAt: now } : { guestGaveUpAt: now },
  });
  if (stamped.count !== 1) return { ok: false, reason: "already over", status: 409 };
  const { outcome } = await settleIfOver(race, memberId, before.outcome, now);
  return { ok: true, outcome };
}

/** The races a member is in, newest first, for their page of a puzzle. */
export async function racesOf(memberId: string, kind: PuzzleKind, take = 50) {
  return prisma.puzzleRace.findMany({
    where: { kind, OR: [{ hostMemberId: memberId }, { guestMemberId: memberId }] },
    orderBy: { createdAt: "desc" },
    take,
  });
}
