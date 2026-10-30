import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import { speaker } from "@/lib/i18n/i18n";

import type { PuzzleCheck } from "../puzzles.types";
import { KUNIATE_GUESS_COUNT, readGuesses, readQuestion } from "./code";

/** What the route answers with: the site's own English, as every refusal from it is. */
const refused = (reason: Parameters<ReturnType<typeof speaker>["say"]>[0]): PuzzleCheck => ({ ok: false, reason: speaker(DEFAULT_LOCALE).say(reason) });

/**
 * Whether a game of Kuniate ended as it says it did: the guesses are places on the
 * list, none twice, no more than a game gives, and either the last of them is the
 * hidden country and none before it ("found"), or every guess is spent without it
 * ("spent"). The check the browser makes and the server makes before it pays.
 */
export function checkKuniate(size: number, givens: string, answer: string, ending: "found" | "spent"): PuzzleCheck {
  const hidden = readQuestion(givens, size);
  if (hidden === null) return refused("pword.kuniate.refuse.notQuestion");
  const guesses = readGuesses(answer);
  if (guesses === null || guesses.length === 0) return refused("pword.kuniate.refuse.notGuesses");
  const found = guesses.indexOf(hidden);
  if (ending === "found") {
    if (found === -1) return refused("pword.kuniate.refuse.notFound");
    return found === guesses.length - 1 ? { ok: true } : refused("pword.kuniate.refuse.goesOn");
  }
  if (found !== -1) return refused("pword.kuniate.refuse.wasFound");
  return guesses.length === KUNIATE_GUESS_COUNT ? { ok: true } : refused("pword.kuniate.refuse.guessesLeft");
}
