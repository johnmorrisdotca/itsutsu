import { cardGameCodec } from "../cardGameCodec";
import type { CardGameRules } from "../cardGames.types";

import { ginMoves, ginWinners, playGin, startGin } from "./ginRummy";
import { ginComputer, ginSensible } from "./ginComputer";
import type { GinGame, GinMove } from "./ginRummy.types";

/** Gin Rummy, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isGinMove(value: unknown): value is GinMove {
  if (typeof value !== "object" || value === null) return false;
  const move = value as Record<string, unknown>;
  return move.draw === "stock" || move.draw === "discard" || typeof move.discard === "string" || typeof move.knock === "string";
}

const codec = cardGameCodec<GinGame, GinMove>("ginRummy", startGin, playGin, isGinMove);
export const encodeGin = codec.encode;
export const decodeGin = codec.decode;

export const GIN_RUMMY_RULES: CardGameRules<GinGame, GinMove> = {
  start: startGin,
  moves: ginMoves,
  play: playGin,
  over: (game) => game.phase === "over",
  winners: ginWinners,
  encode: encodeGin,
  decode: decodeGin,
  toPlay: (game) => game.toPlay,
  computer: ginComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
  sensible: ginSensible,
};
