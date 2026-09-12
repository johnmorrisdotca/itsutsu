import { describe, expect, it } from "vitest";

import { levelShown } from "./levelShown";
import { XP_LEVELS, xpForLevel, xpLevelFor } from "./xpCurve";

/**
 * The rule that decides whether a level goes beside a name at all.
 *
 * Every case here is about the SILENCE, because that is the half a component
 * cannot be trusted with: `xpLevelFor` answers 1 for nought and for nonsense
 * alike, and a table that drew whatever it was handed would put "Lv 1 · Insert
 * Coin" on every row of a site whose XP is not backfilled yet.
 */
describe("the level worth printing beside a name", () => {
  it("says nothing for a member who has earned nothing", () => {
    /*
     * Not level 1. A member with no XP is on level 1 and printing it would be
     * true, which is exactly the trap — `xpBoard.ts` settled this for the
     * leaderboard and the reasoning is the same sideways: a column of identical
     * badges is a table about a default. Nobody is backfilled on any database
     * today, so this is the answer for nearly every row on the site.
     */
    expect(levelShown(0)).toBeNull();
  });

  it("says nothing for the programs, because they have earned nothing", () => {
    /*
     * `awardXp` refuses a program by name and the backfill skips them, so every
     * bot row carries exactly nought — which this rule already omits without
     * knowing what a bot is. The point of the case is that no `botTier` check
     * exists or is needed: a level-1 badge beside Meijin, who has played
     * hundreds of games, would read as a fact about its play and is not one.
     */
    expect(levelShown(0)).toBeNull();
  });

  it("says nothing for a total that is not a number, rather than level 1", () => {
    // `xpLevelFor` floors these to 1. A badge is not worth a plausible answer.
    expect(levelShown(Number.NaN)).toBeNull();
    expect(levelShown(Number.POSITIVE_INFINITY)).toBeNull();
    expect(levelShown(-40)).toBeNull();
  });

  it("answers the curve's own level for anybody who has earned anything", () => {
    // One point is a standing. It is level 1, and it is level 1 for a reason.
    expect(levelShown(1)).toBe(1);
    expect(levelShown(1)).toBe(xpLevelFor(1));
  });

  it("agrees with the curve at every rung's own floor", () => {
    for (let level = 2; level <= XP_LEVELS; level += 1) {
      expect(levelShown(xpForLevel(level))).toBe(level);
    }
  });

  it("never answers a level the ladder does not have", () => {
    // The top is the top: a total past the last rung stands on it.
    expect(levelShown(xpForLevel(XP_LEVELS) * 100)).toBe(XP_LEVELS);
  });
});
