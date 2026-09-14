import { describe, expect, it } from "vitest";

import { levelShown, xpShown } from "./levelShown";
import { XP_LEVELS, xpForLevel, xpLevelFor } from "./xpCurve";

/**
 * THE RULE THAT DECIDES WHETHER A STANDING GOES BESIDE A NAME, AND WHAT IT IS.
 *
 * Every case here used to be about the SILENCE, because nought answered null.
 * John reversed that — "Everyone is level 1 if 0xp." — so the cases below are
 * about the two things now left to get wrong: a program wearing a rung it can
 * never climb, and nonsense being floored to a plausible level.
 *
 * The two functions are tested together on purpose. They are one fact seen twice
 * and a row showing `Lv 1` beside a dash would be that fact contradicting
 * itself, so every case asserts both.
 */
describe("the standing worth printing beside a name", () => {
  it("puts everybody who has earned nothing on level 1, which is where they stand", () => {
    /*
     * THE REVERSAL, IN ONE CASE. This asserted `toBeNull()` for releases, on
     * `xpBoard.ts`'s argument that a column of identical badges is a table about
     * a default. That argument is about who the LEADERBOARD lists; a badge beside
     * a name is not a list, and hiding level 1 tells a member who has just
     * arrived that the ladder does not include them. Level 1 is called Insert
     * Coin because it is where a person starts.
     */
    expect(levelShown({ xp: 0 })).toBe(1);
    // And the total is a number, not a blank: nought earned is a fact about them.
    expect(xpShown({ xp: 0 })).toBe(0);
  });

  it("puts a program where its total puts it, like anyone — John: bots have XP", () => {
    /*
     * This used to answer null for a member with an engine name, and `awardXp`
     * refused to pay one. John, on the live site: "i still don't see Levels
     * for all equally and bots don't have XP". A program earns from its games
     * and stands on the same ladder; there is no second question here about
     * WHO, so the type no longer carries an engine name at all.
     */
    expect(levelShown({ xp: 0 })).toBe(1);
    expect(xpShown({ xp: 0 })).toBe(0);
    expect(levelShown({ xp: 5_000 })).toBeGreaterThan(1);
    expect(xpShown({ xp: 5_000 })).toBe(5_000);
  });

  it("says nothing for a total that is not a number, rather than level 1", () => {
    /*
     * `xpLevelFor` floors all three of these to 1 — a perfectly valid level that
     * also means "nobody has earned anything yet". A rule that cannot measure
     * must not fire: silence is the safe answer, zero is the dangerous one. This
     * is the one case the reversal above does NOT touch, because nought is a
     * measurement and NaN is the absence of one.
     */
    for (const xp of [Number.NaN, Number.POSITIVE_INFINITY, -40]) {
      expect(levelShown({ xp })).toBeNull();
      expect(xpShown({ xp })).toBeNull();
    }
  });

  it("answers the curve's own level for anybody who has earned anything", () => {
    expect(levelShown({ xp: 1 })).toBe(1);
    expect(levelShown({ xp: 1 })).toBe(xpLevelFor(1));
    expect(xpShown({ xp: 1 })).toBe(1);
  });

  it("agrees with the curve at every rung's own floor", () => {
    for (let level = 2; level <= XP_LEVELS; level += 1) {
      expect(levelShown({ xp: xpForLevel(level) })).toBe(level);
    }
  });

  it("never answers a level the ladder does not have", () => {
    // The top is the top: a total past the last rung stands on it, and the total
    // itself is still printed as the number it is.
    const past = xpForLevel(XP_LEVELS) * 100;
    expect(levelShown({ xp: past })).toBe(XP_LEVELS);
    expect(xpShown({ xp: past })).toBe(past);
  });
});
