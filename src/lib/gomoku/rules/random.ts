/**
 * A small seeded random number generator, so anything a game decides by
 * chance — where the dead squares fall, which pieces come next — is fixed by
 * the seed stored with the game and comes out the same on every replay.
 *
 * Mulberry32: fast, tiny, and good enough for a board game. The seed is a
 * 31-bit integer. The generator is Tane (github.com/johnmorrisdotca/tane), whose tests pin
 * its numbers, so a stored seed replays the same game after any upgrade.
 */
import { distinctBelow, mulberry32 } from "@johnmorrisdotca/tane";

export const seededRandom: (seed: number) => () => number = mulberry32;

/** `count` distinct integers below `limit`, in draw order. */
export const drawDistinct: (random: () => number, count: number, limit: number) => number[] = distinctBelow;

/** A seed drawn from a unit roll, as `createGame` receives one. */
export function seedFromRoll(roll: number, range: number): number {
  return Math.floor(Math.max(0, Math.min(0.999999, roll)) * range);
}
