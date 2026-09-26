import { EN_WORDS } from "./words.en.data";
import { POP_ANSWERS, POP_CATEGORIES } from "./words.pop.data";

/**
 * POP GOMOJI'S WORDS: the answers, each with the category the puzzle shows as
 * its clue, and what may be guessed.
 *
 * John, 2026-09-26: a pop-culture Gomoji, "each word with its category shown
 * as the clue… guesses accepted from the dictionary lists and the corpus,
 * lengths 3-7". The answers are a person's list (`scripts/pop-corpus.txt`,
 * written into `words.pop.data.ts`); a guess is any of them, or any word of
 * the English dictionary at its length — Gomoji's own lists at four to six
 * letters, and at three and seven a file of their own (`words.pop.guesses.data.ts`)
 * fetched only when such a puzzle is played (`loadPopGuesses`), so no other
 * Gomoji carries it. Asked about a three- or seven-letter guess before that
 * file is here, this refuses rather than guessing, as the kana lists do.
 */

/** The lengths whose dictionary guesses are Pop Gomoji's own file rather than Gomoji's English lists. */
export const POP_OWN_GUESS_LENGTHS: readonly number[] = [3, 7];

const ANSWERS = new Map<number, string[]>();
const CATEGORY = new Map<string, string>();

function answersAt(size: number): string[] {
  const known = ANSWERS.get(size);
  if (known !== undefined) return known;
  const words: string[] = [];
  for (const entry of (POP_ANSWERS[size] ?? "").split(/\s+/).filter(Boolean)) {
    const dot = entry.indexOf(".");
    const word = entry.slice(0, dot);
    words.push(word);
    CATEGORY.set(word, POP_CATEGORIES[Number(entry.slice(dot + 1))] ?? "");
  }
  ANSWERS.set(size, words);
  return words;
}

/** Every answer of a length, in the list's order. The same at every level: the list is already the well-known words. */
export function popAnswers(size: number): readonly string[] {
  return answersAt(size);
}

/** The clue a Pop Gomoji word is shown with — its category — or null for a word that is not one of its answers. */
export function popCategoryOf(word: string): string | null {
  answersAt(word.length);
  return CATEGORY.get(word) || null;
}

const ENGLISH = new Map<number, Set<string>>();
const OWN = new Map<number, Set<string>>();

/** Fetches the dictionary's guesses at three or seven letters, once; nothing to fetch at the other lengths. */
export async function loadPopGuesses(size: number): Promise<void> {
  if (!POP_OWN_GUESS_LENGTHS.includes(size) || OWN.has(size)) return;
  const { POP_GUESSES } = await import("./words.pop.guesses.data");
  for (const length of POP_OWN_GUESS_LENGTHS) {
    if (!OWN.has(length)) OWN.set(length, new Set((POP_GUESSES[length] ?? "").split(/\s+/).filter(Boolean)));
  }
}

/**
 * Whether a word may be guessed in a Pop Gomoji of this length: one of its
 * answers, or a word of the English dictionary. Throws at three or seven
 * letters before `loadPopGuesses`, so a check that has not read the list says
 * so instead of refusing a real word.
 */
export function isPopWord(word: string, size: number): boolean {
  if (word.length !== size) return false;
  if (answersAt(size).includes(word)) return true;
  if (POP_OWN_GUESS_LENGTHS.includes(size)) {
    const own = OWN.get(size);
    if (own === undefined) throw new Error(`The ${size}-letter Pop Gomoji guesses have not been loaded (loadPopGuesses).`);
    return own.has(word);
  }
  let english = ENGLISH.get(size);
  if (english === undefined) {
    english = new Set((EN_WORDS[size]?.allowed ?? "").split(/\s+/).filter(Boolean));
    ENGLISH.set(size, english);
  }
  return english.has(word);
}
