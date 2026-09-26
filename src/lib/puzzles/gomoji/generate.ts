import type { Puzzle, PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";
import { dailyFutagoWordsOfSeed, dailyWordOfSeed, dailyYotsugoWordsOfSeed } from "../dailyWords/dailyPools";
import { encodeFutagoGivens } from "./futago";
import { isFutagoSeed } from "./futagoSeed";
import { isYotsugoSeed } from "./yotsugoSeed";
import { answersFor, encodeHidden, type GomojiLanguage } from "./code";

/**
 * Making a Gomoji puzzle, in the browser, from a seed: one word, drawn
 * from the level's list. Easy draws from the commonest words; medium and
 * hard from the wider list, and hard adds the rule that every letter found
 * must be used again (`breaksHardRule`). There is nothing to carve and
 * nothing to prove unique — a word is its own one answer.
 *
 * Deterministic in the seed, like every generator here, so two browsers in a
 * race, or one browser tomorrow, draw the same word.
 *
 * One generator for all three languages — English, French (Gomoji Mot) and
 * German (Gomoji Wort) — since a word puzzle is the same puzzle whatever list
 * it draws from; only the list and the kind it is stamped with change.
 *
 * A DAY'S SEED (`dailyWordSeed`) hides that day's word instead, at any level:
 * the word everybody meets today, drawn from its frozen pool
 * (`dailyWords/`), never from the live list.
 *
 * A FUTAGO'S SEED (`futagoSeed.ts`) hides two words, never one twice: two
 * drawn from the level's list, or a day's two from the pool. A YOTSUGO'S
 * (`yotsugoSeed.ts`) hides four, all different, the same two ways.
 */
export function generateGomoji(size: number, level: PuzzleLevel, seed: number, lang: GomojiLanguage = "en", kind: PuzzleKind = "gomoji"): Puzzle {
  const words = answersFor(size, level === "easy", lang);
  if (words.length === 0) throw new Error(`No ${size}-letter words.`);
  if (isYotsugoSeed(seed)) {
    const four = dailyYotsugoWordsOfSeed(kind, size, seed) ?? drawDifferent(words, seed, 4);
    return { kind, size, level, seed, givens: encodeFutagoGivens(four), solution: four.join("") };
  }
  if (isFutagoSeed(seed)) {
    const pair = dailyFutagoWordsOfSeed(kind, size, seed) ?? drawTwo(words, seed);
    // Found when both are: the first guessed, then the second (`futago.ts`).
    return { kind, size, level, seed, givens: encodeFutagoGivens(pair), solution: pair.join("") };
  }
  const word = dailyWordOfSeed(kind, size, seed) ?? words[Math.floor(seededRandom(seed)() * words.length)]!;
  return { kind, size, level, seed, givens: encodeHidden(word), solution: word };
}

/** Two different words from a list, the seed deciding which. */
function drawTwo(words: readonly string[], seed: number): [string, string] {
  const random = seededRandom(seed);
  const first = Math.floor(random() * words.length);
  const second = Math.floor(random() * (words.length - 1));
  return [words[first]!, words[second >= first ? second + 1 : second]!];
}

/** A number of different words from a list, the seed deciding which: a Yotsugo's four. */
function drawDifferent(words: readonly string[], seed: number, count: number): string[] {
  if (words.length < count) throw new Error(`Fewer than ${count} words.`);
  const random = seededRandom(seed);
  const drawn: string[] = [];
  while (drawn.length < count) {
    const word = words[Math.floor(random() * words.length)]!;
    if (!drawn.includes(word)) drawn.push(word);
  }
  return drawn;
}
