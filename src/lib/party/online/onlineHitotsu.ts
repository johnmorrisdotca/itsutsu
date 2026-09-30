// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { hitotsuWinners, playHitotsu, startHitotsu } from "../hitotsu/hitotsu";
import type { HitotsuGame, HitotsuMove, HitotsuOptions } from "../hitotsu/hitotsu.types";
import { decodeHitotsu, encodeHitotsu, readHitotsuMove, readHitotsuOptions } from "../hitotsu/hitotsuRules";
import { PARTY_SPECS } from "../party.constants";

import { COMPUTER_SEAT_NAME } from "./online.constants";
import type { OnlineRules } from "./online.types";

/**
 * HITOTSU AT A TABLE ON SEVERAL DEVICES (docs/plans/hitotsu/README.md): the
 * same pure rules the table on one device plays (`playHitotsu`), and the same
 * text it keeps a game as (`encodeHitotsu`: the table, the house rules, the
 * seed and the moves, every hand and the stock made again from them).
 *
 * Not through `fromPartyRules`, for Mexican Train's reasons (`onlineTrain.ts`):
 * the shuffle is drawn from a seed the set-up's browser draws and sends with
 * the house rules, and a seat may be the table's own computer player.
 *
 * NO JUMPING IN HERE. A jump-in is a move made out of turn, and a table on
 * several devices takes one move at a time from the seat it waits on; so the
 * house rule is refused at the start, whatever was sent, and a jump is never
 * read as a move.
 */

/** What Hitotsu's set-up sends beyond a length and the seats: the seed it was dealt from, and the house rules. */
export type HitotsuTableSetUp = { seed: number; options: HitotsuOptions };

/** The largest seed a table takes: a whole number the size a browser's `freshSeed` draws. */
const SEED_MOST = 2 ** 31 - 1;

const SPEC = PARTY_SPECS.hitotsu;

/** The set-up as the browser sent it, checked for its shape, jumping in taken off, or null. */
function readSetUp(sent: unknown): HitotsuTableSetUp | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { seed, options } = sent as Record<string, unknown>;
  if (typeof seed !== "number" || !Number.isInteger(seed) || seed < 1 || seed > SEED_MOST) return null;
  const read = readHitotsuOptions(options);
  return read === null ? null : { seed, options: { ...read, jumpIn: false } };
}

export const HITOTSU_ONLINE: OnlineRules<HitotsuGame, HitotsuMove> = {
  sizes: SPEC.sizes,
  counts: Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, at) => SPEC.fewestPlayers + at),
  start: (size, count, extra) => {
    const setUp = readSetUp(extra?.setup);
    if (setUp === null) return null;
    const computers = new Set(extra?.computers ?? []);
    // A table of blank names: the names are the seats', written in for a page by `named`.
    const blanks = new Array<string>(count).fill("");
    return startHitotsu(size, blanks, setUp.seed, setUp.options, blanks.map((_, seat) => computers.has(seat)));
  },
  encode: encodeHitotsu,
  decode: (text) => decodeHitotsu(text),
  toPlay: (game) => (game.phase === "over" ? null : game.toPlay),
  winners: hitotsuWinners,
  moveCount: (game) => game.moves.length,
  readMove: (sent) => {
    const move = readHitotsuMove(sent);
    return move === null || "jump" in move ? null : move;
  },
  play: playHitotsu,
  named: (game, names) => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) }),
  // The table's own computer player (`hitotsuComputer.ts`), one level of it, sitting as "Computer"; its move is the worker's.
  computers: {
    levels: ["computer"],
    seat: () => ({ memberId: null, name: COMPUTER_SEAT_NAME }),
    levelOf: (seat) => (seat.memberId === null ? "computer" : null),
  },
};
