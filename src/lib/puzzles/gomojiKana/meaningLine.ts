import type { Word } from "@johnmorrisdotca/jisho/words";

/**
 * WHAT A KANA GUESS MEANS, as the one quiet line the game shows (John, 2026-11-02: "the user should be able to see
 * what each guess means. Has to be so subtle as to not ruin the UX.").
 *
 * The words come from Jisho (`@johnmorrisdotca/jisho`, JMdict's), in its default safe mode, which already leaves out
 * what JMdict marks vulgar, X-rated, sensitive or derogatory. This is the site's part: the readings the site keeps
 * out on top of that, and how a reading that several words share is put on one line. It is Kotoba's own demo
 * (`demo/meanings.js`) made again, so the two games read alike: the commonest two or three words, each with its first
 * plain gloss, "紙 paper · 神 god · 髪 hair", never over 60 characters.
 *
 * This file imports Jisho's TYPES only. The dictionary itself is fetched in the browser, one small piece at a time,
 * by `guessMeaning.ts`, and never reaches a server's build.
 */

/** The longest line, in characters, and the longest each entry may be when there are several. */
export const LINE_LONGEST = 60;
const EACH = 22;
const SEPARATOR = " · ";

/**
 * Readings the game leaves out of what it explains, on top of Jisho's safe mode. They are Kotoba's `NOT_AN_ANSWER`
 * (scripts/word-lists-ja.mjs there): what JMdict marks no differently but is not for a child to be handed, and the
 * words about killing, violence and abuse (John, 2026-11-02, "default to stricter"). The words stay playable; only
 * their meaning is not said. Applied with Jisho's `withoutWords`.
 */
export const KANA_MEANING_BLOCKED: readonly string[] = [
  "うんこ", "うんち", "おなら", "おしっこ", "ちんこ", "まんこ", "ちんぽ", "くそ", "げろ", "しっこ", "ぶす", "でぶ", "はげ", "ばか", "あほ",
  "ぼけ", "かす", "しょうべん", "ぱんてぃー", "ふぇらちお", "ばいしゅん", "ちくしょう",
  // Marked by nobody, and not for a child to be handed: sexual, a body's private matter, or a death by one's own hand.
  "うわき", "おりもの", "ほうきょう", "なんしょく", "じさつ", "しんじゅう",
  // Killing, death by violence and abuse.
  "ころす", "たさつ", "さつじん", "ひとごろし", "ぎゃくさつ", "あんさつ", "しけい", "しょけい", "せっしょう", "ぎせいしゃ", "ひがいしゃ",
  "じゅうげき", "りゅうけつ", "ぼうりょく", "なぐる", "だぼく", "ぎゃくたい", "たいけい", "いじめ", "ゆうかい", "ひとじち",
];

/** A meaning that says one of these is not shown, though JMdict does not mark it: the same words Kotoba's demo keeps out. */
const NOT_FOR_CHILDREN = /\b(kill\w*|murder\w*|slay\w*|suicid\w*|sex\w*|rape\w*|genital\w*|prostitut\w*|abus\w*|torture\w*|massacre)\b/i;

/** The first plain gloss of a meaning: "god, deity, divinity; god-tier" is "god"; a note in brackets is dropped; a long one is cut at a word. */
function firstGloss(meaning: string): string {
  const gloss = (meaning.split(";")[0] ?? "").split(",")[0]!.replace(/\s*\([^)]*\)/g, "").trim();
  return gloss.length > EACH ? `${gloss.slice(0, EACH - 1).replace(/\s+\S*$/, "")}…` : gloss;
}

/** The line for a reading from the words Jisho has for it, commonest first, or `null` when there is nothing quiet to say. */
export function meaningLine(reading: string, found: readonly Word[]): string | null {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const word of found) {
    const gloss = firstGloss(word.meaning);
    if (gloss === "" || gloss.endsWith("…") || NOT_FOR_CHILDREN.test(word.meaning) || seen.has(gloss.toLowerCase())) continue;
    seen.add(gloss.toLowerCase());
    // A word with no kanji, or written here as its reading, is shown as its meaning alone.
    parts.push(word.written === reading || /^[ぁ-ゖァ-ヺー]+$/u.test(word.written) ? gloss : `${word.written} ${gloss}`);
    if (parts.length === 3) break;
  }
  for (let count = parts.length; count > 0; count -= 1) {
    const line = parts.slice(0, count).join(SEPARATOR);
    if ([...line].length <= LINE_LONGEST) return line;
  }
  return parts[0] === undefined ? null : `${[...parts[0]].slice(0, LINE_LONGEST - 1).join("")}…`;
}
