/**
 * THE KANA WORD LISTS, loaded one length at a time. Each length is its own
 * module (`words.ja.<n>.data.ts`, from `scripts/word-lists-ja.mjs`), fetched
 * only when a puzzle of that length opens, so no other page carries a
 * kilobyte of it: all three together are about four hundred kilobytes.
 *
 * `loadKanaWords` fetches and reads a length once; `kanaWordsOf` hands back one
 * already loaded, and refuses rather than answering for a list it does not
 * have (the generator and the checks call it only after the load).
 */
export const KANA_SIZES = [3, 4, 5] as const;

type Packed = { release: string; alphabet: string; codes: string; easy: string; answers: string; allowed: string };

export type KanaWords = {
  /** The JMdict release the list was made from, for the credit on the page. */
  release: string;
  easy: readonly string[];
  answers: readonly string[];
  allowed: ReadonlySet<string>;
};

const loaded = new Map<number, KanaWords>();

/** A packed list read into words: one character a kana, run together, `size` to a word. Exported for `scripts/daily-pools.ts`, which snapshots the answers. */
export function unpack(packed: Packed, size: number): KanaWords {
  const kanaOf = new Map([...packed.codes].map((code, at) => [code, packed.alphabet[at]!]));
  const words = (run: string) => {
    const chars = [...run];
    return Array.from({ length: chars.length / size }, (_, at) => chars.slice(at * size, at * size + size).map((code) => kanaOf.get(code) ?? "").join(""));
  };
  return { release: packed.release, easy: words(packed.easy), answers: words(packed.answers), allowed: new Set(words(packed.allowed)) };
}

async function importPacked(size: number): Promise<Packed> {
  // Named one by one, so the bundler splits each length into its own chunk.
  if (size === 3) return (await import("./words.ja.3.data")).JA_WORDS_3;
  if (size === 4) return (await import("./words.ja.4.data")).JA_WORDS_4;
  if (size === 5) return (await import("./words.ja.5.data")).JA_WORDS_5;
  throw new Error(`No ${size}-kana words.`);
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
