import type {
  Blocked,
  FirstPlayer,
  GameSettings,
  GameStatus,
  MoveKind,
  ObstacleLayout,
  Point,
  RuleVariant,
  Seat,
  Stone,
} from "./gomoku.types";

export const STONES = {
  black: "black",
  white: "white",
} as const satisfies Record<Stone, Stone>;

export const BLOCKED: Blocked = "blocked";

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
  { label: string; kanji: string; description: string }
> = {
  freestyle: {
    label: "Freestyle",
    kanji: "自由",
    description: "Five or more in a row wins.",
  },
  standard: {
    label: "Standard",
    kanji: "五目",
    description: "Exactly five wins. Six or more (長連) does not.",
  },
};

/**
 * Standard fixes black as the opener, the way the formal rule sets do. Only
 * freestyle lets the players decide who takes the first stone.
 */
export const VARIANT_ALLOWS_FIRST_PLAYER_CHOICE: Record<RuleVariant, boolean> = {
  freestyle: true,
  standard: false,
};

export const GAME_STATUS = {
  playing: "playing",
  won: "won",
  draw: "draw",
} as const satisfies Record<GameStatus, GameStatus>;

export const MOVE_KINDS = {
  place: "place",
  skip: "skip",
} as const satisfies Record<MoveKind, MoveKind>;

export const SEATS = {
  one: "one",
  two: "two",
} as const satisfies Record<Seat, Seat>;

export const SEAT_DISPLAY: Record<Seat, { label: string }> = {
  one: { label: "Player 1" },
  two: { label: "Player 2" },
};

export const FIRST_PLAYERS = {
  black: "black",
  white: "white",
  random: "random",
} as const satisfies Record<FirstPlayer, FirstPlayer>;

export const FIRST_PLAYER_DISPLAY: Record<
  FirstPlayer,
  { label: string; kanji: string }
> = {
  black: { label: "Black opens", kanji: "黒先" },
  white: { label: "White opens", kanji: "白先" },
  random: { label: "Random", kanji: "振り駒" },
};

export const OBSTACLE_LAYOUTS = {
  none: "none",
  hoshi: "hoshi",
} as const satisfies Record<ObstacleLayout, ObstacleLayout>;

export const OBSTACLE_LAYOUT_DISPLAY: Record<
  ObstacleLayout,
  { label: string; kanji: string; description: string }
> = {
  none: {
    label: "Open board",
    kanji: "平盤",
    description: "Every intersection is playable.",
  },
  hoshi: {
    label: "Star blocks",
    kanji: "星塞ぎ",
    description: "The star points are sealed off. Tengen, at the centre, stays open.",
  },
};

/** Board is `size` × `size`. The mini boards make for much shorter games. */
export const BOARD_SIZES = [9, 13, 15, 19] as const;

export const BOARD_SIZE_DISPLAY: Record<
  number,
  { label: string; kanji: string; note: string }
> = {
  9: { label: "Mini", kanji: "小盤", note: "Quick game" },
  13: { label: "Medium", kanji: "中盤", note: "Shorter game" },
  15: { label: "Standard", kanji: "正盤", note: "Tournament size" },
  19: { label: "Go board", kanji: "碁盤", note: "Long game" },
};

export const DEFAULT_BOARD_SIZE = 15;

export const WIN_LENGTH = 5;

export const DEFAULT_SWAPS_PER_SEAT = 1;

export const DEFAULT_SETTINGS: GameSettings = {
  size: DEFAULT_BOARD_SIZE,
  winLength: WIN_LENGTH,
  variant: RULE_VARIANTS.freestyle,
  firstPlayer: FIRST_PLAYERS.black,
  obstacles: OBSTACLE_LAYOUTS.none,
  allowUndo: true,
  allowSkip: false,
  allowSwap: false,
  swapsPerSeat: DEFAULT_SWAPS_PER_SEAT,
};

/** Black opens unless the settings say otherwise. */
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

/**
 * Hoshi (star point) positions drawn on the board, by board size: the four
 * corner points, plus tengen at the centre, and for 19×19 the side points too.
 */
export const STAR_POINTS: Record<number, readonly Point[]> = {
  9: starGrid([2, 4, 6], [2, 6]),
  13: starGrid([3, 6, 9], [3, 9]),
  15: starGrid([3, 7, 11], [3, 11]),
  19: starGrid([3, 9, 15], [3, 9, 15]),
};

/**
 * Builds a star layout from `corners` (the outer ring) plus the centre of
 * `all`. Passing every coordinate as a corner gives the full 3×3 go layout.
 */
function starGrid(all: number[], corners: number[]): Point[] {
  const centre = all[Math.floor(all.length / 2)];
  const points = corners.flatMap((row) => corners.map((col) => ({ row, col })));
  if (!points.some((p) => p.row === centre && p.col === centre)) {
    points.push({ row: centre, col: centre });
  }
  return points.sort((a, b) => a.row - b.row || a.col - b.col);
}

/** Column letters used in coordinate labels, left to right. "I" is skipped as in go. */
export const COLUMN_LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
