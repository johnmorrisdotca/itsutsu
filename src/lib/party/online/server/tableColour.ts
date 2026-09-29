import "server-only";

import { PARTY_MARBLES } from "@/components/party/party.constants";
import { isPieceColour, type PieceColour } from "@/lib/pieces/pieceColours";
import { tableColourRefusal, tableMarbles, type TableColourRefusal } from "@/lib/pieces/tableColours";
import { prisma } from "@/lib/prisma";

import { ONLINE_STATUS } from "../online.constants";
import { seatOfMember } from "../onlineSeats";
import { readTableRow, tableOf } from "./tableRead";

export type TableColourOutcome = "set" | "none" | "over" | { refused: TableColourRefusal };

/**
 * A member at a table played on several devices chooses the colour of their
 * own marbles — only their own, as at every table here — and every device at
 * the table sees it at its next poll: the write moves the table's version,
 * which is the poll's tag.
 *
 * Judged against every other place as it is seen (`tableColourRefusal`): a
 * colour another place has, one too like another's marbles, or one whose
 * letter another marble carries is refused with the next free one. The write
 * holds only if the table's version is still the one read, so two players
 * choosing at the same moment cannot both end in one colour; the second reads
 * again and is judged against the first.
 */
export async function setTableColour(id: string, readerId: string, colour: PieceColour | null): Promise<TableColourOutcome> {
  const row = await readTableRow(id);
  if (row === null) return "none";
  const table = tableOf(row);
  const mine = seatOfMember(table.seats, readerId);
  if (mine === null) return "none";
  if (table.status !== ONLINE_STATUS.playing) return "over";
  const colours = row.seats.map((one) => (isPieceColour(one.colour) ? one.colour : null));
  const refusal = tableColourRefusal(mine, colour, tableMarbles(PARTY_MARBLES, colours), row.seats.length);
  if (refusal !== null) return { refused: refusal };
  const written = await prisma.$transaction(async (tx) => {
    const moved = await tx.partyTable.updateMany({ where: { id, version: row.version }, data: { version: { increment: 1 } } });
    if (moved.count === 0) return false;
    await tx.partySeat.update({ where: { tableId_seat: { tableId: id, seat: mine } }, data: { colour } });
    return true;
  });
  return written ? "set" : setTableColour(id, readerId, colour);
}
