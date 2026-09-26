import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { decodeKanaGivens, decodeKanaGuesses, toKatakana } from "../gomojiKana/kanaCode";
import { decodeGuesses, decodeHidden, encodeHidden, languageOf } from "./code";
import { guessesFor } from "./layout";

/**
 * FUTAGO 双子, "twins": a Gomoji with two hidden words at once. John's ticket,
 * 2026-09-26: "a Gomoji mode with two hidden words at once. Every guess goes
 * to both boards, and each keyboard key is split into two halves showing each
 * board's colour." Our version of Dordle, in every Gomoji language — English,
 * French, German and kana — at every size and level the one-word game has.
 *
 * A MODE OF EACH GOMOJI, NOT A GAME OF ITS OWN. It has the Gomoji's words, its
 * marks, its keyboard and its addresses; only the number of words differs. So
 * a Futago is kept, scored and listed under its Gomoji's kind, and what makes
 * it two words is written where it cannot be mistaken:
 *
 *  - its SEED is from a block of its own (`futagoSeed.ts`), which is what a
 *    kept run is found by;
 *  - its GIVENS are the two words joined by "+": "CRANE+SLATE", and for kana
 *    the two words and then, as ever, "|" and the free grey word, grey
 *    against both ("カメラ+サクラ|ドイツ"). A one-word decoder refuses a "+",
 *    so nothing written for one word can read a Futago as one by accident;
 *  - its ANSWER is every guess run together, as a Gomoji's is.
 *
 * Every guess goes to both boards until a board's word is found; from then
 * that board keeps the guesses that found it and takes no more, as Dordle's
 * does. It is found when both words are, and ended when the guesses run out
 * first. It gives one more guess than a Gomoji at every level (`layout.ts`).
 */
export const FUTAGO_DISPLAY = { label: "Futago", kanji: "双子", words: "Two words" } as const;

/**
 * A Futago in its Gomoji's rules, the last bullet of the Play section
 * (`puzzleRulesPage.ts`). Kept here rather than in the puzzles' copy, which is
 * stamped for their pictures (`puzzleArtFingerprint.ts`) and none of which
 * shows a Futago.
 */
export function futagoRule(grid: WordGrid): string {
  return grid === "gomojiKana"
    ? "Futago 双子 (twins), a choice at any level, hides two kana words at once, side by side, the free grey word grey against both: every guess goes to both boards until a board's word is found, each kana key is split to show both boards' colours, and there is one guess more than for one word. There are two words of the day at every length as well."
    : "Futago 双子 (twins), a choice at any level, hides two words at once, side by side: every guess goes to both boards until a board's word is found, each key is split to show both boards' colours, and there is one guess more than for one word. There are two words of the day at every length as well.";
}

/** How many boards a Futago has. */
export const FUTAGO_BOARDS = 2;

const JOIN = "+";

/** The grid a Gomoji kind's rows are laid out by: kana, or the letters every other language shares. */
export type WordGrid = "gomoji" | "gomojiKana";

export function wordGridOf(kind: PuzzleKind): WordGrid {
  return kind === "gomojiKana" ? "gomojiKana" : "gomoji";
}

/** Whether a word puzzle's givens are a Futago's two words. */
export function isFutagoGivens(givens: string): boolean {
  return givens.includes(JOIN);
}

/** The words a Gomoji's givens hide — one, or a Futago's two — lower case or hiragana, and the kana version's free grey word. */
export type HiddenWords = { words: readonly string[]; grey: string | null };

/**
 * The words any Gomoji's givens hide, one or two, or null for givens that are
 * not a word puzzle of this kind and size. A Futago's two must differ: two
 * boards with one word would be one board drawn twice.
 */
export function hiddenWordsOf(kind: PuzzleKind, size: number, givens: string): HiddenWords | null {
  if (kind === "gomojiKana") {
    const bar = givens.indexOf("|");
    const [head, tail] = bar === -1 ? [givens, ""] : [givens.slice(0, bar), givens.slice(bar)];
    const parts = head.split(JOIN).map((part) => decodeKanaGivens(`${part}${tail}`, size));
    if (parts.length > FUTAGO_BOARDS || parts.some((part) => part === null)) return null;
    const words = parts.map((part) => part!.word);
    return new Set(words).size === words.length ? { words, grey: parts[0]!.grey } : null;
  }
  const lang = languageOf(kind);
  const words = givens.split(JOIN).map((part) => decodeHidden(part, size, lang));
  if (words.length > FUTAGO_BOARDS || words.some((word) => word === null)) return null;
  return new Set(words).size === words.length ? { words: words as string[], grey: null } : null;
}

/** A lettered Futago's givens: its two words in capitals, joined. */
export function encodeFutagoGivens(words: readonly [string, string]): string {
  return words.map(encodeHidden).join(JOIN);
}

/** A kana Futago's givens: its two words in katakana, joined, and the free grey word after them where there is one. */
export function encodeKanaFutagoGivens(words: readonly [string, string], grey: string | null): string {
  const joined = words.map(toKatakana).join(JOIN);
  return grey === null ? joined : `${joined}|${toKatakana(grey)}`;
}

/** The guesses an answer or a kept run holds, in its kind's writing, or null for one that is not whole guesses. */
export function guessesOf(kind: PuzzleKind, size: number, code: string): string[] | null {
  return kind === "gomojiKana" ? decodeKanaGuesses(code, size) : decodeGuesses(code, size, languageOf(kind));
}

/** The guesses a puzzle with these givens allows at this level: one word's count or a Futago's (`layout.ts`). */
export function wordRowsOf(kind: PuzzleKind, size: number, level: PuzzleLevel, hidden: HiddenWords): number {
  return guessesFor(wordGridOf(kind), size, level, hidden.grey === null ? 0 : 1, hidden.words.length);
}

/** The guesses one board shows: every guess up to and including the one that found its word, or all of them while it is not found. */
export function boardGuesses<Guess extends string>(guesses: readonly Guess[], word: string): readonly Guess[] {
  const found = guesses.indexOf(word as Guess);
  return found === -1 ? guesses : guesses.slice(0, found + 1);
}

/** Whether every board's word has been guessed. */
export function everyWordFound(guesses: readonly string[], words: readonly string[]): boolean {
  return words.every((word) => guesses.includes(word));
}

/** The words as a page prints them: "CRANE and SLATE", in capitals for letters and as they are for kana. */
export function wordsShown(kind: PuzzleKind, words: readonly string[]): string {
  const shown = words.map((word) => (kind === "gomojiKana" ? word : word.toUpperCase()));
  return shown.join(" and ");
}
