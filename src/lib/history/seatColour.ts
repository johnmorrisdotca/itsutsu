import "server-only";

import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { PieceColour } from "@/lib/pieces/pieceColours";
import { seatColourRefusal, seatColoursFrom, type SeatColourRefusal, type SeatColours } from "@/lib/pieces/seatColours";
import { prisma } from "@/lib/prisma";

export type SeatColourOutcome =
  | { ok: true; colours: SeatColours }
  | { ok: false; reason: "not-found" | "finished" }
  | { ok: false; reason: "refused"; refusal: SeatColourRefusal };

/**
 * One seat of a live game chooses the colour of its pieces, or takes it back
 * (`null`). Shared: it is written on the game's row, so the other player and
 * anyone watching see it at their next poll — the write moves `updatedAt`,
 * which is what the poll's tag reads (`gameVersion`).
 *
 * The seat is proved by the caller (`resolveSeat`); this decides only whether
 * the colour may be had. A colour the other seat has, or one too like the
 * other seat's pieces, is refused with the next free one to offer
 * (`seatColourRefusal`). The write is conditional on the other seat's colour
 * being what it was read as, so two players choosing in the same instant can
 * never both end up in one colour: the second is told to choose again.
 *
 * Any time in a game that is not over — before the first move, on it, or
 * forty moves in — and never after: a finished game is a record.
 */
export async function setSeatColour(id: string, seat: Stone, colour: PieceColour | null): Promise<SeatColourOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: { status: true, blackColour: true, whiteColour: true } });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  const colours = seatColoursFrom(row.blackColour, row.whiteColour);
  const refusal = seatColourRefusal(seat, colour, colours);
  if (refusal !== null) return { ok: false, reason: "refused", refusal };
  const mine = seat === "black" ? "blackColour" : "whiteColour";
  const theirs = seat === "black" ? "whiteColour" : "blackColour";
  const written = await prisma.game.updateMany({
    where: { id, status: "active", [theirs]: row[theirs] },
    data: { [mine]: colour },
  });
  if (written.count === 0) return setSeatColour(id, seat, colour);
  return { ok: true, colours: { ...colours, ...(colour === null ? { [seat]: undefined } : { [seat]: colour }) } };
}
