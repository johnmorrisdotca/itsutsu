import type { GameDetail } from "@/lib/history/gameHistory.types";

/**
 * The SGF game types this site has a game for. The numbers are SGF's own,
 * from the GM property of FF[4] — https://www.red-bean.com/sgf/properties.html
 * — and none is invented: 1 is Go, 2 Othello, 4 Gomoku and Renju, 11 Hex.
 */
export type SgfGameType = 1 | 2 | 4 | 11;

/**
 * What one SGF game type can say, as data, so the writer reads a row rather
 * than asking which game it is writing.
 */
export type SgfTypeSpec = {
  /** SGF's own name for the type. */
  name: string;
  /**
   * How a turn taken without a stone is written. `empty` is Go's `B[]`, `word`
   * is Hex's `B[pass]`, and `unwritable` is a type whose SGF definition has no
   * pass at all — Othello and Gomoku — where the pass is left out and said in
   * the game comment instead, rather than written in a syntax the type lacks.
   */
  passes: "empty" | "word" | "unwritable";
  /** `letters` is the two-letter point, a–z then A–Z; `hex` is Hex's column letter and row number. */
  points: "letters" | "hex";
  /** The komi to write as KM, and to score RE with, or null where the game has none. */
  komi: number | null;
  /** Whether the game starts with discs already on the board, set up with AB and AW. */
  startingDiscs: boolean;
  /** The rules SGF has no property for, said once in the game comment; null when there is nothing to say. */
  rulesComment: string | null;
  /**
   * Which of the site's rule options this type can carry in prose. An option
   * the type cannot carry refuses the file: a Go or Othello reader works out
   * captures and flips from the board, so a sealed point or a handicap would
   * put a different game in front of it than the one that was played.
   */
  carries: { opening: boolean; handicap: boolean; obstacles: boolean };
};

/** A variant is written as one SGF type, or not at all — and then the reason is written down. */
export type SgfTypeRow = { gm: SgfGameType; rules: string | null } | { gm: null; why: string };

/** A variant that has an SGF type. */
export type SgfMappedRow = Extract<SgfTypeRow, { gm: SgfGameType }>;

/** Why a game gets no file. */
export type SgfRefusal =
  | "no-sgf-type"
  | "not-finished"
  | "board-size"
  | "win-length"
  | "rules-outside-type"
  | "unreadable-move";

/** As much of a filed game as a file needs. */
export type SgfSource = Pick<
  GameDetail,
  | "variant"
  | "size"
  | "winLength"
  | "obstacles"
  | "opener"
  | "opening"
  | "handicap"
  | "seed"
  | "drawLimit"
  | "status"
  | "result"
  | "blackName"
  | "whiteName"
  | "moveTimeMs"
  | "moves"
>;

/** A file, or the reason there is none. Never a file standing in for a reason. */
export type SgfWritten = { kind: "written"; text: string } | { kind: "refused"; reason: SgfRefusal };
