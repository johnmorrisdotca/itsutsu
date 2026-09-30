import { cardGameCodec } from "../cardGameCodec";
import type { CardGameRules } from "../cardGames.types";

import { cribbageMoves, cribbageWinners, playCribbage, startCribbage } from "./cribbage";
import { cribbageComputer } from "./cribbageComputer";
import type { CribbageGame, CribbageMove } from "./cribbage.types";

/** Cribbage, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isCribbageMove(value: unknown): value is CribbageMove {
  if (typeof value !== "object" || value === null) return false;
  const move = value as Record<string, unknown>;
  if (typeof move.play === "string") return true;
  return Array.isArray(move.crib) && move.crib.length === 2 && move.crib.every((card) => typeof card === "string");
}

const codec = cardGameCodec<CribbageGame, CribbageMove>("cribbage", startCribbage, playCribbage, isCribbageMove);
export const encodeCribbage = codec.encode;
export const decodeCribbage = codec.decode;

export const CRIBBAGE_RULES: CardGameRules<CribbageGame, CribbageMove> = {
  start: startCribbage,
  moves: cribbageMoves,
  play: playCribbage,
  over: (game) => game.phase === "over",
  winners: cribbageWinners,
  encode: encodeCribbage,
  decode: decodeCribbage,
  toPlay: (game) => game.toPlay,
  computer: cribbageComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
