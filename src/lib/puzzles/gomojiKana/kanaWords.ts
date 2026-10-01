import { unpack, type KanaWords, type Packed } from "@johnmorrisdotca/kotoba";

// The lists and reading them are Kotoba's; loading them, once, in the browser or on the server, is the site's.
export { KANA_SIZES, unpack, type KanaWords, type Packed } from "@johnmorrisdotca/kotoba";



const loaded = new Map<number, KanaWords>();


let fromModule: ((size: number) => Promise<Packed>) | null = null;

/** Used by `kanaWordsModule.ts` only: how to read a length where there is no browser. */
export function readKanaWordsWith(source: (size: number) => Promise<Packed>): void {
  fromModule = source;
}

async function importPacked(size: number): Promise<Packed> {
  if (typeof window !== "undefined") {
    // Named one by one, so the bundler splits each length into its own chunk.
    if (size === 3) return (await import("@johnmorrisdotca/kotoba/kana-3")).JA_WORDS_3;
    if (size === 4) return (await import("@johnmorrisdotca/kotoba/kana-4")).JA_WORDS_4;
    if (size === 5) return (await import("@johnmorrisdotca/kotoba/kana-5")).JA_WORDS_5;
    throw new Error(`No ${size}-kana words.`);
  }
  if (fromModule === null) throw new Error("The kana words are read on the server through kanaWordsModule.ts, which was not imported.");
  return fromModule(size);
}

export async function loadKanaWords(size: number): Promise<KanaWords> {
  const already = loaded.get(size);
  if (already !== undefined) return already;
  const words = unpack(await importPacked(size), size);
  loaded.set(size, words);
  return words;
}

export function kanaWordsOf(size: number): KanaWords {
  const words = loaded.get(size);
  if (words === undefined) throw new Error(`The ${size}-kana words have not been loaded (loadKanaWords).`);
  return words;
}
