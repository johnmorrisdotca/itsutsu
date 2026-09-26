import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { encodeKanaGivens, greyWordFor, kanaWordFor } from "./kanaCode";
import { kanaWordsOf } from "./kanaWords";
import { dailyWordOfSeed } from "../dailyWords/dailyPools";
import { generateDodge } from "../gomoji/generate";
import { isDodgeSeed } from "../gomoji/dodgeSeed";

/**
 * Making a kana Gomoji puzzle from a seed: the word, and on easy and medium
 * the free grey word it opens with. The list must have been loaded first
 * (`loadKanaWords`), which the solve page, the screenshot scene and the gate
 * each do before they ask; asked too early, it refuses rather than guessing.
 * A day's seed hides that day's word from its frozen pool (`dailyWords/`),
 * which `preparePuzzle` fetches with the list; its grey word is drawn as ever.
 */
export function generateGomojiKana(size: number, level: PuzzleLevel, seed: number): Puzzle {
  // A dodger, in kana as in letters (`dodgePlay.ts`): nothing hidden, and no free grey word.
  if (isDodgeSeed(seed)) return generateDodge("gomojiKana", size, level, seed);
  const words = kanaWordsOf(size);
  const word = dailyWordOfSeed("gomojiKana", size, seed) ?? kanaWordFor(words, level === "easy", seed);
  const grey = level === "hard" ? null : greyWordFor(words, word, seed);
  return { kind: "gomojiKana", size, level, seed, givens: encodeKanaGivens(word, grey), solution: word };
}
