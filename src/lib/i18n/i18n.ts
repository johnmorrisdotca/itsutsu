import { calendarDay, calendarMonth } from "@/lib/ui/when";

import type { DateStyle } from "./format.constants";
import { listIn, listPiecesIn, numberIn, pluralFormIn, wordsIn } from "./format";
import { LOCALES, PHRASES, type PhraseKey } from "./i18n.constants";
import type { Locale, Paired, Vars } from "./i18n.types";
import { dictionaryFor } from "./jaText";

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
 * The phrases that are a count with a noun: a base such as `count.move` whose
 * `.one` and `.other` forms are both in the catalogue. `Speaker.count` picks
 * the form the reader's language gives the number.
 */
type CountBase<K> = K extends `${infer Base}.one` ? (`${Base}.other` extends PhraseKey ? Base : never) : never;
export type CountKey = CountBase<PhraseKey>;

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
  /**
   * A count with its noun, the way this reader's language says it: "1 game"
   * and "3 games", "1局" and "3局". `key` is the base of a `.one`/`.other`
   * pair; `{count}` is filled with the number, thousands marked, and `vars`
   * fills the rest of the phrase.
   */
  count(key: CountKey, count: number, vars?: Vars): string;
  /**
   * The phrase a counted noun takes for this number in this reader's language:
   * `count.move.one` for 1 in English, `count.move.other` for everything else
   * and for every number in Japanese. For a phrase whose `{count}` is not a
   * string, a link or a picture, which `count` cannot fill.
   */
  form(key: CountKey, count: number): PhraseKey;
  /** A number with its thousands marked in this reader's marks: 12,345. */
  number(value: number): string;
  /** A small count in words where the language spells it ("sixty-four"), in digits where it does not. */
  words(count: number): string;
  /** A list joined as this reader's language joins one: "a, b and c", "a、b、c". */
  list(items: readonly string[]): string;
  /** The same joins around items the caller draws itself: pictures, links. */
  listPieces<T>(items: readonly T[]): (T | string)[];
  /** A calendar day, "2026-10-06", written for this reader: "6 Oct 2026", "2026年10月6日". Null for what is not a date. */
  day(day: string, style: DateStyle): string | null;
  /** A month key, "2026-10", as "October 2026" or "2026年10月". Null for what is not a month. */
  month(month: string): string | null;
};

export function speaker(locale: Locale): Speaker {
  const spec = LOCALES[locale];
  const dictionary = dictionaryFor(locale);

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
    form: (key, count) => `${key}.${pluralFormIn(locale, count)}` as PhraseKey,
    count(key, count, vars) {
      const phrase = `${key}.${pluralFormIn(locale, count)}` as PhraseKey;
      return fill(dictionary[phrase] ?? PHRASES[phrase], { ...vars, count: numberIn(locale, count) });
    },
    number: (value) => numberIn(locale, value),
    words: (count) => wordsIn(locale, count),
    list: (items) => listIn(locale, items),
    listPieces: (items) => listPiecesIn(locale, items),
    day: (day, style) => calendarDay(locale, day, style),
    month: (month) => calendarMonth(locale, month),
  };
}
