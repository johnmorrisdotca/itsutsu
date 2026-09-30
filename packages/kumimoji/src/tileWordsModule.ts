import { loadTileWords, readTileWordsWith, tileWordsFrom, type TileWords } from "./tileWords.ts";
import type { KumimojiLanguage } from "./kumimoji.types.ts";

/**
 * KUMIMOJI'S LISTS WHERE THERE IS NO BROWSER: a server checking a handed-in
 * solve or a race (`preparePuzzleOnServer`), a unit test, a browser spec's own
 * process. Importing this module is what lets `loadTileWords` answer there; a
 * page's components never import it, so no page's server function carries the
 * lists for the browser's sake (see `loadTileWords`).
 */
readTileWordsWith(async (language) =>
  tileWordsFrom(language, language === "english" ? (await import("./words.en.data.ts")).TILE_WORDS_EN : (await import("./words.ja.data.ts")).TILE_WORDS_JA),
);

/** The list, read from its module: `loadTileWords` for a caller with no browser. */
export function loadTileWordsFromModule(language: KumimojiLanguage = "english"): Promise<TileWords> {
  return loadTileWords(language);
}
