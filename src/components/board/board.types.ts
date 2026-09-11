import type { BoardGrid, Cell, GameState, PieceCell, Point, Stone } from "@/lib/gomoku/gomoku.types";
import type { BOARD_THEMES, STONE_SETS } from "./Board.constants";

export type BoardTheme = keyof typeof BOARD_THEMES;

/**
 * How the reader wants every board drawn. `auto` is the traditional view:
 * each game the way that game is drawn, which its own spec declares
 * (`VariantSpec.grid`) and nothing here guesses. `lines` is the Itsutsu view,
 * every game on the crossings as on a go board; `cells` is its mirror, every
 * game in the squares. A reader's choice and nothing more — it moves no point.
 */
export type GridStyle = "auto" | BoardGrid;
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
  grid: GridStyle;
  /**
   * The board turned round, so the far side of it is nearest you. A reader's
   * own view and nothing else: it moves no stone, changes no coordinate — A1
   * is still A1, drawn somewhere else — and the other seat never learns of it.
   * It belongs here for that reason rather than by convenience: nothing in
   * this type can reach the game or the opponent.
   *
   * Null is the third state, and the reason there is one: not chosen. A person
   * who has never touched this gets the board drawn from their own side, and
   * a person who has chosen keeps what they chose. Two states could not tell
   * those apart, so one of them had to be wrong — either a choice to see it
   * the ordinary way round was overridden every render, or the default never
   * arrived for anybody.
   */
  flipped: boolean | null;
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
 * losing move in the record. None of those change what is legal. `forbidden`
 * is the exception: it is the rules, not advice — a point the colour to move
 * may not play, which the board draws itself from the engine.
 */
export type BoardMarkKind =
  | "forced"
  | "building"
  | "hint"
  | "help"
  | "fatal"
  | "forbidden"
  | "selected"
  | "target";

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
  /** Turns a quadrant, in the twist games; shown only while one is owed. */
  onTwist?: (quadrant: number, clockwise: boolean) => void;
  /** The piece picked up, in the sliding games, so its stone stays clickable. */
  selected?: Point | null;
  /**
   * In the piece games: the cells the piece in hand would cover with its
   * corner on the hovered point, or null where it does not fit.
   */
  footprintFor?: (anchor: Point) => PieceCell[] | null;
  /** The colour the next stone will be, where that is not the mover's colour. */
  placing?: Stone | null;
  /**
   * Whose side of the board this is being drawn for, so an untouched board can
   * be turned round to face them. Null for a board nobody is sitting at — an
   * embed, a replay, somebody watching — which is drawn as it is stored.
   */
  viewer?: Stone | null;
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
  /** Clickable even without a ghost: a column in a drop game, a piece to slide. */
  clickable?: boolean;
  /** A ghost of this colour shown regardless of hover: a cell of the piece in hand. */
  ghostStone?: Stone | null;
  onHover?: (point: Point | null) => void;
  /** Printed on the stone when move numbers are on. */
  moveNumber: number | null;
  mark: BoardMark | null;
  /** Whose home camp this square is, in a race game; shaded so the corners read as camps. */
  camp?: Stone | null;
  /** Whether the piece here has been crowned, in checkers. */
  isKing?: boolean;
  /**
   * Draws a sealed cell as nothing at all rather than the usual knot mark:
   * Chinese Checkers, where most of the embedding square is not part of the
   * hexagram and marking all of it "sealed off" would say the wrong thing.
   */
  hideBlocked?: boolean;
  /** Marks an empty playable cell as a hole, where nothing else draws the board's shape: Chinese Checkers. */
  hole?: boolean;
  /** On a slanted board, undoes the slant so the stone inside is round. */
  unslant?: boolean;
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
  /** Whether this stone has been crowned, in checkers. */
  isKing?: boolean;
};
