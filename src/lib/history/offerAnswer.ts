import "server-only";

import { randomBytes } from "node:crypto";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notify/email";
import { activeLimitRefusal, memberOverActiveLimit } from "./activeGames";
import { nextDeadline } from "./deadline";
import { OFFER_ACTIONS, type OfferOutcome } from "./offers.types";
import { OFFER_SELECT, offerRefusal, offeredSeat } from "./offers";

/**
 * ANSWERING AN OFFER: accept it, decline it, or take it back.
 *
 * The rules are in `offers.ts` and are checked without a database. This is the
 * writing, and the three things worth saying about it are all about what it
 * does NOT do.
 *
 * **A declined offer reaches neither the ladder nor the run over every game.**
 * `recordResult` and `recordPlayed` are not called here and must never be. The
 * precedent is `cancelGame` — a board called off before the first stone — and
 * its comment states the principle: nothing was played, so nothing is owed.
 * An offer is one step further back than that: nobody even agreed to play.
 *
 * **And no XP, in either direction.** Nothing is paid for declining, and
 * nothing is taken back from the offerer for having been declined. The ask was
 * an ask and it happened; `challengeSent` was paid for the asking at the moment
 * the offer was made and stays paid. Making it conditional on the answer would
 * put the offerer's standing in the offeree's hands, which is the same thing as
 * charging somebody for saying no — and "no penalties for refusing" has to mean
 * to either of them or a decline becomes a thing to resent. `challengeAnswered`
 * still needs a MOVE (`awardAnsweredChallenge`, gated on both seats being
 * bound), so a declined offer can never reach it and an accepted one reaches it
 * exactly as a challenge always has. `xpSocial.ts` needs no change at all.
 *
 * **The offered seat's token is replaced when the offer is accepted.** A token
 * is the whole credential for a seat, and while a game is an offer that token
 * is handed to nobody — not to the offerer in the creation response, not onto
 * the board as an invite link, and not to the offeree, who reaches their seat by
 * member id once it is theirs. Minting a fresh one at the moment of acceptance
 * is what makes that a property of the row rather than of six call sites
 * remembering to withhold it: whatever value existed while the game was a
 * question cannot play the seat once it is an answer.
 */

/** A seat key: the same shape `createLiveGame` mints for a hot-seat board. */
function freshToken(): string {
  return randomBytes(18).toString("base64url");
}

const OFFER_ROW = {
  id: true,
  variant: true,
  status: true,
  moveTimeMs: true,
  clockMode: true,
  blackTimeMs: true,
  whiteTimeMs: true,
  blackMemberId: true,
  whiteMemberId: true,
  blackName: true,
  whiteName: true,
  opener: true,
  ...OFFER_SELECT,
} as const;

/**
 * Takes the offered seat. The game becomes an ordinary game from this moment:
 * the seat is bound, the offer columns are cleared, and the clock starts.
 *
 * THE CLOCK STARTS HERE AND NOT AT THE OFFER. `createLiveGame` stamps
 * `lastMoveAt` and a first `deadlineAt` when the row is written, which is right
 * for a game that exists and wrong for a question nobody has answered —
 * `deadlineFor` refuses to read a deadline off an offer for exactly that reason.
 * So acceptance restamps both, and the person who opens is given their whole
 * first period from the moment there is somebody to play against, however long
 * the offer sat unanswered.
 */
export async function acceptOffer(
  id: string,
  memberId: string | null,
  name: string,
  now = new Date(),
): Promise<OfferOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: OFFER_ROW });
  const refused = offerRefusal(row, memberId, OFFER_ACTIONS.accept);
  if (refused !== null) return { ok: false, reason: refused };
  // Both are non-null once `offerRefusal` has passed; narrowed for the compiler.
  if (row === null || memberId === null) return { ok: false, reason: "not-found" };
  const seat = offeredSeat(row);
  if (seat === null) return { ok: false, reason: "no-seat" };

  /*
   * TWENTY BOARDS IS THE LIMIT, AND THIS IS THE MOMENT THE OFFEREE TAKES ONE
   * ON — not the moment somebody else offered it to them.
   *
   * The creation route used to count the invited member's games and refuse the
   * challenge outright. That is the wrong door for two reasons. It let anybody
   * fill a stranger's cap by sending them twenty games they never wanted,
   * which would be a way of locking somebody out of the site using the very
   * feature whose promise is that declining costs nothing. And the refusal it
   * produced was addressed to the wrong person — `activeLimitRefusal` says
   * "You have N games on the go", which, told to the challenger about the
   * challenged, both leaks a count and is untrue of the reader.
   *
   * Here it is exactly right: they are the one acquiring a board, they are the
   * one being told, and the number in the sentence is their own.
   */
  const atTheLimit = await memberOverActiveLimit([memberId]);
  if (atTheLimit !== null) {
    // Refused, and the offer is LEFT STANDING — nothing above has written
    // anything yet. They finish a game and accept this one an hour later, the
    // same property the seat link keeps by not stamping itself on a refusal.
    return { ok: false, reason: "over-limit", said: activeLimitRefusal(atTheLimit) };
  }

  const held = seat === STONES.black ? row.blackName : row.whiteName;
  const opener = row.opener === STONES.black ? STONES.black : STONES.white;
  await prisma.game.update({
    where: { id },
    data: {
      [`${seat}MemberId`]: memberId,
      // A seat with no name typed on it takes the name of whoever sat down.
      ...(held.trim() === "" && name.trim() !== "" ? { [`${seat}Name`]: name.trim() } : {}),
      // Arriving at your own seat by accepting is arriving; nobody follows a link here.
      [`${seat}ClaimedAt`]: now,
      // See the head of this function: the token that existed while this was a
      // question is discarded, so it cannot play the seat now it is an answer.
      [`${seat}Token`]: freshToken(),
      /*
       * THE OFFER IS CLEARED, WHICH IS THE WHOLE MECHANISM. From here the row
       * is the bound game it would have been before any of this existed, and
       * every query on the site reads it as one without being told about
       * offers. See the schema's note on `offeredAt`.
       */
      offeredToMemberId: null,
      offeredAt: null,
      lastMoveAt: now,
      deadlineAt: nextDeadline(row, opener, now),
      extraMs: 0,
    },
  });
  return { ok: true, seat, variant: row.variant };
}

/**
 * Says no. It costs nothing — and that is a property of this function rather
 * than a promise made elsewhere: there is no `recordResult`, no `recordPlayed`,
 * no XP, no winner and no result.
 *
 * The game is filed the way a board called off before the first stone is filed,
 * `status: finished` with `result: abandoned`, plus `declinedAt` — which is
 * what keeps it from being read as an ordinary abandoned game. A declined offer
 * is not in the record: `NOT_A_REFUSED_OFFER` takes it out of every listing,
 * and `offers.coverage.test.ts` fails the build when a new listing forgets.
 *
 * **And deliberately nothing about the settled turn.** The engine never ended
 * this game — it never started — so there is no verdict of its to write down,
 * and inventing one would be the lie the pair exists to avoid. `status` is what
 * says this is over, and `status` is what a reader asks first.
 */
export async function declineOffer(
  id: string,
  memberId: string | null,
  now = new Date(),
): Promise<OfferOutcome> {
  return endOffer(id, memberId, OFFER_ACTIONS.decline, now);
}

/** Takes an offer back. The offerer's, and only before it has been answered. */
export async function withdrawOffer(
  id: string,
  memberId: string | null,
  now = new Date(),
): Promise<OfferOutcome> {
  return endOffer(id, memberId, OFFER_ACTIONS.withdraw, now);
}

/**
 * The one write both refusals make, differing only in which column says what
 * happened — because they ARE the same act with two different authors, and the
 * two columns are how a reader can still tell them apart afterwards.
 */
async function endOffer(
  id: string,
  memberId: string | null,
  action: typeof OFFER_ACTIONS.decline | typeof OFFER_ACTIONS.withdraw,
  now: Date,
): Promise<OfferOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: OFFER_ROW });
  const refused = offerRefusal(row, memberId, action);
  if (refused !== null) return { ok: false, reason: refused };
  if (row === null) return { ok: false, reason: "not-found" };
  const seat = offeredSeat(row);

  await prisma.game.update({
    where: { id },
    data: {
      status: "finished",
      result: "abandoned",
      winner: null,
      ...(action === OFFER_ACTIONS.decline ? { declinedAt: now } : { withdrawnAt: now }),
      lastMoveAt: now,
      deadlineAt: null,
      extraMs: 0,
    },
  });
  /*
   * The offerer hears about a decline — the queue shows it, and this is the
   * same no-op notifier every other ending goes through, so wiring a real
   * provider one day reaches this path with the rest. Nothing is sent for a
   * withdrawal: the person who did it knows, and the person who was asked
   * never agreed to hear from this game at all.
   */
  if (action === OFFER_ACTIONS.decline) {
    await sendEmail({ kind: "game-over", gameId: id, winner: null });
  }
  return { ok: true, seat: seat ?? STONES.white, variant: row.variant };
}
