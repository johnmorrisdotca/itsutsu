import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Japanese copy for the Small boards family (`variants.constants.ts` holds the
 * English). 三目並べ is the established name for tic-tac-toe; 作り手 and 壊し手
 * are the game's own roles, as its `kanji` field names them.
 */
export const VARIANT_COPY_JA_SMALL_BOARDS = {
  tictactoe: {
    tagline: ["3×3の盤で3つ並べる。", "Make three in a row on a 3×3 board."],
    origin: ["誰もが知っているゲームです。", "The game everybody knows."],
    rules: [
      ["交互に石を1つずつ置きます。", "Taking turns, you place one stone each."],
      [
        "縦・横・斜めのどの向きでも、3つ並べば勝ちです。",
        "Three in a row in any direction (vertical, horizontal or diagonal) wins.",
      ],
      [
        "正しく打てば必ず引き分けになります。それがこのゲームの教えのすべてです。",
        "With correct play it is always a draw. That is the whole lesson of this game.",
      ],
    ],
    board: ["3×3です。", "3×3."],
    review: AGENT_READ_2026_10_06,
  },
  wildTicTacToe: {
    tagline: [
      "どちらの色でも置ける。どちらの色でも3つ並べた人の勝ち。",
      "You can place either colour. Whoever makes three in a row of either colour wins.",
    ],
    origin: ["三目並べの、昔からある自由な形です。", "The traditional free form of tic-tac-toe."],
    rules: [
      [
        "毎手、黒でも白でも好きな色の石を1つ置きます。",
        "Each move you place one stone of either black or white, whichever you like.",
      ],
      [
        "どちらの色でも、3つ並びを完成させた方が勝ちです。",
        "Whoever completes three in a row, of either colour, wins.",
      ],
      ["3つ並ばないまま盤が埋まれば引き分けです。", "If the board fills with no three in a row, it is a draw."],
    ],
    board: ["3×3です。", "3×3."],
    review: AGENT_READ_2026_10_06,
  },
  notakto: {
    tagline: ["黒い石だけ。3つ並べた方が負け。", "Black stones only. Whoever makes three in a row loses."],
    origin: [
      "どちらも同じ印を置き、3つ並べたら負けになる、三目並べの昔ながらの形で、盤は1つです。",
      "The traditional form of tic-tac-toe in which both sides place the same mark and making three in a row loses, on a single board.",
    ],
    rules: [
      ["どちらが置く石も、すべて黒です。", "Every stone is black, whoever places it."],
      ["3つ並びを完成させた方が負けです。", "Whoever completes three in a row loses."],
      [
        "本来のゲームは複数の盤を同時に使いますが、ここでは盤1つの形です。",
        "The full game is played on several boards at once, but this is the single-board form.",
      ],
    ],
    board: ["3×3です。", "3×3."],
    review: AGENT_READ_2026_10_06,
  },
  trapThree: {
    tagline: ["4つ並べば勝ち。3つ並べたら負け。", "Four in a row wins. Three in a row loses."],
    origin: [
      "4つで勝ち、3つで負けになるゲームの、正方形の盤で遊ぶこのサイト版です。",
      "This site's version of the game where four wins and three loses, played on a square board.",
    ],
    rules: [
      [
        "交互に石を1つずつ置きます。先に打つのは黒でも白でもかまいません。",
        "Taking turns, you place one stone each. Either black or white may play first.",
      ],
      [
        "縦・横・斜めのどの向きでも、4つ並べば勝ちです。",
        "Four in a row in any direction (vertical, horizontal or diagonal) wins.",
      ],
      [
        "自分の石をちょうど3つ並べると、その場で負けです。ただし、同じ石で4つ並ぶ場合は別です。",
        "Making exactly three of your own stones in a row loses on the spot. The exception is when the same stone makes four.",
      ],
      [
        "盤が小さいので、石を置くたびに、次に安全に打てる点が狭まります。",
        "The board is small, so every stone you place narrows the points you can safely play next.",
      ],
    ],
    board: ["5×5です。", "5×5."],
    review: AGENT_READ_2026_10_06,
  },
  squareFour: {
    tagline: [
      "駒は各自4つ。一列に並べるか、正方形を作る。",
      "Four pieces each. Line them up, or make a square.",
    ],
    origin: [
      "置いてから動かすゲームのこのサイト版で、正方形を作ることが2つ目の勝ち方です。",
      "This site's version of the game where you place and then move, with making a square as a second way to win.",
    ],
    rules: [
      [
        "各自4つの駒を持ちます。まず1手に1つずつ置き、そのあとは、1手で自分の駒を1つ、隣の空いている点へ、どの向きにでも1歩動かします。",
        "Each player has four pieces. First you place them one per move, and after that a move moves one of your pieces one step to an adjacent empty point, in any direction.",
      ],
      [
        "どの向きでも、4つ並べば勝ちです。自分の駒4つで2×2の正方形を作っても勝ちです。",
        "Four in a row in any direction wins. Making a 2×2 square with four of your pieces also wins.",
      ],
      [
        "どちらの勝ち方も、駒を置いている最中にも成り立ちます。",
        "Both ways of winning also apply while the pieces are still being placed.",
      ],
      [
        "動かす駒を選び、次に行き先の点を選びます。",
        "Choose the piece to move, then the point it goes to.",
      ],
    ],
    board: ["5×5です。", "5×5."],
    review: AGENT_READ_2026_10_06,
  },
  makerBreaker: {
    tagline: [
      "どちらも好きな色の石を置く。一方は5つ並べたく、もう一方は並べさせたくない。",
      "Both place stones of whichever colour they like. One wants to make five in a row and the other wants to prevent it.",
    ],
    origin: [
      "1981年に発売された、秩序と混沌を競う古典的なゲームの、このサイトでの呼び名です。数学では、メーカー・ブレーカーゲームと呼ばれます。",
      "This site's name for the classic game of order against chaos, published in 1981. In mathematics it is called a maker-breaker game.",
    ],
    rules: [
      [
        "先手は作り手で、どちらの色でも、どこでも5つ並べたい側です。後手は壊し手で、五ができないまま盤が埋まることを望む側です。",
        "The first player is the Maker, who wants five in a row of either colour, anywhere. The second player is the Breaker, who wants the board to fill with no five.",
      ],
      ["毎手、好きな色の石を1つ置きます。", "Each move you place one stone of whichever colour you like."],
      [
        "どちらの色でも、五が完成すれば、最後の石を誰が置いたかにかかわらず、作り手の勝ちです。",
        "If a five of either colour is completed, the Maker wins, whoever placed the last stone of it.",
      ],
      [
        "五ができないまま盤が埋まれば、壊し手の勝ちです。",
        "If the board fills with no five, the Breaker wins.",
      ],
    ],
    board: ["6×6です。", "6×6."],
    review: AGENT_READ_2026_10_06,
  },
} satisfies Partial<Record<RuleVariant, VariantCopyJa>>;
