import { tileKana } from "./kana";
import { KANA_TILE_START, KANA_WILD_START, kanaTileCode, tileFace } from "./tileFace";
import { JAPANESE_TILE_MIX, TILE_MIX } from "./tiles.constants";
import type { KumimojiLanguage } from "./kumimoji.types";

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
  language: KumimojiLanguage;
  /** Every word, for asking "is this a word?". */
  allowed: ReadonlySet<string>;
  /** Encoded tile words of each length, for the generator to choose among. */
  byLength: ReadonlyMap<number, readonly string[]>;
  /** The physical set, keyed by its one-character tile codes. */
  mix: ReadonlyMap<string, number>;
  /** Visible glyph for a tile code. */
  glyphOf: (tile: string) => string;
  /** Reading represented by a tile code, or null for an unassigned wild. */
  soundOf: (tile: string) => string | null;
  /** Turn a run of tile codes into its word, or null for an invalid/unassigned tile. */
  wordOf: (tiles: string) => string | null;
  /** Physical wildcard, with `sound` assigned. */
  wildFor: (sound: string) => string | null;
  /** Whether this code is a wildcard, assigned or not. */
  isWild: (tile: string) => boolean;
  /** Display the sound assigned to a wildcard, or null if it has none. */
  wildSound: (tile: string) => string | null;
  /** Identity used to verify that the exact physical bag was played. */
  inventoryKey: (tile: string) => string | null;
  /** Which tile of the set this is, a wild being any wild. */
  familyKey: (tile: string) => string | null;
  /** The other forms a tile plays as, shown small in its corner: ば and ぱ on は. */
  formsOf: (tile: string) => string;
  /** Possible readings for a wild tile. */
  wildOptions: readonly string[];
  /** Internal tile code for a visible letter or mora. */
  codeOf: (face: string) => string | null;
};

const loaded = new Map<KumimojiLanguage, TileWords>();

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
  const letters = [...Object.keys(TILE_MIX)];
  const assigned = new Map(letters.map((letter) => [letter.toUpperCase(), letter]));
  const soundOf = (tile: string) => (tile === "*" ? null : assigned.get(tile) ?? (/^[a-z]$/.test(tile) ? tile : null));
  const isWild = (tile: string) => tile === "*" || assigned.has(tile);
  return {
    language: "english",
    allowed,
    byLength,
    mix: new Map(Object.entries(TILE_MIX)),
    glyphOf: (tile) => soundOf(tile) ?? (tile === "*" ? "五" : tile),
    soundOf,
    wordOf: (tiles) => {
      const sounds = [...tiles].map(soundOf);
      return sounds.some((sound) => sound === null) ? null : sounds.join("");
    },
    wildFor: (sound) => (/^[a-z]$/.test(sound) ? sound.toUpperCase() : null),
    isWild,
    wildSound: (tile) => (assigned.has(tile) ? assigned.get(tile)! : null),
    inventoryKey: (tile) => (isWild(tile) ? "*" : /^[a-z]$/.test(tile) ? tile : null),
    familyKey: (tile) => (isWild(tile) ? "*" : /^[a-z]$/.test(tile) ? tile : null),
    formsOf: () => "",
    wildOptions: letters,
    codeOf: (face) => (/^[a-z]$/.test(face) ? face : null),
  };
}

type JapaneseWordsData = {
  /** The 45 base kana, in the order of their tile codes (`BASE_KANA`). */
  kana: string;
  /** One printable character a kana, as the words are packed. */
  codes: string;
  byLength: Readonly<Record<number, string>>;
};

/**
 * The Japanese list, spelt in the 45 base kana (`kana.ts`): a tile is its
 * kana's code above `KANA_TILE_START`, so a line of tiles reads straight off
 * as the folded word it spells, and が, ゃ and を are found by the tile they
 * are played with.
 */
function unpackJapaneseWords(data: JapaneseWordsData): TileWords {
  const kana = [...data.kana];
  if (kana.some((face, at) => kanaTileCode(face) !== String.fromCodePoint(KANA_TILE_START + at))) throw new Error("The Japanese Kumimoji list's kana are not the tiles' own order.");
  const tileOfPacked = new Map([...data.codes].map((code, at) => [code, kanaTileCode(kana[at]!)!]));
  const byLength = new Map<number, string[]>();
  const allowed = new Set<string>();
  for (const [length, packed] of Object.entries(data.byLength)) {
    const words = unpackLength(packed, Number(length)).map((word) => [...word].map((code) => tileOfPacked.get(code)!).join(""));
    byLength.set(Number(length), words);
    for (const word of words) allowed.add([...word].map((tile) => tileFace(tile).glyph).join(""));
  }
  const mix = new Map(Object.entries(JAPANESE_TILE_MIX).map(([face, count]) => [kanaTileCode(face)!, count]));
  const isTile = (tile: string) => tile.length === 1 && tile.codePointAt(0)! - KANA_TILE_START >= 0 && tile.codePointAt(0)! - KANA_TILE_START < kana.length;
  const isAssignedWild = (tile: string) => tile.length === 1 && tile.codePointAt(0)! - KANA_WILD_START >= 0 && tile.codePointAt(0)! - KANA_WILD_START < kana.length;
  const isWild = (tile: string) => tile === "*" || isAssignedWild(tile);
  const soundOf = (tile: string) => (isTile(tile) || isAssignedWild(tile) ? tileFace(tile).glyph : null);
  const identity = (tile: string) => (isWild(tile) ? "*" : isTile(tile) ? tileFace(tile).glyph : null);
  return {
    language: "japanese",
    allowed,
    byLength,
    mix,
    glyphOf: (tile) => tileFace(tile).glyph,
    soundOf,
    wordOf: (tiles) => {
      const sounds = [...tiles].map(soundOf);
      return sounds.some((sound) => sound === null) ? null : sounds.join("");
    },
    wildFor: (sound) => {
      const base = tileKana(sound);
      return base === null ? null : kanaTileCode(base, true);
    },
    isWild,
    wildSound: (tile) => (isAssignedWild(tile) ? tileFace(tile).glyph : null),
    inventoryKey: identity,
    familyKey: identity,
    formsOf: (tile) => (isTile(tile) ? tileFace(tile).forms : ""),
    wildOptions: kana,
    codeOf: (face) => {
      const base = tileKana(face);
      return base === null ? null : kanaTileCode(base);
    },
  };
}

export async function loadTileWords(language: KumimojiLanguage = "english"): Promise<TileWords> {
  const already = loaded.get(language);
  if (already !== undefined) return already;
  const words = language === "english"
    ? unpackTileWords((await import("./words.en.data")).TILE_WORDS_EN)
    : unpackJapaneseWords((await import("./words.ja.data")).TILE_WORDS_JA);
  loaded.set(language, words);
  return words;
}

export function tileWords(language: KumimojiLanguage = "english"): TileWords {
  const words = loaded.get(language);
  if (words === undefined) throw new Error(`The ${language} Kumimoji words have not been loaded (loadTileWords).`);
  return words;
}

/** Whether the list has been fetched yet, for a page to say "loading" rather than throw. */
export function tileWordsReady(language: KumimojiLanguage = "english"): boolean {
  return loaded.has(language);
}
