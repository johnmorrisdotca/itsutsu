import { jaText } from "../i18n/copyJa.types";
import type { Locale } from "../i18n/i18n.types";

import type { HandicapRule, OpeningRule } from "./gomoku.types";
import { HANDICAP_RULE_DISPLAY, OPENING_DISPLAY, type OpeningCopy } from "./openings.constants";
import { SECOND_STONE_EXCLUSION_DISPLAY } from "./variants.constants";
import { HANDICAP_COPY_JA, OPENING_COPY_JA, SECOND_STONE_COPY_JA } from "../i18n/dictionaries/openings.ja.constants";

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
  const ja = OPENING_COPY_JA[opening];
  const copy: OpeningCopy = {
    ...english,
    label: ja.label,
    tagline: jaText(ja.tagline),
    rules: ja.rules.map(jaText),
  };
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
  const ja = HANDICAP_COPY_JA[rule];
  return { ...english, label: english.kanji, description: jaText(ja.description), from: jaText(ja.from) };
}

/** The label of a second-stone restriction, in the reader's language. */
export function secondStoneLabel(squares: number, locale: Locale): string {
  const english = SECOND_STONE_EXCLUSION_DISPLAY[squares]?.label ?? "";
  const ja = SECOND_STONE_COPY_JA[squares];
  return locale === "ja" && ja !== undefined ? jaText(ja.label) : english;
}
