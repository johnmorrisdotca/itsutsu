/**
 * HOW A KANA GUESS IS COLOURED, by John's rules for WordDrop in kana
 * (2026-09-25; the table is in docs/plans/other/WORD-04-kana.md):
 *
 *  - green: the same kana in this place;
 *  - green with an arrow: the same kana in this place but the wrong size (↓,
 *    っ for つ) or the wrong mark (↑, ば for は) — not found until plain green;
 *  - orange: the kana is in the word elsewhere, an arrow likewise when its size
 *    or mark differs;
 *  - yellow: the word's kana in this place is not this one but is of its
 *    family, the same consonant row of the gojūon (か行, and が with it);
 *  - grey: none of those.
 *
 * ー is a character with no family, size or mark: green, orange or grey only.
 * A kana is counted as often as the word holds it, as the English marking is:
 * green first, then orange from left to right from what green left over.
 */
export type KanaMark = "hit" | "near" | "kin" | "miss";
export type KanaMarked = { mark: KanaMark; wrongSize: boolean; wrongMark: boolean };

/** The long-vowel bar, a character of its own. */
export const LONG_BAR = "ー";

const SMALL_TO_LARGE: Record<string, string> = { ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ", ゕ: "か", ゖ: "け" };

const VOICED = "がぎぐげござじずぜぞだぢづでどばびぶべぼ";
const VOICED_BASE = "かきくけこさしすせそたちつてとはひふへほ";
const HALF_VOICED = "ぱぴぷぺぽ";
const HALF_VOICED_BASE = "はひふへほ";

/** The gojūon rows, by base kana: the family a kana belongs to. */
const ROWS: readonly string[] = ["あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの", "はひふへほ", "まみむめも", "やゆよ", "らりるれろ", "わを", "ん"];

/** A kana without its size or its mark: ぱ → は, っ → つ, ゔ → う. ー and anything unknown are themselves. */
export function kanaBase(kana: string): string {
  if (kana === "ゔ") return "う";
  const large = SMALL_TO_LARGE[kana] ?? kana;
  const voiced = VOICED.indexOf(large);
  if (voiced !== -1) return VOICED_BASE[voiced]!;
  const half = HALF_VOICED.indexOf(large);
  if (half !== -1) return HALF_VOICED_BASE[half]!;
  return large;
}

export function isSmall(kana: string): boolean {
  return kana in SMALL_TO_LARGE;
}

/** Which mark a kana carries: none, ゛ or ゜. */
export function kanaTone(kana: string): "" | "゛" | "゜" {
  const large = SMALL_TO_LARGE[kana] ?? kana;
  if (large === "ゔ" || VOICED.includes(large)) return "゛";
  if (HALF_VOICED.includes(large)) return "゜";
  return "";
}

/** The gojūon row a kana belongs to, by its base, or null for ー and anything that is no kana. */
export function kanaFamily(kana: string): number | null {
  if (kana === LONG_BAR) return null;
  const base = kanaBase(kana);
  const row = ROWS.findIndex((each) => each.includes(base));
  return row === -1 ? null : row;
}

function arrows(guessed: string, word: string): { wrongSize: boolean; wrongMark: boolean } {
  return { wrongSize: isSmall(guessed) !== isSmall(word), wrongMark: kanaTone(guessed) !== kanaTone(word) };
}

/** A guess coloured against the word, place by place. Both are arrays of single kana. */
export function markKanaGuess(guess: readonly string[], word: readonly string[]): KanaMarked[] {
  const plain = { wrongSize: false, wrongMark: false };
  const out: (KanaMarked | null)[] = guess.map(() => null);
  const used = word.map(() => false);

  /* Green, plain or with its arrow: the same base in this place. */
  guess.forEach((kana, at) => {
    if (word[at] !== undefined && kanaBase(kana) === kanaBase(word[at]!)) {
      out[at] = { mark: "hit", ...(kana === word[at] ? plain : arrows(kana, word[at]!)) };
      used[at] = true;
    }
  });

  /* Orange from what green left, left to right; then yellow for this place's family; then grey. */
  guess.forEach((kana, at) => {
    if (out[at] !== null) return;
    const elsewhere = word.findIndex((other, where) => !used[where] && kanaBase(other) === kanaBase(kana));
    if (elsewhere !== -1) {
      used[elsewhere] = true;
      out[at] = { mark: "near", ...(kana === word[elsewhere] ? plain : arrows(kana, word[elsewhere]!)) };
      return;
    }
    const family = kanaFamily(kana);
    const here = word[at] === undefined ? null : kanaFamily(word[at]!);
    out[at] = { mark: family !== null && family === here ? "kin" : "miss", ...plain };
  });
  return out as KanaMarked[];
}

/** Found: every place plain green — the right kana, the right size, the right mark. */
export function kanaFound(guess: readonly string[], word: readonly string[]): boolean {
  return guess.length === word.length && guess.every((kana, at) => kana === word[at]);
}

/** The kana with a small form a player types: the vowels, つ, や, ゆ, よ and わ. */
const LARGE_TO_SMALL: Record<string, string> = { あ: "ぁ", い: "ぃ", う: "ぅ", え: "ぇ", お: "ぉ", つ: "っ", や: "ゃ", ゆ: "ゅ", よ: "ょ", わ: "ゎ" };

const SMALL_TO_TYPED = Object.fromEntries(Object.entries(LARGE_TO_SMALL).map(([large, small]) => [small, large]));

/** 小: a kana made small, or large again (つ ⇄ っ); one with no small form stays as it is. */
export function toggleSize(kana: string): string {
  return LARGE_TO_SMALL[kana] ?? SMALL_TO_TYPED[kana] ?? kana;
}

/** ゛゜: a kana's mark, round in turn — は → ば → ぱ → は, か → が → か, う → ゔ → う; a kana with no marked form stays. */
export function cycleMark(kana: string): string {
  if (kana === "う") return "ゔ";
  if (kana === "ゔ") return "う";
  const plain = VOICED_BASE.indexOf(kana);
  if (plain !== -1) return VOICED[plain]!;
  const voiced = VOICED.indexOf(kana);
  if (voiced !== -1) {
    const base = VOICED_BASE[voiced]!;
    return HALF_VOICED_BASE.includes(base) ? HALF_VOICED[HALF_VOICED_BASE.indexOf(base)]! : base;
  }
  const half = HALF_VOICED.indexOf(kana);
  if (half !== -1) return HALF_VOICED_BASE[half]!;
  return kana;
}
