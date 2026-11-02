import { no } from "@/lib/puzzles/puzzleReasons";

import type { PuzzleCheck } from "../puzzles.types";
import { KUNIATE_GUESS_COUNT, readGuesses, readQuestion } from "./code";

/**
 * Whether a game of Kuniate ended as it says it did: the guesses are places on the
 * list, none twice, no more than a game gives, and either the last of them is the
 * hidden country and none before it ("found"), or every guess is spent without it
 * ("spent"). The check the browser makes and the server makes before it pays.
 */
export function checkKuniate(size: number, givens: string, answer: string, ending: "found" | "spent"): PuzzleCheck {
  const hidden = readQuestion(givens, size);
  if (hidden === null) return no("chk.kuniate.notQuestion");
  const guesses = readGuesses(answer);
  if (guesses === null || guesses.length === 0) return no("chk.kuniate.notGuesses");
  const found = guesses.indexOf(hidden);
  if (ending === "found") {
    if (found === -1) return no("chk.kuniate.notFound");
    return found === guesses.length - 1 ? { ok: true } : no("chk.kuniate.goesOn");
  }
  if (found !== -1) return no("chk.kuniate.wasFound");
  return guesses.length === KUNIATE_GUESS_COUNT ? { ok: true } : no("chk.kuniate.guessesLeft");
}
