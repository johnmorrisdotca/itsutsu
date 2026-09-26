import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * WHAT A PUZZLE'S OWN POINTS ARE WORTH IN IP. Each puzzle keeps its own board
 * as PuzzleMadness scores it (`pointsFor`: five a cell, less fifty a help), and
 * those numbers are not on one scale: a 9×9 Number Place is about 250, a Gomoji
 * word about 800. On the way into IP each is multiplied by its weight here, set
 * so a medium solve at the puzzle's default size is about 100 — a Gomoku win on
 * 15×15 (docs/plans/points/PTS-01-site-points-page.md has the measurements).
 *
 * A Record, so a new puzzle cannot ship without deciding what it is worth.
 */
export const PUZZLE_IP_WEIGHT: Record<PuzzleKind, number> = {
  numberPlace: 0.4,
  diagonal: 0.37,
  sumCages: 0.26,
  jigsaw: 0.7,
  blackAndWhite: 0.42,
  hiddenStones: 0.41,
  moreOrLess: 0.9,
  towers: 0.83,
  gomoji: 0.12,
  gomojiKana: 0.12,
  gomojiMot: 0.12,
  gomojiWort: 0.12,
  gomojiPop: 0.12,
  // Five a cell drawn through: a middling 7×7 level fills about 35, so about 175 points.
  tsunagi: 0.57,
  // A Classic game of fifty tiles in about ten minutes scores about 800 (`KUMIMOJI_SCORE`).
  kumimoji: 0.13,
  // A medium solve is about 880 (`koushiPoints`: 500, three swaps spare, a quick time).
  koushi: 0.11,
};

/** How many rows a board shows beside a game or family, and on its own page. */
export const IP_SHOWN = 10;
export const IP_WHOLE = 200;
