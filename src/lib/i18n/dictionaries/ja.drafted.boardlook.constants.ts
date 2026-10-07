import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the boardlook.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_BOARDLOOK: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // Surfaces (the woods, paper, ink and tea a board can be)
  "boardlook.themeKaya": {
    text: "榧",
    back: "Kaya (a kind of wood)",
    review: AGENT_READ,
  },
  "boardlook.themeShinkaya": {
    text: "新榧",
    back: "New kaya (a darker wood)",
    review: AGENT_READ,
  },
  "boardlook.themeWashi": {
    text: "和紙",
    back: "Washi (paper)",
    review: AGENT_READ,
  },
  "boardlook.themeSumi": {
    text: "墨",
    back: "Sumi (ink)",
    review: AGENT_READ,
  },
  "boardlook.themeMatcha": {
    text: "抹茶",
    back: "Matcha (powdered tea)",
    review: AGENT_READ,
  },
  // Felts (the cloth a Reversi board is covered in)
  "boardlook.feltGreen": {
    text: "緑",
    back: "Green",
    review: AGENT_READ,
  },
  "boardlook.feltBlue": {
    text: "青",
    back: "Blue",
    review: AGENT_READ,
  },
  "boardlook.feltRed": {
    text: "赤",
    back: "Red",
    review: AGENT_READ,
  },
  "boardlook.feltBlack": {
    text: "黒",
    back: "Black",
    review: AGENT_READ,
  },
  "boardlook.feltPicker": {
    text: "盤の色",
    back: "Board colour",
    review: AGENT_READ,
  },
  "boardlook.feltOwnAria": {
    text: "自分の盤：{name}",
    back: "Your own board: {name}",
    review: AGENT_READ,
  },
  "boardlook.feltOwnTitle": {
    text: "自分の盤（{name}）",
    back: "Your own board ({name})",
    review: AGENT_READ,
  },
  // Stone sets
  "boardlook.stonesClassic": {
    text: "那智黒と蛤",
    back: "Slate and clam shell",
    review: AGENT_READ,
    ask: "The five stone-set names are renderings of English names (那智黒と蛤, 翡翠と骨, 梅と桜, 藍と米, ネオン). A Go player should confirm they read as the stones' materials and colours.",
  },
  "boardlook.stonesJade": {
    text: "翡翠と骨",
    back: "Jade and bone",
    review: AGENT_READ,
  },
  "boardlook.stonesSakura": {
    text: "梅と桜",
    back: "Plum and cherry blossom",
    review: AGENT_READ,
  },
  "boardlook.stonesIndigo": {
    text: "藍と米",
    back: "Indigo and rice",
    review: AGENT_READ,
  },
  "boardlook.stonesNeon": {
    text: "ネオン",
    back: "Neon",
    review: AGENT_READ,
  },
  // The three ways of drawing a board
  "boardlook.gridAuto": {
    text: "伝統的な表示",
    back: "Traditional display",
    review: AGENT_READ,
  },
  "boardlook.gridAutoHint": {
    text: "どのゲームも本来の描き方で表示します。五目並べと囲碁は線の交点に、三目並べとリバーシは升目の中に打ちます。",
    back: "Each game is drawn the way it is traditionally played. Gomoku and go are played on the crossings of the lines, and tic-tac-toe and Reversi inside the squares.",
    review: AGENT_READ,
  },
  "boardlook.gridLines": {
    text: "{site}式の表示",
    back: "{site}-style view",
    review: AGENT_READ,
  },
  "boardlook.gridLinesHint": {
    text: "すべてのゲームを、碁盤のように線の交点に打ちます。三目並べも含めた、このサイトの標準の表示です。",
    back: "Every game is played on the crossings, as on a go board. This is the site's own standard view, and tic-tac-toe is included.",
    review: AGENT_READ,
  },
  "boardlook.gridCells": {
    text: "升目の表示",
    back: "Squares view",
    review: AGENT_READ,
  },
  "boardlook.gridCellsHint": {
    text: "すべてのゲームを、チェス盤のように升目の中に打ちます。五目並べも含みます。",
    back: "Every game is played inside the squares, as on a chessboard. Gomoku is included.",
    review: AGENT_READ,
  },
  // A board's size, said for a screen reader
  "boardlook.sizeBy": {
    text: "{width}×{height}の盤",
    back: "{width} by {height} board",
    review: AGENT_READ,
  },
  "boardlook.solidStep": {
    text: "{name}：5段階中{step}段階目",
    back: "{name}: stage {step} of 5",
    review: AGENT_READ,
  },
  // Opening one board on its own
  "boardlook.focusThis": {
    text: "この盤",
    back: "this board",
    review: AGENT_READ,
  },
  "boardlook.focusDialog": {
    text: "{board}だけの表示",
    back: "Display of {board} by itself",
    review: AGENT_READ,
  },
  "boardlook.focusOpen": {
    text: "{board}だけを開く",
    back: "Open just {board}",
    review: AGENT_READ,
  },
  "boardlook.focusCloseAria": {
    text: "閉じて、ページに戻る",
    back: "Close, back to the page",
    review: AGENT_READ,
  },
  "boardlook.focusCloseTitle": {
    text: "閉じる（Esc）",
    back: "Close (Esc)",
    review: AGENT_READ,
  },
  "boardlook.focusClose": {
    text: "閉じる",
    back: "Close",
    review: AGENT_READ,
  },
  // The size of the board on a desk, and the just-the-board mode
  "boardlook.scaleGroup": {
    text: "盤の大きさ",
    back: "Board size",
    review: AGENT_READ,
  },
  "boardlook.scaleHeading": {
    text: "盤",
    back: "Board",
    review: AGENT_READ,
  },
  "boardlook.scaleRegular": {
    text: "標準",
    back: "Regular",
    review: AGENT_READ,
  },
  "boardlook.scaleRegularWhole": {
    text: "ページ本来の標準の大きさ",
    back: "Regular board size, as the page draws it",
    review: AGENT_READ,
  },
  "boardlook.scaleLarge": {
    text: "大",
    back: "Large",
    review: AGENT_READ,
  },
  "boardlook.scaleLargeWhole": {
    text: "大きめの盤（全画面の半分ほど）",
    back: "Large board, about halfway to full screen",
    review: AGENT_READ,
  },
  "boardlook.scaleFull": {
    text: "全画面",
    back: "Full screen",
    review: AGENT_READ,
  },
  "boardlook.scaleFullWhole": {
    text: "全画面の盤（ウィンドウいっぱい）",
    back: "Full screen board, as large as the window allows",
    review: AGENT_READ,
  },
  "boardlook.bareEnter": {
    text: "盤だけ表示",
    back: "Just the board",
    review: AGENT_READ,
  },
  "boardlook.bareEnterTitle": {
    text: "このページを、盤と棋譜だけで表示します",
    back: "Show this page as the board and the moves alone",
    review: AGENT_READ,
  },
  "boardlook.bareClose": {
    text: "閉じる",
    back: "Close",
    review: AGENT_READ,
  },
  "boardlook.bareCloseTitle": {
    text: "閉じて、ページのほかの部分を戻します（Esc）",
    back: "Close, and bring back the rest of the page (Esc)",
    review: AGENT_READ,
  },
  "boardlook.bareLabel": {
    text: "盤だけ表示",
    back: "Just the board",
    review: AGENT_READ,
  },
  // Turning the quadrants of a twisting board
  "boardlook.twistAnti": {
    text: "{quadrant}番の区画を反時計回りに回す",
    back: "Turn quadrant {quadrant} anticlockwise",
    review: AGENT_READ,
  },
  "boardlook.twistClock": {
    text: "{quadrant}番の区画を時計回りに回す",
    back: "Turn quadrant {quadrant} clockwise",
    review: AGENT_READ,
  },
  // The turn guide under the board
  "boardlook.guideCapture": {
    text: "必ず取らなければなりません。",
    back: "You must capture.",
    review: AGENT_READ,
  },
  "boardlook.guideMost": {
    text: "いちばん多く取る手を選ばなければなりません。",
    back: "You must choose the move that takes the most pieces.",
    review: AGENT_READ,
  },
  "boardlook.guideOnly.one": {
    text: "打てるのは1か所だけです：{moves}。",
    back: "Only one move is possible: {moves}.",
    review: AGENT_READ,
  },
  "boardlook.guideOnly.other": {
    text: "打てるのは{count}か所だけです：{moves}。",
    back: "Only {count} moves are possible: {moves}.",
    review: AGENT_READ,
  },
  "boardlook.guidePieces.one": {
    text: "動かせる駒：{moves}。",
    back: "The piece that may move: {moves}.",
    review: AGENT_READ,
  },
  "boardlook.guidePieces.other": {
    text: "動かせる駒：{moves}。",
    back: "The pieces that may move: {moves}.",
    review: AGENT_READ,
  },
  // One square, for a screen reader
  "boardlook.squareBlocked": {
    text: "ふさがれています",
    back: "blocked",
    review: AGENT_READ,
  },
  "boardlook.squareHot": {
    text: "ホットスポット",
    back: "hotspot",
    review: AGENT_READ,
  },
  "boardlook.squareWorm": {
    text: "ワームホール",
    back: "wormhole",
    review: AGENT_READ,
  },
  "boardlook.squareForbidden": {
    text: "禁じ手",
    back: "forbidden",
    review: AGENT_READ,
  },
  "boardlook.squareEmpty": {
    text: "空き",
    back: "empty",
    review: AGENT_READ,
  },
  "boardlook.squareKing": {
    text: "{colour}のキング",
    back: "{colour} king",
    review: AGENT_READ,
  },
  "boardlook.squareStone": {
    text: "{colour}の石",
    back: "{colour} stone",
    review: AGENT_READ,
  },
  "boardlook.squareLine": {
    text: "{point}は{what}",
    back: "{point} is {what}",
    review: AGENT_READ,
  },
  // The line over a game opened on its own
  "boardlook.playedOn": {
    text: "{site}で対局・{day}",
    back: "Played on {site}, {day}",
    review: AGENT_READ,
  },
  "boardlook.storyTitle": {
    text: "{black} 対 {white}・{game}、{board}",
    back: "{black} versus {white}, {game}, {board}",
    review: AGENT_READ,
  },
};
