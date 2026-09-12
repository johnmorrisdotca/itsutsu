import { describe, expect, it } from "vitest";

import { LEVEL_MILESTONES, ladderRung, levelLadder, levelXpRange } from "./levelLadder";
import { XP_LEVELS, XP_LEVEL_COST, xpForLevel, xpLevelFor } from "./xpCurve";

/**
 * The join between the hundred names and the hundred costs.
 *
 * Two tables that are deliberately independent meet here, and the thing that can
 * go wrong is an index: the costs array is "cost of reaching each level, level 1
 * first" while level 1 costs nothing to reach, so every offset is one further
 * along than it looks. The ladder is checked against `XP_LEVEL_COST` from the
 * other direction for that reason — if the step were read out with the wrong
 * offset, every row would be plausible and every row would be wrong.
 */
describe("levelXpRange", () => {
  it("spans from this level's cost up to the next one's", () => {
    const range = levelXpRange(5);
    expect(range).toEqual({ from: xpForLevel(5), to: xpForLevel(6) });
  });

  it("leaves no gap and no overlap between neighbouring levels", () => {
    for (let level = 1; level < XP_LEVELS; level += 1) {
      const here = levelXpRange(level)!;
      const next = levelXpRange(level + 1)!;
      expect(here.to, `level ${level} does not meet level ${level + 1}`).toBe(next.from);
    }
  });

  /*
   * The case this function exists for. `xpForLevel` clamps, so `xpForLevel(101)`
   * answers `xpForLevel(100)` — used as a ceiling that is an empty range, and
   * every member at the top of the ladder disappears from their own level's page
   * with nothing failing.
   */
  it("has no ceiling at the top, rather than a ceiling equal to its floor", () => {
    const top = levelXpRange(XP_LEVELS)!;
    expect(top.to).toBeNull();
    expect(top.from).toBe(xpForLevel(XP_LEVELS));
    expect(top.from).not.toBe(0);
  });

  it("starts at nothing, because level 1 is where everybody stands", () => {
    expect(levelXpRange(1)).toEqual({ from: 0, to: xpForLevel(2) });
  });

  it("puts every level's own floor at that level", () => {
    for (let level = 1; level <= XP_LEVELS; level += 1) {
      expect(xpLevelFor(levelXpRange(level)!.from), `level ${level}'s floor`).toBe(level);
    }
  });

  it("puts one XP below a level's floor on the level beneath it", () => {
    for (let level = 2; level <= XP_LEVELS; level += 1) {
      expect(xpLevelFor(levelXpRange(level)!.from - 1)).toBe(level - 1);
    }
  });

  it("is null for a level the ladder does not have", () => {
    expect(levelXpRange(0)).toBeNull();
    expect(levelXpRange(XP_LEVELS + 1)).toBeNull();
    expect(levelXpRange(12.5)).toBeNull();
    expect(levelXpRange(Number.NaN)).toBeNull();
  });
});

describe("ladderRung", () => {
  it("names the rung and says what it cost to climb", () => {
    const rung = ladderRung(2)!;
    expect(rung.level).toBe(2);
    expect(rung.name).toBe("Press Start");
    expect(rung.toReach).toBe(20);
    expect(rung.step).toBe(20);
  });

  it("charges nothing for level 1, because nobody climbed to it", () => {
    const first = ladderRung(1)!;
    expect(first.toReach).toBe(0);
    expect(first.step).toBe(0);
  });

  /*
   * The step read the other way round, from the costs table rather than from two
   * cumulative totals. `XP_LEVEL_COST[level - 2]` is the price of climbing INTO
   * `level`, which is the off-by-two the module refuses to write at a call site.
   */
  it("agrees with the costs table on every step of the climb", () => {
    for (let level = 2; level <= XP_LEVELS; level += 1) {
      expect(ladderRung(level)!.step, `the step into level ${level}`).toBe(
        XP_LEVEL_COST[level - 2],
      );
    }
  });

  it("marks the milestones and nothing else", () => {
    for (let level = 1; level <= XP_LEVELS; level += 1) {
      expect(ladderRung(level)!.milestone, `level ${level}`).toBe(
        LEVEL_MILESTONES.includes(level),
      );
    }
  });

  it("hands the kanji over as an empty string where there is none", () => {
    const top = ladderRung(XP_LEVELS)!;
    expect(top.kanji).toBe("神の一手");
    expect(ladderRung(1)!.kanji).toBe("");
  });

  it("is null for a level the ladder does not have", () => {
    expect(ladderRung(0)).toBeNull();
    expect(ladderRung(XP_LEVELS + 1)).toBeNull();
  });
});

describe("levelLadder", () => {
  it("is the hundred rungs, in order, with no gaps", () => {
    const rungs = levelLadder();
    expect(rungs).toHaveLength(XP_LEVELS);
    rungs.forEach((rung, index) => expect(rung.level).toBe(index + 1));
  });

  it("costs more at every rung than at the one below", () => {
    const rungs = levelLadder();
    for (let index = 1; index < rungs.length; index += 1) {
      expect(
        rungs[index].toReach,
        `level ${rungs[index].level} costs no more than level ${rungs[index - 1].level}`,
      ).toBeGreaterThan(rungs[index - 1].toReach);
    }
  });

  it("names every rung, so no row on the page reads as a number twice", () => {
    for (const rung of levelLadder()) {
      expect(rung.name.trim()).not.toBe("");
      expect(rung.name).not.toBe(`Level ${rung.level}`);
      expect(rung.note.trim()).not.toBe("");
    }
  });

  it("adds its steps up to what the top of the ladder costs", () => {
    const climbed = levelLadder().reduce((total, rung) => total + rung.step, 0);
    expect(climbed).toBe(xpForLevel(XP_LEVELS));
  });

  it("marks all five milestones and only those", () => {
    const marked = levelLadder()
      .filter((rung) => rung.milestone)
      .map((rung) => rung.level);
    expect(marked).toEqual([...LEVEL_MILESTONES]);
  });
});
