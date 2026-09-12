import { describe, expect, it } from "vitest";

import { HANDICAP_RULES, STONES, VARIANT_SPECS } from "./gomoku.constants";
import type { RuleVariant } from "./gomoku.types";
import { handicapOffer } from "./handicapOffer";

/**
 * Whether a handicap toggle is a choice at this game, for this colour.
 *
 * The same question is now asked in two places — the local board's panel, and
 * the setup screen, where a handicap can be agreed before the game exists — so
 * the answer lives in one module and this is where it is held to account.
 */
describe("what a handicap can be asked for", () => {
  it("offers a restriction the plain game does not impose", () => {
    const offer = handicapOffer("doubleThree", "freestyle", STONES.black);
    expect(offer.available).toBe(true);
    expect(offer.imposed).toBe(false);
    expect(offer.note).toBeNull();
  });

  /*
   * Renju forbids the double three for black already, so there is nothing to
   * ask. It still shows, as answered rather than as open: a reader comparing
   * renju with gomoku wants to see that renju imposes it, not find the row
   * missing.
   */
  it("shows a rule the game already imposes as settled rather than hiding it", () => {
    const forbidden = VARIANT_SPECS.renju.forbidden[STONES.black];
    expect(forbidden, "renju forbids black the double three").toContain("doubleThree");

    const offer = handicapOffer("doubleThree", "renju", STONES.black);
    expect(offer.available).toBe(false);
    expect(offer.imposed).toBe(true);
    expect(offer.note).toContain("Renju");
  });

  /* And for the OTHER colour of the same game it is a real choice again. */
  it("answers per colour, not per game", () => {
    expect(handicapOffer("doubleThree", "renju", STONES.white).available).toBe(true);
  });

  /*
   * A toggle about captures in a game without captures is not a choice, and it
   * is not "already a rule of" the game either — it is about a mechanism that is
   * not there. So it says which, rather than saying the game imposes something
   * the game has never heard of.
   */
  it("says when a toggle is about a mechanism the game does not have", () => {
    const captures = handicapOffer("noCaptures", "freestyle", STONES.black);
    expect(captures.available).toBe(false);
    expect(captures.imposed).toBe(false);
    expect(captures.note).toContain("captures");

    const two = handicapOffer("singleStone", "freestyle", STONES.black);
    expect(two.available).toBe(false);
    expect(two.imposed).toBe(false);
    expect(two.note).toContain("two stones");
  });

  it("offers both of those where the game does have the mechanism", () => {
    expect(VARIANT_SPECS.ninuki.captures, "ninuki captures").toBe(true);
    expect(handicapOffer("noCaptures", "ninuki", STONES.black).available).toBe(true);
    expect(VARIANT_SPECS.connect6.stonesPerTurn, "connect six places two a turn").toBeGreaterThan(1);
    expect(handicapOffer("singleStone", "connect6", STONES.black).available).toBe(true);
  });

  /* A longer line can always be asked for: every game here has a line length. */
  it("always offers a longer line", () => {
    for (const variant of ["freestyle", "renju", "reversi", "halma"] as RuleVariant[]) {
      expect(handicapOffer("longerLine", variant, STONES.black).available).toBe(true);
    }
  });

  /*
   * Every rule, every game, both colours — because the setup screen renders the
   * whole list for whatever game is chosen, and a `switch` that fell through for
   * one of forty variants would be an undefined read in a component.
   */
  it("answers for every rule at every game, for both colours", () => {
    for (const variant of Object.keys(VARIANT_SPECS) as RuleVariant[]) {
      for (const stone of Object.values(STONES)) {
        for (const rule of HANDICAP_RULES) {
          const offer = handicapOffer(rule, variant, stone);
          expect(typeof offer.available, `${variant}/${stone}/${rule}`).toBe("boolean");
          // A toggle that is not a choice always says why; one that is says nothing.
          expect(offer.available ? offer.note === null : offer.note !== null).toBe(true);
        }
      }
    }
  });
});
