import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the mosaic.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_MOSAIC: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "mosaic.heading": {
    text: "対局の壁紙",
    back: "Game wallpaper",
    review: AGENT_READ,
  },
  "mosaic.openLabel": {
    text: "すべての局面",
    back: "Every position",
    review: AGENT_READ,
  },
  "mosaic.blurb": {
    text: "この対局のすべての局面を、順番に、画面の大きさの1枚の画像に並べます。ブラウザで作るので、どこにも送信されません。",
    back: "Every position of this game is lined up in order on one image the size of your screen. It is made in your browser, so nothing is sent anywhere.",
    review: AGENT_READ,
  },
  "mosaic.make": {
    text: "画像を作る",
    back: "Make the picture",
    review: AGENT_READ,
  },
  "mosaic.making": {
    text: "描いています…",
    back: "Drawing…",
    review: AGENT_READ,
  },
  "mosaic.download": {
    text: "ダウンロード",
    back: "Download",
    review: AGENT_READ,
  },
  "mosaic.fullScreen": {
    text: "全画面で見る",
    back: "View full screen",
    review: AGENT_READ,
  },
  "mosaic.again": {
    text: "作り直す",
    back: "Make it again",
    review: AGENT_READ,
  },
  "mosaic.pickLegend": {
    text: "画像に入りきらない局面があります。表示する部分を選んでください（{count}局面、{tiles}枚）：",
    back: "There are more positions than the picture holds. Choose which part to show ({count} positions, {tiles} tiles):",
    review: AGENT_READ,
  },
  "mosaic.pickOpening": {
    text: "序盤（最初の手から数える）",
    back: "the opening (counted from the first move)",
    review: AGENT_READ,
  },
  "mosaic.pickSpread": {
    text: "対局全体（等間隔に間引く）",
    back: "the whole game (thinned out evenly)",
    review: AGENT_READ,
  },
  "mosaic.pickEnding": {
    text: "終盤（最後の手から数える）",
    back: "the ending (counted back from the last move)",
    review: AGENT_READ,
  },
  "mosaic.failed": {
    text: "このブラウザでは画像を描けませんでした。",
    back: "The picture could not be drawn in this browser.",
    review: AGENT_READ,
  },
  "mosaic.shapeLabel": {
    text: "形",
    back: "Shape",
    review: AGENT_READ,
  },
  "mosaic.landscape": {
    text: "横長",
    back: "Landscape",
    review: AGENT_READ,
  },
  "mosaic.landscapeNote": {
    text: "1920×1080、パソコンやテレビ向け",
    back: "1920×1080, for a computer or a television",
    review: AGENT_READ,
  },
  "mosaic.portrait": {
    text: "縦長",
    back: "Portrait",
    review: AGENT_READ,
  },
  "mosaic.portraitNote": {
    text: "1170×2532、iPhone向け",
    back: "1170×2532, for an iPhone",
    review: AGENT_READ,
  },
  "mosaic.shownOf": {
    text: "{total}局面のうち{shown}局面",
    back: "{shown} of {total} positions",
    review: AGENT_READ,
  },
  "mosaic.vs": {
    text: "{black}対{white}",
    back: "{black} against {white}",
    review: AGENT_READ,
  },
  "mosaic.altGame": {
    text: "この対局のすべての局面（{count}）",
    back: "Every position of this game ({count})",
    review: AGENT_READ,
  },
  "mosaic.altSoFar": {
    text: "この対局のここまでのすべての局面（{count}）",
    back: "Every position of this game so far ({count})",
    review: AGENT_READ,
  },
  "mosaic.close": {
    text: "閉じる",
    back: "Close",
    review: AGENT_READ,
  },
  "mosaic.inPlay": {
    text: "対局中",
    back: "In play",
    review: AGENT_READ,
  },
  "mosaic.wallpaperDrawing": {
    text: "盤を描いています…",
    back: "Drawing the board…",
    review: AGENT_READ,
  },
  "mosaic.wallpaperFailed": {
    text: "このブラウザでは盤を描けませんでした。",
    back: "The board could not be drawn in this browser.",
    review: AGENT_READ,
  },
  "mosaic.wallpaperAlt": {
    text: "{name}の終局図を壁紙にしたもの",
    back: "The finished board of {name}, made as a wallpaper",
    review: AGENT_READ,
  },
};
