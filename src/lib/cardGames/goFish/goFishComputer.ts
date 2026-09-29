import type { CardId, CardRank } from "../cardGames.types";
import { rankOf } from "../cards";

import { goFishRanks, goFishTargets } from "./goFish";
import type { GoFishEvent, GoFishGame, GoFishMove } from "./goFish.types";

/**
 * A COMPUTER AT THE GO FISH TABLE, which remembers what was asked.
 *
 * Everything said at the table is in the game's log, and the computer reads
 * it the way a player with a good memory would: a player who asked for sevens
 * holds a seven; a player who handed over their sevens, or said "Go fish" to
 * a request for sevens, holds none — until they draw from the pond, when
 * anything may have come in; and a rank booked is gone for good. It asks
 * whoever it knows holds a rank it has, the rank it holds most of first, and
 * otherwise the rank it holds most of from the player with the most cards who
 * is not known to be without it. It never looks at a hand it is not holding.
 */

export type GoFishView = {
  seat: number;
  hand: readonly CardId[];
  targets: readonly number[];
  ranks: readonly CardRank[];
  counts: readonly number[];
  log: readonly GoFishEvent[];
};

export function goFishView(game: GoFishGame): GoFishView {
  const seat = game.toPlay ?? 0;
  return { seat, hand: game.hands[seat], targets: goFishTargets(game), ranks: goFishRanks(game), counts: game.hands.map((hand) => hand.length), log: game.log };
}

/** What the table has said about each seat's hand: for each seat, the ranks it is known to hold and known to be without. */
export type GoFishMemory = { holds: Set<CardRank>[]; lacks: Set<CardRank>[] };

export function goFishMemory(log: readonly GoFishEvent[], seats: number): GoFishMemory {
  const holds = Array.from({ length: seats }, () => new Set<CardRank>());
  const lacks = Array.from({ length: seats }, () => new Set<CardRank>());
  const has = (seat: number, rank: CardRank) => {
    holds[seat].add(rank);
    lacks[seat].delete(rank);
  };
  const hasNone = (seat: number, rank: CardRank) => {
    holds[seat].delete(rank);
    lacks[seat].add(rank);
  };
  for (const event of log) {
    if (event.kind === "book") {
      for (let seat = 0; seat < seats; seat += 1) hasNone(seat, event.rank);
    } else if (event.kind === "draw") {
      // A card drawn face down could be anything: what this seat was known to lack may be wrong now.
      lacks[event.seat].clear();
    } else {
      hasNone(event.asked, event.rank);
      has(event.seat, event.rank);
      if (event.fished === "missed") lacks[event.seat].clear();
    }
  }
  return { holds, lacks };
}

export function goFishComputer(game: GoFishGame): GoFishMove {
  const view = goFishView(game);
  const memory = goFishMemory(view.log, view.counts.length);
  const mine = (rank: CardRank) => view.hand.filter((card) => rankOf(card) === rank).length;
  // Most held first; among equals the lower rank, so the choice is always the same for the same hand.
  const ranks = [...view.ranks].sort((a, b) => mine(b) - mine(a) || a - b);
  for (const rank of ranks) {
    const holder = view.targets.find((seat) => memory.holds[seat].has(rank));
    if (holder !== undefined) return { ask: holder, rank };
  }
  const byCards = [...view.targets].sort((a, b) => view.counts[b] - view.counts[a] || a - b);
  for (const rank of ranks) {
    const target = byCards.find((seat) => !memory.lacks[seat].has(rank));
    if (target !== undefined) return { ask: target, rank };
  }
  return { ask: byCards[0], rank: ranks[0] };
}
