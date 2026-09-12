import "server-only";

import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { isBotId } from "@/lib/bots/bots";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { isIgnoring } from "@/lib/social/ignores";
import type { CreationAsked, CreationRefusal } from "./liveRequest";
import { offerLiftedOff } from "./offers";
import {
  FORK_PACE_SETTINGS,
  opponentOf,
  seatOf,
  seatsForRematch,
  settingsToCarry,
  type Seating,
} from "./rematch";

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
 *     named" want the identical treatment once they are found. It hands over a
 *     MEMBER ID and the colour the forker played; both matter, and both were
 *     wrong. See "A fork of a game against a computer player" below.
 *  3. **Asking somebody** seats the caller black and the other person white —
 *     unless a position has already settled the colours, in which case each of
 *     them keeps the seat they had.
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
 * ─────────────────────────────────────────────────────────────────────────
 * A FORK OF A GAME AGAINST A COMPUTER PLAYER IS A GAME AGAINST THAT PLAYER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * It used to be two people at one screen, and nothing said so. The fork bound
 * the other seat from the opponent's EMAIL, and a computer player has none — it
 * never signs in, which is the whole reason `challengeId` exists. So a fork of
 * any game played against one found nobody, fell through to a hot seat, and
 * quietly made a board for two people at one device.
 *
 * The screens in front of it said something else. `personNamed` answers with the
 * program (its null address is the one exception it makes), so `fork.alone` was
 * false, the setup screen said "Against the same opponent", the doorstep said
 * "Against Hidemasa Tamenoki 機械, who plays white" and offered a rating — which
 * `ratedAtCreation` then refused, because a hot-seat game can never move one.
 * Three screens describing three games, and the one a person got was the one
 * nobody had been shown.
 *
 * So the fork resolves its opponent BY ID, which is exactly what a fresh game
 * against a computer already does — the doorstep's `against=<bot id>` becomes
 * `challengeId` — and every rule about programs then applies unchanged: seated
 * rather than asked, `ensureBotMembers` first, no ignore list to consult. It
 * costs one query fewer than the email round trip it replaces.
 *
 * **Rated, in the computer pool.** A game against a computer player is rated
 * today, fully and symmetrically, and simply somewhere else — see `pools.ts`.
 * Nothing in `rateable.ts` refuses a program a rating, and the position being
 * forked was itself reached by this person and this program, so there is no
 * sense in which the result would be somebody else's work. The same is already
 * true of a fork against a PERSON, whose rating is inherited from the game it
 * came out of.
 *
 * **AND THE COLOURS STAY.** A fork continues a position and a position belongs
 * to the colours that were in it — `rematch.ts` says it outright, "A fork is not
 * a rematch and does not swap", and `seatsFor` promises the forker `fork.colour`
 * on the doorstep. The route seated whoever asked as black whatever they had
 * played, so forking a game you played WHITE in handed you the other side of
 * your own position while the page you had just read said otherwise. Harmless
 * until now only because the case it bit hardest — a fork against a program —
 * never got as far as being seated at all.
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
  /**
   * A computer player holds one of the seats above, so it may have a move to
   * make the moment the game exists.
   *
   * READ OFF THE SETTLED SEATS rather than off the request, and that is the
   * point of it. The route used to ask "did this request name a computer to
   * challenge", which is true of a fresh challenge and false of the two other
   * ways a program ends up in a seat: a fork of a game against one, and a
   * rematch of one. A rematch against a program has therefore never played its
   * opening move — the board sat waiting on a player that never waits, until the
   * person moved and the move route called `playBotTurns` for them.
   *
   * An offered seat has had its id lifted off by the time this is read, so an
   * offer can never look like a seated program; that falls out of the shape
   * rather than needing a condition.
   */
  computerSeated: boolean;
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
): Promise<
  | { refused: CreationRefusal }
  | {
      carried: {
        source: Record<string, unknown>;
        /** Whoever else was in the position, by member id, or null if nobody was. */
        opponentId: string | null;
        /** The colour the caller played, which they keep. Null where they were not in it. */
        mySeat: Stone | null;
      };
    }
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
   * handed on BY MEMBER ID so `askingSomebody` below does the seating — a fork
   * against somebody and an ask of that same somebody are one case once they are
   * found. By id and not by address, which is the whole of the computer-player
   * fix at the top of this file: an id is what a member IS, an address is only
   * how they sign in, and a program has the first and never the second.
   *
   * `mySeat` travels with it because a fork does not swap. Null for a reader who
   * was not in the game at all, which is also the case that finds no opponent.
   */
  const mine = await currentMemberId();
  const mySeat = seatOf(origin, mine);
  const opponentId = opponentOf(origin, mine);
  return { carried: { source, opponentId, mySeat } };
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
  /** The colour the caller keeps, where a position has settled one. Black otherwise. */
  keep: Stone | null,
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

  /*
   * WHOEVER ASKS TAKES BLACK, unless a position says which colour they had.
   *
   * `keep` is null for every ordinary ask — nothing there carries a colour — so
   * this is the same seating it has always been, stated as one expression rather
   * than two branches. A fork passes the colour it was played in, and the other
   * player takes the other seat: the seat they had.
   *
   * The names the REQUEST sends stay keyed to the colours, because that is what
   * they are: `blackName` names whoever sits black, whoever that turns out to be.
   * A fork sends neither, so both fall through to the accounts' own.
   */
  const iAmBlack = (keep ?? STONES.black) === STONES.black;
  const myName = me.name || "";
  return {
    seats: {
      blackMemberId: iAmBlack ? mineId : other.id,
      whiteMemberId: iAmBlack ? other.id : mineId,
      blackName: asked.data.blackName || (iAmBlack ? myName : other.name),
      whiteName: asked.data.whiteName || (iAmBlack ? other.name : myName),
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
  /*
   * CONST, and the lint rule that says so is telling the truth about the fix
   * above: the fork used to overwrite this with the opponent's ADDRESS, and it
   * now fills in `challengeId` instead. Nothing on this route reassigns what the
   * caller asked for by address any more.
   */
  const challenge = asked.data.challenge;
  let challengeId = asked.data.challengeId;
  let hotSeat = asked.data.hotSeat;
  let rematchSeats: Seating | null = null;
  let offerTo: string | null = null;
  /** The colour a carried position settles for the caller, where one does. */
  let keep: Stone | null = null;

  if (asked.data.rematch !== undefined) {
    const again = await playingAgain(asked.data.rematch);
    if ("refused" in again) return again;
    source = again.carried.source;
    rematchSeats = again.carried.seats;
    offerTo = again.carried.offerTo;
  }
  if (asked.data.from !== undefined) {
    const on = await continuingAPosition(asked, asked.data.from);
    if ("refused" in on) return on;
    source = on.carried.source;
    keep = on.carried.mySeat;
    /*
     * The person in the position, where the request named nobody itself. A
     * request that DID name somebody wins: it is the more specific instruction,
     * and it is how a fork whose opponent has since become unreachable can still
     * be handed to somebody else.
     */
    if (challenge === undefined && challengeId === undefined && on.carried.opponentId !== null) {
      challengeId = on.carried.opponentId;
    }
    // Nobody at all to play, so the fork is a board at one screen. Only ever
    // set, never cleared: a caller that asked for one screen gets one.
    if (challenge === undefined && challengeId === undefined) hotSeat = true;
  }

  if (challengeId !== undefined && isBotId(challengeId)) await ensureBotMembers();

  let seats: AgainstSeats = rematchSeats ?? {};
  if (rematchSeats === null && (challenge !== undefined || challengeId !== undefined)) {
    const asking = await askingSomebody(asked, challenge, challengeId, keep);
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

  return {
    against: {
      seats,
      source,
      hotSeat,
      offer: proposed.offer,
      offeredSeat: proposed.seat,
      computerSeated: isBotId(seats.blackMemberId) || isBotId(seats.whiteMemberId),
    },
  };
}
