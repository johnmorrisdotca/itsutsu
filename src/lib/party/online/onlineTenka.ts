// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { PARTY_SPECS } from "../party.constants";
import { TENKA_PLACING } from "../tenka/tenka.constants";
import type { TenkaGame, TenkaMove, TenkaPlacing } from "../tenka/tenka.types";
import { playTenka, tenkaOver } from "../tenka/tenka";
import { decodeTenka, encodeTenka, readTenkaMove } from "../tenka/tenkaKeep";
import { isTenkaSeed, isTenkaTable, startTenka } from "../tenka/tenkaStart";

import type { OnlineRules } from "./online.types";

/**
 * TENKA AT A TABLE ON SEVERAL DEVICES (docs/plans/party-online/README.md,
 * stage 6): the same pure rules the table on one device plays (`playTenka`),
 * and the same text it keeps a game as (`encodeTenka`: the table, the seed and
 * the moves, the world made again from them, dice and all).
 *
 * Not through `fromPartyRules`, for two reasons. A game of chance is dealt
 * from its seed, and a table's seed comes with the set-up — the set-up's
 * browser draws it, as it does for a game on one device — where the party
 * rules' `start` would deal every table from the same one. And a move here is
 * what one press of the table sends: one move, or the two halves of a
 * fortifying move (from where to where, then how many), which the table on one
 * device also plays as one press.
 */

/** A press at the table: its moves, in the short lists a game is kept as (`writeTenkaMove`), one or two. */
export type TenkaTableMove = readonly TenkaMove[];

/** The most moves one press sends: a fortifying move and how many it moves. */
export const TENKA_PRESS_MOST = 2;

/** What Tenka's set-up sends beyond a size and the seats: the seed it was dealt from, and how the starting armies go down. */
export type TenkaTableSetUp = { seed: number; placing: TenkaPlacing };

const SPEC = PARTY_SPECS.tenka;

/** The set-up as the browser sent it, checked for its shape, or null. */
function readSetUp(sent: unknown): TenkaTableSetUp | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { seed, placing } = sent as Record<string, unknown>;
  if (typeof seed !== "number" || !isTenkaSeed(seed)) return null;
  if (placing !== TENKA_PLACING.auto && placing !== TENKA_PLACING.hand) return null;
  return { seed, placing };
}

/** Whether every number in a kept move is a whole number: the rules check ranges, and this keeps anything stranger out. */
function wholeNumbers(kept: unknown): boolean {
  return Array.isArray(kept) && kept.slice(1).every((value) => Number.isInteger(value));
}

export const TENKA_ONLINE: OnlineRules<TenkaGame, TenkaTableMove> = {
  sizes: SPEC.sizes,
  counts: Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, at) => SPEC.fewestPlayers + at),
  start: (size, count, extra) => {
    const setUp = readSetUp(extra?.setup);
    // A table of blank names: the names are the seats', written in for a page by `named`.
    return setUp === null || !isTenkaTable(size, count) ? null : startTenka(size, new Array<string>(count).fill(""), setUp.seed, setUp.placing);
  },
  encode: encodeTenka,
  decode: (text) => decodeTenka(text),
  toPlay: (game) => (tenkaOver(game) ? null : game.toPlay),
  winners: (game) => (tenkaOver(game) ? game.winners : []),
  moveCount: (game) => game.moves.length,
  readMove: (sent) => {
    if (!Array.isArray(sent) || sent.length < 1 || sent.length > TENKA_PRESS_MOST || !sent.every(wholeNumbers)) return null;
    const moves = sent.map(readTenkaMove);
    return moves.every((move) => move !== null) ? (moves as TenkaMove[]) : null;
  },
  /** Every move of the press, by the seat that pressed: one that would be another seat's, after a turn ended, is refused with the rest. */
  play: (game, moves) => {
    const seat = game.toPlay;
    let next: TenkaGame | null = game;
    for (const move of moves) {
      if (next === null || tenkaOver(next) || next.toPlay !== seat) return null;
      next = playTenka(next, move);
    }
    return next;
  },
  named: (game, names) => ({
    ...game,
    players: game.players.map((was, seat) => names[seat] ?? was),
  }),
};
