import type { RefusalCode } from "@/lib/api/refusal.types";

import type { OfferRefusal } from "./offers.types";

/**
 * WHAT EVERY SEAT-BOUND ROUTE SAYS ABOUT AN OFFER, in one wording.
 *
 * Moving, resigning, calling off, giving time and claiming a timeout all
 * refuse an unanswered offer, and all five say this — because they are all
 * refusing for one reason, and five sentences for one rule is five things that
 * can end up disagreeing. It names what to do instead, so the refusal is not a
 * dead end for whatever put the request together.
 */
export const OFFER_NOT_ACCEPTED: RefusalCode = "err.game.notAccepted";

/** 409: the game exists and is real, and is simply not a game yet. */
export const OFFER_NOT_ACCEPTED_STATUS = 409;

/**
 * WHAT EACH REFUSAL IS WORTH, AS ONE STATUS AND ONE SENTENCE.
 *
 * The three offer routes are the same shell over `offers.ts`, so their answers
 * are written once here rather than three times beside each other — the shape
 * `moves/route.ts` and `settings/route.ts` already use, for the same reason.
 *
 * THE TWO 404s ARE THE INTERESTING PART. "This game is not an offer" and "this
 * offer is not addressed to you" both answer 404 with the same words, and that
 * is deliberate: any other pairing turns this route into a way of asking which
 * games on the site are offers and who they were sent to. A person who really
 * is the offeree never meets either.
 *
 * `answered` is a 409 rather than a 404 because it is a real thing that has
 * moved on — two tabs, or two taps, or the other person withdrawing while the
 * page was open — and a reader who is told "no such offer" about a game they
 * were looking at a moment ago reads it as the site having lost something.
 */
export const OFFER_REFUSAL_STATUS: Record<OfferRefusal, number> = {
  "not-found": 404,
  "not-an-offer": 404,
  "not-yours": 404,
  answered: 409,
  "own-offer": 409,
  "no-seat": 409,
  "over-limit": 422,
};

export const OFFER_REFUSAL_MESSAGE: Record<OfferRefusal, RefusalCode> = {
  "not-found": "err.offer.none",
  "not-an-offer": "err.offer.none",
  "not-yours": "err.offer.none",
  answered: "err.offer.answered",
  "own-offer": "err.offer.own",
  "no-seat": "err.offer.noSeat",
  /* Replaced by `activeLimitRefusal`, which quotes the reader their own count. */
  "over-limit": "err.game.atLimit",
};
