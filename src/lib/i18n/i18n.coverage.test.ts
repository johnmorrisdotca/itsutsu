import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DICTIONARIES, OFFERED_LOCALES, languageOptions, speaks } from "./dictionaries";
import { placeholdersIn, speaker } from "./i18n";
import { DEFAULT_LOCALE, LOCALES, LOCALE_LIST, PHRASES, PHRASE_KEYS } from "./i18n.constants";

/**
 * The language gate.
 *
 * A language is cheap to declare and expensive to finish, in exactly the way
 * a rule variant is: the machinery will happily speak a language it only
 * half knows, and what gets skipped is everything that makes the result
 * readable. So the same rule applies — a half-spoken language fails the build
 * rather than shipping quietly.
 *
 * TypeScript already forces a dictionary to answer every phrase, because a
 * `Dictionary` is `Record<PhraseKey, string>`. This covers what the type
 * system cannot see: that no answer is blank, that no sentence lost the name
 * it was going to put in the gap, and that a language is offered to readers
 * only when there is something to offer them.
 *
 * WHAT IT CANNOT CHECK, said plainly because it would otherwise be taken to:
 * whether the Japanese is good Japanese. The half of it in
 * `ja.drafted.constants.ts` was written by a machine and has not been read by
 * a Japanese speaker. The gate proves the shape, never the wording — see
 * `japanese.coverage.test.ts`, which is about exactly that distinction.
 */

describe("every language the site names", () => {
  it.each(LOCALE_LIST)("%s says what it calls itself", (locale) => {
    const spec = LOCALES[locale];
    expect(spec.endonym.trim()).not.toBe("");
    expect(spec.english.trim()).not.toBe("");
    expect(spec.tag.trim()).not.toBe("");
  });

  it.each(LOCALE_LIST)("%s says which script it is written in", (locale) => {
    expect(["latin", "han"]).toContain(LOCALES[locale].script);
  });

  /*
   * Only Japanese. The kanji beside a heading is Japanese orthography, so it
   * is the Japanese word for the thing and nobody else's — a Chinese reader
   * being handed 五目並べ as their own is the mistake this flag exists to
   * make impossible to write by accident.
   */
  it("says the kanji is its own language's word for Japanese and no other", () => {
    const own = LOCALE_LIST.filter((locale) => LOCALES[locale].kanjiReadsAsOwn);
    expect(own).toEqual(["ja"]);
  });
});

describe("a language is offered only when it can be spoken", () => {
  it("offers exactly the languages that have a dictionary", () => {
    expect([...OFFERED_LOCALES]).toEqual(LOCALE_LIST.filter((locale) => speaks(locale)));
  });

  it("always offers the language the site is written in", () => {
    expect(OFFERED_LOCALES).toContain(DEFAULT_LOCALE);
  });

  /*
   * A picker entry that does nothing is worse than no picker entry: it is a
   * promise the site cannot keep, and it looks identical to one it can.
   */
  it("keeps a language it only knows the name of out of the picker", () => {
    const named = LOCALE_LIST.filter((locale) => !speaks(locale));
    for (const locale of named) expect(OFFERED_LOCALES).not.toContain(locale);
  });

  it("gives the picker everything it needs to draw a language", () => {
    const options = languageOptions();
    expect(options.map((one) => one.locale)).toEqual([...OFFERED_LOCALES]);
    for (const option of options) {
      expect(option.endonym.trim()).not.toBe("");
      expect(option.english.trim()).not.toBe("");
      expect(option.tag.trim()).not.toBe("");
    }
  });
});

describe.each(OFFERED_LOCALES)("%s, as a language the site offers", (locale) => {
  const dictionary = DICTIONARIES[locale];

  it("answers every phrase", () => {
    expect(dictionary).toBeDefined();
    for (const key of PHRASE_KEYS) {
      expect(dictionary?.[key], `${locale} has nothing for ${key}`).toBeTypeOf("string");
    }
  });

  it("answers none of them with a blank", () => {
    for (const key of PHRASE_KEYS) {
      expect(dictionary?.[key]?.trim(), `${locale} answers ${key} with a blank`).not.toBe("");
    }
  });

  /*
   * A dropped placeholder is a sentence with a hole where a game's name
   * should be, and nothing else would report it: the page renders, the
   * sentence reads, and the name is simply gone. An added one is worse — it
   * renders `{game}` at a reader.
   */
  it("keeps every name the English sentence was going to fill in", () => {
    for (const key of PHRASE_KEYS) {
      const wanted = [...placeholdersIn(PHRASES[key])].sort();
      const got = [...placeholdersIn(dictionary?.[key] ?? "")].sort();
      expect(got, `${locale} changed the placeholders in ${key}`).toEqual(wanted);
    }
  });

  it("can be spoken without throwing", () => {
    const say = speaker(locale);
    for (const key of PHRASE_KEYS) expect(say.say(key)).toBeTypeOf("string");
  });
});

describe("the English catalogue", () => {
  /*
   * A phrase the site never says.
   *
   * It costs more than the dead line suggests. Every phrase in this catalogue
   * needs Japanese, and every piece of Japanese a machine wrote lands on the
   * review sheet as a row somebody is asked to read — so an unused phrase
   * spends a Japanese reader's attention on words that appear on no page. It
   * happened the moment the front-door work landed: the footer's Champions
   * link and the rules page's "Who is best at it" both went, the ladder having
   * moved onto the game's own page, and both phrases sat here afterwards
   * looking exactly like phrases that were still in use.
   *
   * Read as a string literal, because that is how every call site names one.
   */
  it("says nothing the site never says", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          if (!path.includes(join("lib", "i18n"))) walk(path);
        } else if (/\.tsx?$/.test(entry)) {
          files.push(path);
        }
      }
    };
    walk("src");
    const source = files.map((path) => readFileSync(path, "utf8")).join("\n");
    const unused = PHRASE_KEYS.filter((key) => !source.includes(`"${key}"`));
    expect(unused, "these phrases are in the catalogue and on no page").toEqual([]);
  });

  it("names every phrase in kebab-free dotted sections", () => {
    for (const key of PHRASE_KEYS) expect(key).toMatch(/^[a-z]+(?:\.[a-zA-Z]+)+$/);
  });

  it("has nothing blank in it", () => {
    for (const key of PHRASE_KEYS) expect(PHRASES[key].trim()).not.toBe("");
  });

  /*
   * The site's own name is not a phrase, and must never become one. "Itsutsu
   * 五つ" is what this place is called; a reader in another language is not
   * looking at a different site. Leaving it out of the catalogue makes it
   * untranslatable — there is no key to answer.
   */
  it("holds no phrase that is the site's own name", () => {
    for (const key of PHRASE_KEYS) {
      expect(PHRASES[key]).not.toContain("Itsutsu");
      expect(PHRASES[key]).not.toContain("五つ");
    }
  });
});
