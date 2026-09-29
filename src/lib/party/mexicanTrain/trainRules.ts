// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartyRules } from "../party.types";

import { TRAIN_PHASES, playTrain, startTrain, trainMoves } from "./mexicanTrain";
import type { TrainGame, TrainMove } from "./mexicanTrain.types";
import { decodeTrain, encodeTrain } from "./trainCodec";

/**
 * Mexican Train as every party game's rules answer (`PartyRules`): what the
 * New Game Gate plays out at every set and every table it offers. A table of
 * people only — the computer players are the table's, not the gate's — at
 * every round, with the default options, dealt from the seed the gate gives.
 */
export const MEXICAN_TRAIN_RULES: PartyRules<TrainGame, TrainMove> = {
  start: (set, players, _language, seed) => startTrain(set, players, seed ?? 1),
  moves: trainMoves,
  play: playTrain,
  over: (game) => game.phase === TRAIN_PHASES.finished,
  winners: (game) => game.winners,
  encode: encodeTrain,
  decode: decodeTrain,
};
