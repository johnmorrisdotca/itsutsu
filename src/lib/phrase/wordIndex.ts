/**
 * Finding a word by tapping, rather than typing it.
 *
 * Entry is on a tablet, often by a child, so the pad has no keyboard: a
 * reader taps a letter, maybe a second, and then the word itself off a grid.
 * That removes spelling as a way to fail, and with the phrase being a set
 * rather than a sequence it removes order too — the two things a
 * twelve-year-old is most likely to get wrong about a password.
 *
 * WHY A PREFIX WALK AND NOT A GRID OF THE RIGHT WORDS. The obvious reading of
 * "tap the words from a shuffled grid" is a grid holding the four correct
 * words among decoys, and it must never be built: the server holds a hash and
 * not the words, so it could not populate such a grid — and if it could, a
 * grid of sixteen containing the four right ones is a one-in-1,820 guess,
 * which is not a credential at all. The shuffling belongs to the PICKER, where
 * four candidates really are offered; here the job is to let somebody say any
 * of 1,296 words in two or three taps, and for that alphabetical order is what
 * a reader scans.
 *
 * Pure, and the whole list is safe to send to the browser — it is published by
 * EFF and says nothing about anybody's phrase.
 */
import { WORDLIST } from "./wordlist.constants";

/**
 * How many words may be put in front of somebody at once.
 *
 * FORTY-EIGHT, and the number is chosen to buy an invariant rather than by
 * eye: **no word on this list is ever more than two letters deep.** A
 * one-letter prefix can mean 220 words ("s"), which is a wall; the largest
 * two-letter bucket is 41 ("st"), so a threshold anywhere from 41 to 60 means
 * the letter phase is at most two taps and the word is the third.
 *
 * Twenty-four was the first guess and it was wrong — it pushed "st", "sh" and
 * "sl" to a THIRD letter, and `wordIndex.test.ts` caught it by walking every
 * letter on the list. The words here are three to five letters, so
 * forty-eight of them is a grid a reader scans rather than reads.
 */
export const WORDS_IN_A_GRID = 48;

/** A prefix as the list spells things: trimmed and folded. */
function fold(prefix: string): string {
  return prefix.trim().toLowerCase();
}

/** The list's words beginning with this prefix, alphabetically. */
export function wordsWithPrefix(prefix: string): string[] {
  const wanted = fold(prefix);
  if (wanted === "") return [...WORDLIST];
  return WORDLIST.filter((word) => word.startsWith(wanted));
}

/**
 * What to show next: more letters, the words themselves, or nothing.
 *
 * `none` is a real answer and not an error. A prefix no word begins with
 * cannot be reached by tapping what this function offers, but a pad can be
 * driven by anything — a restored state, a stale click — and an empty grid
 * that looks like a grid is worse than a pad that says there is nothing here.
 */
export type PadStep =
  | { kind: "letters"; letters: string[] }
  | { kind: "words"; words: string[] }
  | { kind: "none" };

export function padStep(prefix: string): PadStep {
  const matching = wordsWithPrefix(prefix);
  if (matching.length === 0) return { kind: "none" };
  if (matching.length <= WORDS_IN_A_GRID) return { kind: "words", words: matching };

  const at = fold(prefix).length;
  const letters = [...new Set(matching.map((word) => word[at]))]
    .filter((letter): letter is string => letter !== undefined)
    .sort();
  /*
   * Every word here is longer than the prefix, or it would have been the whole
   * of a short match — but if a prefix somehow matched more than a grid's worth
   * and yielded no next letter, offering an empty row of letters would be a
   * dead end. The words are the honest answer then, long grid or not.
   */
  if (letters.length === 0) return { kind: "words", words: matching };
  return { kind: "letters", letters };
}
