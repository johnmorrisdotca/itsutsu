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
export function puzzleOutcome(kind: PuzzleKind, solved: boolean, clocked: boolean, taken: GuessesTaken | null): PuzzleOutcome {
  if (solved) return { words: CARD_PUZZLES.has(kind) ? "Won" : WORD_PUZZLES.has(kind) ? "Found" : "Solved", mark: "success" };
  const rowsLeft = taken !== null && taken.unit !== "moves" && taken.used < taken.allowed;
  if (clocked && !CARD_PUZZLES.has(kind) && (taken === null || rowsLeft)) return { words: "Out of time", mark: "failure" };
  // A word ends unsolved only when its rows or its clock run out, so with no clock it was the rows.
  if (WORD_PUZZLES.has(kind) || (taken !== null && taken.unit !== "moves")) return { words: taken?.unit === "swaps" ? "Out of swaps" : "Out of guesses", mark: "failure" };
  return { words: "Given up", mark: "failure" };
}

/**
 * WHAT A PUZZLE'S SIZE IS CALLED, for the facts box and the fastest times: a
 * Solitaire's draw, a Mahjong's layout, a word's length, a Kumimoji's hand,
 * Koushi's lattice, FreeCell's free cells and Spider's suits. "Size" was
 * printed over all of them, and "Fastest at this size" said nothing about a
 * card game.
 */
export function puzzleSizeLabel(kind: PuzzleKind): string {
  if (kind === "solitaire") return "Draw";
  if (kind === "freecell") return "Free cells";
  if (kind === "spider") return "Suits";
  if (kind === "mahjong") return "Layout";
  if (WORD_PUZZLES.has(kind)) return "Length";
  if (kind === "kumimoji") return "Hand";
  if (kind === "koushi") return "Lattice";
  return "Size";
}
