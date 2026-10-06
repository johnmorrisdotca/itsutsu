import type { Review } from "@/lib/i18n/dictionaries/ja.drafted.constants";

import type { XpEventType } from "./xp.types";
import type { AwardWordsEn, ImportedVolumeType } from "./xpAwardCopy.constants";

/**
 * THE JAPANESE OF EVERY AWARD, WITH ITS BACK-TRANSLATION AND REVIEW.
 *
 * The sibling of `xpAwardCopy.constants.ts`, which holds the English and the
 * words a browser needs. This file is the authored Japanese, `back` and
 * `review` included, and only the review sheet and the tests read it: what a
 * reader is shown is a text-only copy of it (`jaText.generated.json`,
 * made by `pnpm i18n:text`), so a back-translation never travels to a browser
 * or into a page's function. `jaText.coverage.test.ts` refuses a browser
 * module that reaches this file.
 *
 * This file is allowed past the English gate by name (`ALLOWED_FILES` in
 * `scripts/check-i18n-strings.mjs`): its `back` strings are English.
 */

/** Who read the Japanese of every row below, and when: the reviewer agent's pass (ENJA-09), 2026-10-06. */
const READ: Review = { by: "agent", on: "2026-10-06" };

export type AwardWordsJa = Omit<AwardWordsEn, "label"> & {
  /** Who read this row's Japanese, as on every drafted phrase (`ja.drafted.constants.ts`). A row nobody has read does not compile. */
  review: Review;
  /** The Japanese read back as English: the blurb, then the sentence. */
  back: string;
};

/** The Japanese: the reason and the toast's line, with the heading left to the kanji. */
export const XP_AWARD_COPY_JA: Record<XpEventType, AwardWordsJa> = {
  joined: {
    blurb: "参加してくれたことへの経験値です。一度だけもらえます。",
    sentence: "Itsutsuへようこそ。",
    back: "Experience for having joined. You get it only once. || Welcome to Itsutsu.",
    review: READ,
  },
  dailyVisit: {
    blurb: "1日に1回、サイトをのぞいたときにもらえます。",
    sentence: "また会えてうれしいです。",
    back: "You get it when you look in on the site, once a day. || I'm glad to see you again.",
    review: READ,
  },
  dayStreak7: {
    blurb: "7日間、1日も欠かさず来たときにもらえます。",
    sentence: "7日連続です。",
    back: "You get it when you come for seven days without missing one. || Seven days in a row.",
    review: READ,
  },
  dayStreak30: {
    blurb: "30日間、1日も欠かさず来たときにもらえます。",
    sentence: "30日連続です。",
    back: "You get it when you come for thirty days without missing one. || Thirty days in a row.",
    review: READ,
  },
  dayStreak100: {
    blurb: "100日間、1日も欠かさず来たときにもらえます。",
    sentence: "100日連続です。",
    back: "You get it when you come for a hundred days without missing one. || A hundred days in a row.",
    review: READ,
  },
  dayStreak365: {
    blurb: "丸1年、1日も欠かさず来たときにもらえます。何度でも繰り返しもらえます。",
    sentence: "丸1年、1日も欠かさず来ました。",
    back: "You get it when you come for a whole year without missing a day. You can get it again and again. || You came a whole year without missing a day.",
    review: READ,
  },
  weekendGame: {
    blurb: "週末に対局を最後まで終えたときにもらえます。週末ごとに1回です。",
    sentence: "週末に1局を終えました。",
    back: "You get it when you finish a game at the weekend. Once per weekend. || You finished one game at the weekend.",
    review: READ,
  },
  backFromAway: {
    blurb: "しばらく離れたあとに戻ってきたときにもらえます。",
    sentence: "おかえりなさい。",
    back: "You get it when you come back after time away. || Welcome back.",
    review: READ,
  },
  yearHere: {
    blurb: "参加してから1年たつごとにもらえます。ここで100局以上対局していることが条件です。",
    sentence: "Itsutsuで、また1年たちました。",
    back: "You get it each time a year passes since you joined. You need 100 or more games played here. || Another year has passed on Itsutsu.",
    review: READ,
  },
  yearsHere5: {
    blurb: "参加してから5年たったときにもらえます。ここで100局以上対局していることが条件で、一度だけです。",
    sentence: "Itsutsuで5年たちました。",
    back: "You get it when five years have passed since you joined. You need 100 or more games played here, and it is only once. || Five years have passed on Itsutsu.",
    review: READ,
  },
  yearsHere10: {
    blurb: "参加してから10年たったときにもらえます。ここで100局以上対局していることが条件で、一度だけです。",
    sentence: "Itsutsuで10年たちました。",
    back: "You get it when ten years have passed since you joined. You need 100 or more games played here, and it is only once. || Ten years have passed on Itsutsu.",
    review: READ,
  },
  firstGameEver: {
    blurb: "ここで初めての対局を最後まで終えたときにもらえます。",
    sentence: "Itsutsuでの初めての対局です。",
    back: "You get it when you finish your very first game here. || Your first game on Itsutsu.",
    review: READ,
  },
  gameFinished: {
    blurb: "勝っても負けても、対局を最後まで終えたときにもらえます。",
    sentence: "1局を最後まで終えました。",
    back: "You get it when you finish a game, whether you win or lose. || You finished one game.",
    review: READ,
  },
  gameWon: {
    blurb: "対局に勝ったときにもらえます。終えた分に上乗せされます。",
    sentence: "1局に勝ちました。",
    back: "You get it when you win a game. It is added on top of what finishing it paid. || You won one game.",
    review: READ,
  },
  wonVsPerson: {
    blurb: "勝ちに上乗せして、コンピュータではなく人間の相手に勝ったときにもらえます。",
    sentence: "人間の対戦相手に勝ちました。",
    back: "On top of the win, you get it when you beat a human opponent rather than a computer. || You beat a human opponent.",
    review: READ,
  },
  wonVsBuddy: {
    blurb: "さらに上乗せして、仲間リストにいる相手に勝ったときにもらえます。",
    sentence: "仲間の1人に勝ちました。",
    back: "On top of that again, you get it when you beat somebody on your buddy list. || You beat one of your buddies.",
    review: READ,
  },
  revengeWin: {
    blurb: "以前に負けた相手に、同じゲームで勝ったときにもらえます。同じ相手と同じゲームにつき一度だけです。",
    sentence: "借りを返しました。",
    back: "You get it when you beat somebody at a game they had beaten you at. Once for each opponent and game. || You paid back the debt.",
    review: READ,
  },
  longGame: {
    blurb: "最後まで長く続いた対局にもらえます。",
    sentence: "最後までもつれた対局でした。",
    back: "You get it for a game that lasted a long time to the end. || It was a game that dragged on to the end.",
    review: READ,
  },
  comeback: {
    blurb: "負けていた対局に勝ったときにもらえます。",
    sentence: "逆転勝ちです。",
    back: "You get it when you win a game you were losing. || A win from behind.",
    review: READ,
  },
  winStreak3: {
    blurb: "間に負けをはさまず3連勝したときにもらえます。",
    sentence: "3連勝です。",
    back: "You get it when you win three in a row with no loss between them. || Three wins in a row.",
    review: READ,
  },
  winStreak5: {
    blurb: "間に負けをはさまず5連勝したときにもらえます。",
    sentence: "5連勝です。",
    back: "You get it when you win five in a row with no loss between them. || Five wins in a row.",
    review: READ,
  },
  winStreak10: {
    blurb: "間に負けをはさまず10連勝したときにもらえます。",
    sentence: "10連勝です。",
    back: "You get it when you win ten in a row with no loss between them. || Ten wins in a row.",
    review: READ,
  },
  upsetWin: {
    blurb: "勝ちに上乗せして、レーティングが確定していて自分より100以上高い相手に勝ったときにもらえます。",
    sentence: "自分より強い相手に勝ちました。",
    back: "On top of the win, you get it when you beat an opponent whose rating is settled and at least 100 above yours. || You beat somebody stronger than you.",
    review: READ,
  },
  bigUpsetWin: {
    blurb: "勝ちに上乗せして、レーティングが確定していて自分より200以上高い相手に勝ったときにもらえます。",
    sentence: "自分よりはるかに強い相手に勝ちました。",
    back: "On top of the win, you get it when you beat an opponent whose rating is settled and at least 200 above yours. || You beat somebody far stronger than you.",
    review: READ,
  },
  giantKilled: {
    blurb: "勝ちに上乗せして、順位が上位で自分より300以上レーティングが高い相手に勝ったときにもらえます。",
    sentence: "ここで屈指の強豪に勝ちました。",
    back: "On top of the win, you get it when you beat a highly ranked opponent whose rating is at least 300 above yours. || You beat one of the strongest players here.",
    review: READ,
  },
  firstOfVariant: {
    blurb: "ゲームごとに、初めて遊んだときにもらえます。ゲームは全部で{games}種類あります。",
    sentence: "まだ遊んだことのないゲームでした。",
    back: "You get it, for each game, when you play it for the first time. There are {games} kinds of game in all. || It was a game you had not played yet.",
    review: READ,
  },
  firstWinAtVariant: {
    blurb: "{games}種類あるゲームのうち、1つで初めて勝ったときにもらえます。",
    sentence: "このゲームで初めての勝ちです。",
    back: "You get it when you win for the first time at one of the {games} kinds of game. || Your first win at this game.",
    review: READ,
  },
  firstOfFamily: {
    blurb: "{families}系統あるうち、1つの系統で初めて対局したときにもらえます。",
    sentence: "まだ知らなかった系統のゲームです。",
    back: "You get it when you play your first game from one of the {families} families. || A game from a family you did not know yet.",
    review: READ,
  },
  everyFamilyPlayed: {
    blurb: "{families}系統のすべてで、ゲームを1つ以上遊んだときにもらえます。",
    sentence: "{families}系統すべてを遊びました。",
    back: "You get it when you have played at least one game from every one of the {families} families. || You have played all {families} families.",
    review: READ,
  },
  everyVariantPlayed: {
    blurb: "サイトにある{games}種類のゲームをすべて遊んだときにもらえます。",
    sentence: "{games}種類すべてを遊びました。",
    back: "You get it when you have played all {games} kinds of game on the site. || You have played all {games} kinds.",
    review: READ,
  },
  everyVariantWonInFamily: {
    blurb: "ゲームが2つ以上ある系統で、そのすべてのゲームに勝ったときにもらえます。最後の1つに勝った対局に付きます。",
    sentence: "この系統のすべてのゲームで勝ちました。",
    back: "You get it when you have won at every game in a family that has two or more games. It goes with the game that wins the last one. || You have won at every game in this family.",
    review: READ,
  },
  puzzleSolved: {
    blurb: "パズルを最後まで解き、サイトの確認を通ったときにもらえます。同じパズルは一度だけです。",
    sentence: "パズルを解きました。",
    back: "You get it when you solve a puzzle all the way through and the site's check passes. The same puzzle only once. || You solved a puzzle.",
    review: READ,
  },
  puzzleEnded: {
    blurb: "解けなくても、パズルを最後まで遊び切ったときにもらえます。言葉のパズルは最後の推測まで、ほかのパズルは時計が切れるまでです。同じパズルは一度だけです。",
    sentence: "パズルに最後まで挑戦しました。",
    back: "You get it when you play a puzzle out to its end even without solving it. For a word puzzle that is to the last guess, for other puzzles until the clock runs out. The same puzzle only once. || You tried a puzzle to the end.",
    review: READ,
  },
  raceWon: {
    blurb: "2人が同じパズルで競い、先に正解したときにもらえます。",
    sentence: "競争に勝ちました。",
    back: "You get it when two people race on the same puzzle and you get it right first. || You won the race.",
    review: READ,
  },
  wins10: {
    blurb: "1つのゲームで10勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで10勝です。",
    back: "You get it when you reach your tenth win at one game. Once for each game. || Ten wins at this game.",
    review: READ,
  },
  wins100: {
    blurb: "1つのゲームで100勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで100勝です。",
    back: "You get it when you reach your hundredth win at one game. Once for each game. || A hundred wins at this game.",
    review: READ,
  },
  wins250: {
    blurb: "1つのゲームで250勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで250勝です。",
    back: "You get it when you reach your 250th win at one game. Once for each game. || 250 wins at this game.",
    review: READ,
  },
  wins500: {
    blurb: "1つのゲームで500勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで500勝です。",
    back: "You get it when you reach your 500th win at one game. Once for each game. || 500 wins at this game.",
    review: READ,
  },
  wins1000: {
    blurb: "1つのゲームで1000勝目を挙げたときにもらえます。ゲームごとに一度です。",
    sentence: "このゲームで1000勝です。",
    back: "You get it when you reach your 1,000th win at one game. Once for each game. || 1,000 wins at this game.",
    review: READ,
  },
  losses10: {
    blurb: "1つのゲームで10敗したときにもらえます。誰かが、勝ち甲斐のある対局を必要としていました。",
    sentence: "このゲームで10敗。よく戦いました。",
    back: "You get it when you have lost ten times at one game. Somebody needed a game worth winning. || Ten losses at this game. You fought well.",
    review: READ,
  },
  losses50: {
    blurb: "1つのゲームで50敗したときにもらえます。対局した誰もが強くなっていきます。",
    sentence: "このゲームで50敗。稽古相手です。",
    back: "You get it when you have lost fifty times at one game. Everybody who plays you gets stronger. || Fifty losses at this game. A practice partner.",
    review: READ,
  },
  losses100: {
    blurb: "1つのゲームで100敗したときにもらえます。勝った人たちはこの踏み台で上へ進みました。ありがとう。",
    sentence: "このゲームで100敗。踏み台です。",
    back: "You get it when you have lost a hundred times at one game. The people who won climbed on this stepping stone. Thank you. || A hundred losses at this game. A stepping stone.",
    review: READ,
  },
  losses250: {
    blurb: "1つのゲームで250敗しても、まだ席に着いて対局しているときにもらえます。",
    sentence: "このゲームで250敗。好敵手です。",
    back: "You get it when you have lost 250 times at one game and still sit down to play. || 250 losses at this game. A worthy rival.",
    review: READ,
  },
  losses500: {
    blurb: "1つのゲームで500敗したときにもらえます。誰にもやめさせられませんでした。",
    sentence: "このゲームで500敗。決してあきらめません。",
    back: "You get it when you have lost 500 times at one game. Nobody could make you stop. || 500 losses at this game. You never give up.",
    review: READ,
  },
  losses1000: {
    blurb: "1つのゲームで1000敗したときにもらえます。根性の伝説です。",
    sentence: "このゲームで1000敗。根性の伝説です。",
    back: "You get it when you have lost 1,000 times at one game. A legend of grit. || 1,000 losses at this game. A legend of grit.",
    review: READ,
  },
  draws10: {
    blurb: "1つのゲームで10回引き分けたときにもらえます。誰にも破られず、誰も破れませんでした。",
    sentence: "このゲームで10回引き分け。引き分けの名人です。",
    back: "You get it when you have drawn ten times at one game. Nobody beat you, and you beat nobody. || Ten draws at this game. A master of draws.",
    review: READ,
  },
  fullHouse: {
    blurb: "初めて満卓にしたときにもらえます。20局を同時に進め、そのどれも相手が応じている状態です。",
    sentence: "満卓です。20局が進行中です。",
    back: "You get it when you first fill the table. Twenty games are going at once, and in every one the opponent has answered. || A full table. Twenty games are in progress.",
    review: READ,
  },
  cleanSweepFirst: {
    blurb: "その日の一掃に上乗せして、満卓を動かし続けた最初の日にもらえます。一度だけです。",
    sentence: "初めての一掃です。",
    back: "On top of the day's clean sweep, you get it on the first day you keep a full table moving. Only once. || Your first clean sweep.",
    review: READ,
  },
  cleanSweep: {
    blurb: "満卓の状態で、自分の手番待ちが1つも残らず、その日に手を指したときにもらえます。",
    sentence: "一掃です。自分の手番待ちはありません。",
    back: "You get it on a day at a full table with nothing left waiting on your move, and moves made that day. || A clean sweep. Nothing is waiting on you.",
    review: READ,
  },
  fullHouseCombo7: {
    blurb: "一掃を7日連続で達成したときにもらえます。満卓を毎日、1週間動かし続けた記録です。",
    sentence: "満卓を7日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep seven days in a row: a full table kept moving every day for a week. || You kept a full table moving for seven days.",
    review: READ,
  },
  fullHouseCombo15: {
    blurb: "一掃を15日連続で達成したときにもらえます。満卓を毎日動かし続けた記録です。",
    sentence: "満卓を15日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep fifteen days in a row: a full table kept moving every day. || You kept a full table moving for fifteen days.",
    review: READ,
  },
  fullHouseCombo30: {
    blurb: "一掃を30日連続で達成したときにもらえます。満卓を1か月、動かし続けた記録です。",
    sentence: "満卓を30日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep thirty days in a row: a month at a full table, kept moving. || You kept a full table moving for thirty days.",
    review: READ,
  },
  fullHouseCombo60: {
    blurb: "一掃を60日連続で達成したときにもらえます。満卓を2か月、動かし続けた記録です。",
    sentence: "満卓を60日間、動かし続けました。",
    back: "You get it when you achieve a clean sweep sixty days in a row: two months at a full table, kept moving. || You kept a full table moving for sixty days.",
    review: READ,
  },
  fullHouseCombo120: {
    blurb: "一掃を120日連続で達成したときにもらえます。満卓で4か月を過ごした記録です。",
    sentence: "満卓を120日間、続けました。",
    back: "You get it when you achieve a clean sweep 120 days in a row: four months spent at a full table. || You kept a full table going for 120 days.",
    review: READ,
  },
  fullHouseCombo250: {
    blurb: "満卓で一掃を250日連続で達成したときにもらえます。",
    sentence: "満卓を250日間、続けました。",
    back: "You get it when you achieve a clean sweep at a full table 250 days in a row. || You kept a full table going for 250 days.",
    review: READ,
  },
  fullHouseCombo500: {
    blurb: "満卓で一掃を500日連続で達成したときにもらえます。",
    sentence: "満卓を500日間、続けました。",
    back: "You get it when you achieve a clean sweep at a full table 500 days in a row. || You kept a full table going for 500 days.",
    review: READ,
  },
  fullHouseCombo1000: {
    blurb: "満卓で一掃を1000日連続で達成したときにもらえます。うっかりでは、誰もここまで来られません。",
    sentence: "満卓を1000日間、続けました。",
    back: "You get it when you achieve a clean sweep at a full table 1,000 days in a row. Nobody gets this far by accident. || You kept a full table going for 1,000 days.",
    review: READ,
  },
  gradeBeaten: {
    blurb: "コンピュータの5つの段階のうち、それぞれの段階に初めて勝ったときにもらえます。",
    sentence: "コンピュータの1つの段階に勝ちました。",
    back: "You get it when you win for the first time against each of the five grades of computer. || You beat one grade of the computer.",
    review: READ,
  },
  everyGradeBeaten: {
    blurb: "コンピュータの5つの段階すべてに勝ったときにもらえます。通常の目標のなかで最も難しいものです。",
    sentence: "5つの段階すべてに勝ちました。",
    back: "You get it when you have beaten all five grades of the computer. The hardest ordinary goal here. || You beat all five grades.",
    review: READ,
  },
  specialistBeaten: {
    blurb: "専門のコンピュータ2つのうち、どちらかをその得意なゲームで破ったときにもらえます。",
    sentence: "専門のコンピュータを、その得意なゲームで破りました。",
    back: "You get it when you beat either of the two specialist computers at its own game. || You beat a specialist computer at its own game.",
    review: READ,
  },
  firstBuddy: {
    blurb: "初めて仲間リストに誰かを加えたときにもらえます。",
    sentence: "初めての仲間です。",
    back: "You get it when you first add somebody to your buddy list. || Your first buddy.",
    review: READ,
  },
  buddyAdded: {
    blurb: "仲間リストに誰かを加えたときにもらえます。",
    sentence: "仲間が増えました。",
    back: "You get it when you add somebody to your buddy list. || You have one more buddy.",
    review: READ,
  },
  challengeSent: {
    blurb: "誰かに対局を申し込んだときにもらえます。",
    sentence: "対局を申し込みました。",
    back: "You get it when you offer somebody a game. || You offered a game.",
    review: READ,
  },
  challengeAnswered: {
    blurb: "誰かからの対局の申し込みに、最初の一手で応えたときにもらえます。",
    sentence: "申し込みに応えました。",
    back: "You get it when you answer somebody's offer of a game with a first move. || You answered the offer.",
    review: READ,
  },
  rematchPlayed: {
    blurb: "再戦を指したときにもらえます。もう一度指す価値のある対局です。",
    sentence: "再戦です。",
    back: "You get it when you play a rematch. A game worth playing twice. || A rematch.",
    review: READ,
  },
  forkPlayed: {
    blurb: "終わった対局の途中から、その局面の続きを指したときにもらえます。",
    sentence: "局面の続きを指しました。",
    back: "You get it when you play on from a position in the middle of a finished game. || You played a position on.",
    review: READ,
  },
  timeGiven: {
    blurb: "相手が時間を必要としているときに、持ち時間を足してあげるともらえます。",
    sentence: "思いやりのある行いでした。",
    back: "You get it when you give your opponent more time while they need it. || That was a considerate act.",
    review: READ,
  },
  applauseGiven: {
    blurb: "誰かが指した対局に拍手を送ったときにもらえます。",
    sentence: "拍手を送りました。",
    back: "You get it when you applaud a game somebody played. || You sent applause.",
    review: READ,
  },
  nameSet: {
    blurb: "ここで使う名前を決めたときにもらえます。",
    sentence: "名前を設定しました。",
    back: "You get it when you choose the name you go by here. || You set your name.",
    review: READ,
  },
  countrySet: {
    blurb: "どこから遊んでいるかを伝えたときにもらえます。",
    sentence: "国を設定しました。",
    back: "You get it when you say where you are playing from. || You set your country.",
    review: READ,
  },
  bioSet: {
    blurb: "自分のページに自己紹介を1行書いたときにもらえます。",
    sentence: "ページに自己紹介を書きました。",
    back: "You get it when you write a line about yourself on your page. || You wrote about yourself on your page.",
    review: READ,
  },
  wordsSet: {
    blurb: "どの端末でも席に着ける4つの言葉を設定したときにもらえます。",
    sentence: "4つの言葉を設定しました。",
    back: "You get it when you set the four words that let you take a seat on any device. || You set your four words.",
    review: READ,
  },
  seatClaimedElsewhere: {
    blurb: "ほかの人の画面で、4つの言葉を使って自分の席に着いたときにもらえます。",
    sentence: "別の端末で席に着きました。",
    back: "You get it when you take your seat on somebody else's screen using your four words. || You took your seat on another device.",
    review: READ,
  },
};

/** The four kinds of credit for another site that have no Itsutsu twin, in Japanese. */
export const IMPORTED_VOLUME_COPY_JA = {
  importedGames: {
    blurb: "他のサイトで最後まで終えた対局への加算です。ここに残されたその記録から数えています。",
    back: "An addition for games finished to the end on another site. It is counted from the record of them kept here.",
    review: READ,
  },
  importedWins: {
    blurb: "他のサイトで勝った対局への加算です。終えた分に上乗せされます。",
    back: "An addition for games won on another site. It is added on top of the finished games.",
    review: READ,
  },
  importedTournamentGames: {
    blurb: "他のサイトの大会で終えた対局への加算です。ふつうの対局より多く加算されます。",
    back: "An addition for games finished in a tournament on another site. More is added than for ordinary games.",
    review: READ,
  },
  importedTournamentWins: {
    blurb: "他のサイトの大会で勝った対局への加算です。",
    back: "An addition for games won in a tournament on another site.",
    review: READ,
  },
} satisfies Record<ImportedVolumeType, unknown>;
