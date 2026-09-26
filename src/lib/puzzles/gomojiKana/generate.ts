import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { encodeKanaGivens, greyWordFor, kanaWordFor, kanaWordsFor, otherKanaWordFor } from "./kanaCode";
import { encodeKanaFutagoGivens } from "../gomoji/futago";
import { isFutagoSeed } from "../gomoji/futagoSeed";
import { isYotsugoSeed } from "../gomoji/yotsugoSeed";
import { kanaWordsOf } from "./kanaWords";
import { dailyFutagoWordsOfSeed, dailyWordOfSeed, dailyYotsugoWordsOfSeed } from "../dailyWords/dailyPools";

/**
 * Making a kana Gomoji puzzle from a seed: the word, and on easy and medium
 * the free grey word it opens with. The list must have been loaded first
 * (`loadKanaWords`), which the solve page, the screenshot scene and the gate
 * each do before they ask; asked too early, it refuses rather than guessing.
 * A day's seed hides that day's word from its frozen pool (`dailyWords/`),
 * which `preparePuzzle` fetches with the list; its grey word is drawn as ever.
 */
export function generateGomojiKana(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const words = kanaWordsOf(size);
  /* A Yotsugo's four words (`yotsugo.ts`), the seed's word and the three it would hide next, and a free grey word grey against all four. */
  if (isYotsugoSeed(seed)) {
    const easy = level === "easy";
    const four = dailyYotsugoWordsOfSeed("gomojiKana", size, seed) ?? kanaWordsFor(words, easy, seed, 4);
    const grey = level === "hard" ? null : greyWordFor(words, four, seed);
    return { kind: "gomojiKana", size, level, seed, givens: encodeKanaFutagoGivens(four, grey), solution: four.join("") };
  }
  /* A Futago's two words (`futago.ts`), and a free grey word grey against both of them. */
  if (isFutagoSeed(seed)) {
    const easy = level === "easy";
    const first = kanaWordFor(words, easy, seed);
    const pair = dailyFutagoWordsOfSeed("gomojiKana", size, seed) ?? ([first, otherKanaWordFor(words, easy, seed, first)] as const);
    const grey = level === "hard" ? null : greyWordFor(words, pair, seed);
    return { kind: "gomojiKana", size, level, seed, givens: encodeKanaFutagoGivens(pair, grey), solution: pair.join("") };
  }
  const word = dailyWordOfSeed("gomojiKana", size, seed) ?? kanaWordFor(words, level === "easy", seed);
  const grey = level === "hard" ? null : greyWordFor(words, word, seed);
  return { kind: "gomojiKana", size, level, seed, givens: encodeKanaGivens(word, grey), solution: word };
}

