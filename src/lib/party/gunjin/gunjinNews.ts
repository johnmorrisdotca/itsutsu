// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PlayerView } from "@johnmorrisdotca/gunjin";
import { roleName } from "@johnmorrisdotca/gunjin";
import { viewForPlayer } from "@johnmorrisdotca/gunjin/views";

import { GUNJIN_REASONS, gunjinBoardOf } from "./gunjin.constants";
import type { GunjinGame } from "./gunjin.types";

/**
 * WHAT THE TABLE SAYS HAPPENED, from the engine's public record alone: where
 * a piece went, and what the fight, if there was one, took off the board. The
 * record carries no rank, except on Capture Flag where the rules show both
 * ranks of every fight; it is the same for both players, so it may be said on
 * the cover between turns and under the board on the next one.
 */

/** A square as a player says it: its column's letter and its row counted up from the near edge of red's side, "E4". */
export function squareName(height: number, x: number, y: number): string {
  return `${String.fromCharCode(65 + x)}${height - y}`;
}

/** The last few moves in words, newest first. `names` are the two seats'. */
export function gunjinNewsLines(game: GunjinGame, names: readonly string[], most: number): string[] {
  const board = gunjinBoardOf(game.size);
  if (board === null) return [];
  const log = viewForPlayer(game.match, 0).publicLog;
  return log
    .slice(-most)
    .reverse()
    .map((event) => describe(event, names, board.height, board.reveals))
    .filter((line) => line !== "");
}

/** The last move in words, or null before the first. */
export function gunjinNews(game: GunjinGame, names: readonly string[]): string | null {
  return gunjinNewsLines(game, names, 1)[0] ?? null;
}

/** One public event as a sentence. */
function describe(event: PlayerView["publicLog"][number], names: readonly string[], height: number, reveals: boolean): string {
  if (event.from === undefined || event.to === undefined) return "";
  const mover = names[event.player] ?? "";
  const other = names[event.player === 0 ? 1 : 0] ?? "";
  const from = squareName(height, event.from.x, event.from.y);
  const to = squareName(height, event.to.x, event.to.y);
  const cell = (c: { x: number; y: number }) => squareName(height, c.x, c.y);
  const took = event.capturedCells.map(cell);
  const lostAttacker = took.includes(from);
  const lostDefender = took.includes(to);
  // Capture Flag's rules show both ranks of a fight: the mover's first, as the record lists them.
  const ranks = reveals && event.revealed !== undefined && event.revealed.length === 2 ? event.revealed.map((one) => roleName("en", one.kind)) : null;
  if (!lostAttacker && !lostDefender) return `${mover} moved a piece from ${from} to ${to}.`;
  if (lostAttacker && lostDefender) {
    return ranks === null ? `${mover}'s piece attacked ${other}'s on ${to}: both were taken off.` : `${mover}'s ${ranks[0]} and ${other}'s ${ranks[1]} met on ${to}: both were taken off.`;
  }
  if (lostDefender) {
    return ranks === null ? `${mover}'s piece from ${from} took ${other}'s on ${to}.` : `${mover}'s ${ranks[0]} from ${from} took ${other}'s ${ranks[1]} on ${to}.`;
  }
  return ranks === null ? `${mover}'s piece from ${from} attacked ${other}'s on ${to} and was taken off.` : `${mover}'s ${ranks[0]} from ${from} attacked ${other}'s ${ranks[1]} on ${to} and was taken off.`;
}

/** Why a game ended, in words: "the flag was taken". */
export function gunjinReason(game: GunjinGame): string | null {
  const result = game.match.result;
  return result === undefined ? null : (GUNJIN_REASONS[result.reason] ?? result.reason);
}
