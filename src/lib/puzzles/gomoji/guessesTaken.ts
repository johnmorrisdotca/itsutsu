import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { decodeKanaGivens, decodeKanaGuesses } from "../gomojiKana/kanaCode";
import { decodeGuesses, languageOf } from "./code";
import { guessesFor } from "./layout";
import { swapsTaken } from "../koushi/check";

/** How many guesses a word took, out of how many the level gave: 3 of 6. */
export type GuessesTaken = {
  used: number;
  allowed: number;
  /** What was counted, where it was not guesses: a Koushi counts its swaps, 11/15. */
  unit?: "swaps";
};

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
  const at = level as PuzzleLevel;
  if (kind === "gomojiKana") {
    const guesses = decodeKanaGuesses(answer, size);
    const given = decodeKanaGivens(givens, size);
    if (guesses === null || given === null) return null;
    return { used: guesses.length, allowed: guessesFor("gomojiKana", size, at, given.grey === null ? 0 : 1) };
  }
  if (kind === "gomoji" || kind === "gomojiMot" || kind === "gomojiWort") {
    const guesses = decodeGuesses(answer, size, languageOf(kind));
    if (guesses === null) return null;
    // Mot and Wort are laid out as English is.
    return { used: guesses.length, allowed: guessesFor("gomoji", size, at, 0) };
  }
  if (kind === "koushi") {
    const taken = swapsTaken(level, givens, answer);
    return taken === null ? null : { ...taken, unit: "swaps" };
  }
  return null;
}

/** "3/6", as a board prints it. */
export function guessesText(taken: GuessesTaken): string {
  return `${taken.used}/${taken.allowed}`;
}
