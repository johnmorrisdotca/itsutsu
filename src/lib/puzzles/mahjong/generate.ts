import { bonusRuleOfSeed, freshAwaseSeed, generateAwase } from "@johnmorrisdotca/jarajara/awase";
import type { MahjongBonusRule } from "@johnmorrisdotca/jarajara";

import { ordinaryLevel } from "../ordinaryLevel";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { freshSeed, type Random } from "../random";

/**
 * MAHJONG'S DEALS ARE JARAJARA'S. The tiles, the layouts, the rules, the deal
 * and the check are `@johnmorrisdotca/jarajara`, the open-source package they
 * were taken out of this site into on 2026-10-01, where the solitaire is called
 * Awase. What is the site's own is here: a deal written as one of the site's
 * puzzles, and fresh seeds drawn the way every puzzle here draws them. Every
 * deal and table game the site made before the move is made again, exactly, by
 * the package's own tests (`site.fixture.test.ts` there).
 */
export { bonusRuleOfSeed };

/** A deal of Mahjong, as one of the site's puzzles: Jarajara's deal of Awase from this seed. */
export function generateMahjong(size: number, level: PuzzleLevel, seed: number): Puzzle {
  return { kind: "mahjong", ...generateAwase(size, ordinaryLevel(level), seed) };
}

/** A new seed for a deal under this rule, the usual rule's drawn as every puzzle's are. */
export function freshMahjongSeed(rule: MahjongBonusRule, random: Random = Math.random): number {
  return freshAwaseSeed(rule, random, freshSeed);
}
