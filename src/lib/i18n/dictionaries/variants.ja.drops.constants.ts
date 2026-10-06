import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Japanese copy for the Drops family (`variants.constants.ts` holds the
 * English). 落とし四目 and the other names are each game's `kanji` field, the
 * game's own name; terms follow `docs/plans/en-ja-everywhere/TERMS.md`.
 */
export const VARIANT_COPY_JA_DROPS = {
  dropFour: {
    tagline: ["石は列のいちばん下まで落ちる。4つ並べば勝ち。", "Stones fall to the bottom of their column. Four in a row wins."],
    origin: [
      "盤を立てて石を落とす四目並べを、このサイトで作り直したものです。枠の代わりに磁石で石が下へ引かれます。",
      "A version of the four-in-a-row game played with an upright board and falling stones, rebuilt for this site. Instead of a frame, a magnet pulls the stones down.",
    ],
    rules: [
      [
        "列のどこに打っても、盤が立っていて石が磁石でできているかのように、石はその列でいちばん下の空き点まで滑り落ちます。",
        "Wherever in a column you play, the stone slides down to the lowest empty point in that column, as if the board were upright and the stones were magnetic.",
      ],
      [
        "縦・横・斜めのどの向きでも、4つ並べば勝ちです。",
        "Four in a row in any direction (vertical, horizontal or diagonal) wins.",
      ],
      ["4つ並ばないまま盤が埋まったら引き分けです。", "If the board fills without four in a row, it is a draw."],
      ["先に打つのは黒でも白でもかまいません。", "Either black or white may play first."],
    ],
    board: [
      "7×7が定番の遊び心地です。9×9にすると長く遊べます。",
      "7×7 is the classic feel. 9×9 makes for a longer game.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  ringDrop: {
    tagline: ["落とし四目を円筒の上で遊ぶ。左右の端がつながっている。", "Drop Four played on a cylinder. The left and right edges are joined."],
    origin: ["円筒形の四目並べの、このサイト版です。", "This site's version of cylindrical four in a row."],
    rules: [
      [
        "落とし四目と同じく、石は列のいちばん下まで落ちます。",
        "As in Drop Four, stones fall to the bottom of their column.",
      ],
      [
        "左の端は右の端につながっていて、列は一方の端を越えて反対側へ続きます。",
        "The left edge is joined to the right edge, and a line continues past one edge onto the opposite side.",
      ],
      ["4つ並べば勝ちです。", "Four in a row wins."],
    ],
    board: ["7×7か9×9です。", "7×7 or 9×9."],
    review: AGENT_READ_2026_10_06,
  },
  holeDrop: {
    tagline: ["1つのマスは使えない。石は乗らず、列も通らない。", "One square cannot be used. No stone rests on it and no line passes through it."],
    origin: ["使えないマスのある四目並べの、このサイト版です。", "This site's version of four in a row with an unusable square."],
    rules: [
      ["石は列のいちばん下まで落ちます。", "Stones fall to the bottom of their column."],
      [
        "ゲーム開始時にランダムに選ばれた1つのマスが穴になります。穴には何も乗らず、落ちる石は穴を通り過ぎ、列も穴を通りません。",
        "One square, chosen at random when the game starts, becomes a hole. Nothing rests on a hole, a falling stone passes through it, and no line passes through it.",
      ],
      ["4つ並べば勝ちです。", "Four in a row wins."],
    ],
    board: [
      "7×7か9×9です。穴がいちばん下の段になることはありません。",
      "7×7 or 9×9. The hole is never on the bottom row.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  hotDrop: {
    tagline: [
      "ホットスポットはどちらの色の石にもなり、穴には何も乗らない。",
      "A hotspot can be a stone of either colour, and nothing rests on a hole.",
    ],
    origin: ["2つの仕掛けを持つ四目並べの、このサイト版です。", "This site's version of four in a row with two twists."],
    rules: [
      ["石は列のいちばん下まで落ちます。", "Stones fall to the bottom of their column."],
      [
        "ランダムに選ばれた1つのマスはホットスポットです。数えるときは、数えている側の色の石として扱われるので、自分の列にも相手の列にも加わります。",
        "One randomly chosen square is a hotspot. When counting, it is treated as a stone of the colour doing the counting, so it joins your lines and your opponent's lines alike.",
      ],
      [
        "ランダムに選ばれた1つのマスは穴で、何も乗せられません。",
        "One randomly chosen square is a hole, and nothing can be placed on it.",
      ],
      [
        "ホットスポットも数えて、4つ並べば勝ちです。石は自分の色としてしか数えられないので、相手の列の隙間に落とした石は、その列をふさぎます。",
        "Counting the hotspot too, four in a row wins. A stone counts only as its own colour, so a stone dropped into a gap in your opponent's line blocks that line.",
      ],
    ],
    board: ["7×7か9×9です。", "7×7 or 9×9."],
    review: AGENT_READ_2026_10_06,
  },
  clearDrop: {
    tagline: [
      "いちばん下の段が埋まると消えて、全部が1段下がる。",
      "When the bottom row fills it vanishes, and everything drops by one row.",
    ],
    origin: [
      "段が消える四目並べの、このサイト版です。落ち物パズルの規則を借りています。",
      "This site's version of four in a row where rows disappear, borrowing the rule of falling-block puzzles.",
    ],
    rules: [
      ["石は列のいちばん下まで落ちます。", "Stones fall to the bottom of their column."],
      [
        "いちばん下の段が埋まると、その段が消え、上にある石はすべて1段下がります。対局は続きます。",
        "When the bottom row fills, that row disappears and every stone above it drops by one row. The game continues.",
      ],
      [
        "4つ並べば勝ちです。段を埋めた石で4つ並んだ場合は、段が消える前に勝ちになります。",
        "Four in a row wins. If the stone that fills the row makes four in a row, it wins before the row disappears.",
      ],
    ],
    board: ["7×7か9×9です。", "7×7 or 9×9."],
    review: AGENT_READ_2026_10_06,
  },
  giveawayDrop: {
    tagline: ["4つ並べたら負け。相手に並べさせる。", "Making four in a row loses. Make your opponent do it."],
    origin: ["並べると負けになる四目並べの、このサイト版です。", "This site's version of four in a row where making the line loses."],
    rules: [
      ["石は列のいちばん下まで落ちます。", "Stones fall to the bottom of their column."],
      ["4つ並べた方が負けです。", "Whoever makes four in a row loses."],
      [
        "ほかの列に空きがあるかぎり、相手が直前に置いた石の真上には打てません。",
        "As long as another column has room, you cannot play directly on top of the stone your opponent just placed.",
      ],
      [
        "4つ並ばないまま盤が埋まったら、先に打った方の勝ちです。",
        "If the board fills without four in a row, the player who played first wins.",
      ],
    ],
    board: ["7×7か9×9です。", "7×7 or 9×9."],
    review: AGENT_READ_2026_10_06,
  },
  wormDrop: {
    tagline: [
      "2つのマスがつながっていて、一方に入った列はもう一方から出てくる。",
      "Two squares are joined, and a line that enters one comes out of the other.",
    ],
    origin: ["ワームホールのある四目並べの、このサイト版です。", "This site's version of four in a row with a wormhole."],
    rules: [
      ["石は列のいちばん下まで落ちます。", "Stones fall to the bottom of their column."],
      [
        "ランダムに選ばれた2つのマスが、ワームホールの出入口です。出入口には何も乗らず、一方に入った列は、もう一方の先のマスから続きます。出入口そのものは数えません。",
        "Two randomly chosen squares are the entrances of a wormhole. Nothing rests on an entrance, and a line that enters one continues from the square beyond the other. The entrances themselves are not counted.",
      ],
      [
        "ワームホールを通っていてもいなくても、4つ並べば勝ちです。",
        "Four in a row wins, whether or not it passes through the wormhole.",
      ],
    ],
    board: ["7×7、9×9、10×10のいずれかです。", "One of 7×7, 9×9 or 10×10."],
    review: AGENT_READ_2026_10_06,
  },
  edgeDrop: {
    tagline: [
      "四辺すべてが重力の向きになる。石は何かに接して置く。",
      "All four sides are directions of gravity. A stone is placed touching something.",
    ],
    origin: ["4つの向きに重力がある四目並べの、このサイト版です。", "This site's version of four in a row with gravity in four directions."],
    rules: [
      [
        "盤のどの端か、すでにある石のすぐ上下左右の位置に石を置けます。宙に浮く石はありません。",
        "You can place a stone on any edge of the board or directly above, below, left or right of a stone already there. No stone floats in the air.",
      ],
      ["4つ並べば勝ちです。", "Four in a row wins."],
      [
        "盤は外側から埋まっていくので、中央が最後に取れる場所になります。",
        "The board fills from the outside in, so the centre is the last place to be taken.",
      ],
    ],
    board: ["7×7か9×9です。", "7×7 or 9×9."],
    review: AGENT_READ_2026_10_06,
  },
} satisfies Partial<Record<RuleVariant, VariantCopyJa>>;
