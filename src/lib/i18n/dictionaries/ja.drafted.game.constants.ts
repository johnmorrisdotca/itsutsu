import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the game.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_GAME: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // What each choice of threat reading, hints and history means
  "game.awarenessOff": {
    text: "なし",
    back: "None",
    review: AGENT_READ,
  },
  "game.awarenessOffDescription": {
    text: "盤は自分で読みます。",
    back: "You read the board yourself.",
    review: AGENT_READ,
  },
  "game.awarenessOutlook": {
    text: "形勢を言葉で説明",
    back: "Describe the position in words",
    review: AGENT_READ,
  },
  "game.awarenessOutlookDescription": {
    text: "優勢か劣勢かは教えますが、場所は教えません。",
    back: "You are told whether you are ahead or behind, but not where.",
    review: AGENT_READ,
  },
  "game.awarenessFull": {
    text: "脅威を盤上に表示",
    back: "Show threats on the board",
    review: AGENT_READ,
  },
  "game.awarenessFullDescription": {
    text: "受けが必要な脅威が、盤上に印で示されます。",
    back: "Threats that must be answered are marked on the board.",
    review: AGENT_READ,
  },
  "game.hintOff": {
    text: "ヒントなし",
    back: "No hints",
    review: AGENT_READ,
  },
  "game.hintOffDescription": {
    text: "エンジンは何も言いません。",
    back: "The engine says nothing.",
    review: AGENT_READ,
  },
  "game.hintLimited": {
    text: "ヒントの持ち分",
    back: "A share of hints each",
    review: AGENT_READ,
  },
  "game.hintLimitedDescription": {
    text: "好きなときに使うか、相手に1つ渡せます。",
    back: "Use them when you like, or give one to your opponent.",
    review: AGENT_READ,
  },
  "game.hintUnlimited": {
    text: "いつでも聞ける",
    back: "Can ask at any time",
    review: AGENT_READ,
  },
  "game.hintUnlimitedDescription": {
    text: "聞くたびに、エンジンが答えます。",
    back: "The engine answers every time you ask.",
    review: AGENT_READ,
  },
  "game.historyReview": {
    text: "見るだけ",
    back: "Look only",
    review: AGENT_READ,
  },
  "game.historyReviewDescription": {
    text: "対局を変えずに、手を順にたどれます。続けて打つには、最後の手に戻ってください。",
    back: "You can step through the game without changing it. To play on, return to the last move.",
    review: AGENT_READ,
  },
  "game.historyBranch": {
    text: "ここから打つ",
    back: "Play from here",
    review: AGENT_READ,
  },
  "game.historyBranchDescription": {
    text: "前の局面から打ち直せます。そのあとの手はすべて捨てられ、先に確認が出ます。",
    back: "You can play again from an earlier position. Everything after it is discarded, and you are asked first.",
    review: AGENT_READ,
  },
  // The game screen's buttons and headings
  "game.undo": {
    text: "待った",
    back: "Take back",
    review: AGENT_READ,
  },
  "game.redo": {
    text: "進む",
    back: "Go forward",
    review: AGENT_READ,
  },
  "game.newGame": {
    text: "新規対局",
    back: "New game",
    review: AGENT_READ,
  },
  "game.skip": {
    text: "捨て石を打つ",
    back: "Play a throwaway stone",
    review: AGENT_READ,
  },
  "game.skipHint": {
    text: "手番を使って、遠い隅に石を置きます。石は1つ減ります。",
    back: "Uses your turn to place a stone in a far corner. It still uses up a stone.",
    review: AGENT_READ,
  },
  "game.passHint": {
    text: "石を打たずに手番を渡します。連続して2回パスすると、対局が終わります。",
    back: "Hands over your turn without playing a stone. Two passes in a row end the game.",
    review: AGENT_READ,
  },
  "game.swap": {
    text: "色を交代",
    back: "Swap colours",
    review: AGENT_READ,
  },
  "game.swapHint": {
    text: "自分の色を渡して、相手の石を持ちます。この手番は使います。",
    back: "You hand over your colour and take your opponent's stones instead. It uses this move.",
    review: AGENT_READ,
  },
  "game.hint": {
    text: "最善手",
    back: "Best move",
    review: AGENT_READ,
  },
  "game.grant": {
    text: "ヒントを渡す",
    back: "Give a hint",
    review: AGENT_READ,
  },
  "game.grantHint": {
    text: "自分のヒントを1つ、相手に渡します。",
    back: "Give one of your hints to your opponent.",
    review: AGENT_READ,
  },
  "game.askHelp": {
    text: "助言を求める",
    back: "Ask for advice",
    review: AGENT_READ,
  },
  "game.askHelpHint": {
    text: "相手が、打つべきだと思う点に印をつけます。",
    back: "Your opponent marks the point they think you should play.",
    review: AGENT_READ,
  },
  "game.helpWaiting": {
    text: "自分なら打つ点に印をつけてください。",
    back: "Mark the point you would play.",
    review: AGENT_READ,
  },
  "game.cancelHelp": {
    text: "取り消す",
    back: "Cancel",
    review: AGENT_READ,
  },
  "game.moveHistory": {
    text: "棋譜",
    back: "Record of moves",
    review: AGENT_READ,
  },
  "game.settings": {
    text: "設定",
    back: "Settings",
    review: AGENT_READ,
  },
  "game.advanced": {
    text: "詳細",
    back: "Details",
    review: AGENT_READ,
  },
  "game.appearance": {
    text: "見た目",
    back: "Appearance",
    review: AGENT_READ,
  },
  "game.noHintsLeft": {
    text: "ヒントは残っていません。",
    back: "No hints are left.",
    review: AGENT_READ,
  },
  "game.swapUnavailableDecided": {
    text: "すでに勝負がついた局面なので、色の交代はできません。",
    back: "The position is already decided, so the colours cannot be swapped.",
    review: AGENT_READ,
  },
  "game.swapUnavailableSpent": {
    text: "色の交代はすでに使いました。",
    back: "You have already used your swap.",
    review: AGENT_READ,
  },
  "game.emptyRecord": {
    text: "まだ石がありません。",
    back: "There are no stones yet.",
    review: AGENT_READ,
  },
  "game.clock": {
    text: "時計",
    back: "Clock",
    review: AGENT_READ,
  },
  "game.byoyomi": {
    text: "秒読み",
    back: "Byo-yomi",
    review: AGENT_READ,
  },
  "game.stats": {
    text: "この対局",
    back: "This game",
    review: AGENT_READ,
  },
  "game.advantage": {
    text: "勝率バー",
    back: "Win-rate bar",
    review: AGENT_READ,
  },
  "game.advantageHint": {
    text: "対局中の形勢です。脅威のあるゲームでは脅威で読み、数えられるものがあるゲームでは数え、どちらもないゲームでは何も示しません。",
    back: "How the game stands while it is on. Where the game has threats it is read by threats, where something can be counted it is counted, and where there is neither nothing is shown.",
    review: AGENT_READ,
  },
  "game.earlyWarning": {
    text: "早めに警告",
    back: "Warn early",
    review: AGENT_READ,
  },
  "game.earlyWarningHint": {
    text: "相手が活三を作れる状態になる前に、双方に警告します。できてからだけではありません。両者に出るので公平ですが、勝つのが難しくなります。",
    back: "Each side is warned before the other can build an open three, not only once one exists. Both players get it, so it stays fair, but it makes a game harder to win.",
    review: AGENT_READ,
  },
  "game.building": {
    text: "形ができつつあります",
    back: "A shape is forming",
    review: AGENT_READ,
  },
  "game.buildingDetail": {
    text: "相手は次の手でここに活三を作れます。まだ強制ではありません。",
    back: "Your opponent can start an open three here with the next move. Nothing is forced yet.",
    review: AGENT_READ,
  },
  "game.outOfTime": {
    text: "時間切れ",
    back: "out of time",
    review: AGENT_READ,
  },
  "game.grow": {
    text: "盤を大きく",
    back: "Bigger board",
    review: AGENT_READ,
  },
  "game.shrink": {
    text: "盤を小さく",
    back: "Smaller board",
    review: AGENT_READ,
  },
  "game.resizeHint": {
    text: "盤を双方で変えるので、相手の同意が必要です。石の位置はそのままです。",
    back: "It changes the board for both of you, so the other player has to agree. The stones keep their positions.",
    review: AGENT_READ,
  },
  "game.resizeAgree": {
    text: "同意する",
    back: "Agree",
    review: AGENT_READ,
  },
  "game.resizeDecline": {
    text: "断る",
    back: "Decline",
    review: AGENT_READ,
  },
  "game.shrinkBlocked": {
    text: "外側の一周に石があるので、盤を小さくできません。",
    back: "There are stones on the outer ring, so the board cannot get smaller.",
    review: AGENT_READ,
  },
  "game.reviewing": {
    text: "検討中",
    back: "Reviewing",
    review: AGENT_READ,
  },
  "game.reviewingDetail": {
    text: "前の局面を見ています。",
    back: "You are looking at an earlier position.",
    review: AGENT_READ,
  },
  "game.atLatest": {
    text: "最新の局面",
    back: "Latest position",
    review: AGENT_READ,
  },
  "game.atLatestDetail": {
    text: "棋譜をさかのぼると、前の手を見られます。",
    back: "Step back through the record to look at an earlier move.",
    review: AGENT_READ,
  },
  "game.returnToLatest": {
    text: "対局に戻る",
    back: "Back to the game",
    review: AGENT_READ,
  },
  "game.branchTitle": {
    text: "ここから打ちますか？",
    back: "Play from here?",
    review: AGENT_READ,
  },
  "game.branchConfirm": {
    text: "捨てて打つ",
    back: "Discard and play",
    review: AGENT_READ,
  },
  "game.branchCancel": {
    text: "取り消す",
    back: "Cancel",
    review: AGENT_READ,
  },
  "game.opening": {
    text: "開局ルール",
    back: "Opening rule",
    review: AGENT_READ,
  },
  "game.lineLength": {
    text: "連の長さ",
    back: "Length of the line",
    review: AGENT_READ,
  },
  "game.lineLengthHint": {
    text: "勝つために必要な、一列に並べる石の数です。",
    back: "The number of stones in a row needed to win.",
    review: AGENT_READ,
  },
  "game.takeBlack": {
    text: "黒を持つ",
    back: "Take black",
    review: AGENT_READ,
  },
  "game.takeWhite": {
    text: "白を持つ",
    back: "Take white",
    review: AGENT_READ,
  },
  "game.extendOpening": {
    text: "2つ追加",
    back: "Add two",
    review: AGENT_READ,
  },
  "game.extendOpeningHint": {
    text: "白と黒の石を1つずつ置き、そのあと相手が色を選びます。",
    back: "Lay one white and one black stone, and then your opponent chooses the colour.",
    review: AGENT_READ,
  },
  "game.chooseColour": {
    text: "{who}：色を選んでください。",
    back: "{who}: please choose a colour.",
    review: AGENT_READ,
  },
  "game.chooseColourOrExtend": {
    text: "{who}：色を選ぶか、石を2つ追加してください。",
    back: "{who}: please choose a colour or add two stones.",
    review: AGENT_READ,
  },
  "game.laysThree": {
    text: "{who}が最初の3つの石（黒、白、黒）を置きます。",
    back: "{who} lays the first three stones (black, white, black).",
    review: AGENT_READ,
  },
  "game.laysTwo": {
    text: "{who}が石を2つ（白、黒の順）追加します。",
    back: "{who} adds two stones (white, then black).",
    review: AGENT_READ,
  },
  "game.opensAtTengen": {
    text: "黒は、中央の天元から打ち始めます。",
    back: "Black starts at tengen, the centre point.",
    review: AGENT_READ,
  },
  "game.rifWhite": {
    text: "白の最初の石は、天元に接し、中央の3×3の内側に置きます。",
    back: "White's first stone must touch tengen, inside the central 3×3.",
    review: AGENT_READ,
  },
  "game.rifBlack": {
    text: "黒の2つ目の石は、中央の5×5の内側に置きます。",
    back: "Black's second stone must be placed inside the central 5×5.",
    review: AGENT_READ,
  },
  "game.sakataFifth": {
    text: "黒の3つ目の石（5手目）は、中央の7×7の内側に置きます。",
    back: "Black's third stone, the fifth move, must be placed inside the central 7×7.",
    review: AGENT_READ,
  },
  "game.nestedStone": {
    text: "{n}つ目の石は、中央の{side}×{side}の内側に置きます。そのあと、相手は色を交代できます。",
    back: "Stone {n} must be placed inside the central {side}×{side}, and then the other side may swap colours.",
    review: AGENT_READ,
  },
  "game.proBlack": {
    text: "黒の2つ目の石は、中央の5×5の外に置きます。",
    back: "Black's second stone must be placed outside the central 5×5.",
    review: AGENT_READ,
  },
  "game.longProBlack": {
    text: "黒の2つ目の石は、中央の7×7の外に置きます。",
    back: "Black's second stone must be placed outside the central 7×7.",
    review: AGENT_READ,
  },
  "game.captures": {
    text: "取り",
    back: "Captures",
    review: AGENT_READ,
  },
  "game.capturesToWin": {
    text: "{stones}子で勝ち",
    back: "{stones} stones win",
    review: AGENT_READ,
  },
  "game.winsByCaptures": {
    text: "{who}の勝ちです。{stones}子を取りました。",
    back: "{who} wins. Captured {stones} stones.",
    review: AGENT_READ,
  },
  "game.stoneOfTurn": {
    text: "この手番の{placed}つ目（全{total}つ）",
    back: "Stone {placed} of {total} this turn",
    review: AGENT_READ,
  },
  "game.forbiddenNote": {
    text: "{colour}は、✕の点には打てません：{shapes}。",
    back: "{colour} may not play the points marked ✕: {shapes}.",
    review: AGENT_READ,
  },
  "game.browser": {
    text: "ゲーム",
    back: "Games",
    review: AGENT_READ,
  },
  "game.browserTitle": {
    text: "ゲームを選ぶ",
    back: "Choose a game",
    review: AGENT_READ,
  },
  "game.browserIntro": {
    text: "ここのゲームはどれも、根本は石を並べるゲームです。規則を選び、そのゲームに開局ルールがあれば、それも選びます。どちらを変えても、新しい対局が始まります。",
    back: "Every game here is, at heart, a game of lining up stones. Choose the rules, and then an opening rule if the game has one. Changing either starts a new game.",
    review: AGENT_READ,
  },
  "game.browserOpenings": {
    text: "開局ルール",
    back: "Opening rules",
    review: AGENT_READ,
  },
  "game.browserPlay": {
    text: "{name}で遊ぶ",
    back: "Play {name}",
    review: AGENT_READ,
  },
  "game.browserCurrent": {
    text: "いま遊んでいます",
    back: "Playing now",
    review: AGENT_READ,
  },
  "game.browserUse": {
    text: "この開局ルールを使う",
    back: "Use this opening rule",
    review: AGENT_READ,
  },
  "game.browserClose": {
    text: "閉じる",
    back: "Close",
    review: AGENT_READ,
  },
  "game.sharedOpeningNote": {
    text: "共有する対局は、自由開局で始まります。",
    back: "Shared games start with the free opening.",
    review: AGENT_READ,
  },
  "game.handicap": {
    text: "ハンデ",
    back: "Handicap",
    review: AGENT_READ,
  },
  "game.handicapHint": {
    text: "片方の色は、より厳しいゲームの規則で打ち、もう片方は通常の規則で打ちます。ハンデがある間は、席の交代はできません。",
    back: "One colour plays under the rules of a harder game while the other plays the plain game. Swapping seats is off while a handicap is set.",
    review: AGENT_READ,
  },
  "game.handicapNone": {
    text: "なし",
    back: "None",
    review: AGENT_READ,
  },
  "game.handicapFor": {
    text: "{colour}にハンデがあります",
    back: "{colour} has a handicap",
    review: AGENT_READ,
  },
  "game.secondStone": {
    text: "2手目",
    back: "Second stone",
    review: AGENT_READ,
  },
  "game.secondStoneHint": {
    text: "ハンデのある色の2つ目の石を置ける場所です。",
    back: "Where the second stone of the colour with the handicap may be placed.",
    review: AGENT_READ,
  },
  // Reviewing a finished game
  "game.review": {
    text: "感想戦",
    back: "Post-game review",
    review: AGENT_READ,
  },
  "game.reviewEmpty": {
    text: "まだ振り返ることはありません。対局が終わると、ここに感想戦が表示されます。",
    back: "There is nothing to look back on yet. When the game is over, the review will appear here.",
    review: AGENT_READ,
  },
  "game.reviewOtherRules": {
    text: "ほかの規則で見ると",
    back: "Under other rules",
    review: AGENT_READ,
  },
  "game.reviewForbidden": {
    text: "{variant}では、{colour}の{move}手目は禁じ手でした：{shape}。",
    back: "In {variant}, move {move} by {colour} would not have been allowed: {shape}.",
    review: AGENT_READ,
  },
  "game.reviewWouldNotWin": {
    text: "{variant}では、{colour}の勝ちの並びは勝ちになりませんでした。",
    back: "In {variant}, {colour}'s winning line would not have counted as a win.",
    review: AGENT_READ,
  },
  "game.reviewEarlierWin": {
    text: "{variant}では、{move}手目の時点で、すでに{colour}の勝ちでした。",
    back: "In {variant}, the game would already have been {colour}'s at move {move}.",
    review: AGENT_READ,
  },
  "game.reviewCapture": {
    text: "{variant}では、{colour}の{move}手目で、2子を取っていました。",
    back: "In {variant}, move {move} by {colour} would have captured two stones.",
    review: AGENT_READ,
  },
  "game.reviewRecovered.one": {
    text: "{who}は敗着を1回打ちながら、勝ちました。相手には勝ちがありましたが、逃しました。",
    back: "{who} played one losing move and still won. The other side had the win and let it go.",
    review: AGENT_READ,
  },
  "game.reviewRecovered.other": {
    text: "{who}は敗着を{count}回打ちながら、勝ちました。相手には勝ちがありましたが、逃しました。",
    back: "{who} played {count} losing moves and still won. The other side had the win and let it go.",
    review: AGENT_READ,
  },
  "game.reviewClean": {
    text: "{who}は、一度も勝ちを手放しませんでした。",
    back: "{who} never gave the game away.",
    review: AGENT_READ,
  },
  "game.reviewStreak": {
    text: "{who}の{ordinal}勝。",
    back: "{who}'s {ordinal} win.",
    review: AGENT_READ,
  },
  "game.reviewFirstWin": {
    text: "{who}の、記録された初めての勝ちです。",
    back: "{who}'s first recorded win.",
    review: AGENT_READ,
  },
  "game.ordinalSt": {
    text: "{n}連",
    back: "{n}th in a run",
    review: AGENT_READ,
  },
  "game.ordinalNd": {
    text: "{n}連",
    back: "{n}th in a run",
    review: AGENT_READ,
  },
  "game.ordinalRd": {
    text: "{n}連",
    back: "{n}th in a run",
    review: AGENT_READ,
  },
  "game.ordinalTh": {
    text: "{n}連",
    back: "{n}th in a run",
    review: AGENT_READ,
  },
  // What to do next, in a game where a move is not one stone
  "game.twistPrompt": {
    text: "4分の1の区画を回して、手を終えます。",
    back: "Turn a quarter of the board to finish your move.",
    review: AGENT_READ,
  },
  "game.pickPiece": {
    text: "滑らせる自分の駒を1つ選んでください。",
    back: "Choose one of your pieces to slide.",
    review: AGENT_READ,
  },
  "game.placePiece": {
    text: "滑らせる先の点を選ぶか、別の駒を選んでください。",
    back: "Choose the point it slides to, or choose a different piece.",
    review: AGENT_READ,
  },
  "game.pickRacer": {
    text: "動かす自分の駒を1つ選んでください。1歩進むか、連続して跳びます。",
    back: "Choose one of your pieces to move: one step, or a chain of jumps.",
    review: AGENT_READ,
  },
  "game.placeRacer": {
    text: "着地する場所を選ぶか、別の駒を選んでください。",
    back: "Choose where it lands, or choose a different piece.",
    review: AGENT_READ,
  },
  "game.dropPrompt": {
    text: "好きな列に打ってください。石は底まで落ちます。",
    back: "Play in any column. The stone falls to the bottom.",
    review: AGENT_READ,
  },
  // How a game ended, said under the board
  "game.winsByTrap": {
    text: "{who}の勝ちです。{loser}が3つ並べてしまいました。",
    back: "{who} wins. {loser} made three in a row.",
    review: AGENT_READ,
  },
  "game.winsBySquare": {
    text: "{who}が正方形を作って勝ちました",
    back: "{who} won by making a square",
    review: AGENT_READ,
  },
  "game.drawBothLines": {
    text: "引き分けです。双方が同時に並びを作りました。",
    back: "A draw. Both made a line at the same time.",
    review: AGENT_READ,
  },
  "game.drawByLength": {
    text: "引き分けです。決められた手数まで進みました。",
    back: "A draw. The game went on to the number of moves it was given.",
    review: AGENT_READ,
  },
  "game.drawByRepetition": {
    text: "同じ局面の繰り返しで引き分けです。同じ手番で、同じ局面がもう一度現れました。",
    back: "A draw by repetition. The same position appeared again, with the same side to move.",
    review: AGENT_READ,
  },
  "game.drawByEndgameCount": {
    text: "引き分けです。規則で認められている手数のうちに、終盤で勝負がつきませんでした。",
    back: "A draw. The ending was not won within the number of moves the rules allow.",
    review: AGENT_READ,
  },
  "game.drawNoProgressRacing": {
    text: "進展なしの規則による引き分けです。{plies}手のあいだ、誰の駒も陣地に近づきませんでした。",
    back: "A draw by the no-progress rule. In {plies} moves, no piece got any nearer to its camp.",
    review: AGENT_READ,
  },
  "game.drawNoProgressTaking": {
    text: "{half}手ルールによる引き分けです。双方{half}手、駒が取られず、通常の駒も動きませんでした。",
    back: "A draw by the {half}-move rule. For {half} moves each, nothing was taken and no ordinary piece moved.",
    review: AGENT_READ,
  },
  "game.drawNoProgressPlacing": {
    text: "滑らせるルールによる引き分けです。最後の駒を置いてから{plies}手たちましたが、勝負はつきませんでした。",
    back: "A draw by the sliding rule. {plies} moves have passed since the last piece was placed, and nobody won.",
    review: AGENT_READ,
  },
  "game.drawNoMoves": {
    text: "引き分けです。どちらにも打てる手がなくなりました。",
    back: "A draw. Neither side had a move left.",
    review: AGENT_READ,
  },
  "game.drawFull": {
    text: "引き分けです。盤が埋まりました。",
    back: "A draw. The board is full.",
    review: AGENT_READ,
  },
  // The settings that are fixed or have no meaning here
  "game.fixedBy": {
    text: "{game}で決まっています。",
    back: "It is fixed by {game}.",
    review: AGENT_READ,
  },
  "game.penaltyStrict": {
    text: "対局負け（休暇日を考慮しない）",
    back: "Loss of the game, ignoring holiday days",
    review: AGENT_READ,
  },
  "game.rulesLocked": {
    text: "対局中は規則を変えられません。変えるには、新しい対局を始めてください。",
    back: "The rules cannot be changed while a game is on. To change them, start a new game.",
    review: AGENT_READ,
  },
  "game.centreDiscs": {
    text: "中央の石を置いて開始",
    back: "Start with the centre discs placed",
    review: AGENT_READ,
  },
  "game.centreDiscsHint": {
    text: "現代のリバーシと同じく、各色2つの石を中央に置いて始めます。オフにすると、1880年代のゲームと同じく、最初の4つを双方で置きます。",
    back: "Two of each colour are placed in the centre to start, as in modern Reversi. If it is off, the players lay the first four themselves, as in the game of the 1880s.",
    review: AGENT_READ,
  },
  "game.noDrawLimitCannotDraw": {
    text: "このゲームは引き分けになりません。盤が埋まれば、必ずどちらかの2辺がつながります。手数は設定できません。",
    back: "This game cannot end in a draw, because a full board always joins one player's two sides. There is no number of moves to set.",
    review: AGENT_READ,
  },
  "game.noDrawLimitTooSmall": {
    text: "この盤は小さいので、手数の設定は不要です。この大きさでは、盤のどの割合も埋まる前に、勝負がつきます。",
    back: "This board is too small to need a number of moves. A game of this size is over well before any share of the board has been played.",
    review: AGENT_READ,
  },
  "game.noReading": {
    text: "石を置いたあとに動かすゲームでは、形勢は読めません。",
    back: "There is no reading in a game where stones move after they are placed.",
    review: AGENT_READ,
  },
  // Are you still there?
  "game.idle": {
    text: "まだいますか？",
    back: "Are you still there?",
    review: AGENT_READ,
  },
  "game.idleDetail": {
    text: "数分間動きがないので、時計を止めています。",
    back: "Nothing has moved for a few minutes, so the clock is paused.",
    review: AGENT_READ,
  },
  "game.idleConfirm": {
    text: "います",
    back: "I am here",
    review: AGENT_READ,
  },
  "game.idleLeave": {
    text: "いったん終わる",
    back: "Finish for now",
    review: AGENT_READ,
  },
  "game.idleKept": {
    text: "この対局は保存されています。戻ってきたときも、ここにあります。",
    back: "This game is saved. It will be here when you come back.",
    review: AGENT_READ,
  },
  "game.idleLiveDetail": {
    text: "ここは数分間動きがありません。この対局に時計がある場合は、動き続けています。",
    back: "Nothing has moved here for a few minutes. If this game has a clock, it is still running.",
    review: AGENT_READ,
  },
  "game.idleLiveKept": {
    text: "この対局はサイトに保存されています。戻ってきたときも、いまの状態のままここにあります。",
    back: "This game is saved on the site. When you come back, it will be here just as it is.",
    review: AGENT_READ,
  },
  "game.idlePuzzleDetail": {
    text: "数分間動きがないので、時計を止め、盤面を隠しています。",
    back: "Nothing has moved for a few minutes, so the clock is paused and the grid is covered.",
    review: AGENT_READ,
  },
  "game.idleRaceDetail": {
    text: "数分間動きがありません。競走の時計はサイトの時計で、動き続けています。",
    back: "Nothing has moved for a few minutes. A race's clock is the site's own, and it is still running.",
    review: AGENT_READ,
  },
  "game.idlePuzzleKept": {
    text: "このパズルは対局中の一覧に保存されています。戻ってきたときも、いまの状態のままあります。",
    back: "This puzzle is saved in your games. When you come back, it will be here just as it is.",
    review: AGENT_READ,
  },
  "game.idlePuzzleNotKept": {
    text: "アカウントがないと、パズルはこのページにいる間だけです。離れると終わります。",
    back: "Without an account, a puzzle lasts only while you stay on this page. Leaving ends it.",
    review: AGENT_READ,
  },
  "game.idleRaceKept": {
    text: "競走はサイトに保存されています。そのリンクから戻れます。",
    back: "The race is saved on the site. Its link brings you back to it.",
    review: AGENT_READ,
  },
  // Pieces that are placed by hand, a pass, and a turn that went by
  "game.pass": {
    text: "パス",
    back: "Pass",
    review: AGENT_READ,
  },
  "game.forfeit": {
    text: "時間切れ",
    back: "Timed out",
    review: AGENT_READ,
  },
  "game.piece": {
    text: "手元の駒",
    back: "Piece in hand",
    review: AGENT_READ,
  },
  "game.nextPieces": {
    text: "次の駒",
    back: "Next pieces",
    review: AGENT_READ,
  },
  "game.rotatePiece": {
    text: "回転",
    back: "Rotate",
    review: AGENT_READ,
  },
  "game.flipPiece": {
    text: "反転",
    back: "Flip",
    review: AGENT_READ,
  },
  "game.useSingle": {
    text: "石を1つ置く",
    back: "Place a single stone",
    review: AGENT_READ,
  },
  "game.usePiece": {
    text: "駒を置く",
    back: "Place the piece",
    review: AGENT_READ,
  },
  "game.singlesLeft.one": {
    text: "石があと1つ",
    back: "1 single stone left",
    review: AGENT_READ,
  },
  "game.singlesLeft.other": {
    text: "石があと{count}つ",
    back: "{count} single stones left",
    review: AGENT_READ,
  },
  "game.noMoveLeft": {
    text: "打てる手がありません。パスして手番を渡してください。",
    back: "You have no move left. Pass to hand the turn on.",
    review: AGENT_READ,
  },
  "game.youHadNoMove": {
    text: "打てる手がなかったので、手番がパスになりました。",
    back: "You had no move, so your turn was passed.",
    review: AGENT_READ,
  },
  "game.hadNoMoveToYou": {
    text: "{who}は打てる手がなかったので、手番がこちらに戻りました。",
    back: "{who} had no move, so the turn came back to you.",
    review: AGENT_READ,
  },
  "game.hadNoMove": {
    text: "{who}は打てる手がなかったので、手番がパスになりました。",
    back: "{who} had no move, so their turn was passed.",
    review: AGENT_READ,
  },
  "game.headStartYours": {
    text: "自分の先行：{of}手中{turn}手目なので、もう一度自分の手番です。",
    back: "Your head start: move {turn} of {of}, so it is your turn again.",
    review: AGENT_READ,
  },
  "game.headStartToYou": {
    text: "{who}の先行：{of}手中{turn}手目なので、自分の手番がパスになりました。",
    back: "{who}'s head start: move {turn} of {of}, so your turn was passed.",
    review: AGENT_READ,
  },
  "game.headStartWatched": {
    text: "{who}の先行：{of}手中{turn}手目。",
    back: "{who}'s head start: move {turn} of {of}.",
    review: AGENT_READ,
  },
  "game.passTurn": {
    text: "パス",
    back: "Pass",
    review: AGENT_READ,
  },
  "game.piecePrompt": {
    text: "手元の駒を置きます。回転や反転をしてから、左上の角を置く場所をクリックしてください。",
    back: "Place the piece in hand. Rotate or flip it, and then click where its top-left corner goes.",
    review: AGENT_READ,
  },
  "game.singlePrompt": {
    text: "自分の色の石を1つ置いてください。",
    back: "Lay one stone of your colour.",
    review: AGENT_READ,
  },
  "game.notes": {
    text: "メモ",
    back: "Notes",
    review: AGENT_READ,
  },
  "game.notesHint": {
    text: "非公開です。このブラウザにだけ保存され、誰にも送られません。",
    back: "Private. It is kept only in this browser and is never sent to anyone.",
    review: AGENT_READ,
  },
  "game.notesPlaceholder": {
    text: "考えていること、気づいたこと、次に試すこと…",
    back: "What you are planning, what you noticed, what to try next time…",
    review: AGENT_READ,
  },
  "game.placeAs": {
    text: "石の色を選んで置く",
    back: "Place a stone in the colour",
    review: AGENT_READ,
  },
  "game.makerBreakerRoles": {
    text: "{maker}は作り手で、どちらの色でも5つ並べたい側です。{breaker}は壊し手で、5つ並ぶのを防ぎたい側です。",
    back: "{maker} is the Maker and wants five in a row of either colour. {breaker} is the Breaker and wants to stop it.",
    review: AGENT_READ,
  },
  // Time, resigning and who may sit down, in a game shared between two
  "game.moveTime": {
    text: "1手の持ち時間",
    back: "Time per move",
    review: AGENT_READ,
  },
  "game.moveTimeHint": {
    text: "共有する対局で、各自が1手に使える時間です。相手が打つと、時計が動き始めます。",
    back: "How long each player has for a move in a shared game. The clock starts when the other side moves.",
    review: AGENT_READ,
  },
  "game.penalty": {
    text: "時間切れのとき",
    back: "When time runs out",
    review: AGENT_READ,
  },
  "game.penaltyTurn": {
    text: "手番を失います。3回続けると、対局に負けます。",
    back: "The turn is lost. Three in a row lose the game.",
    review: AGENT_READ,
  },
  "game.penaltyGame": {
    text: "対局に負けます。",
    back: "The game is lost.",
    review: AGENT_READ,
  },
  "game.penaltyTurnShort": {
    text: "手番を失う",
    back: "Lose the turn",
    review: AGENT_READ,
  },
  "game.penaltyGameShort": {
    text: "対局に負ける",
    back: "Lose the game",
    review: AGENT_READ,
  },
  "game.penaltyStrictShort": {
    text: "厳密に対局負け",
    back: "Lose the game, strictly",
    review: AGENT_READ,
  },
  "game.penaltyHint": {
    text: "ゆるやか：期限を過ぎると手番を失い、待っている側は請求するか、そのまま待てます。厳密：期限を過ぎると負けです。",
    back: "Lenient: a missed deadline costs the turn, and the waiting player may claim it or simply keep waiting. Strict: a missed deadline is a loss.",
    review: AGENT_READ,
  },
  "game.allowResign": {
    text: "投了を許可",
    back: "Allow resigning",
    review: AGENT_READ,
  },
  "game.allowResignHint": {
    text: "どちらの席でも投了できます。オフにすると、対局は勝ち、引き分け、時間切れでしか終わりません。",
    back: "Either seat may resign. If it is off, a game can only end in a win, a draw or a timeout.",
    review: AGENT_READ,
  },
  "game.openSeat": {
    text: "誰でも参加できる",
    back: "Open to anyone",
    review: AGENT_READ,
  },
  "game.openSeatHint": {
    text: "もう一方の席をゲームのページに掲示します。最初に応じた人が、白で着席します。",
    back: "The other seat is put up on the games page. Whoever answers first sits down as White.",
    review: AGENT_READ,
  },
  "game.mustMoveBy": {
    text: "{name}は{when}までに打つ必要があります",
    back: "{name} must move by {when}",
    review: AGENT_READ,
  },
  "game.nothingWaiting": {
    text: "手番を待っている盤は、これで最後でした。",
    back: "That was the last board waiting for you.",
    review: AGENT_READ,
  },
  "game.yourGames": {
    text: "対局中",
    back: "Games in progress",
    review: AGENT_READ,
  },
  "game.claimTurn": {
    text: "手番を請求",
    back: "Claim the turn",
    review: AGENT_READ,
  },
  "game.claimGame": {
    text: "勝ちを請求",
    back: "Claim the win",
    review: AGENT_READ,
  },
  "game.claimHint": {
    text: "相手の時間が切れました。請求するか、対局を待たせたまま、手番を相手に戻してください。",
    back: "Their time is up. Claim it, or leave the game waiting and return the move to them.",
    review: AGENT_READ,
  },
  "game.claimTurnConfirm": {
    text: "相手が逃した手番を請求しますか？相手はこの手を失い、盤はこちらに戻ります。",
    back: "Claim their missed turn? They lose this move, and the board comes back to you.",
    review: AGENT_READ,
  },
  "game.claimGameConfirm": {
    text: "相手の持ち時間切れで、勝ちを請求しますか？対局はここで終わり、結果は相手の負けとして記録されます。",
    back: "Claim the game because their time ran out? It ends here, and the result is recorded as a loss for them.",
    review: AGENT_READ,
  },
  "game.forfeitsNote": {
    text: "{limit}回中{count}回、手番を失いました",
    back: "{count} of {limit} turns lost",
    review: AGENT_READ,
  },
  // The practice board and pasting a game in
  "game.practiceLabel": {
    text: "練習盤",
    back: "Practice board",
    review: AGENT_READ,
  },
  "game.practiceLine": {
    text: "両方の色を打ったり、手を戻したり、棋譜を貼り付けて順にたどったりできます。向かいに座る人も、時計もなく、ここで打ったものはレーティングに数えません。1つの画面で打つ盤は独立した対局として保存されますが、貼り付けた棋譜は保存されません。",
    back: "You can play both sides, take moves back, or paste in a game and walk through it. Nobody is sitting opposite, there is no clock, and nothing played here counts for rating. A board played on one screen is kept as a game of its own, but a game you paste in is not kept at all.",
    review: AGENT_READ,
  },
  "game.practiceReal": {
    text: "本番の対局を始める",
    back: "Start a real game",
    review: AGENT_READ,
  },
  "game.pasteLabel": {
    text: "棋譜を貼り付ける",
    back: "Paste a record",
    review: AGENT_READ,
  },
  "game.pasteButton": {
    text: "手を読み込む",
    back: "Load the moves",
    review: AGENT_READ,
  },
  "game.pasteClear": {
    text: "消す",
    back: "Clear",
    review: AGENT_READ,
  },
  "game.pastePlaceholder": {
    text: "手の並びを貼り付けてください",
    back: "Paste a list of moves",
    review: AGENT_READ,
  },
  "game.pasteHint": {
    text: "公開されているほとんどの形式の手の並びを読み込めます。例：{example}。手数、改行、末尾の結果があっても大丈夫です。",
    back: "A list of moves in most of the ways they are published, for example {example}. Move numbers, line breaks and a result at the end are all fine.",
    review: AGENT_READ,
  },
  "game.pasteNothing": {
    text: "手を読み取れませんでした。",
    back: "No moves could be read.",
    review: AGENT_READ,
  },
  "game.pasteRead.one": {
    text: "{format}として1手を読み取りました。",
    back: "Read 1 move as {format}.",
    review: AGENT_READ,
  },
  "game.pasteRead.other": {
    text: "{format}として{count}手を読み取りました。",
    back: "Read {count} moves as {format}.",
    review: AGENT_READ,
  },
  "game.pasteRefused": {
    text: "{at}手目はこのゲームでは打てないので、盤はそこで止まります。",
    back: "Move {at} cannot be played in this game, so the board stops there.",
    review: AGENT_READ,
  },
  "game.pasteFrom": {
    text: "出どころ",
    back: "Source",
    review: AGENT_READ,
  },
  "game.pasteAnywhere": {
    text: "どこでも",
    back: "Anywhere",
    review: AGENT_READ,
  },
  "game.pasteFromHint": {
    text: "ItsYourTurnでは「show move list」を押し、GoldTokenでは「Past Moves」の下に手があります。それをコピーしてここに貼り付けてください。その前に、この盤をその対局と同じ大きさにしておいてください。ItsYourTurnは行を下の端から数えるためです。",
    back: "On ItsYourTurn, press \"show move list\". On GoldToken, the moves are under \"Past Moves\". Copy them and paste them here. First set this board to the same size as that game, because ItsYourTurn counts its rows from the bottom edge.",
    review: AGENT_READ,
  },
  "game.formatCoordinates": {
    text: "座標",
    back: "coordinates",
    review: AGENT_READ,
  },
  "game.formatSquares": {
    text: "リバーシのマス目",
    back: "Reversi squares",
    review: AGENT_READ,
  },
  "game.formatSgf": {
    text: "SGF形式",
    back: "SGF format",
    review: AGENT_READ,
  },
  "game.formatIyt": {
    text: "ItsYourTurnの手の一覧",
    back: "an ItsYourTurn list of moves",
    review: AGENT_READ,
  },
  "game.formatGt": {
    text: "GoldTokenの手の一覧",
    back: "a GoldToken list of moves",
    review: AGENT_READ,
  },
};
