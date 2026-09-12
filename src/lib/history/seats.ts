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
    /**
     * When this game was proposed to somebody who has yet to answer.
     *
     * REQUIRED, AND THE COMPILER IS THE GATE — the one field of this shape
     * that is, and it is not a style choice. Every other field here answers
     * safely when it is missing: an unstamped seat reads as free, which is
     * what it was before any of them existed. This one is the opposite. A
     * caller whose select forgot it hands over `undefined`, and "I was not
     * told whether this is an offer" would then read as "it is not one" — so
     * a seat somebody had been offered by name would be advertised to
     * everybody looking at the board, with a link and a four-words panel
     * beside it.
     *
     * That is not hypothetical: it is what happened. `LiveMatch` selected six
     * columns and not this one, so the offeree's seat read as free and
     * `SitAsPanel` offered it to the room. The route refused — `standInSeat`
     * reads its own copy strictly — so it was a control that did nothing,
     * which is the failure MatchPage's own comments warn about, inverted. A
     * browser test found it; nothing in the type system could, while this was
     * optional. Now it can.
     */
    offeredAt: Date | string | null;
  },
  seat: Stone,
): boolean {
  if ((game.moveCount ?? 0) > 0) return false;
  /*
   * NEITHER SEAT OF AN OFFER IS FREE — both rather than only the offered one,
   * deliberately. One is the offerer's, and the other is spoken for by name:
   * an offer is addressed to ONE person, so a seat that is "waiting for
   * somebody" in the sense this function means — anybody may take it, and
   * here is its link — is not what an offered seat is.
   *
   * Saying it of both keeps this reading three columns instead of five, and
   * closes three doors at once. The invite links and the four-words panel
   * beside the board both ask this (`MatchPage`), so an offer shows neither —
   * an offer mints a way in for nobody. And `rulesAreSettled` below reads it,
   * which settles the rules of an offer the moment it is made: the rules ARE
   * the offer, and moving them afterwards would make it a different question
   * from the one that was asked.
   */
  if (game.offeredAt !== null) return false;
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
  /**
   * Proposed to somebody who has yet to answer.
   *
   * Settled, and read through `seatIsFree` at the foot of this function rather
   * than tested here: the rules of an offer are what was offered. A challenger
   * who could move the board, the clock or the game itself while the question
   * stood would be asking one thing and starting another.
   *
   * Required for the reason `seatIsFree` gives at length: absent would mean
   * "not an offer", which is the plausible wrong answer.
   */
  offeredAt: Date | string | null;
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
