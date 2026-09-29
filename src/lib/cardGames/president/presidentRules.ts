import { cardGameCodec, isCardList } from "../cardGameCodec";
import type { CardGameRules } from "../cardGames.types";
import { isClimbMove } from "../climbing/climbing";

import { playPresident, presidentMoves, presidentWinners, startPresident } from "./president";
import { presidentComputer } from "./presidentComputer";
import type { PresidentGame, PresidentMove } from "./president.types";

/** President, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isPresidentMove(value: unknown): value is PresidentMove {
  return isClimbMove(value) || (typeof value === "object" && value !== null && isCardList((value as Record<string, unknown>).give));
}

const codec = cardGameCodec<PresidentGame, PresidentMove>("president", startPresident, playPresident, isPresidentMove);
export const encodePresident = codec.encode;
export const decodePresident = codec.decode;

export const PRESIDENT_RULES: CardGameRules<PresidentGame, PresidentMove> = {
  start: startPresident,
  moves: presidentMoves,
  play: playPresident,
  over: (game) => game.phase === "over",
  winners: presidentWinners,
  encode: encodePresident,
  decode: decodePresident,
  toPlay: (game) => game.toPlay,
  computer: presidentComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
