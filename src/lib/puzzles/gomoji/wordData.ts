/**
 * GOMOJI'S WORD LISTS, LOADED WHEN A PUZZLE NEEDS THEM. English, French and
 * German, each a few hundred kilobytes, used to be imported by `code.ts`, and
 * so were compiled into every server bundle that reached it: five copies of
 * each in the functions Vercel runs, the biggest function 36.6 MB of a 40 MB
 * ceiling (2026-09-26). Read through a dynamic import instead, as the kana
 * lists, Pop's guesses and Kumimoji's tiles already are, each list is one
 * chunk of its own, loaded by `preparePuzzle` before a puzzle that uses it is
 * made or checked.
 *
 * A list asked for before it is loaded is an error, never "not a word": a
 * check that could not read its list must not refuse every guess as though it
 * had read it (AGENTS.md, "Nothing Answers What It Cannot Answer").
 */
export type WordListLanguage = "en" | "fr" | "de";

type WordData = Record<number, { easy: string; answers: string; allowed: string }>;

const LOADED = new Map<WordListLanguage, WordData>();

/** Loads a language's lists, once: English for Gomoji, Pop's dictionary guesses, Koushi and Kumimoji; French for Mot; German for Wort. */
export async function loadWordData(lang: WordListLanguage): Promise<void> {
  if (LOADED.has(lang)) return;
  const data =
    lang === "fr" ? (await import("./words.fr.data")).FR_WORDS : lang === "de" ? (await import("./words.de.data")).DE_WORDS : (await import("./words.en.data")).EN_WORDS;
  LOADED.set(lang, data);
}

/** A loaded language's lists; throws where `loadWordData` has not been awaited. */
export function wordDataOf(lang: WordListLanguage): WordData {
  const data = LOADED.get(lang);
  if (data === undefined) throw new Error(`Gomoji's ${lang} word lists have not been loaded (loadWordData, or preparePuzzle for the puzzle).`);
  return data;
}
