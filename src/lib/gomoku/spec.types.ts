/**
 * The words a rule set is written in.
 *
 * `VariantSpec` (gomoku.types.ts) is a row of these: each is a closed set of
 * choices a game makes — where a stone lands, which edges join, what a line
 * must be, which shapes are forbidden, how the centre starts, and where the
 * stones sit when the game is drawn its own way. They live here rather than
 * with the spec because they depend on nothing — no stone, no point, no
 * state — and gomoku.types.ts is long enough holding the things that do.
 * It re-exports them, so they are still reached from there.
 */

/**
 * Where a stone goes when played. `free`: where it was put. `drop`: it slides
 * to the lowest empty cell of its column, as if the board were upright and
 * the stones were magnetic.
 */
export type Placement = "free" | "drop" | "edge";

/**
 * Where a game's stones sit when it is drawn the way it is traditionally
 * played: on the crossings of the lines, as in go and gomoku, or inside the
 * squares, as in tic-tac-toe, Othello and checkers.
 *
 * A fact about the game's custom, not its rules: the same points exist either
 * way, and the engine never reads it. It is on the spec all the same, because
 * it is a fact about the GAME, and the one thing a reader's own preference
 * cannot supply. Nothing infers it from the rules — tic-tac-toe and gomoku
 * have the same mechanics and are drawn differently by everybody who has ever
 * played them — so every row declares it, and a row that does not will not
 * compile.
 */
export type BoardGrid = "lines" | "cells";

/** Which edges of the board join up: a plane, a cylinder, or a torus. */
export type WrapMode = "none" | "columns" | "both";

/**
 * What a completed line has to look like to win.
 *
 * `atLeast`: `winLength` or longer.
 * `exact`: precisely `winLength`; an overline is not a win.
 * `exactOpen`: precisely `winLength`, and not shut in at both ends.
 */
export type LineRule = "atLeast" | "exact" | "exactOpen";

/** Shapes a colour may be forbidden from making. See `rules/forbidden.ts`. */
export type ForbiddenPattern = "doubleThree" | "doubleFour" | "overline";

/** How a flipping game begins: nothing, the fixed four, or four the players lay themselves. */
export type StartingDiscs = "none" | "fixed" | "laid";

/**
 * Which capture a checkers-family player may choose, when more than one is on offer.
 *
 * `free`: any of them. Capturing is still forced, and a sequence once begun is
 * still carried on while the same piece has another piece to take.
 * `maximum`: only a sequence that takes the most pieces available anywhere on
 * the board, men and kings counted alike — the majority rule of international
 * draughts and the games built on it.
 */
export type CaptureChoice = "free" | "maximum";

/**
 * What becomes of a man that reaches the far row in the middle of a capture.
 *
 * `stops`: it is crowned, and the move ends there, whatever else it could take.
 * `continues`: it is crowned at once, and goes on capturing as a king.
 * `passes`: it is not crowned while it has more to take. It carries on as a man,
 * and is crowned only if the move ends on the far row.
 */
export type CrownMidCapture = "stops" | "continues" | "passes";

/**
 * How one game of the checkers family is played, as data: the rows of men each
 * side sets out, which way a man may take, how far a king may travel, which
 * capture must be chosen, and what crowning does to a capture under way.
 *
 * Every one of these is a rule some published game differs on, and the engine
 * reads them here rather than asking which game it is playing.
 */
export type CheckersRules = {
  /*
   * The draw rules below are the game's OWN — the ones its federation writes
   * down — and sit beside the site-wide no-progress backstop in
   * rules/noProgress.ts rather than replacing it, which is where the "only
   * kings have moved" count already lives for every game of the family.
   */
  /** Rows of men each side starts with, on the dark squares of its own side of the board. */
  menRows: number;
  /** Whether a man may capture backward as well as forward. It always steps forward only. */
  menCaptureBackward: boolean;
  /**
   * Whether a king flies: moves any distance along an open diagonal, and takes a
   * piece at any distance, landing on any empty square beyond it. Otherwise a
   * king moves one square and jumps an adjacent piece, as a man does, both ways.
   */
  flyingKings: boolean;
  captureChoice: CaptureChoice;
  crownMidCapture: CrownMidCapture;
  /**
   * The same position standing for this many times, with the same side to move,
   * is a draw. Null where this game is not played with a repetition rule here.
   */
  repetitionDraw: number | null;
  /** The endings the stronger side must win within a count of moves, or draw. */
  endgameCounts: readonly EndgameCount[];
};

/** A side's pieces, as an endgame count names them. */
export type PieceTally = { kings: number; men: number };

/**
 * An ending that must be won within so many moves or it is a draw.
 *
 * `endings` are the pairings it covers, either side holding either half: three
 * kings against one king, a king and a man against a king. While the position
 * stays inside any of them — whether a man moves or a piece is taken inside the
 * set — the count runs, and once each player has made `movesEach` more moves
 * since the position first entered it, the game is drawn.
 */
export type EndgameCount = {
  endings: readonly (readonly [PieceTally, PieceTally])[];
  movesEach: number;
};
