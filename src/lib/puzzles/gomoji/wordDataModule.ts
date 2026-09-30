import { loadWordData, readWordDataWith, type WordListLanguage } from "./wordData";

/**
 * GOMOJI'S LISTS WHERE THERE IS NO BROWSER: a server checking a handed-in
 * solve or a race (`preparePuzzleOnServer`), a unit test, a browser spec's own
 * process. Importing this module is what lets `loadWordData` answer there; no
 * page imports it, so no page's server function carries the lists for the
 * browser's sake (see `wordData.ts`).
 */
readWordDataWith(async (lang) =>
  lang === "fr" ? (await import("./words.fr.data")).FR_WORDS : lang === "de" ? (await import("./words.de.data")).DE_WORDS : (await import("./words.en.data")).EN_WORDS,
);

/** A language's lists, read from their module: `loadWordData` for a caller with no browser. */
export function loadWordDataFromModule(lang: WordListLanguage): Promise<void> {
  return loadWordData(lang);
}
