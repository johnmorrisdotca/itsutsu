import type { ProgressMeasure } from "@/lib/gomoku/rules/noProgress";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import type {
  AwarenessLevel,
  HistoryMode,
  HintPolicy,
  SessionSettings,
} from "./game.types";

/**
 * An action or a heading: its words in the reader's language and the kanji
 * beside them. An English reader sees the English with its kanji; a Japanese
 * reader sees the Japanese words alone, so the kanji is dropped.
 */
export function pairOf(say: Speaker, key: PhraseKey, kanji: string): { label: string; kanji: string } {
  return { label: say.say(key), kanji: say.pairsWithKanji ? kanji : "" };
}

export const AWARENESS_LEVELS = {
  off: "off",
  outlook: "outlook",
  full: "full",
} as const satisfies Record<AwarenessLevel, AwarenessLevel>;

/** What each way of reading the board is called, and what it does, for the reader. */
export const awarenessDisplay = (say: Speaker): Record<AwarenessLevel, { label: string; kanji: string; description: string }> => ({
  off: { ...pairOf(say, "game.awarenessOff", "無"), description: say.say("game.awarenessOffDescription") },
  outlook: { ...pairOf(say, "game.awarenessOutlook", "形勢"), description: say.say("game.awarenessOutlookDescription") },
  full: { ...pairOf(say, "game.awarenessFull", "急所"), description: say.say("game.awarenessFullDescription") },
});

export const HINT_POLICIES = {
  off: "off",
  limited: "limited",
  unlimited: "unlimited",
} as const satisfies Record<HintPolicy, HintPolicy>;

export const hintPolicyDisplay = (say: Speaker): Record<HintPolicy, { label: string; kanji: string; description: string }> => ({
  off: { ...pairOf(say, "game.hintOff", "無"), description: say.say("game.hintOffDescription") },
  limited: { ...pairOf(say, "game.hintLimited", "持ち駒"), description: say.say("game.hintLimitedDescription") },
  unlimited: { ...pairOf(say, "game.hintUnlimited", "自在"), description: say.say("game.hintUnlimitedDescription") },
});

export const HISTORY_MODES = {
  review: "review",
  branch: "branch",
} as const satisfies Record<HistoryMode, HistoryMode>;

export const historyModeDisplay = (say: Speaker): Record<HistoryMode, { label: string; kanji: string; description: string }> => ({
  review: { ...pairOf(say, "game.historyReview", "並べ替え"), description: say.say("game.historyReviewDescription") },
  branch: { ...pairOf(say, "game.historyBranch", "分岐"), description: say.say("game.historyBranchDescription") },
});

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  awareness: AWARENESS_LEVELS.outlook,
  hintPolicy: HINT_POLICIES.limited,
  hintsPerSeat: 3,
  timeControl: "none",
  // Read only by default: losing moves you have already played should never be
  // the accidental outcome of clicking through the record.
  historyMode: HISTORY_MODES.review,
  earlyWarning: false,
  showAdvantage: false,
};

export const DEFAULT_SEAT_NAMES = { one: "", two: "" } as const;

/** Copy for the controls and the panels around the board. */
export const gameCopy = (say: Speaker) => {
  const pair = (key: PhraseKey, kanji: string) => pairOf(say, key, kanji);
  return {
  undo: pair("game.undo", "待った"),
  redo: pair("game.redo", "進む"),
  newGame: pair("game.newGame", "新局"),
  skip: pair("game.skip", "捨て石"),
  skipHint: say.say("game.skipHint"),
  passHint: say.say("game.passHint"),
  swap: pair("game.swap", "交代"),
  swapHint: say.say("game.swapHint"),
  hint: pair("game.hint", "手筋"),
  grant: pair("game.grant", "献上"),
  grantHint: say.say("game.grantHint"),
  askHelp: pair("game.askHelp", "助言"),
  askHelpHint: say.say("game.askHelpHint"),
  helpWaiting: say.say("game.helpWaiting"),
  cancelHelp: pair("game.cancelHelp", "取消"),
  moveHistory: pair("game.moveHistory", "棋譜"),
  settings: pair("game.settings", "設定"),
  advanced: pair("game.advanced", "詳細"),
  appearance: pair("game.appearance", "見た目"),
  noHintsLeft: say.say("game.noHintsLeft"),
  swapUnavailableDecided: say.say("game.swapUnavailableDecided"),
  swapUnavailableSpent: say.say("game.swapUnavailableSpent"),
  emptyRecord: say.say("game.emptyRecord"),
  clock: pair("game.clock", "時計"),
  byoyomi: pair("game.byoyomi", "秒読み"),
  stats: pair("game.stats", "内容"),
  advantage: pair("game.advantage", "形勢"),
  advantageHint: say.say("game.advantageHint"),
  earlyWarning: pair("game.earlyWarning", "予兆"),
  earlyWarningHint: say.say("game.earlyWarningHint"),
  building: pair("game.building", "予兆"),
  buildingDetail: say.say("game.buildingDetail"),
  outOfTime: say.say("game.outOfTime"),
  grow: pair("game.grow", "拡張"),
  shrink: pair("game.shrink", "縮小"),
  resizeHint: say.say("game.resizeHint"),
  resizeAgree: pair("game.resizeAgree", "同意"),
  resizeDecline: pair("game.resizeDecline", "辞退"),
  shrinkBlocked: say.say("game.shrinkBlocked"),
  reviewing: pair("game.reviewing", "検討"),
  reviewingDetail: say.say("game.reviewingDetail"),
  /** The banner over the board at the latest position: always drawn, so the board never moves (`ReviewBanner`). */
  atLatest: pair("game.atLatest", "現局"),
  atLatestDetail: say.say("game.atLatestDetail"),
  returnToLatest: pair("game.returnToLatest", "戻る"),
  branchTitle: say.say("game.branchTitle"),
  branchConfirm: pair("game.branchConfirm", "分岐"),
  branchCancel: pair("game.branchCancel", "取消"),
  opening: pair("game.opening", "布石"),
  lineLength: pair("game.lineLength", "連"),
  lineLengthHint: say.say("game.lineLengthHint"),
  takeBlack: pair("game.takeBlack", "黒番"),
  takeWhite: pair("game.takeWhite", "白番"),
  extendOpening: pair("game.extendOpening", "二手追加"),
  extendOpeningHint: say.say("game.extendOpeningHint"),
  chooseColour: (who: string) => say.say("game.chooseColour", { who }),
  chooseColourOrExtend: (who: string) => say.say("game.chooseColourOrExtend", { who }),
  laysThree: (who: string) => say.say("game.laysThree", { who }),
  laysTwo: (who: string) => say.say("game.laysTwo", { who }),
  opensAtTengen: say.say("game.opensAtTengen"),
  rifWhite: say.say("game.rifWhite"),
  rifBlack: say.say("game.rifBlack"),
  sakataFifth: say.say("game.sakataFifth"),
  nestedStone: (laid: number) => say.say("game.nestedStone", { n: String(laid + 1), side: String(2 * laid + 1) }),
  proBlack: say.say("game.proBlack"),
  longProBlack: say.say("game.longProBlack"),
  captures: pair("game.captures", "取り"),
  capturesToWin: (stones: number) => say.say("game.capturesToWin", { stones: String(stones) }),
  winsByCaptures: (who: string, stones: number) => say.say("game.winsByCaptures", { who, stones: String(stones) }),
  stoneOfTurn: (placed: number, total: number) => say.say("game.stoneOfTurn", { placed: String(placed), total: String(total) }),
  forbiddenNote: (colour: string, shapes: string) => say.say("game.forbiddenNote", { colour, shapes }),
  browser: pair("game.browser", "種目"),
  browserTitle: say.say("game.browserTitle"),
  browserIntro: say.say("game.browserIntro"),
  browserOpenings: pair("game.browserOpenings", "布石"),
  browserPlay: (name: string) => say.say("game.browserPlay", { name }),
  browserCurrent: say.say("game.browserCurrent"),
  browserUse: say.say("game.browserUse"),
  browserClose: say.say("game.browserClose"),
  sharedOpeningNote: say.say("game.sharedOpeningNote"),
  handicap: pair("game.handicap", "置き碁"),
  handicapHint: say.say("game.handicapHint"),
  handicapNone: say.say("game.handicapNone"),
  handicapFor: (colour: string) => say.say("game.handicapFor", { colour }),
  secondStone: pair("game.secondStone", "二手目"),
  secondStoneHint: say.say("game.secondStoneHint"),
  review: pair("game.review", "感想戦"),
  reviewEmpty: say.say("game.reviewEmpty"),
  reviewOtherRules: say.say("game.reviewOtherRules"),
  reviewForbidden: (move: string, colour: string, variant: string, shape: string) =>
    say.say("game.reviewForbidden", { move, colour, variant, shape }),
  reviewWouldNotWin: (colour: string, variant: string) => say.say("game.reviewWouldNotWin", { colour, variant }),
  reviewEarlierWin: (move: string, colour: string, variant: string) =>
    say.say("game.reviewEarlierWin", { move, colour, variant }),
  reviewCapture: (move: string, colour: string, variant: string) =>
    say.say("game.reviewCapture", { move, colour, variant }),
  reviewRecovered: (who: string, count: number) => say.count("game.reviewRecovered", count, { who }),
  reviewClean: (who: string) => say.say("game.reviewClean", { who }),
  reviewStreak: (who: string, streak: number) => say.say("game.reviewStreak", { who, ordinal: ordinal(say, streak) }),
  reviewFirstWin: (who: string) => say.say("game.reviewFirstWin", { who }),
  twistPrompt: say.say("game.twistPrompt"),
  pickPiece: say.say("game.pickPiece"),
  placePiece: say.say("game.placePiece"),
  pickRacer: say.say("game.pickRacer"),
  placeRacer: say.say("game.placeRacer"),
  dropPrompt: say.say("game.dropPrompt"),
  winsByTrap: (who: string, loser: string) => say.say("game.winsByTrap", { who, loser }),
  winsBySquare: (who: string) => say.say("game.winsBySquare", { who }),
  drawBothLines: say.say("game.drawBothLines"),
  drawByLength: say.say("game.drawByLength"),
  drawByRepetition: say.say("game.drawByRepetition"),
  drawByEndgameCount: say.say("game.drawByEndgameCount"),
  /*
   * A stall that is an ordinary draw, named by the rule that drew it and that
   * rule's own count — the way chess says "draw by the fifty-move rule". One
   * sentence per measure in `rules/noProgress.ts`, handed the plies the rule
   * allows. Draughts counts each side's moves, as its rule books do; the others
   * count every move.
   */
  drawNoProgress: {
    racing: (plies: number) => say.say("game.drawNoProgressRacing", { plies: String(plies) }),
    taking: (plies: number) => say.say("game.drawNoProgressTaking", { half: String(plies / 2) }),
    placing: (plies: number) => say.say("game.drawNoProgressPlacing", { plies: String(plies) }),
  } satisfies Record<ProgressMeasure, (plies: number) => string>,
  fixedBy: (game: string) => say.say("game.fixedBy", { game }),
  penaltyStrict: say.say("game.penaltyStrict"),
  rulesLocked: say.say("game.rulesLocked"),
  centreDiscs: { label: say.say("game.centreDiscs") },
  centreDiscsHint: say.say("game.centreDiscsHint"),
  noDrawLimitCannotDraw: say.say("game.noDrawLimitCannotDraw"),
  noDrawLimitTooSmall: say.say("game.noDrawLimitTooSmall"),
  noReading: say.say("game.noReading"),
  idle: pair("game.idle", "居る？"),
  idleDetail: say.say("game.idleDetail"),
  idleConfirm: say.say("game.idleConfirm"),
  idleLeave: say.say("game.idleLeave"),
  /*
   * Said because it is the thing that stops somebody staying out of doubt.
   * A local game is written to this browser as it is played, so leaving
   * costs nothing — and somebody who does not know that will sit through
   * the question rather than risk it.
   */
  idleKept: say.say("game.idleKept"),
  /* A live game's clock is the server's and does not stop for anyone; the game is kept on the site. */
  idleLiveDetail: say.say("game.idleLiveDetail"),
  idleLiveKept: say.say("game.idleLiveKept"),
  /* A puzzle's run is this tab's alone, so leaving is the end of it — said, so nobody leaves believing otherwise. */
  idlePuzzleDetail: say.say("game.idlePuzzleDetail"),
  idleRaceDetail: say.say("game.idleRaceDetail"),
  /* A member's unfinished puzzle is kept when they leave (`useKeptRun`); a visitor's lasts the page, and says so. */
  idlePuzzleKept: say.say("game.idlePuzzleKept"),
  idlePuzzleNotKept: say.say("game.idlePuzzleNotKept"),
  idleRaceKept: say.say("game.idleRaceKept"),
  pass: pair("game.pass", "パス"),
  forfeit: pair("game.forfeit", "時間切れ"),
  piece: pair("game.piece", "手駒"),
  nextPieces: pair("game.nextPieces", "次"),
  rotatePiece: pair("game.rotatePiece", "回転"),
  flipPiece: pair("game.flipPiece", "反転"),
  useSingle: pair("game.useSingle", "単石"),
  usePiece: pair("game.usePiece", "駒"),
  singlesLeft: (count: number) => say.count("game.singlesLeft", count),
  /*
   * The pass is taken for a player now — see rules/forcedPass.ts — so this is
   * only ever seen on a game that was already sitting stuck before it was, and
   * says what is true of that one rather than offering a choice there is not.
   */
  noMoveLeft: say.say("game.noMoveLeft"),
  youHadNoMove: say.say("game.youHadNoMove"),
  hadNoMoveToYou: (who: string) => say.say("game.hadNoMoveToYou", { who }),
  hadNoMove: (who: string) => say.say("game.hadNoMove", { who }),
  /** A turn a head start took, said to the colour given it, to the other side, and to anybody watching. */
  headStartYours: (turn: number, of: number) => say.say("game.headStartYours", { turn: String(turn), of: String(of) }),
  headStartToYou: (who: string, turn: number, of: number) =>
    say.say("game.headStartToYou", { who, turn: String(turn), of: String(of) }),
  headStartWatched: (who: string, turn: number, of: number) => say.say("game.headStartWatched", { who, turn: String(turn), of: String(of) }),
  drawNoMoves: say.say("game.drawNoMoves"),
  passTurn: pair("game.passTurn", "パス"),
  piecePrompt: say.say("game.piecePrompt"),
  singlePrompt: say.say("game.singlePrompt"),
  notes: pair("game.notes", "覚え書き"),
  notesHint: say.say("game.notesHint"),
  notesPlaceholder: say.say("game.notesPlaceholder"),
  placeAs: say.say("game.placeAs"),
  makerBreakerRoles: (maker: string, breaker: string) => say.say("game.makerBreakerRoles", { maker, breaker }),
  moveTime: pair("game.moveTime", "持ち時間"),
  moveTimeHint: say.say("game.moveTimeHint"),
  penalty: pair("game.penalty", "時間切れ"),
  penaltyTurn: say.say("game.penaltyTurn"),
  penaltyGame: say.say("game.penaltyGame"),
  /*
   * The same three, named rather than explained.
   *
   * A select is as wide as its longest option, and "Loses the turn. Three in
   * a row lose the game." is a sentence rather than a name — it pushed the
   * control past the edge of the panel it sits in. The sentence is still
   * said, under the control where there is room for it, and the option says
   * which of the three this is.
   */
  penaltyTurnShort: say.say("game.penaltyTurnShort"),
  penaltyGameShort: say.say("game.penaltyGameShort"),
  penaltyStrictShort: say.say("game.penaltyStrictShort"),
  penaltyHint: say.say("game.penaltyHint"),
  allowResign: pair("game.allowResign", "投了可"),
  allowResignHint: say.say("game.allowResignHint"),
  openSeat: pair("game.openSeat", "公開"),
  openSeatHint: say.say("game.openSeatHint"),
  /** With `{name}` and `{when}` standing where the colour and its deadline fall; `weave` puts them there. */
  mustMoveBy: say.say("game.mustMoveBy"),
  /** Said on the board a move was just played on, when no other board is waiting. */
  nothingWaiting: say.say("game.nothingWaiting"),
  yourGames: say.say("game.yourGames"),
  claimTurn: pair("game.claimTurn", "手番請求"),
  claimGame: pair("game.claimGame", "勝ち請求"),
  claimHint: say.say("game.claimHint"),
  claimTurnConfirm: say.say("game.claimTurnConfirm"),
  claimGameConfirm: say.say("game.claimGameConfirm"),
  forfeitsNote: (count: number, limit: number) => say.say("game.forfeitsNote", { count: String(count), limit: String(limit) }),
};
};

/** The English, for the places with no speaker. */
export const GAME_COPY = gameCopy(speaker("en"));

/** The last digit that has its own ending: 1st, 2nd, 3rd; every other digit takes "th". */
const ORDINALS: Record<number, PhraseKey> = { 1: "game.ordinalSt", 2: "game.ordinalNd", 3: "game.ordinalRd" };

function ordinal(say: Speaker, n: number): string {
  const rest = n % 100;
  const key = rest >= 11 && rest <= 13 ? "game.ordinalTh" : (ORDINALS[n % 10] ?? "game.ordinalTh");
  return say.say(key, { n: String(n) });
}

/**
 * THE WORDS A PRACTICE BOARD USES ABOUT ITSELF.
 *
 * John, 2026-09-21: "you need to know it's a practice, not a real match." The
 * board at /games/<slug>/play is the same board a match is played on, which is
 * the point and the danger — it has no opponent, no clock, no rating and no
 * record, and somebody who has pasted another site's game into it is looking
 * at something that never happened here.
 */
export const practiceCopy = (say: Speaker) => {
  const pair = (key: PhraseKey, kanji: string) => pairOf(say, key, kanji);
  /** What each format is called in a sentence a player reads. */
  const formatWords: Record<string, string> = {
    coordinates: say.say("game.formatCoordinates"),
    squares: say.say("game.formatSquares"),
    sgf: say.say("game.formatSgf"),
    itsYourTurn: say.say("game.formatIyt"),
    goldToken: say.say("game.formatGt"),
  };
  return {
  mark: {
    ...pair("game.practiceLabel", "試し打ち"),
    /*
     * WHAT IS TRUE, and it is not "nothing is kept". A board played at one
     * screen IS filed, as an unrated game at one screen, so it can be come
     * back to — saying otherwise would be the comfortable lie rather than the
     * accurate line. What it is not is a match against somebody, and what it
     * never touches is a rating. A game PASTED in is not filed at all; see
     * `session.pasted`, and the sentence below that says so.
     */
    line: say.say("game.practiceLine"),
    /* The way out, since a practice board that cannot become a game is a dead end. */
    real: say.say("game.practiceReal"),
  },
  paste: {
    ...pair("game.pasteLabel", "棋譜貼付"),
    button: say.say("game.pasteButton"),
    clear: say.say("game.pasteClear"),
    placeholder: say.say("game.pastePlaceholder"),
    hint: (example: string) => say.say("game.pasteHint", { example }),
    nothing: say.say("game.pasteNothing"),
    /* Said on success too: somebody who pasted forty moves and got twelve has to be told. */
    read: (moves: number, format: string) => say.count("game.pasteRead", moves, { format: formatWords[format] ?? format }),
    /* Where a list stopped being playable, which is the engine's answer and not the reader's. */
    refused: (at: number) => say.say("game.pasteRefused", { at: String(at) }),
    /*
     * Where the list came from. Two other sites letter their columns with I and
     * one counts its rows from the top, so the same "I9" is a different point
     * on each — see `readSite`. Anywhere tries this site's ways, and knows the
     * other two sites' lists by their layout.
     */
    fromLabel: say.say("game.pasteFrom"),
    from: {
      anywhere: say.say("game.pasteAnywhere"),
      itsYourTurn: "ItsYourTurn",
      goldToken: "GoldToken",
    },
    fromHint: say.say("game.pasteFromHint"),
  },
  };
};

/** The English, for the places with no speaker. */
export const PRACTICE_COPY = practiceCopy(speaker("en"));
