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
 * Records that a seat's link has been used, the first time it is used.
 *
 * Only the first use: re-opening your own link on a second device is a normal
 * thing to do and must not move the timestamp, or "when was this seat taken"
 * would mean "when was it last opened" and answer a different question.
 */
export async function markSeatTaken(id: string, seat: Stone, now = new Date()): Promise<void> {
  const column = seat === STONES.black ? "blackClaimedAt" : "whiteClaimedAt";
  await prisma.game.updateMany({
    where: { id, [column]: null },
    data: { [column]: now },
  });
}

/**
 * Whether a seat is still to be given out.
 *
 * A seat nobody has taken is the only one whose link is worth showing, and
 * the only one whose link is safe to show. A posted seat used to be treated
 * as untaken whatever else was on the row — "by definition", the comment
 * said — and it is not: somebody claiming a posted seat stamps it like any
 * other, and after that the game is not waiting for anybody. Reporting it
 * free anyway left the seat advertised on the noticeboard and its link on
 * screen after it had been sat in.
 *
 * A game with a stone on it is past inviting anybody, whatever the seats
 * say. That is the stronger rule and it covers the cases the per-seat one
 * cannot: a computer player never follows a link, so its seat is never
 * stamped and would read as free for ever — and more generally, once play
 * has begun there is nobody left to invite and a link on screen is only a
 * credential somebody can read over your shoulder.
 */
export function seatIsFree(
  game: {
    openSeat?: string | null;
    blackClaimedAt?: Date | string | null;
    whiteClaimedAt?: Date | string | null;
    moveCount?: number;
  },
  seat: Stone,
): boolean {
  if ((game.moveCount ?? 0) > 0) return false;
  // A posted seat is offered to anybody, but — like every other seat — only
  // until somebody takes it. There is no case left where openSeat matters.
  const claimed = seat === STONES.black ? game.blackClaimedAt : game.whiteClaimedAt;
  return claimed === null || claimed === undefined;
}

/**
 * Whether this account is already sitting at the other side of this game.
 *
 * A seat token is the whole credential, and the person who starts a game is
 * handed both — they have to be, or they could not send the other one to
 * anybody. Nothing then stopped them from following it themselves, and
 * because a posted seat reported as free for ever, the game stayed on the
 * noticeboard while one person played both colours of it. Somebody could
 * have sat down into a game that was already three moves old.
 *
 * A game deliberately played at one screen is the exception and says so on
 * the row: both seats share a token there, which is what hot seat means.
 */
export async function holdsOtherSeat(id: string, seat: Stone, memberId: string): Promise<boolean> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: { blackMemberId: true, whiteMemberId: true, blackToken: true, whiteToken: true },
  });
  if (row === null) return false;
  if (row.blackToken === row.whiteToken) return false;
  const other = seat === STONES.black ? row.whiteMemberId : row.blackMemberId;
  return other !== null && other === memberId;
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
