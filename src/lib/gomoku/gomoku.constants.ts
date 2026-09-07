import type {
  GameSettings,
  GameStatus,
  Point,
  RuleVariant,
  Stone,
} from "./gomoku.types";

export const STONES = {
  black: "black",
  white: "white",
} as const satisfies Record<Stone, Stone>;

export const STONE_DISPLAY: Record<Stone, { label: string; kanji: string }> = {
  black: { label: "Black", kanji: "黒" },
  white: { label: "White", kanji: "白" },
};

export const RULE_VARIANTS = {
  freestyle: "freestyle",
  standard: "standard",
} as const satisfies Record<RuleVariant, RuleVariant>;

export const RULE_VARIANT_DISPLAY: Record<
  RuleVariant,
  { label: string; description: string }
> = {
  freestyle: {
    label: "Freestyle",
    description: "Five or more in a row wins.",
  },
  standard: {
    label: "Standard",
    description: "Exactly five wins. Six or more (長連) does not.",
  },
};

export const GAME_STATUS = {
  playing: "playing",
  won: "won",
  draw: "draw",
} as const satisfies Record<GameStatus, GameStatus>;

export const BOARD_SIZES = [15, 19] as const;

export const DEFAULT_BOARD_SIZE = 15;

export const WIN_LENGTH = 5;

export const DEFAULT_SETTINGS: GameSettings = {
  size: DEFAULT_BOARD_SIZE,
  winLength: WIN_LENGTH,
  variant: RULE_VARIANTS.freestyle,
};

/** Black always opens in gomoku. */
export const FIRST_STONE: Stone = STONES.black;

/**
 * The four line orientations through a point. Each is checked in both its
 * forward and reverse sense, so four entries cover all eight neighbours.
 */
export const DIRECTIONS: readonly Point[] = [
  { row: 0, col: 1 }, // horizontal
  { row: 1, col: 0 }, // vertical
  { row: 1, col: 1 }, // diagonal, top-left to bottom-right
  { row: 1, col: -1 }, // diagonal, top-right to bottom-left
];

/** Hoshi (star point) positions drawn on the board, by board size. */
export const STAR_POINTS: Record<number, readonly Point[]> = {
  15: [
    { row: 3, col: 3 },
    { row: 3, col: 11 },
    { row: 7, col: 7 },
    { row: 11, col: 3 },
    { row: 11, col: 11 },
  ],
  19: [3, 9, 15].flatMap((row) => [3, 9, 15].map((col) => ({ row, col }))),
};

/** Column letters used in coordinate labels, left to right. "I" is skipped as in go. */
export const COLUMN_LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
