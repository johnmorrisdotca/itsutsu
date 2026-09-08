import type {
  WrapMode,
  Blocked,
  FirstPlayer,
  Hot,
  PieceQueue,
  Worm,
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
  Placement,
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

export const HOT: Hot = "hot";

export const WORM: Worm = "worm";

/** Seeds are 31-bit integers, small enough for every store and reproducible everywhere. */
export const SEED_RANGE = 2 ** 31;

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
  tictactoe: "tictactoe",
  trapThree: "trapThree",
  dropFour: "dropFour",
  twistFive: "twistFive",
  twistFour: "twistFour",
  squareFour: "squareFour",
  ringDrop: "ringDrop",
  holeDrop: "holeDrop",
  hotDrop: "hotDrop",
  clearDrop: "clearDrop",
  giveawayDrop: "giveawayDrop",
  edgeDrop: "edgeDrop",
  dominoFive: "dominoFive",
  blockFive: "blockFive",
  sannuki: "sannuki",
  wormDrop: "wormDrop",
  misereFive: "misereFive",
  makerBreaker: "makerBreaker",
  wildTicTacToe: "wildTicTacToe",
  notakto: "notakto",
  toroidalFive: "toroidalFive",
  obstacleFive: "obstacleFive",
  reversi: "reversi",
  classicReversi: "classicReversi",
  antiReversi: "antiReversi",
  miniReversi: "miniReversi",
  grandReversi: "grandReversi",
} as const satisfies Record<RuleVariant, RuleVariant>;

export const WRAP_MODES = {
  none: "none",
  columns: "columns",
  both: "both",
} as const satisfies Record<WrapMode, WrapMode>;

export const PIECE_QUEUES = {
  domino: "domino",
  tetro: "tetro",
} as const satisfies Record<PieceQueue, PieceQueue>;

/** How many queued pieces a player is shown ahead of the one in hand. */
export const PIECE_PREVIEW = 3;

/** A pass has no point on the board. */
export const NO_POINT: Point = { row: -1, col: -1 };

/** The variants in the order the browser and the filters list them. */
export const RULE_VARIANT_LIST = [
  RULE_VARIANTS.freestyle,
  RULE_VARIANTS.standard,
  RULE_VARIANTS.renju,
  RULE_VARIANTS.omok,
  RULE_VARIANTS.caro,
  RULE_VARIANTS.ninuki,
  RULE_VARIANTS.sannuki,
  RULE_VARIANTS.connect6,
  RULE_VARIANTS.misereFive,
  RULE_VARIANTS.toroidalFive,
  RULE_VARIANTS.obstacleFive,
  RULE_VARIANTS.makerBreaker,
  RULE_VARIANTS.dominoFive,
  RULE_VARIANTS.blockFive,
  RULE_VARIANTS.dropFour,
  RULE_VARIANTS.ringDrop,
  RULE_VARIANTS.holeDrop,
  RULE_VARIANTS.hotDrop,
  RULE_VARIANTS.clearDrop,
  RULE_VARIANTS.giveawayDrop,
  RULE_VARIANTS.edgeDrop,
  RULE_VARIANTS.wormDrop,
  RULE_VARIANTS.twistFive,
  RULE_VARIANTS.twistFour,
  RULE_VARIANTS.trapThree,
  RULE_VARIANTS.squareFour,
  RULE_VARIANTS.tictactoe,
  RULE_VARIANTS.wildTicTacToe,
  RULE_VARIANTS.notakto,
  RULE_VARIANTS.reversi,
  RULE_VARIANTS.classicReversi,
  RULE_VARIANTS.antiReversi,
  RULE_VARIANTS.miniReversi,
  RULE_VARIANTS.grandReversi,
] as const satisfies readonly RuleVariant[];

export const PLACEMENTS = {
  free: "free",
  drop: "drop",
  edge: "edge",
} as const satisfies Record<Placement, Placement>;

export const OPENING_RULES = {
  free: "free",
  pro: "pro",
  longPro: "longPro",
  swap: "swap",
  swap2: "swap2",
  rif: "rif",
  sakata: "sakata",
  tarannikov: "tarannikov",
} as const satisfies Record<OpeningRule, OpeningRule>;

export const OPENING_RULE_LIST = [
  OPENING_RULES.free,
  OPENING_RULES.pro,
  OPENING_RULES.longPro,
  OPENING_RULES.swap,
  OPENING_RULES.swap2,
  OPENING_RULES.rif,
  OPENING_RULES.sakata,
  OPENING_RULES.tarannikov,
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
  resign: "resign",
  trap: "trap",
  square: "square",
  full: "full",
  count: "count",
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

/** Enemy stones to capture for a win in the capture game: five pairs. */
export const DEFAULT_CAPTURES_TO_WIN = 10;

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

const FREE_ONLY: readonly OpeningRule[] = [OPENING_RULES.free];

export const STARTING_DISCS = { none: "none", fixed: "fixed", laid: "laid" } as const;

/** The board a flipping game is played on, and the small ones it may grow from. */
const REVERSI_SIZES = [8] as const;
const MINI_REVERSI_SIZES = [4, 6, 8] as const;
/** The big board the play-by-mail sites offered beside the usual one. */
const GRAND_REVERSI_SIZES = [10] as const;

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
    placement: PLACEMENTS.free,
    loseLength: null,
    quadrantSize: null,
    pieces: null,
    squareWins: false,
    boardSizes: null,
    analysis: true,
    wrap: WRAP_MODES.none,
    deadSquares: 0,
    hotSquares: 0,
    lineClear: false,
    misere: false,
    queue: null,
    singles: 0,
    captureSizes: [2],
    capturesToWin: null,
    wormholes: 0,
    anyColour: false,
    singleColour: false,
    makerBreaker: false,
    flips: false,
    startingDiscs: STARTING_DISCS.none,
    ...overrides,
  };
}

/** The drop family: gravity columns, four in a row, a 7×7 or 9×9 board. */
function drop(overrides: Partial<VariantSpec> = {}): VariantSpec {
  return small({
    winLength: 4,
    placement: PLACEMENTS.drop,
    ...overrides,
    boardSizes: overrides.boardSizes ?? [7, 9, 10],
  });
}

/** A flipping game: an 8×8 board, no lines, and no reading of threats — there are none. */
function flipping(overrides: Partial<VariantSpec> = {}): VariantSpec {
  return small({ flips: true, analysis: false, ...overrides, boardSizes: overrides.boardSizes ?? REVERSI_SIZES });
}

/** The games that are not gomoku: a small board of their own and no opening protocol. */
function small(overrides: Partial<VariantSpec> & { boardSizes: readonly number[] }): VariantSpec {
  return plain({ allowFirstPlayerChoice: true, openings: FREE_ONLY, ...overrides });
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
      OPENING_RULES.sakata,
      OPENING_RULES.tarannikov,
      OPENING_RULES.pro,
      OPENING_RULES.longPro,
    ],
  }),
  omok: plain({ forbidden: { black: OMOK_PATTERNS, white: OMOK_PATTERNS } }),
  caro: plain({
    lineRule: { black: LINE_RULES.exactOpen, white: LINE_RULES.exactOpen },
  }),
  ninuki: plain({ captures: true, capturesToWin: 10, allowFirstPlayerChoice: true }),
  sannuki: plain({
    captures: true,
    captureSizes: [2, 3],
    capturesToWin: 15,
    allowFirstPlayerChoice: true,
  }),
  misereFive: plain({ misere: true, allowFirstPlayerChoice: true, openings: FREE_ONLY }),
  makerBreaker: small({
    anyColour: true,
    makerBreaker: true,
    boardSizes: [6],
    allowFirstPlayerChoice: false,
    analysis: false,
  }),
  wildTicTacToe: small({ winLength: 3, anyColour: true, boardSizes: [3], analysis: false }),
  notakto: small({
    winLength: 3,
    singleColour: true,
    misere: true,
    boardSizes: [3],
    allowFirstPlayerChoice: false,
    analysis: false,
  }),
  connect6: plain({
    stonesPerTurn: 2,
    winLength: 6,
    allowFirstPlayerChoice: true,
    openings: [OPENING_RULES.free],
  }),
  tictactoe: small({ winLength: 3, boardSizes: [3] }),
  trapThree: small({ winLength: 4, loseLength: 3, boardSizes: [5] }),
  /*
   * A torus: both pairs of edges join, so every intersection is a middle one
   * and no line can be shut down by running out of board.
   */
  toroidalFive: plain({
    winLength: null,
    allowFirstPlayerChoice: true,
    wrap: WRAP_MODES.both,
    openings: FREE_ONLY,
  }),
  /*
   * Dead squares and hotspots scattered by the seed: the same furniture the
   * drop family uses, on a board where the stones stay where they are put.
   */
  obstacleFive: plain({
    winLength: null,
    allowFirstPlayerChoice: true,
    openings: FREE_ONLY,
    deadSquares: 6,
    hotSquares: 2,
  }),
  dropFour: drop(),
  ringDrop: drop({ wrap: WRAP_MODES.columns }),
  holeDrop: drop({ deadSquares: 1 }),
  hotDrop: drop({ hotSquares: 1, deadSquares: 1 }),
  clearDrop: drop({ lineClear: true }),
  giveawayDrop: drop({ misere: true }),
  edgeDrop: small({ winLength: 4, placement: PLACEMENTS.edge, boardSizes: [7, 9, 10] }),
  wormDrop: drop({ wormholes: 2 }),
  dominoFive: plain({
    queue: PIECE_QUEUES.domino,
    allowFirstPlayerChoice: true,
    openings: FREE_ONLY,
    boardSizes: [13, 15, 19],
    analysis: false,
  }),
  blockFive: plain({
    queue: PIECE_QUEUES.tetro,
    singles: 6,
    allowFirstPlayerChoice: true,
    openings: FREE_ONLY,
    boardSizes: [13, 15, 19],
    analysis: false,
  }),
  twistFive: small({ winLength: 5, quadrantSize: 3, boardSizes: [6], analysis: false }),
  twistFour: small({ winLength: 4, quadrantSize: 2, boardSizes: [4], analysis: false }),
  squareFour: small({
    winLength: 4,
    pieces: 4,
    squareWins: true,
    boardSizes: [5],
    analysis: false,
  }),
  /*
   * The flipping games. `winLength` is pinned to nothing in particular, since
   * no line is ever read; what matters is the flip, the pass and the count.
   */
  reversi: flipping({ startingDiscs: STARTING_DISCS.fixed }),
  classicReversi: flipping({ startingDiscs: STARTING_DISCS.laid }),
  antiReversi: flipping({ startingDiscs: STARTING_DISCS.fixed, misere: true }),
  miniReversi: flipping({ startingDiscs: STARTING_DISCS.fixed, boardSizes: MINI_REVERSI_SIZES }),
  grandReversi: flipping({ startingDiscs: STARTING_DISCS.fixed, boardSizes: GRAND_REVERSI_SIZES }),
};

/** The board sizes a variant plays on. */
export function boardSizesFor(variant: RuleVariant): readonly number[] {
  return VARIANT_SPECS[variant].boardSizes ?? BOARD_SIZES;
}

export const GAME_STATUS = {
  playing: "playing",
  won: "won",
  draw: "draw",
} as const satisfies Record<GameStatus, GameStatus>;

export const MOVE_KINDS = {
  place: "place",
  skip: "skip",
  move: "move",
  piece: "piece",
  pass: "pass",
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

/** Every size any game here is played on, for the schemas at the API edge. */
export const ALL_BOARD_SIZES = [3, 4, 5, 6, 7, 9, 10, 13, 15, 19] as const;

export const BOARD_SIZE_DISPLAY: Record<
  number,
  { label: string; kanji: string; note: string }
> = {
  3: { label: "Three", kanji: "三路", note: "Tic-tac-toe" },
  4: { label: "Four", kanji: "四路", note: "Twist Four, Mini Reversi" },
  5: { label: "Five", kanji: "五路", note: "Trap Three, Square Four" },
  6: { label: "Six", kanji: "六路", note: "Twist Five, Mini Reversi" },
  7: { label: "Seven", kanji: "七路", note: "Drop Four" },
  8: { label: "Eight", kanji: "八路", note: "Reversi" },
  10: { label: "Ten", kanji: "十路", note: "The big drop board, Grand Reversi" },
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
  seed: 0,
  capturesToWin: DEFAULT_CAPTURES_TO_WIN,
  firstPlayer: FIRST_PLAYERS.black,
  obstacles: OBSTACLE_LAYOUTS.none,
  allowUndo: true,
  allowSkip: false,
  allowSwap: false,
  allowResize: false,
  swapsPerSeat: DEFAULT_SWAPS_PER_SEAT,
};

/** Black opens unless the settings say otherwise. */
export const FIRST_STONE: Stone = STONES.black;

export { COLUMN_LETTERS, DIRECTIONS, STAR_POINTS } from "./board.constants";
