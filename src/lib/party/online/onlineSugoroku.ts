import { SUGOROKU_KIND_LIST, SUGOROKU_LENGTHS, SUGOROKU_STRENGTHS, sugorokuComputerName, sugorokuStrengthOfName, type SugorokuKind } from "../sugoroku/sugoroku.constants";
import type { SugorokuMove, SugorokuTable } from "../sugoroku/sugoroku.types";
import {
  decodeSugoroku,
  encodeSugoroku,
  namedSugoroku,
  playSugoroku,
  readSugorokuMove,
  startSugoroku,
  sugorokuMoveCount,
  sugorokuToPlay,
  sugorokuWinners,
} from "../sugoroku/sugorokuTable";

import type { OnlineRules } from "./online.types";

/**
 * THE BACKGAMMON GAMES AT A TABLE ON TWO DEVICES (docs/plans/sugoroku/README.md):
 * the package's rules on the site's tables, the same pure rules the table on one
 * device plays (`playSugoroku`) and the same text it keeps a game as (`encodeSugoroku`:
 * the seats, then the match's record). A move is a whole turn — the dice are the
 * game's seed's, so the roll is not a trip to the server of its own — or the cube,
 * and the server replays nothing to answer a poll: the table keeps the record whole.
 *
 * THE SEED IS THE SERVER'S. A table is started with a seed the server draws, never
 * one the host chose, so nobody picks the dice they are dealt. It is stored with
 * the game, and so is in the text each player's page decodes: a person who reads it
 * there can look ahead (a decision written down in the plan), but cannot make up
 * dice, since every throw is held to the seed.
 *
 * COMPUTER SEATS are the package's four strengths, each sitting as "Computer" and
 * its name; the move is worked out in a browser at the table, as every computer's
 * here is, by the worker (`onlineComputerMoves.ts`).
 */

/** A fresh seed for a table: the platform's own random numbers, 31 bits. */
function freshTableSeed(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]! >>> 1;
}

function onlineOf(kind: SugorokuKind): OnlineRules<SugorokuTable, SugorokuMove> {
  return {
    sizes: SUGOROKU_LENGTHS[kind],
    counts: [2],
    start: (size, count, extra) => (count !== 2 ? null : startSugoroku(kind, size, ["", ""], freshTableSeed(), [extra?.computers?.includes(0) === true, extra?.computers?.includes(1) === true])),
    encode: encodeSugoroku,
    decode: decodeSugoroku,
    toPlay: sugorokuToPlay,
    winners: sugorokuWinners,
    moveCount: sugorokuMoveCount,
    readMove: readSugorokuMove,
    play: playSugoroku,
    named: namedSugoroku,
    computers: {
      levels: SUGOROKU_STRENGTHS,
      seat: (level) => ({ memberId: null, name: sugorokuComputerName(SUGOROKU_STRENGTHS.find((strength) => strength === level) ?? "careful") }),
      levelOf: (seat) => (seat.memberId === null ? sugorokuStrengthOfName(seat.name) : null),
    },
  };
}

/** Each of the seven's rules for a table on several devices. */
export const SUGOROKU_ONLINE = Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, onlineOf(kind)])) as Record<SugorokuKind, OnlineRules<SugorokuTable, SugorokuMove>>;
