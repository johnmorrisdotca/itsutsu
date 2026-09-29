import "server-only";

import type { PartySeat, PartyTable } from "@prisma/client";

import { PRESENT_WITHIN_MS } from "@/components/live/live.constants";
import { prisma } from "@/lib/prisma";
import { shownName } from "@/lib/rating/shownName";
import { AGE_BANDS } from "@/lib/social/ageBand.constants";

import { PARTY_TURN_WAIT_MS } from "../online.constants";
import type { OnlineGameKey, OnlineSeatKind, OnlineStatus, OnlineTableView } from "../online.types";
import { tableSeatPath } from "../onlinePaths";
import { mayEnd, seatOfMember } from "../onlineSeats";

/**
 * READING A TABLE: the poll's one small read, and the whole table for a page
 * or an answer. See docs/plans/party-online/README.md, "Cadence and cost".
 */

/** What the poll's one read brings back. */
type VersionRow = { version: number; here: boolean; stale: boolean; seated: boolean };

/**
 * WHICH VERSION OF A TABLE A PAGE HOLDS, as an HTTP entity tag, for this
 * reader — or null when there is no such table, or the reader does not sit at
 * it (a table is its members' only, and a stranger is told nothing).
 *
 * ONE QUERY over three primary keys: the table's version, whether the member
 * whose turn it is has been on the site in the last two minutes (the fast
 * cadence), whether the turn has waited past `PARTY_TURN_WAIT_MS` (when the
 * others may end it), and whether the reader has a seat. A computer's seat,
 * an open seat and a member under 13 are never "here": a program's moves come
 * from a browser at the table, an open seat has nobody, and a child's presence
 * is never shown (`childRules.ts`). The two yes-or-noes are part of the tag,
 * so an arrival, a departure or a turn going stale is a full answer, and while
 * none happens the answer is a 304.
 */
export async function tableVersion(id: string, readerId: string, now: Date = new Date()): Promise<{ tag: string; here: boolean } | null> {
  const since = new Date(now.getTime() - PRESENT_WITHIN_MS);
  const staleBefore = new Date(now.getTime() - PARTY_TURN_WAIT_MS);
  const rows = await prisma.$queryRaw<VersionRow[]>`
    SELECT t.version,
      (t.status = 'playing' AND s.kind = 'member' AND m."botTier" IS NULL
        AND m."ageBand" IS DISTINCT FROM ${AGE_BANDS.under13} AND m."lastSeenAt" >= ${since}) IS TRUE AS here,
      (t."movedAt" <= ${staleBefore}) AS stale,
      EXISTS (SELECT 1 FROM "PartySeat" r WHERE r."tableId" = t.id AND r."memberId" = ${readerId}) AS seated
    FROM "PartyTable" t
    LEFT JOIN "PartySeat" s ON s."tableId" = t.id AND s.seat = t."toPlay"
    LEFT JOIN "Member" m ON m.id = s."memberId"
    WHERE t.id = ${id}
  `;
  const row = rows[0];
  if (row === undefined || !row.seated) return null;
  return { tag: tableTag(row.version, row.here, row.stale), here: row.here };
}

/** The tag itself, quoted as HTTP wants an entity tag to be. */
export function tableTag(version: number, here: boolean, stale: boolean): string {
  return `"p${version}-${here ? "h" : "n"}${stale ? "s" : ""}"`;
}

/** A table row with its seats, as the database hands it back. */
export type TableRow = PartyTable & { seats: PartySeat[] };

/** The table and its seats, in seat order, and the member whose browser sent its last move: two reads. */
export async function readTableRow(id: string): Promise<(TableRow & { lastMoverId: string | null }) | null> {
  const [row, last] = await Promise.all([
    prisma.partyTable.findUnique({ where: { id }, include: { seats: { orderBy: { seat: "asc" } } } }),
    prisma.partyAction.findFirst({ where: { tableId: id }, orderBy: { index: "desc" }, select: { byMemberId: true } }),
  ]);
  return row === null ? null : { ...row, lastMoverId: last?.byMemberId ?? null };
}

/** A table row as the questions in `onlineSeats.ts` read it. */
export function tableOf(row: TableRow) {
  return {
    status: row.status as OnlineStatus,
    toPlay: row.toPlay,
    moveCount: row.moveCount,
    movedAt: row.movedAt,
    seats: row.seats.map((one) => ({ seat: one.seat, kind: one.kind as OnlineSeatKind, memberId: one.memberId })),
  };
}

/**
 * THE TABLE AS THIS READER IS SHOWN IT, or null when they do not sit at it.
 * An open seat's link is shown to everybody at the table: any of them may
 * hand it to somebody.
 */
export function viewOf(row: TableRow & { lastMoverId: string | null }, readerId: string, here: boolean, now: Date): OnlineTableView | null {
  const table = tableOf(row);
  const mySeat = seatOfMember(table.seats, readerId);
  if (mySeat === null) return null;
  return {
    id: row.id,
    game: row.game as OnlineGameKey,
    size: row.size,
    state: row.state,
    version: row.version,
    status: table.status,
    toPlay: row.toPlay,
    winners: row.winners,
    moveCount: row.moveCount,
    seats: row.seats.map((one) => ({
      seat: one.seat,
      kind: one.kind as OnlineSeatKind,
      memberId: one.memberId,
      // The name this site prints for somebody (`shownName`): the whole name never leaves the server.
      name: shownName(one.name),
      yours: one.seat === mySeat,
      link: one.token === null ? null : tableSeatPath(row.game, row.id, one.token),
    })),
    mySeat,
    toPlayHere: here,
    canEnd: mayEnd(table, mySeat, now),
    lastMoverId: row.lastMoverId,
    movedAt: row.movedAt.toISOString(),
    endedBy: endedByName(row),
  };
}

/** Who ended an ended table, as the site prints them, while they still sit at it. */
function endedByName(row: TableRow): string | null {
  const seat = row.endedByMemberId === null ? undefined : row.seats.find((one) => one.memberId === row.endedByMemberId);
  return seat === undefined ? null : shownName(seat.name);
}

/** The whole table for this reader, with who is here: the page's read, and the poll's when the tag has moved. */
export async function readTableView(id: string, readerId: string, now: Date = new Date()): Promise<OnlineTableView | null> {
  const [version, row] = await Promise.all([tableVersion(id, readerId, now), readTableRow(id)]);
  if (version === null || row === null) return null;
  return viewOf(row, readerId, version.here, now);
}
