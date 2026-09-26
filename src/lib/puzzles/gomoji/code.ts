import type { PuzzleKind } from "../puzzles.types";
import { baseGuesses } from "./layout";
import { EN_WORDS } from "./words.en.data";
import { FR_WORDS } from "./words.fr.data";
import { DE_WORDS } from "./words.de.data";
import { isPopWord, popAnswers } from "./popWords";

/**
 * GOMOJI: a word of `size` letters, found in `size + 1` guesses, each
 * guess coloured letter by letter — in its place, in the word elsewhere, or
 * not in it at all.
 *
 * As strings, for an address, a POST body and a kept run:
 * - the GIVENS are the hidden word in CAPITALS ("CRANE"). Capitals so that
 *   the givens can never be handed in as an answer, which is written in
 *   lower case: a puzzle's givens are never its own solution.
 * - an ANSWER, and a run's progress, is every guess in order, run together in
 *   lower case ("slateprick crane" without the spaces). A guess is `size`
 *   letters, so where one ends is never in doubt.
 *
 * ONE ENGINE, THREE LANGUAGES (Gomoji Mot, French; Gomoji Wort, German):
 * every function here takes the language its puzzle is in, defaulting to
 * English so every existing caller keeps working unchanged. English and
 * French share the plain A–Z alphabet (French folds its accents away when
 * its word list is written, `word-lists-fr-de.mjs`); German alone adds Ä, Ö
 * and Ü as letters of their own, so `decodeHidden` and `decodeGuesses` read
 * the alphabet a language's givens and guesses may be spelled with.
 *
 * POP GOMOJI is a fourth "language" in the same sense: English letters, its
 * own answers (a person's pop-culture list, each word with its category) and
 * its own guesses (that list and the English dictionary), kept in
 * `popWords.ts`.
 */
export type GomojiLanguage = "en" | "fr" | "de" | "pop";

const WORD_DATA: Record<Exclude<GomojiLanguage, "pop">, Record<number, { easy: string; answers: string; allowed: string }>> = {
  en: EN_WORDS,
  fr: FR_WORDS,
  de: DE_WORDS,
};

/** The letters a language's givens and guesses may be spelled with, upper case, for a decoding regex. */
const ALPHABET: Record<GomojiLanguage, string> = { en: "A-Z", fr: "A-Z", de: "A-ZÄÖÜ", pop: "A-Z" };

/** Which language a Gomoji kind plays in: English for Gomoji itself, French for Mot, German for Wort, and Pop's own list. */
export function languageOf(kind: PuzzleKind): GomojiLanguage {
  if (kind === "gomojiMot") return "fr";
  if (kind === "gomojiWort") return "de";
  if (kind === "gomojiPop") return "pop";
  return "en";
}

/** The published game's guesses for a word of this length, which hard keeps: one more than its letters, up to six. Every level's count is `guessesFor` (`layout.ts`). */
export function rowsFor(size: number): number {
  return baseGuesses("gomoji", size);
}

/** What a guessed letter says about the hidden word. */
export type LetterMark = "hit" | "near" | "miss";

/**
 * Each letter of a guess, marked against the hidden word, as a person marks
 * it on paper: first the letters in their place, then — from what is left of
 * the hidden word — the letters present elsewhere, each copy of the word's
 * letter marking one copy of the guess's and no more. So a guess with two E's
 * against a word with one marks one E and misses the other, and the E in its
 * place is the one that counts.
 */
export function markGuess(guess: string, hidden: string): LetterMark[] {
  const marks: LetterMark[] = Array.from({ length: guess.length }, () => "miss");
  const left = new Map<string, number>();
  for (let at = 0; at < hidden.length; at += 1) {
    if (guess[at] === hidden[at]) marks[at] = "hit";
    else left.set(hidden[at]!, (left.get(hidden[at]!) ?? 0) + 1);
  }
  for (let at = 0; at < guess.length; at += 1) {
    if (marks[at] === "hit") continue;
    const count = left.get(guess[at]!) ?? 0;
    if (count > 0) {
      marks[at] = "near";
      left.set(guess[at]!, count - 1);
    }
  }
  return marks;
}

/** The hidden word a puzzle's givens name, lower case, or null for givens that are not one word in capitals of this language's alphabet. */
export function decodeHidden(givens: string, size: number, lang: GomojiLanguage = "en"): string | null {
  const re = new RegExp(`^[${ALPHABET[lang]}]+$`);
  return typeof givens === "string" && givens.length === size && re.test(givens) ? givens.toLowerCase() : null;
}

export function encodeHidden(word: string): string {
  return word.toUpperCase();
}

/** The guesses a string holds, in order, or null for one that is not whole guesses of this language's lower-case letters. */
export function decodeGuesses(code: string, size: number, lang: GomojiLanguage = "en"): string[] | null {
  const re = new RegExp(`^[${ALPHABET[lang].toLowerCase()}]*$`);
  if (typeof code !== "string" || code.length % size !== 0 || !re.test(code)) return null;
  return Array.from({ length: code.length / size }, (_, row) => code.slice(row * size, row * size + size));
}

/* THE WORDS. One list per length, kept as the data file writes it, read into sets once. */

type Lists = { easy: string[]; answers: string[]; allowed: Set<string> };

const LISTS = new Map<string, Lists>();

function listsFor(size: number, lang: Exclude<GomojiLanguage, "pop"> = "en"): Lists | null {
  const key = `${lang}:${size}`;
  const known = LISTS.get(key);
  if (known !== undefined) return known;
  const text = WORD_DATA[lang][size];
  if (text === undefined) return null;
  const split = (words: string) => words.split(/\s+/).filter(Boolean);
  const lists = { easy: split(text.easy), answers: split(text.answers), allowed: new Set(split(text.allowed)) };
  LISTS.set(key, lists);
  return lists;
}

/** Whether a word may be guessed: any word of the length in the list, whatever it is. */
export function isWord(word: string, size: number, lang: GomojiLanguage = "en"): boolean {
  if (lang === "pop") return isPopWord(word, size);
  return word.length === size && (listsFor(size, lang)?.allowed.has(word) ?? false);
}

/** The words a hidden word is drawn from: the commonest for easy, the wider list for medium and hard. */
export function answersFor(size: number, easy: boolean, lang: GomojiLanguage = "en"): readonly string[] {
  if (lang === "pop") return popAnswers(size);
  const lists = listsFor(size, lang);
  if (lists === null) return [];
  return easy ? lists.easy : lists.answers;
}

/**
 * HARD, as the published game plays it: every letter already found must be
 * used again — a letter in its place stays in its place, a letter found
 * elsewhere appears somewhere. The reason a guess breaks it, in words, or null
 * when it keeps it.
 */
export function breaksHardRule(guesses: readonly string[], hidden: string, next: string): string | null {
  for (const guess of guesses) {
    const marks = markGuess(guess, hidden);
    for (let at = 0; at < guess.length; at += 1) {
      if (marks[at] === "hit" && next[at] !== guess[at]) return `the ${ordinal(at + 1)} letter must be ${guess[at]!.toUpperCase()}`;
    }
    const needed = new Map<string, number>();
    marks.forEach((mark, at) => {
      if (mark !== "miss") needed.set(guess[at]!, (needed.get(guess[at]!) ?? 0) + 1);
    });
    for (const [letter, count] of needed) {
      if ([...next].filter((each) => each === letter).length < count) return `the guess must use ${letter.toUpperCase()}`;
    }
  }
  return null;
}

function ordinal(n: number): string {
  return ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"][n - 1] ?? `${n}th`;
}

/**
 * For each place, the letter an earlier guess already found there (green), or
 * "" where none has. John, 2026-09-26: "if a letter is known green, placing
 * that letter in the same column should start off green… since it's gonna be
 * green anyway." What the board already told the player, never a peek at the
 * hidden word: it reads only the guesses made and their marks.
 */
export function foundInPlace(guesses: readonly string[], marks: readonly (readonly string[])[], size: number): string[] {
  const found = Array.from({ length: size }, () => "");
  guesses.forEach((guess, row) => {
    for (let at = 0; at < size; at += 1) if (marks[row]?.[at] === "hit") found[at] = guess[at] ?? "";
  });
  return found;
}
