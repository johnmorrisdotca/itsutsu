import { AGENT_READ_2026_10_06, type CopyReview } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/** Breakthrough, Lines of Action and Amazons were written on 2026-10-30 and read by the reviewer agent the same day. */
const AGENT_READ_2026_10_30: CopyReview = { by: "agent", on: "2026-10-30" };

/**
 * Japanese copy for the Territory and races family (`variants.constants.ts`
 * holds the English). Go's own words are the established ones: 呼吸点 for a
 * liberty, コウ, コミ, 天元 and 星; 陣 for a camp in the racing games.
 */
export const VARIANT_COPY_JA_TERRITORY = {
  breakthrough: {
    tagline: ["それぞれ2段の駒。前へ進み、斜め前の駒を取り、先に向こうの端へ着く。", "Two rows of pieces each. Go forward, take diagonally ahead, and reach the far edge first."],
    origin: ["ダン・トロイカが2000年に作り、翌年の8×8ゲーム設計コンテストで優勝したゲームです。チェス盤を使いますが、チェスの要素はなく、駒は1種類、動かし方の決まりも1つです。", "A game Dan Troyka made in 2000, which won the 8×8 game design contest the next year. It uses a chess board but has nothing of chess; there is one kind of piece and one rule for moving it."],
    rules: [
      ["各自2段の駒を持ちます。黒が先に動かし、盤の上のほうへ進めます。", "Each player has two rows of pieces. Black moves first, and advances toward the top of the board."],
      ["駒は1マス前へ、まっすぐか斜めに、空いているマスへ進みます。", "A piece goes one square forward, straight or diagonally, to an empty square."],
      ["取れるのは斜め前だけです。斜め前の相手の駒の上に進むと取れます。まっすぐ前にある駒には進めません。", "Only diagonally ahead can be taken. Going onto an opponent's piece diagonally ahead takes it. You cannot go onto a piece straight ahead."],
      ["最初に向こうの端へ着いた駒の勝ちです。相手の最後の駒を取っても勝ちです。駒は前にしか進まないので、引き分けはありません。", "The first piece to reach the far edge wins. Taking the opponent's last piece also wins. Pieces only go forward, so there are no draws."],
    ],
    board: ["8×8です。一番手前の段の駒はできるだけ残します。そこを出た駒は守りに戻れません。", "8×8. Keep the pieces on your nearest row as long as you can. A piece that has left that row cannot come back to guard."],
    review: AGENT_READ_2026_10_30,
  },
  linesOfAction: {
    tagline: ["駒は、その線上の駒の数だけ動く。自分の駒をすべてつなげると勝ち。", "A piece moves as many as the pieces on its line. Joining all your pieces wins."],
    origin: ["Claude Soucieが考案し、1969年にシド・サクソンの本『A Gamut of Games』で紹介されました。以来、対局プログラムにも好まれてきました。駒がどれだけ動くかを決める決まりは、何かが動いたり取られたりするたびに変わります。", "Devised by Claude Soucie and presented in Sid Sackson's book A Gamut of Games in 1969. Since then it has been liked by game-playing programs too. The rule deciding how far a piece moves changes whenever anything moves or is taken."],
    rules: [
      ["各自12個の駒を、向かい合う2辺に持ちます。黒が先に動かします。", "Each player has twelve pieces on two facing edges. Black moves first."],
      ["駒は行、列、斜めのいずれかに沿って、その線上にある両者の駒の数とちょうど同じマス数だけ動きます。", "A piece moves along a row, column or diagonal exactly as many squares as there are pieces of both sides on that line."],
      ["自分の駒は飛び越えられますが、相手の駒は飛び越えられません。相手の駒の上に止まると取れます。", "You can jump your own pieces but not the opponent's. Stopping on an opponent's piece takes it."],
      ["自分の駒をすべて、辺か角で触れ合う1つのかたまりにすると勝ちです。1手で両者ともつながったときは、動かした側の勝ちです。", "Making all your pieces one group touching at sides or corners wins. When one move joins both, the side that moved wins."],
      ["何も取らないままそれぞれ100手が過ぎると引き分けです。これはこのサイト独自の回数で、公表されたルールではありません。", "If a hundred moves each pass with nothing taken it is a draw. This is this site's own count, not the published rule."],
    ],
    board: ["8×8です。取るときは慎重に。相手の駒が減るほど、相手がつなぐ駒も少なくて済みます。", "8×8. Take carefully. The fewer the opponent's pieces, the fewer pieces the opponent has to join."],
    review: AGENT_READ_2026_10_30,
  },
  amazons: {
    tagline: ["クイーンを動かし、矢を放つ。動けなくなったほうの負け。", "Move a queen and shoot an arrow. The side that cannot move loses."],
    origin: ["アルゼンチンのWalter Zamkauskasが1988年に作りました。取ることも運もありません。盤が矢で埋まり、誰かの行き場がなくなるまで続き、自分だけの陣地を囲い込むことが大きな狙いになります。", "Walter Zamkauskas of Argentina made it in 1988. There is no taking and no luck. It goes on until the board fills with arrows and someone has nowhere to go, and fencing in a territory of your own is a big aim."],
    rules: [
      ["各自4つのクイーンを持ちます。白が先に動かします。", "Each player has four queens. White moves first."],
      ["1手は2つのことからなります。クイーンを1つ、行、列、斜めに沿って何も越えずに好きなだけ動かし、次に止まった場所から同じように矢を放ちます。", "A move is two things. Move one queen any distance along a row, column or diagonal crossing nothing, then shoot an arrow from where it stopped in the same way."],
      ["矢の落ちたマスはずっと使えません。止まることも越えることもできません。クイーンは来た方向へ矢を放つこともできます。", "A square an arrow fell on can never be used. Nothing can stop on it or cross it. A queen can also shoot back the way it came."],
      ["自分の番に動いて矢を放てない人の負けです。引き分けはありません。", "A person who cannot move and shoot on their turn loses. There are no draws."],
    ],
    board: ["10×10です。序盤はクイーンが多くのマスに届く場所に立ち、後半は自分のクイーンだけが入れる領域を囲い、その広さを数えます。", "10×10. Early on stand where the queens reach many squares; later fence in an area only your queens can enter, and count its size."],
    review: AGENT_READ_2026_10_30,
  },
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
