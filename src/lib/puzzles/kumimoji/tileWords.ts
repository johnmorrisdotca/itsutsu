import { TILE_MIX } from "./tiles.constants";
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
  /** Identity used when a Japanese mora is flexed across its voiced family. */
  familyKey: (tile: string) => string | null;
  /** Kana forms sharing this tile's dakuten/handakuten family. */
  flexForms: (tile: string) => readonly string[];
  /** Replace a Japanese tile code with a family form. */
  flexTile: (tile: string, form: string) => string | null;
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
    flexForms: () => [],
    flexTile: () => null,
    wildOptions: letters,
    codeOf: (face) => (/^[a-z]$/.test(face) ? face : null),
  };
}

type JapaneseWordsData = {
  morae: readonly string[];
  mix: Readonly<Record<string, number>>;
  byLength: Readonly<Record<number, string>>;
};

const MORA_ID_START = 0xe000;
const WILD_ID_START = 0xf000;

function withoutMarks(mora: string): string {
  return mora.normalize("NFD").replace(/[\u3099\u309a]/gu, "").normalize("NFC");
}

function unpackMoraLength(packed: string, length: number, morae: readonly string[]): string[][] {
  const text = packed.replace(/\s+/g, "");
  const words: string[][] = [];
  let before: string[] = [];
  let at = 0;
  while (at < text.length) {
    const shared = Number.parseInt(text[at]!, 16);
    if (!Number.isInteger(shared) || shared >= length) throw new Error("Invalid front-coded Japanese word.");
    at += 1;
    const word = before.slice(0, shared);
    for (let index = shared; index < length; index += 1) {
      const moraIndex = Number.parseInt(text.slice(at, at + 2), 36);
      if (!Number.isInteger(moraIndex) || moraIndex < 0 || moraIndex >= morae.length) throw new Error("Invalid Japanese mora code.");
      word.push(morae[moraIndex]!);
      at += 2;
    }
    words.push(word);
    before = word;
  }
  return words;
}

function unpackJapaneseWords(data: JapaneseWordsData): TileWords {
  const codeForFace = new Map(data.morae.map((face, at) => [face, String.fromCodePoint(MORA_ID_START + at)]));
  const faceForCode = new Map([...codeForFace].map(([face, code]) => [code, face]));
  const wildFaceForCode = new Map(data.morae.map((face, at) => [String.fromCodePoint(WILD_ID_START + at), face]));
  const wildCodeForFace = new Map([...wildFaceForCode].map(([code, face]) => [face, code]));
  const byLength = new Map<number, string[]>();
  const allowed = new Set<string>();
  for (const [length, packed] of Object.entries(data.byLength)) {
    const words = unpackMoraLength(packed, Number(length), data.morae);
    byLength.set(Number(length), words.map((word) => word.map((mora) => codeForFace.get(mora)!).join("")));
    for (const word of words) allowed.add(word.join(""));
  }
  const mix = new Map(Object.entries(data.mix).map(([face, count]) => [codeForFace.get(face)!, count]));
  const soundOf = (tile: string) => faceForCode.get(tile) ?? wildFaceForCode.get(tile) ?? null;
  const isWild = (tile: string) => tile === "*" || wildFaceForCode.has(tile);
  const familyKey = (tile: string) => {
    if (isWild(tile)) return "*";
    const face = soundOf(tile);
    return face === null ? null : withoutMarks(face);
  };
  const flexForms = (tile: string) => {
    if (isWild(tile)) return [];
    const family = familyKey(tile);
    return family === null ? [] : data.morae.filter((mora) => withoutMarks(mora) === family);
  };
  return {
    language: "japanese",
    allowed,
    byLength,
    mix,
    glyphOf: (tile) => soundOf(tile) ?? (tile === "*" ? "五" : ""),
    soundOf,
    wordOf: (tiles) => {
      const sounds = [...tiles].map(soundOf);
      return sounds.some((sound) => sound === null) ? null : sounds.join("");
    },
    wildFor: (sound) => wildCodeForFace.get(sound) ?? null,
    isWild,
    wildSound: (tile) => wildFaceForCode.get(tile) ?? null,
    inventoryKey: (tile) => (isWild(tile) ? "*" : faceForCode.get(tile) ?? null),
    familyKey,
    flexForms,
    flexTile: (tile, form) => (flexForms(tile).includes(form) ? codeForFace.get(form) ?? null : null),
    wildOptions: data.morae,
    codeOf: (face) => codeForFace.get(face) ?? null,
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
