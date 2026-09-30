import "server-only";

import { prisma } from "@/lib/prisma";

import { COMPUTER_SEAT_NAME } from "../../online/online.constants";
import { KEPT_SEAT_KINDS, KEPT_STATUS, isKeptStatus } from "../kept.constants";
import type { KeptReport } from "../kept.types";
import { holderSeat, keptStatusOf } from "../keptReport";

/*
 * A GAME PLAYED ON ONE DEVICE, FILED WITH THE SITE.
 *
 * John, 2026-09-30: "any games that I play that are card games or things like
 * that they don't seem to show up in my history with the other games like
 * Othello", then "Should contain all games ever… Even those that aren't
 * completed or just passed around", "we should be allowed to view, resume",
 * and "Sometimes the games are played off-line". A game on one device used to
 * be kept in that browser and nowhere else.
 *
 * It is filed on the `PartyTable` rows a table on several devices uses — the
 * game written out whole in its own encoding, the seats, the winners — under
 * statuses of its own (`KEPT_STATUS`), so no reader of a table on several
 * devices (the poll, a move, a seat link, the twenty-tables cap) ever takes one
 * for its own. The game written out whole is also what opens it again, here or
 * on another device (`/games/<slug>/kept/<id>`).
 *
 * ONE WRITE, AN UPSERT BY THE BROWSER'S OWN ID, because the browser may be
 * offline: it names the game when it starts and sends what it has whenever it
 * can, perhaps twice. So a report for an id nobody has makes the row, one for
 * a row still going brings it up to date, and one for a row already finished
 * or put away changes nothing and is answered as kept — a record that is final
 * stays final, and the browser that sent it again can stop sending.
 */

/** What a report comes to: kept (made, brought up to date, or already final), or an id somebody else's record has. */
export type KeptWrite = "kept" | "taken";

/** The fields a report writes, whether the row is new or is being brought up to date. */
function standingOf(report: KeptReport, now: Date) {
  const status = keptStatusOf(report);
  return {
    state: report.state,
    status,
    toPlay: null,
    winners: [...report.winners],
    movedAt: now,
    finishedAt: status === KEPT_STATUS.playing ? null : now,
  };
}

async function fileNew(member: { id: string; name: string }, id: string, report: KeptReport, now: Date): Promise<void> {
  const holder = holderSeat(report.seats);
  await prisma.partyTable.create({
    data: {
      id,
      game: report.game,
      ...standingOf(report, now),
      hostMemberId: member.id,
      seats: {
        create: report.seats.map((seat, at) => {
          if (at === holder) return { seat: at, kind: KEPT_SEAT_KINDS.member, memberId: member.id, name: member.name, joinedAt: now };
          if (seat.computer) return { seat: at, kind: KEPT_SEAT_KINDS.computer, name: seat.name === "" ? COMPUTER_SEAT_NAME : seat.name };
          return { seat: at, kind: KEPT_SEAT_KINDS.guest, name: seat.name };
        }),
      },
    },
  });
}

/** A game on this member's device, filed or brought up to date under the id its browser gave it. */
export async function keepKeptGame(member: { id: string; name: string }, id: string, report: KeptReport, now: Date = new Date()): Promise<KeptWrite> {
  const row = await prisma.partyTable.findUnique({ where: { id }, select: { game: true, status: true, hostMemberId: true } });
  if (row === null) {
    try {
      await fileNew(member, id, report, now);
      return "kept";
    } catch (error) {
      // Two sends of one new game crossing: the other made the row, and this one brings it up to date below.
      const again = await prisma.partyTable.findUnique({ where: { id }, select: { game: true, status: true, hostMemberId: true } });
      if (again === null) throw error;
      return keepExisting(member.id, id, again, report, now);
    }
  }
  return keepExisting(member.id, id, row, report, now);
}

async function keepExisting(
  memberId: string,
  id: string,
  row: { game: string; status: string; hostMemberId: string | null },
  report: KeptReport,
  now: Date,
): Promise<KeptWrite> {
  if (row.hostMemberId !== memberId || !isKeptStatus(row.status) || row.game !== report.game) return "taken";
  // Final: nothing to write, and nothing for the browser to send again.
  if (row.status !== KEPT_STATUS.playing) return "kept";
  await prisma.partyTable.updateMany({
    where: { id, hostMemberId: memberId, status: KEPT_STATUS.playing },
    data: { ...standingOf(report, now), version: { increment: 1 } },
  });
  return "kept";
}

/**
 * A game filed from one device, with its seats, for the page that opens it —
 * or null when there is no such record, or it is not this member's. Only the
 * member who played it may open it here.
 */
export async function keptGameOf(id: string, memberId: string) {
  const row = await prisma.partyTable.findUnique({ where: { id }, include: { seats: { orderBy: { seat: "asc" } } } });
  if (row === null || !isKeptStatus(row.status) || row.hostMemberId !== memberId) return null;
  return row;
}
