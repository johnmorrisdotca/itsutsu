import { boardWords } from "@/lib/gomoku/boardWords";
import { variantName } from "@/lib/gomoku/variantCopy";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";

import type { BoardStory } from "./board.types";

/**
 * The header over a game that was played HERE, opened on its own
 * (`BoardMasthead`): its players, the game, and "Played on Itsutsu" with the
 * day it began. A game from anywhere else writes its own source instead.
 */
export function playedHereStory(
  game: { blackName: string; whiteName: string; variant: string; size: number; playedAt: Date | string },
  kind: { label: string; kanji: string },
  say: Speaker = speaker("en"),
): BoardStory {
  const day = new Date(game.playedAt).toISOString().slice(0, 10);
  return {
    kind: kind.label,
    kanji: kind.kanji,
    title: say.say("boardlook.storyTitle", {
      black: game.blackName,
      white: game.whiteName,
      game: variantName(game.variant, say),
      board: boardWords(game.variant, game.size, say),
    }),
    source: say.say("boardlook.playedOn", { day, site: SITE_NAME }),
  };
}
