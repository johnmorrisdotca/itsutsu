import type { PuzzleCheck } from "../puzzles.types";
import { isCleared } from "./board";
import { dealFits, decodeMoves, replayMoves } from "./moves";

/**
 * Whether a solve clears a Mahjong deal: the check the browser makes to say
 * "cleared" and the server makes before it pays. It plays the moves on the
 * deal — every pair two free tiles that match, every shuffle made only when no
 * pair was left and drawn exactly as the rules draw it — and asks that the
 * layout ends empty. A few thousand steps at most, and no search.
 */
export function checkMahjong(size: number, givens: string, answer: string): PuzzleCheck {
  if (!dealFits(size, givens)) return { ok: false, reason: "the givens are not a deal of that layout" };
  const moves = decodeMoves(answer, givens.length);
  if (moves === null) return { ok: false, reason: "the answer is not a list of moves" };
  const played = replayMoves(size, givens, moves);
  if (played === null) return { ok: false, reason: "a move the rules do not allow" };
  if (!isCleared(played.cells)) return { ok: false, reason: "tiles are left on the layout" };
  return { ok: true };
}
