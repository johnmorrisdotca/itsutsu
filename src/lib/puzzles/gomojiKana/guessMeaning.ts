import { KANA_MEANING_BLOCKED, meaningLine } from "./meaningLine";

/**
 * WHAT A KANA GUESS MEANS, fetched when somebody asks and not before.
 *
 * Jisho's words are in 363 small pieces (about 25 kB each), and a lookup fetches the one or two its reading is in.
 * This runs in the BROWSER ONLY: the import is inside `typeof window !== "undefined"`, which the build removes from the
 * server's copy (AGENTS.md, Function Size), so no page function carries the dictionary, and it is asked for from a tap,
 * a hover or a focus, so no page load pays for it. What was looked up is kept, so a word asked for twice is fetched once.
 */

const known = new Map<string, string | null>();

/** The line for a kana word, or `null` when there is nothing quiet to say (nothing in the dictionary, or only what is not for a child). */
export async function guessMeaning(word: string): Promise<string | null> {
  if (known.has(word)) return known.get(word) ?? null;
  let line: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const { loadWords, wordsOf, withoutWords } = await import("@johnmorrisdotca/jisho/words");
      line = meaningLine(word, withoutWords(wordsOf(await loadWords(word), word), KANA_MEANING_BLOCKED));
    } catch {
      // A piece that would not come is no meaning, and a quiet line is never an error: it is not remembered, so a later tap tries again.
      return null;
    }
  }
  known.set(word, line);
  return line;
}
