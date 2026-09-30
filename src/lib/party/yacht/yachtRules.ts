// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartyRules } from "../party.types";

import { YACHT_PHASES, playYacht, startYacht, yachtMoves } from "./yacht";
import { decodeYacht, encodeYacht } from "./yachtCodec";
import type { YachtGame, YachtMove } from "./yacht.types";

/**
 * Yacht as every party game's rules answer (`PartyRules`): what the New Game
 * Gate plays out at every table it offers, rolled from the seed the gate
 * gives. A table of people only — the computer players are the table's, not
 * the gate's — and of at least two: a party is a table, and the gate refuses
 * a table of one. The table itself also seats one person alone
 * (`startYacht`), for a sheet to beat.
 */
export const YACHT_RULES: PartyRules<YachtGame, YachtMove> = {
  start: (size, players, _language, seed) => (players.length < 2 ? null : startYacht(players, seed ?? 1, players.map(() => false), size)),
  moves: yachtMoves,
  play: playYacht,
  over: (game) => game.phase === YACHT_PHASES.finished,
  winners: (game) => game.winners,
  encode: encodeYacht,
  decode: decodeYacht,
};
