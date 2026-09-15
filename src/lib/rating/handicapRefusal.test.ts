import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NO_HANDICAP, NO_HEAD_START, STONES } from "@/lib/gomoku/gomoku.constants";
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

const black = { headStart: NO_HEAD_START, handicap: { ...NO_HANDICAP, stone: STONES.black, doubleThree: true } };
const white = { headStart: NO_HEAD_START, handicap: { ...NO_HANDICAP, stone: STONES.white, longerLine: true } };
const none = { headStart: NO_HEAD_START, handicap: NO_HANDICAP };

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
    const colourOnly = { headStart: NO_HEAD_START, handicap: { ...NO_HANDICAP, stone: STONES.black } };
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

describe("a head start", () => {
  const freeTurns = { handicap: NO_HANDICAP, headStart: { stone: STONES.white, freeTurns: 2, traditional: 0 } };
  const stones = { handicap: NO_HANDICAP, headStart: { stone: STONES.black, freeTurns: 0, traditional: 4 } };

  it("is refused a rating by the same rule, and named for what it is", () => {
    expect(handicapRefusal(freeTurns)).toBe(RATING_REFUSALS.headStart);
    expect(handicapRefusal(stones)).toBe(RATING_REFUSALS.headStart);
    expect(hasHandicap(freeTurns)).toBe(true);
    expect(draftRatingRefusal({ screen: false, ...freeTurns })).toBe(RATING_REFUSALS.headStart);
  });

  it("is named as harder rules where the stronger side took those too", () => {
    expect(handicapRefusal({ ...black, headStart: freeTurns.headStart })).toBe(RATING_REFUSALS.handicap);
  });

  it("gives nothing, and refuses nothing, where a colour is named with nothing given", () => {
    const empty = { handicap: NO_HANDICAP, headStart: { stone: STONES.black, freeTurns: 0, traditional: 0 } };
    expect(handicapRefusal(empty)).toBeNull();
  });

  it("has words that say head start, on every page that says why", () => {
    const display = RATING_REFUSAL_DISPLAY[RATING_REFUSALS.headStart];
    expect(display.playing).toBe("This game will not count");
    expect(display.filed).toBe("This game did not count");
    expect(display.sentence).toMatch(/head start/);
    expect(display.short).toMatch(/head start/);
  });
});
