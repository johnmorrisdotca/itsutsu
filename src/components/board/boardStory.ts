import { boardWords } from "@/lib/gomoku/boardWords";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

import type { BoardStory } from "./board.types";

/**
 * The header over a game that was played HERE, opened on its own
 * (`BoardMasthead`): its players, the game, and "Played on Itsutsu" with the
 * day it began. A game from anywhere else writes its own source instead.
 */
export function playedHereStory(
  game: { blackName: string; whiteName: string; variant: string; size: number; playedAt: Date | string },
  kind: { label: string; kanji: string },
): BoardStory {
  const day = new Date(game.playedAt).toISOString().slice(0, 10);
  return {
    kind: kind.label,
    kanji: kind.kanji,
    title: `${game.blackName} vs ${game.whiteName} · ${RULE_VARIANT_DISPLAY[game.variant as RuleVariant]?.label ?? game.variant}, ${boardWords(game.variant, game.size)}`,
    source: `Played on Itsutsu · ${day}`,
  };
}
