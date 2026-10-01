import "server-only";

import { recordInbox } from "@/lib/inbox/inbox";
import { INBOX_KINDS } from "@/lib/inbox/inbox.constants";
import { prisma } from "@/lib/prisma";
import { peopleBuddyIds } from "@/lib/social/buddies";
import { isIgnoring } from "@/lib/social/ignores";
import { awardXp } from "@/lib/xp/awardXp";
import { XP_EVENTS } from "@/lib/xp/xp.constants";

import type { PuzzleKind } from "../puzzles.types";
import { type RaceOutcome, type RaceSeat, type SeatState, canGiveUp, canStart, raceOutcome, seatState } from "../raceState";

/**
 * A race: two people, one puzzle, two clocks, kept in `PuzzleRace`.
 *
 * The host's browser made the puzzle and posts it whole; the server checks
 * the answer it was given against the givens once (O(cells)) and keeps
 * both, never sending the answer to a browser. Each seat's start and finish
 * are the server's stamps. A finish is checked in O(cells) against the kept
 * answer, kept as a solve, and paid; the race's winner is read off the
 * stamps by `raceState.ts` whenever anybody looks.
 *
 * READING A RACE IS HERE, with the writes that check no answer (sitting down,
 * starting, giving up, offering a seat); MAKING ONE AND FINISHING ONE ARE IN
 * `puzzleRaceChecks.ts`, because those two check an answer, and a check needs
 * every word list (`prepareOnServer.ts`). The race's page and a member's page
 * only read, and importing the checks with the reads put Kumimoji's two lists,
 * 1.3 MB, into the function every page shares (`pageFunction.coverage.test.ts`).
 */

export type RaceRow = Awaited<ReturnType<typeof raceFor>> & object;

export async function raceFor(id: string) {
  return prisma.puzzleRace.findUnique({ where: { id } });
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

/** Read the race again after a seat settled; if that ended it, pay the winner `raceWon` once (its subject is the race). For a seat that gave up here, and one that finished (`puzzleRaceChecks.ts`). */
export async function settleIfOver(race: RaceRow, memberId: string, fallback: RaceOutcome, now: Date): Promise<{ outcome: RaceOutcome; wonPoints: number }> {
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

export type OfferResult = "offered" | "none" | "notHost" | "taken" | "notBuddy";

/**
 * The host offers the guest seat to a member by name, from their own buddies:
 * written on the race, told in that member's inbox, and shown on their My
 * games; they may sit without the link. Only while the seat is empty, and a
 * second offer moves it to somebody else. A buddy who has chosen not to hear
 * from the host is offered it as anybody else is, and told nothing, as
 * everywhere an ignore applies.
 */
export async function offerRace(id: string, host: { id: string; name: string }, toMemberId: string): Promise<OfferResult> {
  const race = await raceFor(id);
  if (race === null) return "none";
  if (race.hostMemberId !== host.id) return "notHost";
  if (race.guestMemberId !== null) return "taken";
  if (toMemberId === host.id || !(await peopleBuddyIds(host.id)).has(toMemberId)) return "notBuddy";
  const offered = await prisma.puzzleRace.updateMany({ where: { id, guestMemberId: null }, data: { offeredToMemberId: toMemberId } });
  if (offered.count !== 1) return "taken";
  if (!(await isIgnoring(toMemberId, host.id))) {
    await recordInbox([{ memberId: toMemberId, kind: INBOX_KINDS.raceOffer, gameId: id, variant: race.kind, fromName: host.name, fromMemberId: host.id }]);
  }
  return "offered";
}

/** How long a race offered, or a seat not yet started, waits on My games: the inbox's thirty days. */
const RACE_WAITS_DAYS = 30;

/**
 * The races waiting on a member, newest first, for My games: offered to them
 * and not yet taken, or a seat of theirs not yet started while the other seat
 * is filled. A host's race nobody has sat down to is not waiting on the host.
 */
export async function racesWaitingOn(memberId: string, now = new Date()) {
  const since = new Date(now.getTime() - RACE_WAITS_DAYS * 24 * 60 * 60 * 1000);
  const rows = await prisma.puzzleRace.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { offeredToMemberId: memberId, guestMemberId: null },
        { guestMemberId: memberId, guestStartedAt: null },
        { hostMemberId: memberId, hostStartedAt: null, guestMemberId: { not: null } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, kind: true, size: true, level: true, seed: true, hostName: true, hostMemberId: true, guestName: true, guestMemberId: true, createdAt: true },
  });
  // Who each is against: the guest for the host, the host for anybody else.
  return rows.map((row) => ({
    ...row,
    against: row.hostMemberId === memberId ? { name: row.guestName, memberId: row.guestMemberId } : { name: row.hostName, memberId: row.hostMemberId },
  }));
}
