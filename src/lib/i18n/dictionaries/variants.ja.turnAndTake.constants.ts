import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Japanese copy for the Turn and take family: the flipping games and the two
 * capture games (`variants.constants.ts` holds the English). リバーシ, not the
 * trademark オセロ, as `docs/plans/en-ja-everywhere/TERMS.md` settled; 角 for
 * a corner, as Othello and Reversi players say it.
 */
export const VARIANT_COPY_JA_TURN_AND_TAKE = {
  reversi: {
    tagline: [
      "相手の色の石の並びを挟むと、ひっくり返る。最後に石が多い方の勝ち。",
      "Bracket a run of the opponent's stones and they turn over. Whoever has more discs at the end wins.",
    ],
    origin: [
      "いま世界で遊ばれている形のリバーシです。中央の石があらかじめ決まっていて、打てなければパスし、最後に石を数えます。規則が日本で定められたのは1973年です。",
      "Reversi in the form played around the world today. The centre discs are fixed in advance, a side that cannot play passes, and the discs are counted at the end. The rules were set down in Japan in 1973.",
    ],
    rules: [
      [
        "中央には、黒と白の石が2つずつ、対角線上に置かれて始まります。",
        "The game starts with two black and two white discs in the centre, placed on the diagonals.",
      ],
      [
        "石を置けるのは、相手の色の石を1つ以上まっすぐに挟める場所だけです。その先の端には自分の石が必要です。挟まれた石はすべてひっくり返ります。",
        "You can place a disc only where it brackets one or more discs of the other colour in a straight run, with one of your own at the far end. Every bracketed disc turns over.",
      ],
      [
        "打てる場所がない色はパスをして、もう一方の色が続けて打ちます。両方とも打てなくなるまでこれを繰り返します。",
        "A colour with nowhere to play passes, and the other colour plays again. This repeats until both are unable to play.",
      ],
      [
        "どちらも打てなくなったら、石の数を数えます。多い方が勝ちで、同数なら引き分けです。",
        "When neither can play, the discs are counted. The side with more wins, and equal numbers are a draw.",
      ],
    ],
    board: [
      "8×8です。角は一度取るとひっくり返されないので、戦略のほとんどは角の取り合いです。",
      "8×8. A corner cannot be turned over once taken, so most of the strategy is the contest for the corners.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  classicReversi: {
    tagline: [
      "1880年代の規則。最初の4つの石を、対局者が自分で置く。このサイトのひっくり返すゲームは、どれもどちらの始め方でも設定できる。",
      "The rules of the 1880s: the players place the first four discs themselves. Any game of turning discs on this site can be set up either way.",
    ],
    origin: [
      "開始の形が固定される前の、イギリスの室内遊戯としてのリバーシです。中央の4つは対局者が交互に置いたので、2通りの始まりがありえました。",
      "Reversi as an English parlour game before the starting position was fixed. The four centre discs were placed by the players in turn, so there were two possible starts.",
    ],
    rules: [
      [
        "盤は空の状態で始まります。最初の4つの石は、中央の4マスに1手に1つずつ置き、何もひっくり返しません。",
        "The board starts empty. The first four discs are placed on the four centre squares, one per move, and nothing is turned over.",
      ],
      [
        "5つ目の石からは、相手の色の石の並びを挟める場所にだけ置け、挟んだ石はひっくり返ります。",
        "From the fifth disc on, a disc can be placed only where it brackets a run of the other colour, and the bracketed discs turn over.",
      ],
      ["打てる場所がない色はパスをします。", "A colour with nowhere to play passes."],
      [
        "どちらも打てなくなったら、石の数を数えます。多い方が勝ちで、同数なら引き分けです。",
        "When neither can play, the discs are counted. The side with more wins, and equal numbers are a draw.",
      ],
    ],
    board: [
      "8×8です。中央を自分で置くと、固定された規則では除かれている平行開局も打てます。",
      "8×8. If you place the centre yourself, you can also play the parallel opening that the fixed rule rules out.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  antiReversi: {
    tagline: [
      "ひっくり返し方はいつもどおりで、石が少ない方が勝ち。",
      "Discs turn over as usual, but the side with fewer discs wins.",
    ],
    origin: [
      "負け競争の形です。規則はすべて同じで、目的だけが逆さまなので、角はいちばん取りたくないものになります。",
      "The version where you try to lose. All the rules are the same and only the goal is upside down, so a corner becomes the last thing you want.",
    ],
    rules: [
      [
        "中央には、黒と白の石が2つずつ、対角線上に置かれて始まります。",
        "The game starts with two black and two white discs in the centre, placed on the diagonals.",
      ],
      [
        "相手の色の石の並びを挟める場所にだけ石を置け、挟んだ石はひっくり返ります。打てる手があるのに見送ることはできません。",
        "A disc can be placed only where it brackets a run of the other colour, and the bracketed discs turn over. You cannot skip a move that is available.",
      ],
      ["打てる場所がない色はパスをします。", "A colour with nowhere to play passes."],
      [
        "どちらも打てなくなったら、石の数を数えます。少ない方が勝ちで、同数なら引き分けです。",
        "When neither can play, the discs are counted. The side with fewer wins, and equal numbers are a draw.",
      ],
    ],
    board: [
      "8×8です。相手に石を渡していくことがこのゲームのすべてで、角は足かせになります。",
      "8×8. Giving discs to the opponent is the whole of this game, and a corner is a burden.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  miniReversi: {
    tagline: [
      "4×4か6×6の盤でひっくり返すゲーム。途中で8×8に広げることもできる。",
      "The game of turning discs on a 4×4 or 6×6 board, which can also be enlarged to 8×8 partway through.",
    ],
    origin: [
      "ゲームを教えたり研究したりするときに使う小さな盤です。6×6は解析済みで後手の勝ちですが、本物の盤を打つ助けにはまったくなりません。",
      "The small boards used for teaching and studying the game. 6×6 has been solved and is a win for the second player, but that is no help at all in playing on a real board.",
    ],
    rules: [
      [
        "中央には、黒と白の石が2つずつ、対角線上に置かれて始まります。",
        "The game starts with two black and two white discs in the centre, placed on the diagonals.",
      ],
      [
        "相手の色の石の並びを挟める場所にだけ石を置け、挟んだ石はひっくり返ります。",
        "A disc can be placed only where it brackets a run of the other colour, and the bracketed discs turn over.",
      ],
      ["打てる場所がない色はパスをします。", "A colour with nowhere to play passes."],
      [
        "どちらも打てなくなったら、石の数を数えます。多い方が勝ちで、同数なら引き分けです。",
        "When neither can play, the discs are counted. The side with more wins, and equal numbers are a draw.",
      ],
      [
        "盤が狭いと感じたら、両者の合意で広げられます。局面は次の大きさの盤の中央に移り、対局は続きます。",
        "If the board feels small, both players can agree to enlarge it. The position moves to the centre of the next larger board and the game continues.",
      ],
    ],
    board: [
      "4×4、6×6、8×8のいずれかで、小さい盤は広げられます。",
      "One of 4×4, 6×6 or 8×8, and the smaller boards can be enlarged.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  grandReversi: {
    tagline: [
      "10×10の盤でひっくり返すゲーム。長い勝負になり、端に届くまでの中盤を争う場所が広い。",
      "The game of turning discs on a 10×10 board. It makes a long game, with plenty of middle to fight over before anyone reaches an edge.",
    ],
    origin: [
      "通信対局のサイトが、ふつうの盤と並べて置いていた大きな盤です。ItsYourTurnではFlipversi 10×10と呼ばれていました。規則は同じで、マスが36多く、角はすべてから遠くなります。",
      "The big board that play-by-mail sites kept alongside the usual one. ItsYourTurn called it Flipversi 10×10. The rules are the same, with 36 more squares and the corners farther from everything.",
    ],
    rules: [
      [
        "小さい盤と同じく、中央には黒と白の石が2つずつ、対角線上に置かれて始まります。",
        "As on the small board, the game starts with two black and two white discs in the centre, placed on the diagonals.",
      ],
      [
        "石を置けるのは、相手の色の石を1つ以上まっすぐに挟める場所だけです。その先の端には自分の石が必要です。挟まれた石はすべてひっくり返ります。",
        "You can place a disc only where it brackets one or more discs of the other colour in a straight run, with one of your own at the far end. Every bracketed disc turns over.",
      ],
      [
        "打てる場所がない色はパスをして、もう一方の色が続けて打ちます。両方とも打てなくなるまでこれを繰り返します。",
        "A colour with nowhere to play passes, and the other colour plays again. This repeats until both are unable to play.",
      ],
      [
        "どちらも打てなくなったら、石の数を数えます。多い方が勝ちで、同数なら引き分けです。",
        "When neither can play, the discs are counted. The side with more wins, and equal numbers are a draw.",
      ],
    ],
    board: [
      "10×10のみです。置く石は60個ではなく96個で、端は中央から2マス遠いので、どちらかが端に触れるまで序盤が長く続きます。",
      "10×10 only. 96 discs go on the board instead of 60, and the edges are two squares farther from the centre, so the opening lasts a long time before either side touches an edge.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  honeycomb: {
    tagline: [
      "六角形に並んだ六角形のマスで遊ぶリバーシ。挟む向きは6通り、ひっくり返らない角が6つ。",
      "Reversi on hexagonal cells arranged in a hexagon. There are six directions to bracket in, and six corners that never turn over.",
    ],
    origin: [
      "通信対局のサイトがHexversiの名前で行ったように、ひっくり返すゲームを六角形の格子に移したものです。どのマスも8つではなく6つのマスに接し、中央はふさがれていて、その周りの6つの石から始まります。灰色の格子ではなく蜂の巣として描いた、このサイト独自の盤です。",
      "The game of turning discs, moved onto a hexagonal lattice as play-by-mail sites did under the name Hexversi. Every cell touches six cells instead of eight, the centre is sealed, and the game starts from the six discs around it. It is this site's own board, drawn as a honeycomb rather than a grey grid.",
    ],
    rules: [
      [
        "中央のマスはふさがれています。その周りの6マスには、最初に黒と白の石が3つずつ、輪になって交互に置かれています。",
        "The centre cell is sealed. The six cells around it start with three discs of each colour, placed alternately in a ring.",
      ],
      [
        "石を置けるのは、格子の6方向のどれかで、相手の色の石を1つ以上まっすぐに挟める場所だけです。その先の端には自分の石が必要です。挟まれた石はすべてひっくり返ります。",
        "You can place a disc only where it brackets one or more discs of the other colour in a straight run along one of the six lattice directions, with one of your own at the far end. Every bracketed disc turns over.",
      ],
      [
        "打てる場所がない色はパスをして、もう一方の色が続けて打ちます。両方とも打てなくなるまでこれを繰り返します。",
        "A colour with nowhere to play passes, and the other colour plays again. This repeats until both are unable to play.",
      ],
      [
        "どちらも打てなくなったら、石の数を数えます。多い方が勝ちで、同数なら引き分けです。",
        "When neither can play, the discs are counted. The side with more wins, and equal numbers are a draw.",
      ],
    ],
    board: [
      "六角形の盤が4種類あり、どれも中央はふさがれています。一辺6マスの91マスはHexversiで使う盤、一辺4マスの37マスは短い勝負用、一辺5マスは61マス、一辺7マスは127マスで、91マスの盤より5割ほど長くかかります。6つの角は一度取るとひっくり返されず、正方形の盤と同じく、戦略のほとんどはそこにあります。",
      "There are four hexagonal boards, all with the centre sealed. 91 cells with six on a side is the board Hexversi is played on, 37 cells with four on a side is for a quick game, five on a side is 61 cells, and seven on a side is 127 cells, which takes about half as long again as the 91-cell board. The six corners cannot be turned over once taken, and as on the square board, most of the strategy lies there.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  ninuki: {
    tagline: ["5つ並べば勝ち。5組取っても勝ち。", "Five in a row wins. Capturing five pairs also wins."],
    origin: [
      "日本の取りのある五目並べで、西洋で箱入りで売られている取り合いのゲームの祖先です。",
      "The Japanese gomoku with captures, and the ancestor of the boxed capture games sold in the West.",
    ],
    rules: [
      ["交互に石を1つずつ置きます。", "Taking turns, you place one stone each."],
      [
        "相手の石がちょうど2つ一列に並んでいて、その両端を自分の石で挟むと、そのペアを取って盤から取り除けます。取れるのは挟みを完成させた石だけで、挟まれた場所へ自分から打ち込んでも取られません。",
        "If exactly two enemy stones are in a line and you flank both ends with your own stones, you capture the pair and remove it from the board. Only the stone that completes the flank captures, and playing into a flanked position yourself is safe.",
      ],
      [
        "5つ以上並べば勝ちです。5組取っても勝ちです。",
        "Five or more in a row wins. Capturing five pairs also wins.",
      ],
      [
        "取られた点は再び空くので、崩れた列を作り直せます。また、五が完成する前に、その列の石を取って防ぐこともできます。",
        "Captured points become empty again, so a broken line can be rebuilt. A five can also be prevented by capturing a stone from that line before it is completed.",
      ],
    ],
    board: [
      "昔から19×19の碁盤で遊びます。大会の形にするには、開局ルールの五路制限と組み合わせます。",
      "It is traditionally played on a 19×19 go board. For the tournament form, combine it with the 五路制限 (Pro) opening rule.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  sannuki: {
    tagline: [
      "挟んで2つか3つ取れる取りのある五目並べ。15個取れば勝ち。",
      "Gomoku with captures where a flank takes two or three stones. Capturing fifteen stones wins.",
    ],
    origin: [
      "取りのある五目並べのうち、3つまで取れる形のこのサイトでの呼び名で、西洋では1980年代から大会用の変種として遊ばれています。",
      "This site's name for the form of capture gomoku where up to three stones can be taken, which has been played in the West as a tournament variant since the 1980s.",
    ],
    rules: [
      ["交互に石を1つずつ置きます。", "Taking turns, you place one stone each."],
      [
        "相手の石がちょうど2つ、またはちょうど3つ一列に並んでいて、その両端を自分の石で挟むと、その石を取れます。取れるのは挟みを完成させた石だけです。",
        "If exactly two or exactly three enemy stones are in a line and you flank both ends with your own stones, you capture them. Only the stone that completes the flank captures.",
      ],
      [
        "5つ以上並べば勝ちです。15個取っても勝ちです。",
        "Five or more in a row wins. Capturing fifteen stones also wins.",
      ],
      [
        "四は、その中の石を取って崩すことができ、取られた点は再び空きます。",
        "A four can be broken by capturing a stone from it, and a captured point becomes empty again.",
      ],
    ],
    board: ["昔から19×19です。短く遊ぶなら15×15です。", "Traditionally 19×19. Use 15×15 for a shorter game."],
    review: AGENT_READ_2026_10_06,
  },
} satisfies Partial<Record<RuleVariant, VariantCopyJa>>;
