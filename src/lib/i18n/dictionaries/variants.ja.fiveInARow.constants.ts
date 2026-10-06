import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Japanese copy for the Five in a row family (`variants.constants.ts` holds the
 * English). Terms follow `docs/plans/en-ja-everywhere/TERMS.md`: 石, 盤, 交点,
 * 手, 投了 and the renju words 長連, 三三, 四四, 活三; a game's own name is the
 * `kanji` field on the English row, not repeated here.
 */
export const VARIANT_COPY_JA_FIVE_IN_A_ROW = {
  freestyle: {
    tagline: ["5つ以上並べれば勝ち。", "Line up five or more and you win."],
    origin: [
      "制限をいっさい設けない、どこでも遊ばれている基本の五目並べです。ほかのゲームは、この規則を少し厳しくしたものです。",
      "The basic gomoku played everywhere, with no restrictions at all. The other games are this one with its rules made a little stricter.",
    ],
    rules: [
      ["交互に、空いている交点へ石を1つずつ置きます。", "Taking turns, you place one stone on an empty intersection."],
      [
        "縦・横・斜めのどの向きでも、自分の石を先に5つ以上並べた方が勝ちです。",
        "Whoever first lines up five or more of their own stones, in any direction (vertical, horizontal or diagonal), wins.",
      ],
      ["6つ以上並ぶ長連も勝ちです。", "An overline (長連) of six or more is also a win."],
      [
        "先に打つのは黒でも白でもよく、最初の石の色をくじで決めることもできます。",
        "Either black or white may play first, and the colour of the first stone can also be decided by lot.",
      ],
    ],
    board: [
      "盤の大きさは自由です。15×15では、最善を尽くせば黒に必勝法があると証明されています。強い人どうしは先手を譲るか、開局ルールを選んで遊びます。",
      "Any board size. On 15×15 it has been proven that black has a forced win with best play. Strong players give up the first move or choose an opening rule.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  standard: {
    tagline: ["ちょうど5つで勝ち。6つ以上は勝ちにならない。", "Exactly five wins. Six or more does not win."],
    origin: [
      "Gomocupなどの大会で遊ばれる、五目並べの競技形式です。基本の五目並べから、長連を勝ちとする扱いをなくしたものです。",
      "The competitive form of gomoku played at tournaments such as Gomocup. It is the basic gomoku with the treatment of an overline (長連) as a win removed.",
    ],
    rules: [
      ["交互に石を1つずつ置きます。", "Taking turns, you place one stone each."],
      [
        "ちょうど5つ並べば勝ちです。6つ以上並ぶ長連は勝ちにならず、そのまま対局が続きます。",
        "Exactly five in a row wins. An overline (長連) of six or more is not a win, and the game simply goes on.",
      ],
      ["先に打つのは必ず黒です。", "The one who plays first is always Black."],
      [
        "ほかに禁じ手はありません。三三も四四も、どちらの側も打てます。",
        "Nothing else is forbidden. Both 三三 (double three) and 四四 (double four) can be played by either side.",
      ],
    ],
    board: ["大会では15×15の盤を使います。", "Tournaments use a 15×15 board."],
    review: AGENT_READ_2026_10_06,
  },
  renju: {
    tagline: ["黒は三三、四四、長連を打てない。白は打てる。", "Black cannot play 三三, 四四 or 長連. White can."],
    origin: [
      "日本の競技である連珠を、国際連珠連盟（RIF）が成文化した規則です。",
      "The rules of the Japanese competitive game renju, as codified by the Renju International Federation (RIF).",
    ],
    rules: [
      [
        "黒が先に打ちます。黒はちょうど5つ並べて勝ち、白は5つ以上並べて勝ちです。",
        "Black plays first. Black wins with exactly five in a row, and White wins with five or more.",
      ],
      [
        "黒は、活三を同時に2つ作る手（三三）、四を同時に2つ作る手（四四）、6つ以上並べる手（長連）を打てません。その点は盤上に印がつき、打てません。",
        "Black cannot play a move that makes two open threes at once (三三), two fours at once (四四), or six or more in a row (長連). Those points are marked on the board and cannot be played.",
      ],
      [
        "禁じ手の形と同時に五ができた場合は、黒の勝ちです。",
        "If a five is made at the same time as a forbidden shape, Black wins.",
      ],
      [
        "三が成り立つのは、それを活四にする点そのものが打てる場合だけです。盤はそこまで先を読んで判定するので、印は正確です。",
        "A three counts only if the point that would turn it into an open four can itself be played. The board reads ahead that far to judge, so the marks are exact.",
      ],
      ["白には一切の制限がありません。", "White has no restrictions at all."],
    ],
    board: [
      "15×15です。色の交換がつく古典的な開局で遊ぶには、開局ルールで「国際ルール」（RIF）を選びます。",
      "15×15. To play the classic opening with a colour swap, choose 国際ルール (RIF) as the opening rule.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  omok: {
    tagline: ["三三はどちらの側も禁止。長連は勝ち。", "Double three is forbidden for both sides. An overline wins."],
    origin: [
      "韓国の五目並べで、15×15か19×19の盤で遊びます。",
      "The Korean form of gomoku, played on a 15×15 or 19×19 board.",
    ],
    rules: [
      ["交互に石を1つずつ置き、黒が先に打ちます。", "Taking turns, you place one stone each, and Black plays first."],
      [
        "どちらの側も、1つの石で活三を2つ作ることはできません（삼삼）。その点は印がつき、打てません。",
        "Neither side may make two open threes with one stone (삼삼). Those points are marked and cannot be played.",
      ],
      [
        "5つ以上並べれば、どちらの側も勝ちです。つまり長連も勝ちになります。",
        "Five or more in a row wins for either side. In other words, an overline also wins.",
      ],
      ["四四は打てます。", "Double fours can be played."],
    ],
    board: ["15×15か19×19です。", "15×15 or 19×19."],
    review: AGENT_READ_2026_10_06,
  },
  caro: {
    tagline: [
      "ちょうど5つで勝ち。ただし、両端をふさがれていないこと。",
      "Exactly five wins, provided it is not shut in at both ends.",
    ],
    origin: [
      "ベトナムの五目並べで、昔から方眼紙の上で遊ばれてきました。",
      "The Vietnamese form of gomoku, traditionally played on squared paper.",
    ],
    rules: [
      ["交互に石を1つずつ置き、黒が先に打ちます。", "Taking turns, you place one stone each, and Black plays first."],
      [
        "ちょうど5つ並べば勝ちです。長連は勝ちになりません。",
        "Exactly five in a row wins. An overline does not win.",
      ],
      [
        "両端が相手の石でふさがれた5つは勝ちになりません（chặn hai đầu）。盤の端はふさがれたことになりません。",
        "A five with an opponent's stone at both ends does not win (chặn hai đầu). The edge of the board does not count as blocked.",
      ],
      ["どちらの側にも禁じ手はありません。", "Neither side has any forbidden moves."],
    ],
    board: [
      "盤の大きさは自由です。盤が大きいほど、ふさぐ余地が広がります。",
      "Any board size. The bigger the board, the more room there is to block.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  connect6: {
    tagline: ["1手に2つ打つ。6つ並べれば勝ち。", "Two stones per move. Six in a row wins."],
    origin: [
      "2003年にI-Chen Wuが考案したゲームで、コンピュータ・オリンピアードでも遊ばれています。",
      "A game devised by I-Chen Wu in 2003, also played at the Computer Olympiad.",
    ],
    rules: [
      [
        "黒は最初の1手だけ石を1つ置きます。そのあとは、各自1手に石を2つずつ置きます。",
        "Black places one stone on the first move only. After that each side places two stones per move.",
      ],
      ["6つ以上並べば勝ちです。", "Six or more in a row wins."],
      [
        "禁じ手も交換もありません。1手に2つ置くことで、先手の有利が釣り合います。",
        "There are no forbidden moves and no swap. Placing two stones per move balances the first player's advantage.",
      ],
      [
        "両端が開いた四は、もう止められません。そのため五目並べより早く、脅しが現れます。",
        "A four open at both ends can no longer be stopped. So threats appear faster than in gomoku.",
      ],
    ],
    board: [
      "標準は19×19の盤です。15×15なら短く遊べます。",
      "The standard is a 19×19 board. A 15×15 board gives a shorter game.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  misereFive: {
    tagline: ["5つ並べたら負け。相手に並べさせる。", "Making five in a row loses. Make your opponent do it."],
    origin: [
      "並べたら負けになる、昔ながらの五目並べです。",
      "The traditional form of gomoku in which making the line loses.",
    ],
    rules: [
      [
        "交互に石を1つずつ置きます。先に打つのは黒でも白でもかまいません。",
        "Taking turns, you place one stone each. Either black or white may play first.",
      ],
      ["5つ以上並べた方が負けです。", "Whoever makes five or more in a row loses."],
      [
        "5つ並ばないまま盤が埋まったら、先に打った方の勝ちです。",
        "If the board fills without any five, the player who played first wins.",
      ],
      [
        "石を置くたびに、あとで安全に打てる点が1つ減ります。そうした点を数えるのがこのゲームです。",
        "Every time you place a stone, one fewer point is safe to play later. Counting those points is what this game is about.",
      ],
    ],
    board: [
      "9×9は鋭い勝負に、15×15は長くじわじわと追い込む勝負になります。",
      "9×9 makes a sharp game, and 15×15 makes a long game of slowly squeezing the opponent.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  hexFive: {
    tagline: [
      "六角形に並んだ六角形のマスで5つ並べる。どのマスにも6つの隣があり、並べる向きは3通り。",
      "Make five in a row on hexagonal cells arranged in a hexagon. Every cell has six neighbours, and there are three directions to line up in.",
    ],
    origin: [
      "このサイトのオリジナルのゲームです。五目並べを蜂の巣の格子の上に移したもので、盤はHexversiで石をひっくり返す盤と同じです。ここでは列を作るゲームとして読み、中央は開いていて、石を数えることはありません。",
      "A game original to this site. It moves gomoku onto a honeycomb lattice, and the board is the same one Hexversi turns discs on. Here it is read as a line game, the centre is open, and there are no discs to count.",
    ],
    rules: [
      [
        "盤は六角形のマスを六角形に並べたもので、石は線が交わる点に置き、どの点もHexの盤と同じように6つの点に接します。中央はふさがれていないので、最初の石を置けます。",
        "The board is hexagonal cells arranged in a hexagon, stones are placed on the points where the lines cross, and every point touches six points, just as on the board of Hex. The centre is not sealed, so the first stone can be placed there.",
      ],
      ["交互に、空いている点へ石を1つずつ置きます。", "Taking turns, you place one stone on an empty point."],
      [
        "列として数えるのは、隣り合う6方向のうち、格子の軸である3方向だけです。正方形の盤なら斜めとして読む残りの2方向は、ここでは列になりません。",
        "Only three of the six neighbouring directions, the axes of the lattice, count as lines. The other two directions that a square board would read as diagonals are not lines here.",
      ],
      [
        "同じ色の石が、この3つの軸のどれかに沿って途切れなく5つ以上並べば勝ちです。",
        "Five or more stones of the same colour in an unbroken line along any of these three axes wins.",
      ],
      [
        "黒には先に打つ有利があるので、交換の開局ルールを選べます。白は、黒の最初の手に応じる代わりに、その手を自分のものにできます。",
        "Black has the advantage of playing first, so the swap opening rule can be chosen. White may take Black's first move as their own instead of answering it.",
      ],
    ],
    board: [
      "4種類の六角形の盤があり、蜂の巣と同じ4つです。一辺4マスで37マス、5マスで61マス、6マスで91マス、7マスで127マスです。初期設定は91マスで、蜂の巣が最初に開く盤と同じです。",
      "There are four hexagonal boards, the same four that 蜂の巣 (Honeycomb) is played on: 37 cells with four on a side, 61 with five, 91 with six and 127 with seven. The default is 91 cells, the same board that 蜂の巣 opens on.",
    ],
    review: AGENT_READ_2026_10_06,
  },
} satisfies Partial<Record<RuleVariant, VariantCopyJa>>;
