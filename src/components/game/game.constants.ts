import type {
  AwarenessLevel,
  HistoryMode,
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

export const HISTORY_MODES = {
  review: "review",
  branch: "branch",
} as const satisfies Record<HistoryMode, HistoryMode>;

export const HISTORY_MODE_DISPLAY: Record<
  HistoryMode,
  { label: string; kanji: string; description: string }
> = {
  review: {
    label: "Read only",
    kanji: "並べ替え",
    description:
      "Step through the game without changing it. Return to the last move to play on.",
  },
  branch: {
    label: "Play from here",
    kanji: "分岐",
    description:
      "Play from an earlier position. Everything after it is discarded, and you are asked first.",
  },
};

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  awareness: AWARENESS_LEVELS.outlook,
  hintPolicy: HINT_POLICIES.limited,
  hintsPerSeat: 3,
  timeControl: "none",
  // Read only by default: losing moves you have already played should never be
  // the accidental outcome of clicking through the record.
  historyMode: HISTORY_MODES.review,
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
  reviewing: { label: "Reviewing", kanji: "検討" },
  reviewingDetail: "You are looking at an earlier position.",
  returnToLatest: { label: "Back to the game", kanji: "戻る" },
  branchTitle: "Play from here?",
  branchConfirm: { label: "Discard and play", kanji: "分岐" },
  branchCancel: { label: "Cancel", kanji: "取消" },
  opening: { label: "Opening", kanji: "布石" },
  lineLength: { label: "Line", kanji: "連" },
  lineLengthHint: "Stones in a row needed to win.",
  takeBlack: { label: "Take black", kanji: "黒番" },
  takeWhite: { label: "Take white", kanji: "白番" },
  extendOpening: { label: "Add two stones", kanji: "二手追加" },
  extendOpeningHint:
    "Lay one white and one black stone, then your opponent chooses the colour.",
  chooseColour: "choose a colour",
  chooseColourOrExtend: "choose a colour, or add two stones",
  laysThree: "lays the first three stones: black, white, black.",
  laysTwo: "adds two stones: white, then black.",
  opensAtTengen: "Black opens at tengen, the centre point.",
  rifWhite: "White's first stone must touch tengen, inside the central 3×3.",
  rifBlack: "Black's second stone must land inside the central 5×5.",
  proBlack: "Black's second stone must land outside the central 5×5.",
  longProBlack: "Black's second stone must land outside the central 7×7.",
  captures: { label: "Captures", kanji: "取り" },
  capturesToWin: (pairs: number) => `${pairs} pairs win`,
  winsByCaptures: (pairs: number) => `wins by capturing ${pairs} pairs`,
  stoneOfTurn: (placed: number, total: number) => `Stone ${placed} of ${total} this turn`,
  forbiddenNote: (colour: string, shapes: string) =>
    `${colour} may not play the points marked ✕: ${shapes}.`,
  browser: { label: "Games", kanji: "遊び方" },
  browserTitle: "Choose a game",
  browserIntro:
    "Every game here is a line of stones at heart. Pick the rules, then an opening if the variant offers one. Changing either starts a new game.",
  browserOpenings: { label: "Openings", kanji: "布石" },
  browserPlay: (name: string) => `Play ${name}`,
  browserCurrent: "Playing now",
  browserUse: "Use this opening",
  browserClose: "Close",
  sharedOpeningNote: "Shared games start with the free opening.",
  handicap: { label: "Handicap", kanji: "置き碁" },
  handicapHint:
    "One colour plays under the rules of a harder game while the other plays the plain one. Seat swaps are off while a handicap is set.",
  handicapNone: "None",
  handicapFor: (colour: string) => `${colour} plays with a handicap`,
  secondStone: { label: "Second stone", kanji: "二手目" },
  secondStoneHint: "Where the handicapped colour's second stone may go.",
  review: { label: "Review", kanji: "感想戦" },
  reviewEmpty: "Nothing to say yet. Finish the game and the review appears here.",
  reviewOtherRules: "Under other rules",
  reviewForbidden: (move: string, colour: string, variant: string, shape: string) =>
    `Move ${move} by ${colour} would not have been allowed in ${variant}: ${shape}.`,
  reviewWouldNotWin: (colour: string, variant: string) =>
    `${colour}'s winning line would not have counted in ${variant}.`,
  reviewEarlierWin: (move: string, colour: string, variant: string) =>
    `In ${variant} the game would already have been ${colour}'s at move ${move}.`,
  reviewCapture: (move: string, colour: string, variant: string) =>
    `In ${variant}, move ${move} by ${colour} would have captured a pair.`,
  reviewRecovered: (who: string, count: number) =>
    `${who} made ${count === 1 ? "a losing move" : `${count} losing moves`} and still won. The other side had the win and let it go.`,
  reviewClean: (who: string) => `${who} never gave the game away.`,
  reviewStreak: (who: string, streak: number) =>
    `${who}'s ${ordinal(streak)} win in a row.`,
  reviewFirstWin: (who: string) => `${who}'s first recorded win.`,
} as const;

function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
