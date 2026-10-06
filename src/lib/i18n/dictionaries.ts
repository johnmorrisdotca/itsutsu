import { JA_DRAFTED } from "./dictionaries/ja.drafted.constants";
import { JA_ALREADY_SAID } from "./dictionaries/ja.site.constants";
import { LOCALES, LOCALE_LIST, PHRASES, PHRASE_KEYS, type PhraseKey } from "./i18n.constants";
import type { LanguageOption, Locale } from "./i18n.types";

/** Every phrase, answered. Partial dictionaries are refused by the type. */
export type Dictionary = Record<PhraseKey, string>;

/**
 * Japanese, assembled from its two halves.
 *
 * They are two files rather than one because they carry different risk, and
 * the difference is invisible once they are joined: `JA_ALREADY_SAID` is
 * John's own kanji, already published on the site, and `JA_DRAFTED` is text a
 * machine wrote that no Japanese reader has seen. Joining them here rather
 * than writing one file is what keeps that line drawn where anybody can find
 * it — and `japanese.coverage.test.ts` refuses a key claimed by both halves,
 * or missed by both.
 */
export const JA: Dictionary = Object.fromEntries(
  PHRASE_KEYS.map((key) => [
    key,
    JA_ALREADY_SAID[key]?.text ?? JA_DRAFTED[key]?.text ?? PHRASES[key],
  ]),
) as Dictionary;

/**
 * What the site can say, and in what.
 *
 * English and Japanese, and John's reason for that pair is the cheapest one
 * available: Japanese is the language this site was already half speaking.
 * Every game's name is in the `kanji` field beside its English one and has
 * been all along, so thirty-nine names arrived translated; and because
 * Japanese is written in the kanji's own script, none of them has to be
 * paired with a second copy of itself. No other language starts from there.
 *
 * English is a dictionary like any other rather than a special case, so
 * "which languages are offered" has one answer and not two. A locale declared
 * in `LOCALES` with nothing here is one the site knows the name of and cannot
 * speak — `es`, `zh` and `de` today — and it is correctly absent from every
 * picker until somebody writes its file. Adding a language is one line here
 * and one file beside it; there is nothing else to remember. Spanish was
 * added and taken out again by exactly that, which is how we know.
 */
export const DICTIONARIES: Partial<Record<Locale, Dictionary>> = {
  en: PHRASES,
  ja: JA,
};

/**
 * The languages a reader may actually choose, in the order `LOCALES` declares
 * them — so the picker's order is a decision written down once, rather than
 * whatever order the dictionaries happened to be registered in.
 */
export const OFFERED_LOCALES: readonly Locale[] = LOCALE_LIST.filter(
  (locale) => DICTIONARIES[locale] !== undefined,
);

export function speaks(locale: Locale): boolean {
  return DICTIONARIES[locale] !== undefined;
}

/** The offered languages, as much of each as a picker needs to draw it. */
export function languageOptions(): readonly LanguageOption[] {
  return OFFERED_LOCALES.map((locale) => {
    const spec = LOCALES[locale];
    return { locale, tag: spec.tag, endonym: spec.endonym, english: spec.english };
  });
}
