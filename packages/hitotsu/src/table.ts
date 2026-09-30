import { readHitotsuMove, readHitotsuOptions } from "./codec.ts";
import { hitotsuComputer } from "./computer.ts";
import { SEED_MOST } from "./random.ts";
import { startHitotsu } from "./rules.ts";
import type { HitotsuGame, HitotsuMove, HitotsuOptions } from "./types.ts";

/**
 * A TABLE ON SEVERAL DEVICES: what a server needs to run a game of Hitotsu
 * whose players each hold their own phone. The rules are the same pure ones a
 * table on one device plays; this is only what arrives over the wire, checked.
 *
 * The seed is drawn by whoever sets the table up and sent with the house
 * rules, so the server never needs a random number of its own, and the whole
 * game is its set-up and its moves (`encodeHitotsu`).
 *
 * NO JUMPING IN. A jump-in is a move made out of turn, a race for the card,
 * and a table on several devices takes one move at a time from the seat it
 * waits on; so the house rule is taken off at the start whatever was sent, and
 * a jump is never read as a move.
 */

/** What a set-up sends beyond a length and the seats: the seed it was dealt from, and the house rules. */
export type HitotsuTableSetUp = { seed: number; options: HitotsuOptions };

/** The set-up as a device sent it, checked for its shape, jumping in taken off, or null. */
export function readTableSetUp(sent: unknown): HitotsuTableSetUp | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { seed, options } = sent as Record<string, unknown>;
  if (typeof seed !== "number" || !Number.isInteger(seed) || seed < 1 || seed > SEED_MOST) return null;
  const read = readHitotsuOptions(options);
  return read === null ? null : { seed, options: { ...read, jumpIn: false } };
}

/**
 * A new table: `count` seats with blank names (a table's names are its seats',
 * written in when it is shown), the seats in `computers` played by the
 * computer player. Null for a set-up that does not read, or a table the rules
 * will not start.
 */
export function startTable(size: number, count: number, sent: unknown, computers: readonly number[] = []): HitotsuGame | null {
  const setUp = readTableSetUp(sent);
  if (setUp === null) return null;
  const blanks = new Array<string>(count).fill("");
  const played = new Set(computers);
  return startHitotsu(size, blanks, setUp.seed, setUp.options, blanks.map((_, seat) => played.has(seat)));
}

/** A move as a device sent it, checked for its shape, or null; a jump is never a move at a table on several devices. */
export function readTableMove(sent: unknown): HitotsuMove | null {
  const move = readHitotsuMove(sent);
  return move === null || "jump" in move ? null : move;
}

/** The seat the table waits on, or null once the game is over. */
export function tableToPlay(game: HitotsuGame): number | null {
  return game.phase === "over" ? null : game.toPlay;
}

/** The computer player's move for this seat, or null when the table is not waiting on it. */
export function tableComputerMove(game: HitotsuGame, seat: number): HitotsuMove | null {
  return tableToPlay(game) === seat ? hitotsuComputer(game) : null;
}

/** The game with its seats' names written in, a seat with no name keeping the one it had. */
export function namedTable(game: HitotsuGame, names: readonly (string | undefined)[]): HitotsuGame {
  return { ...game, players: game.players.map((was, seat) => names[seat] ?? was) };
}
