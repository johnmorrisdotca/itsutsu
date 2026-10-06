import { speaker, type Speaker } from "../i18n/i18n";
import { DEFAULT_LOCALE } from "../i18n/i18n.constants";

import type { GuessesTaken } from "./gomoji/guessesTaken";
import type { PuzzleKind } from "./puzzles.types";

/** How a kept puzzle ended, in the words its page says and the mark beside them (`ResultMark`). */
export type PuzzleOutcome = { words: string; mark: "success" | "failure" };

/** The puzzles that are card games: won or given up, never "solved" or "not found". */
const CARD_PUZZLES: ReadonlySet<PuzzleKind> = new Set<PuzzleKind>(["solitaire", "freecell", "spider"]);

/** The word puzzles, which find a word rather than solve a grid. */
const WORD_PUZZLES: ReadonlySet<PuzzleKind> = new Set<PuzzleKind>(["gomoji", "gomojiKana", "gomojiMot", "gomojiWort", "gomojiPop"]);

/**
 * HOW ONE PUZZLE ENDED, WORKED OUT ONCE. The finished puzzle's page said
 * "Not found" for a Solitaire somebody gave up, because the words were chosen
 * for a Gomoji and the Solitaire fell through to them. Each ending is named
 * for what happened:
 *
 * - solved: "Won" for a card game, "Found" for a word, "Solved" for a grid;
 * - a countdown that ran out with rows to spare, or on a grid: "Out of time";
 * - a word otherwise: its rows ran out, "Out of guesses" ("Out of swaps" for Koushi);
 * - anything else left unsolved: "Given up".
 */
export function puzzleOutcome(kind: PuzzleKind, solved: boolean, clocked: boolean, taken: GuessesTaken | null, say: Speaker = speaker(DEFAULT_LOCALE)): PuzzleOutcome {
  if (solved) return { words: say.say(CARD_PUZZLES.has(kind) ? "puzzle.outcome.won" : WORD_PUZZLES.has(kind) ? "puzzle.outcome.found" : "puzzle.outcome.solved"), mark: "success" };
  const rowsLeft = taken !== null && taken.unit !== "moves" && taken.used < taken.allowed;
  if (clocked && !CARD_PUZZLES.has(kind) && (taken === null || rowsLeft)) return { words: say.say("puzzle.outcome.outOfTime"), mark: "failure" };
  // A word ends unsolved only when its rows or its clock run out, so with no clock it was the rows.
  if (WORD_PUZZLES.has(kind) || (taken !== null && taken.unit !== "moves")) return { words: say.say(taken?.unit === "swaps" ? "puzzle.outcome.outOfSwaps" : "puzzle.outcome.outOfGuesses"), mark: "failure" };
  return { words: say.say("puzzle.outcome.givenUp"), mark: "failure" };
}

/**
 * WHAT A PUZZLE'S SIZE IS CALLED, for the facts box and the fastest times: a
 * Solitaire's draw, a Mahjong's layout, a word's length, a Kumimoji's hand,
 * Koushi's lattice, FreeCell's free cells and Spider's suits. "Size" was
 * printed over all of them, and "Fastest at this size" said nothing about a
 * card game.
 */
export function puzzleSizeLabel(kind: PuzzleKind, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  if (kind === "solitaire") return say.say("puzzle.sizeLabel.draw");
  if (kind === "freecell") return say.say("puzzle.sizeLabel.freeCells");
  if (kind === "spider") return say.say("puzzle.sizeLabel.suits");
  if (kind === "mahjong") return say.say("puzzle.sizeLabel.layout");
  if (WORD_PUZZLES.has(kind)) return say.say("puzzle.sizeLabel.length");
  if (kind === "kumimoji") return say.say("puzzle.sizeLabel.hand");
  if (kind === "koushi") return say.say("puzzle.sizeLabel.lattice");
  return say.say("puzzle.sizeLabel.size");
}
