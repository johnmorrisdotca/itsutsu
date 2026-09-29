import type { MancalaSeat, MancalaSowing } from "./mancala.types";

/**
 * ONE SOWING, BY EACH RULE SET: the seeds lifted from a pit and dropped one at
 * a time round the board, and whatever the last one decides. Pure: each takes
 * the holes as they stand and returns new ones, and neither knows whose turn
 * is next or whether the game is over — that is `mancala.ts`'s to settle.
 *
 * How the holes are numbered is in `mancala.types.ts`.
 */

/** Every hole on the board: twelve pits and two stores. */
export const MANCALA_HOLES = 14;

/** A seat's store: 6 for the first player, 13 for the second. */
export function storeOf(seat: MancalaSeat): number {
  return seat === 0 ? 6 : 13;
}

/** A seat's six pits, in sowing order. */
export function pitsOf(seat: MancalaSeat): readonly number[] {
  return seat === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12];
}

/** Whose pit a hole is, or null for a store. */
export function pitOwner(hole: number): MancalaSeat | null {
  if (hole >= 0 && hole <= 5) return 0;
  if (hole >= 7 && hole <= 12) return 1;
  return null;
}

/** The pit across the board from a pit: 0 faces 12, 5 faces 7. */
export function oppositePit(pit: number): number {
  return 12 - pit;
}

/** The seeds left in a seat's six pits. */
export function seedsInRow(holes: readonly number[], seat: MancalaSeat): number {
  return pitsOf(seat).reduce((sum, pit) => sum + holes[pit], 0);
}

/** What a sowing does to the holes, and what it did, in one answer. */
export type Sown = { holes: number[]; sowing: MancalaSowing };

/**
 * KALAH: lift every seed from `pit` and sow them one to a hole,
 * counter-clockwise, into your own store as you pass it but never your
 * opponent's. A sowing long enough to come all the way round drops a seed
 * back into the pit it started from, as Kalah is played.
 *
 * - The last seed in your own store: you sow again (`again`).
 * - The last seed in an empty pit of your own, with seeds in the pit
 *   opposite: that seed and every seed opposite go into your store. With
 *   nothing opposite, nothing is taken and the seed stays where it fell —
 *   the rule as Kalah's own published rules and most sets state it.
 */
export function sowKalah(before: readonly number[], pit: number, by: MancalaSeat): Sown {
  const holes = [...before];
  let seeds = holes[pit];
  holes[pit] = 0;
  const skip = storeOf(by === 0 ? 1 : 0);
  const path: number[] = [];
  let at = pit;
  while (seeds > 0) {
    at = (at + 1) % MANCALA_HOLES;
    if (at === skip) continue;
    holes[at] += 1;
    seeds -= 1;
    path.push(at);
  }
  const again = at === storeOf(by);
  let captured = 0;
  const takenFrom: number[] = [];
  const across = oppositePit(at);
  if (!again && pitOwner(at) === by && holes[at] === 1 && holes[across] > 0) {
    captured = holes[at] + holes[across];
    takenFrom.push(at, across);
    holes[storeOf(by)] += captured;
    holes[at] = 0;
    holes[across] = 0;
  }
  return { holes, sowing: { pit, by, path, again, captured, takenFrom, grandSlam: false } };
}

/** The next pit round an Oware board, counter-clockwise: the stores are never sown into. */
function nextOware(hole: number): number {
  const next = (hole + 1) % MANCALA_HOLES;
  return pitOwner(next) === null ? (next + 1) % MANCALA_HOLES : next;
}

/** The pit before, clockwise: where a chain of captures looks next. */
function previousOware(hole: number): number {
  const previous = (hole + MANCALA_HOLES - 1) % MANCALA_HOLES;
  return pitOwner(previous) === null ? (previous + MANCALA_HOLES - 1) % MANCALA_HOLES : previous;
}

/**
 * OWARE, BY THE ABAPA RULES: lift every seed from `pit` and sow them one to a
 * pit, counter-clockwise, round the twelve pits and never into a store.
 *
 * - Twelve seeds or more go all the way round: the pit sown from is skipped,
 *   and stays empty.
 * - The last seed in an opponent's pit that then holds two or three: those
 *   are taken, and so is the pit before it, and the one before that, for as
 *   long as each is the opponent's and holds two or three.
 * - The grand slam: a capture that would take every seed the opponent has on
 *   the board takes none, and the sowing stands (`grandSlam`).
 */
export function sowOware(before: readonly number[], pit: number, by: MancalaSeat): Sown {
  const holes = [...before];
  let seeds = holes[pit];
  holes[pit] = 0;
  const path: number[] = [];
  let at = pit;
  while (seeds > 0) {
    at = nextOware(at);
    if (at === pit) continue;
    holes[at] += 1;
    seeds -= 1;
    path.push(at);
  }
  const opponent = by === 0 ? 1 : 0;
  const chain: number[] = [];
  for (let look = at; pitOwner(look) === opponent && (holes[look] === 2 || holes[look] === 3); look = previousOware(look)) chain.push(look);
  const taking = chain.reduce((sum, hole) => sum + holes[hole], 0);
  const grandSlam = chain.length > 0 && taking === seedsInRow(holes, opponent);
  if (chain.length === 0 || grandSlam) {
    return { holes, sowing: { pit, by, path, again: false, captured: 0, takenFrom: [], grandSlam } };
  }
  for (const hole of chain) holes[hole] = 0;
  holes[storeOf(by)] += taking;
  return { holes, sowing: { pit, by, path, again: false, captured: taking, takenFrom: chain, grandSlam: false } };
}
