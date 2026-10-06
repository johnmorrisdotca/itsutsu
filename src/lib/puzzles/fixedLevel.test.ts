import { describe, expect, it } from "vitest";

import { fixedLevelName, fixedLevelOf, levelsQueryOf, nextLevelLabel } from "./fixedLevel";

/** WHICH LEVEL A RUN IS OF, in the words a page says it in: a Tsunagi level with portals is kept past the first set's, and named for its number in its own. */
describe("a run's level", () => {
  it("is a Tsunagi level's number, its number in its set for a level with portals, and nothing for a seed that names none", () => {
    expect(fixedLevelOf("tsunagi", 12)).toBe(12);
    expect(fixedLevelOf("tsunagi", 1012)).toBe(12);
    expect(fixedLevelOf("tsunagi", 0)).toBeNull();
    expect(fixedLevelOf("meikyuu", 7)).toBe(7);
    expect(fixedLevelOf("gomoji", 7)).toBeNull();
  });

  it("is called Level 12, or Portal level 12", () => {
    expect(fixedLevelName("tsunagi", 12)).toBe("Level 12");
    expect(fixedLevelName("tsunagi", 1012)).toBe("Portal level 12");
    expect(fixedLevelName("meikyuu", 12)).toBe("Level 12");
    expect(fixedLevelName("tsunagi", -3)).toBeNull();
  });

  it("goes back to the board of levels it is in", () => {
    expect(levelsQueryOf("tsunagi", 7, 12)).toBe("?size=7");
    expect(levelsQueryOf("tsunagi", 7, 1012)).toBe("?size=7&set=portals");
  });

  it("says the level after plainly, and says why when the next one is further back", () => {
    expect(nextLevelLabel(3, 4)).toBe("Level 4 →");
    expect(nextLevelLabel(10, 1)).toBe("Level 1, the first one you have not finished →");
  });
});
