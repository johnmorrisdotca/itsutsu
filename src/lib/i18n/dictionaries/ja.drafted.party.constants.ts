import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the party.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PARTY: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The rules pages and the front doors: what a table offers, in words, built from its spec
  "party.rules.playersSame": {
    text: "{count}人",
    back: "{count} people",
    review: AGENT_READ,
  },
  "party.rules.playersRange": {
    text: "{fewest}〜{most}人",
    back: "{fewest} to {most} people",
    review: AGENT_READ,
  },
  "party.rules.or": {
    text: "{rest}、{last}",
    back: "{rest}, {last}",
    review: AGENT_READ,
  },
  "party.rules.orTwo": {
    text: "{a}か{b}",
    back: "{a} or {b}",
    review: AGENT_READ,
  },
  "party.rules.default": {
    text: "{what}（標準）",
    back: "{what} (standard)",
    review: AGENT_READ,
  },
  "party.rules.usual": {
    text: "{what}（標準）",
    back: "{what} (standard)",
    review: AGENT_READ,
  },
  "party.rules.offerDots": {
    text: "{sizes}マスの盤で",
    back: "on a board of {sizes} boxes",
    review: AGENT_READ,
  },
  "party.rules.offerGhost": {
    text: "{languages}で、{lengths}文字以上の言葉を作ると負けになる決まりで",
    back: "in {languages}, under the rule that making a word of {lengths} letters or more loses",
    review: AGENT_READ,
  },
  "party.rules.languageEnglish": {
    text: "英語",
    back: "English",
    review: AGENT_READ,
  },
  "party.rules.languageJapanese": {
    text: "日本語",
    back: "Japanese",
    review: AGENT_READ,
  },
  "party.rules.offerMancala": {
    text: "{rules}のルールで",
    back: "by the rules of {rules}",
    review: AGENT_READ,
  },
  "party.rules.offerTenka": {
    text: "世界かヨーロッパの地図で、{rounds}のどれかの長さで",
    back: "on a map of the world or of Europe, with a length of any of {rounds}",
    review: AGENT_READ,
  },
  "party.rules.tenkaRounds": {
    text: "{count}ラウンド",
    back: "{count} rounds",
    review: AGENT_READ,
  },
  "party.rules.tenkaLast": {
    text: "最後の1人になるまで",
    back: "until one person is left",
    review: AGENT_READ,
  },
  "party.rules.offerTrain": {
    text: "{sets}のセットで",
    back: "with the set of {sets}",
    review: AGENT_READ,
  },
  "party.rules.offerDice": {
    text: "各自{dice}個のサイコロ（d{lowest}〜d{highest}）で、{points}点まで、または{rounds}ラウンドで",
    back: "with {dice} dice each (d{lowest} to d{highest}), up to {points} points, or for {rounds} rounds",
    review: AGENT_READ,
  },
  "party.rules.offerYacht": {
    text: "サイコロ5個と13欄の得点表で、1人でも卓でも",
    back: "with five dice and a score sheet of thirteen boxes, alone or at a table",
    review: AGENT_READ,
  },
  "party.rules.offerPachisi": {
    text: "サイコロ2個とひとり4つの駒で、68マスの十字形のコースを回って",
    back: "with two dice and four pawns each, going round a cross-shaped course of sixty-eight squares",
    review: AGENT_READ,
  },
  "party.rules.hitotsuHand": {
    text: "1ハンドだけ",
    back: "one hand only",
    review: AGENT_READ,
  },
  "party.rules.hitotsuPoints": {
    text: "{points}点まで",
    back: "up to {points} points",
    review: AGENT_READ,
  },
  "party.rules.offerHitotsu": {
    text: "{list}のどれかで",
    back: "any of {list}",
    review: AGENT_READ,
  },
  "party.rules.offerGunjin": {
    text: "{boards}の盤で、すべての駒を相手から隠して",
    back: "on the board of {boards}, with every piece hidden from the other side",
    review: AGENT_READ,
  },
  "party.rules.offerSugorokuSingle": {
    text: "シングルゲームで",
    back: "as a single game",
    review: AGENT_READ,
  },
  "party.rules.offerSugorokuMatch": {
    text: "シングルゲーム、またはダブリングキューブ付きの{points}ポイントマッチで",
    back: "as a single game, or a match to {points} points with the doubling cube",
    review: AGENT_READ,
  },
  "party.rules.offerToPoints": {
    text: "{points}点まで",
    back: "up to {points} points",
    review: AGENT_READ,
  },
  "party.rules.offerOverDeals": {
    text: "{count}回の配りで",
    back: "over {count} deals",
    review: AGENT_READ,
  },
  "party.rules.offerOverRounds": {
    text: "{count}ラウンドで",
    back: "over {count} rounds",
    review: AGENT_READ,
  },
  "party.rules.offerGoFish": {
    text: "1回の配りで、すべてのブックが出るまで",
    back: "in one deal, until every book is down",
    review: AGENT_READ,
  },
  "party.rules.offerWar": {
    text: "最大{count}ターンまで",
    back: "for at most {count} turns",
    review: AGENT_READ,
  },
  "party.rules.played": {
    text: "{words}遊びます。{board}",
    back: "It is played {words}. {board}",
    review: AGENT_READ,
  },
  "party.rules.forPlayers": {
    text: "{players}で、1台のスマホやタブレットを卓で回して遊びます。",
    back: "For {players}, played by passing one phone or tablet round the table.",
    review: AGENT_READ,
  },
  "party.rules.kept": {
    text: "ゲームは、1手ごとに、遊んでいるブラウザーに保存されます。タブを閉じても、電話に出ても、戻ってくれば、「対局中」の「回し打ち」で待っています。",
    back: "The game is saved in the browser it is played in after every move. Close the tab, or take a phone call, and when you come back it is waiting in \"My games\", under \"Pass and play\".",
    review: AGENT_READ,
  },
  "party.rules.never": {
    text: "評価はされず、サイトには何も送られず、順位表にも数えられません。パーティーゲームは、卓を囲む人たちのためのものです。",
    back: "Nothing is rated, nothing is sent to the site, and no ladder counts a game. A party game is for the people round the table.",
    review: AGENT_READ,
  },
  "party.front.line": {
    text: "{players}で、{boards}遊ぶ、回し遊びのゲームです。評価はされず、遊んだブラウザーにだけ保存されます。",
    back: "A pass-and-play game for {players}, played {boards}. Never rated, and saved only in the browser it is played in.",
    review: AGENT_READ,
  },
  "party.front.chip": {
    text: "1台で{players}の回し遊びです。このブラウザーに保存されます。",
    back: "Pass and play for {players} on one device, saved in your browser.",
    review: AGENT_READ,
  },
  "party.front.picture": {
    text: "途中まで進んだ{title}のゲーム",
    back: "A game of {title} part way through",
    review: AGENT_READ,
  },
  "party.play": {
    text: "遊ぶ →",
    back: "Play →",
    review: AGENT_READ,
  },
  "party.joinToPlay": {
    text: "参加して遊ぶ →",
    back: "Join and play →",
    review: AGENT_READ,
  },
  // Seats and colours
  "party.computerNumber": {
    text: "コンピュータ{number}",
    back: "Computer {number}",
    review: AGENT_READ,
  },
  "party.seatColour": {
    text: "{player}、{colour}",
    back: "{player}, {colour}",
    review: AGENT_READ,
  },
  "party.seatColourLast": {
    text: "{player}、{colour}、{role}",
    back: "{player}, {colour}, {role}",
    review: AGENT_READ,
  },
  "party.playerColourAria": {
    text: "{player}の色：{colour}。変更します",
    back: "{player}'s colour: {colour}. Change it",
    review: AGENT_READ,
  },
  "party.chooseSeatColour": {
    text: "この席の色を選ぶ",
    back: "Choose this seat's colour",
    review: AGENT_READ,
  },
  "party.tableOwn": {
    text: "{colour}（卓の標準）",
    back: "{colour} (the table's standard)",
    review: AGENT_READ,
  },
  "party.yourColour": {
    text: "自分の色",
    back: "Your colour",
    review: AGENT_READ,
  },
  "party.ofColour": {
    text: "{name}の色",
    back: "{name}'s colour",
    review: AGENT_READ,
  },
  "party.colourAria": {
    text: "{whose}：{colour}。色を変更します",
    back: "{whose}: {colour}. Change colour",
    review: AGENT_READ,
  },
  "party.chooseYours": {
    text: "自分の色を選ぶ",
    back: "Choose your colour",
    review: AGENT_READ,
  },
  "party.chooseOf": {
    text: "{name}の色を選ぶ",
    back: "Choose {name}'s colour",
    review: AGENT_READ,
  },
  "party.changeColour": {
    text: "色を変える",
    back: "Change colour",
    review: AGENT_READ,
  },
  "party.colourEveryone": {
    text: "卓のみんなに見えます。色は、それぞれが自分で選びます。",
    back: "Everybody at the table sees it. Each person chooses their own colour.",
    review: AGENT_READ,
  },
  "party.colourOnTurn": {
    text: "色は、各自が自分の番に選べ、どの番でも変えられます。",
    back: "Each person chooses on their own turn, and may change it on any turn.",
    review: AGENT_READ,
  },
  // Shared table lines
  "party.players": {
    text: "席",
    back: "Seats",
    review: AGENT_READ,
  },
  "party.toPlay": {
    text: "{name}の番",
    back: "{name}'s turn",
    review: AGENT_READ,
  },
  "party.turnSuffix": {
    text: "の番",
    back: "'s turn",
    review: AGENT_READ,
  },
  "party.turnTrail": {
    text: "{colour}（{letter}）",
    back: "{colour} ({letter})",
    review: AGENT_READ,
  },
  "party.dots.wins": {
    text: "{name}の勝ちです。箱は{boxes}です。",
    back: "{name} wins. The boxes are {boxes}.",
    review: AGENT_READ,
  },
  "party.dots.share": {
    text: "{names}が勝ちを分け合いました。それぞれ{boxes}です。",
    back: "{names} share the win, with {boxes} each.",
    review: AGENT_READ,
  },
  "party.dots.aboutBoard": {
    text: "陣取り、{size}×{size}マス",
    back: "Dots and Boxes, {size} by {size} boxes",
    review: AGENT_READ,
  },
  "party.dots.lineFromTo": {
    text: "{from}から{to}への線",
    back: "Line from {from} to {to}",
    review: AGENT_READ,
  },
  "party.dots.boxOf": {
    text: "{name}の箱",
    back: "{name}'s box",
    review: AGENT_READ,
  },
  // Mancala
  "party.mancala.ruleAria": {
    text: "種まき（{rules}のルール）",
    back: "Mancala (the rules of {rules})",
    review: AGENT_READ,
  },
  "party.mancala.defaultMark": {
    text: "（標準）",
    back: "(standard)",
    review: AGENT_READ,
  },
  "party.mancala.seatNear": {
    text: "{player}、{colour}、手前の列、先にまきます",
    back: "{player}, {colour}, the near row, sows first",
    review: AGENT_READ,
  },
  "party.mancala.seatFar": {
    text: "{player}、{colour}、奥の列",
    back: "{player}, {colour}, the far row",
    review: AGENT_READ,
  },
  "party.mancala.nameNear": {
    text: "{player}（手前の列、先にまく）",
    back: "{player} (near row, sows first)",
    review: AGENT_READ,
  },
  "party.mancala.nameFar": {
    text: "{player}（奥の列）",
    back: "{player} (far row)",
    review: AGENT_READ,
  },
  "party.mancala.storeOf": {
    text: "{name}の{store}：{seeds}",
    back: "{name}'s {store}: {seeds}",
    review: AGENT_READ,
  },
  "party.mancala.pitOf": {
    text: "{name}の穴：{seeds}",
    back: "{name}'s pit: {seeds}",
    review: AGENT_READ,
  },
  "party.mancala.pitAria": {
    text: "{name}の穴{place}、{seeds}",
    back: "{name}'s pit {place}, {seeds}",
    review: AGENT_READ,
  },
  "party.mancala.scoreEach": {
    text: "それぞれ{seeds}",
    back: "{seeds} each",
    review: AGENT_READ,
  },
  "party.mancala.scoreTo": {
    text: "{seeds}対{other}個",
    back: "{seeds} to {other}",
    review: AGENT_READ,
  },
  "party.mancala.draw": {
    text: "引き分けです（{score}）。",
    back: "A draw ({score}).",
    review: AGENT_READ,
  },
  "party.mancala.wins": {
    text: "{name}の勝ちです（{score}）。",
    back: "{name} wins ({score}).",
    review: AGENT_READ,
  },
  // Mexican Train
  "party.train.theMexican": {
    text: "{train}",
    back: "{train}",
    review: AGENT_READ,
  },
  "party.train.ownTrain": {
    text: "自分の列車",
    back: "their own train",
    review: AGENT_READ,
  },
  "party.train.tileNowhere": {
    text: "{tile}、いま置ける場所がありません",
    back: "{tile}, goes nowhere now",
    review: AGENT_READ,
  },
  "party.train.tileGoes.one": {
    text: "{tile}、{count}本の列車に置けます",
    back: "{tile}, goes on {count} train",
    review: AGENT_READ,
  },
  "party.train.tileGoes.other": {
    text: "{tile}、{count}本の列車に置けます",
    back: "{tile}, goes on {count} trains",
    review: AGENT_READ,
  },
  "party.train.colPlayer": {
    text: "席",
    back: "Seat",
    review: AGENT_READ,
  },
  "party.train.colRound": {
    text: "このラウンド",
    back: "This round",
    review: AGENT_READ,
  },
  // Hand-overs
  "party.handOver.passTo": {
    text: "{name}さんに渡してください",
    back: "Please pass it to {name}",
    review: AGENT_READ,
  },
  "party.handOver.ready": {
    text: "{name}です。自分の番を始める",
    back: "I am {name}: start my turn",
    review: AGENT_READ,
  },
  // Board labels
  "party.board.squareEmpty": {
    text: "{where}、空",
    back: "{where}, empty",
    review: AGENT_READ,
  },
  "party.board.pieceOf": {
    text: "{where}、{name}の{colour}の駒",
    back: "{where}, {name}'s {colour} piece",
    review: AGENT_READ,
  },
  "party.board.holeWhere": {
    text: "{row}行目、{col}番目の穴",
    back: "row {row}, hole {col}",
    review: AGENT_READ,
  },
  "party.board.holeEmpty": {
    text: "空の穴、{where}",
    back: "Empty hole, {where}",
    review: AGENT_READ,
  },
  "party.board.holePiece": {
    text: "{name}の{colour}の駒、{where}",
    back: "{name}'s {colour} piece, {where}",
    review: AGENT_READ,
  },
  // Block Five for four
  "party.blocks.laid.one": {
    text: "{count}個置きました。",
    back: "{count} piece laid.",
    review: AGENT_READ,
  },
  "party.blocks.laid.other": {
    text: "{count}個置きました。",
    back: "{count} pieces laid.",
    review: AGENT_READ,
  },
  "party.blocks.cardLaid.one": {
    text: "{count}個置いた",
    back: "{count} piece laid",
    review: AGENT_READ,
  },
  "party.blocks.cardLaid.other": {
    text: "{count}個置いた",
    back: "{count} pieces laid",
    review: AGENT_READ,
  },
  "party.blocks.forFour": {
    text: "4人用",
    back: "for four",
    review: AGENT_READ,
  },
  "party.blocks.inHand": {
    text: "手持ちの{colour}の駒、{size}マス",
    back: "{colour} piece in hand, {size} squares",
    review: AGENT_READ,
  },
  // Pair Go
  "party.pairgo.team": {
    text: "{colour}（{names}）",
    back: "{colour} ({names})",
    review: AGENT_READ,
  },
  "party.pairgo.toPlayAfter": {
    text: "の番",
    back: "'s turn",
    review: AGENT_READ,
  },
  "party.pairgo.passedBy": {
    text: "{name}（{colour}）",
    back: "{name} ({colour})",
    review: AGENT_READ,
  },
  "party.pairgo.winBy": {
    text: "{team}の勝ちです（{margin}目差）",
    back: "{team} win by {margin}",
    review: AGENT_READ,
  },
  "party.pairgo.win": {
    text: "{team}の勝ちです",
    back: "{team} win",
    review: AGENT_READ,
  },
  "party.pairgo.countLine": {
    text: "黒{black}、白{white}＋コミ{komi}＝{total}。",
    back: "Black {black}, White {white} + komi {komi} = {total}.",
    review: AGENT_READ,
  },
  "party.pairgo.resigned": {
    text: "{team}が投了しました。",
    back: "{team} resigned.",
    review: AGENT_READ,
  },
  "party.pairgo.cardTeams": {
    text: "、2人ずつの2チーム",
    back: ", two teams of two",
    review: AGENT_READ,
  },
  "party.pairgo.cardToPlay": {
    text: "・{name}（{colour}）の番",
    back: "· {name} ({colour}) to play",
    review: AGENT_READ,
  },
  "party.pairgo.standing": {
    text: "{colour}・取った石{count}個",
    back: "{colour}, {count} stones captured",
    review: AGENT_READ,
  },
  // What a seat has to show, in the list of seats at a table on several devices
  "party.out": {
    text: "脱落",
    back: "Out",
    review: AGENT_READ,
  },
  "party.blocks.standing": {
    text: "{squares}マス・残り{left}個",
    back: "{squares} squares, {left} pieces left",
    review: AGENT_READ,
  },
  "party.kumimoji.standing": {
    text: "手元{hand}枚・場に{laid}枚",
    back: "{hand} in hand, {laid} on the table",
    review: AGENT_READ,
  },
  "party.train.standing": {
    text: "{points}点、{tiles}",
    back: "{points} points, {tiles}",
    review: AGENT_READ,
  },
  "party.hitotsu.standing": {
    text: "{points}点・{cards}",
    back: "{points} points, {cards}",
    review: AGENT_READ,
  },
  "party.race.home": {
    text: "ゴール{home}/{each}",
    back: "{home} of {each} home",
    review: AGENT_READ,
  },
  "party.mancala.inStore": {
    text: "ストアに{seeds}個",
    back: "{seeds} in the store",
    review: AGENT_READ,
  },
  // The backgammon games' table lines
  "party.sugoroku.lengthSingle": {
    text: "シングルゲーム",
    back: "Single game",
    review: AGENT_READ,
  },
  "party.sugoroku.lengthMatch": {
    text: "{points}ポイントマッチ",
    back: "Match to {points}",
    review: AGENT_READ,
  },
  "party.sugoroku.points.one": {
    text: "{count}ポイント",
    back: "{count} point",
    review: AGENT_READ,
  },
  "party.sugoroku.points.other": {
    text: "{count}ポイント",
    back: "{count} points",
    review: AGENT_READ,
  },
  "party.sugoroku.cubeNone": {
    text: "キューブなし",
    back: "No cube",
    review: AGENT_READ,
  },
  "party.sugoroku.cubeCrawford": {
    text: "クロフォードゲーム：キューブなし",
    back: "Crawford game: no cube",
    review: AGENT_READ,
  },
  "party.sugoroku.cubeMiddle": {
    text: "キューブは中央",
    back: "Cube in the middle",
    review: AGENT_READ,
  },
  "party.sugoroku.cubeHeld": {
    text: "キューブ{value}（{name}）",
    back: "Cube {value} ({name})",
    review: AGENT_READ,
  },
  "party.sugoroku.scoreLine": {
    text: "{length}：{a} {x}、{b} {y}",
    back: "{length}: {a} {x}, {b} {y}",
    review: AGENT_READ,
  },
  "party.sugoroku.matchDrawn": {
    text: "マッチは引き分けです。",
    back: "The match is a draw.",
    review: AGENT_READ,
  },
  "party.sugoroku.matchWinner": {
    text: "{name}がマッチに勝ちました。",
    back: "{name} won the match.",
    review: AGENT_READ,
  },
  "party.sugoroku.doubleOffered": {
    text: "{offerer}が{value}にダブルしました。{name}さん、テイクしますか、ドロップしますか？",
    back: "{offerer} doubled to {value}. {name}, take or drop?",
    review: AGENT_READ,
  },
  "party.sugoroku.openingRoll": {
    text: "{name}が最初のサイコロを振ります。",
    back: "{name} rolls the opening roll.",
    review: AGENT_READ,
  },
  "party.sugoroku.rollTurn": {
    text: "{name}の番です：サイコロを振ります。",
    back: "{name}'s turn: roll the dice.",
    review: AGENT_READ,
  },
  "party.sugoroku.rollTurnDouble": {
    text: "{name}の番です：サイコロを振るか、ダブルします。",
    back: "{name}'s turn: roll the dice, or double.",
    review: AGENT_READ,
  },
  "party.sugoroku.howDrop": {
    text: "（ダブルをドロップ）",
    back: "(the double was dropped)",
    review: AGENT_READ,
  },
  "party.sugoroku.howConcede": {
    text: "（相手が降りました）",
    back: "(the other side gave up)",
    review: AGENT_READ,
  },
  "party.sugoroku.kindGammon": {
    text: "（ギャモン）",
    back: "(gammon)",
    review: AGENT_READ,
  },
  "party.sugoroku.kindBackgammon": {
    text: "（バックギャモン）",
    back: "(backgammon)",
    review: AGENT_READ,
  },
  "party.sugoroku.endWins": {
    text: "{winner}の勝ちです{how}{kind}。",
    back: "{winner} wins{how}{kind}.",
    review: AGENT_READ,
  },
  "party.sugoroku.endMatchWins": {
    text: "{winner}がマッチに{high}対{low}で勝ちました。",
    back: "{winner} wins the match {high} to {low}.",
    review: AGENT_READ,
  },
  "party.sugoroku.off": {
    text: "ベアオフ{count}個",
    back: "{count} borne off",
    review: AGENT_READ,
  },
  "party.sugoroku.gameBegins": {
    text: "第{n}ゲームを始めます。",
    back: "Game {n} begins.",
    review: AGENT_READ,
  },
  "party.sugoroku.newsDrawn": {
    text: "ゲームは引き分けでした。",
    back: "The game was a draw.",
    review: AGENT_READ,
  },
  "party.sugoroku.newsWon": {
    text: "{winner}がゲームに勝ちました（{points}）。",
    back: "{winner} won the game ({points}).",
    review: AGENT_READ,
  },
  "party.sugoroku.newsWonDrop": {
    text: "{winner}がゲームに勝ちました（ダブルをドロップ、{points}）。",
    back: "{winner} won the game (the double dropped, {points}).",
    review: AGENT_READ,
  },
  "party.sugoroku.newsWonConcede": {
    text: "{winner}がゲームに勝ちました（相手が降りて、{points}）。",
    back: "{winner} won the game (the other side gave up, {points}).",
    review: AGENT_READ,
  },
  "party.sugoroku.newsWonGammon": {
    text: "{winner}がゲームにギャモンで勝ちました（{points}）。",
    back: "{winner} won the game with a gammon ({points}).",
    review: AGENT_READ,
  },
  "party.sugoroku.newsWonBackgammon": {
    text: "{winner}がゲームにバックギャモンで勝ちました（{points}）。",
    back: "{winner} won the game with a backgammon ({points}).",
    review: AGENT_READ,
  },
  "party.sugoroku.newsDoubled": {
    text: "{name}がダブルしました。",
    back: "{name} doubled.",
    review: AGENT_READ,
  },
  "party.sugoroku.newsTook": {
    text: "{name}がテイクしました。",
    back: "{name} took the double.",
    review: AGENT_READ,
  },
  "party.sugoroku.newsDropped": {
    text: "{name}がドロップしました。",
    back: "{name} dropped the double.",
    review: AGENT_READ,
  },
  "party.sugoroku.newsConceded": {
    text: "{name}がゲームをあきらめました。",
    back: "{name} gave up the game.",
    review: AGENT_READ,
  },
  "party.sugoroku.newsNoMove": {
    text: "{name}は{dice}を振りましたが、動かせませんでした。",
    back: "{name} rolled {dice} and could not move.",
    review: AGENT_READ,
  },
  "party.sugoroku.newsPlayed": {
    text: "{name}は{dice}を振り、{play}と動かしました。",
    back: "{name} rolled {dice} and played {play}.",
    review: AGENT_READ,
  },
  "party.sugoroku.computerShown": {
    text: "コンピュータ（{strength}）",
    back: "Computer ({strength})",
    review: AGENT_READ,
  },
  "party.sugoroku.computerPlain": {
    text: "コンピュータ",
    back: "Computer",
    review: AGENT_READ,
  },
  "party.sugoroku.toPlay": {
    text: "{name}の番です。",
    back: "{name}'s turn.",
    review: AGENT_READ,
  },
  "party.sugoroku.boardAsBegins": {
    text: "はじめの{game}の盤",
    back: "The {game} board as the game begins",
    review: AGENT_READ,
  },
  "party.sugoroku.lengthLineSingle": {
    text: "1ゲーム、キューブなし。",
    back: "One game, no cube.",
    review: AGENT_READ,
  },
  "party.sugoroku.lengthLineMatch": {
    text: "{length}ポイント。ダブリングキューブ、ギャモン、クロフォードルールがあります。",
    back: "{length} points, with the doubling cube, gammons and the Crawford rule.",
    review: AGENT_READ,
  },
  "party.sugoroku.single": {
    text: "シングル",
    back: "Single",
    review: AGENT_READ,
  },
  "party.sugoroku.toLength": {
    text: "{points}ポイント",
    back: "To {points}",
    review: AGENT_READ,
  },
  "party.sugoroku.sideWhite": {
    text: "白",
    back: "White",
    review: AGENT_READ,
  },
  "party.sugoroku.sideBlack": {
    text: "黒",
    back: "Black",
    review: AGENT_READ,
  },
  // Tenka's set-up and round lines
  "party.tenka.lengthWorld": {
    text: "世界全体",
    back: "The whole world",
    review: AGENT_READ,
  },
  "party.tenka.lengthEurope": {
    text: "ヨーロッパ全体",
    back: "All of Europe",
    review: AGENT_READ,
  },
  "party.tenka.lengthRounds": {
    text: "{count}ラウンド",
    back: "{count} rounds",
    review: AGENT_READ,
  },
  "party.tenka.noteWorld": {
    text: "1人が世界を押さえるまで遊びます。",
    back: "Play until one person holds the world.",
    review: AGENT_READ,
  },
  "party.tenka.noteEurope": {
    text: "1人がヨーロッパ全体を押さえるまで遊びます。",
    back: "Play until one person holds all of Europe.",
    review: AGENT_READ,
  },
  "party.tenka.noteRounds": {
    text: "{count}ラウンド後に、領土がいちばん多い人の勝ちです。",
    back: "After {count} rounds, whoever has the most territories wins.",
    review: AGENT_READ,
  },
  "party.tenka.roundOne": {
    text: "第{round}ラウンド",
    back: "Round {round}",
    review: AGENT_READ,
  },
  "party.tenka.roundOf": {
    text: "第{round}ラウンド（全{rounds}）",
    back: "Round {round} of {rounds}",
    review: AGENT_READ,
  },
  // Pachisi's throw
  "party.pachisi.boardAria": {
    text: "パチーシの盤",
    back: "Pachisi board",
    review: AGENT_READ,
  },
  "party.pachisi.pawnAria": {
    text: "{name}の駒{n}を動かす",
    back: "Move {name}'s piece {n}",
    review: AGENT_READ,
  },
  "party.pachisi.dieNone": {
    text: "まだ振っていません",
    back: "Not thrown yet",
    review: AGENT_READ,
  },
  "party.pachisi.dieValue": {
    text: "{value}の目",
    back: "A {value}",
    review: AGENT_READ,
  },
  "party.pachisi.dieUsed": {
    text: "{value}の目（使用済み）",
    back: "A {value} (used)",
    review: AGENT_READ,
  },
  "party.pachisi.valuesAria": {
    text: "動かす目",
    back: "The numbers to move by",
    review: AGENT_READ,
  },
  "party.pachisi.rolled": {
    text: "{name}が{a}と{b}を出しました。",
    back: "{name} threw {a} and {b}.",
    review: AGENT_READ,
  },
  "party.pachisi.rolledDouble": {
    text: "{name}が{a}と{b}を出しました：ゾロ目で、もう一度振ります。",
    back: "{name} threw {a} and {b}: doubles, and another throw follows.",
    review: AGENT_READ,
  },
  "party.sugoroku.boardLabel": {
    text: "{a}が白、{b}が黒",
    back: "{a} is white, {b} is black",
    review: AGENT_READ,
  },
  // Tenka's table
  "party.tenka.playersTitle": {
    text: "対局者",
    back: "Players",
    review: AGENT_READ,
  },
  "party.tenka.columnsNote": {
    text: "領土・部隊・カード。",
    back: "Territories, armies and cards.",
    review: AGENT_READ,
  },
  "party.tenka.neutralArmy": {
    text: "中立の部隊",
    back: "Neutral army",
    review: AGENT_READ,
  },
  "party.tenka.neutralOf": {
    text: "中立の部隊の",
    back: "the neutral army's",
    review: AGENT_READ,
  },
  "party.tenka.neutralWho": {
    text: "中立の部隊",
    back: "the neutral army",
    review: AGENT_READ,
  },
  "party.tenka.possessive": {
    text: "{name}の",
    back: "{name}'s",
    review: AGENT_READ,
  },
  "party.tenka.chipAria": {
    text: "{name}、{whose}（{colour}、{letter}）、{armies}",
    back: "{name}, {whose} ({colour}, {letter}), {armies}",
    review: AGENT_READ,
  },
  "party.tenka.chipTitle": {
    text: "{name}：{whose}、{armies}",
    back: "{name}: {whose}, {armies}",
    review: AGENT_READ,
  },
  "party.tenka.stepsAria": {
    text: "手番の段階",
    back: "The steps of a turn",
    review: AGENT_READ,
  },
  "party.tenka.oneFewer": {
    text: "1つ減らす",
    back: "One fewer",
    review: AGENT_READ,
  },
  "party.tenka.oneMore": {
    text: "1つ増やす",
    back: "One more",
    review: AGENT_READ,
  },
  "party.tenka.kindLand": {
    text: "陸",
    back: "Land",
    review: AGENT_READ,
  },
  "party.tenka.kindSea": {
    text: "海",
    back: "Sea",
    review: AGENT_READ,
  },
  "party.tenka.kindAir": {
    text: "空",
    back: "Air",
    review: AGENT_READ,
  },
  "party.tenka.kindWild": {
    text: "ワイルド",
    back: "Wild",
    review: AGENT_READ,
  },
  "party.tenka.cardLabel": {
    text: "{kind}：{name}",
    back: "{kind}: {name}",
    review: AGENT_READ,
  },
  "party.tenka.deck": {
    text: "山札：{count}枚",
    back: "Deck: {count}",
    review: AGENT_READ,
  },
  "party.tenka.handHidden": {
    text: "{cards}。端末を渡すと表示されます。",
    back: "{cards}. They are shown once the device is passed on.",
    review: AGENT_READ,
  },
  "party.tenka.tradeKinds": {
    text: "{trade}：{kinds}",
    back: "{trade}: {kinds}",
    review: AGENT_READ,
  },
  "party.tenka.diceNone": {
    text: "この手番では、まだサイコロを振っていません。",
    back: "No dice have been rolled yet this turn.",
    review: AGENT_READ,
  },
  "party.tenka.diceAgainst": {
    text: "対",
    back: "against",
    review: AGENT_READ,
  },
  "party.tenka.diceLost": {
    text: "{who}は{armies}を失いました",
    back: "{who} lost {armies}",
    review: AGENT_READ,
  },
  "party.tenka.diceLostBoth": {
    text: "{a}、{b}",
    back: "{a}, and {b}",
    review: AGENT_READ,
  },
  "party.tenka.diceThrows": {
    text: "{count}回振りました。",
    back: "{count} throws.",
    review: AGENT_READ,
  },
  "party.tenka.diceTakes": {
    text: "{who}が{territory}を取りました！",
    back: "{who} takes {territory}!",
    review: AGENT_READ,
  },
  "party.tenka.diceFrom": {
    text: "{from}から{to}へ、{count}回振りました：",
    back: "{count} throws from {from} into {to}:",
    review: AGENT_READ,
  },
  "party.tenka.diceOnce": {
    text: "{from}から{to}へ：",
    back: "{from} into {to}:",
    review: AGENT_READ,
  },
  "party.tenka.diceThrew": {
    text: "{attacker}は{a}、{defender}は{d}を出しました。",
    back: "{attacker} threw {a}, and {defender} threw {d}.",
    review: AGENT_READ,
  },
  "party.tenka.dieAttack": {
    text: "攻撃側のサイコロ：{value}",
    back: "Attacker's die: {value}",
    review: AGENT_READ,
  },
  "party.tenka.dieDefend": {
    text: "防御側のサイコロ：{value}",
    back: "Defender's die: {value}",
    review: AGENT_READ,
  },
  "party.tenka.newsOut": {
    text: "{by}が{seat}を倒し、そのカードを取りました。",
    back: "{by} knocked {seat} out and took their cards.",
    review: AGENT_READ,
  },
  "party.tenka.newsTrade": {
    text: "{name}が1組を交換して、{armies}を得ました。",
    back: "{name} traded a set and got {armies}.",
    review: AGENT_READ,
  },
  "party.tenka.newsDrawWild": {
    text: "{name}がカードを1枚取りました（ワイルド）。",
    back: "{name} took a card (wild).",
    review: AGENT_READ,
  },
  "party.tenka.newsDraw": {
    text: "{name}がカードを1枚取りました（{kind}、{territory}）。",
    back: "{name} took a card ({kind}, {territory}).",
    review: AGENT_READ,
  },
  "party.tenka.nothingYet": {
    text: "まだありません。",
    back: "Nothing yet.",
    review: AGENT_READ,
  },
  "party.tenka.takesWorld": {
    text: "{name}が天下を取りました。天下統一！",
    back: "{name} takes the world. 天下統一!",
    review: AGENT_READ,
  },
  "party.tenka.winsCount": {
    text: "{name}が集計で勝ちました（{held}）。",
    back: "{name} wins the count ({held}).",
    review: AGENT_READ,
  },
  "party.tenka.sharesCount": {
    text: "{names}が勝ちを分け合いました（それぞれ{held}）。",
    back: "{names} share the win ({held} each).",
    review: AGENT_READ,
  },
  "party.tenka.worldTitle": {
    text: "世界",
    back: "The world",
    review: AGENT_READ,
  },
  "party.tenka.worldLead": {
    text: "6つの大陸に42の領土があります。手番の始まりに、ある大陸のすべての領土を持っていると、そのボーナスが部隊に加わります。地図の破線は海路で、国境と同じように、部隊が攻めたり移動したりできます。",
    back: "Forty-two territories in six continents. If you hold every territory of a continent at the start of your turn, its bonus is added to your armies. A dashed line on the map is a sea route, and armies can attack and move across it as across a border.",
    review: AGENT_READ,
  },
  "party.tenka.colContinent": {
    text: "大陸",
    back: "Continent",
    review: AGENT_READ,
  },
  "party.tenka.colBonus": {
    text: "ボーナス",
    back: "Bonus",
    review: AGENT_READ,
  },
  "party.tenka.colTerritories": {
    text: "領土",
    back: "Territories",
    review: AGENT_READ,
  },
  "party.tenka.bySea": {
    text: "{name}（海路：{others}）",
    back: "{name} (by sea: {others})",
    review: AGENT_READ,
  },
  "party.tenka.worldCredit": {
    text: "領土、大陸、ボーナスは、昔ながらの世界征服ゲームの盤のもので、どこがどこと接しているかを表す図として使っています。使うのはその地理だけで、市販のどのゲームの絵や言葉も使っていません。地図はNatural Earth（パブリックドメイン）から、国と、その州・省・地域まで描いているので、カナダ、アメリカ、ロシア、中国、オーストラリアは、実際の境界で分かれています。",
    back: "The territories, continents and bonuses are those of the classic world-conquest board, used as a graph of who touches whom. Only that geography is used, and none of the artwork or wording of any commercial game. The map is drawn from Natural Earth (public domain), with countries and their states, provinces and regions, so Canada, the United States, Russia, China and Australia are divided along real borders.",
    review: AGENT_READ,
  },
  // Gunjin's name fields
  "party.gunjin.nameRed": {
    text: "{name}（赤・先手）",
    back: "{name} (red, moves first)",
    review: AGENT_READ,
  },
  "party.gunjin.nameBlue": {
    text: "{name}（青）",
    back: "{name} (blue)",
    review: AGENT_READ,
  },
};
