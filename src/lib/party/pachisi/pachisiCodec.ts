// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { replayPachisi } from "./pachisi";
import type { PachisiGame, PachisiMove } from "./pachisi.types";

/**
 * A GAME OF PACHISI AS TEXT, and back: the table and the moves, never a pawn
 * or a die, which the moves make again from the seed (`replayPachisi`). A
 * move is `r` for a throw, `m<pawn>.<use>` for a value moved, `e<pawn>` for a
 * pawn entered with both dice.
 */

const VERSION = 1;

function moveText(move: PachisiMove): string {
  if (move.kind === "roll") return "r";
  return move.kind === "enter" ? `e${move.pawn}` : `m${move.pawn}.${move.use}`;
}

function moveOf(text: string): PachisiMove | null {
  if (text === "r") return { kind: "roll" };
  const entered = /^e(\d)$/.exec(text);
  if (entered !== null) return { kind: "enter", pawn: Number(entered[1]) };
  const moved = /^m(\d)\.(\d)$/.exec(text);
  return moved === null ? null : { kind: "move", pawn: Number(moved[1]), use: Number(moved[2]) };
}

export function encodePachisi(game: PachisiGame): string {
  return JSON.stringify({ v: VERSION, size: game.size, seed: game.seed, players: game.players, computers: game.computers, moves: game.moves.map(moveText).join(",") });
}

const isString = (value: unknown): value is string => typeof value === "string";

/** A kept game read back, or null for nothing kept or anything these rules cannot play out again. */
export function decodePachisi(text: string | null): PachisiGame | null {
  if (text === null) return null;
  let kept: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    kept = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const { v, size, seed, players, computers, moves } = kept;
  if (v !== VERSION || typeof size !== "number" || typeof seed !== "number") return null;
  if (!Array.isArray(players) || !players.every(isString)) return null;
  if (!Array.isArray(computers) || !computers.every((one) => typeof one === "boolean")) return null;
  if (!isString(moves)) return null;
  const parsed = moves === "" ? [] : moves.split(",").map(moveOf);
  if (parsed.some((move) => move === null)) return null;
  return replayPachisi(players, seed, computers, parsed as PachisiMove[], size);
}
