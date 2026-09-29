// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { DoublesRule, MexicanStart, TrainLength, TrainOptions } from "./mexicanTrain.types";

/**
 * THE SETS OFFERED, by their highest double. Double-twelve is the set Mexican
 * Train is sold with and the one most published rules are written for, so it
 * is the default; double-nine for a quicker game with fewer, larger pips, and
 * double-fifteen for a long evening. These are the party game's "sizes"
 * (`PARTY_SPECS`), since the set is what the table is played on.
 */
export const TRAIN_SETS = { nine: 9, twelve: 12, fifteen: 15 } as const;

/** The largest set's highest double, and so the base a tile's two ends are written in (`tileOf`). */
export const TRAIN_PIP_BASE = 16;

/**
 * HOW MANY TILES EACH PLAYER IS DEALT, by the set and the number at the
 * table. Double-twelve's are the figures most published rules give (fifteen
 * each for two to four, twelve for five or six, ten for seven or eight); the
 * other sets are scaled so that at every table some tiles are left to draw.
 */
export function handSizeFor(set: number, players: number): number {
  const few = players <= 4;
  const some = players <= 6;
  if (set === TRAIN_SETS.nine) return few ? 10 : some ? 8 : 6;
  if (set === TRAIN_SETS.fifteen) return few ? 15 : some ? 13 : 12;
  return few ? 15 : some ? 12 : 10;
}

/** The options a table opens on: every round, one double at a time, and the Mexican Train open from the start. */
export const TRAIN_DEFAULT_OPTIONS: TrainOptions = { length: "full", doubles: "one", mexican: "any" };

export const TRAIN_LENGTHS = { full: "full", short: "short" } as const satisfies Record<TrainLength, TrainLength>;
export const TRAIN_DOUBLES = { one: "one", chain: "chain" } as const satisfies Record<DoublesRule, DoublesRule>;
export const TRAIN_MEXICAN = { any: "any", ownFirst: "ownFirst" } as const satisfies Record<MexicanStart, MexicanStart>;

/** How many rounds a game of this length plays with this set: one per double, top to blank, or the first half of them. */
export function roundsFor(set: number, length: TrainLength): number {
  return length === TRAIN_LENGTHS.full ? set + 1 : Math.ceil((set + 1) / 2);
}

/** Each set by name, for the set-up's tiles and the card on My games. */
export const TRAIN_SET_NAMES: Record<number, string> = { 9: "Double-nine", 12: "Double-twelve", 15: "Double-fifteen" };

/** The set's name, or null for a number that is no set offered. */
export function trainSetName(set: number): string | null {
  return TRAIN_SET_NAMES[set] ?? null;
}
