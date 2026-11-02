import { speaker } from "../i18n/i18n";
import type { PhraseKey } from "../i18n/i18n.constants";
import type { Locale } from "../i18n/i18n.types";

/**
 * WHAT A GAME IS "INSPIRED BY", IN THE READER'S LANGUAGE. Most are names (Connect Four, Pentago, Order and Chaos),
 * which stay as they are written; a few are descriptions ("the seven tetromino shapes"), and a description is said in
 * Japanese to a reader of Japanese. Keyed by the English line, so a puzzle whose Japanese table already gives its own
 * line (a different string) is left as that table has it.
 */
const DESCRIBED: Readonly<Record<string, PhraseKey>> = {
  "the seven tetromino shapes": "rules.inspired.tetromino",
  "Star Battle (one star)": "rules.inspired.starBattle",
  "the anagram-grid race games": "rules.inspired.anagramGrid",
  "the swap-the-letters word grid": "rules.inspired.swapGrid",
};

export function inspiredByIn(line: string | undefined, locale: Locale): string | undefined {
  if (line === undefined || locale === "en") return line;
  const key = DESCRIBED[line];
  return key === undefined ? line : speaker(locale).say(key);
}
