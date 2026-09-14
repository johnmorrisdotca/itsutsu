import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NO_HANDICAP, STONES } from "@/lib/gomoku/gomoku.constants";
import { hasHandicap } from "@/lib/gomoku/rules/handicap";

import { draftRatingRefusal, handicapRefusal } from "./handicapRefusal";
import { RATING_REFUSALS, RATING_REFUSAL_DISPLAY } from "./rateable.constants";

/**
 * A HANDICAP GAME MOVES NOBODY'S RATING.
 *
 * A game with a handicap on either colour was rated like any other, so both
 * players' ratings moved over a game one of them had agreed to play on harder
 * rules. John, asked whether it should: "Fine don't".
 */

const black = { handicap: { ...NO_HANDICAP, stone: STONES.black, doubleThree: true } };
const white = { handicap: { ...NO_HANDICAP, stone: STONES.white, longerLine: true } };
const none = { handicap: NO_HANDICAP };

describe("handicapRefusal", () => {
  it("refuses a game with a handicap on either colour", () => {
    expect(handicapRefusal(black)).toBe(RATING_REFUSALS.handicap);
    expect(handicapRefusal(white)).toBe(RATING_REFUSALS.handicap);
  });

  it("says nothing about a game played straight", () => {
    expect(handicapRefusal(none)).toBeNull();
  });

  it("refuses a colour chosen with no toggle ticked yet, as the engine counts it", () => {
    // A colour named is a handicap in force for `hasHandicap`; the rating follows
    // the engine's answer rather than keeping a second opinion of its own.
    const colourOnly = { handicap: { ...NO_HANDICAP, stone: STONES.black } };
    expect(hasHandicap(colourOnly)).toBe(true);
    expect(handicapRefusal(colourOnly)).toBe(RATING_REFUSALS.handicap);
  });

  /*
   * WRITTEN SO A HEAD START IS COVERED BY THE SAME CHECK. A head-start handicap
   * will join `hasHandicap` and `HandicapTerms`; a refusal reading
   * `handicap.stone` for itself would go on rating a head-start game while the
   * engine said a handicap was in force. So the refusal is the engine's answer
   * and nothing else, and the source says so.
   */
  it("asks the engine's own hasHandicap, never the stone itself", () => {
    for (const game of [black, white, none]) {
      expect(handicapRefusal(game) !== null, JSON.stringify(game)).toBe(hasHandicap(game));
    }
    const source = readFileSync("src/lib/rating/handicapRefusal.ts", "utf8");
    const code = source
      .split("\n")
      .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"))
      .join("\n");
    expect(code).toContain("hasHandicap(");
    expect(code).not.toContain(".stone");
  });

  it("has words for the set-up screen, the board and the filed game", () => {
    const display = RATING_REFUSAL_DISPLAY[RATING_REFUSALS.handicap];
    expect(display.playing).toBe("This game will not count");
    expect(display.filed).toBe("This game did not count");
    expect(display.sentence).toMatch(/handicap/);
    expect(display.short).toMatch(/handicap/);
  });
});

describe("draftRatingRefusal", () => {
  it("refuses a board at one screen first, as the write path does", () => {
    expect(draftRatingRefusal({ screen: true, ...none })).toBe(RATING_REFUSALS.hotSeat);
    expect(draftRatingRefusal({ screen: true, ...black })).toBe(RATING_REFUSALS.hotSeat);
  });

  it("refuses a handicap chosen on the set-up screen", () => {
    expect(draftRatingRefusal({ screen: false, ...black })).toBe(RATING_REFUSALS.handicap);
    expect(draftRatingRefusal({ screen: false, ...white })).toBe(RATING_REFUSALS.handicap);
  });

  it("leaves every other game's rating to the choice the draft holds", () => {
    expect(draftRatingRefusal({ screen: false, ...none })).toBeNull();
  });
});
