import type {
  AwarenessLevel,
  HintPolicy,
  SessionSettings,
} from "./game.types";

export const AWARENESS_LEVELS = {
  off: "off",
  outlook: "outlook",
  full: "full",
} as const satisfies Record<AwarenessLevel, AwarenessLevel>;

export const AWARENESS_DISPLAY: Record<
  AwarenessLevel,
  { label: string; kanji: string; description: string }
> = {
  off: {
    label: "Off",
    kanji: "無",
    description: "Read the board yourself.",
  },
  outlook: {
    label: "Tell me how it stands",
    kanji: "形勢",
    description: "You are told when you are winning or in trouble, never where.",
  },
  full: {
    label: "Show me the threats",
    kanji: "急所",
    description: "Threats that must be answered are marked on the board.",
  },
};

export const HINT_POLICIES = {
  off: "off",
  limited: "limited",
  unlimited: "unlimited",
} as const satisfies Record<HintPolicy, HintPolicy>;

export const HINT_POLICY_DISPLAY: Record<
  HintPolicy,
  { label: string; kanji: string; description: string }
> = {
  off: { label: "No hints", kanji: "無", description: "The engine stays quiet." },
  limited: {
    label: "An allowance each",
    kanji: "持ち駒",
    description: "Spend them when you like, or give one to your opponent.",
  },
  unlimited: {
    label: "Ask any time",
    kanji: "自在",
    description: "The engine answers every time you ask.",
  },
};

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  awareness: AWARENESS_LEVELS.outlook,
  hintPolicy: HINT_POLICIES.limited,
  hintsPerSeat: 3,
  timeControl: "none",
  earlyWarning: false,
  showWinChance: false,
};

export const DEFAULT_SEAT_NAMES = { one: "", two: "" } as const;

/** Copy for the controls and the panels around the board. */
export const GAME_COPY = {
  undo: { label: "Undo", kanji: "待った" },
  redo: { label: "Redo", kanji: "進む" },
  newGame: { label: "New game", kanji: "新局" },
  skip: { label: "Skip turn", kanji: "捨て石" },
  skipHint: "Spends your turn on a far corner. It still costs you a stone.",
  swap: { label: "Swap seats", kanji: "駒交換" },
  swapHint:
    "Hand over your colour and take your opponent's stones instead. It costs you this move.",
  hint: { label: "Best move", kanji: "手筋" },
  grant: { label: "Give a hint", kanji: "献上" },
  grantHint: "Give one of your hints to your opponent.",
  askHelp: { label: "Ask for advice", kanji: "助言" },
  askHelpHint: "Your opponent marks the point they think you should play.",
  helpWaiting: "Mark the point you would play.",
  cancelHelp: { label: "Never mind", kanji: "取消" },
  moveHistory: { label: "Record", kanji: "棋譜" },
  settings: { label: "Settings", kanji: "設定" },
  advanced: { label: "Advanced", kanji: "詳細" },
  appearance: { label: "Appearance", kanji: "見た目" },
  noHintsLeft: "No hints left.",
  swapUnavailableDecided: "The position is already decided — no stealing it.",
  swapUnavailableSpent: "You have used your swap.",
  emptyRecord: "No stones yet.",
  clock: { label: "Clock", kanji: "時計" },
  byoyomi: { label: "Byoyomi", kanji: "秒読み" },
  stats: { label: "This game", kanji: "内容" },
  winChance: { label: "Chance of winning", kanji: "形勢" },
  winChanceNote: "An estimate from the shape on the board, not a solved value.",
  earlyWarning: { label: "Warn early", kanji: "予兆" },
  earlyWarningHint:
    "Warn each side before the other can build an open three, not just once one exists. Both players get it, so it stays fair — but it makes a game harder to win.",
  building: { label: "Something is forming", kanji: "予兆" },
  buildingDetail:
    "Your opponent can start an open three here next move. Nothing is forced yet.",
  outOfTime: "out of time",
} as const;
