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
 * Whether taking this seat would be answering your own public invitation.
 *
 * The distinction this draws is the whole of it. A seat link somebody sends
 * *themselves* is a game played from two devices, and that is deliberate and
 * wanted — `resolveSeat` says so in as many words, and the hot seat games
 * depend on it. A seat *posted on the noticeboard* is an invitation to
 * anybody, and answering your own is a different act: John did it without
 * meaning to, played both colours, and the game sat there asking for an
 * opponent the whole time. Somebody could have sat down into it.
 *
 * So only the posted seat is refused, and only to the person already sitting
 * opposite it. Nothing else about seat links changes.
 */
export async function wouldAnswerTheirOwnInvitation(
  id: string,
  memberId: string,
  /** The seat being claimed, where one is named. Omitted: whichever is posted. */
  seat?: Stone,
): Promise<boolean> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: { openSeat: true, blackMemberId: true, whiteMemberId: true },
  });
  if (row === null || row.openSeat === null) return false;
  if (seat !== undefined && row.openSeat !== seat) return false;
  const posted = row.openSeat === STONES.black ? STONES.black : STONES.white;
  const other = posted === STONES.black ? row.whiteMemberId : row.blackMemberId;
  return other !== null && other === memberId;
}

/**
 * Whether the rules of a shared game are still open to change.
 *
 * They were open until the first stone, which is later than it should be. A
 * game's rules are what the second player agreed to when they sat down, and
 * between sitting down and playing there is a window where the other seat
 * could still move them — a posted seat answered under one set of rules and
 * played under another. That window is the whole reason the setup screen
 * exists; leaving it open here would leave the door it was built to close.
 *
 * So the rules settle when somebody else arrives, not when somebody moves.
 * Before that a game is still being set up: a creator who posted a seat with
 * the wrong clock can fix it. Once the other seat is taken — or was bound to
 * somebody at the moment the game was written, which is the same thing said
 * another way — they are what both people have.
 *
 * A stone on the board settles them too, through `seatIsFree`, for the games
 * where nobody ever follows a link — a computer player never does.
 */
export function rulesAreSettled(game: {
  openSeat?: string | null;
  openedAt?: Date | string | null;
  blackClaimedAt?: Date | string | null;
  whiteClaimedAt?: Date | string | null;
  blackMemberId?: string | null;
  whiteMemberId?: string | null;
  moveCount?: number;
}): boolean {
  if ((game.moveCount ?? 0) > 0) return true;
  /*
   * BOTH SEATS BELONG TO SOMEBODY, SO BOTH PEOPLE ARE IN THIS GAME.
   *
   * A challenge, a rematch and a fork bind the other seat to a member's id at
   * the moment they are written, and the game is in that person's list before
   * they have seen it — there is nothing to accept, which is the point of them.
   * Nobody follows a link, so nothing is stamped until each of them happens to
   * open the board, and this used to read a challenge as "still waiting for
   * somebody" for as long as the invited player had not looked. The challenger
   * could change the board, the clock, the game itself, days after handing it
   * over.
   *
   * THAT WINDOW WAS UNAVOIDABLE AND IS NOT ANY MORE. It existed because a
   * challenge settled nothing: the button posted a game of Gomoku on the
   * schema's defaults, so the form at the board was the only place its rules
   * were ever chosen, and closing it would have left no way to choose them. A
   * challenge is now sent FROM the setup screen with every rule already agreed,
   * so the form beside the board is no longer the only chance — it is only the
   * chance to move them afterwards.
   *
   * Being handed a game is arriving at it. The doctrine of this function is
   * that the rules settle when somebody else arrives; this is what arriving
   * looks like when nobody has a link to follow.
   *
   * It leaves untouched every case where nobody else is in it yet: a seat
   * posted on the noticeboard has one member id and a null, a private game
   * whose other seat goes out as a link has the same, and a board at one
   * screen has neither. Those really are still being set up, and their form
   * stays.
   */
  if (
    game.blackMemberId !== null &&
    game.blackMemberId !== undefined &&
    game.whiteMemberId !== null &&
    game.whiteMemberId !== undefined
  ) {
    return true;
  }
  /*
   * A seat that was posted and is no longer posted has been answered, and
   * that is the moment somebody agreed to these rules — whatever the poster
   * has or has not done since.
   *
   * Asking only whether both seats are claimed is not enough, and the way it
   * fails is the exact harm: a poster who never opened their own seat link
   * has no claim stamped, so their own game reads as still waiting for
   * somebody, and they could change the rules out from under the person who
   * had just taken the other chair.
   */
  if (game.openedAt !== null && game.openedAt !== undefined && (game.openSeat ?? null) === null) {
    return true;
  }
  return !seatIsFree(game, STONES.black) && !seatIsFree(game, STONES.white);
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
