import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * A source site's own name for a game, mapped to the Itsutsu variant it
 * actually is — so a legacy record's "Flipversi" line can link straight to
 * our own Reversi rather than naming a game we never explain.
 *
 * Only real correspondences are listed. A source game with no Itsutsu
 * equivalent — Backgammon, Checkers, Chess, the card and dice games — is
 * left out on purpose rather than forced onto something it isn't; a game
 * missing here just renders as plain text.
 */
const GAME_ALIASES: Record<string, RuleVariant> = {
  // ItsYourTurn / GoldToken: five in a row, no restriction.
  "Go-Moku": RULE_VARIANTS.freestyle,
  "Go Moku": RULE_VARIANTS.freestyle,
  "Pro Go-Moku": RULE_VARIANTS.freestyle,
  "Large Go Moku": RULE_VARIANTS.freestyle,
  "Small Go Moku": RULE_VARIANTS.freestyle,

  // Pente and its capture-and-forbidden-shape cousin, Keryo Pente — the game
  // sannuki is itself inspired by (see RULE_VARIANT_DISPLAY.sannuki).
  Pente: RULE_VARIANTS.ninuki,
  "Pro Pente": RULE_VARIANTS.sannuki,
  "Keryo Pente": RULE_VARIANTS.sannuki,
  "Golden Pente": RULE_VARIANTS.ninuki,

  // The flipping game, under each site's own name for it.
  Reversi: RULE_VARIANTS.reversi,
  Flipversi: RULE_VARIANTS.reversi,
  "Flipversi 6x6": RULE_VARIANTS.miniReversi,
  "Flipversi 10x10": RULE_VARIANTS.grandReversi,
  "Anti-Flipversi": RULE_VARIANTS.antiReversi,
  "Anti-Flipversi 6x6": RULE_VARIANTS.antiReversi,

  // The race game, under the name every site gives it.
  Halma: RULE_VARIANTS.halma,

  "Connect 6": RULE_VARIANTS.connect6,
  "Connect Six": RULE_VARIANTS.connect6,

  // Four in a column — the game dropFour is itself inspired by Connect Four.
  "Four In a Row": RULE_VARIANTS.dropFour,
  Stack4: RULE_VARIANTS.dropFour,
  "Stack 4x4": RULE_VARIANTS.dropFour,

  // GoldToken's own Four In a Row family, matched by mechanic against ours.
  "Cylindrical Four (Only) In a Row": RULE_VARIANTS.ringDrop,
  "Giveaway Four in a Row": RULE_VARIANTS.giveawayDrop,
  "Blackhole Four in a Row": RULE_VARIANTS.holeDrop,
  "Hotspot Four in a Row": RULE_VARIANTS.hotDrop,
  "Wormhole Four in a Row": RULE_VARIANTS.wormDrop,
  "Zero G Four in a Row": RULE_VARIANTS.edgeDrop,
};

/** The Itsutsu variant a source site's own game name corresponds to, or null when there isn't one. */
export function aliasedVariant(gameName: string): RuleVariant | null {
  return GAME_ALIASES[gameName] ?? null;
}
