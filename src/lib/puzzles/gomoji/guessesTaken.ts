import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { formerWordRowsOf, guessesOf, hiddenWordsOf, wordRowsOf } from "./futago";
import { swapsTaken } from "../koushi/check";
import { decodeMoves } from "@johnmorrisdotca/toranpu/klondike";
import { decodeMoves as decodeFreeCellMoves } from "@johnmorrisdotca/toranpu/freecell";
import { decodeMoves as decodeSpiderMoves } from "@johnmorrisdotca/toranpu/spider";
import { dodgeGuesses } from "./dodgePlay";
import { isDodgeGivens } from "./dodgeSeed";
import { backwardsGuesses } from "./backwardsRows";
import { isBackwardsGivens } from "./backwardsSeed";

/** How many guesses a word took, out of how many the level gave: 3 of 6. */
export type GuessesTaken = {
  used: number;
  allowed: number;
  /**
   * What was counted, where it was not guesses: a Koushi counts its swaps,
   * 11/15, and a Solitaire its moves, which have no allowance to be out of.
   */
  unit?: "swaps" | "moves";
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
  // A won Solitaire's moves, every one standing: the other half of how it went, as a word's guesses are.
  if (kind === "solitaire" || kind === "freecell" || kind === "spider") {
    const moves = kind === "solitaire" ? decodeMoves(answer) : kind === "freecell" ? decodeFreeCellMoves(answer) : decodeSpiderMoves(answer);
    return moves === null ? null : { used: moves.length, allowed: 0, unit: "moves" };
  }
  if (kind === "koushi") {
    const taken = swapsTaken(level, givens, answer);
    return taken === null ? null : { ...taken, unit: "swaps" };
  }
  if (kind !== "gomoji" && kind !== "gomojiKana" && kind !== "gomojiMot" && kind !== "gomojiWort" && kind !== "gomojiPop") return null;
  // A Sakasa's rows are its own (`backwards.ts`): the count to get through, the levels the other way round.
  if (isBackwardsGivens(givens)) {
    const guesses = guessesOf(kind, size, answer);
    return guesses === null ? null : { used: guesses.length, allowed: backwardsGuesses(kind, size, level as PuzzleLevel) };
  }
  // A dodger gives its own count (`dodgeGuesses`), in kana as in letters.
  if (isDodgeGivens(givens)) {
    const guesses = guessesOf(kind, size, answer);
    return guesses === null ? null : { used: guesses.length, allowed: dodgeGuesses(kind, size) };
  }
  // A Futago's allowance is its own, a guess more than one word's (`futago.ts`); a kana puzzle's free grey word takes a row and is no guess.
  const hidden = hiddenWordsOf(kind, size, givens);
  const guesses = guessesOf(kind, size, answer);
  if (hidden === null || guesses === null) return null;
  // A solve made under the larger count before 2026-09-28 says that count, never "9/8".
  const today = wordRowsOf(kind, size, level as PuzzleLevel, hidden);
  const allowed = guesses.length > today ? Math.max(guesses.length, formerWordRowsOf(kind, size, level as PuzzleLevel, hidden)) : today;
  return { used: guesses.length, allowed };
}

/** "3/6", as a board prints it. */
export function guessesText(taken: GuessesTaken): string {
  // Moves have no allowance: "143", not "143/0".
  if (taken.unit === "moves") return String(taken.used);
  return `${taken.used}/${taken.allowed}`;
}
