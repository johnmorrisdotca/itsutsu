import type { PartyRules } from "../party.types";
import { SUGOROKU_KIND_LIST, type SugorokuKind } from "./sugoroku.constants";
import type { SugorokuMove, SugorokuTable } from "./sugoroku.types";
import { decodeSugoroku, encodeSugoroku, playSugoroku, startSugoroku, sugorokuMoves, sugorokuOver, sugorokuWinners } from "./sugorokuTable";

/**
 * One of the seven as every party game's rules answer (`PartyRules`): what the
 * New Game Gate plays out at every match length a game offers, to its end, in
 * the dice its seed makes. A "size" is the match length in points. A table
 * with a computer in a seat starts through `startSugoroku` with the strength
 * the set-up chose.
 */
function rulesOf(kind: SugorokuKind): PartyRules<SugorokuTable, SugorokuMove> {
  return {
    start: (size, players, _language, seed, computers) => startSugoroku(kind, size, players, seed ?? 1, computers),
    moves: sugorokuMoves,
    play: playSugoroku,
    over: sugorokuOver,
    winners: sugorokuWinners,
    encode: encodeSugoroku,
    decode: decodeSugoroku,
  };
}

/** Every one's rules, by kind. */
export const SUGOROKU_RULES = Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, rulesOf(kind)])) as Record<SugorokuKind, PartyRules<SugorokuTable, SugorokuMove>>;
