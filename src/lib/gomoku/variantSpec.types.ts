import type { OpeningRule, PieceQueue, Stone } from "./gomoku.types";
import type {
  BoardGrid,
  CheckersRules,
  ForbiddenPattern,
  LineRule,
  Placement,
  StartingDiscs,
  WrapMode,
} from "./spec.types";

/*
 * The row a rule set is written as, on its own.
 *
 * Lifted out of gomoku.types.ts when the checkers family's rules joined it and
 * that file passed the File Size Gate. It is one job: every field here is a
 * choice a game makes, read by the engine instead of the game's name, and none
 * of it is the state of a game in progress, a move, or a setting a player
 * picks — which is what the rest of gomoku.types.ts describes. gomoku.types.ts
 * re-exports it, so it is still reached from there.
 */

/**
 * One rule set, as data. The engine consults this and never the variant's
 * name, so adding a variant is a matter of adding a row.
 */
export type VariantSpec = {
  /** Per colour, because renju lets white win with an overline and not black. */
  lineRule: Record<Stone, LineRule>;
  forbidden: Record<Stone, readonly ForbiddenPattern[]>;
  /** Flanking a pair of enemy stones removes them. */
  captures: boolean;
  stonesPerTurn: number;
  /** Connect6 opens with a single stone before the two-a-turn rhythm starts. */
  firstTurnStones: number;
  /** A pinned line length, or null when the players may choose. */
  winLength: number | null;
  /** Whether the players may hand the first stone to white or draw lots. */
  allowFirstPlayerChoice: boolean;
  /**
   * The colour that moves first where the players may not choose — and under
   * an opening protocol, which always starts from it. Black for nearly every
   * game here; White for the draughts games whose federations give White the
   * first move.
   */
  firstStone: Stone;
  openings: readonly OpeningRule[];
  placement: Placement;
  /** Making exactly this many in a row loses, as in the trap game; null when nothing does. */
  loseLength: number | null;
  /** Side of the quadrants a move ends by rotating; null when moves do not twist. */
  quadrantSize: number | null;
  /** Pieces per player; once all are down, a turn moves one. Null for unlimited stones. */
  pieces: number | null;
  /** A 2×2 square of one colour also wins. */
  squareWins: boolean;
  /** Board sizes this game is played on, or null for the standard list. */
  boardSizes: readonly number[] | null;
  /** Where its stones sit when it is drawn its own way — see `BoardGrid`. Declared, never inferred. */
  grid: BoardGrid;
  /** Whether the threat reading means anything; off where stones move after placing. */
  analysis: boolean;
  /**
   * Which edges join. `columns` is a cylinder — left meets right; `both` is a
   * torus, where top meets bottom as well. A mode rather than two booleans
   * because "rows wrap but columns do not" is the same cylinder turned on its
   * side, and there is no reason for the type to allow two ways to say it.
   */
  wrap: WrapMode;
  /** Squares taken out of play at random when the game starts. */
  deadSquares: number;
  /** Squares that count as either colour's stone, placed at random when the game starts. */
  hotSquares: number;
  /** A full bottom row disappears and everything above it drops, as in the falling-block game. */
  lineClear: boolean;
  /** Making the winning line loses, and a full board goes to the player who opened. */
  misere: boolean;
  /** Pieces come from a shared seeded queue rather than being single stones. */
  queue: PieceQueue | null;
  /** Single stones of your own colour each player may lay instead of a piece. */
  singles: number;
  /** How many enemy stones a flank may take at once: pairs, or pairs and triples. */
  captureSizes: readonly number[];
  /** Enemy stones to capture for a win, in stones, in the capture variants. */
  capturesToWin: number | null;
  /** Two random squares joined by a wormhole: a line entering one leaves the other. */
  wormholes: number;
  /** The mover chooses the colour of every stone. */
  anyColour: boolean;
  /** Every stone is black, whoever placed it. */
  singleColour: boolean;
  /** Maker wants a line of either colour; breaker wants a full board without one. */
  makerBreaker: boolean;
  /**
   * The flipping games. A stone may only be placed where it flanks a line of
   * the other colour, which then turns; a colour with no such place passes;
   * when neither can move the discs are counted. Lines and captures mean
   * nothing here — the whole of the game is in the flip.
   */
  flips: boolean;
  /** How the centre is set before the first move: fixed, laid by the players, or empty. */
  startingDiscs: StartingDiscs;
  /**
   * The race games. Every piece starts in a corner camp; a move is a step or
   * a chain of jumps over any piece; filling the far camp wins. Lines,
   * captures and placing mean nothing here.
   */
  camps: boolean;
  /**
   * The connection game. A colour wins by joining its own two sides of the
   * board with a chain of touching stones, on a lattice where a cell touches
   * six others rather than four or eight. No lines, no captures, no draws.
   */
  connects: boolean;
  /**
   * The checkers family. Pieces stand on the board from the start and move
   * one diagonal step forward, or capture by jumping an adjacent enemy piece
   * into the empty square beyond. Capturing is forced whenever any of a
   * colour's pieces can, and a piece that jumps again from where it lands
   * keeps jumping in the same move for as long as it has another to take. A
   * man reaching the far row is crowned a king, which may move and capture
   * backward as well as forward; a colour with no legal move loses.
   */
  checkers: boolean;
  /**
   * How this game of the checkers family moves and takes — see `CheckersRules`.
   * Null exactly when `checkers` is false: a game with no men and no kings has
   * no answer to "may a man take backward", and a default here would be one.
   */
  checkersRules: CheckersRules | null;
  /**
   * Chinese Checkers: a hexagram board, embedded in a square Point grid the
   * way Hex's rhombus is, with the cells outside it sealed off as `BLOCKED`.
   * Otherwise the same race as Halma's `camps` — step or jump-chain to fill
   * the point opposite, nothing captured — just six hex directions in place
   * of eight square ones, and a star's points in place of a corner's square.
   */
  chineseCheckers: boolean;
  /**
   * Go: stones never move once placed. A group of one colour with no
   * liberties left is captured whole; a move that would leave the mover's
   * own group with none, after any capture it makes, is suicide and illegal;
   * a move that would exactly retake the single stone a capture just lifted
   * is forbidden for one turn — the simple ko rule. Either side may pass at
   * any point; two passes in a row end the game, scored by area — every
   * stone on the board plus the empty points only that colour surrounds —
   * with a fixed komi added for white.
   */
  go: boolean;
};
