import type { Locale } from "../i18n/i18n.types";
import { jaText } from "../i18n/jaText";

import type { HandicapRule, OpeningRule } from "./gomoku.types";
import { HANDICAP_RULE_DISPLAY, OPENING_DISPLAY, type OpeningCopy } from "./openings.constants";
import { SECOND_STONE_EXCLUSION_DISPLAY } from "./variants.constants";

const IN_JAPANESE = new Map<OpeningRule, OpeningCopy>();

/**
 * An opening's copy in the reader's language. Japanese puts its own `label`,
 * `tagline` and rules over the English row and keeps the `kanji`, which is the
 * opening's name in its own script.
 */
export function openingCopy(opening: OpeningRule, locale: Locale): OpeningCopy {
  const english = OPENING_DISPLAY[opening];
  if (locale !== "ja") return english;
  const made = IN_JAPANESE.get(opening);
  if (made !== undefined) return made;
  const ja = jaText().openings[opening];
  const copy: OpeningCopy = { ...english, label: ja.label, tagline: ja.tagline, rules: ja.rules };
  IN_JAPANESE.set(opening, copy);
  return copy;
}

/**
 * A handicap switch's copy in the reader's language. Japanese puts its own
 * sentence and source over the English row and shows the `kanji` as the name:
 * its `label` is the kanji too, since that is what a Japanese reader calls it.
 */
export function handicapCopy(rule: HandicapRule, locale: Locale) {
  const english = HANDICAP_RULE_DISPLAY[rule];
  if (locale !== "ja") return english;
  const ja = jaText().handicaps[rule];
  return { ...english, label: english.kanji, description: ja.description, from: ja.from };
}

/** The label of a second-stone restriction, in the reader's language. */
export function secondStoneLabel(squares: number, locale: Locale): string {
  const english = SECOND_STONE_EXCLUSION_DISPLAY[squares]?.label ?? "";
  if (locale !== "ja") return english;
  return jaText().secondStone[squares] ?? english;
}
