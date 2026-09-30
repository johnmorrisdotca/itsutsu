import { TENKA_MOVES, TENKA_PHASES } from "./tenka.constants.ts";
import type { TenkaGame, TenkaMove } from "./tenka.types.ts";
import { mustTrade } from "./tenka.ts";
import { setsIn } from "./tenkaCards.ts";
import { mostAttackDice } from "./tenkaDice.ts";
import { connectedOwn, tenkaNeighbours } from "./tenkaMap.ts";

/**
 * EVERY MOVE THE PLAYER TO MOVE MAY MAKE NOW: what `playTenka` takes,
 * listed, for a computer player or a test to choose among. None once the
 * game is over.
 */

/** The territories the player to move holds. */
function own(game: TenkaGame): number[] {
  return game.owners.flatMap((owner, territory) => (owner === game.toPlay ? [territory] : []));
}

/** `from` to `to`, a whole number each. */
function span(from: number, to: number): number[] {
  return to < from ? [] : Array.from({ length: to - from + 1 }, (_, at) => from + at);
}

/**
 * Every attack open now: from each territory of theirs with armies to spare,
 * on each neighbour somebody else holds, with each number of dice — and the
 * same attack again and again until it is decided.
 */
export function attacksOpen(game: TenkaGame): TenkaMove[] {
  if (game.phase !== TENKA_PHASES.attack) return [];
  return own(game).flatMap((from) =>
    tenkaNeighbours(from)
      .filter((to) => game.owners[to] !== game.toPlay && game.armies[from] >= 2)
      .flatMap((to): TenkaMove[] => [
        ...span(1, mostAttackDice(game.armies[from])).map((dice) => ({ kind: TENKA_MOVES.attack, from, to, dice })),
        { kind: TENKA_MOVES.blitz, from, to },
      ]),
  );
}

export function tenkaMoves(game: TenkaGame): TenkaMove[] {
  switch (game.phase) {
    case TENKA_PHASES.setUp:
      return own(game).map((territory) => ({ kind: TENKA_MOVES.place, territory, armies: 1 }));
    case TENKA_PHASES.reinforce: {
      const trades: TenkaMove[] = setsIn(game.hands[game.toPlay]).map((cards) => ({ kind: TENKA_MOVES.trade, cards }));
      if (mustTrade(game)) return trades;
      // One army, or all the rest: every spread of the turn's armies is a run of these (`playTenka`).
      const counts = game.reserve > 1 ? [1, game.reserve] : [1];
      const places: TenkaMove[] = own(game).flatMap((territory) => counts.map((armies) => ({ kind: TENKA_MOVES.place, territory, armies })));
      return [...trades, ...places];
    }
    case TENKA_PHASES.attack:
      return [...attacksOpen(game), { kind: TENKA_MOVES.endAttack }];
    case TENKA_PHASES.occupy: {
      const taking = game.occupying!;
      return span(taking.least, game.armies[taking.from] - 1).map((armies) => ({ kind: TENKA_MOVES.occupy, armies }));
    }
    case TENKA_PHASES.fortify: {
      const pairs: TenkaMove[] = own(game)
        .filter((from) => game.armies[from] >= 2)
        .flatMap((from) => connectedOwn(game.owners, from).map((to) => ({ kind: TENKA_MOVES.fortify, from, to })));
      return [...pairs, { kind: TENKA_MOVES.endTurn }];
    }
    case TENKA_PHASES.shift:
      return span(1, game.armies[game.shifting!.from] - 1).map((armies) => ({ kind: TENKA_MOVES.shift, armies }));
    default:
      return [];
  }
}
