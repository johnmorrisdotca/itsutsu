import type { CopyLocale } from "@/lib/i18n/copyLocale";

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
 * `back` is what the Japanese literally says, blurb then sentence, so John can
 * read what would ship. The Japanese has been read by the reviewer agent and
 * not by a person; see the review notes in the pull request.
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

export type AwardWordsJa = Omit<AwardWordsEn, "label"> & {
  /** The Japanese read back as English: the blurb, then the sentence. */
  back: string;
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

/** The Japanese: the reason and the toast's line, with the heading left to the kanji. */
const JA: Record<XpEventType, AwardWordsJa> = {
  joined: {
    blurb: "参加してくれたことへの経験値です。一度だけもらえます。",
    sentence: "Itsutsuへようこそ。",
    back: "Experience for having joined. You get it only once. || Welcome to Itsutsu.",
  },
  dailyVisit: {
    blurb: "1日に1回、サイトをのぞいたときにもらえます。",
    sentence: "また会えてうれしいです。",
    back: "You get it when you look in on the site, once a day. || I'm glad to see you again.",
  },
  dayStreak7: {
    blurb: "7日間、1日も欠かさず来たときにもらえます。",
    sentence: "7日連続です。",
    back: "You get it when you come for seven days without missing one. || Seven days in a row.",
  },
  dayStreak30: {
    blurb: "30日間、1日も欠かさず来たときにもらえます。",
    sentence: "30日連続です。",
    back: "You get it when you come for thirty days without missing one. || Thirty days in a row.",
  },
  dayStreak100: {
    blurb: "100日間、1日も欠かさず来たときにもらえます。",
    sentence: "100日連続です。",
    back: "You get it when you come for a hundred days without missing one. || A hundred days in a row.",
  },
  dayStreak365: {
    blurb: "丸1年、1日も欠かさず来たときにもらえます。何度でも繰り返しもらえます。",
    sentence: "丸1年、1日も欠かさず来ました。",
    back: "You get it when you come for a whole year without missing a day. You can get it again and again. || You came a whole year without missing a day.",
  },
  weekendGame: {
    blurb: "週末に対局を最後まで終えたときにもらえます。週末ごとに1回です。",
    sentence: "週末に1局を終えました。",
    back: "You get it when you finish a game at the weekend. Once per weekend. || You finished one game at the weekend.",
  },
  backFromAway: {
    blurb: "しばらく離れたあとに戻ってきたときにもらえます。",
    sentence: "おかえりなさい。",
    back: "You get it when you come back after time away. || Welcome back.",
  },
  yearHere: {
    blurb: "参加してから1年たつごとにもらえます。ここで100局以上対局していることが条件です。",
    sentence: "Itsutsuで、また1年たちました。",
    back: "You get it each time a year passes since you joined. You need 100 or more games played here. || Another year has passed on Itsutsu.",
  },
  yearsHere5: {
    blurb: "参加してから5年たったときにもらえます。ここで100局以上対局していることが条件で、一度だけです。",
    sentence: "Itsutsuで5年たちました。",
    back: "You get it when five years have passed since you joined. You need 100 or more games played here, and it is only once. || Five years have passed on Itsutsu.",
  },
  yearsHere10: {
    blurb: "参加してから10年たったときにもらえます。ここで100局以上対局していることが条件で、一度だけです。",
    sentence: "Itsutsuで10年たちました。",
    back: "You get it when ten years have passed since you joined. You need 100 or more games played here, and it is only once. || Ten years have passed on Itsutsu.",
  },
  firstGameEver: {
    blurb: "ここで初めての対局を最後まで終えたときにもらえます。",
    sentence: "Itsutsuでの初めての対局です。",
    back: "You get it when you finish your very first game here. || Your first game on Itsutsu.",
  },
  gameFinished: {
    blurb: "勝っても負けても、対局を最後まで終えたときにもらえます。",
    sentence: "1局を最後まで終えました。",
    back: "You get it when you finish a game, whether you win or lose. || You finished one game.",
  },
  gameWon: {
    blurb: "対局に勝ったときにもらえます。終えた分に上乗せされます。",
    sentence: "1局に勝ちました。",
    back: "You get it when you win a game. It is added on top of what finishing it paid. || You won one game.",
  },
  wonVsPerson: {
    blurb: "勝ちに上乗せして、コンピュータではなく人間の相手に勝ったときにもらえます。",
    sentence: "人間の対戦相手に勝ちました。",
    back: "On top of the win, you get it when you beat a human opponent rather than a computer. || You beat a human opponent.",
  },
  wonVsBuddy: {
    blurb: "さらに上乗せして、仲間リストにいる相手に勝ったときにもらえます。",
    sentence: "仲間の1人に勝ちました。",
    back: "On top of that again, you get it when you beat somebody on your buddy list. || You beat one of your buddies.",
  },
  revengeWin: {
    blurb: "以前に負けた相手に、同じゲームで勝ったときにもらえます。同じ相手と同じゲームにつき一度だけです。",
    sentence: "借りを返しました。",
    back: "You get it when you beat somebody at a game they had beaten you at. Once for each opponent and game. || You paid back the debt.",
  },
  longGame: {
    blurb: "最後まで長く続いた対局にもらえます。",
    sentence: "最後までもつれた対局でした。",
    back: "You get it for a game that lasted a long time to the end. || It was a game that dragged on to the end.",
  },
  comeback: {
    blurb: "負けていた対局に勝ったときにもらえます。",
    sentence: "逆転勝ちです。",
    back: "You get it when you win a game you were losing. || A win from behind.",
  },
  winStreak3: {
    blurb: "間に負けをはさまず3連勝したときにもらえます。",
    sentence: "3連勝です。",
    back: "You get it when you win three in a row with no loss between them. || Three wins in a row.",
  },
  winStreak5: {
    blurb: "間に負けをはさまず5連勝したときにもらえます。",
    sentence: "5連勝です。",
    back: "You get it when you win five in a row with no loss between them. || Five wins in a row.",
  },
  winStreak10: {
    blurb: "間に負けをはさまず10連勝したときにもらえます。",
    sentence: "10連勝です。",
    back: "You get it when you win ten in a row with no loss between them. || Ten wins in a row.",
  },
  upsetWin: {
    blurb: "勝ちに上乗せして、レーティングが確定していて自分より100以上高い相手に勝ったときにもらえます。",
    sentence: "自分より強い相手に勝ちました。",
    back: "On top of the win, you get it when you beat an opponent whose rating is settled and at least 100 above yours. || You beat somebody stronger than you.",
  },
  bigUpsetWin: {
    blurb: "勝ちに上乗せして、レーティングが確定していて自分より200以上高い相手に勝ったときにもらえます。",
    sentence: "自分よりはるかに強い相手に勝ちました。",
    back: "On top of the win, you get it when you beat an opponent whose rating is settled and at least 200 above yours. || You beat somebody far stronger than you.",
  },
  giantKilled: {
    blurb: "勝ちに上乗せして、順位が上位で自分より300以上レーティングが高い相手に勝ったときにもらえます。",
    sentence: "ここで屈指の強豪に勝ちました。",
    back: "On top of the win, you get it when you beat a highly ranked opponent whose rating is at least 300 above yours. || You beat one of the strongest players here.",
  },
  firstOfVariant: {
    blurb: "ゲームごとに、初めて遊んだときにもらえます。ゲームは全部で{games}種類あります。",
    sentence: "まだ遊んだことのないゲームでした。",
    back: "You get it, for each game, when you play it for the first time. There are {games} kinds of game in all. || It was a game you had not played yet.",
  },
  firstWinAtVariant: {
    blurb: "{games}種類あるゲームのうち、1つで初めて勝ったときにもらえます。",
    sentence: "このゲームで初めての勝ちです。",
    back: "You get it when you win for the first time at one of the {games} kinds of game. || Your first win at this game.",
  },
  firstOfFamily: {
    blurb: "{families}系統あるうち、1つの系統で初めて対局したときにもらえます。",
    sentence: "まだ知らなかった系統のゲームです。",
    back: "You get it when you play your first game from one of the {families} families. || A game from a family you did not know yet.",
  },
  everyFamilyPlayed: {
    blurb: "{families}系統のすべてで、ゲームを1つ以上遊んだときにもらえます。",
    sentence: "{families}系統すべてを遊びました。",
    back: "You get it when you have played at least one game from every one of the {families} families. || You have played all {families} families.",
  },
  everyVariantPlayed: {
    blurb: "サイトにある{games}種類のゲームをすべて遊んだときにもらえます。",
    sentence: "{games}種類すべてを遊びました。",
    back: "You get it when you have played all {games} kinds of game on the site. || You have played all {games} kinds.",
  },
  everyVariantWonInFamily: {
    blurb: "ゲームが2つ以上ある系統で、そのすべてのゲームに勝ったときにもらえます。最後の1つに勝った対局に付きます。",
    sentence: "この系統のすべてのゲームで勝ちました。",
    back: "You get it when you have won at every game in a family that has two or more games. It goes with the game that wins the last one. || You have won at every game in this family.",
  },
  puzzleSolved: {
    blurb: "パズルを最後まで解き、サイトの確認を通ったときにもらえます。同じパズルは一度だけです。",
    sentence: "パズルを解きました。",
    back: "You get it when you solve a puzzle all the way through and the site's check passes. The same puzzle only once. || You solved a puzzle.",
  },
  puzzleEnded: {
    blurb: "解けなくても、パズルを最後まで遊び切ったときにもらえます。言葉のパズルは最後の推測まで、ほかのパズルは時計が切れるまでです。同じパズルは一度だけです。",
    sentence: "パズルに最後まで挑戦しました。",
    back: "You get it when you play a puzzle out to its end even without solving it. For a word puzzle that is to the last guess, for other puzzles until the clock runs out. The same puzzle only once. || You tried a puzzle to the end.",
  },
  raceWon: {
    blurb: "2人が同じパズルで競い、先に正解したときにもらえます。",
    sentence: "競争に勝ちました。",
    back: "You get it when two people race on the same puzzle and you get it right first. || You won the race.",
  },
  wins10: {
    blurb: "1つのゲームで10勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで10勝です。",
    back: "You get it when you reach your tenth win at one game. Once for each game. || Ten wins at this game.",
  },
  wins100: {
    blurb: "1つのゲームで100勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで100勝です。",
    back: "You get it when you reach your hundredth win at one game. Once for each game. || A hundred wins at this game.",
  },
  wins250: {
    blurb: "1つのゲームで250勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで250勝です。",
    back: "You get it when you reach your 250th win at one game. Once for each game. || 250 wins at this game.",
  },
  wins500: {
    blurb: "1つのゲームで500勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで500勝です。",
    back: "You get it when you reach your 500th win at one game. Once for each game. || 500 wins at this game.",
  },
  wins1000: {
    blurb: "1つのゲームで1000勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで1000勝です。",
    back: "You get it when you reach your 1,000th win at one game. Once for each game. || 1,000 wins at this game.",
  },
  losses10: {
    blurb: "1つのゲームで10敗したときにもらえます。誰かが、勝ち甲斐のある対局を必要としていました。",
    sentence: "このゲームで10敗。よく戦いました。",
    back: "You get it when you have lost ten times at one game. Somebody needed a game worth winning. || Ten losses at this game. You fought well.",
  },
  losses50: {
    blurb: "1つのゲームで50敗したときにもらえます。対局した誰もが強くなっていきます。",
    sentence: "このゲームで50敗。稽古相手です。",
    back: "You get it when you have lost fifty times at one game. Everybody who plays you gets stronger. || Fifty losses at this game. A practice partner.",
  },
  losses100: {
    blurb: "1つのゲームで100敗したときにもらえます。勝った人たちはこの踏み台で上へ進みました。ありがとう。",
    sentence: "このゲームで100敗。踏み台です。",
    back: "You get it when you have lost a hundred times at one game. The people who won climbed on this stepping stone. Thank you. || A hundred losses at this game. A stepping stone.",
  },
  losses250: {
    blurb: "1つのゲームで250敗しても、まだ席に着いて対局しているときにもらえます。",
    sentence: "このゲームで250敗。好敵手です。",
    back: "You get it when you have lost 250 times at one game and still sit down to play. || 250 losses at this game. A worthy rival.",
  },
  losses500: {
    blurb: "1つのゲームで500敗したときにもらえます。誰にもやめさせられませんでした。",
    sentence: "このゲームで500敗。決してあきらめません。",
    back: "You get it when you have lost 500 times at one game. Nobody could make you stop. || 500 losses at this game. You never give up.",
  },
  losses1000: {
    blurb: "1つのゲームで1000敗したときにもらえます。根性の伝説です。",
    sentence: "このゲームで1000敗。根性の伝説です。",
    back: "You get it when you have lost 1,000 times at one game. A legend of grit. || 1,000 losses at this game. A legend of grit.",
  },
  draws10: {
    blurb: "1つのゲームで10回引き分けたときにもらえます。誰にも破られず、誰も破れませんでした。",
    sentence: "このゲームで10回引き分け。引き分けの名人です。",
    back: "You get it when you have drawn ten times at one game. Nobody beat you, and you beat nobody. || Ten draws at this game. A master of draws.",
  },
  fullHouse: {
    blurb: "初めて満卓にしたときにもらえます。20局を同時に進め、そのどれも相手が応じている状態です。",
    sentence: "満卓です。20局が進行中です。",
    back: "You get it when you first fill the table. Twenty games are going at once, and in every one the opponent has answered. || A full table. Twenty games are in progress.",
  },
  cleanSweepFirst: {
    blurb: "その日の一掃に上乗せして、満卓を動かし続けた最初の日にもらえます。一度だけです。",
    sentence: "初めての一掃です。",
    back: "On top of the day's clean sweep, you get it on the first day you keep a full table moving. Only once. || Your first clean sweep.",
  },
  cleanSweep: {
    blurb: "満卓の状態で、自分の手番待ちが1つも残らず、その日に手を指したときにもらえます。",
    sentence: "一掃です。自分の手番待ちはありません。",
    back: "You get it on a day at a full table with nothing left waiting on your move, and moves made that day. || A clean sweep. Nothing is waiting on you.",
  },
  fullHouseCombo7: {
    blurb: "一掃を7日連続で達成したときにもらえます。満卓を毎日、1週間動かし続けた記録です。",
    sentence: "満卓を7日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep seven days in a row: a full table kept moving every day for a week. || You kept a full table moving for seven days.",
  },
  fullHouseCombo15: {
    blurb: "一掃を15日連続で達成したときにもらえます。満卓を毎日動かし続けた記録です。",
    sentence: "満卓を15日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep fifteen days in a row: a full table kept moving every day. || You kept a full table moving for fifteen days.",
  },
  fullHouseCombo30: {
    blurb: "一掃を30日連続で達成したときにもらえます。満卓を1か月、動かし続けた記録です。",
    sentence: "満卓を30日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep thirty days in a row: a month at a full table, kept moving. || You kept a full table moving for thirty days.",
  },
  fullHouseCombo60: {
    blurb: "一掃を60日連続で達成したときにもらえます。満卓を2か月、動かし続けた記録です。",
    sentence: "満卓を60日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep sixty days in a row: two months at a full table, kept moving. || You kept a full table moving for sixty days.",
  },
  fullHouseCombo120: {
    blurb: "一掃を120日連続で達成したときにもらえます。満卓で4か月を過ごした記録です。",
    sentence: "満卓を120日間、続けました。",
    back: "You get it when you achieve a clean sweep 120 days in a row: four months spent at a full table. || You kept a full table going for 120 days.",
  },
  fullHouseCombo250: {
    blurb: "満卓で一掃を250日連続で達成したときにもらえます。",
    sentence: "満卓を250日間、続けました。",
    back: "You get it when you achieve a clean sweep at a full table 250 days in a row. || You kept a full table going for 250 days.",
  },
  fullHouseCombo500: {
    blurb: "満卓で一掃を500日連続で達成したときにもらえます。",
    sentence: "満卓を500日間、続けました。",
    back: "You get it when you achieve a clean sweep at a full table 500 days in a row. || You kept a full table going for 500 days.",
  },
  fullHouseCombo1000: {
    blurb: "満卓で一掃を1000日連続で達成したときにもらえます。うっかりでは、誰もここまで来られません。",
    sentence: "満卓を1000日間、続けました。",
    back: "You get it when you achieve a clean sweep at a full table 1,000 days in a row. Nobody gets this far by accident. || You kept a full table going for 1,000 days.",
  },
  gradeBeaten: {
    blurb: "コンピュータの5つの段階のうち、それぞれの段階に初めて勝ったときにもらえます。",
    sentence: "コンピュータの1つの段階に勝ちました。",
    back: "You get it when you win for the first time against each of the five grades of computer. || You beat one grade of the computer.",
  },
  everyGradeBeaten: {
    blurb: "コンピュータの5つの段階すべてに勝ったときにもらえます。通常の目標のなかで最も難しいものです。",
    sentence: "5つの段階すべてに勝ちました。",
    back: "You get it when you have beaten all five grades of the computer. The hardest ordinary goal here. || You beat all five grades.",
  },
  specialistBeaten: {
    blurb: "専門のコンピュータ2つのうち、どちらかをその得意なゲームで破ったときにもらえます。",
    sentence: "専門のコンピュータを、その得意なゲームで破りました。",
    back: "You get it when you beat either of the two specialist computers at its own game. || You beat a specialist computer at its own game.",
  },
  firstBuddy: {
    blurb: "初めて仲間リストに誰かを加えたときにもらえます。",
    sentence: "初めての仲間です。",
    back: "You get it when you first add somebody to your buddy list. || Your first buddy.",
  },
  buddyAdded: {
    blurb: "仲間リストに誰かを加えたときにもらえます。",
    sentence: "仲間が増えました。",
    back: "You get it when you add somebody to your buddy list. || You have one more buddy.",
  },
  challengeSent: {
    blurb: "誰かに対局を申し込んだときにもらえます。",
    sentence: "対局を申し込みました。",
    back: "You get it when you offer somebody a game. || You offered a game.",
  },
  challengeAnswered: {
    blurb: "誰かからの対局の申し込みに、最初の一手で応えたときにもらえます。",
    sentence: "申し込みに応えました。",
    back: "You get it when you answer somebody's offer of a game with a first move. || You answered the offer.",
  },
  rematchPlayed: {
    blurb: "再戦を指したときにもらえます。もう一度指す価値のある対局です。",
    sentence: "再戦です。",
    back: "You get it when you play a rematch. A game worth playing twice. || A rematch.",
  },
  forkPlayed: {
    blurb: "終わった対局の途中から、その局面の続きを指したときにもらえます。",
    sentence: "局面の続きを指しました。",
    back: "You get it when you play on from a position in the middle of a finished game. || You played a position on.",
  },
  timeGiven: {
    blurb: "相手が時間を必要としているときに、持ち時間を足してあげるともらえます。",
    sentence: "思いやりのある行いでした。",
    back: "You get it when you give your opponent more time while they need it. || That was a considerate act.",
  },
  applauseGiven: {
    blurb: "誰かが指した対局に拍手を送ったときにもらえます。",
    sentence: "拍手を送りました。",
    back: "You get it when you applaud a game somebody played. || You sent applause.",
  },
  nameSet: {
    blurb: "ここで使う名前を決めたときにもらえます。",
    sentence: "名前を設定しました。",
    back: "You get it when you choose the name you go by here. || You set your name.",
  },
  countrySet: {
    blurb: "どこから遊んでいるかを伝えたときにもらえます。",
    sentence: "国を設定しました。",
    back: "You get it when you say where you are playing from. || You set your country.",
  },
  bioSet: {
    blurb: "自分のページに自己紹介を1行書いたときにもらえます。",
    sentence: "ページに自己紹介を書きました。",
    back: "You get it when you write a line about yourself on your page. || You wrote about yourself on your page.",
  },
  wordsSet: {
    blurb: "どの端末でも席に着ける4つの言葉を設定したときにもらえます。",
    sentence: "4つの言葉を設定しました。",
    back: "You get it when you set the four words that let you take a seat on any device. || You set your four words.",
  },
  seatClaimedElsewhere: {
    blurb: "ほかの人の画面で、4つの言葉を使って自分の席に着いたときにもらえます。",
    sentence: "別の端末で席に着きました。",
    back: "You get it when you take your seat on somebody else's screen using your four words. || You took your seat on another device.",
  },
};

export const XP_AWARD_COPY = { en: EN, ja: JA } satisfies {
  [language in CopyLocale]: Record<XpEventType, unknown>;
};

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
  ja: {
    importedGames: {
      blurb: "他のサイトで最後まで終えた対局への加算です。ここに残されたその記録から数えています。",
      back: "An addition for games finished to the end on another site. It is counted from the record of them kept here.",
    },
    importedWins: {
      blurb: "他のサイトで勝った対局への加算です。終えた分に上乗せされます。",
      back: "An addition for games won on another site. It is added on top of the finished games.",
    },
    importedTournamentGames: {
      blurb: "他のサイトの大会で終えた対局への加算です。ふつうの対局より多く加算されます。",
      back: "An addition for games finished in a tournament on another site. More is added than for ordinary games.",
    },
    importedTournamentWins: {
      blurb: "他のサイトの大会で勝った対局への加算です。",
      back: "An addition for games won in a tournament on another site.",
    },
  },
} satisfies {
  [language in CopyLocale]: Record<ImportedVolumeType, unknown>;
};
