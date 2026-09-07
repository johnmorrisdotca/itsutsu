import type { Cell, GameState, Point, Stone } from "@/lib/gomoku/gomoku.types";
import type { BOARD_THEMES, STONE_SETS } from "./Board.constants";

export type BoardTheme = keyof typeof BOARD_THEMES;
export type StoneSet = keyof typeof STONE_SETS;

/**
 * How the board looks. Appearance is kept apart from `GameSettings` on
 * purpose: none of it can change what is legal or who has won, so the engine
 * never sees it.
 */
export type Appearance = {
  boardTheme: BoardTheme;
  stoneSet: StoneSet;
  /** Coordinate letters and numbers along the edges. */
  showCoordinates: boolean;
  /** Move numbers printed on the stones, as in a published game record. */
  showMoveNumbers: boolean;
};

/** The CSS custom properties a board theme sets on its container. */
export type BoardThemeTokens = {
  label: string;
  kanji: string;
  /** Painted behind the grid — a gradient or a flat colour. */
  surface: string;
  /** Sits under `surface` to give the wood an edge and a shadow. */
  frame: string;
  line: string;
  star: string;
  coordinate: string;
  /** Ring drawn around the stones that won. */
  winning: string;
  /** True for boards whose surface is dark, so overlays flip to light. */
  dark: boolean;
};

export type StoneSetTokens = {
  label: string;
  kanji: string;
  /** Backgrounds for the two colours, in the order black then white. */
  black: string;
  white: string;
  /** Ink used for a move number or last-move dot drawn on that stone. */
  blackInk: string;
  whiteInk: string;
};

/**
 * Something drawn over an intersection that is not a stone.
 *
 * `forced` is the point a threat must be answered on, `building` a point where
 * the opponent could start one next move, `hint` the engine's suggestion,
 * `help` a mark the opponent drew when asked for advice, and `fatal` the
 * losing move in the record. None of them change what is legal.
 */
export type BoardMarkKind =
  | "forced"
  | "building"
  | "hint"
  | "help"
  | "fatal";

export type BoardMark = Point & {
  kind: BoardMarkKind;
  /** Short caption drawn beside the mark, e.g. a suggestion's reason. */
  label?: string;
};

export type BoardProps = {
  state: GameState;
  appearance: Appearance;
  marks?: readonly BoardMark[];
  /** A board being read rather than played: replays and embeds. */
  readOnly?: boolean;
  onPlay: (point: Point) => void;
};

export type IntersectionProps = {
  point: Point;
  cell: Cell;
  /** Accessible name, e.g. "H8, empty" or "H8, black stone". */
  label: string;
  isLast: boolean;
  isWinning: boolean;
  /** Colour previewed on hover while the intersection is playable, if any. */
  ghost: Stone | null;
  /** Printed on the stone when move numbers are on. */
  moveNumber: number | null;
  mark: BoardMark | null;
  stones: StoneSetTokens;
  winningColour: string;
  readOnly: boolean;
  onPlay: (point: Point) => void;
};

export type StoneMarkProps = {
  stone: Stone;
  stones: StoneSetTokens;
  isLast?: boolean;
  isWinning?: boolean;
  winningColour?: string;
  /** A translucent hover preview rather than a placed stone. */
  ghost?: boolean;
  moveNumber?: number | null;
};
