import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";

export type SeatClaim = { seat: Stone; token: string };

/**
 * Whose seat this is, from what the request carries.
 *
 * A browser proves a seat one of two ways: the token in its cookie for this
 * match (a scanned link, or a seat it sat down at), or the account it is
 * signed in to, when that account took the seat. The cookie wins any tie,
 * because it names the seat *this* browser sat at — an account may hold both
 * seats of a game, playing itself from two devices — and a seat found by
 * account is handed back with its token so the board can act on it exactly
 * as a cookie-held seat would.
 */
export async function resolveSeat(
  id: string,
  cookieToken: string | undefined,
  memberId: string | null,
): Promise<SeatClaim | null> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: { blackToken: true, whiteToken: true, blackMemberId: true, whiteMemberId: true },
  });
  if (row === null) return null;

  if (cookieToken === row.blackToken) return { seat: STONES.black, token: row.blackToken };
  if (cookieToken === row.whiteToken) return { seat: STONES.white, token: row.whiteToken };
  if (memberId !== null) {
    if (row.blackMemberId === memberId) return { seat: STONES.black, token: row.blackToken };
    if (row.whiteMemberId === memberId) return { seat: STONES.white, token: row.whiteToken };
  }
  return null;
}

/**
 * Ties a seat to the account that took it, so "your games" follows the
 * account rather than the browser. A blank seat name takes the member's
 * name, since that is who is sitting there. A seat already bound to another
 * account is left alone: a scanned link does not transfer a seat somebody
 * else is signed in to.
 */
export async function bindSeat(id: string, seat: Stone, memberId: string, name: string): Promise<void> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: { blackMemberId: true, whiteMemberId: true, blackName: true, whiteName: true },
  });
  if (row === null) return;
  const held = seat === STONES.black ? row.blackMemberId : row.whiteMemberId;
  if (held !== null && held !== memberId) return;
  const current = seat === STONES.black ? row.blackName : row.whiteName;
  const nameUpdate = current.trim() === "" && name.trim() !== "" ? { [`${seat}Name`]: name.trim() } : {};
  await prisma.game.update({
    where: { id },
    data: { [`${seat}MemberId`]: memberId, ...nameUpdate },
  });
}
