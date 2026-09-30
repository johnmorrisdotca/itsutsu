import { cardGameCodec } from "../cardGameCodec.ts";
import type { CardGameRules } from "../cardGames.types.ts";

import { goFishMoves, goFishWinners, playGoFish, startGoFish } from "./goFish.ts";
import { goFishComputer } from "./goFishComputer.ts";
import type { GoFishGame, GoFishMove } from "./goFish.types.ts";

/** Go Fish, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isGoFishMove(value: unknown): value is GoFishMove {
  if (typeof value !== "object" || value === null) return false;
  const move = value as Record<string, unknown>;
  return Number.isInteger(move.ask) && Number.isInteger(move.rank);
}

const codec = cardGameCodec<GoFishGame, GoFishMove>("goFish", startGoFish, playGoFish, isGoFishMove);
export const encodeGoFish = codec.encode;
export const decodeGoFish = codec.decode;

export const GO_FISH_RULES: CardGameRules<GoFishGame, GoFishMove> = {
  start: startGoFish,
  moves: goFishMoves,
  play: playGoFish,
  over: (game) => game.phase === "over",
  winners: goFishWinners,
  encode: encodeGoFish,
  decode: decodeGoFish,
  toPlay: (game) => game.toPlay,
  computer: goFishComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
