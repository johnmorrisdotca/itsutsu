/**
 * Toranpu トランプ: a deck of playing cards and nine card games to play with
 * it, each with a computer player.
 *
 * - Every game by name: `newGame`, `rulesFor`, `playComputers`, and every
 *   game's rules in `CARD_GAME_RULES`.
 * - Each game's own functions and types, as a namespace here (`hearts`,
 *   `spades`…) or from its own entry point (`@johnmorrisdotca/toranpu/hearts`).
 * - The cards the games deal, as two-letter ids ("QS", "TD"), and the helpers
 *   every game shares: dealing, seats, choices, the saved-game format.
 * - The deck as card objects, for a game of your own: `@johnmorrisdotca/toranpu/deck`.
 */
export * from "./play.ts";
export * from "./games/cardGameRules.ts";
export * from "./games/cardGames.constants.ts";
export type * from "./games/cardGames.types.ts";
export * from "./games/cardGameCodec.ts";
export * from "./games/cards.ts";
export { seededRandom, shuffled } from "./random.ts";
export type { Random } from "./random.ts";

export * as hearts from "./hearts.ts";
export * as spades from "./spades.ts";
export * as euchre from "./euchre.ts";
export * as cribbage from "./cribbage.ts";
export * as crazyEights from "./crazyEights.ts";
export * as goFish from "./goFish.ts";
export * as bigTwo from "./bigTwo.ts";
export * as president from "./president.ts";
export * as ginRummy from "./ginRummy.ts";
