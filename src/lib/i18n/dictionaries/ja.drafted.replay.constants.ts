import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the replay.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_REPLAY: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The replay's buttons and its move count
  "replay.start": {
    text: "最初へ",
    back: "To the start",
    review: AGENT_READ,
  },
  "replay.back": {
    text: "戻る",
    back: "Back",
    review: AGENT_READ,
  },
  "replay.play": {
    text: "再生",
    back: "Play",
    review: AGENT_READ,
  },
  "replay.pause": {
    text: "一時停止",
    back: "Pause",
    review: AGENT_READ,
  },
  "replay.forward": {
    text: "進む",
    back: "Forward",
    review: AGENT_READ,
  },
  "replay.end": {
    text: "最後へ",
    back: "To the end",
    review: AGENT_READ,
  },
  "replay.scrubber": {
    text: "手",
    back: "Move",
    review: AGENT_READ,
  },
  "replay.moveOf": {
    text: "{last}手中{move}手目",
    back: "Move {move} of {last}",
    review: AGENT_READ,
  },
  "replay.made": {
    text: "{when}に着手",
    back: "made at {when}",
    review: AGENT_READ,
  },
  "replay.ended": {
    text: "{when}に終局",
    back: "ended at {when}",
    review: AGENT_READ,
  },
  "replay.started": {
    text: "{when}に開始",
    back: "started at {when}",
    review: AGENT_READ,
  },
  // Under the board
  "replay.boardLabel": {
    text: "この対局",
    back: "this game",
    review: AGENT_READ,
  },
  "replay.noStones": {
    text: "この対局では、石が打たれていません。",
    back: "No stones were played in this game.",
    review: AGENT_READ,
  },
  "replay.noMoves": {
    text: "まだ手がありません。",
    back: "There are no moves yet.",
    review: AGENT_READ,
  },
  "replay.flip": {
    text: "盤を反転",
    back: "Flip the board",
    review: AGENT_READ,
  },
  "replay.flipBack": {
    text: "盤を元に戻す",
    back: "Flip the board back",
    review: AGENT_READ,
  },
  "replay.showNumbers": {
    text: "手数を表示",
    back: "Show move numbers",
    review: AGENT_READ,
  },
  "replay.hideNumbers": {
    text: "手数を隠す",
    back: "Hide move numbers",
    review: AGENT_READ,
  },
  "replay.moves": {
    text: "棋譜",
    back: "Record of moves",
    review: AGENT_READ,
  },
  "replay.movesAsText": {
    text: "テキストの棋譜",
    back: "Record of moves as text",
    review: AGENT_READ,
  },
  "replay.copyAsText": {
    text: "テキストでコピー",
    back: "Copy as text",
    review: AGENT_READ,
  },
  "replay.copyAll": {
    text: "すべてコピー",
    back: "Copy everything",
    review: AGENT_READ,
  },
  "replay.copied": {
    text: "コピーしました",
    back: "Copied",
    review: AGENT_READ,
  },
  "replay.show": {
    text: "開く",
    back: "open",
    review: AGENT_READ,
  },
  "replay.hide": {
    text: "閉じる",
    back: "close",
    review: AGENT_READ,
  },
  "replay.advanced": {
    text: "詳細",
    back: "Details",
    review: AGENT_READ,
  },
  "replay.forkSays": {
    text: "盤の{move}手目の局面から、同じ相手と新しい対局を始めます。色はそのままで、最初に時計を決めます。この対局は終わったままの形で残ります。",
    back: "A new game starts from the position at move {move} on the board, against the same player. The colours stay as they are, and the clock is set first. This game stays as it ended.",
    review: AGENT_READ,
  },
  "replay.forkHint": {
    text: "前の手まで戻すと、その局面から同じ相手と新しい対局を続けられます。",
    back: "If you step back to an earlier move, you can continue a new game from that position against the same player.",
    review: AGENT_READ,
  },
  "replay.forkLabel": {
    text: "{move}手目から対局",
    back: "Play from move {move}",
    review: AGENT_READ,
  },
  // The conversation kept with a game
  "replay.said": {
    text: "交わした言葉",
    back: "What they said",
    review: AGENT_READ,
  },
  "replay.sent": {
    text: "送ったスタンプ",
    back: "The stamps they sent",
    review: AGENT_READ,
  },
  "replay.beforeGame": {
    text: "対局の前",
    back: "Before the game",
    review: AGENT_READ,
  },
  "replay.moveNumber": {
    text: "{move}手目",
    back: "Move {move}",
    review: AGENT_READ,
  },
  // Hiding a game, and judging your own play
  "replay.hideGameHint": {
    text: "非表示にした対局も合計には入ります。公開の一覧から外れるだけです。",
    back: "Hidden games still count in the totals. They only leave the public list.",
    review: AGENT_READ,
  },
  "replay.showOnList": {
    text: "一覧に表示する",
    back: "Show on my list",
    review: AGENT_READ,
  },
  "replay.hideFromList": {
    text: "一覧から隠す",
    back: "Hide from my list",
    review: AGENT_READ,
  },
  "replay.selfVerdict": {
    text: "自分の対局はどうでしたか？",
    back: "How was your own game?",
    review: AGENT_READ,
  },
  "replay.selfWell": {
    text: "よくできた",
    back: "Went well",
    review: AGENT_READ,
  },
  "replay.selfNotWell": {
    text: "うまくいかなかった",
    back: "Did not go well",
    review: AGENT_READ,
  },
  "replay.selfPrivate": {
    text: "非公開です。自分だけに見えます。",
    back: "It is private. Only you can see it.",
    review: AGENT_READ,
  },
  // The record's list, its progress and its pages
  "replay.empty": {
    text: "この条件に合う対局は、まだありません。",
    back: "No game matches these filters yet.",
    review: AGENT_READ,
  },
  "replay.rowAria": {
    text: "再生：{black}対{white}",
    back: "Replay: {black} against {white}",
    review: AGENT_READ,
  },
  "replay.vs": {
    text: "対",
    back: "against",
    review: AGENT_READ,
  },
  "replay.allShown": {
    text: "{games}すべてを表示しました。",
    back: "All {games} are shown.",
    review: AGENT_READ,
  },
  "replay.progressMore": {
    text: "{total}局中{shown}局を表示しています。下へスクロールすると続きが出ます。",
    back: "{shown} of {total} games are shown. Keep scrolling for more.",
    review: AGENT_READ,
  },
  "replay.progressLoading": {
    text: "{total}局中{shown}局を表示しています。続きを読み込み中…",
    back: "{shown} of {total} games are shown. Loading more…",
    review: AGENT_READ,
  },
  "replay.scrollFailed": {
    text: "いまは続きを読み込めませんでした。下のページ送りは使えます。",
    back: "More could not be loaded just now. The page links below still work.",
    review: AGENT_READ,
  },
  "replay.pagination": {
    text: "ページ送り",
    back: "Page navigation",
    review: AGENT_READ,
  },
  "replay.pageOf": {
    text: "{pages}ページ中{page}ページ目・{games}",
    back: "Page {page} of {pages} · {games}",
    review: AGENT_READ,
  },
  "replay.previous": {
    text: "前へ",
    back: "Previous",
    review: AGENT_READ,
  },
  "replay.next": {
    text: "次へ",
    back: "Next",
    review: AGENT_READ,
  },
  // The narrowing chips and the filters over the record
  "replay.stopNarrowing": {
    text: "絞り込みを外す：{label}",
    back: "Remove the narrowing: {label}",
    review: AGENT_READ,
  },
  "replay.remove": {
    text: "— 外す",
    back: "— remove",
    review: AGENT_READ,
  },
  "replay.howItWent": {
    text: "{name}さんの結果",
    back: "{name}'s result",
    review: AGENT_READ,
  },
  // The record page itself
  "replay.yours": {
    text: "自分の対局",
    back: "My games",
    review: AGENT_READ,
  },
  "replay.leadAll": {
    text: "終わったすべての対局を、新しい順に並べています。開くと、1手ずつ再生できます。",
    back: "Every finished game, newest first. Open one to replay it move by move.",
    review: AGENT_READ,
  },
  "replay.leadGame": {
    text: "{game}の終わったすべての対局を、新しい順に並べています。開くと、1手ずつ再生できます。",
    back: "Every finished game of {game}, newest first. Open one to replay it move by move.",
    review: AGENT_READ,
  },
  "replay.memberUnknown": {
    text: "その会員が見つからないので、絞り込まない全体の記録を表示しています。",
    back: "That member could not be found, so the whole unfiltered record is shown.",
    review: AGENT_READ,
  },
  "replay.filtersInvalid": {
    text: "その絞り込みは使えないので、絞り込まない全体の記録を表示しています。",
    back: "Those filters could not be used, so the whole unfiltered record is shown.",
    review: AGENT_READ,
  },
  "replay.textHeadingAll": {
    text: "{site} — 終わったすべての対局",
    back: "{site} — every finished game",
    review: AGENT_READ,
  },
  "replay.textHeadingGame": {
    text: "{site} — {game}の終わったすべての対局",
    back: "{site} — every finished game of {game}",
    review: AGENT_READ,
  },
  // A move written in another site's style
  "replay.formatIyt": {
    text: "IYT形式",
    back: "IYT style",
    review: AGENT_READ,
  },
  "replay.formatGt": {
    text: "GT形式",
    back: "GT style",
    review: AGENT_READ,
  },
};
