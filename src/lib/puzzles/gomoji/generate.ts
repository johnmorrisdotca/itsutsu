import type { Puzzle, PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";
import { dailyManyWordsOfSeed, dailyWordOfSeed } from "../dailyWords/dailyPools";
import { encodeWordsGivens } from "./futago";
import { wordCountOfSeed } from "./wordsSeed";
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
 * (`yotsugoSeed.ts`) hides four the same way.
 */
export function generateGomoji(size: number, level: PuzzleLevel, seed: number, lang: GomojiLanguage = "en", kind: PuzzleKind = "gomoji"): Puzzle {
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
