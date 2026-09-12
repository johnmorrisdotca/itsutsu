import { describe, expect, it } from "vitest";

import { ratedButRefused } from "./ratedButRefused";
import { RATING_REFUSALS } from "./rateable.constants";

/** A finished, rated, two-different-people game: the shape that is CORRECT. */
const sound = {
  rated: true,
  status: "finished",
  blackToken: "token-a",
  whiteToken: "token-b",
  blackName: "Aki",
  whiteName: "Sumi",
};

describe("ratedButRefused", () => {
  it("says nothing about a finished rated game between two different people", () => {
    expect(ratedButRefused(sound)).toBeNull();
  });

  it("says nothing about a friendly: the column already agrees with what happened", () => {
    expect(ratedButRefused({ ...sound, rated: false })).toBeNull();
    expect(ratedButRefused({ ...sound, rated: false, whiteToken: "token-a" })).toBeNull();
  });

  it("catches the ten-of-twelve shape: hot seat, two ordinary, different names", () => {
    // One token in both seats. `ratingRefusal` alone reads two real people
    // here and would say this counted, which is how these rows went unnoticed.
    expect(ratedButRefused({ ...sound, whiteToken: "token-a" })).toBe(RATING_REFUSALS.hotSeat);
  });

  it("catches the John-versus-John shape, which is not hot seat at all", () => {
    expect(
      ratedButRefused({ ...sound, blackName: "John Morris", whiteName: "  john   morris " }),
    ).toBe(RATING_REFUSALS.onePlayer);
  });

  it("catches a seat nobody put a name on, and a name kept from before this site", () => {
    expect(ratedButRefused({ ...sound, blackName: "   " })).toBe(RATING_REFUSALS.unnamed);
    expect(ratedButRefused({ ...sound, whiteName: "Chibi" })).toBe(RATING_REFUSALS.keptRecord);
  });

  /*
   * THE ONE THAT MAKES THIS A FUNCTION RATHER THAN A `WHERE` CLAUSE.
   *
   * An active board can be refused today and rateable at the final stone: an
   * anonymous seat gets a name when somebody sits in it, and one person's two
   * spellings become two people as soon as the second seat is somebody else's.
   * Writing `rated: false` onto a live game decides it on the players' behalf,
   * so the audit must not see one at all — and a bare SQL `where rated` would.
   */
  it("refuses to judge a game still being played, however it reads today", () => {
    expect(ratedButRefused({ ...sound, status: "active", whiteToken: "token-a" })).toBeNull();
    expect(ratedButRefused({ ...sound, status: "active", whiteName: "Aki" })).toBeNull();
    expect(ratedButRefused({ ...sound, status: "active", whiteName: "" })).toBeNull();
  });

  it("is idempotent as a set: a row it has already fixed is not a row it finds", () => {
    // What the runner writes, read back. A second run must have nothing to do.
    const fixed = { ...sound, whiteToken: "token-a", rated: false };
    expect(ratedButRefused(fixed)).toBeNull();
  });
});
