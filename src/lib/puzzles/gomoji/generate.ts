import type { Puzzle, PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";
import { dailyWordOfSeed } from "../dailyWords/dailyPools";
import { answersFor, encodeHidden, type GomojiLanguage } from "./code";
import { pinDown } from "./dodge";
import { dodgeGuesses, dodgeMarkerOf, dodgePool, dodgeSample } from "./dodgePlay";
import { encodeDodgeGivens, isDodgeSeed } from "./dodgeSeed";

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
  if (isDodgeSeed(seed)) return generateDodge(kind, size, level, seed);
  const words = answersFor(size, level === "easy", lang);
  if (words.length === 0) throw new Error(`No ${size}-letter words.`);
  const word = dailyWordOfSeed(kind, size, seed) ?? words[Math.floor(seededRandom(seed)() * words.length)]!;
  return { kind, size, level, seed, givens: encodeHidden(word), solution: word };
}

/**
 * A GOMOJI NIGE 逃げ (`dodge.ts`), in any language, the kana one included:
 * nothing hidden, so its givens are only the seed that breaks its ties
 * (`encodeDodgeGivens`), and its solution is a way to pin it down inside the
 * guesses its level gives (`pinDown`), which proves one exists. A seed the
 * sample cannot pin down in time is tried again with a wider sample; the
 * tests hold every language and length to finishing on the first.
 */
export function generateDodge(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number): Puzzle {
  const pool = dodgePool(kind, size, level);
  if (pool.length === 0) throw new Error(`No ${size}-letter words.`);
  const { mark, greens } = dodgeMarkerOf(kind);
  const most = dodgeGuesses(kind, size, level);
  const way = pinDown(pool, seed, mark, greens, most, dodgeSample(kind)) ?? pinDown(pool, seed, mark, greens, most, 4 * dodgeSample(kind));
  if (way === null) throw new Error(`No way found to pin down dodger ${seed} at ${size} ${level}.`);
  return { kind, size, level, seed, givens: encodeDodgeGivens(seed), solution: way.join("") };
}
