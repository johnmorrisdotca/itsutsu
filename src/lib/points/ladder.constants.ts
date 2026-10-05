import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/**
 * THE PUZZLE LADDER: what one solve is worth in IP before help is taken off.
 * Every puzzle is priced on one scale, 50 for the smallest and easiest offering
 * of a kind, up to 150 for its biggest and hardest (200 for the three families
 * of 256 fixed levels). John, 2026-10-05: puzzle points "on one ladder", so a
 * Number Place and a Gomoji and a maze are worth what they ask, not what each
 * one's own scoring happens to print.
 *
 * HOW THE RUNGS WERE SET. A kind's size rungs run from 50 at the smallest size
 * it offers to 125 at the largest, spaced geometrically by the work a size
 * measured to take (the mean points its solves were worth, over every level):
 * a size that takes twice the work of its neighbour sits further up, but never
 * a hundred times further. The measurements are in docs/plans/points/PTS-04.
 * The level then adds to the rung: Easy nothing, Medium 10, Hard 25 and, for the
 * puzzles that have one (the Pencil puzzles and Jirai, 2026-10-05), Extra hard 40,
 * so a kind's top price is 150: a rung that would go past it stops there, which is
 * the biggest size's Hard and Extra hard being the same 150. A kind that is only made at one level adds nothing.
 *
 * THE FAMILIES OF 256 LEVELS (Meikyuu, Suido, Tsunagi) are the same for every
 * player, ordered easiest to hardest, so a level's own place in the order
 * adds 0 to 50 on its size's rung, up to 200 at the top.
 *
 * All of it is read at the moment IP is counted (`ipBoards.ts`), never stored,
 * so a change here reprices every solve ever kept.
 */

/** What a level adds to a size's rung, by the level's own name. */
export const LEVEL_ADD: Readonly<Record<PuzzleLevel, number>> = { easy: 0, medium: 10, hard: 25, "extra-hard": 40 };

/** The most any puzzle can be worth, and the most a family of fixed levels can. */
export const PUZZLE_PRICE_MOST = 150;
export const LEVEL_FAMILY_PRICE_MOST = 200;

/** The least any puzzle is worth. */
export const PUZZLE_PRICE_LEAST = 50;

/** What a Check or a Hint costs a cell puzzle's score (`POINTS_A_HELP`, held equal by a test); the price is scaled by what it left. */
export const HELP_COST = 50;

/** The tiles in a Kumimoji's short bag by the hand it opens with: the least a game of that hand can have. */
export const KUMIMOJI_SHORT_BAG: Readonly<Record<number, number>> = { 3: 5, 7: 40, 11: 50 };

/** What a family of fixed levels adds on its size's rung at its last level; the first adds nothing. */
export const RANK_ADD_MOST = 50;

/** A family's levels in a size. */
export const LEVELS_A_SIZE = 256;

/**
 * A kept solve names the third of its size's levels it was in (easy, medium,
 * hard), not the level's own number, so a solve read back is priced at the
 * middle of its third: levels 43, 128 and 213 of 256.
 */
export const RANK_OF_THIRD: Readonly<Record<PuzzleLevel, number>> = { easy: 43, medium: 128, hard: 213, "extra-hard": 213 };

/** Rungs by size: what the easiest level of that size is worth. */
export type Rungs = Readonly<Record<number, number>>;

/** How a kind is priced. */
export type Pricing =
  /** A rung for each size, and a level's add on top. */
  | { how: "size"; rungs: Rungs; full?: Reference }
  /** A rung for each size, and the place of the level among 256 on top: Meikyuu, Suido, Tsunagi. */
  | { how: "ranked"; rungs: Rungs }
  /** Kumimoji: the rung is read from the tiles in the bag (`kumimojiRung`), and a level's add on top. */
  | { how: "tiles"; full: Reference };

/**
 * The points a good solve of a puzzle that does not score by the cell scores
 * on its own board, which its share of the price is read against. A word, a
 * tile game and Koushi are scored by speed and tidiness as well as by finishing,
 * and the price is scaled by how much of this they scored (`solveIp`).
 */
export type Reference = { each: number; per: "size" | "tile" | "solve" };

const WORD_RUNGS: Rungs = { 4: 50, 5: 90, 6: 125 };

/** The words are scored about 160 a letter by a good solve (about 800 for five letters). */
const WORD: Reference = { each: 160, per: "size" };

/** Kumimoji: ten a tile and up to as much again for speed, so 15 a tile for a middling pace. */
const TILES: Reference = { each: 15, per: "tile" };

/** Koushi's middle solve (500, three swaps spare, a quick time) is about 880. */
const KOUSHI: Reference = { each: 880, per: "solve" };

export const PUZZLE_PRICING: Record<PuzzleKind, Pricing> = {
  numberPlace: { how: "size", rungs: { 4: 50, 6: 75, 9: 100, 16: 125 } },
  jigsaw: { how: "size", rungs: { 5: 50, 6: 70, 7: 90, 9: 125 } },
  diagonal: { how: "size", rungs: { 6: 50, 9: 125 } },
  sumCages: { how: "size", rungs: { 6: 50, 9: 125 } },
  moreOrLess: { how: "size", rungs: { 4: 50, 5: 80, 6: 105, 7: 125 } },
  towers: { how: "size", rungs: { 4: 50, 5: 80, 6: 105, 7: 125 } },
  // Sizes 5, 6, 8 and 10 are made and kept but not offered: between the measured ones.
  hiddenStones: { how: "size", rungs: { 4: 50, 5: 65, 6: 75, 7: 90, 8: 100, 9: 105, 10: 110, 12: 125 } },
  blackAndWhite: { how: "size", rungs: { 6: 50, 8: 80, 10: 105, 12: 125 } },
  // Rungs by the log of the cells (49 to 625), 50 at 7×7 and 125 at 25×25.
  bridges: { how: "size", rungs: { 7: 50, 9: 65, 11: 75, 13: 85, 17: 100, 21: 115, 25: 125 } },
  // Rungs by the log of the cells to decide (25 to 2,500), 50 at 5×5 and 125 at 50×50; 40×40 and 50×50 come at easy and medium only, so 135 at most.
  pictureLogic: { how: "size", rungs: { 5: 50, 10: 75, 15: 85, 20: 95, 40: 120, 50: 125 } },
  // The square of four tiles across is the browser tests' own, never offered.
  mahjong: { how: "size", rungs: { 4: 50, 8: 50, 9: 90, 10: 110, 15: 125 } },
  cube: { how: "size", rungs: { 2: 50, 3: 85, 4: 105, 5: 125 } },
  // A word is as long as its size: four to six letters (Kana three to five; Pop three to seven).
  gomoji: { how: "size", rungs: WORD_RUNGS, full: WORD },
  gomojiMot: { how: "size", rungs: WORD_RUNGS, full: WORD },
  gomojiWort: { how: "size", rungs: WORD_RUNGS, full: WORD },
  gomojiKana: { how: "size", rungs: { 3: 50, 4: 90, 5: 125 }, full: WORD },
  gomojiPop: { how: "size", rungs: { 3: 50, 4: 80, 5: 105, 6: 125, 7: 125 }, full: WORD },
  koushi: { how: "size", rungs: { 5: 100 }, full: KOUSHI },
  // A size is how many cards the stock turns: Draw 3 asks a little more than Draw 1.
  solitaire: { how: "size", rungs: { 1: 100, 3: 110 } },
  // A size is how many free cells there are: fewer is harder.
  freecell: { how: "size", rungs: { 4: 50, 3: 100, 2: 150 } },
  // A size is how many suits the decks are made of: more is harder.
  spider: { how: "size", rungs: { 1: 50, 2: 100, 4: 150 } },
  // A size is how many jumps its shortest way has; its levels within a length are boards and goals, not difficulty, so no level adds.
  tobiishi: { how: "size", rungs: { 3: 50, 6: 85, 9: 125 } },
  /*
   * The pencil puzzles (`pencil/`, 2026-10-05), four levels each (Kazu 1.3.0), rungs spaced by the work in a size: the cells to mark
   * (Shikaku and Akari 25, 49, 100, 196; Hitori 25, 49, 81, 144; Loop's edges 60, 112, 220; the white cells of Cross Sums about 17 to 85, and
   * the squares of a Regions board 36 to 144), 50 for the smallest to 125 for the biggest. A size's Hard and Extra hard are both 150 at the top
   * rung, which the ceiling holds (`PUZZLE_PRICE_MOST`).
   */
  shikaku: { how: "size", rungs: { 5: 50, 7: 70, 10: 95, 14: 125 } },
  akari: { how: "size", rungs: { 5: 50, 7: 70, 10: 95, 14: 125 } },
  loop: { how: "size", rungs: { 5: 50, 7: 85, 10: 125 } },
  hitori: { how: "size", rungs: { 5: 50, 7: 70, 9: 90, 12: 125 } },
  crossSums: { how: "size", rungs: { 6: 50, 8: 75, 10: 100, 12: 125 } },
  regions: { how: "size", rungs: { 6: 50, 8: 75, 10: 100, 12: 125 } },
  jirai: { how: "size", rungs: { 7: 50, 9: 65, 12: 95, 16: 125 } },
  kumimoji: { how: "tiles", full: TILES },
  tsunagi: { how: "ranked", rungs: { 4: 50, 5: 70, 6: 85, 7: 95, 8: 110, 9: 110, 10: 120, 11: 130, 12: 130, 13: 140, 14: 150, 15: 150 } },
  // The squares 5 to 14 and the long boards 5×7, 6×10 and 8×14 (kept as 507, 610 and 814).
  suido: { how: "ranked", rungs: { 5: 50, 6: 70, 7: 85, 8: 95, 9: 110, 10: 120, 11: 130, 12: 130, 13: 140, 14: 150, 507: 65, 610: 90, 814: 120 } },
  // The four square sizes (small to huge, 1 to 4) and the six tall ones (609 is 6×9), and the two colossal ones (2026-10-05, package 2.1): the square list is size 5, the top rung of the squares
  // (160, so its hardest levels reach the 200 ceiling a family of levels has), and the tall list is 6496 (64×96), the top rung of the tall ones (110). A solve is priced at the middle of the third of its list it was in, as every family's is, however many levels the list has (the colossal lists have 128).
  meikyuu: { how: "ranked", rungs: { 1: 55, 2: 95, 3: 120, 4: 150, 5: 160, 609: 50, 812: 60, 1015: 70, 1218: 80, 1624: 90, 2030: 100, 6496: 110 } },
};

/**
 * Kumimoji's rung from the tiles in its bag, 50 at 40 tiles and 125 at 288
 * (the longest game of the double set), spaced geometrically, to 5. Less than
 * 40 is 50 and more than 288 is 125.
 */
export const KUMIMOJI_TILES_LEAST = 40;
export const KUMIMOJI_TILES_MOST = 288;

/** The kinds whose levels are a place among 256, and the sizes of each that go in separate series. */
export const SIZE_SERIES: Partial<Record<PuzzleKind, readonly (readonly number[])[]>> = {
  freecell: [[4, 3, 2]],
  suido: [
    [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    [507, 610, 814],
  ],
  meikyuu: [
    [1, 2, 3, 4, 5],
    [609, 812, 1015, 1218, 1624, 2030, 6496],
  ],
};
