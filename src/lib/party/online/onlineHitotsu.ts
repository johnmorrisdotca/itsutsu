import { decodeHitotsu, encodeHitotsu, type HitotsuGame, type HitotsuMove, hitotsuWinners, namedTable, playHitotsu, readTableMove, startTable, tableToPlay } from "@johnmorrisdotca/hitotsu";
import { PARTY_SPECS } from "../party.constants";

import { COMPUTER_SEAT_NAME } from "./online.constants";
import type { OnlineRules } from "./online.types";

/**
 * HITOTSU AT A TABLE ON SEVERAL DEVICES (docs/plans/hitotsu/README.md): the
 * package's own table (`src/table.ts` in the Hitotsu repository) on the site's tables.
 * The same pure rules the table on one device plays (`playHitotsu`), and the
 * same text it keeps a game as (`encodeHitotsu`: the table, the house rules,
 * the seed and the moves, every hand and the stock made again from them).
 *
 * Not through `fromPartyRules`, for Mexican Train's reasons (`onlineTrain.ts`):
 * the shuffle is drawn from a seed the set-up's browser draws and sends with
 * the house rules, and a seat may be the table's own computer player.
 *
 * NO JUMPING IN HERE. A jump-in is a move made out of turn, and a table on
 * several devices takes one move at a time from the seat it waits on; so the
 * package's table refuses the house rule at the start, whatever was sent, and
 * never reads a jump as a move.
 */

const SPEC = PARTY_SPECS.hitotsu;

export const HITOTSU_ONLINE: OnlineRules<HitotsuGame, HitotsuMove> = {
  sizes: SPEC.sizes,
  counts: Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, at) => SPEC.fewestPlayers + at),
  // A table of blank names: the names are the seats', written in for a page by `named`.
  start: (size, count, extra) => startTable(size, count, extra?.setup, extra?.computers ?? []),
  encode: encodeHitotsu,
  decode: (text) => decodeHitotsu(text),
  toPlay: tableToPlay,
  winners: hitotsuWinners,
  moveCount: (game) => game.moves.length,
  readMove: readTableMove,
  play: playHitotsu,
  named: namedTable,
  // The table's own computer player (`hitotsuComputer`), one level of it, sitting as "Computer"; its move is the worker's.
  computers: {
    levels: ["computer"],
    seat: () => ({ memberId: null, name: COMPUTER_SEAT_NAME }),
    levelOf: (seat) => (seat.memberId === null ? "computer" : null),
  },
};
