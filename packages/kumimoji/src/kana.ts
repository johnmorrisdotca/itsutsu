/**
 * JAPANESE KUMIMOJI'S TILES ARE THE 45 BASE KANA, and every other kana is one
 * of them played another way. John, 2026-09-28: "any letters can have it work
 * like the HA letter", and of を, combine it "with something similar".
 *
 * - A voiced or half-voiced kana is its base: が is か, ば and ぱ are は.
 * - A small kana is its large one: ゃ is や, っ is つ.
 * - を is お, which it sounds like; ゐ and ゑ, which no modern word uses, are い and え.
 *
 * So a line of tiles is a word when it spells one read that way, the rule
 * Japanese crosswords have always kept for small kana, and nobody chooses a
 * form: は then ん is はん, ばん and ぱん at once. The word list is stored
 * already read this way (`scripts/word-lists-ja.mjs` folds it with the same
 * table), so checking a line is one lookup.
 */
export const BASE_KANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん";

const SMALL_AND_OLD: Readonly<Record<string, string>> = {
  ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ", ゕ: "か", ゖ: "け", を: "お", ゐ: "い", ゑ: "え",
};

/** The tile a kana is played with, or null for anything that is not hiragana (ー, katakana, a letter). */
export function tileKana(kana: string): string | null {
  const bare = kana.normalize("NFD").replace(/[゙゚]/gu, "").normalize("NFC");
  const base = SMALL_AND_OLD[bare] ?? bare;
  return base.length === 1 && BASE_KANA.includes(base) ? base : null;
}

/**
 * WHAT A TILE SHOWS SMALL IN ITS CORNER: the other ways it is commonly played
 * (John, 2026-09-28: "the tiles like Yu can show the regular and small version
 * in that tile to show its versatility"). Only the forms a player reaches for;
 * the rare ones (ぁ, ゎ, ゔ) still play, and the rules say so.
 */
export const CORNER_FORMS: Readonly<Record<string, string>> = {
  か: "が", き: "ぎ", く: "ぐ", け: "げ", こ: "ご",
  さ: "ざ", し: "じ", す: "ず", せ: "ぜ", そ: "ぞ",
  た: "だ", ち: "ぢ", つ: "っづ", て: "で", と: "ど",
  は: "ばぱ", ひ: "びぴ", ふ: "ぶぷ", へ: "べぺ", ほ: "ぼぽ",
  や: "ゃ", ゆ: "ゅ", よ: "ょ", お: "を",
};
