import { cardGameCodec } from "../cardGameCodec";
import type { CardGameRules } from "../cardGames.types";
import { isClimbMove } from "../climbing/climbing";
import type { ClimbMove } from "../climbing/climbing.types";

import { bigTwoMoves, bigTwoWinners, playBigTwo, startBigTwo } from "./bigTwo";
import { bigTwoComputer } from "./bigTwoComputer";
import type { BigTwoGame } from "./bigTwo.types";

/** Big Two, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

const codec = cardGameCodec<BigTwoGame, ClimbMove>("bigTwo", startBigTwo, playBigTwo, isClimbMove);
export const encodeBigTwo = codec.encode;
export const decodeBigTwo = codec.decode;

export const BIG_TWO_RULES: CardGameRules<BigTwoGame, ClimbMove> = {
  start: startBigTwo,
  moves: bigTwoMoves,
  play: playBigTwo,
  over: (game) => game.phase === "over",
  winners: bigTwoWinners,
  encode: encodeBigTwo,
  decode: decodeBigTwo,
  toPlay: (game) => game.toPlay,
  computer: bigTwoComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
