/**
 * The vocabulary of the puzzles: one solver, no turns, no colours.
 *
 * Kept apart from `gomoku.types.ts` on purpose. A puzzle is not a rule
 * variant — the engine cannot play it, the simulator cannot finish it and
 * nobody stands on a ladder for it — so it has a kind of its own, and the
 * catalogue joins the two through `GameKey` (`lib/catalogue/gameKeys.ts`)
 * rather than by stretching either.
 */

export type PuzzleKind = "numberPlace" | "hiddenStones" | "moreOrLess";

/** How hard a puzzle was made: by what the solver needed to finish it, never by a count of givens alone. */
export type PuzzleLevel = "easy" | "medium" | "hard";

export type PuzzleSpec = {
  /** The sides a puzzle of this kind is made at, smallest first. */
  sizes: readonly number[];
  /** The side the set-up opens on. */
  defaultSize: number;
  /** The levels the set-up offers; a kind with one kind of reasoning offers fewer. */
  levels: readonly PuzzleLevel[];
  /** The level the set-up opens on. */
  defaultLevel: PuzzleLevel;
  /** The most cells a solve may hold, for the address and the route to refuse anything larger. */
  mostCells: number;
};

/**
 * One puzzle, made in a browser from a seed, or read back from a string.
 *
 * `givens` and `solution` are the strings `puzzleCode.ts` writes: row-major
 * cells, one character each. `solution` is the whole grid; it never leaves
 * the browser that made it except to the route that keeps a race.
 */
export type Puzzle = {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  seed: number;
  givens: string;
  solution: string;
};

/** The verdict on a submitted answer, from the one O(cells) check the server also runs. */
export type PuzzleCheck = { ok: true } | { ok: false; reason: string };
