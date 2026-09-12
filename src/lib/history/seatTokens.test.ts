import { describe, expect, it } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import { callersSeat, creationBody, withholdsASeat } from "./seatTokens";

/**
 * A SEAT THAT IS SOMEBODY ELSE'S IS NOT YOURS TO HOLD THE TOKEN FOR.
 *
 * This rule has been got wrong twice and both times SILENTLY: nothing fails,
 * nobody is refused, and a token simply arrives somewhere it should not — from
 * where its holder can move, resign, claim a timeout and give time as a seat
 * that is not theirs. One of those two mistakes wrote a rated loss onto a
 * permanent public record for a game the loser never played.
 *
 * So it is checked here without a request. The cases below are the whole rule,
 * and the two that used to be wrong are named as such.
 */

const ME = "member-me";
const THEM = "member-them";

const CREATED = { id: "k3m9-p2qx", blackToken: "tok-black", whiteToken: "tok-white" };

/** Nothing posted, nothing offered, both seats the caller's — the private game. */
const PRIVATE = { hotSeat: false, posted: false, offered: false, caller: ME };

describe("whether a creation's answer withholds a seat", () => {
  /*
   * THE CASE THAT MUST KEEP WORKING. A private game's other seat is unbound
   * because the caller has to send a LINK to whoever they mean to play — and
   * they cannot without the token. The first draft of the fix for the bug below
   * broke exactly this, and `both-seats.spec.ts` caught it immediately.
   */
  it("hands back both seats of a private game, which is the whole point of one", () => {
    expect(withholdsASeat({ ...PRIVATE, seats: { blackMemberId: ME } })).toBe(false);
  });

  /*
   * One token for both chairs, so every seat is the caller's — even where the
   * seats carry two different ids, which a hot-seat board's can. Checked with
   * the two ids present on purpose: `hotSeat` has to win over the bound test
   * below, and reading them in the other order would withhold a token from a
   * browser that is playing both colours with it.
   */
  it("hands back both seats of a board at one screen", () => {
    expect(
      withholdsASeat({ ...PRIVATE, hotSeat: true, seats: { blackMemberId: ME, whiteMemberId: THEM } }),
    ).toBe(false);
  });

  it("withholds a seat posted on the noticeboard, which is answered by sitting down", () => {
    expect(withholdsASeat({ ...PRIVATE, posted: true, seats: { blackMemberId: ME } })).toBe(true);
  });

  /*
   * THE FIRST BUG. A challenge binds white to another member's id, and the
   * condition used to read `open === true && !hotSeat` — which named the
   * noticeboard case rather than the rule. So the challenger was handed their
   * opponent's token and could resign on their behalf, crediting themselves a
   * rated win.
   */
  it("withholds a seat bound to somebody other than the caller", () => {
    expect(
      withholdsASeat({ ...PRIVATE, seats: { blackMemberId: ME, whiteMemberId: THEM } }),
    ).toBe(true);
  });

  /*
   * THE THIRD CASE, AND THE ONE OFFERS ADDED. An offered seat is UNBOUND, so
   * the test above stops seeing it — the same bug wearing a new shape. An offer
   * mints a way in for nobody: the offeree reaches their seat by member id once
   * it is theirs, and `acceptOffer` replaces the token at that moment.
   */
  it("withholds an offered seat, which is unbound and still not the caller's to give", () => {
    expect(withholdsASeat({ ...PRIVATE, offered: true, seats: { blackMemberId: ME } })).toBe(true);
  });

  it("still withholds an offered seat when the caller holds white, as a rematch leaves it", () => {
    expect(withholdsASeat({ ...PRIVATE, offered: true, seats: { whiteMemberId: ME } })).toBe(true);
  });

  /*
   * A BROWSER WITH NO ACCOUNT is not the holder of a bound seat, so a game
   * created with somebody's id on a seat withholds it from them — which is
   * right, and is what the signed-out creation paths already rely on.
   */
  it("withholds a bound seat from a caller with no account", () => {
    expect(
      withholdsASeat({ ...PRIVATE, caller: null, seats: { blackMemberId: ME } }),
    ).toBe(true);
  });
});

describe("which seat the caller is handed, when only one comes back", () => {
  it("is black where the caller holds black", () => {
    expect(callersSeat({ blackMemberId: ME, whiteMemberId: THEM }, ME)).toBe(STONES.black);
  });

  /*
   * A REMATCH SWAPS THE COLOURS (`seatsForRematch`: "They had black, so now I
   * do"), so the caller is white about half the time. Returning `blackToken`
   * for every withheld case would have handed them their OPPONENT'S token in
   * exactly those games — the same bug pointed the other way, and harder to
   * notice because it only appears on the second game between two people.
   */
  it("is white where a rematch has put the caller in white", () => {
    expect(callersSeat({ blackMemberId: THEM, whiteMemberId: ME }, ME)).toBe(STONES.white);
  });

  it("is white for an offer the caller made from the white seat", () => {
    // The offeree's id is lifted off, so white is the only seat with an id on it.
    expect(callersSeat({ whiteMemberId: ME }, ME)).toBe(STONES.white);
  });

  it("is black for a posted game, where the creator sits as black by construction", () => {
    expect(callersSeat({ blackMemberId: ME }, ME)).toBe(STONES.black);
    expect(callersSeat({}, null)).toBe(STONES.black);
  });
});

describe("what the creation answers with", () => {
  it("gives the whole game away when both seats are the caller's to give", () => {
    expect(creationBody(CREATED, false, STONES.black)).toEqual(CREATED);
  });

  it("gives one seat and its own token when a seat is withheld", () => {
    expect(creationBody(CREATED, true, STONES.black)).toEqual({
      id: CREATED.id,
      blackToken: "tok-black",
    });
  });

  it("gives the WHITE token to a caller sitting in white, never the black one", () => {
    const body = creationBody(CREATED, true, STONES.white);
    expect(body).toEqual({ id: CREATED.id, whiteToken: "tok-white" });
    expect(JSON.stringify(body)).not.toContain("tok-black");
  });

  /*
   * The assertion worth having, said as the rule rather than as a shape: a
   * withheld answer carries exactly one token, whichever seat it is.
   */
  it("never carries more than one token once anything is withheld", () => {
    for (const mine of [STONES.black, STONES.white] as const) {
      const body = creationBody(CREATED, true, mine);
      const tokens = Object.keys(body).filter((key) => key.endsWith("Token"));
      expect(tokens).toHaveLength(1);
    }
  });
});
