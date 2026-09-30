import { cardGameCodec } from "../cardGameCodec.ts";
import type { CardGameRules } from "../cardGames.types.ts";

import { crazyEightsMoves, crazyEightsWinners, playCrazyEights, startCrazyEights } from "./crazyEights.ts";
import { crazyEightsComputer } from "./crazyEightsComputer.ts";
import type { CrazyEightsGame, CrazyEightsMove } from "./crazyEights.types.ts";

/** Crazy Eights, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isCrazyEightsMove(value: unknown): value is CrazyEightsMove {
  if (typeof value !== "object" || value === null) return false;
  const move = value as Record<string, unknown>;
  if (typeof move.play === "string") return move.suit === undefined || typeof move.suit === "string";
  return move.draw === true || move.pass === true;
}

const codec = cardGameCodec<CrazyEightsGame, CrazyEightsMove>("crazyEights", startCrazyEights, playCrazyEights, isCrazyEightsMove);
export const encodeCrazyEights = codec.encode;
export const decodeCrazyEights = codec.decode;

export const CRAZY_EIGHTS_RULES: CardGameRules<CrazyEightsGame, CrazyEightsMove> = {
  start: startCrazyEights,
  moves: crazyEightsMoves,
  play: playCrazyEights,
  over: (game) => game.phase === "over",
  winners: crazyEightsWinners,
  encode: encodeCrazyEights,
  decode: decodeCrazyEights,
  toPlay: (game) => game.toPlay,
  computer: crazyEightsComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
