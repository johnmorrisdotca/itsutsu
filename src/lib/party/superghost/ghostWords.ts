// Relative, like the rest of lib/party: the browser specs import this module's neighbours, and Playwright resolves no alias.
import { loadTileWords, tileWords, tileWordsReady } from "../../puzzles/kumimoji/tileWords";
import type { PartyLanguage } from "../party.types";

import type { GhostJudge } from "./superghost.types";

/**
 * SUPERGHOST'S WORDS ARE KUMIMOJI'S, and nothing is fetched twice.
 *
 * English is Kumimoji's list from SCOWL (sizes 10–70, English and American
 * spellings): 110,316 words of two to fifteen letters, about 600 KB before
 * compression, in `words.en.data.ts`. Japanese is Kumimoji's list from
 * JMdict: 163,461 hiragana readings of two to fifteen kana, about 700 KB, in
 * `words.ja.data.ts`, spelt in the 45 base kana its tiles are (が as か, ゃ as
 * や, を as お). Each is a module of its own, fetched by a dynamic import the
 * first time a game in that language is played (`loadTileWords`), and shared
 * with Kumimoji after: no other page, and not the set-up, carries a byte of
 * either, and no server is asked anything.
 *
 * Gomoji's lists are smaller, but they are five letters only (and the kana
 * Gomoji's three to five): a game where a word of four or more loses needs
 * every length, or a real word would be refused as none, which is the one
 * mistake a word game must not make.
 */

/** The words of `shortest` letters or more, one to a line, for `wordWith` to search in one pass; made once per list. */
const joined = new Map<string, string>();

/** What `wordWith` has already found, per list: the same short fragments come up round after round. */
const found = new Map<string, Map<string, string | null>>();

function wordsOfAtLeast(language: PartyLanguage, shortest: number): string {
  const key = `${language}:${shortest}`;
  const already = joined.get(key);
  if (already !== undefined) return already;
  const words = [...tileWords(language).byLength.entries()].filter(([length]) => length >= shortest).flatMap(([, list]) => list);
  const glyphs = language === "english" ? words : words.map((word) => [...word].map((tile) => tileWords(language).glyphOf(tile)).join(""));
  const text = `\n${glyphs.join("\n")}\n`;
  joined.set(key, text);
  return text;
}

/** A word of the list, `shortest` letters or more, with `fragment` in it: the first found, or null. */
function wordWithIn(language: PartyLanguage, fragment: string, shortest: number): string | null {
  const key = `${language}:${shortest}`;
  let cache = found.get(key);
  if (cache === undefined) {
    cache = new Map();
    found.set(key, cache);
  }
  const known = cache.get(fragment);
  if (known !== undefined) return known;
  // No word in the list is longer than fifteen letters, so a longer fragment is in none.
  let word: string | null = null;
  if (fragment !== "" && [...fragment].length <= 15 && !fragment.includes("\n")) {
    const text = wordsOfAtLeast(language, shortest);
    const at = text.indexOf(fragment);
    if (at !== -1) word = text.slice(text.lastIndexOf("\n", at) + 1, text.indexOf("\n", at));
  }
  cache.set(fragment, word);
  return word;
}

/**
 * The judge a game in this language is played with. Throws when its list has
 * not been fetched (`loadGhostWords`): a check that could not read the list
 * must never say a word is fine, or that none exists.
 */
export function ghostJudge(language: PartyLanguage): GhostJudge {
  const words = tileWords(language);
  return {
    isWord: (letters) => words.allowed.has(letters),
    wordWith: (fragment, shortest) => wordWithIn(language, fragment, shortest),
  };
}

/** Fetch a language's list, once; every game in it after is judged at once. */
export async function loadGhostWords(language: PartyLanguage): Promise<void> {
  await loadTileWords(language);
}

/** Whether a language's list is here yet, for a table to say "fetching the words" rather than throw. */
export function ghostWordsReady(language: PartyLanguage): boolean {
  return tileWordsReady(language);
}
