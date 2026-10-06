import type { Locale } from "../i18n/i18n.types";
import { jaText } from "../i18n/jaText";
import { PUZZLE_DISPLAY } from "../puzzles/puzzles.constants";
import type { PuzzleKind } from "../puzzles/puzzles.types";

import { RULES_ATTRIBUTION } from "./openings.constants";

/** Where a puzzle is named in a paragraph: `{puzzle.numberPlace}`, filled with the puzzle's kanji. */
export const PUZZLE_NAME_MARK = /\{puzzle\.(\w+)\}/g;

/**
 * Whose names the games and puzzles are, in the reader's language: the three
 * paragraphs under the catalogue. The Japanese names each puzzle by its own
 * `kanji`, read from the puzzle's table.
 */
export function rulesAttribution(locale: Locale): readonly string[] {
  if (locale !== "ja") return RULES_ATTRIBUTION;
  return jaText().attribution.map((paragraph) => paragraph.replace(PUZZLE_NAME_MARK, (_, kind: PuzzleKind) => PUZZLE_DISPLAY[kind].kanji));
}
