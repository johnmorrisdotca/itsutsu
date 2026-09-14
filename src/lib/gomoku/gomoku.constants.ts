import type {
  WrapMode,
  Blocked,
  BoardGrid,
  CaptureChoice,
  CheckersRules,
  CrownMidCapture,
  EndgameCountKind,
  PieceTally,
  DrawLimit,
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
  halma: "halma",
  hex: "hex",
  checkers: "checkers",
  internationalDraughts: "internationalDraughts",
  brazilianDraughts: "brazilianDraughts",
  canadianCheckers: "canadianCheckers",
  russianDraughts: "russianDraughts",
  poolCheckers: "poolCheckers",
  chineseCheckers: "chineseCheckers",
  go: "go",
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
  RULE_VARIANTS.halma,
  RULE_VARIANTS.hex,
  RULE_VARIANTS.checkers,
  RULE_VARIANTS.internationalDraughts,
  RULE_VARIANTS.brazilianDraughts,
  RULE_VARIANTS.canadianCheckers,
  RULE_VARIANTS.russianDraughts,
  RULE_VARIANTS.poolCheckers,
  RULE_VARIANTS.chineseCheckers,
  RULE_VARIANTS.go,
] as const satisfies readonly RuleVariant[];

export const PLACEMENTS = {
  free: "free",
  drop: "drop",
  edge: "edge",
} as const satisfies Record<Placement, Placement>;

/** Where a game's stones sit when it is drawn its own way: on the crossings, or in the squares. */
export const BOARD_GRIDS = {
  lines: "lines",
  cells: "cells",
} as const satisfies Record<BoardGrid, BoardGrid>;

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
  camp: "camp",
  connection: "connection",
  blocked: "blocked",
  territory: "territory",
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
/** Halma's own board first; the small boards carry the camps the game is played with on them. */
const HALMA_SIZES = [16, 10, 8] as const;
/** Hex as it is played: eleven a side, with the bigger boards the federations also use. */
const HEX_SIZES = [11, 13, 19] as const;
/** Checkers: the 8×8 board draughts is played on everywhere. */
const CHECKERS_SIZES = [8] as const;

export const CAPTURE_CHOICES = {
  free: "free",
  maximum: "maximum",
} as const satisfies Record<CaptureChoice, CaptureChoice>;

export const CROWN_MID_CAPTURE = {
  stops: "stops",
  continues: "continues",
  passes: "passes",
} as const satisfies Record<CrownMidCapture, CrownMidCapture>;

export const ENDGAME_COUNT_KINDS = {
  endings: "endings",
  balance: "balance",
} as const satisfies Record<EndgameCountKind, EndgameCountKind>;

/**
 * English draughts, American checkers: three rows of men, a man takes forward
 * only, a king moves one square, any capture may be chosen, and a man crowned
 * by a capture ends the move there. Exactly what rules/checkers.ts did before
 * any of this was data, and the Checkers tests that predate it still say so.
 */
export const ENGLISH_CHECKERS_RULES: CheckersRules = {
  menRows: 3,
  menCaptureBackward: false,
  flyingKings: false,
  captureChoice: CAPTURE_CHOICES.free,
  crownMidCapture: CROWN_MID_CAPTURE.stops,
  /*
   * None, and that is this game as it has always been played HERE, not the
   * English rulebook: the WCDF also draws a threefold repetition. Declared as
   * absent rather than added in passing, so that changing how an existing game
   * ends is a decision somebody takes on its own, not a side effect of adding
   * its relatives. Its long-running backstop is the forty-move count in
   * rules/noProgress.ts.
   */
  repetitionDraw: null,
  endgameCounts: [],
};

/** International draughts' own board, as the FMJD plays it. */
const INTERNATIONAL_DRAUGHTS_SIZES = [10] as const;
/** Brazilian draughts: the international rules on the 8×8 board. */
const BRAZILIAN_DRAUGHTS_SIZES = [8] as const;
/** Canadian checkers: the international rules on a 12×12 board. */
const CANADIAN_CHECKERS_SIZES = [12] as const;

/** A lone king: what every endgame count below is counted against. */
const LONE_KING: PieceTally = { kings: 1, men: 0 };

/**
 * International draughts, from the FMJD's official rules (Annex 1, 2018, and
 * the 2024 Annexes). Men take both ways (4.1), kings fly (3.9, 4.3), the
 * capture taking the most pieces is compulsory with a king counting as one
 * piece (4.13), a man crossing the far row mid-capture stays a man (4.15), and
 * taken pieces come off only once the capture is over and may not be jumped
 * twice (4.8, 4.11).
 *
 * The draws of article 6: a third repetition with the same side to move
 * (6.1); three pieces, one at least a king, against a lone king, sixteen more
 * moves each (6.3); two kings, a king and a man, or a king against a lone king,
 * five more moves each (6.4). The twenty-five-move kings-only count (6.2) is
 * the no-progress rule in rules/noProgress.ts.
 *
 * NOT APPLIED: the 2024 clause that cuts 6.3's sixteen moves to five when the
 * lone king "solely occupies" the long diagonal. The text does not say whether
 * the king must hold the diagonal from the start of the count or at its end,
 * nor what leaving it does, and a rule this site cannot read exactly must not
 * fire. Without it those endings run to sixteen moves each, which is the older
 * rule and the generous side of the new one.
 */
export const INTERNATIONAL_DRAUGHTS_RULES: CheckersRules = {
  menRows: 4,
  menCaptureBackward: true,
  flyingKings: true,
  captureChoice: CAPTURE_CHOICES.maximum,
  crownMidCapture: CROWN_MID_CAPTURE.passes,
  repetitionDraw: 3,
  endgameCounts: [
    {
      kind: ENDGAME_COUNT_KINDS.endings,
      restartsOnChange: false,
      endings: [
        [{ kings: 3, men: 0 }, LONE_KING],
        [{ kings: 2, men: 1 }, LONE_KING],
        [{ kings: 1, men: 2 }, LONE_KING],
      ],
      movesEach: 16,
    },
    {
      kind: ENDGAME_COUNT_KINDS.endings,
      restartsOnChange: false,
      endings: [
        [{ kings: 2, men: 0 }, LONE_KING],
        [{ kings: 1, men: 1 }, LONE_KING],
        [LONE_KING, LONE_KING],
      ],
      movesEach: 5,
    },
  ],
};

/**
 * Brazilian draughts: the international rules of capture and crowning on 8×8,
 * with twelve men, and the draws of the Brazilian confederation's own rules
 * (CBJD, Regras Oficiais) rather than the FMJD's 8×8 set, which differs. A
 * third repetition (art. 98), and five moves each for the small endings of
 * art. 99: two kings against two, two kings against one, two kings against a
 * king and a man, a king against a king, a king against a king and a man. Its
 * twenty-move kings-only count is in rules/noProgress.ts.
 *
 * NOT APPLIED: art. 100, five moves for three pieces against a lone king on the
 * long diagonal, for the same reason as the FMJD's version of it above. With
 * it left out, those endings are bounded by the kings-only count instead.
 */
export const BRAZILIAN_DRAUGHTS_RULES: CheckersRules = {
  ...INTERNATIONAL_DRAUGHTS_RULES,
  menRows: 3,
  endgameCounts: [
    {
      kind: ENDGAME_COUNT_KINDS.endings,
      restartsOnChange: false,
      endings: [
        [{ kings: 2, men: 0 }, { kings: 2, men: 0 }],
        [{ kings: 2, men: 0 }, LONE_KING],
        [{ kings: 2, men: 0 }, { kings: 1, men: 1 }],
        [LONE_KING, LONE_KING],
        [LONE_KING, { kings: 1, men: 1 }],
      ],
      movesEach: 5,
    },
  ],
};

/**
 * Canadian checkers: the international rules on 12×12, thirty men a side in
 * five rows. No federation's draw rules for it could be found — the Quebec
 * association's own site did not answer — so its draws are the FMJD's,
 * borrowed, and its rules page says so.
 */
export const CANADIAN_CHECKERS_RULES: CheckersRules = {
  ...INTERNATIONAL_DRAUGHTS_RULES,
  menRows: 5,
};

/** Russian draughts and Pool checkers: both on the 8×8 board. */
const RUSSIAN_DRAUGHTS_SIZES = [8] as const;
const POOL_CHECKERS_SIZES = [8] as const;

/**
 * Russian draughts (shashki), from the Russian Draughts Federation's rules
 * (ФШР, shashki.ru) and the FMJD/IDF rules for 8×8 draughts: men take both ways,
 * kings fly, any capture may be chosen whatever it takes (FMJD-64 4.13), and a
 * man that reaches the far row in the middle of a capture is crowned there and
 * carries on capturing as a king (4.14).
 *
 * Draws, as the federation writes them: a third repetition with the same side
 * to move; three kings or more that have not taken a lone king by their
 * fifteenth move, counted from when that balance arose; and any ending in which
 * both sides have a king and nothing is taken or crowned for five moves (two or
 * three pieces on the board), thirty (four or five) or sixty (six or seven).
 * Fifteen moves of kings alone is rules/noProgress.ts.
 *
 * NOT APPLIED: the five-move count for three pieces against a lone king on the
 * main road, for the reason given at INTERNATIONAL_DRAUGHTS_RULES; the "clearly
 * drawn position", which is an arbiter's judgement and not a count; and the
 * three-kings rule's "or kings and men", which the federation's own text leaves
 * unclear. It is read as kings alone, the narrower reading, so it never draws a
 * game it might not apply to.
 */
export const RUSSIAN_DRAUGHTS_RULES: CheckersRules = {
  menRows: 3,
  menCaptureBackward: true,
  flyingKings: true,
  captureChoice: CAPTURE_CHOICES.free,
  crownMidCapture: CROWN_MID_CAPTURE.continues,
  repetitionDraw: 3,
  endgameCounts: [
    {
      kind: ENDGAME_COUNT_KINDS.endings,
      restartsOnChange: true,
      // Three kings or more — up to the twelve a side can have — against a lone king.
      endings: Array.from({ length: 10 }, (_, extra) => [{ kings: 3 + extra, men: 0 }, LONE_KING] as const),
      movesEach: 15,
    },
    { kind: ENDGAME_COUNT_KINDS.balance, pieces: [2, 3], movesEach: 5 },
    { kind: ENDGAME_COUNT_KINDS.balance, pieces: [4, 5], movesEach: 30 },
    { kind: ENDGAME_COUNT_KINDS.balance, pieces: [6, 7], movesEach: 60 },
  ],
};

/**
 * Pool checkers, from the American Pool Checker Association's Tournament Rules
 * of Play (2016): men take both ways (rule 14), kings fly (15, 18), any capture
 * may be chosen — "not compelled to take the greater or lesser number" (20) —
 * and a capture once begun is completed (21). A man that must jump on out of
 * the king row stays a man, and one whose move ends there is crowned (22, 23).
 * Black moves first (7).
 *
 * The one count of the APCA's this site can read is the thirteen count (27):
 * three kings against a lone king, all four kings, drawn once the lone king has
 * made thirteen moves. Counted here as thirteen moves each, which is that
 * exactly when the lone king moves second in the ending and one move later for
 * the stronger side when it moves first — the generous side. There is no
 * repetition rule: the APCA has none outside its thirty-move rule.
 *
 * NOT APPLIED: the thirty-move rule (26), which the weaker side announces and
 * counts, in endgames the players themselves identify. Nobody announces
 * anything here, and a count that fired unasked would be a different rule. Nor
 * the five-move count for a lone king on the long line (28), as above. A game
 * going nowhere is ended instead by the site's own forty-move count in
 * rules/noProgress.ts, the same as Checkers', and the rules page says so.
 */
export const POOL_CHECKERS_RULES: CheckersRules = {
  menRows: 3,
  menCaptureBackward: true,
  flyingKings: true,
  captureChoice: CAPTURE_CHOICES.free,
  crownMidCapture: CROWN_MID_CAPTURE.passes,
  repetitionDraw: null,
  endgameCounts: [
    {
      kind: ENDGAME_COUNT_KINDS.endings,
      restartsOnChange: false,
      endings: [[{ kings: 3, men: 0 }, LONE_KING]],
      movesEach: 13,
    },
  ],
};
/** Chinese Checkers: the standard 121-hole hexagram, embedded in its own 17×17 square. */
const CHINESE_CHECKERS_SIZES = [17] as const;
/** Go's own three sizes: 19×19 as it is played seriously, 13 and 9 for a shorter game. */
const GO_SIZES = [19, 13, 9] as const;

/**
 * What a row may set, less the one thing no builder supplies for it: where
 * its stones sit is declared by every game and never defaulted, so a new game
 * that leaves it out does not compile rather than getting a guess.
 */
type SpecOverrides = Partial<VariantSpec> & Pick<VariantSpec, "grid">;

function plain(overrides: SpecOverrides): VariantSpec {
  return {
    lineRule: { black: LINE_RULES.atLeast, white: LINE_RULES.atLeast },
    forbidden: { black: NO_PATTERNS, white: NO_PATTERNS },
    captures: false,
    stonesPerTurn: 1,
    firstTurnStones: 1,
    winLength: WIN_LENGTH,
    allowFirstPlayerChoice: false,
    firstStone: STONES.black,
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
    camps: false,
    connects: false,
    checkers: false,
    checkersRules: null,
    chineseCheckers: false,
    go: false,
    ...overrides,
  };
}

/** The drop family: gravity columns, four in a row, a 7×7 or 9×9 board. A piece falls into a slot, so the whole family is drawn in the squares. */
function drop(overrides: Partial<VariantSpec> = {}): VariantSpec {
  return small({
    winLength: 4,
    placement: PLACEMENTS.drop,
    grid: BOARD_GRIDS.cells,
    ...overrides,
    boardSizes: overrides.boardSizes ?? [7, 9, 10],
  });
}

/** A flipping game: an 8×8 board of squares, as Othello's is, and no reading of threats — there are none. */
function flipping(overrides: Partial<VariantSpec> = {}): VariantSpec {
  return small({ flips: true, analysis: false, grid: BOARD_GRIDS.cells, ...overrides, boardSizes: overrides.boardSizes ?? REVERSI_SIZES });
}

/** The games that are not gomoku: a small board of their own and no opening protocol. */
function small(overrides: SpecOverrides & { boardSizes: readonly number[] }): VariantSpec {
  return plain({ allowFirstPlayerChoice: true, openings: FREE_ONLY, ...overrides });
}

/**
 * A draughts game played as its federation writes it, on its own board: in the
 * squares, with no reading of lines, and the first move where the rulebook puts
 * it — White in international, Brazilian, Canadian and Russian draughts (FMJD
 * 3.3, CBJD, FSR), Black in pool checkers (APCA rule 7). Not a choice at the
 * board, because the rulebook does not make it one.
 */
function federationDraughts(rules: CheckersRules, boardSizes: readonly number[], firstStone: Stone): VariantSpec {
  return small({
    grid: BOARD_GRIDS.cells,
    checkers: true,
    checkersRules: rules,
    boardSizes,
    analysis: false,
    allowFirstPlayerChoice: false,
    firstStone,
  });
}

/**
 * Every rule set, as data. The engine reads these and never the variant name,
 * so a new variant is a new row here plus its copy in `variants.constants.ts`.
 */
export const VARIANT_SPECS: Record<RuleVariant, VariantSpec> = {
  freestyle: plain({ grid: BOARD_GRIDS.lines, winLength: null, allowFirstPlayerChoice: true }),
  standard: plain({
    grid: BOARD_GRIDS.lines,
    lineRule: { black: LINE_RULES.exact, white: LINE_RULES.exact },
  }),
  renju: plain({
    grid: BOARD_GRIDS.lines,
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
  omok: plain({ grid: BOARD_GRIDS.lines, forbidden: { black: OMOK_PATTERNS, white: OMOK_PATTERNS } }),
  /*
   * The one five-in-a-row game drawn in the squares. Caro is played on
   * squared paper with the marks written inside the squares, and its name is
   * the French carreau — the squares themselves.
   */
  caro: plain({
    grid: BOARD_GRIDS.cells,
    lineRule: { black: LINE_RULES.exactOpen, white: LINE_RULES.exactOpen },
  }),
  ninuki: plain({ grid: BOARD_GRIDS.lines, captures: true, capturesToWin: 10, allowFirstPlayerChoice: true }),
  sannuki: plain({
    grid: BOARD_GRIDS.lines,
    captures: true,
    captureSizes: [2, 3],
    capturesToWin: 15,
    allowFirstPlayerChoice: true,
  }),
  misereFive: plain({ grid: BOARD_GRIDS.lines, misere: true, allowFirstPlayerChoice: true, openings: FREE_ONLY }),
  // Tic-tac-toe's family: noughts and crosses IN the squares, however much the rules share with gomoku.
  makerBreaker: small({
    grid: BOARD_GRIDS.cells,
    anyColour: true,
    makerBreaker: true,
    boardSizes: [6],
    allowFirstPlayerChoice: false,
    analysis: false,
  }),
  wildTicTacToe: small({ grid: BOARD_GRIDS.cells, winLength: 3, anyColour: true, boardSizes: [3], analysis: false }),
  notakto: small({
    grid: BOARD_GRIDS.cells,
    winLength: 3,
    singleColour: true,
    misere: true,
    boardSizes: [3],
    allowFirstPlayerChoice: false,
    analysis: false,
  }),
  connect6: plain({
    grid: BOARD_GRIDS.lines,
    stonesPerTurn: 2,
    winLength: 6,
    allowFirstPlayerChoice: true,
    openings: [OPENING_RULES.free],
  }),
  tictactoe: small({ grid: BOARD_GRIDS.cells, winLength: 3, boardSizes: [3] }),
  // Squava: a 5×5 board of squares, played in them.
  trapThree: small({ grid: BOARD_GRIDS.cells, winLength: 4, loseLength: 3, boardSizes: [5] }),
  /*
   * A torus: both pairs of edges join, so every intersection is a middle one
   * and no line can be shut down by running out of board.
   */
  toroidalFive: plain({
    grid: BOARD_GRIDS.lines,
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
    grid: BOARD_GRIDS.lines,
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
  edgeDrop: small({ grid: BOARD_GRIDS.cells, winLength: 4, placement: PLACEMENTS.edge, boardSizes: [7, 9, 10] }),
  wormDrop: drop({ wormholes: 2 }),
  // The piece games are this site's own, laid on go boards in stones rather than tiles, so they keep the house lines.
  dominoFive: plain({
    grid: BOARD_GRIDS.lines,
    queue: PIECE_QUEUES.domino,
    allowFirstPlayerChoice: true,
    openings: FREE_ONLY,
    boardSizes: [13, 15, 19],
    analysis: false,
  }),
  blockFive: plain({
    grid: BOARD_GRIDS.lines,
    queue: PIECE_QUEUES.tetro,
    singles: 6,
    allowFirstPlayerChoice: true,
    openings: FREE_ONLY,
    boardSizes: [13, 15, 19],
    analysis: false,
  }),
  // The twist games: marbles in the holes of turning quadrants, as the published game has them.
  twistFive: small({ grid: BOARD_GRIDS.cells, winLength: 5, quadrantSize: 3, boardSizes: [6], analysis: false }),
  twistFour: small({ grid: BOARD_GRIDS.cells, winLength: 4, quadrantSize: 2, boardSizes: [4], analysis: false }),
  // Teeko's board is twenty-five points joined by lines, and the pieces stand on the points.
  squareFour: small({
    grid: BOARD_GRIDS.lines,
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
  halma: small({ grid: BOARD_GRIDS.cells, camps: true, analysis: false, boardSizes: HALMA_SIZES }),
  // On the crossings of a triangular lattice, as a wooden Hex board is ruled: see HEX_LATTICE.
  hex: small({ grid: BOARD_GRIDS.lines, connects: true, analysis: false, boardSizes: HEX_SIZES, openings: [OPENING_RULES.free, OPENING_RULES.swap] }),
  /*
   * Checkers: no lines, no captures-to-win tally of its own — the capture is
   * the whole of the move, worked out fresh by rules/checkers.ts rather than
   * read from `captures` or `captureSizes`, which belong to the flanking
   * capture of the Ninuki family and mean nothing here.
   */
  checkers: small({
    grid: BOARD_GRIDS.cells,
    checkers: true,
    checkersRules: ENGLISH_CHECKERS_RULES,
    boardSizes: CHECKERS_SIZES,
    analysis: false,
  }),
  /*
   * The international family: men that take backward, kings that fly, the
   * longest capture compulsory, and no crown for a man only passing the far row.
   * One set of rules on three boards — see INTERNATIONAL_DRAUGHTS_RULES for the
   * articles, and where Brazil's and Canada's differ.
   */
  internationalDraughts: federationDraughts(INTERNATIONAL_DRAUGHTS_RULES, INTERNATIONAL_DRAUGHTS_SIZES, STONES.white),
  brazilianDraughts: federationDraughts(BRAZILIAN_DRAUGHTS_RULES, BRAZILIAN_DRAUGHTS_SIZES, STONES.white),
  canadianCheckers: federationDraughts(CANADIAN_CHECKERS_RULES, CANADIAN_CHECKERS_SIZES, STONES.white),
  /*
   * The free-choice games: kings fly and men take backward as in the
   * international family, but any capture may be chosen. Russian draughts
   * crowns a man mid-capture and lets it take on as a king; pool checkers does
   * not crown it unless the capture ends there. See RUSSIAN_DRAUGHTS_RULES and
   * POOL_CHECKERS_RULES for the articles.
   */
  russianDraughts: federationDraughts(RUSSIAN_DRAUGHTS_RULES, RUSSIAN_DRAUGHTS_SIZES, STONES.white),
  poolCheckers: federationDraughts(POOL_CHECKERS_RULES, POOL_CHECKERS_SIZES, STONES.black),
  /*
   * Chinese Checkers: a hexagram, not a square — see rules/chineseCheckers.ts
   * for how it is embedded in a Point{row,col} grid at all. Otherwise a race
   * exactly like Halma's, so it shares `camp` as its win reason.
   */
  chineseCheckers: small({
    // Marbles in holes at the points of a lattice. No grid is drawn at all — BoardLines hides it — but the points are what they are.
    grid: BOARD_GRIDS.lines,
    chineseCheckers: true,
    boardSizes: CHINESE_CHECKERS_SIZES,
    analysis: false,
  }),
  /*
   * Go: nothing here ever moves and no line ever decides anything — see
   * rules/go.ts for the liberties, the capture, the ko rule and the count.
   * Black always opens, as at the real board; no opening protocol applies.
   */
  go: small({
    grid: BOARD_GRIDS.lines,
    go: true,
    boardSizes: GO_SIZES,
    allowFirstPlayerChoice: false,
    analysis: false,
  }),
};

/** The board sizes a variant plays on. */
export function boardSizesFor(variant: RuleVariant): readonly number[] {
  return VARIANT_SPECS[variant].boardSizes ?? BOARD_SIZES;
}

/**
 * The board this variant will actually be played on, given a size somebody
 * asked for. A game with a board of its own gets that board.
 *
 * `normaliseSettings` has always done this when it builds a state, so the
 * board a player sees was never wrong. What could be wrong was the row: a
 * Reversi game could be stored at 19×19, shown as 19×19 on its page and in
 * its record, and played on the 8×8 board Reversi actually has. Anything
 * writing a size to the database asks here first, so the row and the board
 * cannot disagree.
 */
export function sizeForVariant(variant: RuleVariant, size: number): number {
  const sizes = VARIANT_SPECS[variant].boardSizes;
  return sizes === null || sizes.includes(size) ? size : sizes[0];
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
  // Written by a claimed timeout alone. See MoveKind.
  forfeit: "forfeit",
} as const satisfies Record<MoveKind, MoveKind>;

/** How a written move list says the two moves that have no point. */
export const STONELESS_WORDS = {
  pass: "pass",
  forfeit: "timed out",
} as const satisfies Partial<Record<MoveKind, string>>;

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
export const ALL_BOARD_SIZES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 19] as const;

export const BOARD_SIZE_DISPLAY: Record<
  number,
  { label: string; kanji: string; note: string }
> = {
  3: { label: "Three", kanji: "三路", note: "Tic-tac-toe" },
  4: { label: "Four", kanji: "四路", note: "Twist Four, Mini Reversi" },
  5: { label: "Five", kanji: "五路", note: "Trap Three, Square Four" },
  6: { label: "Six", kanji: "六路", note: "Twist Five, Mini Reversi" },
  7: { label: "Seven", kanji: "七路", note: "Drop Four" },
  8: { label: "Eight", kanji: "八路", note: "Reversi, small Halma, Checkers and the 8×8 draughts games" },
  10: { label: "Ten", kanji: "十路", note: "The big drop board, Grand Reversi, Halma, International Draughts" },
  11: { label: "Eleven", kanji: "十一路", note: "Hex" },
  12: { label: "Twelve", kanji: "十二路", note: "Canadian Checkers" },
  16: { label: "Sixteen", kanji: "十六路", note: "Halma" },
  17: { label: "Seventeen", kanji: "十七路", note: "Chinese Checkers" },
  9: { label: "Mini", kanji: "小盤", note: "Quick game" },
  13: { label: "Medium", kanji: "中盤", note: "Shorter game" },
  15: { label: "Standard", kanji: "正盤", note: "Tournament size" },
  19: { label: "Go board", kanji: "碁盤", note: "Long game" },
};

export const DEFAULT_BOARD_SIZE = 15;

export const DEFAULT_SWAPS_PER_SEAT = 1;

/**
 * The shares of the board a game may be called a draw at.
 *
 * A fraction rather than a number of moves, so one setting means the same
 * thing on every board: half of a 9x9 is forty moves and half of a 19x19 is
 * a hundred and eighty, and neither needs anybody to work it out. `none` is
 * the default and is how every game here behaved before this existed.
 */
export const DRAW_LIMITS = {
  none: "none",
  half: "half",
  threeQuarters: "threeQuarters",
} as const satisfies Record<DrawLimit, DrawLimit>;

export const DRAW_LIMIT_LIST: readonly DrawLimit[] = [
  DRAW_LIMITS.none,
  DRAW_LIMITS.half,
  DRAW_LIMITS.threeQuarters,
];

/**
 * The rule: what share of the board's points may be played before a game
 * with no winner is a draw. Null plays it out. Kept apart from the words
 * below the way VARIANT_SPECS is kept apart from RULE_VARIANT_DISPLAY — one
 * of them decides what happens, the other only says it.
 */
/**
 * The smallest board a length means anything on, in points.
 *
 * Nine by nine. Below it a game is over long before any share of the board
 * could matter — a 3×3 has nine points and is finished in nine moves, so
 * "half the board" is four, and cutting a game of noughts and crosses short
 * at four moves is not a rule, it is a bug with a setting in front of it.
 * The whole reason for a length is a board big enough that two careful
 * players can fail to resolve it, and that starts here.
 */
export const DRAW_LIMIT_MIN_POINTS = 81;

export const DRAW_LIMIT_SHARE: Record<DrawLimit, number | null> = {
  none: null,
  half: 1 / 2,
  threeQuarters: 3 / 4,
};

export const DRAW_LIMIT_DISPLAY: Record<DrawLimit, { label: string; kanji: string; blurb: string }> = {
  none: {
    label: "Play it out",
    kanji: "無制限",
    blurb: "No limit. The game ends when somebody wins or the board fills.",
  },
  half: {
    label: "Half the board",
    kanji: "半盤",
    blurb: "A draw once half as many moves as the board has points have been played with nobody winning.",
  },
  threeQuarters: {
    label: "Three quarters",
    kanji: "四分三",
    blurb: "A draw once three quarters as many moves as the board has points have been played with nobody winning.",
  },
};

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
  drawLimit: DRAW_LIMITS.none,
};

/** Black opens unless the settings say otherwise. */
export const FIRST_STONE: Stone = STONES.black;

export { COLUMN_LETTERS, DIRECTIONS, STAR_POINTS } from "./board.constants";
