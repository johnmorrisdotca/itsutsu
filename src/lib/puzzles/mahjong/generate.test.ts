import { describe, expect, it } from "vitest";

import { AWASE_SAME_BLOCK, generateAwase } from "@johnmorrisdotca/jarajara/awase";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_LEVEL_LIST } from "../puzzles.constants";
import { seededRandom } from "../random";
import { bonusRuleOfSeed, freshMahjongSeed, generateMahjong } from "./generate";

/**
 * What the site keeps of Mahjong now its rules are Jarajara's: a deal written
 * as the site's puzzle, the check the server makes before it pays, and fresh
 * seeds drawn under each bonus rule. The rules themselves are tested in the
 * package, every deal the site made before the move among them.
 */
describe("Mahjong on the site, dealt by Jarajara", () => {
  it("is Jarajara's deal of Awase, written as one of the site's puzzles", () => {
    for (const level of PUZZLE_LEVEL_LIST) {
      expect(generateMahjong(15, level, 20260929)).toEqual({ kind: "mahjong", ...generateAwase(15, level, 20260929) });
    }
  });

  it("pays for a deal cleared by its own answer, and refuses one left unfinished", () => {
    const deal = generateMahjong(8, "medium", 4242);
    expect(checkSolution("mahjong", deal.size, deal.givens, deal.solution)).toEqual({ ok: true });
    expect(checkSolution("mahjong", deal.size, deal.givens, deal.solution.slice(0, -4)).ok).toBe(false);
  });

  it("draws a fresh seed under the rule asked for", () => {
    const random = seededRandom(7);
    for (let n = 0; n < 50; n += 1) {
      expect(bonusRuleOfSeed(freshMahjongSeed("group", random))).toBe("group");
      const same = freshMahjongSeed("same", random);
      expect(bonusRuleOfSeed(same)).toBe("same");
      expect(same).toBeGreaterThanOrEqual(AWASE_SAME_BLOCK.from);
    }
  });
});
