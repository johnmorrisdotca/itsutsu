import { RECORDED_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { copyLocale } from "@/lib/i18n/copyLocale";
import { fill } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n.types";
import { inWords } from "@/lib/text/inWords";

import { XP_EVENT_SPECS } from "./xp.constants";
import { XP_AWARD_COPY } from "./xpAwardCopy.constants";
import type { XpEventSpec, XpEventType } from "./xp.types";

/**
 * What a toast and a history row say about one award, in the reader's language.
 *
 * The words are `XP_AWARD_COPY`'s and the kanji is the economy table's, joined
 * here so that nothing else has to know the words live in two languages. For a
 * reader of Japanese the label IS the kanji: the heading is the kanji alone, as
 * every heading on the site is for them, and `Paired` does the same on its own
 * when it is handed both.
 *
 * `locale` defaults to English for the callers whose pages have not been
 * converted yet; a page that knows its reader passes the reader's.
 */
export function xpEventCopy(type: XpEventType, locale: Locale = "en"): Pick<XpEventSpec, "kanji"> & { label: string; sentence: string; blurb: string } {
  const spec = XP_EVENT_SPECS[type];
  const language = copyLocale(locale);
  /*
   * How many games and families there are, said the way the language says a
   * number (`inWords`: words for English, numerals for Japanese). The awards
   * said "forty-four" after the forty-fifth game arrived, and "all eleven
   * families" for months after eleven became eight; a count written into a
   * sentence is wrong the day a game or a family is added, so these sentences
   * count instead. Families are the ones a game can be played FROM: Party
   * games, whose own games are never recorded, is never one a first game is
   * paid in.
   */
  const counts = { games: inWords(RULE_VARIANT_LIST.length, language), families: inWords(RECORDED_FAMILIES.length, language) };
  if (language === "ja") {
    const words = XP_AWARD_COPY.ja[type];
    return { label: spec.kanji, kanji: spec.kanji, blurb: fill(words.blurb, counts), sentence: fill(words.sentence, counts) };
  }
  const words = XP_AWARD_COPY.en[type];
  return { label: words.label, kanji: spec.kanji, blurb: fill(words.blurb, counts), sentence: fill(words.sentence, counts) };
}
