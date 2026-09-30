import type { Puzzle, PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";
import { dailyManyWordsOfSeed, dailyWordOfSeed } from "../dailyWords/dailyPools";
import { encodeWordsGivens } from "./futago";
import { wordCountOfSeed } from "./wordsSeed";
import { answersFor, encodeHidden, type GomojiLanguage } from "./code";
import { pinDown } from "./dodge";
import { dodgeGuesses, dodgeMarkerOf, dodgePool, dodgeSample } from "./dodgePlay";
import { encodeDodgeGivens, isDodgeSeed, offersDodge } from "./dodgeSeed";

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
 * (`yotsugoSeed.ts`) hides four the same way.
 */
export function generateGomoji(size: number, level: PuzzleLevel, seed: number, lang: GomojiLanguage = "en", kind: PuzzleKind = "gomoji"): Puzzle {
  if (offersDodge(kind) && isDodgeSeed(seed)) return generateDodge(kind, size, level, seed);
  const words = answersFor(size, level === "easy", lang);
  if (words.length === 0) throw new Error(`No ${size}-letter words.`);
  const count = wordCountOfSeed(seed);
  if (count > 1) {
    const drawn = dailyManyWordsOfSeed(kind, size, seed) ?? drawSeveral(words, count, seed);
    // Found when every one is, in the order of the boards (`futago.ts`, `yotsugo.ts`).
    return { kind, size, level, seed, givens: encodeWordsGivens(drawn), solution: drawn.join("") };
  }
  const word = dailyWordOfSeed(kind, size, seed) ?? words[Math.floor(seededRandom(seed)() * words.length)]!;
  return { kind, size, level, seed, givens: encodeHidden(word), solution: word };
}

/**
 * Different words from a list, the seed deciding which: each drawn from the
 * words not yet taken. For two, exactly the draw a Futago has always made,
 * so no kept Futago changes its words.
 */
function drawSeveral(words: readonly string[], count: number, seed: number): string[] {
  const random = seededRandom(seed);
  const taken: number[] = [];
  for (let at = 0; at < count; at += 1) {
    let pick = Math.floor(random() * (words.length - at));
    // Step over the places already taken, lowest first, so the draw lands on the pick-th word still free.
    for (const place of [...taken].sort((a, b) => a - b)) if (pick >= place) pick += 1;
    taken.push(pick);
  }
  return taken.map((place) => words[place]!);
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
  const most = dodgeGuesses(kind, size);
  const way = pinDown(pool, seed, mark, greens, most, dodgeSample(kind)) ?? pinDown(pool, seed, mark, greens, most, 4 * dodgeSample(kind));
  if (way === null) throw new Error(`No way found to pin down dodger ${seed} at ${size} ${level}.`);
  return { kind, size, level, seed, givens: encodeDodgeGivens(seed), solution: way.join("") };
}
