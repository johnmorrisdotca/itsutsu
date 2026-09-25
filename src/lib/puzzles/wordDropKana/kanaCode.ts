import { kanaBase, markKanaGuess } from "./kanaMarks";
import type { KanaWords } from "./kanaWords";

/**
 * A KANA WORDDROP PUZZLE, written down and read back: the word, the free grey
 * word it opens with, the guesses, and the choosing of each from a seed.
 *
 * The givens are the word in KATAKANA, and on easy and medium a "|" and the
 * grey word in katakana after it; an answer is the guesses run together in
 * HIRAGANA. So the givens can never be handed in as a solve, as English keeps
 * its givens in capitals and its guesses in lower case.
 */
export const KANA_ROWS = 6;
const SPLIT = "|";

export function toKatakana(text: string): string {
  return [...text].map((char) => (char >= "ぁ" && char <= "ゖ" ? String.fromCodePoint(char.codePointAt(0)! + 0x60) : char)).join("");
}

export function toHiragana(text: string): string {
  return [...text].map((char) => (char >= "ァ" && char <= "ヶ" ? String.fromCodePoint(char.codePointAt(0)! - 0x60) : char)).join("");
}

export function encodeKanaGivens(word: string, grey: string | null): string {
  return grey === null ? toKatakana(word) : `${toKatakana(word)}${SPLIT}${toKatakana(grey)}`;
}

/** The word and its grey word, in hiragana, or null for givens that are not a kana puzzle of this size. */
export function decodeKanaGivens(givens: string, size: number): { word: string; grey: string | null } | null {
  const [word, grey, extra] = givens.split(SPLIT);
  const fits = (part: string | undefined) => part !== undefined && [...part].length === size && /^[ァ-ヶー]+$/u.test(part);
  if (!fits(word) || extra !== undefined || (grey !== undefined && !fits(grey))) return null;
  return { word: toHiragana(word!), grey: grey === undefined ? null : toHiragana(grey) };
}

/** The guesses in an answer, `size` kana each, or null when it is not whole hiragana guesses. */
export function decodeKanaGuesses(answer: string, size: number): string[] | null {
  const kana = [...answer];
  if (kana.length === 0 || kana.length % size !== 0 || !/^[ぁ-ゖー]+$/u.test(answer)) return null;
  return Array.from({ length: kana.length / size }, (_, at) => kana.slice(at * size, at * size + size).join(""));
}

/**
 * A 32-bit FNV-1a of a seed and a word. A puzzle takes the word with the
 * lowest, so that when the monthly refresh adds or drops words, a seed keeps
 * its word unless that very word went or a new one undercut it — a kept run
 * and today's word do not change under a player.
 */
function hash(seed: number, word: string): number {
  let value = 0x811c9dc5;
  for (const char of `${seed}:${word}`) {
    value ^= char.codePointAt(0)!;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

function lowest(seed: number, words: Iterable<string>, fits: (word: string) => boolean = () => true): string | null {
  let best: string | null = null;
  let bestHash = Infinity;
  for (const word of words) {
    if (!fits(word)) continue;
    const value = hash(seed, word);
    if (value < bestHash || (value === bestHash && best !== null && word < best)) {
      best = word;
      bestHash = value;
    }
  }
  return best;
}

/** The word a seed hides: easy from the commonest 900, medium and hard from the commonest 2,000. */
export function kanaWordFor(words: KanaWords, easy: boolean, seed: number): string {
  const word = lowest(seed, easy ? words.easy : words.answers);
  if (word === null) throw new Error("An empty kana list.");
  return word;
}

/**
 * The free first row (John, 2026-09-25: "a REAL word that is completely
 * grey"): a word every place of which is grey against the hidden one. Drawn
 * from the answers first, so it is a word a player knows, then from every
 * word; null in the rare case none fits.
 */
export function greyWordFor(words: KanaWords, word: string, seed: number): string | null {
  const target = [...word];
  const allGrey = (candidate: string) => markKanaGuess([...candidate], target).every((each) => each.mark === "miss");
  return lowest(seed, words.answers, allGrey) ?? lowest(seed, words.allowed, allGrey);
}

/**
 * Hard: every kana found must be played again — a plain green in its place,
 * and any kana found another way (orange, or green with an arrow) somewhere,
 * in any size or mark, since its size or mark was the thing it had wrong.
 */
export function breaksKanaHardRule(guesses: readonly string[], word: string, guess: string): string | null {
  const target = [...word];
  const next = [...guess];
  for (const previous of guesses) {
    const kana = [...previous];
    const marks = markKanaGuess(kana, target);
    for (const [at, mark] of marks.entries()) {
      const plain = mark.mark === "hit" && !mark.wrongSize && !mark.wrongMark;
      if (plain && next[at] !== kana[at]) return `${kana[at]} must stay in place ${at + 1}`;
      if (!plain && (mark.mark === "hit" || mark.mark === "near") && !next.some((each) => kanaBase(each) === kanaBase(kana[at]!))) return `${kana[at]} must be used`;
    }
  }
  return null;
}
