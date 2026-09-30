import { TENKA_MOVES, TENKA_PHASES } from "./tenka.constants.ts";
import type { TenkaGame, TenkaMove } from "./tenka.types.ts";
import { mustTrade } from "./tenka.ts";
import { setsIn } from "./tenkaCards.ts";
import { connectedOwn, tenkaNeighbours } from "./tenkaMap.ts";
import { attacksOpen } from "./tenkaMoves.ts";

/**
 * A SENSIBLE RANDOM PLAYER: the computer seat, and what a test plays whole
 * games out with.
 *
 * Choosing uniformly among every move offered would never end a game of
 * Tenka: a player
 * who ends their attack at random, places one army at a time on a random
 * territory and marches armies back and forth plays for ever, as a person
 * never would. So this plays at random among the moves a person might make
 * — trade when it can, pile the turn's armies onto one border (its
 * strongest, mostly), attack only with the odds (more armies than the
 * defender, and three at least), the widest margin first, each attack
 * thrown until it is decided,
 * advance everything after a win, and fortify from behind the lines to the
 * front — which is enough for games to end by conquest as they do at a real
 * table, with the rounds' count behind it for the ones that do not.
 */

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

/** Whether a territory has somebody else's next to it. */
function onTheFront(game: TenkaGame, territory: number): boolean {
  return tenkaNeighbours(territory).some((next) => game.owners[next] !== game.owners[territory]);
}

export function sensibleTenkaMove(game: TenkaGame, random: () => number): TenkaMove {
  const own = game.owners.flatMap((owner, territory) => (owner === game.toPlay ? [territory] : []));
  switch (game.phase) {
    case TENKA_PHASES.setUp:
      return { kind: TENKA_MOVES.place, territory: pick(own, random), armies: 1 };
    case TENKA_PHASES.reinforce: {
      const sets = setsIn(game.hands[game.toPlay]);
      if (sets.length > 0 && (mustTrade(game) || random() < 0.8)) return { kind: TENKA_MOVES.trade, cards: sets[0] };
      // Everything on one front territory, the strongest one mostly: a stack that can break through, as players build.
      const front = own.filter((territory) => onTheFront(game, territory));
      const choices = front.length > 0 ? front : own;
      const strongest = choices.reduce((best, territory) => (game.armies[territory] > game.armies[best] ? territory : best));
      return { kind: TENKA_MOVES.place, territory: random() < 0.75 ? strongest : pick(choices, random), armies: game.reserve };
    }
    case TENKA_PHASES.attack: {
      // Only with the odds: three armies at least, and more than the defender. The widest margin mostly, until it is decided.
      const good = attacksOpen(game).filter(
        (move) => move.kind === TENKA_MOVES.blitz && game.armies[move.from] >= 3 && game.armies[move.from] > game.armies[move.to],
      );
      if (good.length === 0 || random() < 0.05) return { kind: TENKA_MOVES.endAttack };
      if (random() < 0.3) return pick(good, random);
      const margin = (move: TenkaMove) => (move.kind === TENKA_MOVES.blitz ? game.armies[move.from] - game.armies[move.to] : 0);
      return good.reduce((best, move) => (margin(move) > margin(best) ? move : best));
    }
    case TENKA_PHASES.occupy: {
      const taking = game.occupying!;
      return { kind: TENKA_MOVES.occupy, armies: game.armies[taking.from] - 1 };
    }
    case TENKA_PHASES.fortify: {
      const behind = own.filter((territory) => game.armies[territory] >= 2 && !onTheFront(game, territory));
      for (const from of behind.sort((a, b) => game.armies[b] - game.armies[a])) {
        const front = connectedOwn(game.owners, from).filter((to) => onTheFront(game, to));
        if (front.length > 0) return { kind: TENKA_MOVES.fortify, from, to: pick(front, random) };
      }
      return { kind: TENKA_MOVES.endTurn };
    }
    case TENKA_PHASES.shift:
      return { kind: TENKA_MOVES.shift, armies: game.armies[game.shifting!.from] - 1 };
    default:
      return { kind: TENKA_MOVES.endTurn };
  }
}
