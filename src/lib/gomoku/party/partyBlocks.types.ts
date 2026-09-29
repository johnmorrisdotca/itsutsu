// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import type { Point } from "../gomoku.types";

import type { HalmaCorner } from "./partyHalma.types";

/**
 * THE TWENTY-ONE SHAPES each player holds: every shape of one to five squares
 * joined along their sides, counting a shape turned or mirrored as the same
 * one. Named as the mathematics names them — the monomino, the domino, the two
 * trominoes, the five tetrominoes (Block Five's own seven, once a flip is
 * allowed) and the twelve pentominoes by the letter each resembles.
 */
export type BlocksPieceKey =
  | "one"
  | "two"
  | "threeLine"
  | "threeBend"
  | "fourLine"
  | "fourSquare"
  | "fourT"
  | "fourS"
  | "fourL"
  | "fiveF"
  | "fiveI"
  | "fiveL"
  | "fiveN"
  | "fiveP"
  | "fiveT"
  | "fiveU"
  | "fiveV"
  | "fiveW"
  | "fiveX"
  | "fiveY"
  | "fiveZ";

/** A corner of the board, the square a player's first piece must cover: Halma's four corners, named the same way. */
export type BlocksCorner = HalmaCorner;

/** One player at the table: the corner they start from, and a name if they gave one. */
export type PartyBlocksPlayer = { corner: BlocksCorner; name: string };

/** One piece laid: whose turn it was, which of their shapes, and the squares it covers. */
export type BlocksMove = { player: number; piece: BlocksPieceKey; cells: readonly Point[] };

/** Where a game stands: somebody can still lay a piece, or nobody can and it is counted. */
export type PartyBlocksStatus = "playing" | "over";

/**
 * A GAME OF BLOCK FIVE FOR FOUR ON ONE DEVICE.
 *
 * Its own state, not the engine's `GameState`, which is black and white all
 * the way down: four colours are four players, not two with extra stones.
 * `out` is not written down anywhere — it is what the board and the pieces
 * left say, found again after every move — and a game kept in the browser is
 * only its seats and its moves.
 */
export type PartyBlocksState = {
  /** In turn order, clockwise from the top left; player `i` plays colour `i`. */
  players: readonly PartyBlocksPlayer[];
  /** One entry per square, row by row: the player whose piece covers it, or null. */
  board: readonly (number | null)[];
  /** Whose turn it is, by place in `players`. Meaningless once the game is over. */
  toPlay: number;
  moves: readonly BlocksMove[];
  /** Per player: true once they have no piece that fits anywhere, and so pass for the rest of the game. */
  out: readonly boolean[];
  status: PartyBlocksStatus;
};

/** A piece as the player to move is holding it: which shape, turned how many quarter turns, and mirrored or not. */
export type BlocksHold = { piece: BlocksPieceKey; turns: number; flipped: boolean };

/**
 * Where a held piece would lie with one of its squares on a chosen square:
 * the squares it would cover (only those on the board), and why the rules
 * refuse it there, or null when they let it be laid.
 */
export type BlocksPreview = { cells: readonly Point[]; refusal: BlocksRefusal | null };

/** One player's standing: the squares their pieces cover, and how many of their pieces are still in hand. */
export type BlocksScore = { player: number; squares: number; piecesLeft: number };

/**
 * Why a piece may not lie where it is held: the game is over, the shape is
 * already on the board, a square is off the edge or taken, it touches one of
 * the player's own pieces along a side, a first piece misses the player's
 * corner, or a later one touches none of theirs at a corner.
 */
export type BlocksRefusal = "over" | "used" | "offBoard" | "taken" | "sideTouch" | "firstCorner" | "noCorner";
