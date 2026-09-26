/**
 * The vocabulary of the puzzles: one solver, no turns, no colours.
 *
 * Kept apart from `gomoku.types.ts` on purpose. A puzzle is not a rule
 * variant — the engine cannot play it, the simulator cannot finish it and
 * nobody stands on a ladder for it — so it has a kind of its own, and the
 * catalogue joins the two through `GameKey` (`lib/catalogue/gameKeys.ts`)
 * rather than by stretching either.
 */

export type PuzzleKind =
  | "numberPlace"
  | "hiddenStones"
  | "moreOrLess"
  | "jigsaw"
  | "diagonal"
  | "sumCages"
  | "towers"
  | "blackAndWhite"
  | "gomoji"
  | "gomojiKana"
  | "gomojiMot"
  | "gomojiWort"
  | "tsunagi"
  | "kumimoji"
  | "koushi";

/** How hard a puzzle was made: by what the solver needed to finish it, never by a count of givens alone. */
export type PuzzleLevel = "easy" | "medium" | "hard";

export type PuzzleSpec = {
  /**
   * The sides a puzzle of this kind can be made and checked at, smallest first:
   * every size an address, a race or a kept solve may name.
   */
  sizes: readonly number[];
  /**
   * The sides the set-up screen offers, at most four and all of them in
   * `sizes`. John, 2026-09-24: "We need to plan for 4 boards with predictable
   * height." A size taken off the screen stays in `sizes`, so a race already
   * started at it can still be finished and a solve at it still counts.
   */
  offered: readonly number[];
  /** The side the set-up opens on. */
  defaultSize: number;
  /** The levels the set-up offers; a kind with one kind of reasoning offers fewer. */
  levels: readonly PuzzleLevel[];
  /**
   * The levels a size can be made at, where that is fewer than `levels`: a
   * 4×4 Hidden Stones has two possible answers and looking always tells them
   * apart, so it has no hard puzzle to make. Read through `levelsFor`.
   */
  levelsAt?: Readonly<Record<number, readonly PuzzleLevel[]>>;
  /** The level the set-up opens on. */
  defaultLevel: PuzzleLevel;
  /** The most characters a puzzle's code or answer may hold, for the route to refuse anything larger. */
  mostCells: number;
  /**
   * Whether Check and Hint are offered. Absent is yes. A word puzzle answers
   * every guess as it is made, so a Check would say what the colours already
   * say, and a Hint that marked wrong letters would do the same.
   */
  helps?: false;
  /**
   * Whether Strict is offered: every letter found must be played again, a
   * green in its place. A Gomoji's, at any level; absent is no.
   */
  strict?: true;
  /**
   * Whether the puzzle is drawn on the board itself, as a Gomoji's rows of
   * stones are, rather than on white paper inside the wood — and so whether
   * the board's colour is chosen for it (`FeltPatches`), as a Reversi's is.
   * Names the layout its rows follow (`gomojiLayout`); absent is paper.
   */
  wordGrid?: "gomoji" | "gomojiKana";
  /**
   * Drawn on the board itself in the board colour the player chooses, as a
   * Gomoji is, without a Gomoji's rows: Tsunagi's marbles and lines. Absent
   * is paper. `drawnOnBoard` asks this, `wordGrid` and `lattice`.
   */
  onBoard?: true;
  /**
   * Played as fixed levels, the same for everybody, chosen on a board of
   * levels rather than made from a seed: Tsunagi. The address's seed is the
   * level's number (`tsunagi/levels.ts`). Absent is a new puzzle each time.
   */
  fixedLevels?: true;
  /**
   * Whether the puzzle is a tile game (Kumimoji): its size is the hand it opens
   * with, not the side of a grid, and any sound grid of its tiles finishes it,
   * so it has many answers rather than one. Absent is a grid with one answer.
   */
  tiles?: true;
  /**
   * Whether the puzzle is played with stones, drawn as the game boards draw
   * theirs (`StoneMark`) in the reader's own stone set. Absent is no.
   */
  stones?: true;
  /**
   * Whether the puzzle is a lattice of letter tiles drawn on the board itself
   * in the reader's board colour, as Koushi's is: previewed and played on the
   * board with its colour patches, and never in a Gomoji's word styles.
   */
  lattice?: true;
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
