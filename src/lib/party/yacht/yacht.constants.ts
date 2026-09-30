// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { YachtBox } from "./yacht.types";

/** Dice thrown: five, as every game of the family plays. */
export const YACHT_DICE = 5;

/** Rolls a turn: the first, and up to two more of whichever dice the player does not hold. */
export const YACHT_ROLLS = 3;

/** Every die held, as a mask: a roll holding all five throws nothing, so it is never offered. */
export const YACHT_ALL_HELD = (1 << YACHT_DICE) - 1;

/**
 * THE SCORE SHEET, in the order it is printed: the six numbers, then the
 * combinations. Thirteen boxes, each filled once, so a game is thirteen turns
 * each. The sheet's size is the party game's one "board size" (`PARTY_SPECS`).
 */
export const YACHT_BOXES: readonly YachtBox[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
  "threeKind",
  "fourKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "yacht",
  "chance",
];

/** The sheet's size: thirteen boxes. */
export const YACHT_SHEET = YACHT_BOXES.length;

/** The six numbers' boxes are the sheet's upper half: the first six. */
export const YACHT_UPPER = 6;

/** Sixty-three or more in the upper half (three of every number) earns this bonus. */
export const YACHT_BONUS_AT = 63;
export const YACHT_BONUS = 35;

/** The combinations that score a fixed amount. */
export const YACHT_FIXED = { fullHouse: 25, smallStraight: 30, largeStraight: 40, yacht: 50 } as const;

/** The most who may sit at the table: the eight colours the tables share. */
export const YACHT_MOST_PLAYERS = 8;

/** One person alone may play too, against their own best: a sheet to fill is a game by itself. */
export const YACHT_FEWEST_ALONE = 1;
