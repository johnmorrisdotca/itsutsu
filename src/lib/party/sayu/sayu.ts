// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { diceTableCodec, nextSeat, seatsOf, throwDice } from "../diceTable/diceTable";
import type { DiceTableRules } from "../diceTable/diceTable.types";

import type { SayuFace, SayuGame, SayuMove } from "./sayu.types";

/**
 * SAYU 左右, "left and right": pass the counters round the table.
 *
 * Everybody starts with the same counters. On your turn throw a die for each
 * counter you hold, three at most, and every die sends one on: a 1 to the left,
 * a 2 to the right, a 3 to the pot in the middle; a 4, 5 or 6 stays with you.
 * Hold none and you do not throw, but you are not out: a neighbour can pass you
 * one. When one player alone holds counters they win, and take the pot. There is
 * nothing to decide, which is the point: it is a game for the whole table,
 * whatever their age. A seat's counters exist inside this one game.
 *
 * The rules of a game are nobody's. This one's name is our own, and its dice are
 * ordinary dice read as directions.
 */

export const SAYU_SIZES = [2, 3, 5] as const;
export const SAYU_DEFAULT_SIZE = 3;
export const SAYU_FEWEST = 2;
export const SAYU_MOST = 8;
/** The most dice one throw may be. */
export const SAYU_MOST_DICE = 3;

/** What each face sends where, one to six. */
const SAYU_FACES: readonly SayuFace[] = ["left", "right", "pot", "keep", "keep", "keep"];

/** What one die does. */
export function sayuFace(die: number): SayuFace {
  return SAYU_FACES[die - 1] ?? "keep";
}

function start(size: number, players: readonly string[], _language?: unknown, seed = 1, computers?: readonly boolean[]): SayuGame | null {
  if (!SAYU_SIZES.includes(size as (typeof SAYU_SIZES)[number])) return null;
  const seats = seatsOf(players, computers, SAYU_FEWEST, SAYU_MOST);
  if (seats === null) return null;
  return { size, seed, ...seats, moves: [], thrown: 0, phase: "playing", toPlay: 0, winners: [], counters: players.map(() => size), pot: 0, dice: [], thrower: null };
}

function play(game: SayuGame, move: SayuMove): SayuGame | null {
  if (game.phase === "over" || move.kind !== "roll") return null;
  const seat = game.toPlay;
  const count = game.players.length;
  const dice = throwDice(game.seed, game.thrown, Math.min(game.counters[seat]!, SAYU_MOST_DICE));
  const counters = [...game.counters];
  let pot = game.pot;
  for (const die of dice) {
    const face = sayuFace(die);
    if (face === "keep") continue;
    counters[seat] = counters[seat]! - 1;
    if (face === "pot") pot += 1;
    else {
      const to = (seat + (face === "left" ? 1 : count - 1)) % count;
      counters[to] = counters[to]! + 1;
    }
  }
  const holders = counters.flatMap((held, at) => (held > 0 ? [at] : []));
  const over = holders.length === 1;
  const after: SayuGame = { ...game, moves: [...game.moves, move], thrown: game.thrown + 1, counters, pot, dice, thrower: seat };
  return over ? { ...after, phase: "over", toPlay: holders[0]!, winners: holders } : { ...after, toPlay: nextSeat(count, seat, (at) => counters[at]! > 0) };
}

const codec = diceTableCodec<SayuGame, SayuMove>("sayu", start, play, (value): value is SayuMove => (value as { kind?: unknown } | null)?.kind === "roll");

export const SAYU_RULES: DiceTableRules<SayuGame, SayuMove> = {
  start,
  moves: (game) => (game.phase === "over" ? [] : [{ kind: "roll" }]),
  play,
  over: (game) => game.phase === "over",
  winners: (game) => game.winners,
  encode: codec.encode,
  decode: codec.decode,
  toPlay: (game) => (game.phase === "over" ? null : game.toPlay),
  computer: () => ({ kind: "roll" }),
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
