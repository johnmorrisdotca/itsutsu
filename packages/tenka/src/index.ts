/**
 * Tenka 天下: the classic world-conquest game on a map of the modern world,
 * for two to six players, as plain functions over plain data.
 *
 * A game is a value. `startTenka` deals one from a seed, `playTenka` makes a
 * move and returns the next game (or null for a move the rules refuse), and
 * every shuffle, deal and die is drawn from the game's own seeded random, so
 * a game replays exactly from its seed and its moves (`encodeTenka`,
 * `decodeTenka`). Nothing here touches the DOM, a clock or `Math.random`.
 *
 * The map's outlines, which only a board drawing the world needs, are their
 * own entry, `@johnmorrisdotca/tenka/shapes`, and so is the table that
 * draws and plays a game in plain DOM, `@johnmorrisdotca/tenka/ui`.
 */
export * from "./tenka.types.ts";
export * from "./tenka.constants.ts";
export * from "./tenka.ts";
export * from "./tenkaStart.ts";
export * from "./tenkaTurn.ts";
export * from "./tenkaMap.ts";
export * from "./tenkaCards.ts";
export * from "./tenkaDice.ts";
export * from "./tenkaMoves.ts";
export * from "./tenkaPolicy.ts";
export * from "./tenkaKeep.ts";
export * from "./tenkaTaps.ts";
