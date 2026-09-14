import "server-only";

import { canForfeit } from "@/lib/gomoku/engine";
import { MOVE_KINDS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";

import type { ForfeitRowGame, ForfeitRowVerdict } from "./forfeitRows.types";
import { replay } from "./liveGame";

/**
 * Which stored passes were turns a timeout took, decided one game at a time.
 *
 * Until the `forfeit` kind, a claimed timeout wrote the missed turn as a pass
 * in every game. In a game whose rules offer no pass, the replay refuses that
 * row and stops, so the game has sat a turn short of itself ever since —
 * unfinishable. Changing how the claim writes does nothing for the rows it has
 * already written. This decides which of them to rewrite; the runner beside it
 * (`forfeitRows.play.test.ts`) does the reading and, only when asked twice,
 * the writing.
 *
 * A REPAIR, NOT A BRIDGE IN THE REPLAY. A replay that read a refused pass as a
 * forfeit would carry the ambiguity for ever, into every record read from now
 * on, to fix a set of rows that is finite and can be named today.
 *
 * IT REPAIRS ONE SHAPE AND REFUSES EVERY OTHER. The rules are the claim's own,
 * read back from what the claim wrote:
 *
 *   - the game ran a clock, under the penalty that forfeits a turn rather than
 *     the game — no other clock writes a move;
 *   - the replay stops AT this pass, and the colour it names is the colour to
 *     move there;
 *   - the rules had no pass to offer, and would take the turn away: the claim
 *     now writes a forfeit in exactly that position;
 *   - it is the last move on the record, and the game row counts that many.
 *     Nothing can follow it — the stuck record refuses the next move — so a
 *     move after it is a different story this has no business guessing at;
 *   - the colour it names has a forfeit counted against it. A move by that
 *     colour, a pass included, resets the count to nought; only a claim raises
 *     it. That is the one column that says WHO wrote the row;
 *   - and read as a forfeit, the whole record replays.
 *
 * NO TIMING TEST, deliberately. A claim is judged against a deadline it then
 * overwrites, a courtesy gift or a day off only ever moves that deadline
 * later, and moves stored before `createdAt` existed all carry one moment. A
 * gap between two rows can refuse a real timeout and proves nothing the
 * forfeit count does not prove better.
 */
export function planForfeitRow(game: ForfeitRowGame): ForfeitRowVerdict | null {
  const state = replay(game);
  // The whole record replays: nothing stuck, nothing to do.
  if (state.moves.length >= game.moves.length) return null;
  const stuck = game.moves[state.moves.length];
  // Stopped at something else. A different fault, and not this repair's.
  if (stuck.kind !== MOVE_KINDS.pass) return null;

  const refuse = (reason: string): ForfeitRowVerdict => ({ kind: "refused", number: stuck.number, reason });
  if (game.moveTimeMs === null) return refuse("the game has no clock, so no claim could have written it");
  if (game.timeoutPenalty !== "turn" || game.clockMode === "game") {
    return refuse("a timeout under this game's clock loses the game and writes no move");
  }
  if (stuck.number !== state.moves.length + 1) return refuse("the move numbers before it have a gap");
  if (stuck !== game.moves[game.moves.length - 1]) return refuse("moves are recorded after it");
  if (game.moveCount !== stuck.number) return refuse(`the game row counts ${game.moveCount} moves, not ${stuck.number}`);
  if (stuck.stone !== state.toPlay) return refuse("it names a colour that was not to move");
  if (!canForfeit(state)) return refuse("the rules would not take a turn away here");

  const stone = stuck.stone as Stone;
  const forfeits = stone === STONES.black ? game.blackForfeits : game.whiteForfeits;
  if (forfeits < 1) return refuse("the colour it names has no forfeit counted, so no claim wrote it");

  const repaired = replay({
    ...game,
    moves: game.moves.map((move) => (move === stuck ? { ...move, kind: MOVE_KINDS.forfeit } : move)),
  });
  if (repaired.moves.length !== game.moves.length) return refuse("read as a forfeit, the record still does not replay");
  return { kind: "repair", number: stuck.number, stone };
}
