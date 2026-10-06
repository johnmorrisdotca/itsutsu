import { jaText } from "../i18n/copyJa.types";
import { rulesAttributionJa } from "../i18n/dictionaries/attribution.ja.constants";
import type { Locale } from "../i18n/i18n.types";
import { PUZZLE_DISPLAY } from "../puzzles/puzzles.constants";

import { RULES_ATTRIBUTION } from "./openings.constants";

/**
 * Whose names the games and puzzles are, in the reader's language: the three
 * paragraphs under the catalogue. The Japanese names each puzzle by its own
 * `kanji`, read from the puzzle's table.
 */
export function rulesAttribution(locale: Locale): readonly string[] {
  if (locale !== "ja") return RULES_ATTRIBUTION;
  return rulesAttributionJa((kind) => ({ ja: PUZZLE_DISPLAY[kind].kanji, en: PUZZLE_DISPLAY[kind].label })).paragraphs.map(jaText);
}
