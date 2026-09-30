import { type KanaWords, loadKanaWords, readKanaWordsWith } from "./kanaWords";

/**
 * THE KANA LISTS WHERE THERE IS NO BROWSER: the server's own checks, the pages
 * that replay a kana dodger's word (`PuzzleSolvePage`, `PuzzleMePage`), a unit
 * test, a browser spec's own process. Importing this module is what lets
 * `loadKanaWords` answer there (see `kanaWords.ts`).
 */
readKanaWordsWith(async (size) => {
  // Named one by one, so the bundler splits each length into its own chunk.
  if (size === 3) return (await import("./words.ja.3.data")).JA_WORDS_3;
  if (size === 4) return (await import("./words.ja.4.data")).JA_WORDS_4;
  if (size === 5) return (await import("./words.ja.5.data")).JA_WORDS_5;
  throw new Error(`No ${size}-kana words.`);
});

/** A length's words, read from their module: `loadKanaWords` for a caller with no browser. */
export function loadKanaWordsFromModule(size: number): Promise<KanaWords> {
  return loadKanaWords(size);
}
