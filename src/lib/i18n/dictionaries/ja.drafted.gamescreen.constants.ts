import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the gamescreen.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_GAMESCREEN: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // Appearance
  "gamescreen.stones": {
    text: "石",
    back: "Stones",
    review: AGENT_READ,
  },
  "gamescreen.grid": {
    text: "罫線",
    back: "Grid lines",
    review: AGENT_READ,
  },
  "gamescreen.coordinates": {
    text: "座標",
    back: "Coordinates",
    review: AGENT_READ,
  },
  "gamescreen.moveNumbers": {
    text: "手数",
    back: "Move numbers",
    review: AGENT_READ,
  },
  "gamescreen.moveNumbersHint": {
    text: "印刷された棋譜のように、石に手数を書きます。",
    back: "Numbers the stones as a printed record of a game does.",
    review: AGENT_READ,
  },
  "gamescreen.flipHint": {
    text: "自分だけの向きです。盤の向こう側が手前に来て、文字と数字もいっしょに反転します。ほかの人の盤は動きません。",
    back: "Your own view only. The far side of the board comes nearest to you, and the letters and numbers turn with it. Nobody else's board moves.",
    review: AGENT_READ,
  },
  "gamescreen.pieceColours": {
    text: "駒の色",
    back: "Piece colours",
    review: AGENT_READ,
  },
  "gamescreen.colourOf": {
    text: "{colour}の色",
    back: "{colour}'s colour",
    review: AGENT_READ,
  },
  // The computer opponent
  "gamescreen.computer": {
    text: "コンピュータの相手",
    back: "Computer opponent",
    review: AGENT_READ,
  },
  "gamescreen.thinking": {
    text: "考え中…",
    back: "thinking…",
    review: AGENT_READ,
  },
  "gamescreen.playsAs": {
    text: "打つ席",
    back: "Plays as",
    review: AGENT_READ,
  },
  "gamescreen.nobody": {
    text: "なし（2人で対局）",
    back: "Nobody (two people play)",
    review: AGENT_READ,
  },
  "gamescreen.strength": {
    text: "強さ",
    back: "Strength",
    review: AGENT_READ,
  },
  "gamescreen.computerNote": {
    text: "この端末で考えるので、サーバーからの返答（4分の1秒）と違い、1手に数秒かかることがあります。対局そのものは、ほかの練習対局と同じように記録されます。",
    back: "It thinks on this device, so unlike a reply from the server (a quarter of a second), a move can take a few seconds. The game itself is recorded just like any other practice game.",
    review: AGENT_READ,
  },
  "gamescreen.botStopped": {
    text: "コンピュータが止まりました：{why}。再開するには、「なし」を選んでから、元の席を選び直してください。",
    back: "The computer stopped: {why}. To restart it, choose \"None\" and then choose the original seat again.",
    review: AGENT_READ,
  },
  "gamescreen.botStoppedWhy": {
    text: "原因は不明です",
    back: "the cause is unknown",
    review: AGENT_READ,
  },
  // A small game embedded on another page
  "gamescreen.toPlay": {
    text: "{colour}の手番",
    back: "{colour} to play",
    review: AGENT_READ,
  },
  "gamescreen.draw": {
    text: "引き分け",
    back: "Draw",
    review: AGENT_READ,
  },
  // Choosing a game, and the controls under the board
  "gamescreen.inspiredBy": {
    text: "着想：{name}",
    back: "Inspired by {name}",
    review: AGENT_READ,
  },
  "gamescreen.undoOff": {
    text: "この対局では、待ったは使えません。",
    back: "Taking moves back is turned off for this game.",
    review: AGENT_READ,
  },
  "gamescreen.resizeBigger": {
    text: "{seat}は、盤を{size}×{size}に広げたいと言っています。",
    back: "{seat} says it wants to widen the board to {size}×{size}.",
    review: AGENT_READ,
  },
  "gamescreen.resizeSmaller": {
    text: "{seat}は、盤を{size}×{size}に縮めたいと言っています。",
    back: "{seat} says it wants to shrink the board to {size}×{size}.",
    review: AGENT_READ,
  },
  "gamescreen.resizeNote": {
    text: "石の位置はそのままで、手番を失う人もいません。",
    back: "The stones keep their positions, and nobody loses a turn.",
    review: AGENT_READ,
  },
  "gamescreen.helpFor": {
    text: "{seat}へ：{message}",
    back: "To {seat}: {message}",
    review: AGENT_READ,
  },
  "gamescreen.hintLine": {
    text: "{point}の手：{label}",
    back: "The move at {point}: {label}",
    review: AGENT_READ,
  },
  "gamescreen.setUpTitle": {
    text: "設定",
    back: "Settings",
    review: AGENT_READ,
  },
  // Settings
  "gamescreen.firstStone": {
    text: "先手",
    back: "First player",
    review: AGENT_READ,
  },
  "gamescreen.alwaysBlack": {
    text: "{game}は、いつも黒から始まります。",
    back: "{game} always starts with black.",
    review: AGENT_READ,
  },
  "gamescreen.obstacles": {
    text: "障害物",
    back: "Obstacles",
    review: AGENT_READ,
  },
  "gamescreen.inARow": {
    text: "{count}つ並べる",
    back: "{count} in a row",
    review: AGENT_READ,
  },
  "gamescreen.allowUndo": {
    text: "待ったを許可",
    back: "Allow taking moves back",
    review: AGENT_READ,
  },
  "gamescreen.allowUndoHint": {
    text: "すべての石が確定する対局にするときは、オフにします。",
    back: "Switch it off for a game where every stone is final.",
    review: AGENT_READ,
  },
  "gamescreen.allowSkip": {
    text: "手番の見送りを許可",
    back: "Allow passing up a turn",
    review: AGENT_READ,
  },
  "gamescreen.allowSwap": {
    text: "色の交代を許可",
    back: "Allow swapping colours",
    review: AGENT_READ,
  },
  "gamescreen.allowResize": {
    text: "盤の大きさの変更を許可",
    back: "Allow changing the size of the board",
    review: AGENT_READ,
  },
  "gamescreen.length": {
    text: "手数の上限",
    back: "Limit on moves",
    review: AGENT_READ,
  },
  "gamescreen.analysis": {
    text: "脅威の読み",
    back: "Threat reading",
    review: AGENT_READ,
  },
  "gamescreen.hints": {
    text: "ヒント",
    back: "Hints",
    review: AGENT_READ,
  },
  "gamescreen.warnBeforeThree": {
    text: "三ができる前に警告",
    back: "Warn before a three forms",
    review: AGENT_READ,
  },
  "gamescreen.hintsPerPlayer": {
    text: "1人あたりのヒント数",
    back: "Hints per player",
    review: AGENT_READ,
  },
  "gamescreen.changingRule": {
    text: "規則を変えると、新しい対局が始まります。",
    back: "Changing a rule starts a new game.",
    review: AGENT_READ,
  },
  // Statistics for one game
  "gamescreen.statMoves": {
    text: "手数",
    back: "Moves",
    review: AGENT_READ,
  },
  "gamescreen.statTime": {
    text: "使った時間",
    back: "Time used",
    review: AGENT_READ,
  },
  "gamescreen.statLongest": {
    text: "最長考",
    back: "Longest think",
    review: AGENT_READ,
  },
  "gamescreen.statThreats": {
    text: "放置した脅威",
    back: "Threats left alone",
    review: AGENT_READ,
  },
  "gamescreen.statLosing": {
    text: "敗着",
    back: "Losing moves",
    review: AGENT_READ,
  },
  "gamescreen.statHints": {
    text: "使ったヒント",
    back: "Hints used",
    review: AGENT_READ,
  },
  "gamescreen.statsLine": {
    text: "{moves}・盤の前で{time}",
    back: "{moves}, {time} at the board",
    review: AGENT_READ,
  },
  // The status line over the board
  "gamescreen.winsOnTime": {
    text: "{who}の勝ちです（相手が時間切れ）",
    back: "{who} wins (the other side ran out of time)",
    review: AGENT_READ,
  },
  "gamescreen.winsOnDiscs": {
    text: "{who}の勝ちです。石の数は{black}対{white}です。",
    back: "{who} wins. The discs are {black} to {white}.",
    review: AGENT_READ,
  },
  "gamescreen.winsCamp": {
    text: "{who}の勝ちです。向こう側の陣地が埋まりました。",
    back: "{who} wins. The far camp is full.",
    review: AGENT_READ,
  },
  "gamescreen.winsTopBottom": {
    text: "{who}の勝ちです。上と下がつながりました。",
    back: "{who} wins. Top and bottom are joined.",
    review: AGENT_READ,
  },
  "gamescreen.winsLeftRight": {
    text: "{who}の勝ちです。左と右がつながりました。",
    back: "{who} wins. Left and right are joined.",
    review: AGENT_READ,
  },
  "gamescreen.winsBlocked": {
    text: "{who}の勝ちです。相手に打てる手がなくなりました。",
    back: "{who} wins. The other side has no move left.",
    review: AGENT_READ,
  },
  "gamescreen.winsResign": {
    text: "{who}の勝ちです（相手が投了）",
    back: "{who} wins (the other side resigned)",
    review: AGENT_READ,
  },
  "gamescreen.winsIn": {
    text: "{who}の勝ちです（{moves}）",
    back: "{who} wins ({moves})",
    review: AGENT_READ,
  },
  "gamescreen.whoToPlay": {
    text: "{who}の手番",
    back: "{who} to play",
    review: AGENT_READ,
  },
  "gamescreen.fatalLine": {
    text: "{label}：{colour}、{move}手目",
    back: "{label}: {colour}, move {move}",
    review: AGENT_READ,
  },
  "gamescreen.captureLine": {
    text: "{label}・{black}{blackCount}・{white}{whiteCount}・{rule}",
    back: "{label}, {black} {blackCount}, {white} {whiteCount}, {rule}",
    review: AGENT_READ,
  },
  "gamescreen.handicapLead": {
    text: "{lead}：{parts}を適用。",
    back: "{lead}: {parts} applied.",
    review: AGENT_READ,
  },
  "gamescreen.homeOf": {
    text: "自陣に入った数（各{count}枚中）",
    back: "number at home (out of {count} each)",
    review: AGENT_READ,
  },
  "gamescreen.nextMove": {
    text: "{move}手目",
    back: "Move {move}",
    review: AGENT_READ,
  },
  "gamescreen.reviewingAt": {
    text: "{move}・{total}手中{index}手目を検討中",
    back: "{move}, reviewing move {index} of {total}",
    review: AGENT_READ,
  },
  "gamescreen.passAndPlay": {
    text: "1台で交代対局",
    back: "Pass and play",
    review: AGENT_READ,
  },
  "gamescreen.sourcePractice": {
    text: "{site}での練習：両方の色を自分で打ち、レーティングには数えません",
    back: "Practice on {site}: you play both colours yourself, and nothing counts for rating",
    review: AGENT_READ,
  },
  "gamescreen.sourcePass": {
    text: "{site}で、1つの画面を使って対局",
    back: "Played on {site}, using one screen",
    review: AGENT_READ,
  },
  "gamescreen.settingUp": {
    text: "盤を並べています…",
    back: "Setting out the board…",
    review: AGENT_READ,
  },
  // The list of moves, pieces and review
  "gamescreen.moveFormats": {
    text: "手の書き方",
    back: "How the moves are written",
    review: AGENT_READ,
  },
  "gamescreen.historyAria": {
    text: "手をクリックしたときの動作",
    back: "What clicking a move does",
    review: AGENT_READ,
  },
  "gamescreen.keys": {
    text: "キー：Rで回転、Fで反転、Sで石を1つ置きます。",
    back: "Keys: R rotates, F flips, S places a single stone.",
    review: AGENT_READ,
  },
  "gamescreen.atLatestLine": {
    text: "{label}：{move}手目",
    back: "{label}: move {move}",
    review: AGENT_READ,
  },
  "gamescreen.reviewingLine": {
    text: "{label}：{total}手中{index}手目",
    back: "{label}: move {index} of {total}",
    review: AGENT_READ,
  },
  "gamescreen.startsNewLine": {
    text: "ここで打つと、新しい変化が始まります。",
    back: "Playing here starts a new line of play.",
    review: AGENT_READ,
  },
  "gamescreen.branchDiscards.one": {
    text: "ここで{point}に打つと、この局面のあとの1手が捨てられます。元には戻せません。",
    back: "Playing {point} from here discards the 1 move that came after this position. This cannot be undone.",
    review: AGENT_READ,
  },
  "gamescreen.branchDiscards.other": {
    text: "ここで{point}に打つと、この局面のあとの{count}手が捨てられます。元には戻せません。",
    back: "Playing {point} from here discards the {count} moves that came after this position. This cannot be undone.",
    review: AGENT_READ,
  },
  // A finished practice board and a result mark
  "gamescreen.resultDraw": {
    text: "引き分け",
    back: "Draw",
    review: AGENT_READ,
  },
  "gamescreen.resultUnfinished": {
    text: "中断",
    back: "Unfinished",
    review: AGENT_READ,
  },
  "gamescreen.resultYouWon": {
    text: "勝ち",
    back: "Won",
    review: AGENT_READ,
  },
  "gamescreen.resultYouLost": {
    text: "負け",
    back: "Lost",
    review: AGENT_READ,
  },
  "gamescreen.flip": {
    text: "盤を反転",
    back: "Flip the board",
    review: AGENT_READ,
  },
  "gamescreen.boardGroup": {
    text: "盤",
    back: "Board",
    review: AGENT_READ,
  },
  "gamescreen.openingNamed": {
    text: "{name}の開局ルール",
    back: "The {name} opening rule",
    review: AGENT_READ,
  },
  "gamescreen.rules": {
    text: "規則",
    back: "Rules",
    review: AGENT_READ,
  },
  "gamescreen.clock": {
    text: "持ち時間",
    back: "Time control",
    review: AGENT_READ,
  },
  "gamescreen.drawFull": {
    text: "引き分けです。盤が埋まりました。",
    back: "A draw. The board is full.",
    review: AGENT_READ,
  },
  "gamescreen.secondStone": {
    text: "2つ目の石：{name}",
    back: "second stone: {name}",
    review: AGENT_READ,
  },
  "gamescreen.practiceBoard": {
    text: "練習盤",
    back: "Practice board",
    review: AGENT_READ,
  },
  "gamescreen.players": {
    text: "対局者",
    back: "Players",
    review: AGENT_READ,
  },
  "gamescreen.stonesAsUsual": {
    text: "{colour}の石（いつもの色）",
    back: "{colour} stones (the usual colour)",
    review: AGENT_READ,
  },
};
