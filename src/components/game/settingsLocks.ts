import {
  PLACEMENTS,
  VARIANT_SPECS,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { GAME_COPY } from "./game.constants";

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
  };
}
