import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the result.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_RESULT: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The headline over a game that was decided between two colours
  "result.decided": {
    text: "{colour}の勝ち",
    back: "{colour} wins",
    review: AGENT_READ,
  },
  // Why a game ended: the one who did it, and the same said to that one
  "result.line": {
    text: "{who}が勝ちの並びを完成させました。",
    back: "{who} completed a winning line.",
    review: AGENT_READ,
  },
  "result.lineYou": {
    text: "勝ちの並びを完成させました。",
    back: "You completed a winning line.",
    review: AGENT_READ,
  },
  "result.captures": {
    text: "{who}が勝ちに必要な数の石を取りました。",
    back: "{who} captured the number of stones needed to win.",
    review: AGENT_READ,
  },
  "result.capturesYou": {
    text: "勝ちに必要な数の石を取りました。",
    back: "You captured the number of stones needed to win.",
    review: AGENT_READ,
  },
  "result.time": {
    text: "{who}が時間切れになりました。",
    back: "{who} ran out of time.",
    review: AGENT_READ,
  },
  "result.timeYou": {
    text: "時間切れになりました。",
    back: "You ran out of time.",
    review: AGENT_READ,
  },
  "result.resign": {
    text: "{who}が投了しました。",
    back: "{who} resigned.",
    review: AGENT_READ,
  },
  "result.resignYou": {
    text: "投了しました。",
    back: "You resigned.",
    review: AGENT_READ,
  },
  "result.trap": {
    text: "{who}は逃げ場がありませんでした。",
    back: "{who} had no way out.",
    review: AGENT_READ,
  },
  "result.trapYou": {
    text: "逃げ場がありませんでした。",
    back: "You had no way out.",
    review: AGENT_READ,
  },
  "result.square": {
    text: "{who}が勝ちとなる正方形を作りました。",
    back: "{who} made the square that wins.",
    review: AGENT_READ,
  },
  "result.squareYou": {
    text: "勝ちとなる正方形を作りました。",
    back: "You made the square that wins.",
    review: AGENT_READ,
  },
  "result.full": {
    text: "{who}が、盤が埋まった時点でリードしていました。",
    back: "{who} was leading when the board filled up.",
    review: AGENT_READ,
  },
  "result.fullYou": {
    text: "盤が埋まった時点でリードしていました。",
    back: "You were leading when the board filled up.",
    review: AGENT_READ,
  },
  "result.count": {
    text: "終了時に、{who}の石のほうが多くなりました。",
    back: "At the end, {who} had more discs.",
    review: AGENT_READ,
  },
  "result.countYou": {
    text: "終了時に、石のほうが多くなりました。",
    back: "At the end, you had more discs.",
    review: AGENT_READ,
  },
  "result.camp": {
    text: "{who}が向こう側の陣地を先に埋めました。",
    back: "{who} filled the far camp first.",
    review: AGENT_READ,
  },
  "result.campYou": {
    text: "向こう側の陣地を先に埋めました。",
    back: "You filled the far camp first.",
    review: AGENT_READ,
  },
  "result.connection": {
    text: "{who}が盤の両側をつなぎました。",
    back: "{who} joined both sides of the board.",
    review: AGENT_READ,
  },
  "result.connectionYou": {
    text: "盤の両側をつなぎました。",
    back: "You joined both sides of the board.",
    review: AGENT_READ,
  },
  "result.blocked": {
    text: "{who}は打てる手がなくなりました。",
    back: "{who} had no move left.",
    review: AGENT_READ,
  },
  "result.blockedYou": {
    text: "打てる手がなくなりました。",
    back: "You had no move left.",
    review: AGENT_READ,
  },
  "result.territory": {
    text: "{who}が盤をより広く押さえました。",
    back: "{who} held more of the board.",
    review: AGENT_READ,
  },
  "result.territoryYou": {
    text: "盤をより広く押さえました。",
    back: "You held more of the board.",
    review: AGENT_READ,
  },
  // Why a game was drawn
  "result.noProgressRacing": {
    text: "規則で認められている期間、どちらの駒も陣地に近づきませんでした。",
    back: "For longer than the rules allow, no piece got any nearer to its camp.",
    review: AGENT_READ,
  },
  "result.noProgressTaking": {
    text: "規則で認められている期間、駒が取られず、動いた通常の駒もありませんでした。",
    back: "For longer than the rules allow, no piece was taken and no ordinary piece moved.",
    review: AGENT_READ,
  },
  "result.noProgressPlacing": {
    text: "駒をすべて置き終えたあと、規則で認められている期間を超えて、駒を滑らせ続けました。",
    back: "After every piece was placed, the sliding went on for longer than the rules allow.",
    review: AGENT_READ,
  },
  "result.noMoves": {
    text: "どちらにも打てる手がなくなりました。",
    back: "Neither side had a move left.",
    review: AGENT_READ,
  },
  "result.repetition": {
    text: "同じ手番で、同じ局面がもう一度現れました。",
    back: "The same position appeared again, with the same side to move.",
    review: AGENT_READ,
  },
  "result.endgameCount": {
    text: "規則で認められている手数のうちに、終盤で勝負がつきませんでした。",
    back: "The ending was not won within the number of moves the rules allow.",
    review: AGENT_READ,
  },
  "result.length": {
    text: "決められた手数まで進みました。",
    back: "The game went on to the number of moves it was given.",
    review: AGENT_READ,
  },
  "result.bothLines": {
    text: "双方が同時に並びを作りました。",
    back: "Both made a line at the same time.",
    review: AGENT_READ,
  },
  "result.boardFull": {
    text: "どちらも勝たないまま、盤が埋まりました。",
    back: "The board filled up with nobody winning.",
    review: AGENT_READ,
  },
  "result.draw": {
    text: "どちらも勝ちませんでした。",
    back: "Neither side won.",
    review: AGENT_READ,
  },
  // The score under a result
  "result.scorePairs": {
    text: "取った組数",
    back: "Pairs captured",
    review: AGENT_READ,
  },
  "result.scoreDiscs": {
    text: "石の数",
    back: "Number of discs",
    review: AGENT_READ,
  },
  "result.scoreArea": {
    text: "地",
    back: "Territory",
    review: AGENT_READ,
  },
  "result.scoreLine": {
    text: "{label}：{black} {blackScore}・{white} {whiteScore}",
    back: "{label}: {black} {blackScore}, {white} {whiteScore}",
    review: AGENT_READ,
  },
  // The card's buttons and lines
  "result.rematch": {
    text: "再戦",
    back: "Rematch",
    review: AGENT_READ,
  },
  "result.again": {
    text: "もう一局",
    back: "Another game",
    review: AGENT_READ,
  },
  "result.newGame": {
    text: "新規対局",
    back: "New game",
    review: AGENT_READ,
  },
  "result.review": {
    text: "棋譜を見る",
    back: "Look at the record of moves",
    review: AGENT_READ,
  },
  "result.close": {
    text: "閉じる",
    back: "Close",
    review: AGENT_READ,
  },
  "result.xp": {
    text: "この対局で経験値+{points}",
    back: "Experience points +{points} from this game",
    review: AGENT_READ,
  },
  "result.rating": {
    text: "レーティング {mine}・相手 {theirs}",
    back: "Rating {mine}, opponent {theirs}",
    review: AGENT_READ,
  },
  "result.levelUp": {
    text: "昇級：{name}",
    back: "Promotion: {name}",
    review: AGENT_READ,
  },
  "result.nextLevel": {
    text: "次のレベル：{name}",
    back: "Next level: {name}",
    review: AGENT_READ,
  },
  "result.waiting.one": {
    text: "1局で手番が来ています",
    back: "It is your move in 1 game",
    review: AGENT_READ,
  },
  "result.waiting.other": {
    text: "{count}局で手番が来ています",
    back: "It is your move in {count} games",
    review: AGENT_READ,
  },
};
