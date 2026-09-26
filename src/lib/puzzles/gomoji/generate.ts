import type { Puzzle, PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";
import { dailyWordOfSeed } from "../dailyWords/dailyPools";
import { kanaWordsOf } from "../gomojiKana/kanaWords";
import { encodeKanaGivens } from "../gomojiKana/kanaCode";
import { answersFor, encodeHidden, languageOf, type GomojiLanguage } from "./code";
import { backwardsGuesses, survive } from "./backwards";
import { encodeBackwardsGivens, isBackwardsSeed } from "./backwardsSeed";

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
 */
export function generateGomoji(size: number, level: PuzzleLevel, seed: number, lang: GomojiLanguage = "en", kind: PuzzleKind = "gomoji"): Puzzle {
  if (isBackwardsSeed(seed)) return generateBackwards(kind, size, level, seed);
  const words = answersFor(size, level === "easy", lang);
  if (words.length === 0) throw new Error(`No ${size}-letter words.`);
  const word = dailyWordOfSeed(kind, size, seed) ?? words[Math.floor(seededRandom(seed)() * words.length)]!;
  return { kind, size, level, seed, givens: encodeHidden(word), solution: word };
}

/**
 * A GOMOJI SAKASA 逆さ, played backwards (`backwards.ts`), from a seed in its
 * block: a word drawn from the level's list — never a day's word, which a
 * Sakasa would give away — and, as its solution, a way through every row
 * without it (`survive`). No free grey word in kana: a Sakasa is all grey
 * words. A word with no way through is passed over for the next the seed
 * draws; thrown, never guessed at, if a dozen have none; the tests hold
 * that one always is.
 */
export function generateBackwards(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number): Puzzle {
  const easy = level === "easy";
  const rows = backwardsGuesses(kind, size, level);
  const random = seededRandom(seed);
  const words = kind === "gomojiKana" ? (easy ? kanaWordsOf(size).easy : kanaWordsOf(size).answers) : answersFor(size, easy, languageOf(kind));
  if (words.length === 0) throw new Error(`No ${size}-letter words.`);
  // A word with no way through is no puzzle: the next the seed draws is tried, the same in every browser.
  for (let tries = 0; tries < 12; tries += 1) {
    const word = words[Math.floor(random() * words.length)]!;
    const way = survive(kind, size, word, rows, seed + tries) ?? survive(kind, size, word, rows, seed + tries, 240);
    if (way === null) continue;
    const givens = kind === "gomojiKana" ? encodeKanaGivens(word, null) : encodeHidden(word);
    return { kind, size, level, seed, givens: encodeBackwardsGivens(seed, givens), solution: way.join("") };
  }
  throw new Error(`No way through a ${kind} Sakasa at ${seed}.`);
}
