import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { decodeKanaGivens } from "../gomojiKana/kanaCode";
import { decodeHidden, languageOf } from "./code";
import { backwardsGuesses } from "./backwardsRows";
import { guessesFor } from "./layout";
import { innerBackwardsGivens, isBackwardsGivens } from "./backwardsSeed";

/**
 * THE WORD AND THE ROWS OF A GOMOJI, WHICHEVER WAY IT IS PLAYED: an ordinary
 * one's givens, or a Sakasa's (`backwardsSeed.ts`), which carry the same word
 * behind a mark. The questions every page that draws, scores or names a
 * finished word asks, so none of them has to know one way from the other.
 */

/** The hidden word, as the lists write it, or null for givens that are not a word of this kind and size. */
export function hiddenOfPlay(kind: PuzzleKind, size: number, givens: string): string | null {
  const inner = innerBackwardsGivens(givens) ?? givens;
  if (kind === "gomojiKana") return decodeKanaGivens(inner, size)?.word ?? null;
  return decodeHidden(inner, size, languageOf(kind));
}

/** A kana word's free grey word, which a Sakasa never has. */
export function greyOfPlay(size: number, givens: string): string | null {
  return isBackwardsGivens(givens) ? null : (decodeKanaGivens(givens, size)?.grey ?? null);
}

/** How many rows a Gomoji played this way has: a Sakasa's (`backwardsGuesses`), or the level's guesses, a kana word's free grey word taken off. */
export function rowsOfPlay(kind: PuzzleKind, size: number, level: PuzzleLevel, givens: string): number {
  if (isBackwardsGivens(givens)) return backwardsGuesses(kind, size, level);
  if (kind === "gomojiKana") return guessesFor("gomojiKana", size, level, greyOfPlay(size, givens) === null ? 0 : 1);
  return guessesFor("gomoji", size, level, 0);
}
