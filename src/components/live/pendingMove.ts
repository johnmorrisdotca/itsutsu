import { applyTurn } from "@/lib/gomoku/opponentTurns";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { AFTER_MOVE, type AfterMove } from "@/lib/preferences/turnFlow";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { BotTurn } from "@/lib/gomoku/opponent.types";
import { LIVE_MOVE_COPY } from "./live.constants";

/**
 * A MOVE PLACED BUT NOT YET SENT, and the board as it would be.
 *
 * A live game's record is final — take-back is a hot-seat thing — so until now
 * a misclick on a phone was a permanent move in a rated correspondence game
 * that might be days old. These games are played on trains and sofas, and the
 * elder correspondence sites all show the stone and ask before sending, which
 * is correct for the medium.
 *
 * THE PREVIEW IS THE ENGINE'S OWN ANSWER, not a drawing of one. The turn is
 * applied with `applyTurn`, the same function the computer's own move goes
 * through, so what a player sees is exactly what the rules do — captures
 * lifted, a line completed, a piece landed — rather than a stone painted on
 * top by a component that decided for itself what a move means. AGENTS.md is
 * explicit that components never read the board to decide outcomes; this asks
 * the engine and draws what comes back.
 *
 * A turn rather than a request body, because a turn is the shape both halves
 * already speak: `applyTurn` takes it, and `postTurn` turns it into the
 * request. That mapping exists for the browser bot and the catch-up, and this
 * is its third caller — so a turn kind that grows a new shape cannot be
 * handled here and forgotten there.
 */
export type PendingMove = {
  /** What was chosen, ready for `postTurn`. */
  turn: BotTurn;
  /** The board as this turn leaves it, straight from the engine. */
  after: GameState;
};

/**
 * The move a player has placed, or null when the engine refuses it.
 *
 * NULL RATHER THAN A PREVIEW OF NOTHING. `applyTurn` hands back the state it
 * was given when a turn is not legal, and holding that as "pending" would show
 * an unchanged board with a Submit button under it — a control that promises
 * something is about to happen when nothing is. The click is simply not taken.
 */
export function pendingMove(state: GameState, turn: BotTurn): PendingMove | null {
  const after = applyTurn(state, turn);
  return after === state ? null : { turn, after };
}

/**
 * What the Submit button says, which is where it is about to take you.
 *
 * A button that moves somebody should say where before it is pressed. The
 * destination is a setting (`afterMove`) rather than a question asked on every
 * turn, so this is the one place the setting becomes visible on the board —
 * and it names the GAME for "the next similar game", because "the next Pente"
 * is the sentence somebody means.
 */
export function submitWords(afterMove: AfterMove, variant: RuleVariant): string {
  if (afterMove === AFTER_MOVE.myGames) return LIVE_MOVE_COPY.submitToMyGames;
  if (afterMove === AFTER_MOVE.sameGame) {
    return LIVE_MOVE_COPY.submitToSame(RULE_VARIANT_DISPLAY[variant].label);
  }
  if (afterMove === AFTER_MOVE.nextWaiting) return LIVE_MOVE_COPY.submitToNext;
  return LIVE_MOVE_COPY.submit;
}
