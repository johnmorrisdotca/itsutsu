import { DICTIONARIES } from "./dictionaries";
import { LOCALES, PHRASES, type PhraseKey } from "./i18n.constants";
import type { Locale, Paired, Vars } from "./i18n.types";

/**
 * Saying something in the reader's language, and the LOCALE + JP rule.
 *
 * Pure: hand it a locale and it answers. Nothing here reads a request, a
 * cookie or a database, which is what lets every rule below be tested by
 * value and what keeps a page's render from depending on anything more than
 * the locale it was given.
 */

/**
 * Fills `{placeholders}`. A name nobody supplied is left standing rather than
 * blanked: an empty gap in a sentence is a bug that reads as prose, and
 * `{game}` on the page is a bug that reads as a bug. The coverage test is
 * what stops either reaching a reader — it holds every translation's
 * placeholders to the English original's.
 */
export function fill(template: string, vars?: Vars): string {
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.hasOwn(vars, name) ? (vars[name] as string) : whole,
  );
}

/** The `{placeholders}` a phrase expects, in the order they appear. */
export function placeholdersIn(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string);
}

/**
 * The site talking to one reader.
 *
 * A small object rather than a bare `t(locale, key)` because every call site
 * in a page wants the same locale, and threading it through each call is how
 * one of them ends up with the wrong one.
 */
export type Speaker = {
  locale: Locale;
  /** BCP 47, for the document's `lang` attribute. */
  tag: string;
  /**
   * Whether a kanji shown beside a word is a second script to this reader, or
   * simply their own writing said twice.
   *
   * The LOCALE + JP rule as a plain question, for the places that have to ask
   * it about a heading rather than about a phrase — a panel title is a React
   * node and cannot be swapped for a string, so it asks this and draws the
   * kanji alone instead.
   */
  pairsWithKanji: boolean;
  /** A phrase, in this reader's language. */
  say(key: PhraseKey, vars?: Vars): string;
  /** A heading: the half that switches, and the kanji, where it still belongs. */
  pair(key: PhraseKey, kanji: string, vars?: Vars): Paired;
  /** A name the catalogue does not hold — a game's — with its own script. */
  pairName(english: string, kanji: string): Paired;
};

export function speaker(locale: Locale): Speaker {
  const spec = LOCALES[locale];
  const dictionary = DICTIONARIES[locale] ?? PHRASES;

  /**
   * LOCALE + JP, in one place.
   *
   * The kanji beside a heading is there to set two scripts against each
   * other; John's rule is that it is the English half that switches and the
   * kanji that stays. That rule has an edge its own statement does not
   * mention, and it is not an exception so much as the rule read out loud:
   * when the reader's language is already written in that script, there is
   * no pairing left to make. "Players 対局者" for a Japanese reader would be
   * "対局者 対局者".
   *
   * So the kanji is dropped for Japanese and Chinese alike, and for the same
   * reason — which is also the answer to the open question about Chinese,
   * arrived at by a rule rather than by taste.
   */
  const tail = (kanji: string): string | null =>
    spec.script === "han" || kanji === "" ? null : kanji;

  return {
    locale,
    tag: spec.tag,
    pairsWithKanji: spec.script !== "han",
    say: (key, vars) => fill(dictionary[key] ?? PHRASES[key], vars),
    pair(key, kanji, vars) {
      return { text: this.say(key, vars), kanji: tail(kanji) };
    },
    /**
     * A name has no catalogue entry, so there is nothing to look up — but
     * the site already carries its Japanese, in the `kanji` beside it. For a
     * Japanese reader that kanji *is* the translation, so it is promoted to
     * being the name and the tail goes. For everyone else the English name
     * stands, because a name is not something this site invents a Spanish
     * for, and a Chinese reader is not handed Japanese orthography and told
     * it is theirs.
     */
    pairName(english, kanji) {
      if (spec.kanjiReadsAsOwn && kanji !== "") return { text: kanji, kanji: null };
      return { text: english, kanji: tail(kanji) };
    },
  };
}
