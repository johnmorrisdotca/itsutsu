/**
 * A GAME PROPOSED TO A PERSON IS AN OFFER UNTIL THEY ACCEPT IT.
 *
 * John, about a game forked out of a position — "PLAY FROM MOVE 26" — where
 * the other player is handed a board they never agreed to: "the opponent
 * should get the option to refuse the game… no penalties for refusing."
 *
 * A challenge, a rematch and a fork against a known person are ONE case in
 * the creation route: all three bind the other seat at the moment the row is
 * written. So all three are offers, and this module is the rule for what an
 * offer is and who may answer it.
 *
 * PURE, and separate from the writes in `offerAnswer.ts`, for the reason
 * every rule in this codebase is: the interesting part is not the query. Who
 * may accept, what counts as already answered, and which seat is even being
 * offered are all decidable from four columns, and all three have a wrong
 * answer that looks plausible — so they are checked here, without a database,
 * the way `seats.ts` and `nextGame.ts` are.
 *
 * WHAT IS NOT AN OFFER, and none of them changes:
 *
 *  - A game against a computer player. It answers at once and has nothing to
 *    accept with; offering one would be a question nobody is there to hear.
 *  - A hot-seat board. Both seats are the same person's.
 *  - A seat posted on the noticeboard. That is already an invitation, with
 *    its own mechanism (`openSeat`) and its own answer — sitting down.
 *  - A private game whose other seat goes out as a link. The link IS the
 *    offer; following it is accepting.
 */
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import {
  OFFER_ACTIONS,
  OFFER_STATES,
  type OfferAction,
  type OfferRefusal,
  type OfferRow,
  type OfferSeats,
  type OfferState,
} from "./offers.types";

/**
 * The columns every reader of an offer needs, as a Prisma select fragment.
 *
 * Spread into a select rather than remembered, because the interesting
 * property of these four is that FORGETTING one is invisible: an undefined
 * `offeredAt` reads as "not an offer", which is the safe-looking answer and
 * the wrong one. One fragment means one thing to spread.
 */
export const OFFER_SELECT = {
  offeredToMemberId: true,
  offeredAt: true,
  declinedAt: true,
  withdrawnAt: true,
} as const;

/**
 * A `where` fragment excluding offers that never became games.
 *
 * THE ONE PREDICATE EVERY LISTING OF GAMES NEEDS, and the reason it is a
 * constant rather than two lines typed out in each place. A refused offer is
 * filed `status: finished, result: abandoned` — which is what `cancelGame`
 * already writes for a board called off before the first stone, and is the
 * only thing the stored result can honestly say — so a query asking for
 * finished games sees it unless it is told not to.
 *
 * Most queries are already safe because they also ask `result: { not:
 * "abandoned" }`; the ones that are not are named in
 * `offers.coverage.test.ts`, which fails the build when a new one appears.
 */
export const NOT_A_REFUSED_OFFER = { declinedAt: null, withdrawnAt: null } as const;

/** Whether a timestamp column is actually set, accepting either shape a row can carry. */
function at(value: Date | string | null | undefined): boolean {
  return value !== null && value !== undefined;
}

/**
 * WHAT THIS OFFER HAS BECOME, or null for a game that is not an offer.
 *
 * The order is the decision. A refusal is checked before `offeredAt`, because
 * a declined offer still carries the offer columns — that is how the row
 * remembers who was asked and when — so testing `offeredAt` first would read
 * a refused offer as an outstanding one.
 */
export function offerState(row: OfferRow): OfferState | null {
  if (at(row.declinedAt)) return OFFER_STATES.declined;
  if (at(row.withdrawnAt)) return OFFER_STATES.withdrawn;
  if (at(row.offeredAt)) return OFFER_STATES.offered;
  return null;
}

/**
 * Whether this game is an offer nobody has answered yet.
 *
 * THE TEST EVERY SEAT-BOUND ACTION MAKES. An offer is answered, not played:
 * no move, no resignation, no timeout claim, no courtesy time, and no change
 * of rules. It is one question asked in six places, so it is one function.
 */
export function isOffered(row: OfferRow): boolean {
  return offerState(row) === OFFER_STATES.offered;
}

/** Whether this row is an offer that ended without ever being a game. */
export function wasRefused(row: OfferRow): boolean {
  const state = offerState(row);
  return state === OFFER_STATES.declined || state === OFFER_STATES.withdrawn;
}

/**
 * WHICH SEAT IS BEING OFFERED — the one with nobody in it — or null when
 * that cannot be answered.
 *
 * Derived rather than stored, and that is a choice worth defending. The
 * obvious alternative is a fifth column naming the colour, the way `openSeat`
 * names a posted one. But an offer already pins the OTHER seat to the
 * offerer's member id, so the pair is fully determined by the row: a stored
 * colour would be a second copy of a fact the row already holds, and a second
 * copy is a thing that can disagree with the first. `openSeat` is precisely
 * the column that has gone wrong that way here before — see the note on
 * `seatIsFree`, where a posted seat was read as untaken "by definition"
 * whatever else the row said.
 *
 * NULL FOR "I CANNOT TELL", never a plausible colour. Both seats bound or
 * both seats loose is not a shape an offer is ever created in — the offerer
 * must be signed in, so their seat always carries their id — and if one ever
 * turns up, the honest answer is to refuse the accept rather than to bind a
 * guess. A rule that cannot measure must not fire.
 */
export function offeredSeat(row: OfferRow & OfferSeats): Stone | null {
  /*
   * ANY offer, not only an outstanding one — and that distinction cost a test.
   * A REFUSED offer keeps its seats exactly as they were, and the offerer has
   * to be told which of their offers was declined and by whom, which needs the
   * same answer this gives. Gating it on `isOffered` made a declined offer
   * report as nobody's, so the queue filed it under "Lately finished" — beside
   * real games, in the group whose hint reads "Filed in the record", for a game
   * that is in no record at all.
   *
   * Whether the offer still STANDS is a different question, and `isOffered` is
   * the one function that answers it. Every caller that means "outstanding"
   * asks that as well.
   */
  if (offerState(row) === null) return null;
  const black = row.blackMemberId ?? null;
  const white = row.whiteMemberId ?? null;
  if (black === null && white !== null) return STONES.black;
  if (white === null && black !== null) return STONES.white;
  return null;
}

/** The seat the OFFERER is sitting in, or null where that cannot be told. */
export function offererSeat(row: OfferRow & OfferSeats): Stone | null {
  const offered = offeredSeat(row);
  if (offered === null) return null;
  return offered === STONES.black ? STONES.white : STONES.black;
}

/** The member who made this offer, or null where that cannot be told. */
export function offererId(row: OfferRow & OfferSeats): string | null {
  const seat = offererSeat(row);
  if (seat === null) return null;
  return (seat === STONES.black ? row.blackMemberId : row.whiteMemberId) ?? null;
}

/**
 * WHICH SEAT HOLDS THIS MEMBER — used at creation, where the offer is being
 * made rather than read.
 *
 * Exact rather than derived: the creation route has just written both member
 * ids onto the seats and knows which of them is the person being asked, so
 * this only has to find which colour that id landed on. Null when neither
 * seat holds them, which is the safe direction — no offer is made, and the
 * game is written exactly as it was before offers existed.
 *
 * This is the reason `offeredSeat` above can derive the colour later from
 * "the seat with nobody in it": the pairing is decided here, once, by
 * somebody who knows.
 */
export function seatHolding(seats: OfferSeats, memberId: string): Stone | null {
  if (seats.blackMemberId === memberId) return STONES.black;
  if (seats.whiteMemberId === memberId) return STONES.white;
  return null;
}

/**
 * The seats a creation would write, and the offer it makes instead.
 *
 * Generic over the seats, so the route gets back exactly the shape it handed
 * in — its own `seats` names no nulls, and widening it here would put a `null`
 * into a Prisma `create` where `undefined` (meaning "say nothing") is wanted.
 */
export type OfferedSeats<T> = {
  /** The seats as they should be written: the offeree's id lifted off. */
  seats: T;
  /** The offer columns, or an empty object where this is not an offer. */
  offer: { offeredToMemberId: string; offeredAt: Date } | Record<string, never>;
  /** Which seat is being offered, or null where this is not an offer. */
  seat: Stone | null;
};

/**
 * A GAME PROPOSED TO A PERSON IS AN OFFER, NOT A BINDING.
 *
 * The creation route settles both seats first — a challenge, a rematch and a
 * fork against a known person are one case there, and all three used to write
 * the other person's member id straight onto their seat. That is how somebody
 * came to be in a game they had never agreed to, on a board chosen by somebody
 * else, with their name on it if it was ever played out. John: "the opponent
 * should get the option to refuse the game… no penalties for refusing."
 *
 * So this LIFTS the other seat's member id off and puts it on the offer, and
 * that is the entire mechanism: every query on this site that means "a person
 * is in this game" reads `blackMemberId`/`whiteMemberId`, and an offer must not
 * answer any of them. The name stays where it was, so both people can see who
 * the game is with.
 *
 * WHICHEVER SEAT IS THEIRS. A rematch swaps the colours (`seatsForRematch`), so
 * the offeree is black about half the time, and reading "the white seat" here
 * would have offered the offerer their own chair on every second game between
 * two people. `seatHolding` finds the colour the id was actually written onto.
 *
 * `offerTo` NULL IS THE ORDINARY CASE and returns the seats untouched: a
 * hot-seat board, a posted seat, a private game handed out as a link and any
 * game against a computer player are all written exactly as before. A program
 * is the one exception worth stating — it has nothing to accept with, it never
 * signs in, and a game waiting for it to agree would wait for ever — and the
 * route decides that, since only the route knows which of the two it asked.
 *
 * Null also where the id is on NEITHER seat, which is not a shape the route
 * produces and is the safe direction if it ever does: no offer is made, and the
 * game is written the way it was before any of this existed.
 */
export function offerLiftedOff<T extends OfferSeats>(
  seats: T,
  offerTo: string | null,
  now: Date = new Date(),
): OfferedSeats<T> {
  const seat = offerTo === null ? null : seatHolding(seats, offerTo);
  if (seat === null || offerTo === null) return { seats, offer: {}, seat: null };
  /*
   * `undefined` rather than `null`, and the cast is what says so. This value
   * goes into a Prisma `create`, where `undefined` means "say nothing about
   * this column" and `null` means "write a null" — the same thing here, but
   * only because the column has no default. Kept as the caller's own shape so
   * the route's seats, which name no nulls, stay that way.
   */
  const lifted = { ...seats, [`${seat}MemberId`]: undefined } as T;
  return { seats: lifted, offer: { offeredToMemberId: offerTo, offeredAt: now }, seat };
}

/**
 * Whether this reader is the person the offer was made to.
 *
 * "IS ON THIS SIDE OF IT", not "may still answer it" — the two were one
 * function for an hour and the queue caught it. Whether the offer stands is
 * `isOffered`, and `offerRefusal` below asks that FIRST, so a reader who was
 * offered a game they have already declined is still recognised as the person
 * it was offered to and is still told 409 rather than 404.
 */
export function isOfferedTo(row: OfferRow, memberId: string | null): boolean {
  if (memberId === null) return false;
  return offerState(row) !== null && row.offeredToMemberId === memberId;
}

/** Whether this reader is the person who made the offer. The same caveat. */
export function isOfferFrom(row: OfferRow & OfferSeats, memberId: string | null): boolean {
  if (memberId === null) return false;
  return offerState(row) !== null && offererId(row) === memberId;
}

/**
 * WHETHER THIS MEMBER MAY DO THIS TO THIS OFFER, and why not when they may
 * not.
 *
 * Every refusal the three routes can give, decided in one place on columns
 * they already hold. The order matters and each line earns its place:
 *
 *  1. **Not an offer at all.** The game is real but nothing here was proposed
 *     to anybody, so there is nothing to answer. 404: an offer's address is
 *     the match's address, and answering "409" would tell a stranger which
 *     games on this site are offers.
 *  2. **Already answered.** 409, not 404 — a declined offer is a real row
 *     that has moved on, and the person asking may simply have had two tabs
 *     open. This is also the race: two Accepts, one seat.
 *  3. **Not yours to answer.** An offer is addressed to ONE person by member
 *     id. Anybody else — signed in or not, watching or not — gets the same
 *     404 as a game that is not an offer, because "this is an offer but not
 *     to you" is a fact about somebody else's business.
 *  4. **Your own offer.** The offerer may withdraw and may not accept. This
 *     is stated rather than implied by (3): the offerer's own id is never the
 *     `offeredToMemberId`, so the check above would already refuse — but it
 *     would refuse with "no such offer" about a game they are sitting in,
 *     which reads as the site having lost their game.
 */
export function offerRefusal(
  row: (OfferRow & OfferSeats) | null,
  memberId: string | null,
  action: OfferAction,
): OfferRefusal | null {
  if (row === null) return "not-found";
  const state = offerState(row);
  if (state === null) return "not-an-offer";
  if (state !== OFFER_STATES.offered) return "answered";

  if (action === OFFER_ACTIONS.withdraw) {
    return isOfferFrom(row, memberId) ? null : "not-yours";
  }
  // Said before the addressing check so the offerer hears the true reason.
  if (isOfferFrom(row, memberId)) return "own-offer";
  if (!isOfferedTo(row, memberId)) return "not-yours";
  // An offer whose seat cannot be worked out is one nothing may bind.
  if (action === OFFER_ACTIONS.accept && offeredSeat(row) === null) return "no-seat";
  return null;
}

/**
 * WHICH SIDE OF AN OFFER THIS READER IS ON, or null for somebody who is on
 * neither.
 *
 * A rule and not copy, which is why it lives here: the two people in an offer
 * are told different things — one has a decision to make and the other has
 * nothing to do but wait or take it back — and every screen that shows an
 * offer has to decide which of them it is talking to. The sentences themselves
 * are in the constants beside their components.
 *
 * Null for a WATCHER, which is the answer that matters: an offer is addressed
 * to one person, and a stranger who has the address is shown the board and not
 * a word about who was asked.
 *
 * True for a REFUSED offer as well as a standing one — see `isOfferedTo`. Ask
 * `offerState` alongside this for what has actually become of it.
 */
export function offerIsMine(
  row: OfferRow & OfferSeats,
  memberId: string | null,
): "to-me" | "from-me" | null {
  if (isOfferedTo(row, memberId)) return "to-me";
  if (isOfferFrom(row, memberId)) return "from-me";
  return null;
}
