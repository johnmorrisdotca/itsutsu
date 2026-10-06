import type { XpEventType } from "./xp.types";

/**
 * WHAT EVERY AWARD IS CALLED, WHY IT EXISTS AND WHAT ITS TOAST SAYS, IN BOTH
 * LANGUAGES.
 *
 * Copy that belongs to data gets a table per language beside the data, never a
 * second copy of the data (`AGENTS.md`, "Every Word Goes Through The Phrase
 * Table"). The data is `XP_EVENT_SPECS`: the price, the kanji and how often.
 * This is what a member reads about each row, and `Record<XpEventType, …>`
 * makes an award with no words in either language a compile error rather than
 * a blank toast.
 *
 * **What a reader of Japanese sees as the heading is the kanji**, as it is on
 * every heading on the site: the English `label` has a kanji beside it for an
 * English reader, and for a Japanese one the kanji stands alone (`Paired`). So
 * the Japanese table has no label: it would never be drawn. What it has is the
 * two sentences, the reason (`blurb`, under the heading in the ledger) and the
 * line a toast says.
 *
 * `{games}` and `{families}` stand where the catalogue's count goes. English
 * says it in words ("forty-four"), Japanese in numerals, and both are filled
 * in by `xpEventCopy`, never typed here: a count written into a sentence is
 * wrong the day a game or a family is added.
 *
 * The Japanese is in `xpAwardCopy.ja.constants.ts`, with its `back` (what it
 * literally says, blurb then sentence) and its review. It is kept apart so
 * that a browser, and a page's function, carry the English half of this file
 * and never a back-translation.
 *
 * This file is allowed past the English gate by name (`ALLOWED_FILES` in
 * `scripts/check-i18n-strings.mjs`): it IS the English half of the table, and
 * `xp.coverage.test.ts` holds both halves complete.
 */

export type AwardWordsEn = {
  /** What a member reads in a list or a table cell. */
  label: string;
  /** Why it exists, for the member reading their own history. */
  blurb: string;
  /**
   * What a toast says. Second person, present tense, no points in it — the
   * toast prints the number itself.
   */
  sentence: string;
};

/** The English: what each award is called, why, and what a toast says. */
const EN: Record<XpEventType, AwardWordsEn> = {
  joined: { label: "Joined", blurb: "For being here at all. Once, ever.", sentence: "Welcome to Itsutsu." },
  dailyVisit: { label: "A new day", blurb: "For looking in, once a day.", sentence: "Good to see you again." },
  dayStreak7: { label: "Seven days running", blurb: "For a week of days without missing one.", sentence: "Seven days in a row." },
  dayStreak30: { label: "Thirty days running", blurb: "For a month of days without missing one.", sentence: "Thirty days in a row." },
  dayStreak100: { label: "A hundred days running", blurb: "For a hundred days without missing one.", sentence: "A hundred days in a row." },
  dayStreak365: { label: "A year running", blurb: "For a whole year without missing a day. It repeats, so it is worth repeating for.", sentence: "A year without missing a day." },
  weekendGame: { label: "Weekend game", blurb: "For finishing a game at the weekend. Once a weekend.", sentence: "A game at the weekend." },
  backFromAway: { label: "Back from away", blurb: "For coming back after time away.", sentence: "Welcome back." },
  yearHere: { label: "A year on Itsutsu", blurb: "For every year since you joined, with a hundred games played here.", sentence: "Another year on Itsutsu." },
  yearsHere5: { label: "Five years on Itsutsu", blurb: "For five years since you joined, with a hundred games played here. Once.", sentence: "Five years on Itsutsu." },
  yearsHere10: { label: "Ten years on Itsutsu", blurb: "For ten years since you joined, with a hundred games played here. Once.", sentence: "Ten years on Itsutsu." },
  firstGameEver: { label: "Your first game", blurb: "For finishing your very first game here.", sentence: "Your first game on Itsutsu." },
  gameFinished: { label: "Game finished", blurb: "For seeing a game through, won or lost.", sentence: "A game seen through." },
  gameWon: { label: "Game won", blurb: "For winning one, on top of what finishing it paid.", sentence: "A game won." },
  wonVsPerson: { label: "Won against a person", blurb: "On top of the win, for beating somebody rather than something.", sentence: "Beat a real person." },
  wonVsBuddy: { label: "Won against a buddy", blurb: "On top again, for beating somebody on your buddy list.", sentence: "Beat one of your buddies." },
  revengeWin: { label: "Turned it around", blurb: "For beating somebody at a game they had beaten you at. Once per rivalry.", sentence: "You turned that one around." },
  longGame: { label: "A long game", blurb: "For a game that went the distance.", sentence: "That one went the distance." },
  comeback: { label: "A comeback", blurb: "For winning a game you were losing.", sentence: "Won from behind." },
  winStreak3: { label: "Three in a row", blurb: "For three wins without a loss between them.", sentence: "Three wins in a row." },
  winStreak5: { label: "Five in a row", blurb: "For five wins without a loss between them.", sentence: "Five wins in a row." },
  winStreak10: { label: "Ten in a row", blurb: "For ten wins without a loss between them.", sentence: "Ten wins in a row." },
  upsetWin: { label: "An upset", blurb: "On top of the win, for beating an established player rated at least a hundred above you.", sentence: "You beat somebody better than you." },
  bigUpsetWin: { label: "A big upset", blurb: "On top of the win, for beating an established player rated at least two hundred above you.", sentence: "You beat somebody far better than you." },
  giantKilled: { label: "A giant killed", blurb: "On top of the win, for beating a highly ranked player rated at least three hundred above you.", sentence: "You beat one of the best players here." },
  firstOfVariant: { label: "A game you had not played", blurb: "For your first game of a game. There are {games} of them.", sentence: "A game you had never played." },
  firstWinAtVariant: { label: "First win at a game", blurb: "For your first win at one of the {games}.", sentence: "Your first win at this one." },
  firstOfFamily: { label: "A family you had not met", blurb: "For your first game from one of the {families} families.", sentence: "A whole family you had not met." },
  everyFamilyPlayed: { label: "Every family played", blurb: "For playing a game from all {families} families.", sentence: "All {families} families played." },
  everyVariantPlayed: { label: "Every game played", blurb: "For playing all {games} games on the site.", sentence: "All {games} games played." },
  everyVariantWonInFamily: { label: "A family won", blurb: "For winning at every game in a family of more than one game. Paid on the win that completes it.", sentence: "You have won at every game in this family." },
  puzzleSolved: { label: "Puzzle solved", blurb: "For solving a puzzle right through, checked by the site. The same puzzle pays once.", sentence: "A puzzle solved." },
  puzzleEnded: { label: "Puzzle played out", blurb: "For playing a puzzle to its end without solving it: a word to its last guess, or any puzzle until its clock runs out. The same puzzle pays once.", sentence: "A puzzle played to the end." },
  raceWon: { label: "Race won", blurb: "For the faster correct solve when two people race one puzzle.", sentence: "You won the race." },
  wins10: { label: "Ten wins at a game", blurb: "For your tenth win at one of the games. Once per game.", sentence: "Ten wins at this game." },
  wins100: { label: "A hundred wins at a game", blurb: "For your hundredth win at one of the games. Once per game.", sentence: "A hundred wins at this game." },
  wins250: { label: "Two hundred and fifty wins", blurb: "For two hundred and fifty wins at one of the games. Once per game.", sentence: "Two hundred and fifty wins at this game." },
  wins500: { label: "Five hundred wins at a game", blurb: "For five hundred wins at one of the games. Once per game.", sentence: "Five hundred wins at this game." },
  wins1000: { label: "A thousand wins at a game", blurb: "For a thousand wins at one of the games. Once per game.", sentence: "A thousand wins at this game." },
  losses10: { label: "Good Sport", blurb: "For ten losses at one game. Somebody needed a game worth winning.", sentence: "Ten losses at this game. A good sport." },
  losses50: { label: "Sparring Partner", blurb: "For fifty losses at one game. Everybody gets better against you.", sentence: "Fifty losses at this game. A sparring partner." },
  losses100: { label: "Stepping Stone", blurb: "For a hundred losses at one game. Winners climbed on you, and thank you.", sentence: "A hundred losses at this game. A stepping stone." },
  losses250: { label: "Worthy Opponent", blurb: "For two hundred and fifty losses at one game, and still sitting down to play.", sentence: "Two hundred and fifty losses at this game. A worthy opponent." },
  losses500: { label: "Never Gives Up", blurb: "For five hundred losses at one game. Nobody could make you stop.", sentence: "Five hundred losses at this game. You never give up." },
  losses1000: { label: "Legend of Grit", blurb: "For a thousand losses at one game. A legend of grit.", sentence: "A thousand losses at this game. A legend of grit." },
  draws10: { label: "Stalemate Artist", blurb: "For ten drawn games at one game. Nobody got past you, and you got past nobody.", sentence: "Ten draws at this game. A stalemate artist." },
  fullHouse: { label: "Full House", blurb: "For your first full board: twenty games at once, every one of them answered by an opponent.", sentence: "A full house. Twenty games on the go." },
  cleanSweepFirst: { label: "First Clean Sweep", blurb: "On top of the day's Clean Sweep, for the first day you kept a full board moving. Once.", sentence: "Your first clean sweep." },
  cleanSweep: { label: "Clean Sweep", blurb: "For a day at a full board with nothing left waiting on your move, and moves made that day.", sentence: "A clean sweep: nothing left waiting on you." },
  fullHouseCombo7: { label: "Full House Combo ×7", blurb: "For seven clean sweeps in a row: a full board, kept moving, every day for a week.", sentence: "Seven days of full houses, kept moving." },
  fullHouseCombo15: { label: "Full House Combo ×15", blurb: "For fifteen clean sweeps in a row: a full board, kept moving, every day.", sentence: "Fifteen days of full houses, kept moving." },
  fullHouseCombo30: { label: "Full House Combo ×30", blurb: "For thirty clean sweeps in a row: a month at a full board, kept moving.", sentence: "Thirty days of full houses, kept moving." },
  fullHouseCombo60: { label: "Full House Combo ×60", blurb: "For sixty clean sweeps in a row: two months at a full board, kept moving.", sentence: "Sixty days of full houses, kept moving." },
  fullHouseCombo120: { label: "Full House Combo ×120", blurb: "For a hundred and twenty clean sweeps in a row: four months at a full board.", sentence: "A hundred and twenty days of full houses." },
  fullHouseCombo250: { label: "Full House Combo ×250", blurb: "For two hundred and fifty clean sweeps in a row at a full board.", sentence: "Two hundred and fifty days of full houses." },
  fullHouseCombo500: { label: "Full House Combo ×500", blurb: "For five hundred clean sweeps in a row at a full board.", sentence: "Five hundred days of full houses." },
  fullHouseCombo1000: { label: "Full House Combo ×1000", blurb: "For a thousand clean sweeps in a row at a full board. Nobody gets here by accident.", sentence: "A thousand days of full houses." },
  gradeBeaten: { label: "A grade beaten", blurb: "For your first win against one of the five computer grades.", sentence: "A computer grade beaten." },
  everyGradeBeaten: { label: "Every grade beaten", blurb: "For beating all five computer grades. The hardest ordinary goal here.", sentence: "All five grades beaten." },
  specialistBeaten: { label: "A specialist beaten", blurb: "For beating one of the two specialists at their own game.", sentence: "A specialist beaten at their own game." },
  firstBuddy: { label: "Your first buddy", blurb: "For adding somebody to your buddy list for the first time.", sentence: "Your first buddy." },
  buddyAdded: { label: "A buddy added", blurb: "For adding somebody to your buddy list.", sentence: "A buddy added." },
  challengeSent: { label: "Game offered", blurb: "For offering somebody a game.", sentence: "Game offered." },
  challengeAnswered: { label: "Offer answered", blurb: "For answering somebody's offer of a game with a move.", sentence: "Offer answered." },
  rematchPlayed: { label: "A rematch", blurb: "For taking a rematch. A game worth playing twice.", sentence: "A rematch." },
  forkPlayed: { label: "A fork", blurb: "For playing a position on from the middle of a finished game.", sentence: "A position played on." },
  timeGiven: { label: "Time given", blurb: "For giving your opponent more time when they needed it.", sentence: "That was sporting." },
  applauseGiven: { label: "Applause given", blurb: "For applauding a game somebody played.", sentence: "Applause given." },
  nameSet: { label: "A name set", blurb: "For choosing what you are called here.", sentence: "Your name is set." },
  countrySet: { label: "A country set", blurb: "For saying where you are playing from.", sentence: "Your country is set." },
  bioSet: { label: "Something about you", blurb: "For writing a line about yourself on your page.", sentence: "Your page says something about you." },
  wordsSet: { label: "Four words set", blurb: "For setting the four words that let you take a seat on any device.", sentence: "Your four words are set." },
  seatClaimedElsewhere: { label: "A seat on another device", blurb: "For taking your seat on somebody else's screen with your four words.", sentence: "You took your seat on another device." },
};


/**
 * The English. The Japanese is in `xpAwardCopy.ja.constants.ts`, with its
 * back-translation and review, which a browser never carries.
 */
export const XP_AWARD_COPY = { en: EN };

/**
 * The four kinds of credit for another site that have no Itsutsu twin: games
 * and tournament games played elsewhere, finished and won. The rest of the
 * imported awards read as their Itsutsu twin does, with "elsewhere" beside it
 * (`importedXpCopy`), so they need no words of their own.
 */
export type ImportedVolumeType = "importedGames" | "importedWins" | "importedTournamentGames" | "importedTournamentWins";

export const IMPORTED_VOLUME_COPY = {
  en: {
    importedGames: {
      label: "Games played elsewhere",
      blurb: "Credit for games finished on another site, from the record kept of them here.",
    },
    importedWins: {
      label: "Games won elsewhere",
      blurb: "Credit for games won on another site, on top of finishing them.",
    },
    importedTournamentGames: {
      label: "Tournament games elsewhere",
      blurb: "Credit for tournament games finished on another site, worth more than ordinary play.",
    },
    importedTournamentWins: {
      label: "Tournament wins elsewhere",
      blurb: "Credit for tournament games won on another site.",
    },
  },
} satisfies { en: Record<ImportedVolumeType, unknown> };
