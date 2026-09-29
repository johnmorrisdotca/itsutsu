import "server-only";

import { prisma } from "@/lib/prisma";

import { ONLINE_SEAT_KINDS, ONLINE_STATUS } from "../online.constants";
import { mayEnd, seatOfMember } from "../onlineSeats";
import { seatToken } from "./tableCreate";
import { noticeTableOver } from "./tableNotices";
import { readTableRow, tableOf } from "./tableRead";
import { type SeatingRefusal, seatingRefusal, tablesCapRefusal } from "./tableSeating";

/**
 * TAKING, LEAVING AND ENDING: every change to who sits at a table that is not
 * a move. Each writes the table's version up with it, so every other page at
 * the table sees it at its next poll.
 */

/** What opening a seat's link came to. */
export type SeatClaim = "seated" | "already" | "none" | "taken" | "over" | { refused: SeatingRefusal };

/**
 * A SEAT TAKEN BY ITS LINK, by a signed-in member. The link must be this
 * table's; somebody already at the table is just sent to it; the table must
 * still be played; and the newcomer must be under the cap and free to sit with
 * everybody there (`seatingRefusal`). Written only while the seat still holds
 * that link, so two people opening it at once seat one.
 */
export async function claimSeat(id: string, token: string, member: { id: string; name: string }): Promise<SeatClaim> {
  const seat = await prisma.partySeat.findUnique({ where: { token }, select: { tableId: true, seat: true } });
  if (seat === null || seat.tableId !== id) return "none";
  const row = await readTableRow(id);
  if (row === null) return "none";
  const table = tableOf(row);
  if (seatOfMember(table.seats, member.id) !== null) return "already";
  if (table.status !== ONLINE_STATUS.playing) return "over";
  const others = row.seats.flatMap((one) => (one.kind === ONLINE_SEAT_KINDS.member && one.memberId !== null ? [one.memberId] : []));
  const refused = (await tablesCapRefusal(member.id, "you")) !== null ? "cap" : await seatingRefusal(member.id, others);
  if (refused !== null) return { refused };
  const taken = await prisma.$transaction(async (tx) => {
    const sat = await tx.partySeat.updateMany({
      where: { tableId: id, seat: seat.seat, token, kind: ONLINE_SEAT_KINDS.open },
      data: { kind: ONLINE_SEAT_KINDS.member, memberId: member.id, name: member.name, token: null, joinedAt: new Date() },
    });
    if (sat.count === 0) return false;
    await tx.partyTable.update({ where: { id }, data: { version: { increment: 1 } } });
    return true;
  });
  return taken ? "seated" : "taken";
}

/**
 * LEAVING A TABLE: the reader's seat opens again with a fresh link, and the
 * table waits on it when its turn comes. The last member to leave ends it.
 */
export async function leaveTable(id: string, readerId: string): Promise<"left" | "none" | "over"> {
  const row = await readTableRow(id);
  if (row === null) return "none";
  const table = tableOf(row);
  const mine = seatOfMember(table.seats, readerId);
  if (mine === null) return "none";
  if (table.status !== ONLINE_STATUS.playing) return "over";
  const othersLeft = row.seats.some((one) => one.seat !== mine && one.kind === ONLINE_SEAT_KINDS.member);
  const now = new Date();
  await prisma.$transaction([
    prisma.partySeat.update({
      where: { tableId_seat: { tableId: id, seat: mine } },
      data: { kind: ONLINE_SEAT_KINDS.open, memberId: null, name: "", token: seatToken(), joinedAt: null },
    }),
    prisma.partyTable.update({
      where: { id },
      data: othersLeft
        ? { version: { increment: 1 } }
        : { version: { increment: 1 }, status: ONLINE_STATUS.ended, toPlay: null, endedByMemberId: readerId, finishedAt: now },
    }),
  ]);
  return "left";
}

/**
 * ENDING A TABLE for everybody, with nobody winning: before its first move, or
 * once the turn has waited a week on somebody else (`mayEnd`). Written only
 * while the table is still at the version read, so a move landing at the same
 * moment wins and the end is refused.
 */
export async function endTable(id: string, readerId: string, now: Date = new Date()): Promise<"ended" | "none" | "refused"> {
  const row = await readTableRow(id);
  if (row === null) return "none";
  const table = tableOf(row);
  const mine = seatOfMember(table.seats, readerId);
  if (mine === null) return "none";
  if (!mayEnd(table, mine, now)) return "refused";
  const written = await prisma.partyTable.updateMany({
    where: { id, version: row.version, status: ONLINE_STATUS.playing },
    data: { version: { increment: 1 }, status: ONLINE_STATUS.ended, toPlay: null, endedByMemberId: readerId, finishedAt: now },
  });
  if (written.count === 0) return "refused";
  await noticeTableOver(row, [], true);
  return "ended";
}
