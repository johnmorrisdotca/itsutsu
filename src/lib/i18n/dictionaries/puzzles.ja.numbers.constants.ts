import { AGENT_READ_2026_10_06 } from "../copyJa.types";

import type { PuzzleCopyJa } from "./puzzles.ja.types";

/**
 * The number and stone puzzles' words in Japanese: Number Place and its four
 * cousins, Hidden Stones, Black and White. Terms follow
 * `docs/plans/en-ja-everywhere/TERMS.md`: マス for a cell, 行 and 列 for a row
 * and a column, ブロック for a Sudoku box, 区画 for a region, 石 for a stone.
 * The name of the first is ナンプレ and never the publisher's own title for it.
 */
const AGENT_READ = AGENT_READ_2026_10_06;

const CHECK_LINE: [string, string] = [
  "時計は最初の入力で動き出し、最後のマスが正しくなると止まります。チェックは、まちがっているマスの数だけを教えます。どのマスかは教えません。",
  "The clock starts on the first entry and stops when the last cell is right. Check tells you how many cells are wrong, only; it does not say which.",
];

export const PUZZLE_COPY_JA_NUMBERS = {
  numberPlace: {
    tagline: [
      "すべての行・列・ブロックに、それぞれの数字が1つずつ入るように盤を埋めます。遊ぶのは1人、答えは1つです。",
      "Fill the grid so every row, column and block holds each number once. One person plays, and there is one answer.",
    ],
    origin: [
      "Howard Garnsが考えた数字のパズルが、1979年にDell社の雑誌に載りました。1984年にニコリが日本へ持ち込み、そこから世界中に広まりました。",
      "A number puzzle devised by Howard Garns appeared in a Dell magazine in 1979. Nikoli brought it to Japan in 1984, and from there it spread round the world.",
    ],
    rules: [
      [
        "空いているマスに、1から盤の1辺の数までの数字を入れます。どの行にも、どの列にも、どのブロックにも、それぞれの数字がちょうど1つずつ入ります。",
        "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each block holds every number exactly once.",
      ],
      [
        "最初から入っている数字は動かせません。ここのパズルは、どれも答えがちょうど1つだけです。",
        "The numbers already in are fixed and cannot be moved. Every puzzle here has exactly one answer.",
      ],
      [
        "16×16の「特大」には16種類の記号があり、1から9のあとは、10から16がAからGです。25×25の「巨大」には25種類あり、10から25がAからPです。文字を打つか、そのキーを押します。",
        "The 16×16 Giant has sixteen symbols: after 1 to 9, 10 to 16 are A to G. The 25×25 Colossus has twenty-five: 10 to 25 are A to P. Type the letter or press its key.",
      ],
      [
        "初級では当て推量はいりません。どのマスも、すでにある数字から考えて見つかります。中級と上級では、1つ試してみて確かめる場面があります。",
        "On easy you never have to guess: every cell can be found by reasoning from what is already there. Medium and hard have places where you try one and see.",
      ],
      CHECK_LINE,
    ],
    board: [
      "3×3のブロックがある9×9は、誰もが知っている形です。2×2のブロックの4×4は1分で終わるので、子どもに最初に渡すならこれです。縦2マス・横3マスのブロックの6×6は、その中間です。16×16の「特大」は4×4のブロックで、9のあとにAからGが並びます。マスが指で押せる大きさになるタブレットかパソコン向きです。25×25の「巨大」は5×5のブロックで、文字はPまで続きます。スマートフォンでは拡大して動かして遊びます。初級なら、これも見るだけで解けます。",
      "9×9 with 3×3 blocks is the puzzle everybody knows. 4×4 with 2×2 blocks is over in a minute, so it is the one to hand a child; 6×6, with blocks two cells tall and three wide, sits in between. The 16×16 Giant has 4×4 blocks and runs A to G after 9; it suits a tablet or a computer, where the cells are big enough to press. The 25×25 Colossus has 5×5 blocks and the letters run to P; on a phone you zoom in and move about. An easy one is still solved by looking alone.",
    ],
    review: AGENT_READ,
    ask: "The English origin says Nikoli named it Sudoku. The Japanese says only that Nikoli brought it to Japan, because 数独 is Nikoli's trademark (TERMS.md): is that the wording John wants?",
  },
  hiddenStones: {
    tagline: [
      "どの行にも、どの列にも、どの区画にも黒い石が1つ隠れています。石どうしは触れません。",
      "One black stone hides in every row, every column and every region, and no two stones touch.",
    ],
    origin: [
      "Hans Eendebakが2003年に作った「スターバトル」の、星が1つの形です。2024年に毎日遊ぶ版が出て、広く親しまれました。",
      "The one-star form of Hans Eendebak's Star Battle of 2003. A daily version in 2024 made it a habit for many.",
    ],
    rules: [
      ["すべての行、すべての列、すべての区画に、黒い石を1つずつ置きます。", "Place one black stone in every row, every column and every region."],
      ["石どうしは、角が触れ合うのも含めて、隣り合ってはいけません。", "No two stones may be next to each other, corners touching included."],
      [
        "答えはちょうど1つです。マスをタップすると石、もう一度で×印（石がないと決めたマスの印）、もう一度で消えます。すべての行の石が正しくなると完成です。",
        "There is exactly one answer. Tap a cell once for a stone, again for a ✕ mark (a cell you have ruled out), and again to clear it. It is done when every row's stone is right.",
      ],
      [
        "初級は、見るだけで解けます。上級では、どこかに石を1つ試してみて確かめる必要があります。",
        "Easy ones yield to looking alone; hard ones need you to try a stone somewhere and see.",
      ],
    ],
    board: [
      "7×7が普段の大きさです。4×4は初めての1問で、初級だけです。12×12は夜長に向いています。",
      "7×7 is the everyday size. 4×4 is a first puzzle, easy only; 12×12 suits a long evening.",
    ],
    review: AGENT_READ,
  },
  moreOrLess: {
    tagline: [
      "正方形の盤の、どの行にも列にも数字が1つずつ入り、不等号がすべて正しくなるように埋めます。",
      "Fill the square so every row and column holds each number once, and every inequality sign is true.",
    ],
    origin: [
      "ニコリが載せた、2001年のTamaki Seimiyaのパズル「不等式」を、ここの形にしたものです。",
      "Our version of Futoshiki (不等式), the puzzle Tamaki Seimiya made in 2001, which Nikoli published.",
    ],
    rules: [
      [
        "どのマスにも、1から正方形の1辺の数までの数字を入れます。どの行にも、どの列にも、それぞれの数字がちょうど1つずつ入ります。",
        "Fill every cell with a number from 1 up to the side of the square, so that each row and each column holds every number exactly once.",
      ],
      [
        "2つのマスのあいだの印は、どちらが大きいかを表します。開いた側が大きい数、とがった側が小さい数に向いています。",
        "A sign between two cells says which is bigger: the open side faces the larger number, the point faces the smaller.",
      ],
      [
        "答えはちょうど1つです。印も最初の数字も、どれも答えにたどり着くのに必要です。",
        "There is exactly one answer, and every sign and every number given is needed to reach it.",
      ],
    ],
    board: ["5×5が普段の大きさです。4×4は手早く、7×7は長めです。", "5×5 is the usual size. 4×4 is quick; 7×7 is the long one."],
    review: AGENT_READ,
  },
  jigsaw: {
    tagline: [
      "ナンプレのブロックを、ふぞろいな形の区画に変えたものです。どの行・列・区画にも、それぞれの数字が1つずつ入ります。",
      "Number Place with the blocks cut into irregular regions: every row, column and region holds each number once.",
    ],
    origin: [
      "ふつうの盤のブロックを、ふぞろいな形に置き換えたものです。ノノミノやジグソーなどの名で載ってきました。ブロックがないので、きれいに割り切れない1辺でもよく、5と7の大きさもあります。",
      "The plain grid with its blocks traded for irregular shapes, printed under names such as Nonomino and Jigsaw. With no blocks it is not tied to sides that divide evenly, so it comes in fives and sevens too.",
    ],
    rules: [
      [
        "空いているマスに、1から盤の1辺の数までの数字を入れます。どの行にも、どの列にも、太線で囲まれたどの区画にも、それぞれの数字がちょうど1つずつ入ります。",
        "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each region outlined in heavy lines holds every number exactly once.",
      ],
      [
        "区画は太い線で描かれていて、どれも盤の幅と同じ数のマスでできた、それぞれ違う形です。",
        "The regions are drawn in heavy lines, and each is a different shape made of as many cells as the grid is wide.",
      ],
      [
        "答えはちょうど1つです。初級は考えるだけで解けます。中級と上級では、何かを試してみて確かめる必要があります。",
        "There is exactly one answer. Easy yields to reasoning alone; medium and hard need you to try something and see.",
      ],
      CHECK_LINE,
    ],
    board: [
      "7×7が普段の大きさです。5×5は手早く、9×9はおなじみの盤のブロックを切り分けた形です。",
      "7×7 is the usual size. 5×5 is quick; 9×9 is the familiar grid with its blocks cut up.",
    ],
    review: AGENT_READ,
  },
  diagonal: {
    tagline: [
      "ナンプレに、対角線の2本にもそれぞれの数字が1つずつ入る、という決まりを足したものです。",
      "Number Place with one more rule: the two long diagonals must hold each number once too.",
    ],
    origin: [
      "ふつうの盤にいちばんよく足される決まりで、2本の対角線もひとつの組として数えます。新聞では「X」をつけた名で載り、Daily Mail紙は6×6で載せています。",
      "The commonest extra rule laid on the plain grid: the two diagonals count as groups too. Newspapers print it under a name with an X added, and the Daily Mail prints it at 6×6.",
    ],
    rules: [
      [
        "空いているマスに、1から盤の1辺の数までの数字を入れます。どの行にも、どの列にも、どのブロックにも、それぞれの数字がちょうど1つずつ入ります。",
        "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each block holds every number exactly once.",
      ],
      [
        "角から角へ色がついた2本の長い対角線にも、それぞれの数字がちょうど1つずつ入ります。",
        "The two long diagonals, shaded from corner to corner, must also each hold every number exactly once.",
      ],
      [
        "答えはちょうど1つで、対角線も答えを出す手がかりです。そのぶん、ふつうの盤より最初の数字は少なめです。",
        "There is exactly one answer, and the diagonals are part of reaching it: fewer numbers are given than a plain grid would need.",
      ],
      CHECK_LINE,
    ],
    board: [
      "9×9が普段の大きさです。縦2マス・横3マスのブロックの6×6が、手早い大きさです。",
      "9×9 is the usual size; 6×6, with blocks two cells tall and three wide, is the short one.",
    ],
    review: AGENT_READ,
  },
  sumCages: {
    tagline: [
      "数字は1つも入っていません。点線の枠（ケージ）それぞれの中の数字の合計が、手がかりです。",
      "No numbers are given: dashed cages each say what the numbers inside them add up to.",
    ],
    origin: [
      "1990年代に日本で、合計を手がかりにする形で遊ばれ、2005年にThe Times紙が「キラー」の名で、ふつうの盤の隣に毎日載せて広まりました。",
      "Played in Japan in the 1990s in a form where the sums are the clues, and made famous in 2005 when The Times printed it daily as Killer beside the plain grid.",
    ],
    rules: [
      [
        "どのマスにも、1から盤の1辺の数までの数字を入れます。どの行にも、どの列にも、どのブロックにも、それぞれの数字がちょうど1つずつ入ります。",
        "Fill every cell with a number from 1 up to the side of the grid, so that each row, each column and each block holds every number exactly once.",
      ],
      [
        "点線で囲まれた枠がケージです。ケージの角にある小さな数字が、中の数字の合計です。同じケージの中に、同じ数字は2回入りません。",
        "The dashed outlines are cages. The small number in a cage's corner is the sum of the numbers inside it, and no number appears twice in one cage.",
      ],
      [
        "盤にはほとんど数字がありません。合計が手がかりです。答えはちょうど1つで、難しいレベルほど、ケージは少なく大きくなります。",
        "Almost nothing is printed on the grid: the sums are the clues. There is exactly one answer, and the harder levels have fewer, bigger cages.",
      ],
      CHECK_LINE,
    ],
    board: [
      "9×9が普段の大きさです。縦2マス・横3マスのブロックの6×6が、手早い大きさです。",
      "9×9 is the usual size; 6×6, with blocks two cells tall and three wide, is the short one.",
    ],
    review: AGENT_READ,
  },
  towers: {
    tagline: [
      "数字はどれもビルの高さです。盤の外側の数字は、そこから見えるビルの数を表します。",
      "Every number is a building's height. The numbers around the edge say how many buildings can be seen from there.",
    ],
    origin: [
      "1992年の第1回世界パズル選手権に出た、日本の論理パズルです。英語では「スカイスクレイパー」の名で知られ、Simon Tathamのパズル集では「タワーズ」といいます。",
      "A Japanese logic puzzle set at the first World Puzzle Championship in 1992. In English it is known as Skyscrapers, and Simon Tatham's puzzle collection calls it Towers.",
    ],
    rules: [
      [
        "どのマスにも、1から正方形の1辺の数までの高さのビルを入れます。どの行にも、どの列にも、それぞれの高さがちょうど1つずつ入ります。",
        "Fill every cell with a building from 1 up to the side of the square, so that each row and each column holds every height exactly once.",
      ],
      [
        "正方形の外側の数字は、そこから中を見たときに見えるビルの数です。高いビルは、うしろの低いビルをすべて隠します。",
        "A number outside the square says how many buildings can be seen looking in from there. A taller building hides every shorter one behind it.",
      ],
      [
        "ですから、1は最も高いビルがすぐ隣に立っているという意味で、正方形の1辺と同じ数なら、ビルが1つずつ高くなっているという意味です。",
        "So a 1 means the tallest building stands right next to the number, and a number as big as the side of the square means the buildings rise one step at a time.",
      ],
      [
        "答えはちょうど1つです。時計は最初の入力で動き出し、最後のマスが正しくなると止まります。チェックは、まちがっているマスの数だけを教えます。どのマスかは教えません。",
        "There is exactly one answer. The clock starts on the first entry and stops when the last cell is right. Check tells you how many cells are wrong, only; it does not say which.",
      ],
    ],
    board: ["5×5が普段の大きさです。4×4は手早く、7×7は長めです。", "5×5 is the usual size. 4×4 is quick; 7×7 is the long one."],
    review: AGENT_READ,
  },
  blackAndWhite: {
    tagline: [
      "黒と白の石で盤を埋めます。どの行にも列にも、黒と白が同じ数ずつ入り、同じ色が3つ並ぶことはありません。",
      "Fill the grid with black and white stones: every row and column holds as many of each, and never three alike in a line.",
    ],
    origin: [
      "2009年ごろ、Adolfo Zanellatiが、それとは別にPeter De SchepperとFrank Coussementが作った二進パズルです。「タクズ」や「ビナイロ」の名で載っています。LinkedInは、太陽と月を使った形を毎日出しています。",
      "The binary puzzle made around 2009 by Adolfo Zanellati and, separately, by Peter De Schepper and Frank Coussement, printed as Takuzu and Binairo. LinkedIn runs a form of it daily, with suns and moons.",
    ],
    rules: [
      ["空いているマスに、黒い石か白い石を置きます。", "Put a black stone or a white one in every empty cell."],
      ["どの行にも、どの列にも、黒い石と白い石が同じ数ずつ入ります。", "Every row and every column holds as many black stones as white ones."],
      [
        "同じ色の石が、縦にも横にも3つ続いてはいけません。ここでは「3つ並ぶ」ことが、唯一してはいけないことです。",
        "Never three stones of one colour in a row, across or down. Here making three in a line is the one thing you may not do.",
      ],
      ["同じ並びの行が2つあってはならず、同じ並びの列が2つあってもいけません。", "No two rows may be the same, and no two columns may be the same."],
      [
        "マスを1回タップすると黒、もう1回で白、もう1回で消えます。最初から置かれている石は動きません。答えはちょうど1つです。",
        "Tap a cell once for black, again for white, again to clear it. The stones placed from the start stay where they are, and there is exactly one answer.",
      ],
    ],
    board: [
      "8×8が普段の大きさです。6×6は手早く、12×12は夜長に向いています。",
      "8×8 is the usual size. 6×6 is quick; 12×12 suits a long evening.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Partial<Record<string, PuzzleCopyJa>>;
