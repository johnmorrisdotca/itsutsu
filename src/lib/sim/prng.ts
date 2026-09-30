/**
 * A small, seeded, deterministic random source for the player-journey
 * projection (`journeys.ts`). Never `Math.random`: the same seed must produce
 * the same 1000 players and the same twelve months, run after run, so the
 * page renders the same numbers on every request and the unit tests can
 * assert exact values.
 *
 * Mulberry32 and the draws on it are Tane (github.com/johnmorrisdotca/tane), the site's own
 * open-source package; these are its names for them here. This is not
 * cryptography and not game fairness, it is a spreadsheet standing in for one.
 */
import { chance, float, int, mulberry32, normal, weightedIndex, weightedPick, type Random } from "@johnmorrisdotca/tane";

export type Rng = Random;

export { chance, mulberry32, normal, weightedIndex, weightedPick };

/** A number in [min, max). */
export const uniform: (rng: Rng, min: number, max: number) => number = float;

/** An integer in [min, max]. */
export const uniformInt: (rng: Rng, min: number, max: number) => number = int;
