import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the played.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PLAYED: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The seat nobody can name
  "played.otherSeat": {
    text: "相手の席",
    back: "the other seat",
    review: AGENT_READ,
  },
  "played.somebody": {
    text: "だれか",
    back: "Somebody",
    review: AGENT_READ,
  },
  // Applause: five marks anybody who saw a game may leave
  "played.applauseWell": {
    text: "お見事",
    back: "Well done",
    review: AGENT_READ,
  },
  "played.applauseBrilliant": {
    text: "素晴らしい",
    back: "Wonderful",
    review: AGENT_READ,
  },
  "played.applauseAstonishing": {
    text: "驚いた",
    back: "I was astonished",
    review: AGENT_READ,
  },
  "played.applauseRespect": {
    text: "敬意",
    back: "Respect",
    review: AGENT_READ,
  },
  "played.applauseBeautiful": {
    text: "美しい対局",
    back: "A beautiful game",
    review: AGENT_READ,
  },
  "played.applauseTitle": {
    text: "拍手",
    back: "Applause",
    review: AGENT_READ,
  },
  "played.applauseHint": {
    text: "この対局を見た人は誰でも、印を1つ残せます。ブーイングはできません。",
    back: "Anybody who has seen this game can leave one mark on it. Booing is not possible.",
    review: AGENT_READ,
  },
  "played.applauseYours": {
    text: "自分の印",
    back: "My mark",
    review: AGENT_READ,
  },
  "played.applauseNone": {
    text: "まだ拍手はありません。いちばん乗りで、この対局がよかったと伝えましょう。",
    back: "There is no applause yet. Be the first to say this game was good.",
    review: AGENT_READ,
  },
  "played.applauseSignedOut": {
    text: "印を残すにはサインインしてください。",
    back: "Please sign in to leave a mark.",
    review: AGENT_READ,
  },
  "played.applauseNoAccount": {
    text: "印を残すにはアカウントが必要です。招待コードだけではアカウントになりません。",
    back: "Leaving a mark needs an account. An invite code alone does not make an account.",
    review: AGENT_READ,
  },
  // The ten reactions beside a game, and the six quick phrases
  "played.reactionNice": {
    text: "いい手",
    back: "A good move",
    review: AGENT_READ,
  },
  "played.reactionFire": {
    text: "絶好調",
    back: "In top form",
    review: AGENT_READ,
  },
  "played.reactionSurprise": {
    text: "その手は読めなかった",
    back: "I did not read that move",
    review: AGENT_READ,
  },
  "played.reactionThinking": {
    text: "考え中",
    back: "Thinking",
    review: AGENT_READ,
  },
  "played.reactionClose": {
    text: "危なかった",
    back: "That was close",
    review: AGENT_READ,
  },
  "played.reactionHa": {
    text: "はは",
    back: "Ha ha",
    review: AGENT_READ,
  },
  "played.reactionOhNo": {
    text: "あらら",
    back: "Oh dear",
    review: AGENT_READ,
  },
  "played.reactionWellPlayed": {
    text: "お見事",
    back: "Well done",
    review: AGENT_READ,
  },
  "played.reactionTakeTime": {
    text: "ごゆっくり",
    back: "Take your time",
    review: AGENT_READ,
  },
  "played.reactionHello": {
    text: "こんにちは",
    back: "Hello",
    review: AGENT_READ,
  },
  "played.quickHello": {
    text: "こんにちは、よろしくお願いします",
    back: "Hello, I look forward to playing with you",
    review: AGENT_READ,
  },
  "played.quickNoRush": {
    text: "ゆっくりで大丈夫です",
    back: "Taking it slowly is fine",
    review: AGENT_READ,
  },
  "played.quickThink": {
    text: "ここは少し考えさせてください",
    back: "Please let me think about this one a little",
    review: AGENT_READ,
  },
  "played.quickMisclick": {
    text: "すみません、押し間違えました",
    back: "Sorry, I pressed the wrong place",
    review: AGENT_READ,
  },
  "played.quickAway": {
    text: "席を外します。あとで戻ります",
    back: "I am stepping away. I will be back later",
    review: AGENT_READ,
  },
  "played.quickGoodGame": {
    text: "いい対局でした、ありがとうございました",
    back: "It was a good game, thank you very much",
    review: AGENT_READ,
  },
  // How long a clock allows
  "played.noClock": {
    text: "無制限",
    back: "Unlimited",
    review: AGENT_READ,
  },
  "played.minutes.one": {
    text: "{count}分",
    back: "{count} minute",
    review: AGENT_READ,
  },
  "played.minutes.other": {
    text: "{count}分",
    back: "{count} minutes",
    review: AGENT_READ,
  },
  "played.hours.one": {
    text: "{count}時間",
    back: "{count} hour",
    review: AGENT_READ,
  },
  "played.hours.other": {
    text: "{count}時間",
    back: "{count} hours",
    review: AGENT_READ,
  },
  "played.days.one": {
    text: "{count}日",
    back: "{count} day",
    review: AGENT_READ,
  },
  "played.days.other": {
    text: "{count}日",
    back: "{count} days",
    review: AGENT_READ,
  },
  "played.perMove": {
    text: "1手{time}",
    back: "{time} per move",
    review: AGENT_READ,
  },
  "played.perGame": {
    text: "対局全体で各{time}",
    back: "{time} each for the whole game",
    review: AGENT_READ,
  },
  "played.overdue": {
    text: "期限切れ",
    back: "overdue",
    review: AGENT_READ,
  },
  "played.leftSeconds": {
    text: "{seconds}秒",
    back: "{seconds} seconds",
    review: AGENT_READ,
  },
  "played.leftMinutes": {
    text: "{minutes}分{seconds}秒",
    back: "{minutes} minutes {seconds} seconds",
    review: AGENT_READ,
  },
  "played.leftHours": {
    text: "{hours}時間{minutes}分",
    back: "{hours} hours {minutes} minutes",
    review: AGENT_READ,
  },
  "played.leftDays": {
    text: "{days}日{hours}時間",
    back: "{days} days {hours} hours",
    review: AGENT_READ,
  },
  // The finished-games picture and its choices
  "played.endingsHeading": {
    text: "すべての対局の終局図",
    back: "The ending of every game",
    review: AGENT_READ,
  },
  "played.endingsBlurb": {
    text: "1種類のゲームについて、各対局の最後の局面を、画面の大きさの1枚の絵に並べます。ブラウザで描き、新しい対局から順に並びます。",
    back: "The last position of every game of one kind, lined up on one picture the size of your screen. It is drawn in your browser, newest game first.",
    review: AGENT_READ,
  },
  "played.endingsGame": {
    text: "ゲーム",
    back: "Game",
    review: AGENT_READ,
  },
  "played.endingsWhich": {
    text: "対象",
    back: "Which",
    review: AGENT_READ,
  },
  "played.endingsWon": {
    text: "勝ち",
    back: "Won",
    review: AGENT_READ,
  },
  "played.endingsLost": {
    text: "負け",
    back: "Lost",
    review: AGENT_READ,
  },
  "played.endingsAll": {
    text: "終わった対局すべて",
    back: "All finished games",
    review: AGENT_READ,
  },
  "played.endingsMake": {
    text: "絵を作る",
    back: "Make the picture",
    review: AGENT_READ,
  },
  "played.endingsMaking": {
    text: "描いています…",
    back: "Drawing…",
    review: AGENT_READ,
  },
  "played.endingsDownload": {
    text: "ダウンロード",
    back: "Download",
    review: AGENT_READ,
  },
  "played.endingsNone": {
    text: "その種類の終わった対局がなく、描けません。",
    back: "There are no finished games of that kind, so nothing can be drawn.",
    review: AGENT_READ,
  },
  "played.endingsOtherSizes.one": {
    text: "ほかの盤の大きさの対局1局は含めていません。",
    back: "1 game on another board size is not included.",
    review: AGENT_READ,
  },
  "played.endingsOtherSizes.other": {
    text: "ほかの盤の大きさの対局{count}局は含めていません。",
    back: "{count} games on other board sizes are not included.",
    review: AGENT_READ,
  },
  "played.endingsFailed": {
    text: "絵を作れませんでした。",
    back: "The picture could not be made.",
    review: AGENT_READ,
  },
  // Filters and chips on a record
  "played.poolPeople": {
    text: "対人",
    back: "Against people",
    review: AGENT_READ,
  },
  "played.poolComputer": {
    text: "対コンピュータ",
    back: "Against computers",
    review: AGENT_READ,
  },
  "played.rated": {
    text: "レーティング対局",
    back: "Rated game",
    review: AGENT_READ,
  },
  "played.friendly": {
    text: "親善対局",
    back: "Friendly game",
    review: AGENT_READ,
  },
  "played.paidIp": {
    text: "IPを獲得",
    back: "Earned IP",
    review: AGENT_READ,
  },
  "played.judged": {
    text: "評価済み",
    back: "Judged",
    review: AGENT_READ,
  },
  "played.sortPlayed": {
    text: "対局日",
    back: "Date played",
    review: AGENT_READ,
  },
  "played.sortLength": {
    text: "手数",
    back: "Number of moves",
    review: AGENT_READ,
  },
  "played.sortBoard": {
    text: "盤の大きさ",
    back: "Board size",
    review: AGENT_READ,
  },
  "played.sortTime": {
    text: "所要時間",
    back: "Time taken",
    review: AGENT_READ,
  },
  "played.playersGames": {
    text: "{name}さんの対局",
    back: "{name}'s games",
    review: AGENT_READ,
  },
  // The record as plain text
  "played.textDate": {
    text: "日付",
    back: "Date",
    review: AGENT_READ,
  },
  "played.textGame": {
    text: "ゲーム",
    back: "Game",
    review: AGENT_READ,
  },
  "played.textBlack": {
    text: "黒",
    back: "Black",
    review: AGENT_READ,
  },
  "played.textWhite": {
    text: "白",
    back: "White",
    review: AGENT_READ,
  },
  "played.textResult": {
    text: "結果",
    back: "Result",
    review: AGENT_READ,
  },
  "played.textMoves": {
    text: "手数",
    back: "Moves",
    review: AGENT_READ,
  },
  "played.textNone": {
    text: "対局はまだありません。",
    back: "There are no games yet.",
    review: AGENT_READ,
  },
  "played.textPartial": {
    text: "{total}局のうち{shown}局です。残りはサイトで見られます。",
    back: "{shown} of {total} games; the rest can be seen on the site.",
    review: AGENT_READ,
  },
};
