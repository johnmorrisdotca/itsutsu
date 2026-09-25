import { baseGuesses } from "./layout";
import { EN_WORDS } from "./words.en.data";

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
 */

/** The published game's guesses for a word of this length, which hard keeps: one more than its letters. Every level's count is `guessesFor` (`layout.ts`). */
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

/** The hidden word a puzzle's givens name, lower case, or null for givens that are not one word in capitals. */
export function decodeHidden(givens: string, size: number): string | null {
  return typeof givens === "string" && givens.length === size && /^[A-Z]+$/.test(givens) ? givens.toLowerCase() : null;
}

export function encodeHidden(word: string): string {
  return word.toUpperCase();
}

/** The guesses a string holds, in order, or null for one that is not whole guesses of lower-case letters. */
export function decodeGuesses(code: string, size: number): string[] | null {
  if (typeof code !== "string" || code.length % size !== 0 || !/^[a-z]*$/.test(code)) return null;
  return Array.from({ length: code.length / size }, (_, row) => code.slice(row * size, row * size + size));
}

/* THE WORDS. One list per length, kept as the data file writes it, read into sets once. */

type Lists = { easy: string[]; answers: string[]; allowed: Set<string> };

const LISTS = new Map<number, Lists>();

function listsFor(size: number): Lists | null {
  const known = LISTS.get(size);
  if (known !== undefined) return known;
  const text = EN_WORDS[size];
  if (text === undefined) return null;
  const split = (words: string) => words.split(/\s+/).filter(Boolean);
  const lists = { easy: split(text.easy), answers: split(text.answers), allowed: new Set(split(text.allowed)) };
  LISTS.set(size, lists);
  return lists;
}

/** Whether a word may be guessed: any word of the length in the list, whatever it is. */
export function isWord(word: string, size: number): boolean {
  return word.length === size && (listsFor(size)?.allowed.has(word) ?? false);
}

/** The words a hidden word is drawn from: the commonest for easy, the wider list for medium and hard. */
export function answersFor(size: number, easy: boolean): readonly string[] {
  const lists = listsFor(size);
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
  return ["first", "second", "third", "fourth", "fifth", "sixth"][n - 1] ?? `${n}th`;
}
