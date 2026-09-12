import { describe, expect, it } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import {
  NOT_A_REFUSED_OFFER,
  isOffered,
  isOfferFrom,
  isOfferedTo,
  offerIsMine,
  offerRefusal,
  offerState,
  offeredSeat,
  offererId,
  offererSeat,
  seatHolding,
  wasRefused,
} from "./offers";
import { OFFER_ACTIONS, OFFER_STATES } from "./offers.types";

/**
 * A game proposed to somebody: the offerer sits in one seat, the other is
 * offered by member id and bound to nobody.
 */
const ASKED = {
  blackMemberId: "mine",
  whiteMemberId: null,
  offeredToMemberId: "theirs",
  offeredAt: new Date("2026-09-12T10:00:00Z"),
  declinedAt: null,
  withdrawnAt: null,
};

/** The same game after acceptance: the offer is cleared and the seat is bound. */
const ACCEPTED = {
  blackMemberId: "mine",
  whiteMemberId: "theirs",
  offeredToMemberId: null,
  offeredAt: null,
  declinedAt: null,
  withdrawnAt: null,
};

const DECLINED = { ...ASKED, declinedAt: new Date("2026-09-12T11:00:00Z") };
const WITHDRAWN = { ...ASKED, withdrawnAt: new Date("2026-09-12T11:00:00Z") };

/**
 * An ordinary challenge as it was written before offers existed — and as every
 * one of the site's six thousand existing rows reads, with all four columns
 * absent rather than null. Both shapes must answer "not an offer".
 */
const BOUND = {
  blackMemberId: "mine",
  whiteMemberId: "theirs",
  offeredAt: undefined,
  declinedAt: undefined,
  withdrawnAt: undefined,
};

describe("what an offer is", () => {
  it("reads an unanswered offer as offered", () => {
    expect(offerState(ASKED)).toBe(OFFER_STATES.offered);
    expect(isOffered(ASKED)).toBe(true);
    expect(wasRefused(ASKED)).toBe(false);
  });

  it("says nothing at all about a game nobody was asked to play", () => {
    expect(offerState(BOUND)).toBeNull();
    expect(isOffered(BOUND)).toBe(false);
    expect(offerState({})).toBeNull();
  });

  /*
   * THE POINT OF CLEARING THE OFFER ON ACCEPTANCE. An accepted game must be
   * indistinguishable from a bound one, because a dozen queries on this site
   * read the seats to mean "a person is in this game" and none of them has
   * been told about offers.
   */
  it("reads an accepted game exactly as it reads an ordinary bound one", () => {
    expect(offerState(ACCEPTED)).toBeNull();
    expect(isOffered(ACCEPTED)).toBe(false);
    expect(wasRefused(ACCEPTED)).toBe(false);
    expect(offeredSeat(ACCEPTED)).toBeNull();
  });

  it("tells a decline from a withdrawal, which are two different things to say", () => {
    expect(offerState(DECLINED)).toBe(OFFER_STATES.declined);
    expect(offerState(WITHDRAWN)).toBe(OFFER_STATES.withdrawn);
    expect(wasRefused(DECLINED)).toBe(true);
    expect(wasRefused(WITHDRAWN)).toBe(true);
  });

  /*
   * A refused offer keeps `offeredAt` — that is how the row remembers who was
   * asked — so the order of the tests in `offerState` is load-bearing: read
   * the wrong way round, a declined offer would report as outstanding and
   * every guard in the site would let a move through.
   */
  it("does not read a refused offer as still outstanding", () => {
    expect(isOffered(DECLINED)).toBe(false);
    expect(isOffered(WITHDRAWN)).toBe(false);
  });

  it("excludes refused offers from a listing, and nothing else", () => {
    expect(NOT_A_REFUSED_OFFER).toEqual({ declinedAt: null, withdrawnAt: null });
  });
});

describe("which seat is being offered", () => {
  it("is the one with nobody in it", () => {
    expect(offeredSeat(ASKED)).toBe(STONES.white);
    expect(offererSeat(ASKED)).toBe(STONES.black);
    expect(offererId(ASKED)).toBe("mine");
  });

  /*
   * A REMATCH SWAPS THE COLOURS (`seatsForRematch`), so the offeree is black
   * about half the time. Anything reading "the white seat" would have offered
   * the offerer their own chair on every second game between two people.
   */
  it("follows the swap when a rematch puts the offerer in white", () => {
    const swapped = { ...ASKED, blackMemberId: null, whiteMemberId: "mine" };
    expect(offeredSeat(swapped)).toBe(STONES.black);
    expect(offererSeat(swapped)).toBe(STONES.white);
    expect(offererId(swapped)).toBe("mine");
  });

  /*
   * A rule that cannot measure must not fire. Neither shape below is one an
   * offer is ever created in — the offerer must be signed in, so their seat
   * always carries their id — and if one ever turns up, refusing is the safe
   * answer and binding a guess is not.
   */
  it("refuses to guess when both seats are loose", () => {
    expect(offeredSeat({ ...ASKED, blackMemberId: null })).toBeNull();
    expect(offererId({ ...ASKED, blackMemberId: null })).toBeNull();
  });

  it("refuses to guess when both seats are already somebody's", () => {
    expect(offeredSeat({ ...ASKED, whiteMemberId: "somebody" })).toBeNull();
  });

  it("finds the seat a member was written into, at creation", () => {
    expect(seatHolding(BOUND, "mine")).toBe(STONES.black);
    expect(seatHolding(BOUND, "theirs")).toBe(STONES.white);
    expect(seatHolding(BOUND, "nobody")).toBeNull();
  });
});

describe("which side of an offer a reader is on", () => {
  it("knows the person who was asked", () => {
    expect(isOfferedTo(ASKED, "theirs")).toBe(true);
    expect(offerIsMine(ASKED, "theirs")).toBe("to-me");
  });

  it("knows the person who asked", () => {
    expect(isOfferFrom(ASKED, "mine")).toBe(true);
    expect(offerIsMine(ASKED, "mine")).toBe("from-me");
  });

  /*
   * A WATCHER IS NEITHER, and must be told nothing. An offer is addressed to
   * one person; a stranger who has the address gets the board and no word
   * about who was asked.
   */
  it("says a stranger is on neither side", () => {
    expect(offerIsMine(ASKED, "somebody-else")).toBeNull();
    expect(offerIsMine(ASKED, null)).toBeNull();
    expect(isOfferedTo(ASKED, null)).toBe(false);
    expect(isOfferFrom(ASKED, null)).toBe(false);
  });

  it("says nobody is on a side of a game that is not an offer", () => {
    expect(offerIsMine(BOUND, "mine")).toBeNull();
    expect(offerIsMine(ACCEPTED, "theirs")).toBeNull();
  });

  /*
   * AND IT STILL KNOWS THE TWO PEOPLE AFTER THE OFFER IS OVER. This was wrong
   * for an hour and the queue's own test caught it: "is on this side of it" and
   * "may still answer it" were one function, so a declined offer read as
   * nobody's — and the queue then filed it under "Lately finished", in the
   * group whose hint says "Filed in the record", for a game in no record at
   * all. The offerer has to be told by name which of their offers was refused.
   */
  it("still knows both people once the offer has been answered", () => {
    expect(offerIsMine(DECLINED, "theirs")).toBe("to-me");
    expect(offerIsMine(DECLINED, "mine")).toBe("from-me");
    expect(offerIsMine(WITHDRAWN, "mine")).toBe("from-me");
    expect(offeredSeat(DECLINED)).toBe(STONES.white);
    expect(offererId(DECLINED)).toBe("mine");
  });
});

describe("who may answer an offer, and what they are told when they may not", () => {
  it("lets the person who was asked accept or decline", () => {
    expect(offerRefusal(ASKED, "theirs", OFFER_ACTIONS.accept)).toBeNull();
    expect(offerRefusal(ASKED, "theirs", OFFER_ACTIONS.decline)).toBeNull();
  });

  it("lets the offerer withdraw", () => {
    expect(offerRefusal(ASKED, "mine", OFFER_ACTIONS.withdraw)).toBeNull();
  });

  /*
   * THE OFFERER CANNOT ACCEPT THEIR OWN OFFER. Without this they would be
   * binding the other person's seat to themselves and playing both colours —
   * the same fault `wouldAnswerTheirOwnInvitation` closes for a posted seat,
   * and there the result reached the ladder as a game between two people.
   */
  it("refuses the offerer accepting their own offer, and says which it is", () => {
    expect(offerRefusal(ASKED, "mine", OFFER_ACTIONS.accept)).toBe("own-offer");
    expect(offerRefusal(ASKED, "mine", OFFER_ACTIONS.decline)).toBe("own-offer");
  });

  it("refuses the offeree withdrawing somebody else's offer", () => {
    expect(offerRefusal(ASKED, "theirs", OFFER_ACTIONS.withdraw)).toBe("not-yours");
  });

  /*
   * A STRANGER LEARNS NOTHING. "Not addressed to you" and "not an offer at
   * all" both answer the same 404 in `offers.constants.ts`, so this route
   * cannot be used to find out which games on the site are offers.
   */
  it("refuses everybody else, including a reader with no account", () => {
    expect(offerRefusal(ASKED, "somebody-else", OFFER_ACTIONS.accept)).toBe("not-yours");
    expect(offerRefusal(ASKED, null, OFFER_ACTIONS.accept)).toBe("not-yours");
    expect(offerRefusal(ASKED, null, OFFER_ACTIONS.decline)).toBe("not-yours");
    expect(offerRefusal(ASKED, null, OFFER_ACTIONS.withdraw)).toBe("not-yours");
  });

  it("refuses an answer to a game that was never an offer", () => {
    expect(offerRefusal(BOUND, "mine", OFFER_ACTIONS.accept)).toBe("not-an-offer");
    expect(offerRefusal(ACCEPTED, "theirs", OFFER_ACTIONS.accept)).toBe("not-an-offer");
  });

  it("refuses an answer to a game that is not there", () => {
    expect(offerRefusal(null, "theirs", OFFER_ACTIONS.accept)).toBe("not-found");
  });

  /*
   * THE RACE, AND THE SECOND TAB. Two Accepts on one seat, an Accept after the
   * offerer withdrew, a Decline on an offer already declined: all of them
   * answer `answered`, which the routes turn into a 409 rather than a 404,
   * because the game is a real thing that has moved on.
   */
  it("refuses a second answer to an offer already answered", () => {
    for (const row of [DECLINED, WITHDRAWN]) {
      expect(offerRefusal(row, "theirs", OFFER_ACTIONS.accept)).toBe("answered");
      expect(offerRefusal(row, "theirs", OFFER_ACTIONS.decline)).toBe("answered");
      expect(offerRefusal(row, "mine", OFFER_ACTIONS.withdraw)).toBe("answered");
    }
  });

  /*
   * And an offer whose seat cannot be worked out is one nothing may bind. It
   * may still be DECLINED — saying no to a question you cannot answer is
   * always available, and leaving somebody unable to refuse would be the worst
   * possible failure of a feature about refusing.
   */
  it("refuses to accept an offer whose seat cannot be told, but still lets it be declined", () => {
    const muddled = { ...ASKED, blackMemberId: null };
    expect(offerRefusal(muddled, "theirs", OFFER_ACTIONS.accept)).toBe("no-seat");
    expect(offerRefusal(muddled, "theirs", OFFER_ACTIONS.decline)).toBeNull();
  });
});
