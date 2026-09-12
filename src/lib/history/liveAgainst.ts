import "server-only";

import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { isBotId } from "@/lib/bots/bots";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { isIgnoring } from "@/lib/social/ignores";
import type { CreationAsked, CreationRefusal } from "./liveRequest";
import { offerLiftedOff } from "./offers";
import { FORK_PACE_SETTINGS, opponentOf, seatsForRematch, settingsToCarry, type Seating } from "./rematch";

/**
 * WHO A NEW GAME IS AGAINST, AND WHAT THAT MAKES IT.
 *
 * Six ways to arrive at a seat — a challenge, a rematch, a fork, a seat posted
 * on the noticeboard, sitting down at somebody else's, and two people at one
 * screen — and this settles all of them into the two chairs a row is written
 * with. It also settles the three things that fall out of WHO: whether the
 * other seat is an offer rather than a binding, whether the board is one
 * screen, and what the game this one came out of carries with it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ORDER IS THE DECISION, AND IT IS NOT ALPHABETICAL
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  1. **Playing that game again** takes everything from the game being
 *     replayed and nothing from the request, because a rematch is the same
 *     game and anything the caller could send instead would be a way of it
 *     quietly not being one. It settles both seats itself.
 *  2. **Continuing a position** takes the board and the rules from the game
 *     being forked, yields the pace to whoever asked, and works out who the
 *     other seat belongs to — which it then hands to (3) rather than seating
 *     itself, because "the person who was in that game" and "the person you
 *     named" want the identical treatment once they are found.
 *  3. **Asking somebody** seats the caller black and the other person white.
 *  4. **A seat posted for anyone** binds the creator, so the rule that stops
 *     somebody answering their own invitation has an id to recognise.
 *
 * A rematch that also names a fork keeps the rematch's seats: (3) is skipped
 * when (1) has already settled them. Two sequential tests rather than one
 * either-or, which is how the route this came out of read, and the shape is
 * kept deliberately — they are separate requests that happen to be able to
 * arrive together.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND A GAME PROPOSED TO A PERSON IS AN OFFER, NOT A BINDING
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `offerTo` is the member who was ASKED rather than seated, gathered by
 * whichever case found them, and read once at the end — so there is one place
 * that turns "who was asked" into "which seat is offered". Null for every game
 * nobody was asked to play, and for a computer player, which has nothing to
 * accept with. The rule itself, and the reason it exists, are in
 * `offerLiftedOff`.
 *
 * Split out of `POST /api/games/live`, which had reached the file-size gate
 * holding this, the request's schema, the settings merge and the answer all at
 * once. The gate was right: those are four jobs.
 */

/** The two chairs as a row is written, naming no nulls — see `offerLiftedOff`. */
export type AgainstSeats = {
  blackMemberId?: string;
  whiteMemberId?: string;
  blackName?: string;
  whiteName?: string;
};

/** What this creation is against, once every case has had its say. */
export type Against = {
  /** The seats as they will be written, with any offered id already lifted off. */
  seats: AgainstSeats;
  /** What the game this one came out of carries, or nothing where there is none. */
  source: Record<string, unknown>;
  /** Two people at one screen: one seat key for both chairs. */
  hotSeat: boolean;
  /** The offer columns, or an empty object where nobody was asked. */
  offer: { offeredToMemberId: string; offeredAt: Date } | Record<string, never>;
  /** Which seat is being offered, or null where this is not an offer. */
  offeredSeat: Stone | null;
};

/** Refusals more than one case gives, in the one wording each of them has. */
const NO_SUCH_GAME: CreationRefusal = { status: 404, error: "No such game." };
const NO_SUCH_MEMBER: CreationRefusal = { status: 404, error: "No such member." };
const NOT_YOUR_GAME: CreationRefusal = { status: 403, error: "You did not play that game." };
const NOT_TAKING_GAMES: CreationRefusal = {
  status: 403,
  error: "That member is not taking games from you.",
};

/**
 * Playing that game again: the same board, the same rules, the colours swapped.
 *
 * The opponent is found by ID rather than by address. The old Rematch button
 * was addressed to an email, so it could never be offered against a computer
 * player — and that is the case it is most wanted for.
 */
async function playingAgain(
  rematch: string,
): Promise<
  | { refused: CreationRefusal }
  | { carried: { source: Record<string, unknown>; seats: Seating; offerTo: string | null } }
> {
  const origin = await prisma.game.findUnique({ where: { id: rematch } });
  if (origin === null) return { refused: NO_SUCH_GAME };
  if (origin.status === "active") {
    return { refused: { status: 400, error: "That game is still being played." } };
  }

  const me = await currentSession();
  const mineId = await currentMemberId();
  if (!me?.email || mineId === null) {
    return { refused: { status: 401, error: "Sign in to play again." } };
  }
  const theirId = opponentOf(origin, mineId);
  // Either they were not in it, or nobody was sitting opposite them.
  if (theirId === null) return { refused: NOT_YOUR_GAME };
  const them = await prisma.member.findUnique({ where: { id: theirId } });
  if (them === null) return { refused: NO_SUCH_MEMBER };
  if (them.email !== null && (await isIgnoring(them.email, me.email))) {
    return { refused: NOT_TAKING_GAMES };
  }
  if (isBotId(them.id)) await ensureBotMembers();

  const seats = seatsForRematch(origin, { id: mineId, name: me.name || "" }, { id: them.id, name: them.name });
  if (seats === null) return { refused: NOT_YOUR_GAME };
  return {
    carried: {
      source: settingsToCarry(origin),
      seats,
      /*
       * Playing that game again is a thing to ask for, not to impose: the
       * other side agreed to the first game and has said nothing about a
       * second. A program is simply seated — it has nothing to accept with.
       */
      offerTo: isBotId(them.id) ? null : them.id,
    },
  };
}

/**
 * Continuing a position out of another game.
 *
 * The board, the rules and the seed come with it, because replaying the copied
 * moves onto any other board would not be the same position. The PACE does
 * not, where the caller has settled one — `FORK_PACE_SETTINGS` says which is
 * which and why, and without that a fork's setup screen would offer a clock, a
 * penalty and a friendly game and have all three thrown away on the way in.
 */
async function continuingAPosition(
  asked: CreationAsked,
  from: { id: string; move: number },
  named: string | undefined,
): Promise<
  | { refused: CreationRefusal }
  | { carried: { source: Record<string, unknown>; challenge: string | undefined; oneScreen: boolean } }
> {
  const origin = await prisma.game.findUnique({ where: { id: from.id } });
  if (origin === null) return { refused: NO_SUCH_GAME };
  if (from.move > origin.moveCount) {
    return { refused: { status: 400, error: "That game has fewer moves." } };
  }

  const source: Record<string, unknown> = {
    ...settingsToCarry(origin),
    blackName: origin.blackName,
    whiteName: origin.whiteName,
  };
  /*
   * EXCEPT WHERE THE CALLER HAS SETTLED THE PACE ITSELF, and keyed on what
   * they ACTUALLY SENT rather than on what came out of the schema. Zod fills a
   * default in for every field it was not given, so the parsed body cannot
   * tell silence from a choice — and silence here has to go on meaning "the
   * game I forked". `asked.said` is the only thing that knows the difference;
   * see `liveRequest.ts`.
   */
  for (const key of FORK_PACE_SETTINGS) if (asked.said.has(key)) delete source[key];

  /*
   * Whoever is not me in the game being forked is who the new one is against,
   * found by id and turned back into the address a challenge is addressed to —
   * so `askingSomebody` below does the seating, and a fork against a person
   * and an ask of that same person are one case rather than two.
   */
  const mine = await currentMemberId();
  const otherId =
    mine !== null && origin.blackMemberId === mine
      ? origin.whiteMemberId
      : mine !== null && origin.whiteMemberId === mine
        ? origin.blackMemberId
        : null;
  const otherMember =
    otherId === null
      ? null
      : await prisma.member.findUnique({ where: { id: otherId }, select: { email: true } });
  const challenge = named === undefined && otherMember?.email ? otherMember.email : named;
  // Nobody to play, so the fork is a game at one screen that can be handed out from there.
  return { carried: { source, challenge, oneScreen: challenge === undefined } };
}

/**
 * Asking somebody for a game: they get the white seat, the caller black.
 *
 * A challenge to a computer player is a challenge like any other — it binds
 * both seats, it is rated, and it appears in both records. The only thing it
 * cannot be addressed by is an address, because a computer never signs in and
 * so has none, which is what `challengeId` is for.
 */
async function askingSomebody(
  asked: CreationAsked,
  challenge: string | undefined,
  challengeId: string | undefined,
): Promise<{ refused: CreationRefusal } | { seats: AgainstSeats; offerTo: string | null }> {
  const me = await currentSession();
  const signIn: CreationRefusal = { status: 401, error: "Sign in to challenge someone." };
  if (!me?.email) return { refused: signIn };
  const mineId = await currentMemberId();
  if (mineId === null) return { refused: signIn };
  const other =
    challengeId !== undefined
      ? await prisma.member.findUnique({ where: { id: challengeId } })
      : await prisma.member.findUnique({ where: { email: challenge } });
  if (other === null) return { refused: NO_SUCH_MEMBER };
  // A challenge is addressed to somebody who can answer it — or to a computer, which always can.
  const computer = isBotId(other.id);
  if (other.email === null && !computer) return { refused: NO_SUCH_MEMBER };
  // Nobody is ignored by a computer, so there is no list to consult.
  if (!computer && other.email !== null && (await isIgnoring(other.email, me.email))) {
    return { refused: NOT_TAKING_GAMES };
  }

  return {
    seats: {
      blackMemberId: mineId,
      whiteMemberId: other.id,
      blackName: asked.data.blackName || me.name || "",
      whiteName: asked.data.whiteName || other.name,
    },
    // A person is asked; a program is simply seated. See `offerTo` above.
    offerTo: computer ? null : other.id,
  };
}

/**
 * Settles who a creation is against, or why it cannot be made.
 *
 * Asks the cases in the order above and stops at the first refusal, so nothing
 * is written and nothing is looked up past the point the answer is already no.
 */
export async function resolveAgainst(
  asked: CreationAsked,
): Promise<{ refused: CreationRefusal } | { against: Against }> {
  let source: Record<string, unknown> = {};
  let challenge = asked.data.challenge;
  let hotSeat = asked.data.hotSeat;
  let rematchSeats: Seating | null = null;
  let offerTo: string | null = null;

  if (asked.data.rematch !== undefined) {
    const again = await playingAgain(asked.data.rematch);
    if ("refused" in again) return again;
    source = again.carried.source;
    rematchSeats = again.carried.seats;
    offerTo = again.carried.offerTo;
  }
  if (asked.data.from !== undefined) {
    const on = await continuingAPosition(asked, asked.data.from, challenge);
    if ("refused" in on) return on;
    source = on.carried.source;
    challenge = on.carried.challenge;
    // Only ever set, never cleared: a caller that asked for one screen gets one.
    if (on.carried.oneScreen) hotSeat = true;
  }

  const challengeId = asked.data.challengeId;
  if (challengeId !== undefined && isBotId(challengeId)) await ensureBotMembers();

  let seats: AgainstSeats = rematchSeats ?? {};
  if (rematchSeats === null && (challenge !== undefined || challengeId !== undefined)) {
    const asking = await askingSomebody(asked, challenge, challengeId);
    if ("refused" in asking) return asking;
    seats = asking.seats;
    offerTo = asking.offerTo;
  }

  const proposed = offerLiftedOff(seats, offerTo);
  seats = proposed.seats;

  /*
   * Whoever starts a game is sitting at it, and the row should say so from the
   * first moment rather than from whenever they happen to open their own seat
   * link.
   *
   * They were a stranger to their own game until then: with no member id on
   * either seat, the rule that stops somebody answering their own posted
   * invitation had nobody to recognise, so a poster could sit their own open
   * seat and play both colours — and because the two seat names can differ,
   * the result went to the ladder as a real game between two people. Binding
   * here is what gives that rule something to compare.
   *
   * Only for a posted seat, which is the case that needs it. Binding every
   * game's creator would also seat whoever started a private one from any
   * device, which is a bigger change than this bug asks for.
   */
  if (asked.data.open === true && seats.blackMemberId === undefined) {
    const creator = await currentMemberId();
    if (creator !== null) seats = { ...seats, blackMemberId: creator };
  }

  return { against: { seats, source, hotSeat, offer: proposed.offer, offeredSeat: proposed.seat } };
}
