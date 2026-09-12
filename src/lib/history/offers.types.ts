import type { Stone } from "@/lib/gomoku/gomoku.types";

/**
 * What an offer is, as its row holds it. Every field nullable, because every
 * one of them is absent on the games nobody was asked to play — which is
 * most of them.
 *
 * Written as a loose shape rather than a Prisma payload so the rules in
 * `offers.ts` can be checked without a database, the way `nextGame.ts` and
 * `seats.ts` are.
 */
export type OfferRow = {
  offeredToMemberId?: string | null;
  offeredAt?: Date | string | null;
  declinedAt?: Date | string | null;
  withdrawnAt?: Date | string | null;
};

/** Which seat is whose, for working out which one is the offered one. */
export type OfferSeats = {
  blackMemberId?: string | null;
  whiteMemberId?: string | null;
};

/**
 * WHAT AN OFFER HAS BECOME — four answers, and null for "this is not an
 * offer and never was".
 *
 * `accepted` is deliberately NOT one of them. Accepting clears the offer, so
 * an accepted game carries nothing for this to read; it is an ordinary game
 * and reads as one everywhere. See the schema's own note on `offeredAt`.
 */
export const OFFER_STATES = {
  /** Made, and nobody has answered it. The game exists; the other seat does not belong to anybody. */
  offered: "offered",
  /** The offeree said no. It cost them nothing, and there is no result. */
  declined: "declined",
  /** The offerer took it back before it was answered. */
  withdrawn: "withdrawn",
} as const;

export type OfferState = (typeof OFFER_STATES)[keyof typeof OFFER_STATES];

/** The three things that can be done about an offer, and by whom. */
export const OFFER_ACTIONS = {
  /** The offeree takes the seat. The game becomes an ordinary game. */
  accept: "accept",
  /** The offeree says no. Nothing is recorded against either of them. */
  decline: "decline",
  /** The offerer takes it back. */
  withdraw: "withdraw",
} as const;

export type OfferAction = (typeof OFFER_ACTIONS)[keyof typeof OFFER_ACTIONS];

/**
 * Why an answer was refused, or null for "go ahead".
 *
 * `not-an-offer` and `answered` are kept apart on purpose. A game that was
 * never an offer is a 404 — there is nothing here addressed to you — while
 * an offer somebody has already answered is a 409, because the request was
 * about a real thing that has simply moved on. Folding them together would
 * either announce which game ids are offers or turn a race into a 404.
 */
export type OfferRefusal =
  | "not-found"
  | "not-an-offer"
  | "answered"
  | "not-yours"
  | "own-offer"
  | "no-seat"
  /**
   * They hold as many boards as this site allows at once.
   *
   * Its own reason and not folded into `answered`, because it is the one
   * refusal that carries a sentence of its own — `activeLimitRefusal` quotes
   * the reader their own count — and because it is the only one that will not
   * be true tomorrow. Accepting is refused; the offer is left standing.
   */
  | "over-limit";

export type OfferOutcome =
  | { ok: true; seat: Stone; variant: string }
  | { ok: false; reason: OfferRefusal; said?: string };
