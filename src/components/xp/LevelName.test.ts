import { describe, expect, it } from "vitest";

import { XP_LEVELS } from "@/lib/xp/xpCurve";

import { levelBadge } from "./LevelName";

/**
 * What the badge beside a player's name says, and where it goes.
 *
 * The component itself is JSX and these tests run in node, so what is checked is
 * the function the component draws from — the same arrangement `PlayerRecord.tsx`
 * uses for `playedScopeNote`. The one that matters is `href`: a badge for a level
 * past the top of the ladder must not link to a page that would 404, and the
 * difference between "shown without a link" and "not shown" is invisible in a
 * screenshot.
 */
describe("levelBadge", () => {
  it("puts the number and the name together, number first", () => {
    expect(levelBadge(1).shown).toBe("1 · Insert Coin");
    expect(levelBadge(XP_LEVELS).shown).toBe("100 · Divine Move");
  });

  it("drops the name and keeps the number when a cell is narrow", () => {
    expect(levelBadge(42, true).shown).toBe("42");
    expect(levelBadge(XP_LEVELS, true).shown).toBe("100");
  });

  it("keeps the name available on hover even when it is not on screen", () => {
    const compact = levelBadge(XP_LEVELS, true);
    expect(compact.shown).toBe("100");
    expect(compact.whole).toContain("Divine Move");
    expect(compact.label).toContain("Divine Move");
  });

  it("pairs the kanji into the hover where the level has one", () => {
    expect(levelBadge(XP_LEVELS).whole).toBe("Divine Move 神の一手");
    expect(levelBadge(XP_LEVELS).label).toBe("Level 100, Divine Move 神の一手");
  });

  it("says the name alone where the level has no kanji", () => {
    expect(levelBadge(1).whole).toBe("Insert Coin");
    expect(levelBadge(1).label).toBe("Level 1, Insert Coin");
  });

  it("links every level the ladder actually has", () => {
    for (let level = 1; level <= XP_LEVELS; level += 1) {
      expect(levelBadge(level).href).toBe(`/xp/levels/${level}`);
    }
  });

  /*
   * The reason this component has a test at all. `/xp/levels/101` is a 404, so a
   * badge that linked there would be a promise the site cannot keep — worse, per
   * AGENTS.md, than printing the number plain.
   */
  it("refuses to link a level that has no page", () => {
    expect(levelBadge(XP_LEVELS + 1).href).toBeNull();
    expect(levelBadge(0).href).toBeNull();
    expect(levelBadge(-3).href).toBeNull();
    expect(levelBadge(7.5).href).toBeNull();
    expect(levelBadge(Number.NaN).href).toBeNull();
  });

  it("still says something legible for a level it cannot link", () => {
    expect(levelBadge(XP_LEVELS + 1).shown).toBe("101 · Level 101");
    expect(levelBadge(XP_LEVELS + 1).whole).toBe("Level 101");
  });

  it("never throws and never shows an empty badge", () => {
    for (const level of [0, 1, 100, 101, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => levelBadge(level)).not.toThrow();
      expect(levelBadge(level).shown.trim()).not.toBe("");
      expect(levelBadge(level).whole.trim()).not.toBe("");
    }
  });
});
