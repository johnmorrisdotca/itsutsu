/**
 * The deck on its own: fifty-two cards as objects (`{ suit, rank }`), a seeded
 * shuffle, dealing, one-character and two-character codes, and the names a
 * card is written and spoken by. For a solitaire or any game of your own.
 */
export * from "./cards/cards.constants.ts";
export type * from "./cards/cards.types.ts";
export * from "./cards/deck.ts";
export { seededRandom, shuffled } from "./random.ts";
export type { Random } from "./random.ts";
