import { levelsFor, sizesOffered } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { price } from "./ladder";
import { KUMIMOJI_TILES_LEAST, KUMIMOJI_TILES_MOST, LEVELS_A_SIZE, PUZZLE_PRICING } from "./ladder.constants";

/**
 * THE LEAST AND THE MOST A PUZZLE PAYS across everything its set-up offers:
 * its smallest size at its easiest level to its biggest at its hardest, a
 * family of fixed levels from its first level to its last, a Kumimoji from its
 * shortest bag to its longest. Read from the ladder itself, for the page that
 * tells a reader what a puzzle is worth.
 */
export function puzzlePriceRange(kind: PuzzleKind): { least: number; most: number } {
  if (kind === "kumimoji") {
    return { least: price(kind, 0, "easy", undefined, KUMIMOJI_TILES_LEAST), most: price(kind, 0, "hard", undefined, KUMIMOJI_TILES_MOST) };
  }
  const ranked = PUZZLE_PRICING[kind].how === "ranked";
  const prices: number[] = [];
  for (const size of sizesOffered(kind)) {
    for (const level of levelsFor(kind, size)) {
      prices.push(price(kind, size, level, ranked ? (level === "easy" ? 1 : level === "hard" ? LEVELS_A_SIZE : undefined) : undefined));
    }
  }
  return { least: Math.min(...prices), most: Math.max(...prices) };
}
