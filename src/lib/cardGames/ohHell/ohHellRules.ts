import { cardGameCodec } from "../cardGameCodec";
import type { CardGameRules } from "../cardGames.types";

import { ohHellMoves, ohHellWinners, playOhHell, startOhHell } from "./ohHell";
import { ohHellComputer } from "./ohHellComputer";
import type { OhHellGame, OhHellMove } from "./ohHell.types";

/** Oh Hell, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isOhHellMove(value: unknown): value is OhHellMove {
  if (typeof value !== "object" || value === null) return false;
  const move = value as Record<string, unknown>;
  return typeof move.play === "string" || (typeof move.bid === "number" && Number.isInteger(move.bid));
}

const codec = cardGameCodec<OhHellGame, OhHellMove>("ohHell", startOhHell, playOhHell, isOhHellMove);
export const encodeOhHell = codec.encode;
export const decodeOhHell = codec.decode;

export const OH_HELL_RULES: CardGameRules<OhHellGame, OhHellMove> = {
  start: startOhHell,
  moves: ohHellMoves,
  play: playOhHell,
  over: (game) => game.phase === "over",
  winners: ohHellWinners,
  encode: encodeOhHell,
  decode: decodeOhHell,
  toPlay: (game) => game.toPlay,
  computer: ohHellComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
