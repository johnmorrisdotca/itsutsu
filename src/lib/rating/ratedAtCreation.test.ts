import { describe, expect, it } from "vitest";

import { ratedAtCreation } from "./ratedAtCreation";

/** Nothing said by anybody: the shape a posted seat and a challenge send. */
const silence = { requested: undefined, carried: undefined, hotSeat: false };

describe("ratedAtCreation", () => {
  it("takes silence as yes, which is what a posted seat has always meant", () => {
    // `StartGame` and `ChallengeButton` send neither field. Both must go on
    // making rated games exactly as they always have.
    expect(ratedAtCreation(silence)).toBe(true);
  });

  it("honours a request either way", () => {
    expect(ratedAtCreation({ ...silence, requested: true })).toBe(true);
    expect(ratedAtCreation({ ...silence, requested: false })).toBe(false);
  });

  it("lets the game this one came out of speak over the request", () => {
    // A rematch is the same game: what it carries wins. A fork whose caller
    // settled the pace arrives with nothing carried, so it never reaches here.
    expect(ratedAtCreation({ requested: true, carried: false, hotSeat: false })).toBe(false);
    expect(ratedAtCreation({ requested: false, carried: true, hotSeat: false })).toBe(true);
  });

  /*
   * THE CLAUSE THE TWELVE PRODUCTION ROWS BOUGHT.
   *
   * A hot-seat game can never move a rating at any point in its life — every
   * write path checks `isHotSeat` before `recordResult`, and a game's two
   * tokens are written once and never rewritten. So `rated: true` on one is
   * not a preference, it is a claim that cannot come true, and nothing may
   * set it: not the caller, not the game it was forked out of.
   */
  it("refuses a rating for a game at one screen, whoever asks", () => {
    expect(ratedAtCreation({ ...silence, hotSeat: true })).toBe(false);
    expect(ratedAtCreation({ requested: true, carried: undefined, hotSeat: true })).toBe(false);
    expect(ratedAtCreation({ requested: undefined, carried: true, hotSeat: true })).toBe(false);
    expect(ratedAtCreation({ requested: true, carried: true, hotSeat: true })).toBe(false);
  });

  it("tells 'nobody said' apart from 'somebody said no', in both sources", () => {
    // The distinction the whole signature exists for: an absent `rated`
    // becoming a rated game is the original fault, and a boolean that means
    // both "no" and "nothing said" is how it happened.
    expect(ratedAtCreation({ requested: undefined, carried: false, hotSeat: false })).toBe(false);
    expect(ratedAtCreation({ requested: false, carried: undefined, hotSeat: false })).toBe(false);
    expect(ratedAtCreation({ requested: undefined, carried: undefined, hotSeat: false })).toBe(true);
  });
});
