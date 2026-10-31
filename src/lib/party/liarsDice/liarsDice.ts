// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { diceTableCodec, nextSeat, seatsOf, throwDice } from "../diceTable/diceTable";
import type { DiceTableRules } from "../diceTable/diceTable.types";

import { liarsComputer } from "./liarsComputer";
import type { LiarsGame, LiarsMove } from "./liarsDice.types";

/**
 * LIAR'S DICE: everybody's dice under a cup, and a bid on what is under them all.
 *
 * Everybody throws in secret. In turn each bids that at least so many dice round
 * the whole table show a face: more dice than the last bid, or as many of a
 * higher face. Ones are wild and count as any face, so nobody bids them. Or call
 * the last bid a lie: every cup is lifted, and the bidder loses a die if the bid
 * falls short, the caller if it stands. The loser opens the next round, everybody
 * throwing again. Lose your last die and you are out; the last player with dice
 * wins. Pure, as the engine is.
 */

export const LIARS_SIZES = [3, 5] as const;
export const LIARS_DEFAULT_SIZE = 5;
export const LIARS_FEWEST = 2;
export const LIARS_MOST = 8;
/** The faces a bid may name: ones are wild. */
export const LIARS_FACES = [2, 3, 4, 5, 6] as const;

/** How many dice on the table show this face, ones included. */
export function diceShowing(cups: LiarsGame["cups"], face: number): number {
  return cups.reduce((sum, cup) => sum + cup.filter((die) => die === face || die === 1).length, 0);
}

/** Every die still on the table. */
export function diceOnTable(game: Pick<LiarsGame, "cups">): number {
  return game.cups.reduce((sum, cup) => sum + cup.length, 0);
}

/** Whether a bid beats the one on the table: more dice, or as many of a higher face. */
export function beatsBid(bid: LiarsGame["bid"], count: number, face: number): boolean {
  if (bid === null) return count >= 1;
  return count > bid.count || (count === bid.count && face > bid.face);
}

/** Every seat throws its dice for a new round: one throw of the game, read off in seat order. */
function throwCups(seed: number, thrown: number, sizes: readonly number[]): number[][] {
  const faces = throwDice(seed, thrown, sizes.reduce((sum, size) => sum + size, 0));
  let at = 0;
  return sizes.map((size) => {
    const cup = faces.slice(at, at + size).sort((a, b) => a - b);
    at += size;
    return cup;
  });
}

function start(size: number, players: readonly string[], _language?: unknown, seed = 1, computers?: readonly boolean[]): LiarsGame | null {
  if (!LIARS_SIZES.includes(size as (typeof LIARS_SIZES)[number])) return null;
  const seats = seatsOf(players, computers, LIARS_FEWEST, LIARS_MOST);
  if (seats === null) return null;
  return { size, seed, ...seats, moves: [], thrown: 1, phase: "playing", toPlay: 0, winners: [], cups: throwCups(seed, 0, players.map(() => size)), bid: null, round: 0, called: null };
}

function moves(game: LiarsGame): LiarsMove[] {
  if (game.phase === "over") return [];
  const out: LiarsMove[] = game.bid === null ? [] : [{ kind: "call" }];
  const most = diceOnTable(game);
  for (let count = game.bid?.count ?? 1; count <= most; count += 1) {
    for (const face of LIARS_FACES) if (beatsBid(game.bid, count, face)) out.push({ kind: "bid", count, face });
  }
  return out;
}

function play(game: LiarsGame, move: LiarsMove): LiarsGame | null {
  if (game.phase === "over") return null;
  const seat = game.toPlay;
  const alive = (cups: LiarsGame["cups"]) => (at: number) => cups[at]!.length > 0;
  const moved = [...game.moves, move];
  if (move.kind === "bid") {
    if (!Number.isInteger(move.count) || !LIARS_FACES.includes(move.face as (typeof LIARS_FACES)[number])) return null;
    if (move.count > diceOnTable(game) || !beatsBid(game.bid, move.count, move.face)) return null;
    return { ...game, moves: moved, bid: { count: move.count, face: move.face, seat }, toPlay: nextSeat(game.players.length, seat, alive(game.cups)) };
  }
  if (move.kind !== "call" || game.bid === null) return null;
  const found = diceShowing(game.cups, game.bid.face);
  const loser = found >= game.bid.count ? seat : game.bid.seat;
  const called = { caller: seat, bidder: game.bid.seat, bid: { count: game.bid.count, face: game.bid.face }, found, loser, cups: game.cups };
  const sizes = game.cups.map((cup, at) => (at === loser ? cup.length - 1 : cup.length));
  const left = sizes.flatMap((size, at) => (size > 0 ? [at] : []));
  if (left.length === 1) {
    return { ...game, moves: moved, phase: "over", toPlay: left[0]!, winners: left, bid: null, called, cups: sizes.map((size) => new Array<number>(size).fill(0)) };
  }
  const cups = throwCups(game.seed, game.thrown, sizes);
  const opener = sizes[loser]! > 0 ? loser : nextSeat(game.players.length, loser, alive(cups));
  return { ...game, moves: moved, thrown: game.thrown + 1, cups, bid: null, round: game.round + 1, called, toPlay: opener };
}

function isLiarsMove(value: unknown): value is LiarsMove {
  const move = value as { kind?: unknown; count?: unknown; face?: unknown } | null;
  return move?.kind === "call" || (move?.kind === "bid" && Number.isInteger(move.count) && Number.isInteger(move.face));
}

const codec = diceTableCodec<LiarsGame, LiarsMove>("liarsDice", start, play, isLiarsMove);

export const LIARS_RULES: DiceTableRules<LiarsGame, LiarsMove> = {
  start,
  moves,
  play,
  over: (game) => game.phase === "over",
  winners: (game) => game.winners,
  encode: codec.encode,
  decode: codec.decode,
  toPlay: (game) => (game.phase === "over" ? null : game.toPlay),
  computer: liarsComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
