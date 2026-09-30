import { cardGameCodec } from "../cardGameCodec.ts";
import type { CardGameRules } from "../cardGames.types.ts";

import { playSpades, spadesMoves, spadesWinners, startSpades } from "./spades.ts";
import { spadesComputer } from "./spadesComputer.ts";
import type { SpadesGame, SpadesMove } from "./spades.types.ts";

/** Spades, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isSpadesMove(value: unknown): value is SpadesMove {
  if (typeof value !== "object" || value === null) return false;
  const move = value as Record<string, unknown>;
  return typeof move.play === "string" || typeof move.bid === "number";
}

const codec = cardGameCodec<SpadesGame, SpadesMove>("spades", startSpades, playSpades, isSpadesMove);
export const encodeSpades = codec.encode;
export const decodeSpades = codec.decode;

export const SPADES_RULES: CardGameRules<SpadesGame, SpadesMove> = {
  start: startSpades,
  moves: spadesMoves,
  play: playSpades,
  over: (game) => game.phase === "over",
  winners: spadesWinners,
  encode: encodeSpades,
  decode: decodeSpades,
  toPlay: (game) => game.toPlay,
  computer: spadesComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
