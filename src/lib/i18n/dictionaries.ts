import { COPY_LOCALES } from "./copyLocale";
import { LOCALES, LOCALE_LIST, type PhraseKey } from "./i18n.constants";
import type { LanguageOption, Locale } from "./i18n.types";

/** Every phrase, answered. Partial dictionaries are refused by the type. */
export type Dictionary = Record<PhraseKey, string>;

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
 * This says WHICH languages, and nothing about their words: the words are
 * authored with their back-translations (`dictionaries.review.ts` joins them
 * for the tests and the review sheet), and a reader is given only the text
 * (`jaText.ts`). Keeping the two apart is what stops a page, the proxy or a
 * browser from importing the whole of the Japanese review data to answer "is
 * Japanese offered?". `i18n.coverage.test.ts` holds this list to the
 * dictionaries that exist.
 *
 * A locale declared in `LOCALES` that is not in `COPY_LOCALES` is one the site
 * knows the name of and cannot speak — `es`, `zh` and `de` today — and it is
 * correctly absent from every picker until somebody writes its file. Spanish
 * was added and taken out again by exactly that, which is how we know.
 */
export const OFFERED_LOCALES: readonly Locale[] = LOCALE_LIST.filter((locale) =>
  (COPY_LOCALES as readonly Locale[]).includes(locale),
);

export function speaks(locale: Locale): boolean {
  return OFFERED_LOCALES.includes(locale);
}

/** The offered languages, as much of each as a picker needs to draw it. */
export function languageOptions(): readonly LanguageOption[] {
  return OFFERED_LOCALES.map((locale) => {
    const spec = LOCALES[locale];
    return { locale, tag: spec.tag, endonym: spec.endonym, english: spec.english };
  });
}
