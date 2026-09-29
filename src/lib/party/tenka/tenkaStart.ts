// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { PARTY_SPECS } from "../party.constants";

import { TENKA_NEUTRAL, TENKA_PHASES, TENKA_PLACING, TENKA_STARTING_ARMIES } from "./tenka.constants";
import type { TenkaGame, TenkaOwner, TenkaPlacing, TenkaSeat } from "./tenka.types";
import { TENKA_DECK } from "./tenkaCards";
import { randomBelow, shuffled } from "./tenkaDice";
import { TENKA_TERRITORY_COUNT } from "./tenkaMap";
import { beginTurn, cleanTenkaName, territoriesHeld } from "./tenkaTurn";

const SPEC = PARTY_SPECS.tenka;

/** The largest seed a game keeps: the random's state is one 32-bit number. */
export const TENKA_SEED_MOST = 0xffffffff;

/** Whether a game this long for this many players is one Tenka is offered for. */
export function isTenkaTable(rounds: number, count: number): boolean {
  return SPEC.sizes.includes(rounds) && Number.isInteger(count) && count >= SPEC.fewestPlayers && count <= SPEC.mostPlayers;
}

export function isTenkaSeed(seed: number): boolean {
  return Number.isInteger(seed) && seed >= 0 && seed <= TENKA_SEED_MOST;
}

/** `armies` more armies scattered one at a time over `owner`'s territories, at random; the state after them. */
function scatter(armies: number[], owners: readonly TenkaOwner[], owner: TenkaOwner, count: number, state: number): number {
  const theirs = owners.flatMap((holder, territory) => (holder === owner ? [territory] : []));
  let at = state;
  for (let i = 0; i < count && theirs.length > 0; i += 1) {
    const drawn = randomBelow(at, theirs.length);
    at = drawn.state;
    armies[theirs[drawn.value]] += 1;
  }
  return at;
}

/**
 * A NEW GAME, all of it drawn from `seed`: who goes first; the territories
 * shuffled and dealt round the table one at a time from that player, each
 * with one army on it (at a table of two, dealt three ways, the neutral army
 * taking every third); the cards shuffled; and each player's starting armies
 * (`TENKA_STARTING_ARMIES`) less the ones already on their territories —
 * scattered at random when `placing` is auto, or left to be placed by hand,
 * one at a time round the table. The neutral army's are always scattered.
 *
 * Null for a table the game is not offered for, or a seed that is not one.
 */
export function startTenka(rounds: number, players: readonly string[], seed: number, placing: TenkaPlacing = TENKA_PLACING.auto): TenkaGame | null {
  if (!isTenkaTable(rounds, players.length) || !isTenkaSeed(seed)) return null;
  if (placing !== TENKA_PLACING.auto && placing !== TENKA_PLACING.hand) return null;
  const count = players.length;
  let rng = seed;

  const firstDrawn = randomBelow(rng, count);
  rng = firstDrawn.state;
  const first: TenkaSeat = firstDrawn.value;

  const dealt = shuffled(
    rng,
    Array.from({ length: TENKA_TERRITORY_COUNT }, (_, territory) => territory),
  );
  rng = dealt.state;
  const round: TenkaOwner[] = Array.from({ length: count }, (_, step) => (first + step) % count);
  if (count === 2) round.push(TENKA_NEUTRAL);
  const owners: TenkaOwner[] = new Array<TenkaOwner>(TENKA_TERRITORY_COUNT);
  dealt.value.forEach((territory, at) => {
    owners[territory] = round[at % round.length];
  });
  const armies = new Array<number>(TENKA_TERRITORY_COUNT).fill(1);

  const cards = shuffled(rng, TENKA_DECK);
  rng = cards.state;

  const starting = TENKA_STARTING_ARMIES[count];
  if (count === 2) rng = scatter(armies, owners, TENKA_NEUTRAL, starting - territoriesHeld(owners, TENKA_NEUTRAL), rng);
  const setUpLeft = players.map((_, seat) => starting - territoriesHeld(owners, seat));
  if (placing === TENKA_PLACING.auto) {
    for (let step = 0; step < count; step += 1) {
      const seat = (first + step) % count;
      rng = scatter(armies, owners, seat, setUpLeft[seat], rng);
    }
  }

  const game: TenkaGame = {
    seed,
    players: players.map(cleanTenkaName),
    rounds,
    placing,
    moves: [],
    rng,
    first,
    round: 1,
    toPlay: first,
    phase: TENKA_PHASES.setUp,
    owners,
    armies,
    hands: players.map(() => []),
    deck: cards.value,
    discards: [],
    trades: 0,
    reserve: 0,
    setUpLeft: placing === TENKA_PLACING.auto ? players.map(() => 0) : setUpLeft,
    conquered: false,
    occupying: null,
    shifting: null,
    lastRoll: null,
    lastTrade: null,
    lastDraw: null,
    out: players.map(() => false),
    lastOut: null,
    winners: [],
  };
  return placing === TENKA_PLACING.auto ? beginTurn(game, first, 1) : game;
}

/** The same table again, from nothing, with a new seed: a new deal, a new first player, new dice. */
export function tenkaAgain(game: TenkaGame, seed: number): TenkaGame | null {
  return startTenka(game.rounds, game.players, seed, game.placing);
}
