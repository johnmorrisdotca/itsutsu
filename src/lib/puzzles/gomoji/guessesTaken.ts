import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { guessesOf, hiddenWordsOf, wordRowsOf } from "./futago";

/** How many guesses a word took, out of how many the level gave: 3 of 6. */
export type GuessesTaken = { used: number; allowed: number };

/**
 * HOW MANY GUESSES A GOMOJI SOLVE TOOK, OUT OF HOW MANY IT HAD. John,
 * 2026-09-25: "The Gomoji leaderboards do not mention how many guesses a time
 * took... show a time but also the number (like 3/6 guesses, 4/7)." A word's
 * time says half of how it went; the other half is how few rows it needed.
 *
 * Read from what a solve keeps: its answer (the guesses run together) and its
 * givens (for kana, whether a free grey word took a row). The allowance is the
 * level's own (`guessesFor`), so easy's nine and hard's six read as they were
 * played. Null for any other puzzle, and for a solve kept without its answer,
 * which cannot say.
 */
export function guessesTaken(
  kind: PuzzleKind,
  size: number,
  level: string,
  givens: string,
  answer: string | null,
): GuessesTaken | null {
  if (answer === null) return null;
  if (kind !== "gomoji" && kind !== "gomojiKana" && kind !== "gomojiMot" && kind !== "gomojiWort") return null;
  // A Futago's allowance is its own, a guess more than one word's (`futago.ts`); a kana puzzle's free grey word takes a row and is no guess.
  const hidden = hiddenWordsOf(kind, size, givens);
  const guesses = guessesOf(kind, size, answer);
  if (hidden === null || guesses === null) return null;
  return { used: guesses.length, allowed: wordRowsOf(kind, size, level as PuzzleLevel, hidden) };
}

/** "3/6", as a board prints it. */
export function guessesText(taken: GuessesTaken): string {
  return `${taken.used}/${taken.allowed}`;
}
