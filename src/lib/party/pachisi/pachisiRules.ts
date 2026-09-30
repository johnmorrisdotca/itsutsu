// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartyRules } from "../party.types";

import { pachisiMoves, playPachisi, startPachisi } from "./pachisi";
import { decodePachisi, encodePachisi } from "./pachisiCodec";
import type { PachisiGame, PachisiMove } from "./pachisi.types";

/** Pachisi as every party game's rules answer (`PartyRules`): a table of people, thrown from the seed the gate gives. */
export const PACHISI_RULES: PartyRules<PachisiGame, PachisiMove> = {
  start: (size, players, _language, seed) => startPachisi(players, seed ?? 1, players.map(() => false), size),
  moves: pachisiMoves,
  play: playPachisi,
  over: (game) => game.phase === "finished",
  winners: (game) => game.winners,
  encode: encodePachisi,
  decode: decodePachisi,
};
