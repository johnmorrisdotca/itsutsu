// A server build registers how to read the Japanese as this is evaluated; a browser's build has an empty module here
// (`turbopack.resolveAlias` in next.config.ts), and `JaLocale` registers instead.
import "@/lib/i18n/jaText.server";

import type { Dictionary } from "./dictionaries";
import { PHRASES } from "./i18n.constants";
import type { Locale } from "./i18n.types";
import { registeredJaText } from "./jaRegistry";
import type { JaText } from "./jaText.types";

/**
 * THE JAPANESE, FOR WHOEVER IS DRAWING IT.
 *
 * A reader of Japanese gets these words, and nobody else loads them. Asking when
 * nothing has registered them throws rather than answering in English: a page
 * that quietly fell back for a Japanese reader would look like a page nobody had
 * translated, which is the fault this whole table exists to end. The two ways in
 * are in `jaRegistry.ts`; a call that reaches here with the words missing is a
 * browser module drawn for Japanese outside `JaLocale`, and the message says so.
 *
 * Only call this for `locale === "ja"`: English and every locale with no words
 * never ask.
 */
export function jaText(): JaText {
  const text = registeredJaText();
  if (text === null) {
    throw new Error("Japanese was asked for before anything loaded it: a reader of Japanese is drawn inside JaLocale (src/components/i18n/JaLocale.tsx), and a server build loads it itself.");
  }
  return text;
}

let merged: { from: JaText; dictionary: Dictionary } | null = null;

/** Every phrase for a reader of Japanese: the Japanese where there is some, the English where there is not. */
function jaDictionary(): Dictionary {
  const from = jaText();
  if (merged?.from !== from) merged = { from, dictionary: { ...PHRASES, ...from.phrases } as Dictionary };
  return merged.dictionary;
}

/** The phrases the reader's language says, whole. English for every locale the site does not speak. */
export function dictionaryFor(locale: Locale): Dictionary {
  return locale === "ja" ? jaDictionary() : PHRASES;
}
