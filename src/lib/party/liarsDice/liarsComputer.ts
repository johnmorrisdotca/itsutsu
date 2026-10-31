// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { LiarsGame, LiarsMove } from "./liarsDice.types";

/** The faces a bid may name. Here as well as in `liarsDice.ts`, which imports this module. */
const FACES = [2, 3, 4, 5, 6] as const;

/** Below this chance of the bid on the table standing, the computer calls it. */
const CALLS_BELOW = 0.3;

/** It opens a round with the largest bid at least this likely. */
const OPENS_AT = 0.6;

/** The chance that at least `needed` of `dice` unseen dice show a face: one in three each, the face or a one. */
export function chanceOfAtLeast(needed: number, dice: number): number {
  if (needed <= 0) return 1;
  if (needed > dice) return 0;
  let chance = 0;
  let ways = 1;
  for (let hits = 0; hits <= dice; hits += 1) {
    if (hits >= needed) chance += ways * Math.pow(1 / 3, hits) * Math.pow(2 / 3, dice - hits);
    ways = (ways * (dice - hits)) / (hits + 1);
  }
  return chance;
}

/**
 * THE COMPUTER AT LIAR'S DICE reads its own cup, how many dice everybody else
 * still has, and the bid. It never reads another cup, so a table on several
 * devices can hand it its own seat's view and nothing more (`seenByLiar`), and
 * it chooses the same move from that as from the whole game; a test holds that.
 */
export function liarsComputer(game: LiarsGame): LiarsMove {
  const seat = game.toPlay;
  const mine = game.cups[seat]!;
  const unseen = game.cups.reduce((sum, cup, at) => (at === seat ? sum : sum + cup.length), 0);
  const total = mine.length + unseen;
  const chance = (count: number, face: number) => chanceOfAtLeast(count - mine.filter((die) => die === face || die === 1).length, unseen);

  const bid = game.bid;
  if (bid === null) {
    // Open with the face it holds most of, as high a count as it can stand behind.
    const face = [...FACES].sort((a, b) => mine.filter((die) => die === b).length - mine.filter((die) => die === a).length || b - a)[0]!;
    let count = 1;
    while (count < total && chance(count + 1, face) >= OPENS_AT) count += 1;
    return { kind: "bid", count, face };
  }
  const standing = chance(bid.count, bid.face);
  let best: { count: number; face: number; chance: number } | null = null;
  for (const count of [bid.count, bid.count + 1]) {
    if (count > total) continue;
    for (const face of FACES) {
      if (count === bid.count && face <= bid.face) continue;
      const likely = chance(count, face);
      if (best === null || likely > best.chance) best = { count, face, chance: likely };
    }
  }
  // A call when the bid looks false, or when every way of raising it looks worse than calling it.
  if (best === null || standing < CALLS_BELOW || 1 - standing > best.chance) return { kind: "call" };
  return { kind: "bid", count: best.count, face: best.face };
}
