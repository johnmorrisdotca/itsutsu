import {
  PLACEMENTS,
  VARIANT_SPECS,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { advantageReadingFor } from "@/lib/gomoku/advantage";
import { UNREADABLE_DISPLAY } from "@/lib/gomoku/advantage.constants";
import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { lengthReason } from "@/lib/gomoku/rules/drawLimit";
import { GAME_COPY } from "./game.constants";

/** Why a length is not on offer, in the player's words. */
const LENGTH_REFUSALS: Record<string, string | null> = {
  "cannot-draw": GAME_COPY.noDrawLimitCannotDraw,
  "too-small": GAME_COPY.noDrawLimitTooSmall,
  none: null,
};

/**
 * Which settings the current game has taken out of the players' hands, and
 * why, in a sentence. A locked control stays on screen, greyed, showing the
 * value the rules impose — that is how a player reads the rules at a glance.
 * Null means the players may change it.
 */
export type SettingsLocks = {
  size: string | null;
  winLength: string | null;
  opening: string | null;
  obstacles: string | null;
  allowSkip: string | null;
  reading: string | null;
  /**
   * Why this game cannot say who is ahead, which is a narrower question than
   * `reading`. Plenty of games the threat reading cannot touch can still be
   * counted — discs, pieces home, pieces left — and those must not be locked
   * out by a rule written for line reading.
   */
  advantage: string | null;
  drawLimit: string | null;
};

export function settingsLocks(settings: GameSettings): SettingsLocks {
  const spec = VARIANT_SPECS[settings.variant];
  const fixed = GAME_COPY.fixedBy(RULE_VARIANT_DISPLAY[settings.variant].label);
  const ownBoard = spec.boardSizes !== null;
  const stonesMove = spec.quadrantSize !== null || spec.pieces !== null;

  return {
    size: boardSizesFor(settings.variant).length <= 1 ? fixed : null,
    winLength: spec.winLength !== null ? fixed : null,
    opening: spec.openings.length <= 1 ? fixed : null,
    obstacles: ownBoard ? fixed : null,
    allowSkip:
      stonesMove || spec.placement === PLACEMENTS.drop ? fixed : null,
    reading: spec.analysis ? null : GAME_COPY.noReading,
    /*
     * Its own reason, not `reading`'s. The old control borrowed that one and
     * so told Hex, Notakto and maker-breaker players that stones move after
     * they are placed, which in those three games they do not. Each game now
     * gives the reason that is true of it.
     */
    advantage: (() => {
      const kind = advantageReadingFor(spec);
      return kind.kind === "unreadable" ? UNREADABLE_DISPLAY[kind.reason].sentence : null;
    })(),
    /*
     * Two reasons a game may not be given a length, and the player is told
     * which. Hex cannot be drawn at all — a full board always holds exactly
     * one chain from side to side. A small board is over before any share of
     * it has been played. The engine refuses both either way; this is so the
     * control says why rather than sitting there doing nothing.
     */
    drawLimit: LENGTH_REFUSALS[lengthReason(settings) ?? "none"],
  };
}
