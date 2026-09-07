import type {
  Blocked,
  FirstPlayer,
  ForbiddenPattern,
  GameSettings,
  GameStatus,
  Handicap,
  HandicapRule,
  LineRule,
  MoveKind,
  ObstacleLayout,
  OpeningRule,
  OpeningStage,
  Point,
  RuleVariant,
  Seat,
  Stone,
  VariantSpec,
  WinReason,
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
  renju: "renju",
  omok: "omok",
  caro: "caro",
  ninuki: "ninuki",
  connect6: "connect6",
} as const satisfies Record<RuleVariant, RuleVariant>;

/** The variants in the order the browser and the filters list them. */
export const RULE_VARIANT_LIST = [
  RULE_VARIANTS.freestyle,
  RULE_VARIANTS.standard,
  RULE_VARIANTS.renju,
  RULE_VARIANTS.omok,
  RULE_VARIANTS.caro,
  RULE_VARIANTS.ninuki,
  RULE_VARIANTS.connect6,
] as const satisfies readonly RuleVariant[];

export const OPENING_RULES = {
  free: "free",
  pro: "pro",
  longPro: "longPro",
  swap: "swap",
  swap2: "swap2",
  rif: "rif",
} as const satisfies Record<OpeningRule, OpeningRule>;

export const OPENING_RULE_LIST = [
  OPENING_RULES.free,
  OPENING_RULES.pro,
  OPENING_RULES.longPro,
  OPENING_RULES.swap,
  OPENING_RULES.swap2,
  OPENING_RULES.rif,
] as const satisfies readonly OpeningRule[];

export const LINE_RULES = {
  atLeast: "atLeast",
  exact: "exact",
  exactOpen: "exactOpen",
} as const satisfies Record<LineRule, LineRule>;

export const FORBIDDEN_PATTERNS = {
  doubleThree: "doubleThree",
  doubleFour: "doubleFour",
  overline: "overline",
} as const satisfies Record<ForbiddenPattern, ForbiddenPattern>;

export const WIN_REASONS = {
  line: "line",
  captures: "captures",
  time: "time",
} as const satisfies Record<WinReason, WinReason>;

export const OPENING_STAGES = {
  placing: "placing",
  choosing: "choosing",
  extending: "extending",
  done: "done",
} as const satisfies Record<OpeningStage, OpeningStage>;

/** The one opening choice that is not a colour. */
export const OPENING_CHOICE_EXTEND = "extend" as const;

/** Stones in a line needed to win, unless a variant pins it. */
export const WIN_LENGTH = 5;

/** Line lengths a player may pick in the variants that leave it open. */
export const WIN_LENGTHS = [4, 5, 6] as const;

/** Pairs to capture for a win in the capture variants. */
export const DEFAULT_CAPTURES_TO_WIN = 5;

/** The handicap toggles, in the order the settings list them. */
export const HANDICAP_RULES = [
  "doubleThree",
  "doubleFour",
  "overline",
  "exactLine",
  "openLine",
  "longerLine",
  "singleStone",
  "noCaptures",
] as const satisfies readonly HandicapRule[];

/** Half-widths of the central square a handicapped second stone must leave. */
export const SECOND_STONE_EXCLUSIONS = [0, 2, 3] as const;

export const NO_HANDICAP: Handicap = {
  stone: null,
  doubleThree: false,
  doubleFour: false,
  overline: false,
  exactLine: false,
  openLine: false,
  longerLine: false,
  singleStone: false,
  noCaptures: false,
  secondStoneExclusion: 0,
};

const NO_PATTERNS: readonly ForbiddenPattern[] = [];
const RENJU_PATTERNS: readonly ForbiddenPattern[] = [
  FORBIDDEN_PATTERNS.doubleThree,
  FORBIDDEN_PATTERNS.doubleFour,
  FORBIDDEN_PATTERNS.overline,
];
const OMOK_PATTERNS: readonly ForbiddenPattern[] = [FORBIDDEN_PATTERNS.doubleThree];

/** Openings that suit any one-stone-a-turn game. */
const GOMOKU_OPENINGS: readonly OpeningRule[] = [
  OPENING_RULES.free,
  OPENING_RULES.pro,
  OPENING_RULES.longPro,
  OPENING_RULES.swap,
  OPENING_RULES.swap2,
];

function plain(overrides: Partial<VariantSpec> = {}): VariantSpec {
  return {
    lineRule: { black: LINE_RULES.atLeast, white: LINE_RULES.atLeast },
    forbidden: { black: NO_PATTERNS, white: NO_PATTERNS },
    captures: false,
    stonesPerTurn: 1,
    firstTurnStones: 1,
    winLength: WIN_LENGTH,
    allowFirstPlayerChoice: false,
    openings: GOMOKU_OPENINGS,
    ...overrides,
  };
}

/**
 * Every rule set, as data. The engine reads these and never the variant name,
 * so a new variant is a new row here plus its copy in `variants.constants.ts`.
 */
export const VARIANT_SPECS: Record<RuleVariant, VariantSpec> = {
  freestyle: plain({ winLength: null, allowFirstPlayerChoice: true }),
  standard: plain({
    lineRule: { black: LINE_RULES.exact, white: LINE_RULES.exact },
  }),
  renju: plain({
    // White's overline counts as five; black's is forbidden.
    lineRule: { black: LINE_RULES.exact, white: LINE_RULES.atLeast },
    forbidden: { black: RENJU_PATTERNS, white: NO_PATTERNS },
    openings: [
      OPENING_RULES.free,
      OPENING_RULES.rif,
      OPENING_RULES.pro,
      OPENING_RULES.longPro,
    ],
  }),
  omok: plain({ forbidden: { black: OMOK_PATTERNS, white: OMOK_PATTERNS } }),
  caro: plain({
    lineRule: { black: LINE_RULES.exactOpen, white: LINE_RULES.exactOpen },
  }),
  ninuki: plain({ captures: true, allowFirstPlayerChoice: true }),
  connect6: plain({
    stonesPerTurn: 2,
    winLength: 6,
    allowFirstPlayerChoice: true,
    openings: [OPENING_RULES.free],
  }),
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

export const DEFAULT_SWAPS_PER_SEAT = 1;

export const DEFAULT_SETTINGS: GameSettings = {
  size: DEFAULT_BOARD_SIZE,
  winLength: WIN_LENGTH,
  variant: RULE_VARIANTS.freestyle,
  opening: OPENING_RULES.free,
  handicap: NO_HANDICAP,
  capturesToWin: DEFAULT_CAPTURES_TO_WIN,
  firstPlayer: FIRST_PLAYERS.black,
  obstacles: OBSTACLE_LAYOUTS.none,
  allowUndo: true,
  allowSkip: false,
  allowSwap: false,
  allowGrowth: false,
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
