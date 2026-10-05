import type { PuzzleCheck, PuzzleLevel } from "../puzzles.types";

/**
 * THE PENCIL PUZZLES: grid puzzles drawn and written on in pencil, made,
 * solved and checked by Kazu (`@johnmorrisdotca/kazu`, github.com/johnmorrisdotca/kazu).
 * Kazu's Slitherlink is the site's Loop (`loop`); each is a `PuzzleKind` of its own; this is the one shape they all share, so
 * the solve screen, the server's check and the finished page are written once.
 */
export type PencilKind = "shikaku" | "akari" | "loop" | "hitori" | "crossSums" | "regions";

/** A puzzle as the site keeps it: the board a reader sees, and the answer it has. */
export type PencilMade = { givens: string; solution: string };

/**
 * WHAT A PENCIL PUZZLE IS TO THE SITE. A puzzle is its kind, size, level and
 * seed; its `givens` are the board in a short string, and what a reader writes
 * on it is a CODE of one character per mark place, `codeLength` long, so a kept
 * run, a step log and a replay need to know nothing of the kind. The code of an
 * untouched board is `blank`, and the code of the answer is the puzzle's
 * `solution`, which is also what is handed in.
 *
 * Nothing here draws: this module is read by the server's check. Drawing is
 * `components/puzzles/pencil/`.
 */
export type PencilEngine = {
  /** How many characters a code of this size has: a mark place each. */
  codeLength(size: number): number;
  /** A puzzle from a seed, with exactly one answer. Throws for a size the kind does not make. */
  make(size: number, level: PuzzleLevel, seed: number): PencilMade;
  /** Whether the givens are a board of this size. */
  reads(size: number, givens: string): boolean;
  /** The code of a board with nothing written on it. */
  blank(size: number, givens: string): string;
  /** Whether a code could have been written on a board of this size (its shape alone; the givens are not asked). */
  fits(size: number, code: string): boolean;
  /** Whether an answer solves the board: the rules, restated by the package, in O(cells) and with no search. */
  check(size: number, givens: string, answer: string): PuzzleCheck;
  /** The one answer the givens allow as a code, or null for none, more than one, or a search that did not finish. */
  solve(size: number, givens: string): string | null;
  /** The mark places a code has marked that the answer does not have. */
  wrong(size: number, code: string, solution: string): number[];
  /** How many marks of the answer a code does not have yet. */
  missing(size: number, code: string, solution: string): number;
  /** The code after one right mark: the next one the answer has, else one wrong mark taken away; null when nothing is left to do. `at` is a mark place to point at. */
  fix(size: number, code: string, solution: string): { code: string; at: number } | null;
  /** The cells a solve is worth by (`cellsFilled`): the work in a board, from its givens. */
  work(size: number, givens: string): number;
};
