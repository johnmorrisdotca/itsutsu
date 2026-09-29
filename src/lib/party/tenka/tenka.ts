// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { TENKA_MOVES, TENKA_MUST_TRADE_AT, TENKA_NEUTRAL, TENKA_PHASES, TENKA_TERRITORY_CARD_BONUS } from "./tenka.constants";
import type { TenkaCard, TenkaGame, TenkaMove } from "./tenka.types";
import { cardTerritory, isSet, tradeValue } from "./tenkaCards";
import { battleLosses, defendDice, mostAttackDice, throwDice } from "./tenkaDice";
import { areNeighbours, connectedOwn, isTerritory } from "./tenkaMap";
import { beginTurn, endOfTurn, finished, nextSeatIn, territoriesHeld } from "./tenkaTurn";

/**
 * TENKA 天下: THE RULES, and nothing else — the classic game of world
 * conquest, for two to six round one device.
 *
 * Pure, as the engine is: `playTenka` returns a new game and leaves the one it
 * was given untouched, and nothing here draws, keeps or asks anything. A game
 * is its table and its moves; every die is drawn from its own seeded random
 * (`tenkaDice.ts`), so the same moves always make the same world
 * (`replayTenka`, `tenkaKeep.ts`).
 *
 * A TURN: reinforce (one army for every three territories, at least three,
 * each continent held whole adding its bonus, and a set of cards traded in
 * adding more — five cards in hand must be traded before placing — placed one
 * at a time or all the rest at once, so any spread is a run of those); attack as
 * often as you like, a neighbour at a time, up to three dice against up to
 * two; take a territory and move in at least as many armies as dice rolled;
 * then one fortifying move between two of your own connected territories, or
 * none. A turn that took a territory ends with a card. Knock a player out and
 * their cards are yours — six or more, and you trade at once.
 */

/** A game with the move added to its record: every handler's last word. */
function recorded(game: TenkaGame, move: TenkaMove): TenkaGame {
  return { ...game, moves: [...game.moves, move] };
}

function place(game: TenkaGame, territory: number, armies: number): TenkaGame | null {
  if (!isTerritory(territory) || game.owners[territory] !== game.toPlay || !Number.isInteger(armies)) return null;
  const on = game.armies.map((count, at) => (at === territory ? count + armies : count));
  if (game.phase === TENKA_PHASES.setUp) {
    if (armies !== 1 || game.setUpLeft[game.toPlay] < 1) return null;
    const setUpLeft = game.setUpLeft.map((left, seat) => (seat === game.toPlay ? left - 1 : left));
    const placed = { ...game, armies: on, setUpLeft };
    // On round the table to the next player with armies still to place; when nobody has, the first turn begins.
    for (let step = 1; step <= game.players.length; step += 1) {
      const next = (game.toPlay + step) % game.players.length;
      if (setUpLeft[next] > 0) return { ...placed, toPlay: next };
    }
    return beginTurn(placed, game.first, 1);
  }
  if (game.phase !== TENKA_PHASES.reinforce || game.hands[game.toPlay].length >= TENKA_MUST_TRADE_AT) return null;
  // One army, or every one still waiting: any spread of a turn's armies is some run of those two.
  if (armies !== 1 && armies !== game.reserve) return null;
  const reserve = game.reserve - armies;
  return { ...game, armies: on, reserve, phase: reserve === 0 ? TENKA_PHASES.attack : game.phase };
}

function trade(game: TenkaGame, cards: readonly TenkaCard[]): TenkaGame | null {
  const hand = game.hands[game.toPlay];
  if (game.phase !== TENKA_PHASES.reinforce || !isSet(cards) || !cards.every((card) => hand.includes(card))) return null;
  const set = [...cards].sort((a, b) => a - b);
  const armies = tradeValue(game.trades);
  // Two more armies straight onto a territory the trader holds that one of the cards shows: the first such, if any.
  const bonusTerritory = set.map(cardTerritory).find((territory) => territory !== null && game.owners[territory] === game.toPlay) ?? null;
  return {
    ...game,
    hands: game.hands.map((held, seat) => (seat === game.toPlay ? held.filter((card) => !set.includes(card)) : held)),
    discards: [...game.discards, ...set],
    trades: game.trades + 1,
    reserve: game.reserve + armies,
    armies: bonusTerritory === null ? game.armies : game.armies.map((count, at) => (at === bonusTerritory ? count + TENKA_TERRITORY_CARD_BONUS : count)),
    lastTrade: { seat: game.toPlay, cards: set, armies, bonusTerritory },
  };
}

/** Whether the player to move may attack `to` from `from` at all: theirs, a neighbour, somebody else's, armies to spare. */
function mayAttack(game: TenkaGame, from: number, to: number): boolean {
  if (game.phase !== TENKA_PHASES.attack || !isTerritory(from) || !isTerritory(to)) return false;
  return game.owners[from] === game.toPlay && game.owners[to] !== game.toPlay && areNeighbours(from, to) && game.armies[from] >= 2;
}

/**
 * The dice thrown once, or — `untilDone` — again and again with every die
 * allowed until the territory falls or one army is left behind to attack
 * with. Each throw: the attacker's dice, then the defender's, as many as
 * allowed, compared in pairs (`battleLosses`).
 */
function battle(game: TenkaGame, from: number, to: number, dice: number, untilDone: boolean): TenkaGame {
  const armies = [...game.armies];
  let rng = game.rng;
  let attackerLost = 0;
  let defenderLost = 0;
  let throws = 0;
  let thrownDice = dice;
  let last = { attack: [] as number[], defend: [] as number[] };
  do {
    thrownDice = untilDone ? mostAttackDice(armies[from]) : dice;
    const thrown = throwDice(rng, thrownDice);
    const defending = throwDice(thrown.state, defendDice(armies[to]));
    rng = defending.state;
    const lost = battleLosses(thrown.value, defending.value);
    armies[from] -= lost.attackerLost;
    armies[to] -= lost.defenderLost;
    attackerLost += lost.attackerLost;
    defenderLost += lost.defenderLost;
    throws += 1;
    last = { attack: thrown.value, defend: defending.value };
  } while (untilDone && armies[to] > 0 && armies[from] >= 2);
  const defender = game.owners[to];
  const took = armies[to] === 0;
  const lastRoll = { from, to, attacker: game.toPlay, defender, attackDice: last.attack, defendDice: last.defend, attackerLost, defenderLost, throws, took };
  const rolled = { ...game, rng, armies, lastRoll };
  return took ? conquered(rolled, from, to, thrownDice) : rolled;
}

/** A territory taken: the taker's now, a player left with none is out (their cards the taker's), and the move in to choose — or the world won. */
function conquered(game: TenkaGame, from: number, to: number, dice: number): TenkaGame {
  const defender = game.owners[to];
  const owners = game.owners.map((owner, at) => (at === to ? game.toPlay : owner));
  let taken: TenkaGame = { ...game, owners, conquered: true };
  // The last territory of a player (never the neutral army): they are out, and their cards are the taker's.
  if (defender !== TENKA_NEUTRAL && territoriesHeld(owners, defender) === 0) {
    taken = {
      ...taken,
      out: taken.out.map((isOut, seat) => isOut || seat === defender),
      hands: taken.hands.map((held, seat) => (seat === game.toPlay ? [...held, ...taken.hands[defender]] : seat === defender ? [] : held)),
      lastOut: { seat: defender, by: game.toPlay },
    };
  }
  const least = Math.min(dice, game.armies[from] - 1);
  // The world taken: nobody else is left. The fewest move in, and the game is over.
  if (nextSeatIn(taken, game.toPlay) === game.toPlay) {
    return finished({ ...taken, armies: game.armies.map((count, at) => (at === from ? count - least : at === to ? least : count)) }, [game.toPlay]);
  }
  return { ...taken, phase: TENKA_PHASES.occupy, occupying: { from, to, least } };
}

function attack(game: TenkaGame, from: number, to: number, dice: number): TenkaGame | null {
  if (!mayAttack(game, from, to) || !Number.isInteger(dice) || dice < 1 || dice > mostAttackDice(game.armies[from])) return null;
  return battle(game, from, to, dice, false);
}

function blitz(game: TenkaGame, from: number, to: number): TenkaGame | null {
  if (!mayAttack(game, from, to)) return null;
  return battle(game, from, to, mostAttackDice(game.armies[from]), true);
}

function occupy(game: TenkaGame, armies: number): TenkaGame | null {
  const taking = game.occupying;
  if (game.phase !== TENKA_PHASES.occupy || taking === null || !Number.isInteger(armies)) return null;
  if (armies < taking.least || armies > game.armies[taking.from] - 1) return null;
  const moved = {
    ...game,
    armies: game.armies.map((count, at) => (at === taking.from ? count - armies : at === taking.to ? count + armies : count)),
    occupying: null,
  };
  // Cards taken from a player knocked out: at six or more, trade until fewer than five before attacking on.
  if (game.hands[game.toPlay].length > TENKA_MUST_TRADE_AT) return { ...moved, phase: TENKA_PHASES.reinforce, reserve: 0 };
  return { ...moved, phase: TENKA_PHASES.attack };
}

function fortify(game: TenkaGame, from: number, to: number): TenkaGame | null {
  if (game.phase !== TENKA_PHASES.fortify || !isTerritory(from) || !isTerritory(to)) return null;
  if (game.owners[from] !== game.toPlay || game.armies[from] < 2 || !connectedOwn(game.owners, from).includes(to)) return null;
  return { ...game, phase: TENKA_PHASES.shift, shifting: { from, to } };
}

function shift(game: TenkaGame, armies: number): TenkaGame | null {
  const moving = game.shifting;
  if (game.phase !== TENKA_PHASES.shift || moving === null || !Number.isInteger(armies)) return null;
  if (armies < 1 || armies > game.armies[moving.from] - 1) return null;
  const moved = {
    ...game,
    armies: game.armies.map((count, at) => (at === moving.from ? count - armies : at === moving.to ? count + armies : count)),
    shifting: null,
  };
  return endOfTurn(moved);
}

/**
 * The game after the player to move makes `move`, or null when they may not:
 * a move for another phase, a territory not theirs, a neighbour that is not
 * one, dice they have not the armies for, a set that is not a set.
 */
export function playTenka(game: TenkaGame, move: TenkaMove): TenkaGame | null {
  if (game.phase === TENKA_PHASES.over) return null;
  let next: TenkaGame | null;
  switch (move.kind) {
    case TENKA_MOVES.place:
      next = place(game, move.territory, move.armies);
      break;
    case TENKA_MOVES.trade:
      next = trade(game, move.cards);
      break;
    case TENKA_MOVES.attack:
      next = attack(game, move.from, move.to, move.dice);
      break;
    case TENKA_MOVES.blitz:
      next = blitz(game, move.from, move.to);
      break;
    case TENKA_MOVES.occupy:
      next = occupy(game, move.armies);
      break;
    case TENKA_MOVES.endAttack:
      next = game.phase === TENKA_PHASES.attack ? { ...game, phase: TENKA_PHASES.fortify } : null;
      break;
    case TENKA_MOVES.fortify:
      next = fortify(game, move.from, move.to);
      break;
    case TENKA_MOVES.shift:
      next = shift(game, move.armies);
      break;
    case TENKA_MOVES.endTurn:
      next = game.phase === TENKA_PHASES.fortify ? endOfTurn(game) : null;
      break;
    default:
      next = null;
  }
  return next === null ? null : recorded(next, move);
}

/** Whether the game is over. */
export function tenkaOver(game: TenkaGame): boolean {
  return game.phase === TENKA_PHASES.over;
}

/** Whether the player to move must trade cards before anything else: five or more in hand while reinforcing. */
export function mustTrade(game: TenkaGame): boolean {
  return game.phase === TENKA_PHASES.reinforce && game.hands[game.toPlay].length >= TENKA_MUST_TRADE_AT;
}
