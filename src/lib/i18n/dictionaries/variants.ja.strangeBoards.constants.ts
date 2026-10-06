import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Japanese copy for the Strange boards family (`variants.constants.ts` holds
 * the English). 岩 for a rock, ホットスポット for a hotspot, 区画 for a
 * quadrant, and 乱数の種 for the seed a layout is laid from.
 */
export const VARIANT_COPY_JA_STRANGE_BOARDS = {
  toroidalFive: {
    tagline: [
      "端のない盤で5つ並べる。どの辺も反対側の辺とつながっている。",
      "Make five in a row on a board with no edges. Every side is joined to the opposite side.",
    ],
    origin: [
      "このサイトのオリジナルのゲームです。五目並べをドーナツ形の面（トーラス）に巻いたもので、盤にはどこにも隅がなく、どこもが中央です。",
      "A game original to this site. It wraps gomoku onto a doughnut-shaped surface (a torus), so the board has no corner anywhere and is a centre everywhere.",
    ],
    rules: [
      ["五目並べと同じく、5つ並べば勝ちです。", "As in gomoku, five in a row wins."],
      [
        "左右の端がつながり、上下の端もつながります。一方の端から出た列は、反対側から続きます。",
        "The left and right edges are joined, and so are the top and bottom. A line that leaves from one edge continues from the opposite side.",
      ],
      [
        "そのため、どの交点も中央の交点と同じです。隠れられる隅も、列をふさげる端もありません。",
        "So every intersection is the same as a centre intersection. There is no corner to hide in and no edge to block a line against.",
      ],
      [
        "列は、それぞれ別の5つの石でなければなりません。一周して自分自身につながる並びは数えません。",
        "A line must be five distinct stones. A run that goes all the way round and joins itself does not count.",
      ],
    ],
    board: [
      "初期設定は15×15です。小さい盤にすると、つながり方が見やすくなります。",
      "The default is 15×15. A smaller board makes it easier to see how the edges connect.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  obstacleFive: {
    tagline: [
      "使えない点とホットスポットが散らばった盤で5つ並べる。",
      "Make five in a row on a board scattered with unusable points and hotspots.",
    ],
    origin: [
      "このサイトのオリジナルのゲームです。落とし系の使えないマスとホットスポットを、石が置いた場所に留まる盤に持ち込んだものです。",
      "A game original to this site. It brings the unusable squares and hotspots of the Drops family onto a board where stones stay where they are placed.",
    ],
    rules: [
      ["5つ並べば勝ちです。", "Five in a row wins."],
      [
        "6つの点は使えません。そこに石は置けず、列も通りません。",
        "Six points cannot be used. No stone can be placed there and no line passes through them.",
      ],
      [
        "2つの点はホットスポットで、どちらの色の石としても数えられます。列はホットスポットを通れます。",
        "Two points are hotspots, which count as a stone of either colour. A line can pass through a hotspot.",
      ],
      [
        "ホットスポットはどちらの側の役にも立つので、同じ1つが両方の色の列に入ることがあります。石は自分の色としてしか数えられないので、相手の色の列の隙間に打った石は、その列をふさぎます。",
        "A hotspot serves both sides, so the same one can be part of a line of each colour. A stone counts only as its own colour, so a stone played in a gap of the other colour's line blocks it.",
      ],
      [
        "これらの点はそのゲームの乱数の種から決まるので、2人とも同じ盤を見ますし、棋譜を再生しても同じ場所になります。",
        "These points are decided by that game's random seed, so both players see the same board, and replaying the game record puts them in the same places.",
      ],
    ],
    board: [
      "初期設定は15×15です。盤の大きさにかかわらず、同じ8つの点が散らばります。",
      "The default is 15×15. Whatever the size of the board, the same eight points are scattered.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  scatteredRocks: {
    tagline: [
      "12個の岩と2つのホットスポットを避けて5つ並べる。最初の1手からすべてそろっている。",
      "Make five in a row around twelve rocks and two hotspots, all in place from the first move.",
    ],
    origin: [
      "このサイトのオリジナルで、既存のゲームの版ではありません。石場五目の岩とホットスポットを、岩の数を2倍にして盤上のどこにでも置いた形です。互角のコンピュータどうしが60局を34対24で分け合ったので選ばれました。ふつうの五目並べでは、同じ条件で黒が60対0で勝っていました。",
      "Original to this site, not a version of a published game. It takes the rocks and hotspots of 石場五目 (Obstacle Five), with twice as many rocks placed anywhere on the board. It was chosen because two evenly matched computer players split 60 games 34 to 24 on it, where on plain five in a row Black won 60 to 0.",
    ],
    rules: [
      ["5つ並べば勝ちです。", "Five in a row wins."],
      [
        "12個の点は岩です。そこに石は置けず、列も通りません。",
        "Twelve points are rocks. No stone can be placed there and no line passes through.",
      ],
      [
        "2つの点はホットスポットで、どちらの色の石としても数えられます。どちらの色の列もホットスポットを通れるので、同じホットスポットが2人の両方の役に立つことがあります。",
        "Two points are hotspots, which count as a stone of either colour. A line of either colour can pass through a hotspot, so the same hotspot can serve both players at once.",
      ],
      [
        "岩とホットスポットは、中央の点以外のどこかに、そのゲームの乱数の種から決まって置かれるので、2人とも同じ盤を見ますし、棋譜を再生しても同じ場所になります。",
        "The rocks and hotspots are placed anywhere except the centre point, decided by that game's random seed, so both players see the same board, and replaying the game record puts them in the same places.",
      ],
    ],
    board: [
      "15×15のみです。岩を試した盤がこの大きさでした。最初の石を置く前に、岩が長い列をどこで断ち切っているかを見ておきましょう。",
      "15×15 only, because that is the board the rocks were tried on. Before placing your first stone, look at where the rocks cut the long lines.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  rockfall: {
    tagline: [
      "何もない盤で5つ並べる。8つ目の石のあとで、20個の岩と2つのホットスポットが落ちてくる。",
      "Make five in a row on an empty board. After the eighth stone, twenty rocks and two hotspots fall onto it.",
    ],
    origin: [
      "このサイトのオリジナルで、既存のゲームの版ではありません。乱石五目と同じ試し打ちから選ばれました。互角のコンピュータどうしの60局で、23対21、引き分け16と、試したどの盤よりも互角に近い結果でした。",
      "Original to this site, not a version of a published game. It was chosen from the same test games as 乱石五目 (Scattered Rocks). Over 60 games between two evenly matched computer players the result was 23 to 21 with 16 draws, the closest to even of any board tried.",
    ],
    rules: [
      [
        "5つ並べば勝ちです。盤は空の状態で始まります。",
        "Five in a row wins. The board starts empty.",
      ],
      [
        "8つ目の石が打たれると、20個の岩と2つのホットスポットが盤に落ちてきます。位置はそのゲームの乱数の種から決まります。",
        "When the eighth stone has been played, twenty rocks and two hotspots fall onto the board. Their positions are decided by that game's random seed.",
      ],
      [
        "石の上に落ちた岩やホットスポットは無効になり、石はそのまま残ります。それだけで五を完成させてしまうホットスポットも無効になるので、落ちてくることで勝負が決まることはありません。",
        "A rock or hotspot that falls on a stone is void, and the stone stays. A hotspot that would complete a five by itself is also void, so the fall never decides the game.",
      ],
      [
        "岩は石を置けず、列も通らない点です。ホットスポットはどちらの色の石としても数えられるので、どちらの色の列も通れます。",
        "A rock is a point where no stone can be placed and no line passes. A hotspot counts as a stone of either colour, so a line of either colour can pass through it.",
      ],
    ],
    board: [
      "15×15のみです。岩を試した盤がこの大きさでした。早くに作った列は落ちてくる岩で断ち切られることがあるので、最初の8つの石は、形と同じくらい余地を考えて打ちます。",
      "15×15 only, because that is the board the rocks were tried on. A line built early can be cut by the falling rocks, so the first eight stones are played thinking about room as much as shape.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  dominoFive: {
    tagline: [
      "ドミノで打つ五目並べ。どの駒も石が2つで、いつも自分の色とは限らない。",
      "Gomoku played with dominoes. Every piece is two stones, and they are not always your colour.",
    ],
    origin: [
      "このサイトのオリジナルのゲームです。2人とも同じランダムな順のドミノを引き、次に何が来るかが見えています。",
      "A game original to this site. Both players draw the same random sequence of dominoes and can see what is coming next.",
    ],
    rules: [
      [
        "毎手、列の次のドミノを置かなければなりません。ドミノは石が2つ並んだもので、黒黒、白白、黒白、白黒のいずれかです。好きな向きに回して置けます。",
        "Each move you must place the next domino in the line. A domino is two stones side by side, one of black-black, white-white, black-white or white-black. You can turn it to any orientation you like.",
      ],
      [
        "2人とも同じ列から引くので、自分が5回目に引く駒と、相手が5回目に引く駒は同じです。次の3つは、2人に見えています。",
        "Both players draw from the same line, so the piece you draw fifth is the same as the piece your opponent draws fifth. The next three are visible to both.",
      ],
      [
        "5つ並んだ色の側が、誰が石を置いたかにかかわらず勝ちです。1つのドミノで両方の色の五が同時にできたら引き分けです。",
        "The side whose colour makes five in a row wins, whoever placed the stones. If one domino completes fives of both colours at once, it is a draw.",
      ],
      [
        "どこにもドミノが置けなければ手番はパスになり、2回続けてパスになると引き分けで終局です。",
        "If no domino can be placed anywhere, the turn is a pass, and two passes in a row end the game as a draw.",
      ],
    ],
    board: [
      "初期設定は15×15です。13×13なら鋭い勝負に、19×19なら長い勝負になります。",
      "The default is 15×15. 13×13 makes a sharper game and 19×19 a longer one.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  blockFive: {
    tagline: [
      "落ち物パズルの駒で打つ五目並べ。どの駒も石が4つで、色は2つずつ。",
      "Gomoku played with falling-block pieces. Every piece is four stones, two of each colour.",
    ],
    origin: [
      "このサイトのオリジナルのゲームです。4マスの7種類の形に黒と白を2つずつ割り当て、2人で共有する列にしたものです。",
      "A game original to this site. The seven four-square shapes are coloured two black and two white and put in a line shared by the two players.",
    ],
    rules: [
      [
        "毎手、列の次の駒を置きます。駒は4マスの7種類の形のどれかで、黒2つと白2つの石でできています。回したり裏返したりして、好きな向きで置けます。",
        "Each move you place the next piece in the line. A piece is one of the seven four-square shapes, made of two black and two white stones. You can rotate or flip it and place it in any orientation you like.",
      ],
      [
        "2人とも同じ列から引き、次の3つの駒は2人に見えています。2人で遊ぶ落ち物パズルの対戦と同じです。",
        "Both players draw from the same line, and the next three pieces are visible to both, as in a two-player falling-block match.",
      ],
      [
        "駒の代わりに、隙間を埋めるために自分の色の石を1つだけ置くこともできます。1ゲームで各自6回までです。",
        "Instead of a piece, you can place a single stone of your own colour to fill a gap. Each player can do this up to six times in a game.",
      ],
      [
        "5つ並んだ色の側が、誰が置いたかにかかわらず勝ちです。両方の色が同時に並べば引き分けです。置ける場所がなく、石1つの手も残っていなければ手番はパスになり、2回続けてパスになると引き分けです。",
        "The side whose colour makes five in a row wins, whoever placed it. If both colours make it at once, it is a draw. If nothing fits and no single stones remain, the turn is a pass, and two passes in a row make a draw.",
      ],
    ],
    board: [
      "初期設定は15×15です。19×19なら、駒の形をゆったり置けます。",
      "The default is 15×15. 19×19 gives the shapes more room.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  twistFive: {
    tagline: [
      "石を置いてから、盤の4分の1を回す。5つ並べば勝ち。",
      "Place a stone, then turn one quarter of the board. Five in a row wins.",
    ],
    origin: [
      "盤の区画を回すゲームのこのサイト版で、3×3の区画が4つあります。",
      "This site's version of the game of rotating sections of the board, with four 3×3 sections.",
    ],
    rules: [
      [
        "1手は2つの部分からなります。まず石をどこにでも置き、次に4つの3×3の区画のどれか1つを、どちら向きでも4分の1回転させます。",
        "A move has two parts. First you place a stone anywhere, then you turn any one of the four 3×3 sections a quarter turn, in either direction.",
      ],
      [
        "盤上のどこでも、どちらの色でも、5つ並べば、回転のあとに終局です。石を置いただけで五ができたときは、すぐに勝ちです。",
        "Five in a row anywhere on the board, in either colour, ends the game after the turn. If placing the stone alone makes five, you win at once.",
      ],
      [
        "回転によって両方の色に五ができたら、引き分けです。",
        "If the turn makes five for both colours, it is a draw.",
      ],
      [
        "五ができないまま、最後の回転のあとで盤が埋まっていれば、引き分けです。",
        "If the board is full after the last turn with no five, it is a draw.",
      ],
    ],
    board: ["6×6で、4つの区画に分かれています。", "6×6, divided into four sections."],
    review: AGENT_READ_2026_10_06,
  },
  twistFour: {
    tagline: [
      "小さな回転ゲーム。2×2の区画が4つで、4つ並べる。",
      "The small rotation game. Four 2×2 sections, and you make four in a row.",
    ],
    origin: [
      "回転の仕組みを小さな盤で遊べるようにした、このサイト独自の盤です。",
      "This site's own smaller board for the rotation mechanism.",
    ],
    rules: [
      [
        "石を置いてから、4つの2×2の区画のどれか1つを4分の1回転させます。",
        "Place a stone, then turn any one of the four 2×2 sections a quarter turn.",
      ],
      [
        "どこでも、どちらの色でも、4つ並べば、回転のあとに勝ちです。",
        "Four in a row anywhere, in either colour, wins after the turn.",
      ],
      [
        "両方の色が同時に勝ちの列を作ったら引き分けです。盤が埋まった場合も引き分けです。",
        "If both colours make a winning line at once, it is a draw. A full board is also a draw.",
      ],
    ],
    board: [
      "4×4です。早く終わり、意外なほど鋭い勝負になります。",
      "4×4. It finishes quickly and makes a surprisingly sharp game.",
    ],
    review: AGENT_READ_2026_10_06,
  },
} satisfies Partial<Record<RuleVariant, VariantCopyJa>>;
