import type { PuzzleKind } from "../puzzles.types";
import { ALPHABETS, markGuess, type GomojiLanguage } from "@johnmorrisdotca/kotoba";

// Marking a guess and writing a puzzle down are Kotoba's (`@johnmorrisdotca/kotoba`); read from here as they always were.
export { decodeGuesses, decodeHidden, encodeHidden, markGuess, type GomojiLanguage, type LetterMark } from "@johnmorrisdotca/kotoba";
import { baseGuesses } from "./layout";
import { wordDataOf } from "./wordData";
import { isPopWord, popAnswers } from "./popWords";



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






/* THE WORDS. One list per length, kept as the data file writes it, read into sets once. */

type Lists = { easy: string[]; answers: string[]; allowed: Set<string> };

const LISTS = new Map<string, Lists>();

function listsFor(size: number, lang: Exclude<GomojiLanguage, "pop"> = "en"): Lists | null {
  const key = `${lang}:${size}`;
  const known = LISTS.get(key);
  if (known !== undefined) return known;
  // Loaded by `preparePuzzle` (`wordData.ts`); a list not loaded is an error, never an empty one.
  const text = wordDataOf(lang)[size];
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

/** Every word of the length that may be guessed, in the list's order. */
export function allowedFor(size: number, lang: GomojiLanguage = "en"): readonly string[] {
  // Pop culture words are only ever found from their category, so no other way of playing asks for its list.
  if (lang === "pop") return [];
  const lists = listsFor(size, lang);
  return lists === null ? [] : [...lists.allowed];
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
