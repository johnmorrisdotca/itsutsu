/**
 * The shapes the site's languages are described with.
 *
 * Two ideas live here and are deliberately kept apart. A `Locale` is a
 * language the site has a name and a script for; a language it can actually
 * *speak* is one that also has a dictionary, which is a different question
 * and is answered by `OFFERED_LOCALES` in `i18n.constants.ts`. Offering a
 * language the site cannot yet say anything in would be a picker entry that
 * does nothing — a value in range that means "nothing".
 */

/** A language the site has a name and a script for. */
export type Locale = "en" | "es" | "ja" | "zh" | "de";

/**
 * The writing system a language is set in, as far as the LOCALE + JP pairing
 * is concerned — which is the only question this site asks of it.
 *
 * `han` is the one that matters: Japanese and Chinese are already written in
 * the script the kanji beside a heading is written in, so for a reader of
 * either there is no pairing left to make. Everything else is `latin` here,
 * which is a simplification the day a Cyrillic or Arabic locale arrives: the
 * value that has to be right is only ever "is this the kanji's own script".
 */
export type Script = "latin" | "han";

export type LocaleSpec = {
  /** BCP 47, for the `lang` attribute and for `Intl`. */
  tag: string;
  /** What the language calls itself, which is what a picker should show. */
  endonym: string;
  /** What an English reader calls it, for prose and for a title attribute. */
  english: string;
  script: Script;
  /**
   * Whether the kanji the site already carries reads, to this reader, as
   * their own language's word for the thing.
   *
   * True for Japanese and nothing else, and the distinction is not pedantry:
   * "五目並べ" beside "Gomoku" *is* the Japanese name, so a Japanese reader
   * needs no translation of it — but it is Japanese orthography, kana and
   * all, and handing it to a Chinese reader as their own word would be
   * guessing. This is the field that keeps "both are Han scripts" from
   * quietly becoming "both are the same language".
   */
  kanjiReadsAsOwn: boolean;
};

/**
 * A heading in the site's voice: the half that switches, and the half that
 * does not.
 *
 * `kanji` is null when the pairing does not apply — because the reader's own
 * language is written in that script already. Null rather than an empty
 * string, so a caller cannot render a gap and call it a pairing.
 */
export type Paired = {
  text: string;
  kanji: string | null;
};

/** Values substituted into a phrase's `{placeholders}`. */
export type Vars = Readonly<Record<string, string>>;

/**
 * One language as the picker needs it, and nothing more.
 *
 * A shape of its own rather than the `LocaleSpec` it is built from, because
 * the picker is a Client Component: handing it the locale table would mean
 * importing the module that registers every dictionary, and sending every
 * phrase of every language to every browser in order to render six words.
 * The server builds these and passes them down.
 */
export type LanguageOption = {
  locale: Locale;
  /** BCP 47, for `lang` and `hreflang` on the link. */
  tag: string;
  /** What the language calls itself. */
  endonym: string;
  /** What an English reader calls it, for the link's title. */
  english: string;
};
