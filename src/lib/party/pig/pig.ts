// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { diceTableCodec, leaders, seatsOf, throwDice } from "../diceTable/diceTable";
import type { DiceTableRules } from "../diceTable/diceTable.types";

import type { PigGame, PigMove } from "./pig.types";

/**
 * PIG: one die, and the question of when to stop.
 *
 * On your turn throw the die as often as you dare: every number adds to your
 * turn, a 1 loses the turn and everything it made, and banking ends the turn
 * and keeps what it made. The first to the score wins. Pure, as the engine is:
 * every function returns a new game, and a game is its table and its moves.
 */

/** The scores a game may be played to. */
export const PIG_SIZES = [50, 100] as const;
export const PIG_DEFAULT_SIZE = 100;
export const PIG_FEWEST = 2;
export const PIG_MOST = 8;

/** What the computer banks at: stop at twenty, the old rule of thumb, or as soon as banking wins. */
const PIG_COMPUTER_STOPS_AT = 20;

function start(size: number, players: readonly string[], _language?: unknown, seed = 1, computers?: readonly boolean[]): PigGame | null {
  if (!PIG_SIZES.includes(size as (typeof PIG_SIZES)[number])) return null;
  const seats = seatsOf(players, computers, PIG_FEWEST, PIG_MOST);
  if (seats === null) return null;
  return { size, seed, ...seats, moves: [], thrown: 0, phase: "playing", toPlay: 0, winners: [], die: 0, turnPoints: 0, banked: players.map(() => 0), last: null };
}

function moves(game: PigGame): PigMove[] {
  if (game.phase === "over") return [];
  return game.turnPoints > 0 ? [{ kind: "roll" }, { kind: "bank" }] : [{ kind: "roll" }];
}

function play(game: PigGame, move: PigMove): PigGame | null {
  if (game.phase === "over") return null;
  const seat = game.toPlay;
  const next = (seat + 1) % game.players.length;
  const moved = [...game.moves, move];
  if (move.kind === "roll") {
    const die = throwDice(game.seed, game.thrown, 1)[0]!;
    if (die === 1) return { ...game, moves: moved, thrown: game.thrown + 1, die, turnPoints: 0, toPlay: next, last: { seat, kind: "bust", lost: game.turnPoints } };
    const turnPoints = game.turnPoints + die;
    return { ...game, moves: moved, thrown: game.thrown + 1, die, turnPoints, last: { seat, kind: "rolled", die, turn: turnPoints } };
  }
  if (move.kind !== "bank" || game.turnPoints === 0) return null;
  const banked = game.banked.map((points, at) => (at === seat ? points + game.turnPoints : points));
  const won = banked[seat]! >= game.size;
  return {
    ...game,
    moves: moved,
    turnPoints: 0,
    banked,
    toPlay: won ? seat : next,
    phase: won ? "over" : "playing",
    winners: won ? leaders(banked) : [],
    last: { seat, kind: "banked", points: game.turnPoints },
  };
}

const isPigMove = (value: unknown): value is PigMove => {
  const kind = (value as { kind?: unknown } | null)?.kind;
  return kind === "roll" || kind === "bank";
};

const codec = diceTableCodec<PigGame, PigMove>("pig", start, play, isPigMove);

/** Bank at twenty or more, or as soon as banking wins; press on when somebody is about to win and the turn would not catch them. */
function computer(game: PigGame): PigMove {
  if (game.turnPoints === 0) return { kind: "roll" };
  const mine = game.banked[game.toPlay]!;
  if (mine + game.turnPoints >= game.size) return { kind: "bank" };
  const threat = Math.max(...game.banked) >= game.size - PIG_COMPUTER_STOPS_AT;
  return game.turnPoints >= PIG_COMPUTER_STOPS_AT && !threat ? { kind: "bank" } : { kind: "roll" };
}

export const PIG_RULES: DiceTableRules<PigGame, PigMove> = {
  start,
  moves,
  play,
  over: (game) => game.phase === "over",
  winners: (game) => game.winners,
  encode: codec.encode,
  decode: codec.decode,
  toPlay: (game) => (game.phase === "over" ? null : game.toPlay),
  computer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
