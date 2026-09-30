import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { encodeKanaGivens, greyWordFor, kanaWordFor, otherKanaWordFor } from "./kanaCode";
import { encodeKanaWordsGivens } from "../gomoji/futago";
import { wordCountOfSeed } from "../gomoji/wordsSeed";
import { kanaWordsOf } from "./kanaWords";
import { dailyManyWordsOfSeed, dailyWordOfSeed } from "../dailyWords/dailyPools";
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
  /* A Futago's two words (`futago.ts`) or a Yotsugo's four (`yotsugo.ts`), and a free grey word grey against every one of them. */
  const count = wordCountOfSeed(seed);
  if (count > 1) {
    const easy = level === "easy";
    const drawn = dailyManyWordsOfSeed("gomojiKana", size, seed) ?? drawSeveral(count, (taken) => (taken.length === 0 ? kanaWordFor(words, easy, seed) : otherKanaWordFor(words, easy, seed, taken)));
    const grey = level === "hard" ? null : greyWordFor(words, drawn, seed);
    return { kind: "gomojiKana", size, level, seed, givens: encodeKanaWordsGivens(drawn, grey), solution: drawn.join("") };
  }
  const word = dailyWordOfSeed("gomojiKana", size, seed) ?? kanaWordFor(words, level === "easy", seed);
  const grey = level === "hard" ? null : greyWordFor(words, word, seed);
  return { kind: "gomojiKana", size, level, seed, givens: encodeKanaGivens(word, grey), solution: word };
}

/** Several different words, each the next the seed would hide past the ones already taken. */
function drawSeveral(count: number, next: (taken: readonly string[]) => string): string[] {
  const taken: string[] = [];
  while (taken.length < count) taken.push(next(taken));
  return taken;
}
