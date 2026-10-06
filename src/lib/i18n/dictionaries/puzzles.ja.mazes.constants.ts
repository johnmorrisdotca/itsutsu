import { thousands } from "../../ui/thousands";
import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import {
  MEIKYUU_COLOSSAL_LEVELS_A_SIZE,
  MEIKYUU_COLOSSAL_LEVELS_TOTAL,
  MEIKYUU_LEVELS_A_SIZE,
  MEIKYUU_SOLID_LEVELS_A_SIZE,
  MEIKYUU_SOLID_LEVELS_TOTAL,
  MEIKYUU_SQUARE_LEVELS_TOTAL,
  MEIKYUU_TALL_LEVELS_TOTAL,
} from "../../puzzles/meikyuu/levelCounts";
import { MEIKYUU_TALL_SHAPES } from "../../puzzles/meikyuu/sizes";
import { TOBIISHI_LEVELS_A_SIZE } from "../../puzzles/tobiishi/levelCounts";
import { TOBIISHI_SIZES } from "../../puzzles/tobiishi/sizes";

import type { PuzzleCopyJa } from "./puzzles.ja.types";

/**
 * The three set-up-by-level puzzles' words in Japanese: Suido, Meikyuu and
 * Tobiishi, the ones this site names in its own kanji (水道, 迷宮, 飛び石).
 */
const AGENT_READ = AGENT_READ_2026_10_06;

const MEIKYUU_LEVELS_TOTAL = MEIKYUU_SQUARE_LEVELS_TOTAL + MEIKYUU_TALL_LEVELS_TOTAL + MEIKYUU_COLOSSAL_LEVELS_TOTAL + MEIKYUU_SOLID_LEVELS_TOTAL;
const TALL_FROM = `${MEIKYUU_TALL_SHAPES[0]![0]}×${MEIKYUU_TALL_SHAPES[0]![1]}`;
const TALL_TO = `${MEIKYUU_TALL_SHAPES.at(-1)![0]}×${MEIKYUU_TALL_SHAPES.at(-1)![1]}`;
const TOBIISHI_LEVELS_TOTAL = TOBIISHI_LEVELS_A_SIZE * TOBIISHI_SIZES.length;

export const PUZZLE_COPY_JA_MAZES = {
  suido: {
    tagline: [
      "パイプを回して、ポンプからの水がすべての排水口に届き、どこからも漏れないようにします。14×14までの各サイズに256問、巨大な盤に64問のレベルがあります。そのつど新しい盤も作れます。",
      "Turn the pipes until the water from the pump reaches every drain and nothing leaks. Play 256 levels at every size up to 14×14 and sixty-four on the huge boards, or a new board each time.",
    ],
    inspiredBy: ["ネットやネットウォークとして知られるパイプ回しのパズル", "the pipe-turning puzzle known as Net or NetWalk"],
    origin: [
      "動かせない駒を回して、1つの網につなげるパズルです。パズル集に「ネット」や「ネットウォーク」などの名で、長く載っています。水道は、水を町に運ぶ設備のことで、水は水、道は道すじなので、文字どおりには水の道です。ここの盤は、このサイトのコードが作り、どれも答えがちょうど1つで、水は流れるように描かれます。そのうち3,520問は固定のレベルで、1度作って、答えがちょうど1つであることを確かめてあります。",
      "A puzzle of turning fixed pieces until they join into one network, found in puzzle collections for many years under names such as Net and NetWalk. 水道 is Japanese for waterworks: 水 is water and 道 a way, so literally a water way. The boards here are made by our own code, each with exactly one answer, and the water is drawn flowing. 3,520 of them are fixed levels, made once and proved to have exactly one answer.",
    ],
    rules: [
      [
        "どのマスにもパイプの駒があります。駒は動かしたり変えたりできず、回すだけです。ポンプは、水が出てくるところです。",
        "Every square holds a piece of pipe. A piece is never moved or changed, only turned, and the pump is where the water comes from.",
      ],
      [
        "駒をタップすると、時計回りに4分の1回転します。盤の下の「反時計回り」を選ぶか、Shiftを押しながらクリックするか、マウスの右クリックで、逆向きに回ります。キーボードでは、矢印キーで動き、Enterで回し、Shiftを押しながらEnterで戻します。",
        "Tap a piece to turn it a quarter clockwise. Choose Anticlockwise under the board to turn the other way, or Shift-click or right-click with a mouse. With the keyboard, the arrow keys move, Enter turns a piece and Shift with Enter turns it back.",
      ],
      [
        "水は、口が合っているところから次の駒へ流れます。何ともつながらない口からは、水があふれます。盤の端、何もない地面、口が合わない駒などです。しずくが、その場所を示します。",
        "The water goes from one piece into the next wherever their openings meet. It runs out of any opening that meets nothing: the edge of the board, bare ground, or a piece that does not open back. A drip shows where.",
      ],
      [
        "「排水口」は、ふつうの形です。水がすべての排水口に届き、濡れた駒から水が漏れないことが条件です。水が必要ない駒は予備で、どの向きでもかまいません。何もない地面には、何も置かれません。",
        "Drains, the usual kind: the water must reach every drain, and nothing wet may run out. Pieces the water does not need are spares, left facing any way, and bare ground has nothing on it.",
      ],
      [
        "「網」は、もう1つの形です。すべての駒が濡れなければならないので、予備はなく、何も漏れてはいけません。",
        "Network, the other kind: every piece must be wet, so there are no spares and nothing may run out.",
      ],
      [
        "「大きな駒」は、「盤を作る」で選び、いつも網です。4マスぶんの大きさで1つの駒となり、1辺に2つずつ、最大8つの口があるものがあります。どの部分をタップしても、その場で、駒全体が4分の1回転します。下の板と、真ん中の輪が目印です。",
        "Big pieces, chosen in Make a board and always a network: some pieces fill four squares and have up to eight openings, two on each side. Tap any part of one to turn the whole piece a quarter, where it stands. A plate under it and a ring at its middle mark it.",
      ],
      [
        "「ブロック回転」も、「盤を作る」で選び、いつも網です。4つの駒でできた四角が、破線の輪で囲まれ、真ん中に回転の印がついています。4つのどれをタップしても、4つがいっしょに4分の1回転し、各駒は次の場所へ回って移ります。この4つは、単独では回せません。ヒントは、ブロックを回します。",
        "Block turns, also chosen in Make a board and always a network: some squares of four pieces are ringed by a dashed line, with a turning mark at their middle. A tap on any of the four turns all four together a quarter: each piece moves round to the next place as it turns. Those four cannot be turned on their own, and a Hint turns the block.",
      ],
      [
        "レベルは、どのサイズにも決まったものがあります。14×14までは256問、巨大な盤（20×20、28×28、細長い20×50）は64問です。やさしい順に並び、全員が同じなので、自分のタイムをほかの人と比べられます。16問ずつのブロックで、前のブロックのレベルをすべて解くと、次のブロックが開きます。レベルには、ひねりが入ることがあり、盤の下のチップに名前が出ます。「ポンプ」は、ポンプが複数あり、それぞれ自分のパイプに水を送ります。「固定された駒」は、錠前がついていて、回せません。向きはすでに正しいので、そこから組み立てます。「壁」は、水が越えられません。「端がつながる」は、破線の縁で表されます。片側から出た水は、反対側から入ります。「入口から出口へ」は、左上から右下まで、枝分かれのない1本の道で、ほかの駒はおとりで、濡れません。ブロックの15問めがひねりを紹介し、16問めがそれを試します。",
        "Levels: every size has fixed levels, 256 of them up to 14×14 and sixty-four on the huge boards (20×20, 28×28 and the long 20×50), easy to hard and the same for everybody, so a time on one can be compared with anybody's. They come in blocks of 16, and a block opens when every level of the block before it is solved. A level can have a twist, named in a chip under the board: Pumps, more than one, each feeding its own pipes. Locked pieces, which wear a padlock, cannot be turned and already face the right way, so build from them. Walls, which water cannot cross. Edges join, drawn with a dashed rim: water leaving one side comes in at the opposite one. Inlet to outlet, one path with no branch from the top left to the bottom right, the other pieces being decoys that stay dry. The 15th level of a block shows its twist and the 16th tests it.",
      ],
      [
        "「大きな駒」のレベルは、定番のレベルとは別の、64レベルのもう1つのセットで、設定画面で選びます。どのレベルにも、ふつうの駒のあいだに大きな駒があり、5×5から20×20まで、あらゆるサイズにまたがって、やさしい順に並びます。進むほど、大きな駒の数が増え、形も複雑になります。大きな駒の中には、つながっていないパイプが1本、2本、または3本あり、近くを通っていても、片方の水がもう片方に届くことはありません。下に、すべての駒を描いています。",
        "Big-pieces levels are a second set of sixty-four, chosen on the set-up beside the classic levels: every one has big pieces among its ordinary ones, from the easiest to the hardest across every size from 5×5 to 20×20, with more big pieces, and trickier ones, as the levels climb. A big piece holds one, two or three separate pipes, and the water in one never reaches another, however close. Below, every piece is drawn.",
      ],
      [
        "水が、その形が求めるところに届き、どこからも漏れなくなった瞬間に完成です。どのレベルも盤も、答えはちょうど1つで、時計は最初の1回転で動き出します。",
        "It is solved the moment the water reaches what its kind asks and nothing runs out. Every level and every board has exactly one answer, and the clock starts on your first turn.",
      ],
      [
        "レベルの横にある「盤を作る」は、選んだサイズとレベルで新しい盤を作ります。そこで選ぶと、ヒントは、ポンプにいちばん近い駒から、答えの向きに1つ回し、ヒント1回分の点がかかります。レベルにヒントも時計の制限もありません。",
        "Make a board, beside the levels, makes a new one at a size and a level you choose, and Hint, if chosen there, turns one piece to face the way the answer has it, starting nearest the pump, and costs a hint. A level has no hint and no clock.",
      ],
    ],
    board: [
      "7×7が普段の大きさです。5×5は手早く、9×9は長め、12×12は夜長向きです。スマートフォンでは、10×10以上の盤は拡大され、盤の下の「全体」と矢印で動かします。巨大な20×20、28×28、20×50は、つまむ、ドラッグする、3つのボタンで、拡大して動かします。サイズは16種類で、5×5から14×14、巨大な20×20と28×28、そして縦長の5×7、6×10、8×14、20×50です。「排水口」は予備の駒が残るので、見るべきところが絞れます。「網」はすべての駒を使うので、無視できる駒がありません。「大きな駒」は4マスぶんで、「ブロック回転」は、4つの駒が輪で囲まれて、いっしょに回ります。どちらも網になります。",
      "7×7 is the usual size. 5×5 is quick, 9×9 is longer, and 12×12 is an evening; on a phone a board of 10×10 or more zooms, with Fit and the arrows under the board, and the huge 20×20, 28×28 and 20×50 zoom and move by a pinch, a drag and three buttons. There are 16 sizes, 5×5 to 14×14, the huge 20×20 and 28×28, and four long boards taller than they are wide, 5×7, 6×10, 8×14 and 20×50. Drains leaves spare pieces to see past; network uses every piece, so it has no spares to ignore. Big pieces fill four squares, and block turns ring four pieces that turn together; both make a network.",
    ],
    review: AGENT_READ,
    ask: "The new rules paragraph about the Big pieces levels (rules[8]) and the description of the Big pieces set chip on the set-up (Suido screen: sets.big.says) were written for the 64 levels with big pieces and read by the agent only: a native read is wanted, mainly on 設定画面で選びます, 定番 for Classic (as in Tsunagi) and 大きな駒 as the one term for big pieces (the kanji beside the English name is now 大きな駒 too).",
  },
  meikyuu: {
    tagline: [
      `指かマウスで、迷路にスタートからゴールまで線を引きます。${thousands(MEIKYUU_LEVELS_TOTAL)}問のレベルがあり、四角、六角形、三角形、円、それを切り抜いた形があります。スマートフォンを縦に持つための縦長、約1万マスの巨大なもの、立方体、球などの立体の上の迷路もあり、立体は回して線をたどります。`,
      `Draw a line through a maze from the start to the goal, with your finger or the mouse. ${thousands(MEIKYUU_LEVELS_TOTAL)} levels, in squares, hexagons, triangles, circles and shapes cut out of them, tall ones for a phone held upright, colossal ones of about ten thousand cells, and mazes over a cube, a sphere and other solids that you turn to follow your line.`,
    ],
    inspiredBy: ["スタートからゴールまで、鉛筆で線を引いて通り抜ける迷路", "the maze drawn through with a pencil, from its start to its goal"],
    origin: [
      "線を引いて通り抜ける迷路は、紙の上のパズルでもっとも古いもののひとつです。迷宮は、ラビリンスを表す日本語です。迷は迷うこと、宮は宮殿で、迷わせる宮殿という意味です。日本のゲームでは、プレイヤーが降りていく場所のことばとしてよく使われます。ここの迷路は、迷路づくりのアルゴリズムでよく知られる7つの方法で作っています。Jamis Buckの解説とWalter Pullenの「Think Labyrinth」にある方法です。数マスから数千マスまであり、レベルは短い作り方の記述で、誰にとっても同じ迷路ができます。",
      "A maze to draw a way through is among the oldest puzzles on paper. 迷宮 (meikyū) is Japanese for labyrinth: 迷 is to get lost and 宮 a palace, so a bewildering palace, and it is the word Japanese games use for the place a player goes down into. The mazes here are made by seven well-known methods, the ones described in Jamis Buck's writing on maze algorithms and Walter Pullen's Think Labyrinth, from a few cells to thousands, and each level is a short recipe that makes the same maze for everybody.",
    ],
    rules: [
      [
        "スタートからゴールまで線を引きます。どの迷路も、抜け道はちょうど1つなので、答えもちょうど1つです。",
        "Draw a line from the start to the goal. Every maze has exactly one way through, so there is exactly one answer.",
      ],
      [
        "スタート、または線の端を押して、ドラッグします。線は通路に沿って進み、壁は通れず、戻ると短くなります。通路の先をタップすると、次の分かれ道までの線が引かれます。分かれ道は、代わりには選ばれません。",
        "Press the start, or the end of your line, and drag. The line follows the corridors, cannot pass a wall, and drawing back shortens it. Tap a spot further along a corridor and the line runs to it, stopping at the next fork, never choosing a fork for you.",
      ],
      [
        "レベルの遊び方は4通りあります。外壁の1つの出入口から入って、別の出入口から出る。迷路の中のマスから、奥深くに隠れた点まで行く。形の真ん中から、出入口を通って出る。中から出発して、途中の鍵をすべて拾って、出入口へ向かう。鍵は、分かれ道の先にあり、道からそれたところにあるので、1つ拾うたびに回り道になります。戻っても、拾った鍵は、そのままです。",
        "A level is played one of four ways: in at one door in the outer wall and out at another; from a cell inside to a dot hidden deep in the maze; from the middle of the shape out through a door; or from inside, picking up every key on the way to a door. A key is at the end of a branch, off the way, so each one costs a detour, and stays picked up when you draw back.",
      ],
      [
        "大きな迷路は、盤を通して見ます。ホイール、つまむ操作、「＋」と「－」のボタンで拡大縮小し、2本の指か、線以外の場所のドラッグで、見る場所を動かします。「全体」で、迷路全体に戻ります。引いている線が端に近づくと、いっしょに見る場所が動きます。",
        "A big maze is looked at through the board. Zoom with the wheel, a pinch, or the + and − buttons, and move the view with two fingers or by dragging anywhere but the line. Fit brings the whole maze back, and near the edge a line you are drawing moves the view with it.",
      ],
      [
        "「元に戻す」は直前の1本を戻し、「やり直す」は線を全部消します。キーボードも使えます。矢印キーで線が進み、Backspaceで戻ります。",
        "Undo takes back your last stroke and Restart clears the line. The keyboard works too: the arrow keys step the line, and Backspace undoes.",
      ],
      [
        "立体の上では、迷路は立方体、球、八面体、二十面体の表面全体にあり、一度に見えるのは片側だけです。ふだんどおりに線を引き、線の端以外の場所を、ドラッグするか、2本の指か、矢印ボタンで、立体を回します。「こちらを向く」は、線の端が自分のほうを向くよう回します。見えている面の端に線が届くと、立体が自分で回るので、指を離さずに面をまたいで線が引けます。「回すだけ」は、ドラッグがすべて立体を回すだけになります。",
        "Over a solid, the maze is on the whole surface of a cube, a sphere, an octahedron or an icosahedron, and you see one side of it at a time. Draw as you would, and turn the solid by dragging anywhere that is not the end of your line, with two fingers, with the arrow buttons, or with Face me, which brings the end of your line round to face you. When your line reaches the edge of the side you can see, the solid turns by itself, so the line can cross from one face to the next without letting go. Turn only makes every drag turn the solid.",
      ],
      [
        "石：行き止まりの通路は、石でふさげます。「石」を押して線のそばのマスをタップするか、指をそこに押し続けるか、Shiftを押しながら線の端で矢印キーを押します。石を置けるのは、線から通路に沿って最大2マスまでで、同時に置ける数にも上限があります。線は石の中に入れません。石をタップすると取り上げます。石は自分のための補助で、答えには入りません。",
        "Stone: when a passage is a dead end, you can shut it with a stone. Press Stone and tap a cell beside your line, or hold a finger on it, or hold Shift and press an arrow key at the end of your line. A stone goes at most two cells along the passages from your line, only so many at once, and the line cannot enter it. Tap a stone to take it up. A stone is only a help for you and is never part of your answer.",
      ],
      [
        `決まったレベル：${thousands(MEIKYUU_LEVELS_TOTAL)}問あり、全員が同じです。4つのサイズが各${MEIKYUU_LEVELS_A_SIZE}問、6つの縦長のサイズが各${MEIKYUU_LEVELS_A_SIZE}問、2つの巨大なサイズが各${MEIKYUU_COLOSSAL_LEVELS_A_SIZE}問、4つの立体の3つのサイズが各${MEIKYUU_SOLID_LEVELS_A_SIZE}問です。どのサイズも、前より易しいレベルがないよう、やさしい順から難しい順に並んでいます。レベルにはヒントも時計の制限もないので、誰とでもタイムを比べられます。`,
        `Fixed levels: ${thousands(MEIKYUU_LEVELS_TOTAL)} of them, the same for everybody: ${MEIKYUU_LEVELS_A_SIZE} in each of four sizes, ${MEIKYUU_LEVELS_A_SIZE} in each of six tall ones, and ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} in each of two colossal ones, and ${MEIKYUU_SOLID_LEVELS_A_SIZE} in each of three sizes of four solids, each size ordered from easy to hard so that no level is easier than the one before. A level has no hint and no clock, so a time on it is one anybody can be compared with.`,
      ],
      [
        "時計は最初の1本で動き出し、鍵をすべて拾って線がゴールに届いた瞬間に、そのレベルは完成です。",
        "The clock starts with your first stroke, and the level is solved the moment the line reaches the goal, with every key picked up.",
      ],
    ],
    board: [
      `小さな迷路は150マス未満で、手早く遊べます。中くらいは800マス未満、大きいは4000マス未満、巨大なものは数千マスで、拡大して遊ぶためのものです。サイズごとに、やさしいレベルから難しいレベルまで並び、四角、六角形、三角形、円のほか、ハート、葉、星、輪、ひし形、十字、月の形も出てきます。縦長は、スマートフォンを縦に持つためのもので、横2列に縦3行の比で、${TALL_FROM}から${TALL_TO}のマスの6つのサイズがあり、画面が広いときは、自動で横に倒れます。超巨大なものは、いちばん大きく、約1万マスで、四角い箱と縦長の箱があります。時間がかかるので、拡大と、いくつかの石が役に立ちます。立体は、立方体、球、八面体、二十面体で、それぞれ約100マスの小、約300マスの中、約650マスの大があります。`,
      `Small mazes have under 150 cells and are the quick ones; medium ones under 800; large under 4,000; and huge ones run to thousands of cells and are meant to be zoomed. Within a size the levels run from easy to hard, and every shape turns up: squares, hexagons, triangles and circles, and a heart, a leaf, a star, a ring, a diamond, a cross and a moon. The tall ones are for a phone held upright, two columns to three rows, in six sizes from ${TALL_FROM} to ${TALL_TO} cells, and turn on their side by themselves on a wide screen. The colossal ones are the biggest there are, about ten thousand cells, in a square box and a tall one: they take a while, and want zooming and a few stones. The solids are the cube, the sphere, the octahedron and the icosahedron, each in a small size of about a hundred cells, a medium one of about three hundred and a large one of about six hundred and fifty.`,
    ],
    review: AGENT_READ,
  },
  tobiishi: {
    tagline: [
      `駒を、となりの駒を飛び越えて空いた穴へ跳ばし、跳ばした駒を取ります。最後に1つの駒が、ゴールの穴に残れば完成です。9つの盤に、${TOBIISHI_LEVELS_TOTAL}の名前つきのレベルがあります。`,
      `Jump pegs over each other into empty holes, taking each one you jump, until one peg is left in the goal. ${TOBIISHI_LEVELS_TOTAL} named levels on nine boards.`,
    ],
    inspiredBy: ["ペグソリティア", "peg solitaire"],
    origin: [
      "ペグソリティアは、何百年も遊ばれてきた1人用のパズルです。1600年代後半のフランスの王女の肖像画には、その盤がそばに描かれています。33の穴の英国式の十字と、37の穴のフランス式の盤が、いまもいちばんよく売られています。飛び石は、庭の流れに置かれた石のことで、このサイトでつけた名前です。駒が、次の駒を飛び越えて盤を渡る動きと同じです。ここのレベルは、このサイトのパッケージから出した短いもので、どれもゴールから逆向きに作ってあるので、必ず解けます。",
      "Peg solitaire is a puzzle for one that has been played for centuries: a portrait of a French princess from the late 1600s shows the board beside her, and the English cross of 33 holes and the French board of 37 are still the ones most often sold. 飛び石 (tobiishi) is Japanese for stepping stones, the stones laid across a garden stream, and a name of our own for it: a peg crosses the board the same way, over one to the next. The levels here are short ones from a package of ours, each made backward from its goal so that it always has a way through.",
    ],
    rules: [
      [
        "駒を、となりの駒を飛び越えて、そのすぐ先の空いた穴に跳ばし、飛び越えた駒を盤から取ります。1回跳ぶごとに、ちょうど1つの駒を取ります。",
        "Jump a peg over the peg next to it, into the empty hole straight beyond, and take the peg you jumped off the board. Every jump takes exactly one peg.",
      ],
      [
        "最後に、ゴールの穴に駒を1つだけ残します。ゴールは、破線の輪で描かれた穴です。ほかの場所に1つ残っても、完成ではありません。",
        "Leave one peg, in the goal: the hole drawn with a dashed ring. One peg anywhere else is not a solution.",
      ],
      [
        "駒をタップして、跳ばしたい穴をタップします。跳べる穴には輪がつきます。駒をドラッグして、穴の上で離しても跳ばせます。キーボードでは、Tabで盤に移り、矢印キーで動き、駒の上でEnterかスペースを押し、次に穴の上で押します。やめるときはEscapeです。",
        "Tap a peg, then the hole it should jump to; the holes it can reach are ringed. Or drag the peg across, and let go over the hole. With the keyboard, Tab to the board, move with the arrow keys, press Enter or Space on a peg and then on the hole, and Escape to change your mind.",
      ],
      [
        "四角い盤では、駒は縦と横に跳びます。三角形と六角形の盤では、斜めの線にも跳び、全部で6方向です。空いた穴を飛び越えることはできず、2つの駒をいちどに飛び越えることもできません。",
        "Pegs jump along the rows and columns of a square board. On the triangle and the hexagon a peg also jumps along the slanted lines, six ways in all. A peg never jumps over an empty hole, and never over two pegs at once.",
      ],
      [
        `レベル：${TOBIISHI_LEVELS_TOTAL}問あり、全員が同じです。9つの盤にはそれぞれ、ゴールの穴が3つあり、3つの長さがあります。ゴールまでのいちばん短い手が、3手、6手、9手です。ゴールに駒が1つ残る、正しい跳び方なら、作られたときの手順でなくても、すべて完成として認められます。`,
        `Levels: ${TOBIISHI_LEVELS_TOTAL} of them, the same for everybody. Each of the nine boards has three goal holes to finish in, at three lengths: the shortest way to the goal is 3 jumps, 6 or 9. Any run of legal jumps that leaves one peg in the goal solves it, not only the way the level was made.`,
      ],
      [
        "「元に戻す」は、直前の跳びを何度でも戻し、「やり直す」は、駒を最初の配置に戻します。ヒントも、時計の制限もないので、レベルのタイムは、誰とでも比べられます。時計は最初の1回の跳びで動き出します。",
        "Undo takes back your last jump, as many as you like, and Restart sets the pegs out again. There is no hint and no clock to run out, so a time on a level is one anybody can be compared with. The clock starts with your first jump.",
      ],
      [
        "跳べる駒がなく、駒が2つ以上残っているときは、行き詰まりです。「元に戻す」で戻って、別の順番で試してください。",
        "If no jump is left and there is more than one peg, you are stuck: Undo and try another order.",
      ],
    ],
    board: [
      "盤は、英国式の十字、三角形、ヨーロッパ式の盤、ひし形、ハート、星、六角形、横長と縦長の長方形です。短いレベル（3手）は、最大49の穴の盤に駒が4つで、手早く遊べます。長いレベル（9手）は駒が10個で、正しい順番を見つける必要があります。どのレベルにも、少なくとも1つの答えがあります。ゴールから逆向きに作ってあるからです。",
      "The boards are the English cross, a triangle, the European board, a diamond, a heart, a star, a hexagon, and a wide and a tall rectangle. A short level (3 jumps) has four pegs on a board of up to 49 holes, and is quick; a long one (9 jumps) has ten, and the right order has to be found. Every level has at least one answer, because it was made by working backward from the goal.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Partial<Record<string, PuzzleCopyJa>>;
