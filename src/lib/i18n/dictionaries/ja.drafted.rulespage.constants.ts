import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the rulespage.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_RULESPAGE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // rulespage.count.*: a number with its noun. Japanese counts these with 個 after the digits and has no singular, so both forms say the same.
  "rulespage.count.stone.one": { text: "石{count}個", back: "{count} stone", review: AGENT_READ },
  "rulespage.count.stone.other": { text: "石{count}個", back: "{count} stones", review: AGENT_READ },
  "rulespage.count.enemyStone.one": { text: "相手の石{count}個", back: "{count} enemy stone", review: AGENT_READ },
  "rulespage.count.enemyStone.other": { text: "相手の石{count}個", back: "{count} enemy stones", review: AGENT_READ },
  "rulespage.count.piece.one": { text: "駒{count}個", back: "{count} piece", review: AGENT_READ },
  "rulespage.count.piece.other": { text: "駒{count}個", back: "{count} pieces", review: AGENT_READ },
  "rulespage.count.point.one": { text: "点{count}個", back: "{count} point", review: AGENT_READ },
  "rulespage.count.point.other": { text: "点{count}個", back: "{count} points", review: AGENT_READ },
  "rulespage.count.rock.one": { text: "岩{count}個", back: "{count} rock", review: AGENT_READ },
  "rulespage.count.rock.other": { text: "岩{count}個", back: "{count} rocks", review: AGENT_READ },
  "rulespage.count.hotspot.one": { text: "ホットスポット{count}個", back: "{count} hotspot", review: AGENT_READ },
  "rulespage.count.hotspot.other": { text: "ホットスポット{count}個", back: "{count} hotspots", review: AGENT_READ },
  "rulespage.list.and": {
    text: "{head}と{last}",
    back: "{head} and {last}",
    review: AGENT_READ,
  },
  "rulespage.list.or": {
    text: "{head}か{last}",
    back: "{head} or {last}",
    review: AGENT_READ,
  },
  "rulespage.list.orEither": {
    text: "{head}、または{last}",
    back: "{head}, or {last}",
    review: AGENT_READ,
  },
  "rulespage.stone.black": {
    text: "黒",
    back: "Black",
    review: AGENT_READ,
  },
  "rulespage.stone.white": {
    text: "白",
    back: "White",
    review: AGENT_READ,
  },
  "rulespage.pattern.doubleThree": {
    text: "三三",
    back: "double three",
    review: AGENT_READ,
  },
  "rulespage.pattern.doubleFour": {
    text: "四四",
    back: "double four",
    review: AGENT_READ,
  },
  "rulespage.pattern.overline": {
    text: "長連",
    back: "overline",
    review: AGENT_READ,
  },
  "rulespage.object.connectsJoin": {
    text: "自分の石を途切れなくつないで、盤の自分側の二辺を結びます。黒は上と下、白は左と右です。",
    back: "Link your own two sides of the board with an unbroken chain of your stones. Black has the top and bottom, White the left and right.",
    review: AGENT_READ,
  },
  "rulespage.object.connectsNoDraw": {
    text: "盤が埋まれば必ずどちらか一方だけが勝つので、引き分けはありえません。これは盤の形から決まる事実で、誰かが定めた規則ではありません。",
    back: "When the board is full exactly one side always wins, so a draw cannot happen. This follows from the shape of the board and is not a rule anyone made.",
    review: AGENT_READ,
  },
  "rulespage.object.campsFill": {
    text: "向かい側の隅にある陣を、先に自分の駒で埋めた方が勝ちです。駒を取ることはなく、列を作っても何の意味もありません。",
    back: "Whoever first fills the camp in the far corner with their own pieces wins. Pieces are not captured, and making a line means nothing.",
    review: AGENT_READ,
  },
  "rulespage.object.campsBlock": {
    text: "駒を自陣に残して相手をふさいでも、自陣のほかのマスをすべて相手に埋められた時点で負けです。",
    back: "Even if a side keeps pieces at home to block, it loses the moment every other square of its camp has been filled by the opponent.",
    review: AGENT_READ,
  },
  "rulespage.object.starFill": {
    text: "自分の真向かいにある星の頂点を、先に自分の駒で埋めた方が勝ちです。駒を取ることはなく、列を作っても何の意味もありません。",
    back: "Whoever first fills the point of the star directly opposite their own with their own pieces wins. Pieces are not captured, and making a line means nothing.",
    review: AGENT_READ,
  },
  "rulespage.object.starBlock": {
    text: "駒を自陣に残してふさいでも、向かい側の頂点のほかのマスがすべて埋まった時点で負けです。",
    back: "Even if a side keeps pieces at home to block, it loses the moment every other cell of the far point has been filled.",
    review: AGENT_READ,
  },
  "rulespage.object.flipsFewer": {
    text: "終局時に、相手の色より石が少なければ勝ちです。石は通常どおりひっくり返しますが、目的は逆さまです。",
    back: "You win if you have fewer discs than the other colour when the game ends. Discs are turned over as usual, but the goal is upside down.",
    review: AGENT_READ,
  },
  "rulespage.object.flipsMore": {
    text: "終局時に、相手の色より石が多ければ勝ちです。",
    back: "You win if you have more discs than the other colour when the game ends.",
    review: AGENT_READ,
  },
  "rulespage.object.flipsEnd": {
    text: "どちらの色も打てる手がなくなると終局です。たいていは盤が埋まった状態です。石の数が同じなら引き分けです。",
    back: "The game ends when neither colour has a legal move, which is usually a full board. Equal counts are a draw.",
    review: AGENT_READ,
  },
  "rulespage.object.checkersNoMove": {
    text: "相手の動かせる駒をなくせば勝ちです。駒を飛び越えて取り、1つも残らなくするか、残った駒の動きを封じます。",
    back: "You win by leaving the other side with no piece that can move. Jump over and capture their pieces until none is left, or shut in whatever remains.",
    review: AGENT_READ,
  },
  "rulespage.object.checkersNoLines": {
    text: "列を作ることはなく、石を置き足すこともありません。最初からすべての駒が盤上にあり、駒の歩み方と跳び方がゲームのすべてです。",
    back: "There are no lines and nothing is added after the start. Every piece is on the board from the first move, and the whole game is in how they step and jump.",
    review: AGENT_READ,
  },
  "rulespage.object.goSurround": {
    text: "盤の広い範囲を、相手の色より多く囲みます。石は一度置いたら動かず、列を作っても勝ちにはなりません。",
    back: "Surround more of the board than the other colour. Stones do not move once placed, and making a line never wins anything.",
    review: AGENT_READ,
  },
  "rulespage.object.goCapture": {
    text: "つながった同じ色の石の一団に、接する空き点が1つもなくなると、その一団は丸ごとすぐに盤から取り除かれます。",
    back: "When a connected group of one colour has no empty point touching it anywhere, the whole group is removed from the board at once.",
    review: AGENT_READ,
  },
  "rulespage.object.makerBreaker": {
    text: "黒は作り手で、どちらの色でも{length}つ並べば、誰が置いたかにかかわらず勝ちです。白は壊し手で、そのような列ができないまま盤が埋まれば勝ちです。",
    back: "Black is the Maker and wins if {length} in a row of either colour appears, whoever placed it. White is the Breaker and wins if the board fills with no such line.",
    review: AGENT_READ,
  },
  "rulespage.object.misere": {
    text: "{length}つ並べた方が負けです。そうならないように打ちます。",
    back: "Whoever makes {length} in a row loses. You play so as to avoid it.",
    review: AGENT_READ,
  },
  "rulespage.object.loseLength": {
    text: "{length}つ並べれば勝ちですが、ちょうど{lose}つ並べると負けになります。",
    back: "Making {length} in a row wins, but making exactly {lose} in a row loses.",
    review: AGENT_READ,
  },
  "rulespage.object.line": {
    text: "先に列を作ることを目指します。{rule}。",
    back: "You aim to make a line first. {rule}.",
    review: AGENT_READ,
  },
  "rulespage.object.lineWhite": {
    text: "白の場合は、{rule}。",
    back: "For White, {rule}.",
    review: AGENT_READ,
  },
  "rulespage.object.ruleExact": {
    text: "ちょうど{length}つ並べば勝ちで、それより長い列は勝ちになりません",
    back: "making exactly {length} in a row wins, and a longer line does not win",
    review: AGENT_READ,
  },
  "rulespage.object.ruleExactOpen": {
    text: "ちょうど{length}つ並べば勝ちで、両端を相手の石でふさがれた列は勝ちになりません",
    back: "making exactly {length} in a row wins, and a line shut in at both ends by an opponent's stones does not win",
    review: AGENT_READ,
  },
  "rulespage.object.ruleAtLeast": {
    text: "{length}つ以上並べば勝ちです",
    back: "making {length} or more in a row wins",
    review: AGENT_READ,
  },
  "rulespage.object.capturesBoth": {
    text: "{stones}を取っても勝ちです。取るのは2つ組か3つ組です。",
    back: "Capturing {stones} also wins. Stones are taken in pairs or triples.",
    review: AGENT_READ,
  },
  "rulespage.object.capturesPairs": {
    text: "{stones}、つまり5組を取っても勝ちです。",
    back: "Capturing {stones}, that is five pairs, also wins.",
    review: AGENT_READ,
  },
  "rulespage.object.anyColour": {
    text: "どちらの色の列でも、それを完成させた方が勝ちです。",
    back: "A line of either colour wins for whoever completed it.",
    review: AGENT_READ,
  },
  "rulespage.object.square": {
    text: "自分の駒4つで2×2の正方形を作っても勝ちです。",
    back: "Four of your pieces forming a 2×2 square also wins.",
    review: AGENT_READ,
  },
  "rulespage.board.sizeOne": {
    text: "{size}×{size}の盤です。",
    back: "A {size}×{size} board.",
    review: AGENT_READ,
  },
  "rulespage.board.sizeMany": {
    text: "{sizes}路の正方形の盤から選べます。初期設定は{opens}×{opens}です。",
    back: "You can choose a square board of {sizes} lines. The default is {opens}×{opens}.",
    review: AGENT_READ,
  },
  "rulespage.board.quadrants": {
    text: "盤は{size}×{size}の4つの区画に分かれ、どの区画も回転できます。",
    back: "The board is divided into four {size}×{size} sections, and any section can be turned.",
    review: AGENT_READ,
  },
  "rulespage.board.rocksFall": {
    text: "最初は空の盤です。{after}が打たれると、{dead}と{hot}が盤に落ちてきます。位置はそのゲームの乱数の種から決まります。岩は石を置けず、列も通らない点で、ホットスポットはどちらの色の石としても数えられます。石の上に落ちたものは無効になり、それだけで列を完成させてしまうホットスポットも無効になります。",
    back: "It starts as an empty board. When {after} have been played, {dead} and {hot} fall onto the board. Their positions are decided by that game's random seed. A rock is a point where no stone can be placed and no line passes, and a hotspot counts as a stone of either colour. One that falls on a stone is void, and so is a hotspot that would complete a line by itself.",
    review: AGENT_READ,
  },
  "rulespage.board.rocks": {
    text: "{dead}が岩です。中央以外の場所に、そのゲームの乱数の種から決まって置かれ、石を置くことも、列が通ることもできません。",
    back: "{dead} are rocks. They are placed anywhere but the centre, decided by that game's random seed, and no stone can be placed there and no line can pass through.",
    review: AGENT_READ,
  },
  "rulespage.board.hotspots": {
    text: "さらに{hot}個の点がホットスポットで、どちらの色の石としても数えられます。",
    back: "A further {hot} points are hotspots, which count as a stone of either colour.",
    review: AGENT_READ,
  },
  "rulespage.board.deadOne": {
    text: "ゲーム開始時にランダムに選ばれた1つの点は使えません。石を置くことも、列が通ることもできません。",
    back: "One point, chosen at random when the game starts, cannot be used. No stone can be placed there and no line can pass through.",
    review: AGENT_READ,
  },
  "rulespage.board.deadMany": {
    text: "ゲーム開始時にランダムに選ばれた{count}個の点は使えません。石を置くことも、列が通ることもできません。",
    back: "{count} points, chosen at random when the game starts, cannot be used. No stone can be placed there and no line can pass through.",
    review: AGENT_READ,
  },
  "rulespage.board.hotOne": {
    text: "ランダムに選ばれた1つの点はホットスポットで、どちらの色の石としても数えられます。",
    back: "One point, chosen at random, is a hotspot that counts as a stone of either colour.",
    review: AGENT_READ,
  },
  "rulespage.board.hotMany": {
    text: "ランダムに選ばれた{count}個の点はホットスポットで、どちらの色の石としても数えられます。",
    back: "{count} points, chosen at random, are hotspots that count as a stone of either colour.",
    review: AGENT_READ,
  },
  "rulespage.board.wrapColumns": {
    text: "左右の端がつながっていて、列は一方の端を越えて反対側の端へ続きます。",
    back: "The left and right edges are joined, and a line continues past one edge onto the opposite edge.",
    review: AGENT_READ,
  },
  "rulespage.board.wrapBoth": {
    text: "どの端も反対側の端とつながっています。左は右と、上は下とです。どの端から出た列も反対側から続くので、盤にはどこにも隅がなく、どこもが中央です。",
    back: "Every edge is joined to the opposite edge: left to right, and top to bottom. A line that leaves from any edge continues from the opposite side, so the board has no corner anywhere and is a centre everywhere.",
    review: AGENT_READ,
  },
  "rulespage.board.wormholes": {
    text: "ゲーム開始時にランダムに選ばれた2つの点は、ワームホールの出入口です。出入口には石を置けず、列が一方に届くと、もう一方から同じ向きに続きます。",
    back: "Two points, chosen at random when the game starts, are the entrances of a wormhole. No stone can be placed on an entrance, and when a line reaches one it continues from the other in the same direction.",
    review: AGENT_READ,
  },
  "rulespage.board.pieces": {
    text: "持ち駒は各自{pieces}です。",
    back: "Each player has {pieces}.",
    review: AGENT_READ,
  },
  "rulespage.board.connects": {
    text: "三角形の格子に区切られた菱形の盤で、初期設定では一辺が11点あり、石は交点に置きます。黒は濃く示された上下の辺、白は淡く示された左右の辺を受け持ちます。濃い辺と淡い辺の間にある2つの角は、どちらの色のものでもあります。",
    back: "A rhombus divided into a triangular lattice, with 11 points on a side by default, and stones are placed on the crossings. Black has the top and bottom edges, shown dark, and White the left and right edges, shown pale. The two corners between a dark edge and a pale edge belong to both colours.",
    review: AGENT_READ,
  },
  "rulespage.board.camps": {
    text: "各自の駒は、片方の隅の陣を埋めた状態で始まります。黒は左上、白は右下です。駒の数は、16×16では19個、10×10では13個、8×8では10個です。陣は盤上で色づけされています。",
    back: "Each side's pieces start filling a camp in one corner, Black at the top left and White at the bottom right. The number of pieces is 19 on 16×16, 13 on 10×10 and 10 on 8×8. The camps are coloured on the board.",
    review: AGENT_READ,
  },
  "rulespage.board.hexFlips": {
    text: "六角形のマスを六角形に並べた盤で、一辺が{side}マス、全部で{cells}マスです。中央のマスはふさがれ、その周りの6マスには最初から石が置かれ、黒と白が3つずつで、同じ色は隣り合いません。どのマスも6つのマスに接するので、並びは8方向ではなく6方向になります。",
    back: "A board of hexagonal cells arranged in a hexagon, {side} cells on a side and {cells} cells in all. The centre cell is sealed, the six cells around it hold stones from the start, three black and three white, and no two of the same colour are next to each other. Every cell touches six cells, so runs go in six directions rather than eight.",
    review: AGENT_READ,
  },
  "rulespage.board.hexFlipsOthers": {
    text: "この盤は全部で{boards}種類の六角形で遊べます。この盤と、{list}です。どの盤でも中央はふさがれているので、どれを選んでも、埋めるマスの数は偶数になります。",
    back: "It can be played on {boards} kinds of hexagon in all: this board and {list}. The centre is sealed on every board, so whichever is chosen, the number of cells to fill is even.",
    review: AGENT_READ,
  },
  "rulespage.board.hexLines": {
    text: "六角形のマスを六角形に並べた盤で、一辺が{side}マス、全部で{cells}マスです。中央はふさがれていません。どのマスも6つのマスに接しますが、列が通れるのは格子の3つの軸の向きだけです。",
    back: "A board of hexagonal cells arranged in a hexagon, {side} cells on a side and {cells} cells in all. The centre is not sealed. Every cell touches six cells, but a line can only run along the three axes of the lattice.",
    review: AGENT_READ,
  },
  "rulespage.board.hexLinesOthers": {
    text: "この盤は全部で{boards}種類の六角形で遊べます。この盤と、{list}です。",
    back: "It can be played on {boards} kinds of hexagon in all: this board and {list}.",
    review: AGENT_READ,
  },
  "rulespage.board.hexOther": {
    text: "一辺{side}マスの{cells}マスの盤",
    back: "a board of {cells} cells with {side} cells on a side",
    review: AGENT_READ,
  },
  "rulespage.board.star": {
    text: "六芒星の形の盤です。中央の六角形に6つの三角形の頂点がつき、全部で121マスです。各自の10個の駒は1つの頂点を埋めた状態で始まり、黒は上、白は下で、盤上で色づけされています。目指すのは向かい側の頂点です。",
    back: "A board in the shape of a six-pointed star: a hexagon in the centre with six triangular points, 121 cells in all. Each side's ten pieces start filling one point, Black at the top and White at the bottom, coloured on the board. The one to aim for is the point on the far side.",
    review: AGENT_READ,
  },
  "rulespage.board.go": {
    text: "石は線の交点に置き、線の間のマスには置きません。そのため、盤の一辺にある点の数は、マスの数より1つ多くなります。星は、置き石を置く昔からの位置を示しています。",
    back: "Stones are placed on the intersections of the lines, not in the squares between the lines. So the number of points on a side of the board is one more than the number of squares. The stars show the traditional positions for handicap stones.",
    review: AGENT_READ,
  },
  "rulespage.board.queueDomino": {
    text: "2人で共有する、順に出てくるドミノの列です。ドミノは石2つ分で、黒黒、白白、黒白、白黒のいずれかが、そのゲームの乱数の種からランダムに出ます。2人とも同じ順に引き、次の3つが見えています。",
    back: "A line of dominoes shared by the two players, coming out in order. A domino is two stones, one of black-black, white-white, black-white or white-black, drawn at random from that game's random seed. Both players draw in the same order and can see the next three.",
    review: AGENT_READ,
  },
  "rulespage.board.queueShapes": {
    text: "2人で共有する、順に出てくる7種類の4マスの形の列です。どの形も黒2つと白2つの石でできていて、そのゲームの乱数の種からランダムに出ます。2人とも同じ順に引き、次の3つが見えています。",
    back: "A line of the seven four-square shapes shared by the two players, coming out in order. Every shape is made of two black and two white stones, drawn at random from that game's random seed. Both players draw in the same order and can see the next three.",
    review: AGENT_READ,
  },
  "rulespage.play.connectsTurn": {
    text: "交互に、空いている点へ石を1つずつ置きます。石は動かず、取られることもありません。",
    back: "Taking turns, you place one stone on an empty point. Stones do not move and are never captured.",
    review: AGENT_READ,
  },
  "rulespage.play.connectsLines": {
    text: "どの点でも3種類の線が交わるので、各点は6つの点に接しています。行に沿って2つ、斜めの列に沿って2つ、盤の短い対角線に沿って2つです。",
    back: "Three kinds of line cross at every point, so each point touches six points: two along its row, two along its slanted column and two along the board's short diagonal.",
    review: AGENT_READ,
  },
  "rulespage.play.connectsEnd": {
    text: "どちらかの色の石の鎖が、自分の側の一辺からもう一方の辺まで届いた瞬間に終局です。",
    back: "The game ends the moment one colour's chain of stones reaches from one of its sides to the other.",
    review: AGENT_READ,
  },
  "rulespage.play.campsStep": {
    text: "1手で駒を1つ動かします。8方向のどれでも、隣の空いているマスへ1歩進めます。",
    back: "A turn moves one piece. It can step to a neighbouring empty square in any of the eight directions.",
    review: AGENT_READ,
  },
  "rulespage.play.campsJump": {
    text: "または跳びます。どちらの色でも隣り合う駒を飛び越え、そのすぐ先の空いているマスに着地します。そこからさらに、駒を飛び越えるかぎり何度でも、向きを変えながら続けて跳べます。どの跳びの後でも、そこで止まってかまいません。",
    back: "Or it can jump: over an adjacent piece of either colour and land on the empty square just beyond it. From there it can jump again and again, changing direction, as long as each jump crosses a piece. A move may stop after any jump.",
    review: AGENT_READ,
  },
  "rulespage.play.jumpedStays": {
    text: "飛び越えられた駒は取られず、そのまま残ります。",
    back: "A piece that is jumped over is not captured and stays where it is.",
    review: AGENT_READ,
  },
  "rulespage.play.campsEnd": {
    text: "向かい側の陣を埋める手が打たれた瞬間に終局です。",
    back: "The game ends the moment a move fills the far camp.",
    review: AGENT_READ,
  },
  "rulespage.play.starStep": {
    text: "1手で駒を1つ動かします。盤の格子がつながる6方向のどれでも、隣の空いているマスへ1歩進めます。",
    back: "A turn moves one piece. It can step to a neighbouring empty cell in any of the six directions in which the board's lattice connects.",
    review: AGENT_READ,
  },
  "rulespage.play.starJump": {
    text: "または跳びます。どちらの色でも隣り合う駒を飛び越え、そのすぐ先の空いているマスに着地します。そこからさらに、駒を飛び越えるかぎり何度でも、向きを変えながら続けて跳べます。どの跳びの後でも、そこで止まってかまいません。",
    back: "Or it can jump: over an adjacent piece of either colour and land on the empty cell just beyond it. From there it can jump again and again, changing direction, as long as each jump crosses a piece. A move may stop after any jump.",
    review: AGENT_READ,
  },
  "rulespage.play.starEnd": {
    text: "自分の真向かいの頂点を埋める手が打たれた瞬間に終局です。",
    back: "The game ends the moment a move fills the point directly opposite your own.",
    review: AGENT_READ,
  },
  "rulespage.play.hexStart": {
    text: "ふさがれた中央の周りの6マスには、最初に黒と白の石が3つずつ、輪になって交互に置かれています。",
    back: "The six cells around the sealed centre start with three discs of each colour, placed alternately in a ring.",
    review: AGENT_READ,
  },
  "rulespage.play.hexBracket": {
    text: "石を置けるのは、格子の6方向のどれかで、相手の色の石を1つ以上まっすぐに挟める場所だけです。その先の端には自分の石が必要です。挟まれた石はすべて自分の色にひっくり返ります。ふさがれた中央は何も挟まないので、そこまで続く列は何もひっくり返しません。",
    back: "You can place a disc only where it brackets one or more discs of the other colour in a straight run along one of the six lattice directions, with one of your own at the far end. Every bracketed disc turns to your colour. The sealed centre brackets nothing, so a run that reaches it turns nothing.",
    review: AGENT_READ,
  },
  "rulespage.play.hexPass": {
    text: "打てる場所がない色はパスをして、もう一方の色が続けて打ちます。打てる手があるうちはパスできません。",
    back: "A colour with nowhere to play passes, and the other colour plays again. You cannot pass while you have a move.",
    review: AGENT_READ,
  },
  "rulespage.play.hexCount": {
    text: "どちらの色も打てなくなったら、石の数を数えます。",
    back: "When neither colour can move, the discs are counted.",
    review: AGENT_READ,
  },
  "rulespage.play.queueLay": {
    text: "毎手、列の次の駒を、回したり裏返したりして好きな向きで、空いている点に置きます。",
    back: "Each turn you place the next piece in the line on empty points, turned or flipped to any orientation you like.",
    review: AGENT_READ,
  },
  "rulespage.play.queueSingles": {
    text: "駒の代わりに、自分の色の石を1つだけ置くこともできます。1ゲームで各自{count}回までです。",
    back: "Instead of a piece you can place a single stone of your own colour. Each player can do this up to {count} times in a game.",
    review: AGENT_READ,
  },
  "rulespage.play.queueLines": {
    text: "駒には両方の色の石が含まれるので、どちらの側の列も完成させられます。列を作った色の側が、誰が置いたかにかかわらず勝ちで、両方の色の列が同時にできれば引き分けです。",
    back: "A piece contains stones of both colours, so it can complete a line for either side. The side whose colour made the line wins, whoever placed the piece, and lines of both colours at once make a draw.",
    review: AGENT_READ,
  },
  "rulespage.play.queuePass": {
    text: "置ける場所がなければ手番はパスになり、2回続けてパスになると引き分けで終局です。",
    back: "If nothing fits, the turn is a pass, and two passes in a row end the game as a draw.",
    review: AGENT_READ,
  },
  "rulespage.play.goTurn": {
    text: "交互に、空いている交点へ石を1つずつ置きます。黒が先に打ち、石は一度置いたら動きません。",
    back: "Taking turns, you place one stone on an empty intersection. Black plays first, and stones do not move once placed.",
    review: AGENT_READ,
  },
  "rulespage.play.goCapture": {
    text: "石が接するのは上下左右の4つの点で、斜めは含みません。隣り合う相手の石の一団から呼吸点をすべてなくす石を打つと、その一団は丸ごとすぐに盤から取り除かれます。",
    back: "A stone touches its four neighbours up, down, left and right, not the diagonals. If you place a stone that removes every liberty of an adjacent enemy group, the whole group is removed from the board at once.",
    review: AGENT_READ,
  },
  "rulespage.play.goKo": {
    text: "自分の一団の最後の呼吸点に打つことはできません。ただし、その手が相手の一団を取って、新しい呼吸点ができる場合は打てます。取られたばかりの石1つをすぐに取り返すこともできません。これがコウの規則です。ほかの場所に1手打てば、パスでも、その制限はなくなります。",
    back: "You cannot play on your own group's last liberty, unless that same move captures an enemy group and so creates a new liberty. You also cannot immediately retake the single stone that was just captured. This is the ko rule. Once a move has been played elsewhere, even a pass, the restriction is gone.",
    review: AGENT_READ,
  },
  "rulespage.play.goPass": {
    text: "打つ代わりにパスもできます。続けて2回パスが出ると終局で、地を数えます。盤上の石と、1つの色だけに囲まれた空き点をすべて数え、白にはコミ6目半を加えます。",
    back: "Instead of playing, either side may pass. When two passes occur in a row the game ends and territory is counted: every stone on the board and every empty point surrounded by one colour alone are counted, and White gets a komi of 6 and a half moku (6.5).",
    review: AGENT_READ,
  },
  "rulespage.play.pieces": {
    text: "まず、各自{pieces}を、1手に1つずつ置きます。そのあとは、1手で自分の駒を1つ、隣の空いている点へ、どの向きにでも1歩動かします。",
    back: "First each player places their {pieces}, one per turn. After that, a turn moves one of your pieces one step to an adjacent empty point, in any direction.",
    review: AGENT_READ,
  },
  "rulespage.play.stonesMany": {
    text: "黒は{first}で始め、そのあとは各自1手に{per}ずつ置きます。",
    back: "Black opens with {first}, and after that each player places {per} per turn.",
    review: AGENT_READ,
  },
  "rulespage.play.stoneOne": {
    text: "交互に、空いている点へ石を1つずつ置きます。",
    back: "Taking turns, you place one stone on an empty point.",
    review: AGENT_READ,
  },
  "rulespage.play.singleColour": {
    text: "どちらが置く石も、すべて黒です。",
    back: "Every stone is black, whoever places it.",
    review: AGENT_READ,
  },
  "rulespage.play.anyColour": {
    text: "自分の手番では、置く石の色を選べます。",
    back: "On your turn you choose the colour of the stone you place.",
    review: AGENT_READ,
  },
  "rulespage.play.drop": {
    text: "列のどこに打っても、石はその列でいちばん下の空き点まで落ちます。",
    back: "Wherever in a column you play, the stone falls to the lowest empty point in that column.",
    review: AGENT_READ,
  },
  "rulespage.play.edge": {
    text: "石を置けるのは、盤の端か、すでにある石のすぐ上下左右の点だけです。",
    back: "A stone can only be placed on the edge of the board or on a point directly above, below, left or right of a stone already there.",
    review: AGENT_READ,
  },
  "rulespage.play.quadrant": {
    text: "石を置いたあと、好きな区画を1つ、どちら向きでも4分の1回転させます。そのあと盤全体で、両方の色の列を調べます。",
    back: "After placing a stone, you turn any one section a quarter turn, in either direction. Then the whole board is checked for lines of both colours.",
    review: AGENT_READ,
  },
  "rulespage.play.capturesBoth": {
    text: "相手の石がちょうど2つ、またはちょうど3つ一列に並んでいて、その両端を自分の石で挟むと、その石を取れます。取れるのは挟みを完成させた石だけで、挟まれた場所へ自分から打ち込んでも取られません。",
    back: "If exactly two or exactly three enemy stones are in a line and you flank both ends with your own stones, you capture them. Only the stone that completes the flank captures, and playing into a flanked position yourself is safe.",
    review: AGENT_READ,
  },
  "rulespage.play.capturesPair": {
    text: "相手の石がちょうど2つ一列に並んでいて、その両端を自分の石で挟むと、そのペアを取れます。取れるのは挟みを完成させた石だけで、挟まれた場所へ自分から打ち込んでも取られません。",
    back: "If exactly two enemy stones are in a line and you flank both ends with your own stones, you capture the pair. Only the stone that completes the flank captures, and playing into a flanked position yourself is safe.",
    review: AGENT_READ,
  },
  "rulespage.play.lineClear": {
    text: "いちばん下の段が埋まると、その段が消え、上にある石はすべて1段ずつ下がります。",
    back: "When the bottom row is full it disappears, and every stone above it drops down one row.",
    review: AGENT_READ,
  },
  "rulespage.play.misereDrop": {
    text: "ほかの列に空きがあるかぎり、相手が直前に置いた石の真上には打てません。",
    back: "As long as any other column has room, you cannot play directly on top of the stone the opponent just placed.",
    review: AGENT_READ,
  },
  "rulespage.play.misereFull": {
    text: "盤が埋まったら、先に打った方の勝ちです。",
    back: "If the board fills up, the player who played first wins.",
    review: AGENT_READ,
  },
  "rulespage.play.makerFull": {
    text: "列ができないまま盤が埋まれば、壊し手の勝ちです。",
    back: "If the board fills with no line, the Breaker wins.",
    review: AGENT_READ,
  },
  "rulespage.play.drawQuadrant": {
    text: "列ができないまま最後の手番まで終えて盤が埋まれば引き分けです。両方の色の列が同時にできた場合も引き分けです。",
    back: "If the board fills with no line after the last turn, it is a draw. If lines of both colours appear at once, that is also a draw.",
    review: AGENT_READ,
  },
  "rulespage.play.drawFull": {
    text: "列ができないまま盤が埋まれば引き分けです。",
    back: "If the board fills with no line, it is a draw.",
    review: AGENT_READ,
  },
  "rulespage.house.forbidden": {
    text: "{stone}は{patterns}を作る手を打てません。その点は盤上に印がつき、打てません。同じ石が禁じ手の形を同時に作る場合でも、五が完成すれば勝ちです。",
    back: "{stone} may not play a move that makes {patterns}. Those points are marked on the board and cannot be played. Even if the same stone would also make a forbidden shape, completing a five wins.",
    review: AGENT_READ,
  },
  "rulespage.house.chooseFirst": {
    text: "先に打つのは黒でも白でもよく、最初の石の色をくじで決めることもできます。",
    back: "Either black or white may play first, and the colour of the first stone can also be decided by lot.",
    review: AGENT_READ,
  },
  "rulespage.house.alwaysOpens": {
    text: "先に打つのは必ず{stone}です。",
    back: "The one who plays first is always {stone}.",
    review: AGENT_READ,
  },
  "rulespage.house.openings": {
    text: "選べる開局ルール：{names}。",
    back: "Opening rules you can choose: {names}.",
    review: AGENT_READ,
  },
  "rulespage.house.readingOn": {
    text: "脅威の読み、ヒント、勝率バーが使えます。",
    back: "The threat reading, hints and the win-rate bar can be used.",
    review: AGENT_READ,
  },
  "rulespage.house.readingOffFlips": {
    text: "脅威の読み、ヒント、勝率バーは使えません。ここには読むべき列がなく、数えるのは石の数だけです。",
    back: "The threat reading, hints and win-rate bar cannot be used. There are no lines to read here, only the number of discs to count.",
    review: AGENT_READ,
  },
  "rulespage.house.readingOffRace": {
    text: "脅威の読み、ヒント、勝率バーは使えません。ここには列がなく、あるのは進むべき距離だけです。",
    back: "The threat reading, hints and win-rate bar cannot be used. There are no lines here, only the distance to travel.",
    review: AGENT_READ,
  },
  "rulespage.house.readingOffConnects": {
    text: "脅威の読み、ヒント、勝率バーは使えません。ここには列がなく、あるのは自分の二辺がつながっているかどうかだけです。",
    back: "The threat reading, hints and win-rate bar cannot be used. There are no lines here, only whether your two sides are connected.",
    review: AGENT_READ,
  },
  "rulespage.house.readingOffCheckers": {
    text: "脅威の読み、ヒント、勝率バーは使えません。ここには列がなく、あるのは駒の跳び合いだけです。",
    back: "The threat reading, hints and win-rate bar cannot be used. There are no lines here, only pieces jumping.",
    review: AGENT_READ,
  },
  "rulespage.house.readingOffGo": {
    text: "脅威の読み、ヒント、勝率バーは使えません。ここには列がなく、あるのは石の一団、呼吸点、地だけです。",
    back: "The threat reading, hints and win-rate bar cannot be used. There are no lines here, only groups of stones, liberties and territory.",
    review: AGENT_READ,
  },
  "rulespage.house.readingOffMoving": {
    text: "脅威の読み、ヒント、勝率バーは使えません。石は置いたあとも動くので、列ごとの読みでは正しいことが分かりません。",
    back: "The threat reading, hints and win-rate bar cannot be used. Stones move after they are placed, so reading line by line does not tell you anything true.",
    review: AGENT_READ,
  },
  "rulespage.checkers.board": {
    text: "全{all}マスのうち、使うのは濃い色の{dark}マスだけです。各自、自陣の{rows}段を埋める{men}個のふつうの駒で始まります。",
    back: "Of {all} squares in all, only the {dark} dark squares are used. Each side starts with {men} ordinary pieces filling its own {rows} rows.",
    review: AGENT_READ,
  },
  "rulespage.checkers.step": {
    text: "1手で駒を1つ動かします。ふつうの駒は、斜め前の空いているマスへ1歩進みます。",
    back: "A turn moves one piece. An ordinary piece steps one square diagonally forward onto an empty square.",
    review: AGENT_READ,
  },
  "rulespage.checkers.forcedFree": {
    text: "駒を取るには、隣り合う相手の駒を飛び越えて、その先の空いているマスに着地します。取りは義務で、自分の駒のどれかが取れるなら、1歩進むのではなく必ず取る手を打ちます。どの取りを選ぶかは自由です。",
    back: "To capture, you jump over an adjacent enemy piece and land on the empty square beyond. Capturing is compulsory: if any of your pieces can capture, you must play a capture rather than a step. Which capture you choose is up to you.",
    review: AGENT_READ,
  },
  "rulespage.checkers.menBackward": {
    text: "ふつうの駒は、隣り合う相手の駒を飛び越えて、その先の空いているマスに着地して取ります。前にも後ろにも取れます。",
    back: "An ordinary piece captures by jumping an adjacent enemy piece and landing on the empty square beyond it. It can capture forward or backward.",
    review: AGENT_READ,
  },
  "rulespage.checkers.menForward": {
    text: "ふつうの駒は、隣り合う相手の駒を飛び越えて、その先の空いているマスに着地して取ります。取れるのは前方だけです。",
    back: "An ordinary piece captures by jumping an adjacent enemy piece and landing on the empty square beyond it. It can only capture forward.",
    review: AGENT_READ,
  },
  "rulespage.checkers.choiceMost": {
    text: "取りは義務で、しかも最も多く取る手を選ばなければなりません。盤上のすべての取りのうち、取る駒の数が最大のものだけを打てます。キングも、ふつうの駒と同じく1個として数えます。取る数が同じ手が複数あれば、自由に選べます。",
    back: "Capturing is compulsory, and you must also take the most you can. Of all the captures on the board, only one that takes the greatest number of pieces may be played. A king counts as one piece, the same as an ordinary piece. If several captures take the same number, you may choose.",
    review: AGENT_READ,
  },
  "rulespage.checkers.choiceFree": {
    text: "取りは義務で、自分の駒のどれかが取れるなら、1歩進むのではなく必ず取る手を打ちます。どの取りを選ぶかは自由で、長くても短くてもかまいません。",
    back: "Capturing is compulsory: if any of your pieces can capture, you must play a capture rather than a step. Which capture you choose is up to you, the longer or the shorter.",
    review: AGENT_READ,
  },
  "rulespage.checkers.crownStops": {
    text: "取った駒が、着地した場所からさらに取れるなら、同じ手の中で跳び続けます。途中でキングになったふつうの駒は、必ずそこで止まります。取りを続けられるのはキングだけで、それも次の手からです。",
    back: "A piece that captures and can capture again from where it lands keeps jumping in the same move. An ordinary piece that is crowned partway through always stops there. Only a king can carry a chain on, and only on a later move.",
    review: AGENT_READ,
  },
  "rulespage.checkers.crownPasses": {
    text: "取った駒が、さらに取れるなら、同じ手の中で向きを変えながら跳び続けます。途中で奥の段を通過したふつうの駒は、キングになりません。ふつうの駒のまま続け、取りがそこで終わったときだけキングになります。",
    back: "A piece that captures and can capture again keeps going in the same move, changing direction as needed. An ordinary piece that crosses the far row partway through is not crowned. It carries on as an ordinary piece and is crowned only if the capture ends there.",
    review: AGENT_READ,
  },
  "rulespage.checkers.crownAtOnce": {
    text: "取った駒が、さらに取れるなら、同じ手の中で向きを変えながら跳び続けます。途中で奥の段に着いたふつうの駒は、その場でキングになり、キングとして取り続けます。",
    back: "A piece that captures and can capture again keeps going in the same move, changing direction as needed. An ordinary piece that reaches the far row partway through is crowned at once and carries on capturing as a king.",
    review: AGENT_READ,
  },
  "rulespage.checkers.afterCapture": {
    text: "取った駒は、その手がすべて終わってから盤から取り除かれます。それまでは、取られる駒も盤上に残って邪魔になります。同じ駒を2度飛び越えることはできず、駒を通り抜けることもできません。",
    back: "The pieces captured come off the board only when the move is over. Until then each of them still stands in the way: no piece can be jumped a second time, and nothing can pass through one.",
    review: AGENT_READ,
  },
  "rulespage.checkers.crownFlying": {
    text: "手が奥の段で終わったふつうの駒は、キングになります。キングは飛びます。空いている斜めの線に沿って、前後どちらにも好きなだけ進め、どれだけ離れた駒でも取れて、その先の空いているマスのどこにでも着地できます。ただし、さらに取れる着地先があるなら、そこを選びます。",
    back: "An ordinary piece whose move ends on the far row is crowned a king. A king flies: along an open diagonal it can move any distance in either direction, capture a piece at any distance, and land on any empty square beyond it. But if there is a landing square from which it can capture again, it chooses that one.",
    review: AGENT_READ,
  },
  "rulespage.checkers.crownPlain": {
    text: "奥の段に着いたふつうの駒はキングになり、以後は前だけでなく後ろにも進み、取ることができます。",
    back: "An ordinary piece that reaches the far row is crowned a king, and from then on can step and capture backward as well as forward.",
    review: AGENT_READ,
  },
  "rulespage.checkers.gameEnd": {
    text: "ある色が動かせる駒をなくした瞬間に終局です。駒が1つも残っていないか、すべての駒が動けなくなった場合です。",
    back: "The game ends the moment a colour has no piece that can move. That is when none are left, or when every one is shut in.",
    review: AGENT_READ,
  },
  "rulespage.checkers.kingOne": {
    text: "キング1個",
    back: "one king",
    review: AGENT_READ,
  },
  "rulespage.checkers.kingMany": {
    text: "キング{count}個",
    back: "{count} kings",
    review: AGENT_READ,
  },
  "rulespage.checkers.manOne": {
    text: "ふつうの駒1個",
    back: "one ordinary piece",
    review: AGENT_READ,
  },
  "rulespage.checkers.manMany": {
    text: "ふつうの駒{count}個",
    back: "{count} ordinary pieces",
    review: AGENT_READ,
  },
  "rulespage.checkers.tally": {
    text: "{kings}と{men}",
    back: "{kings} and {men}",
    review: AGENT_READ,
  },
  "rulespage.checkers.against": {
    text: "{one}対{other}",
    back: "{one} against {other}",
    review: AGENT_READ,
  },
  "rulespage.checkers.kingsOrMore": {
    text: "キング{count}個以上対{against}",
    back: "{count} or more kings against {against}",
    review: AGENT_READ,
  },
  "rulespage.checkers.drawIdle": {
    text: "キングだけが動き、駒が1つも取られないまま、各自{moves}手が過ぎたら引き分けです。",
    back: "It is a draw once {moves} moves each have passed with only kings moving and no piece being captured.",
    review: AGENT_READ,
  },
  "rulespage.checkers.drawRepeat": {
    text: "同じ側の手番で同じ局面が3回目に現れたら引き分けです。",
    back: "It is a draw when the same position appears for the third time with the same side to move.",
    review: AGENT_READ,
  },
  "rulespage.checkers.drawBalance": {
    text: "両者にキングがいて駒が{pieces}個の終盤で、駒が取られず、ふつうの駒がキングにもならないまま、各自{moves}手が過ぎたら引き分けです。",
    back: "It is a draw when, in an ending where both sides have a king and there are {pieces} pieces, {moves} moves each pass with nothing captured and no ordinary piece crowned.",
    review: AGENT_READ,
  },
  "rulespage.checkers.drawCountFresh": {
    text: "{ending}の終盤で、さらに各自{moves}手のうちに勝負がつかなければ引き分けです。駒が取られるかキングになるたびに、数え直します。",
    back: "It is a draw when, in an ending of {ending}, the game is not decided within {moves} more moves each. The count starts again whenever a piece is captured or crowned.",
    review: AGENT_READ,
  },
  "rulespage.checkers.drawCountOnce": {
    text: "{ending}の終盤で、その終盤になってから各自{moves}手のうちに勝負がつかなければ引き分けです。",
    back: "It is a draw when, in an ending of {ending}, the game is not decided within {moves} moves each from when that ending arises.",
    review: AGENT_READ,
  },
};
