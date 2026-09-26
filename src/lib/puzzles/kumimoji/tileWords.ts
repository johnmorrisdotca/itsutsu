/**
 * KUMIMOJI'S WORD LIST, loaded once, when a game opens.
 *
 * The list is about six hundred kilobytes before compression (a hundred and
 * ten thousand words, `words.en.data.ts`), so it is its own module, fetched by
 * a dynamic import only when a Kumimoji is made or checked: no other page, and
 * not the set-up screen, carries a byte of it. The kana Gomoji loads its lists
 * the same way (`kanaWords.ts`).
 *
 * `loadTileWords` fetches and reads it once; `tileWords` hands back the list
 * already loaded, and refuses rather than answering for a list it does not
 * have — a check that could not read the list must not say a word is fine.
 */
export type TileWords = {
  /** Every word, for asking "is this a word?". */
  allowed: ReadonlySet<string>;
  /** The words of each length, in order, for the generator to choose among. */
  byLength: ReadonlyMap<number, readonly string[]>;
};

let loaded: TileWords | null = null;

/** Front-coded words of one length read back (see `scripts/tile-words.mjs`): a shared-prefix character, then the rest. */
export function unpackLength(packed: string, length: number): string[] {
  const words: string[] = [];
  const text = packed.replace(/\s+/g, "");
  let before = "";
  let at = 0;
  while (at < text.length) {
    const shared = parseInt(text[at]!, 16);
    const rest = length - shared;
    const word = before.slice(0, shared) + text.slice(at + 1, at + 1 + rest);
    words.push(word);
    before = word;
    at += 1 + rest;
  }
  return words;
}

export function unpackTileWords(data: Readonly<Record<number, string>>): TileWords {
  const byLength = new Map<number, string[]>();
  const allowed = new Set<string>();
  for (const [length, packed] of Object.entries(data)) {
    const words = unpackLength(packed, Number(length));
    byLength.set(Number(length), words);
    for (const word of words) allowed.add(word);
  }
  return { allowed, byLength };
}

export async function loadTileWords(): Promise<TileWords> {
  if (loaded !== null) return loaded;
  const { TILE_WORDS_EN } = await import("./words.en.data");
  loaded = unpackTileWords(TILE_WORDS_EN);
  return loaded;
}

export function tileWords(): TileWords {
  if (loaded === null) throw new Error("The Kumimoji words have not been loaded (loadTileWords).");
  return loaded;
}

/** Whether the list has been fetched yet, for a page to say "loading" rather than throw. */
export function tileWordsReady(): boolean {
  return loaded !== null;
}
