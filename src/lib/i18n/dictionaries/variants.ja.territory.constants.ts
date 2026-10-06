import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Japanese copy for the Territory and races family (`variants.constants.ts`
 * holds the English). Go's own words are the established ones: 呼吸点 for a
 * liberty, コウ, コミ, 天元 and 星; 陣 for a camp in the racing games.
 */
export const VARIANT_COPY_JA_TERRITORY = {
  go: {
    tagline: [
      "盤の広い範囲を相手の色より多く囲む。石の一団の最後の呼吸点をふさぐと取れる。",
      "Surround more of the board than the other colour. You capture a group of stones by taking its last liberty.",
    ],
    origin: [
      "元の形のまま遊ばれている最古のゲームです。中国で生まれて少なくとも2,500年の歴史があり、世界で最も古い文書の遊戯規則の対象でもあります。7世紀までに日本へ伝わり、世界の多くの国で使われる「Go」という名は、日本語の「囲碁」を縮めたものです。",
      "The oldest game still played in its original form. It comes from China, is at least 2,500 years old, and is the subject of the earliest written rules of any game anywhere. It reached Japan by the 7th century, and the name \"Go\" used in much of the world is a shortening of the Japanese 囲碁.",
    ],
    rules: [
      [
        "交互に、空いている交点へ石を1つずつ置きます。先に打つのは必ず黒で、石は一度置いたら動きません。",
        "Taking turns, you place one stone on an empty intersection. Black always plays first, and stones do not move once placed.",
      ],
      [
        "石が接するのは上下左右の4つの点だけで、斜めは含みません。つながった同じ色の石の一団は呼吸点を共有します。呼吸点とは、その中のどの石かに接する空き点のことで、それが1つもなくなった一団は、すべての石がすぐに取られます。",
        "A stone touches only its four neighbours up, down, left and right, not the diagonals. A connected group of stones of one colour shares its liberties. A liberty is an empty point touching any stone in the group, and a group with none left has all its stones captured at once.",
      ],
      [
        "自分の一団から呼吸点をなくす石は打てません。ただし、その石が相手の一団を取って、呼吸点ができる場合は打てます。取られたばかりの石1つをちょうど取り返す手は、1手のあいだ禁じられます。これがコウの規則で、取りはすぐには元に戻せません。",
        "You cannot play a stone that removes every liberty of your own group, unless that stone captures an enemy group and so creates a liberty. A move that would retake exactly the single stone just captured is forbidden for one move. This is the ko rule, and it means a capture cannot be undone straight away.",
      ],
      [
        "打つ代わりにパスもできます。続けて2回パスが出ると終局です。",
        "Instead of playing, either side may pass. Two passes in a row end the game.",
      ],
      [
        "そのあと地を数えます。盤上に残った石と、1つの色だけに囲まれた空き点は、すべてその色の1点になります。後手の白には、コミ6目半が加わります。合計が多い方が勝ちで、半目があるので引き分けはありません。",
        "Then the territory is counted. Every stone left on the board and every empty point surrounded by one colour alone is one point for that colour. White, who plays second, gets a komi of 6 and a half moku (6.5). The higher total wins, and because of the half moku there is never a draw.",
      ],
    ],
    board: [
      "19×19が本来の碁盤です。13×13と9×9はずっと早く終わり、覚えるときによく使います。星は、置き石を置く昔からの位置を示します。",
      "19×19 is the full board. 13×13 and 9×9 finish much faster and are commonly used when learning. The stars mark the traditional positions for handicap stones.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  hex: {
    tagline: [
      "自分の二辺を途切れなくつなぐ。引き分けはありえない。",
      "Connect your own two sides with an unbroken chain. A draw is impossible.",
    ],
    origin: [
      "2度見つかったゲームです。1942年にコペンハーゲンでピート・ハインが、1948年にプリンストンでジョン・ナッシュが、それぞれ考え出しました。ナッシュは、最善を尽くせば先手が勝つことを証明したといわれますが、その方法は誰にも分かっていません。引き分けにならないことの証明も、同じ考え方によるものです。",
      "A game that was discovered twice: by Piet Hein in Copenhagen in 1942, and by John Nash in Princeton in 1948. Nash is said to have proved that the first player wins with best play, though nobody has found out how. The proof that it cannot end in a draw rests on the same argument.",
    ],
    rules: [
      [
        "盤は三角形の格子に区切られた菱形で、石は線が交わる点に置き、どの点も6つの点に接します。黒は上と下の辺、白は左と右の辺を受け持ちます。",
        "The board is a rhombus divided into a triangular lattice, stones are placed on the points where the lines cross, and every point touches six points. Black has the top and bottom sides, and White the left and right sides.",
      ],
      [
        "交互に、空いている点へ石を1つずつ置きます。石は動かず、取られることもありません。",
        "Taking turns, you place one stone on an empty point. Stones do not move and are never captured.",
      ],
      [
        "自分の石を途切れなくつないで、自分の二辺を先に結んだ方が勝ちです。",
        "Whoever first links their own two sides with an unbroken chain of their stones wins.",
      ],
      [
        "盤が埋まれば必ずどちらか一方だけが勝つので、引き分けはありません。2つの鎖が両方とも届くことも、両方とも届かないこともないからです。",
        "When the board is full exactly one side always wins, so there are no draws. The two chains cannot both get across, and they cannot both fail to.",
      ],
      [
        "黒には先に打つ有利があるので、交換の開局ルールを選べます。白は、黒の最初の手に応じる代わりに、その手を自分のものにできます。",
        "Black has the advantage of playing first, so the swap opening rule can be chosen. White may take Black's first move as their own instead of answering it.",
      ],
    ],
    board: [
      "ふつうは11×11で、世界選手権でもこの大きさを使います。13×13や19×19でも遊ばれます。角は、その角に接する両方の辺のものです。",
      "The usual size is 11×11, which the world championship also uses. 13×13 and 19×19 are also played. A corner belongs to both of the sides that meet at it.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  halma: {
    tagline: [
      "盤を横切る競走。1歩進むか、どの駒でも飛び越えて連続で跳び、先に向かい側の隅を埋める。",
      "A race across the board. Step, or jump over any piece in a chain, and be the first to fill the far corner.",
    ],
    origin: [
      "1883年にボストンで、外科医のGeorge Howard Monksが考案しました。名前は、ギリシャ語の「跳ぶ」に由来します。通信対局のサイトでは、列を作るゲームと並べて置かれ、家族もItsYourTurnで遊びました。",
      "Invented in Boston in 1883 by the surgeon George Howard Monks, and named from the Greek word for a jump. Play-by-mail sites kept it alongside the line games, and the family played it on ItsYourTurn.",
    ],
    rules: [
      [
        "各自の駒は、片方の隅の陣を埋めた状態で始まります。16×16の盤では19個、10×10では13個、8×8では10個です。",
        "Each side's pieces start filling a camp in one corner. There are 19 on the 16×16 board, 13 on 10×10 and 10 on 8×8.",
      ],
      [
        "1手で駒を1つ動かします。どの向きでも隣の空いているマスへ1歩進むか、どちらの色でも隣り合う駒を飛び越えて、その先の空いているマスに着地します。跳んだあとは、飛び越える駒がある限り、同じ手の中で続けて跳べます。",
        "A move moves one piece. It either steps to a neighbouring empty square in any direction, or jumps over an adjacent piece of either colour and lands on the empty square beyond. After a jump it can keep jumping in the same move as long as there is a piece to jump over.",
      ],
      [
        "駒は取られません。飛び越えられた駒は、そのまま残ります。",
        "Pieces are never captured. A piece that is jumped over stays where it is.",
      ],
      [
        "先に向かい側の陣を埋めた方が勝ちです。自陣に残って邪魔をしても、その陣のほかのマスがすべて埋まれば負けです。",
        "Whoever first fills the far camp wins. A side that stays at home to block still loses once every other square of that camp is filled.",
      ],
    ],
    board: [
      "16×16が発売されたときのハルマで、各自19個の駒を持ちます。10×10と8×8は短く遊べる盤で、駒は13個と10個です。リバーシと同じく、マスの中で遊びます。",
      "16×16 is Halma as it was published, with 19 pieces each. 10×10 and 8×8 are boards for a shorter game, with 13 and 10 pieces. As in Reversi, it is played in the squares.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  chineseCheckers: {
    tagline: [
      "自分の真向かいにある星の頂点を、1歩ずつ、または連続の跳びで埋める。",
      "Fill the point of the star directly opposite your own, one step or one chain of jumps at a time.",
    ],
    origin: [
      "1892年にドイツで「Stern-Halma（星のハルマ）」として考案されました。まだ9年しか経っていなかったアメリカのゲーム、ハルマのために作られた六芒星の盤です。1928年にアメリカのおもちゃ会社が、いまの名前「Chinese Checkers」で売り出しましたが、このゲームは中国とはまったく関係がありません。買い手に異国風に聞こえるように選ばれた名前です。",
      "Devised in Germany in 1892 as Stern-Halma (\"star Halma\"), a six-pointed board made for Halma, an American game that was then only nine years old. An American toy company began selling it in 1928 under the name it has now, Chinese Checkers, though the game has no connection to China at all. The name was chosen to sound exotic to buyers.",
    ],
    rules: [
      [
        "各自10個の駒が、星の1つの頂点を埋めた状態で始まります。黒は上、白は下です。",
        "Each side's ten pieces start filling one point of the star. Black is at the top and White at the bottom.",
      ],
      [
        "1手で駒を1つ動かします。隣の空いているマスへ1歩進むか、どちらの色でも隣り合う駒を飛び越えて、そのすぐ先の空いているマスに着地します。跳んだあとは、飛び越える駒がある限り、向きを変えながら同じ手の中で続けて跳べます。",
        "A move moves one piece. It either steps to a neighbouring empty cell, or jumps over an adjacent piece of either colour and lands on the empty cell just beyond. After a jump it can keep jumping in the same move, changing direction, as long as there is a piece to jump over.",
      ],
      [
        "駒は取られません。飛び越えられた駒は、そのまま残ります。",
        "Pieces are never captured. A piece that is jumped over stays exactly where it is.",
      ],
      [
        "自分の真向かいの頂点を先に埋めた方が勝ちです。",
        "Whoever first fills the point directly opposite their own wins.",
      ],
    ],
    board: [
      "標準の121穴の星形の盤で、各自10個の駒を使い、頂点から盤をまっすぐ横切って向かい側の頂点を目指します。盤全体では最大6人で遊べますが、このサイトでは2人用で、いちばん離れた2つの頂点を使います。",
      "The standard star-shaped board with 121 holes, with ten pieces each, going straight across the board from one point to the opposite point. The full board can seat up to six, but this site plays the two-player form, using the two points that are farthest apart.",
    ],
    review: AGENT_READ_2026_10_06,
  },
} satisfies Partial<Record<RuleVariant, VariantCopyJa>>;
