/**
 * Tane 種: seeded random numbers and daily seeds.
 *
 * One seed, the same numbers everywhere: a small generator, the draws a game
 * needs from it, seeds that travel in an address with ranges kept aside, and
 * one seed a day. No dependencies and no DOM; `@johnmorrisdotca/tane/react`
 * adds two hooks.
 */
export * from "./random.ts";
export * from "./draws.ts";
export * from "./seeds.ts";
export * from "./daily.ts";
