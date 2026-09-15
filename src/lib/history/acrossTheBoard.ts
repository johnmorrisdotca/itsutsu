import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { isIgnoring } from "@/lib/social/ignores";

/**
 * WHO IS ACROSS THE BOARD, and whose messages this reader has muted.
 *
 * Two questions the match page asks of every live board, lifted out of it when
 * that page went past the size gate. They belong together and away from the
 * page for the same reason: both are about the PEOPLE in a game rather than
 * about drawing one, both reach the members table, and both have a subtlety
 * that reads as an accident when it is inlined among JSX.
 */

/** The other seat, as the line under the board prints it. */
export type Across = {
  name: string;
  country: string;
  /** Set while they are away and their deadline is waiting. */
  awayUntil: string | null;
};

/** The seats a board's two people are held by. */
type SeatIds = { blackMemberId: string | null; whiteMemberId: string | null };

/**
 * Who sits across the board: the other seat's name and, when it is an account
 * that said where it is, its country — the way the elder sites put it,
 * "against Kyokosan from Canada".
 *
 * Found by ID, because that is what a seat holds now. Null for a watcher (there
 * is no "other seat" without a seat of your own) and for a board whose other
 * chair is anonymous and unnamed, where there is nothing true to print.
 */
export async function acrossTheBoard(
  seat: Stone | null,
  seats: SeatIds,
  names: { blackName: string; whiteName: string },
  now: Date = new Date(),
): Promise<Across | null> {
  if (seat === null) return null;
  const otherId = seat === STONES.black ? seats.whiteMemberId : seats.blackMemberId;
  const otherName = (seat === STONES.black ? names.whiteName : names.blackName).trim();
  const member =
    otherId === null
      ? null
      : await prisma.member.findUnique({
          where: { id: otherId },
          select: { name: true, country: true, awayFrom: true, awayUntil: true },
        });
  if (member === null && otherName === "") return null;
  const at = now.getTime();
  const away =
    member?.awayFrom && member.awayUntil && member.awayFrom.getTime() <= at && member.awayUntil.getTime() > at
      ? member.awayUntil.toISOString()
      : null;
  return {
    name: member?.name || otherName || "the other seat",
    country: member?.country ?? "",
    awayUntil: away,
  };
}

/**
 * Whose messages this reader has chosen not to hear, SEAT OR NO SEAT.
 *
 * This used to be worked out inside the block above, which only runs for
 * somebody holding a seat — so a member who had ignored a player and then
 * opened that player's game to watch it saw everything they said. The ignore
 * list is a rule about who may reach you, not about which chair you are sitting
 * in, and the record page has answered it this way for any reader since the
 * conversation was put on it.
 *
 * BY MEMBER ID, both the reader and the seats. The ignore list was kept by
 * address, so this read each seat's member row to find the address to ask with —
 * and a member who came in with an invite code has none, so could not be muted.
 * The list is kept by id now, which is what a seat already holds.
 */
export async function mutedColours(
  readerId: string | null,
  seats: SeatIds,
): Promise<Stone[]> {
  if (readerId === null) return [];
  const pairs = [
    [STONES.black, seats.blackMemberId],
    [STONES.white, seats.whiteMemberId],
  ] as const;

  const muted: Stone[] = [];
  for (const [stone, memberId] of pairs) {
    if (memberId !== null && memberId !== readerId && (await isIgnoring(readerId, memberId))) muted.push(stone);
  }
  return muted;
}
