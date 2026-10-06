import type { MyGameGroup } from "@/lib/history/myGames";
import { RATING_SPLIT } from "@/lib/history/openSeatsFilter";
import type { Speaker } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n.types";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";

/**
 * THE WORDS OF MY GAMES AND MY ACCOUNT, in the reader's language, laid out as the objects the components were written
 * against (`MY_GAMES_COPY.groups.yourMove.hint`, `WORDS_COPY.save`): each is a function of a `Speaker` returning that same
 * shape, and every sentence in it is a phrase (`mine.*`, `src/lib/i18n/phrases.mine.constants.ts`). A line with a name or
 * a count in it is a function, as before. The kanji beside a heading is the site's own and is not translated.
 *
 * Built once for each language and kept: a Speaker is made again for every request, and the words do not change.
 */
function once<T>(build: (say: Speaker) => T): (say: Speaker) => T {
  const kept = new Map<Locale, T>();
  return (say) => {
    const known = kept.get(say.locale);
    if (known !== undefined) return known;
    const made = build(say);
    kept.set(say.locale, made);
    return made;
  };
}

/** A count that waits on the reader, in the plural the language uses: "1 game waiting on you". */
const waiting = (say: Speaker, count: number): string => say.count("mine.yourTurn", count);

export const myGamesCopy = once((say: Speaker) => ({
  title: { label: say.say("mine.myTitle"), kanji: "対局中" },
  /** The tabs of /play (`myGamesViews.ts`). */
  views: {
    going: { label: say.say("mine.viewGoing"), kanji: "対局中" },
    completed: { label: say.say("mine.viewCompleted"), kanji: "終局" },
    "pass-and-play": { label: say.say("mine.viewPass"), kanji: "対面" },
    history: { label: say.say("mine.viewHistory"), kanji: "履歴" },
  },
  empty: {
    yourMove: say.say("mine.emptyYourMove"),
    theirMove: say.say("mine.emptyTheirMove"),
    completed: say.say("mine.emptyCompleted"),
    passAndPlay: say.say("mine.emptyPass"),
    puzzles: say.say("mine.emptyPuzzles"),
  },
  groups: {
    offered: { label: say.say("mine.groupOffered"), kanji: "申込", hint: say.say("mine.groupOfferedHint") },
    yourMove: { label: say.say("mine.groupYourMove"), kanji: "手番", hint: say.say("mine.groupYourMoveHint") },
    theirMove: { label: say.say("mine.groupTheirMove"), kanji: "相手番", hint: say.say("mine.groupTheirMoveHint") },
    offerSent: { label: say.say("mine.groupOfferSent"), kanji: "申込済", hint: say.say("mine.groupOfferSentHint") },
    unstarted: { label: say.say("mine.groupUnstarted"), kanji: "未着手", hint: say.say("mine.groupUnstartedHint") },
    hotSeat: { label: say.say("mine.groupHotSeat"), kanji: "対面", hint: say.say("mine.groupHotSeatHint") },
    finished: { label: say.say("mine.groupFinished"), kanji: "終局", hint: say.say("mine.groupFinishedHint") },
  } satisfies Record<MyGameGroup, { label: string; kanji: string; hint: string }>,
  favourites: { label: say.say("mine.favLabel"), kanji: "お気に入り", hint: say.say("mine.favHint"), empty: say.say("mine.favEmpty") },
  offer: {
    offered: say.say("mine.offerWaiting"),
    offerSent: (who: string) => say.say("mine.offerSent", { who }),
    declined: (who: string) => say.say("mine.offerDeclined", { who }),
    withdrawn: say.say("mine.offerWithdrawn"),
    accept: { label: say.say("mine.accept"), kanji: "承諾" },
    decline: { label: say.say("mine.decline"), kanji: "辞退" },
    withdraw: { label: say.say("mine.withdraw"), kanji: "取消" },
    declineFailed: say.say("mine.declineFailed"),
    acceptFailed: say.say("mine.acceptFailed"),
    withdrawFailed: say.say("mine.withdrawFailed"),
  },
  stale: say.say("mine.stale"),
  staleHint: (days: number) => say.say("mine.staleHint", { days: say.number(days) }),
  rowOpen: { yourMove: say.say("mine.rowYourMove"), open: say.say("mine.rowOpen") },
  rowMore: { title: say.say("mine.rowMoreTitle"), label: (players: string) => say.say("mine.rowMore", { players }) },
  resign: { label: say.say("mine.resign"), kanji: "投了" },
  cancel: { label: say.say("mine.cancel"), kanji: "取消" },
  localGame: { label: say.say("mine.localGame"), kanji: "続き" },
  localParty: { label: say.say("mine.localParty"), kanji: "回し" },
  history: {
    label: say.say("mine.historyLabel"),
    kanji: "履歴",
    hint: say.say("mine.historyHint"),
    empty: say.say("mine.historyEmpty"),
    firstGame: say.say("mine.historyFirst"),
    state: {
      yourMove: say.say("mine.stateYourMove"),
      theirMove: say.say("mine.stateTheirMove"),
      going: say.say("mine.stateGoing"),
      won: say.say("mine.stateWon"),
      lost: say.say("mine.stateLost"),
      drawn: say.say("mine.stateDrawn"),
      shared: say.say("mine.stateShared"),
      ended: say.say("mine.stateEnded"),
      left: say.say("mine.stateLeft"),
      solved: say.say("mine.stateSolved"),
      unsolved: say.say("mine.stateUnsolved"),
    },
    open: { going: say.say("mine.openGoing"), over: say.say("mine.openOver") },
    alone: say.say("mine.alone"),
    computer: say.say("mine.computer"),
    guest: (seat: number) => say.say("mine.guest", { seat: say.number(seat + 1) }),
    older: say.say("mine.older"),
    newest: say.say("mine.newest"),
    /** Somebody else's history, on their page: the same list, from the side of the reader who is looking at it. */
    theirs: {
      hint: say.say("mine.theirsHint"),
      state: { yourMove: say.say("mine.stateTheirMove"), theirMove: say.say("mine.theirsWaiting") },
      open: { going: say.say("mine.theirsWatch"), over: say.say("mine.openOver") },
    },
  },
  puzzlesGoing: { label: say.say("mine.puzzlesGoing"), kanji: "解きかけ", hint: say.say("mine.puzzlesGoingHint") },
  raceOpen: say.say("mine.raceOpen"),
  completedFilters: {
    family: say.say("mine.filterFamily"),
    game: say.say("mine.filterGame"),
    every: say.say("mine.filterEvery"),
    showing: say.say("mine.filterShowing"),
    everything: say.say("mine.filterEverything"),
    takeOff: (what: string) => say.say("mine.filterTakeOff", { what }),
  },
  openBoard: {
    label: say.say("mine.openLabel"),
    kanji: "対局募集",
    hint: say.say("mine.openHint"),
    computerPool: say.say("players.botsPool"),
    rules: say.say("mine.openRules"),
    sitDown: say.say("mine.openSit"),
    youPlay: (colour: string) => say.say("mine.openYouPlay", { colour }),
    nobodyWaiting: say.say("mine.openNobody"),
    postFirst: say.say("mine.openPostLink"),
    /** The empty room's invitation as one sentence, with `{link}` where "Post the first seat" stands. */
    postFirstSentence: say.say("mine.openPost"),
  },
  sit: { label: say.say("mine.sitWhite"), kanji: "着席" },
  sitTaken: say.say("mine.sitTaken"),
  continueGame: say.say("mine.continue"),
  yourTurn: (count: number) => waiting(say, count),
  /**
   * WHAT THE BADGE BESIDE "PLAY" MEANS, once an offer can be waiting too: games and offers are counted in words that keep them
   * apart, because a game wants a move and an offer wants an answer. Offers FROM the reader are never counted.
   */
  waitingOn: (moves: number, offers: number) => {
    const games = waiting(say, moves);
    const asks = say.count("mine.waitingOffers", offers);
    if (offers === 0) return games;
    if (moves === 0) return asks;
    return say.joined([games, asks]);
  },
  /** After a group's count, when the panel shows fewer rows than it counts: "48 · showing 5". */
  showing: (shown: number) => say.say("mine.showing", { shown: say.number(shown) }),
  /** What opens the rest of a capped group, in place: it names the total the heading just claimed. */
  showAll: (total: number) => say.say("mine.showAll", { total: say.number(total) }),
  showOlder: say.say("mine.showOlder"),
  older: say.say("mine.older"),
  newest: say.say("mine.newest"),
  showFewer: say.say("mine.showFewer"),
  /** `/play?all=seated`: the games the games-at-once limit counts, and nothing else. */
  seated: { label: say.say("mine.seatedLabel"), hint: say.say("mine.seatedHint"), back: say.say("mine.historyLabel") },
  seeRecord: say.say("mine.seeRecord"),
}));

export const openSeatsFilterCopy = once((say: Speaker) => ({
  paceLabel: say.say("mine.paceLabel"),
  ratingLabel: say.say("mine.ratingLabel"),
  penaltyLabel: say.say("mine.penaltyLabel"),
  anyPace: say.say("mine.anyPace"),
  anyRating: say.say("mine.anyRating"),
  anyPenalty: say.say("mine.anyPenalty"),
  under: say.say("mine.ratingUnder", { split: say.number(RATING_SPLIT) }),
  over: say.say("mine.ratingOver", { split: say.number(RATING_SPLIT) }),
  unrated: say.say("mine.unrated"),
  unratedHint: say.say("mine.unratedHint"),
  clear: say.say("mine.clearSeats"),
  empty: say.say("mine.emptySeats"),
}));

/** Who is here, on My games (`HereNowPanel`), and the line a waiting match leaves on the set-up screen (`BeginBar`). */
export const startCopy = once((say: Speaker) => ({
  hereNow: {
    label: say.say("mine.hereLabel"),
    kanji: "在室",
    more: (count: number) => say.say("mine.hereMore", { count: say.number(count) }),
    fewer: say.say("mine.hereFewer"),
  },
  nobodyHere: say.say("mine.hereNobody"),
  matchHint: (who: string) => say.say("mine.matchHint", { who }),
}));

const NUMBER_WORDS = ["mine.wToGoNone", "mine.wToGoOne", "mine.wToGoTwo", "mine.wToGoThree", "mine.wToGoFour"] as const;

/** The four words (合言葉) a member sets to play as themselves on another device. */
export const wordsCopy = once((say: Speaker) => ({
  lead: say.say("mine.wLead"),
  unsetStatus: say.say("mine.wUnset"),
  setStatus: say.say("mine.wSet"),
  since: (date: string) => say.say("mine.wSince", { date }),
  kept: say.say("mine.wKept"),
  choose: say.say("mine.wChoose"),
  chooseAgain: say.say("mine.wChooseAgain"),
  remove: say.say("mine.wRemove"),
  removeQuestion: say.say("mine.wRemoveQuestion"),
  removeYes: say.say("mine.wRemoveYes"),
  removeNo: say.say("mine.wRemoveNo"),
  cannotRemove: say.say("mine.wCannotRemove"),
  saved: say.say("mine.wSaved"),
  slotsLabel: say.say("mine.wSlots"),
  emptyBox: (box: number) => say.say("mine.wEmptyBox", { box: say.number(box), total: say.number(PHRASE_LENGTH) }),
  nextBox: (box: number) => say.say("mine.wNextBox", { box: say.number(box), total: say.number(PHRASE_LENGTH) }),
  hiddenWord: say.say("mine.wHidden"),
  tileTitle: say.say("mine.wTileTitle"),
  tileHint: say.say("mine.wTileHint"),
  moved: (word: string, box: number) => say.say("mine.wMoved", { word, box: say.number(box), total: say.number(PHRASE_LENGTH) }),
  arrange: say.say("mine.wArrange"),
  keepOne: say.say("mine.wKeepOne"),
  toGo: (left: number) => say.say(NUMBER_WORDS[Math.max(0, Math.min(left, NUMBER_WORDS.length - 1))] ?? "mine.wToGoNone"),
  finding: say.say("mine.wFinding"),
  refresh: say.say("mine.wRefresh"),
  writeDown: say.say("mine.wWriteDown"),
  writeDownWhy: say.say("mine.wWriteDownWhy"),
  acknowledge: say.say("mine.wAcknowledge"),
  save: say.say("mine.wSave"),
  startOver: say.say("mine.wStartOver"),
  cancel: say.say("mine.cancel"),
  drawFailed: say.say("mine.wDrawFailed"),
  saveFailed: say.say("mine.wSaveFailed"),
  removeFailed: say.say("mine.wRemoveFailed"),
}));

export const keepAccountCopy = once((say: Speaker) => ({
  lives: (days: number) => say.say("mine.keepLives", { days: say.number(days) }),
  unlessGoogle: say.say("mine.keepUnlessGoogle"),
  noGoogle: say.say("mine.keepNoGoogle"),
  linkGoogle: say.say("mine.keepLinkGoogle"),
  linkGoogleNote: say.say("mine.keepLinkGoogleNote"),
  addWords: say.say("mine.keepAddWords"),
  addWordsNote: (days: number) => say.say("mine.keepAddWordsNote", { days: say.number(days) }),
}));

export const ageCopy = once((say: Speaker) => ({
  welcomeLead: say.say("mine.ageWelcome"),
  question: say.say("mine.ageQuestion"),
  questionKanji: "年齢",
  consentLead: say.say("mine.ageConsentLead"),
  consentName: say.say("mine.ageConsentName"),
  consentRelationship: say.say("mine.ageConsentRelationship"),
  agree: say.say("mine.ageAgree"),
  save: say.say("mine.ageSave"),
  saved: say.say("mine.saved"),
  shown: say.say("mine.ageShown"),
  consented: say.say("mine.ageConsented"),
  change: say.say("mine.ageChange"),
  unsaid: say.say("mine.ageUnsaid"),
  why: say.say("mine.ageWhy"),
}));

export const removeCopy = once((say: Speaker) => ({
  heading: say.say("mine.removeHeading"),
  kanji: "退会",
  lead: say.say("mine.removeLead"),
  open: say.say("mine.removeOpen"),
  keepName: say.say("mine.removeKeepName"),
  blankName: say.say("mine.removeBlankName"),
  blankNote: say.say("mine.removeBlankNote"),
  type: (phrase: string) => say.say("mine.removeType", { phrase }),
  signInAgain: say.say("mine.removeSignIn"),
  signInNote: say.say("mine.removeSignInNote"),
  press: say.say("mine.removePress"),
  cancel: say.say("mine.removeKeep"),
}));
