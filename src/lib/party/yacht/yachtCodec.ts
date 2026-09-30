// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { replayYacht } from "./yacht";
import type { YachtGame, YachtMove } from "./yacht.types";

/**
 * A GAME OF YACHT AS TEXT, and back: what the table keeps in this browser
 * after every move. Only the table and the moves are written — never a die
 * or a sheet, which the moves make again from the seed (`replayYacht`) — so
 * what is read back is exactly the game those moves make, or nothing at all.
 *
 * A move is a few characters: `r<hold>` for a roll holding the dice in the
 * mask, `s<box>` for a box written.
 */

/** The version this text is written in: a kept game of any other is not read. */
const VERSION = 1;

function moveText(move: YachtMove): string {
  return move.kind === "roll" ? `r${move.hold}` : `s${move.box}`;
}

function moveOf(text: string): YachtMove | null {
  const found = /^([rs])(\d{1,2})$/.exec(text);
  if (found === null) return null;
  return found[1] === "r" ? { kind: "roll", hold: Number(found[2]) } : { kind: "score", box: Number(found[2]) };
}

export function encodeYacht(game: YachtGame): string {
  return JSON.stringify({
    v: VERSION,
    size: game.size,
    seed: game.seed,
    players: game.players,
    computers: game.computers,
    moves: game.moves.map(moveText).join(","),
  });
}

const isString = (value: unknown): value is string => typeof value === "string";

/** A kept game read back, or null for nothing kept or anything these rules cannot play out again. */
export function decodeYacht(text: string | null): YachtGame | null {
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
  const parsedMoves = moves === "" ? [] : moves.split(",").map(moveOf);
  if (parsedMoves.some((move) => move === null)) return null;
  return replayYacht(players, seed, computers, parsedMoves as YachtMove[], size);
}
