import { BASE_KANA } from "./kana";
import type { KumimojiLanguage } from "./kumimoji.types";
import { KANA_TILE_START, KANA_WILD_START, tileFace } from "./tileFace";

/**
 * WHICH TILE OF THE SET A TILE IS, without the word lists: a letter is
 * itself, and any wild — blank or given a face — is the wild. The same answer
 * the loaded list's `familyKey` gives (`tileWords.ts`), for code that must
 * never load a dictionary: the server checking a party table's move on
 * several devices (docs/plans/party-online/README.md, John 2026-09-29: the
 * browser checks the words, the server only that the tiles are real).
 * `tileFamily.test.ts` holds the two to one another.
 */
export function familyKeyOf(language: KumimojiLanguage): (tile: string) => string | null {
  if (language === "english") {
    return (tile) => (tile === "*" || /^[A-Z]$/.test(tile) ? "*" : /^[a-z]$/.test(tile) ? tile : null);
  }
  const offset = (tile: string, start: number) => (tile.length === 1 ? tile.codePointAt(0)! - start : -1);
  const within = (at: number) => at >= 0 && at < [...BASE_KANA].length;
  return (tile) => {
    if (tile === "*" || within(offset(tile, KANA_WILD_START))) return "*";
    return within(offset(tile, KANA_TILE_START)) ? tileFace(tile).glyph : null;
  };
}
