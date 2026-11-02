// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { seededRandom } from "../../puzzles/random";
import { cleanPartyName } from "../partyNames";

import type { DiceTableBase, DiceTableRules } from "./diceTable.types";

/**
 * WHAT THE PLAIN DICE TABLES SHARE: the throw, the seats and the keeping.
 *
 * THE RESULT IS DECIDED BEFORE ANYTHING IS DRAWN. A throw is the game's seed and
 * how many throws came before it, the same in every browser and on the server;
 * Korokoro's die (`PartyDie`) is then told the face and tumbles onto it. So the
 * game is fair and replayable, and a reload throws nothing new.
 */

/** The largest seed a table takes: a whole number the size a browser's `freshSeed` draws. */
export const DICE_SEED_MOST = 2 ** 31 - 1;

/** Six-sided dice, as many as asked, for the throw after `thrown` throws of this game. */
export function throwDice(seed: number, thrown: number, count: number): number[] {
  const random = seededRandom((seed ^ Math.imul(thrown + 1, 0x9e3779b1)) >>> 0);
  return Array.from({ length: count }, () => 1 + Math.floor(random() * 6));
}

/** The seats a game starts with, tidied; null for a table of the wrong size. */
export function seatsOf(players: readonly string[], computers: readonly boolean[] | undefined, fewest: number, most: number): { players: string[]; computers: boolean[] } | null {
  if (players.length < fewest || players.length > most) return null;
  return { players: players.map(cleanPartyName), computers: players.map((_, seat) => computers?.[seat] === true) };
}

/** The next seat round the table from this one for which `open` says yes, or this one if nobody else qualifies. */
export function nextSeat(count: number, from: number, open: (seat: number) => boolean): number {
  for (let step = 1; step <= count; step += 1) {
    const seat = (from + step) % count;
    if (open(seat)) return seat;
  }
  return from;
}

/** Every seat holding the highest figure: more than one when it is shared. */
export function leaders(figures: readonly number[]): number[] {
  const best = Math.max(...figures);
  return figures.flatMap((figure, seat) => (figure === best ? [seat] : []));
}

/** The same table again, with a new seed for the dice. */
export function sameTableAgain<S extends DiceTableBase<M>, M>(rules: Pick<DiceTableRules<S, M>, "start">, game: S, seed: number): S | null {
  return rules.start(game.size, game.players, undefined, seed, game.computers);
}

/** A kept game's version: a kept game of any other is not read. */
const KEPT_VERSION = 1;

/**
 * A GAME AS TEXT, AND BACK: its table, its seed and its moves, never a die or a
 * score, which the moves make again. What is read back is exactly the game
 * those moves make, or nothing: saved text is somebody's to edit, and a move the
 * rules refuse means the text is not a game. `name` keeps one game's text from
 * being read as another's.
 */
export function diceTableCodec<S extends DiceTableBase<M>, M>(
  name: string,
  start: DiceTableRules<S, M>["start"],
  play: (game: S, move: M) => S | null,
  isMove: (value: unknown) => value is M,
): { encode: (game: S) => string; decode: (text: string | null) => S | null } {
  return {
    encode: (game) => JSON.stringify({ v: KEPT_VERSION, g: name, size: game.size, seed: game.seed, players: game.players, computers: game.computers, moves: game.moves }),
    decode: (text) => {
      if (text === null) return null;
      let kept: unknown;
      try {
        kept = JSON.parse(text);
      } catch {
        return null;
      }
      if (typeof kept !== "object" || kept === null) return null;
      const { v, g, size, seed, players, computers, moves } = kept as Record<string, unknown>;
      if (v !== KEPT_VERSION || g !== name || typeof size !== "number" || typeof seed !== "number" || !Number.isInteger(seed)) return null;
      if (!Array.isArray(players) || !players.every((one) => typeof one === "string")) return null;
      if (!Array.isArray(computers) || computers.length !== players.length || !computers.every((one) => typeof one === "boolean")) return null;
      if (!Array.isArray(moves) || !moves.every(isMove)) return null;
      let game = start(size, players as string[], undefined, seed, computers as boolean[]);
      for (const move of moves as M[]) {
        if (game === null) return null;
        game = play(game, move);
      }
      return game;
    },
  };
}
