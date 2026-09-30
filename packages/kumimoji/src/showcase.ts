import { BASE_KANA, CORNER_FORMS, tileKana } from "./kana.ts";
import { kanaTileCode } from "./tileFace.ts";
import { JAPANESE_TILE_MIX, KUMIMOJI_HANDS, TILE_MIX, kumimojiTileCount, kumimojiWildCount } from "./tiles.constants.ts";
import type { KumimojiLanguage, KumimojiLength } from "./kumimoji.types.ts";

/**
 * WHAT THE KUMIMOJI PAGES SHOW OF THE GAME, worked out from the tables the
 * game is played by and never typed a second time: the two tile sets with
 * their counts, every form a kana tile plays as, and how many tiles and wilds
 * each length of game deals. Pure, so the rules page draws it at build time
 * and the tests hold it to the constants.
 */

/** One kind of tile in a set: the code the game deals, what is printed on it, what shows in its corner, and how many the set holds. */
export type MixTile = { code: string; glyph: string; forms: string; count: number };

/** A whole set, in its own order (a to z, あ to ん), with what a reader needs to see how uneven it is. */
export type MixShown = {
  tiles: MixTile[];
  total: number;
  /** The most of any one tile, which the bars are drawn against. */
  most: number;
  /** The fewest of any one tile, and the tiles with only that many: the hard ones. */
  fewest: number;
  rarest: string[];
  /** The tiles with the most, the ones a hand is full of. */
  commonest: string[];
};

export function mixShown(language: KumimojiLanguage): MixShown {
  const tiles: MixTile[] =
    language === "english"
      ? Object.entries(TILE_MIX).map(([letter, count]) => ({ code: letter, glyph: letter, forms: "", count }))
      : [...BASE_KANA].map((kana) => ({ code: kanaTileCode(kana)!, glyph: kana, forms: CORNER_FORMS[kana] ?? "", count: JAPANESE_TILE_MIX[kana] ?? 0 }));
  const counts = tiles.map((tile) => tile.count);
  const most = Math.max(...counts);
  const fewest = Math.min(...counts);
  return {
    tiles,
    total: counts.reduce((sum, count) => sum + count, 0),
    most,
    fewest,
    rarest: tiles.filter((tile) => tile.count === fewest).map((tile) => tile.glyph),
    commonest: tiles.filter((tile) => tile.count === most).map((tile) => tile.glyph),
  };
}

/**
 * EVERY HIRAGANA A TILE PLAYS AS, itself first: は is は, ば and ぱ; つ is つ,
 * っ and づ; お is お, ぉ and を. Read off the rule the word check uses
 * (`tileKana`) over the whole hiragana block, so the list is what the game
 * accepts — the rare forms the corner leaves out (ぁ, ゎ, ゔ) included.
 */
const HIRAGANA_FIRST = 0x3041;
const HIRAGANA_LAST = 0x3096;

export function formsOfTile(kana: string): string[] {
  if (tileKana(kana) !== kana) return [];
  const forms = [kana];
  for (let point = HIRAGANA_FIRST; point <= HIRAGANA_LAST; point += 1) {
    const form = String.fromCodePoint(point);
    if (form !== kana && tileKana(form) === kana) forms.push(form);
  }
  return forms;
}

/** One length of game at one opening hand: how many tiles it deals from one set and from two, and how many of them are wild at each level. */
export type LengthRow = {
  length: KumimojiLength;
  tiles: number;
  /** With the Double set, English only. */
  doubleTiles: number;
  wilds: Record<"easy" | "medium" | "hard", number>;
};

export const LENGTHS: readonly KumimojiLength[] = ["short", "medium", "full"];

export function lengthRows(hand: number = KUMIMOJI_HANDS.classic): LengthRow[] {
  return LENGTHS.map((length) => {
    const tiles = kumimojiTileCount(hand, length);
    return {
      length,
      tiles,
      doubleTiles: kumimojiTileCount(hand, length, undefined, true),
      wilds: { easy: kumimojiWildCount(hand, "easy", tiles), medium: kumimojiWildCount(hand, "medium", tiles), hard: kumimojiWildCount(hand, "hard", tiles) },
    };
  });
}

/**
 * THE TRY-IT ON THE FRONT DOOR: a Kumimoji of ten tiles, played in the
 * reader's browser with the game's own moves and the game's own word check.
 * A hand of seven, then three to draw, the last of them a wild. The bag is
 * fixed rather than dealt, so the page is the same for everybody and needs no
 * generator; `showcase.test.ts` proves it can be finished, with a crossword
 * checked against the real list.
 */
export const TRY_IT = { bag: "rotenasdi*", hand: 7 } as const;
