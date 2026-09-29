// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { TRAIN_DOUBLES, TRAIN_LENGTHS, TRAIN_MEXICAN } from "./mexicanTrain.constants";
import { movesOf, replayTrain } from "./mexicanTrain";
import type { TrainGame, TrainMove, TrainOptions } from "./mexicanTrain.types";

/**
 * A GAME OF MEXICAN TRAIN AS TEXT, and back: what the table keeps in this
 * browser after every move. Only the table and the moves are written — never
 * a hand, a train or the boneyard, which the moves make again from the seed
 * (`replayTrain`) — so what is read back is exactly the game those moves
 * make, or nothing at all.
 *
 * A move is a few characters: `p<tile>.<train>` for a tile laid, `d` for a
 * draw, `x` for a pass, `n` for the next round dealt.
 */

/** The version this text is written in: a kept game of any other is not read. */
const VERSION = 1;

function moveText(move: TrainMove): string {
  switch (move.kind) {
    case "play":
      return `p${move.tile}.${move.train}`;
    case "draw":
      return "d";
    case "pass":
      return "x";
    case "next":
      return "n";
  }
}

function moveOf(text: string): TrainMove | null {
  if (text === "d") return { kind: "draw" };
  if (text === "x") return { kind: "pass" };
  if (text === "n") return { kind: "next" };
  const played = /^p(\d+)\.(\d+)$/.exec(text);
  return played === null ? null : { kind: "play", tile: Number(played[1]), train: Number(played[2]) };
}

export function encodeTrain(game: TrainGame): string {
  return JSON.stringify({
    v: VERSION,
    set: game.set,
    options: game.options,
    seed: game.seed,
    players: game.players,
    computers: game.computers,
    moves: movesOf(game).map(moveText).join(","),
  });
}

const isString = (value: unknown): value is string => typeof value === "string";

function optionsOf(value: unknown): TrainOptions | null {
  if (typeof value !== "object" || value === null) return null;
  const { length, doubles, mexican } = value as Record<string, unknown>;
  if (!Object.values(TRAIN_LENGTHS).includes(length as never)) return null;
  if (!Object.values(TRAIN_DOUBLES).includes(doubles as never)) return null;
  if (!Object.values(TRAIN_MEXICAN).includes(mexican as never)) return null;
  return { length, doubles, mexican } as TrainOptions;
}

/** A kept game read back, or null for nothing kept or anything these rules cannot play out again. */
export function decodeTrain(text: string | null): TrainGame | null {
  if (text === null) return null;
  let kept: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    kept = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const { v, set, seed, players, computers, moves } = kept;
  const options = optionsOf(kept.options);
  if (v !== VERSION || typeof set !== "number" || typeof seed !== "number" || options === null) return null;
  if (!Array.isArray(players) || !players.every(isString)) return null;
  if (!Array.isArray(computers) || !computers.every((one) => typeof one === "boolean")) return null;
  if (!isString(moves)) return null;
  const parsedMoves = moves === "" ? [] : moves.split(",").map(moveOf);
  if (parsedMoves.some((move) => move === null)) return null;
  return replayTrain(set, players, seed, options, computers, parsedMoves as TrainMove[]);
}
