import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";
import { answersFor, encodeHidden } from "./code";

/**
 * Making a WordDrop puzzle, in the browser, from a seed: one word, drawn
 * from the level's list. Easy draws from the commonest words; medium and
 * hard from the wider list, and hard adds the rule that every letter found
 * must be used again (`breaksHardRule`). There is nothing to carve and
 * nothing to prove unique — a word is its own one answer.
 *
 * Deterministic in the seed, like every generator here, so two browsers in a
 * race, or one browser tomorrow, draw the same word.
 */
export function generateWordDrop(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const words = answersFor(size, level === "easy");
  if (words.length === 0) throw new Error(`No ${size}-letter words.`);
  const word = words[Math.floor(seededRandom(seed)() * words.length)]!;
  return { kind: "wordDrop", size, level, seed, givens: encodeHidden(word), solution: word };
}
