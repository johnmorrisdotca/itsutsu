import { cardGameCodec, isCardList } from "../cardGameCodec.ts";
import type { CardGameRules } from "../cardGames.types.ts";

import { heartsMoves, heartsWinners, playHearts, startHearts } from "./hearts.ts";
import { heartsComputer } from "./heartsComputer.ts";
import type { HeartsGame, HeartsMove } from "./hearts.types.ts";

/** Hearts, kept as its table, seed and moves (`cardGameCodec`), and everything a table asks of its rules. */

function isHeartsMove(value: unknown): value is HeartsMove {
  if (typeof value !== "object" || value === null) return false;
  const move = value as Record<string, unknown>;
  return typeof move.play === "string" || isCardList(move.pass);
}

const codec = cardGameCodec<HeartsGame, HeartsMove>("hearts", startHearts, playHearts, isHeartsMove);
export const encodeHearts = codec.encode;
export const decodeHearts = codec.decode;

export const HEARTS_RULES: CardGameRules<HeartsGame, HeartsMove> = {
  start: startHearts,
  moves: heartsMoves,
  play: playHearts,
  over: (game) => game.phase === "over",
  winners: heartsWinners,
  encode: encodeHearts,
  decode: decodeHearts,
  toPlay: (game) => game.toPlay,
  computer: heartsComputer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
