import { BASE_KANA, CORNER_FORMS } from "./kana";

/**
 * WHAT A TILE CODE SHOWS, without the word list. A bag, a kept game and a
 * finished grid hold one character a tile: an English letter as itself (a wild
 * given a letter is that letter in capitals, a wild with none is `*`), and a
 * Japanese kana as a private-use character, its place in `BASE_KANA` above
 * `KANA_TILE_START`, or above `KANA_WILD_START` for a wild given that kana.
 * So the set-up's preview and a finished game's page draw Japanese tiles
 * without fetching the dictionary, and `tileWords` reads the same codes.
 */
export const KANA_TILE_START = 0xe000;
export const KANA_WILD_START = 0xf000;

const KANA = [...BASE_KANA];

/** The code of a base kana's tile, or of a wild given that kana. */
export function kanaTileCode(kana: string, wild = false): string | null {
  const at = KANA.indexOf(kana);
  return at === -1 ? null : String.fromCodePoint((wild ? KANA_WILD_START : KANA_TILE_START) + at);
}

export type TileFaceOf = {
  /** The letter or kana printed on it: 五 on a wild nobody has given one. */
  glyph: string;
  /** The other forms it plays as, small in its corner (`CORNER_FORMS`). */
  forms: string;
  wild: boolean;
  /** A wild with no letter yet. */
  blank: boolean;
};

export function tileFace(tile: string): TileFaceOf {
  if (tile === "*") return { glyph: "五", forms: "", wild: true, blank: true };
  if (/^[A-Z]$/.test(tile)) return { glyph: tile.toLowerCase(), forms: "", wild: true, blank: false };
  const point = tile.length === 1 ? tile.codePointAt(0)! : -1;
  const kana = KANA[point - KANA_TILE_START];
  if (kana !== undefined) return { glyph: kana, forms: CORNER_FORMS[kana] ?? "", wild: false, blank: false };
  const wildKana = KANA[point - KANA_WILD_START];
  if (wildKana !== undefined) return { glyph: wildKana, forms: "", wild: true, blank: false };
  return { glyph: tile, forms: "", wild: false, blank: false };
}

/** What a screen reader says for a tile: its letter, or that it is a wild and what it stands for. */
export function tileDescription(tile: string): string {
  const face = tileFace(tile);
  if (face.wild) return `Wild, ${face.blank ? "unassigned" : face.glyph}`;
  return face.glyph.toUpperCase();
}
