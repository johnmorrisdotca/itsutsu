import { AGENT_READ_2026_10_06 } from "../copyJa.types";

import type { PuzzleCopyJa } from "./puzzles.ja.types";

/**
 * The Pencil puzzles' and Jirai's words in Japanese. Their names are plain
 * Japanese words (四角, 明かり, 輪, 一人, 合計, 区画, 地雷), never the titles a
 * publisher sells them under: the English origins name those titles as history,
 * and the Japanese leaves the Japanese ones out, because they are trademarks
 * (TERMS.md). The names the puzzles are known by in other places stay in Latin
 * letters, as the English row has them.
 */
const AGENT_READ = AGENT_READ_2026_10_06;

const BY_KAZU: [string, string] = [
  "ここのパズルは、このサイトのオープンソースのパッケージKazuが作り、どれも答えがちょうど1つです。",
  "The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
];
const ASK_TITLES =
  "The English origin names the publisher's own Japanese title for this puzzle. The Japanese leaves it out, because it is a trademark (TERMS.md); is that how John wants it?";

export const PUZZLE_COPY_JA_PENCIL = {
  shikaku: {
    tagline: [
      "盤を長方形に切り分けます。長方形にはそれぞれ数字が1つあり、それが覆うマスの数です。",
      "Cut the grid into rectangles, each holding one number that says how many cells it covers.",
    ],
    inspiredBy: ["長方形に分けるペンシルパズル、四角", "Shikaku, the rectangle-dividing pencil puzzle"],
    origin: [
      `日本でニコリが出した鉛筆パズルで、英語ではDivide by BoxやRectanglesとも呼ばれます。四角は、長方形や正方形を表す言葉です。${BY_KAZU[0]}`,
      `A pencil puzzle published in Japan by Nikoli, and found elsewhere as Divide by Box and Rectangles. 四角 (shikaku) is the word for a rectangle or a square. ${BY_KAZU[1]}`,
    ],
    rules: [
      [
        "どのマスも、ちょうど1つの長方形に入るように、盤を長方形に切り分けます。正方形も長方形に数えます。",
        "Cut the grid into rectangles so that every cell is in exactly one. A square counts as a rectangle.",
      ],
      [
        "どの長方形にも、数字がちょうど1つ入り、その数字が面積、つまり長方形が覆うマスの数です。",
        "Every rectangle holds exactly one number, and the number is its area: how many cells it covers.",
      ],
      [
        "長方形の角を1か所タップして、向かい合う角をタップすると描けます。1つの角を押して、もう1つの角までドラッグしても描けます。ほかの長方形の上に描くと、それを置き換えます。",
        "Tap one corner of a rectangle and then the opposite corner to draw it; or press on one corner and drag to the other. A rectangle drawn over others takes their place.",
      ],
      [
        "盤の下の「消す」を押すと、長方形をタップして取り除けます。「元に戻す」は、直前の変更を取り消します。",
        "Remove, under the board, lets you tap a rectangle to take it away. Undo takes back the last change.",
      ],
      [
        "答えはちょうど1つです。時計は最初の長方形で動き出し、最後のマスが正しく覆われると止まります。チェックは、まちがっている長方形の数だけを教えます。どれかは教えません。",
        "There is exactly one answer. The clock starts with the first rectangle and stops when the last cell is rightly covered. Check tells you how many rectangles are wrong, only; it does not say which.",
      ],
    ],
    board: [
      "7×7が普段の大きさです。5×5は手早く、10×10と14×14は長めです。どのサイズにも4つのレベルがあり、どの長方形も見るだけで見つかる初級から、超級まであります。",
      "7×7 is the usual size. 5×5 is quick; 10×10 and 14×14 are longer. At every size there are four levels, from easy, where every rectangle can be found by looking, to extra hard.",
    ],
    review: AGENT_READ,
    ask: ASK_TITLES,
  },
  akari: {
    tagline: [
      "電球を置いて、白いマスすべてが照らされるようにします。電球どうしは照らし合わず、数字のまわりには、その数の電球があります。",
      "Place bulbs so that every white square is lit, no two bulbs light each other, and every number has its bulbs beside it.",
    ],
    inspiredBy: ["ギャラリーの照明を置く鉛筆パズル", "the lamps-in-a-gallery pencil puzzle"],
    origin: [
      `日本でニコリが出した鉛筆パズルで、英語ではLight Upとも呼ばれます。明かりは「光」という意味です。電球の光は、黒いマスにさえぎられるまで、その行と列に沿って広がります。${BY_KAZU[0]}`,
      `A pencil puzzle published in Japan by Nikoli, and called Light Up in English; 明かり, Akari, means 'light'. Bulbs shine along their row and column until a black square stops them. ${BY_KAZU[1]}`,
    ],
    rules: [
      [
        "白いマスのいくつかに電球を置きます。電球は、自分のマスと、同じ行と列にある白いマスを、黒いマスか盤の端まで照らします。",
        "Put a bulb in some of the white squares. A bulb lights its own square and every white square in line with it, across and down, until a black square or the edge of the board.",
      ],
      ["白いマスは、すべて照らされなければなりません。", "Every white square must be lit."],
      [
        "電球が、ほかの電球に照らされてはいけません。行にも列にも、2つの電球が向かい合ってはなりません。",
        "No bulb may be lit by another: two bulbs may never see each other along a row or column.",
      ],
      [
        "黒いマスの数字は、そのマスの上下左右に接する電球の数です。数字のない黒いマスには、いくつあってもかまいません。",
        "A number in a black square says how many bulbs touch it, above, below and to each side. A black square with no number can have any.",
      ],
      [
        "白いマスをタップすると電球が置かれ、もう1回で取れます。答えはちょうど1つです。時計は最初の電球で動き出し、盤が正しくなると止まります。チェックは、まちがっている電球の数だけを教えます。どれかは教えません。",
        "Tap a white square to put a bulb in it, and again to take it out. There is exactly one answer. The clock starts with the first bulb and stops when the board is right. Check tells you how many bulbs are wrong, only; it does not say which.",
      ],
    ],
    board: [
      "7×7が普段の大きさです。5×5は手早く、10×10と14×14は長めです。どのサイズにも4つのレベルがあり、数字がほとんど見えている初級から、答えが1つに決まる最低限の数字しかない超級まであります。",
      "7×7 is the usual size. 5×5 is quick; 10×10 and 14×14 are longer. At every size there are four levels, from easy, with most numbers printed, to extra hard, with as few as the one answer allows.",
    ],
    review: AGENT_READ,
    ask: ASK_TITLES,
  },
  loop: {
    tagline: [
      "盤の線に沿って1本の輪を描きます。どの数字も、そのマスの4辺のうち、その数だけが輪の一部になります。",
      "Draw one loop along the grid's lines so that every number has exactly that many of its four sides on the loop.",
    ],
    inspiredBy: ["輪を描く鉛筆パズル", "the loop-drawing pencil puzzle"],
    origin: [
      `日本の出版社ニコリが育てた、輪のパズルで、ほかにもさまざまな名前で知られています。輪は、環や輪っかを表す言葉です。${BY_KAZU[0]}`,
      `A loop puzzle developed by the Japanese publisher Nikoli and found under many other names. 輪 (wa) is Japanese for a ring or loop. ${BY_KAZU[1]}`,
    ],
    rules: [
      [
        "格子の点をつなぐ線に沿って、1本の閉じた輪を描きます。輪は、自分と交わることも、枝分かれすることもありません。",
        "Draw a single closed loop along the lines of the grid, joining the dots. It never crosses itself or branches.",
      ],
      [
        "マスの数字は、そのマスの4辺のうち、輪が通る辺の数です。数字のないマスには、いくつあってもかまいません。",
        "A number in a cell says how many of that cell's four sides the loop runs along. A cell with no number can have any.",
      ],
      ["2つの点のあいだの線をタップすると描け、もう1回で消せます。", "Tap a line between two dots to draw it, and again to take it out."],
      [
        "答えはちょうど1つです。時計は最初の線で動き出し、輪が正しくなると止まります。チェックは、まちがっている線の数だけを教えます。どれかは教えません。",
        "There is exactly one answer. The clock starts with the first line and stops when the loop is right. Check tells you how many lines are wrong, only; it does not say which.",
      ],
      [
        "輪は、ほかではSlitherlink、Fences、Takegaki、Loopyの名でも知られています。",
        "Loop is known elsewhere as Slitherlink, Fences, Takegaki and Loopy.",
      ],
    ],
    board: [
      "7×7が普段の大きさです。5×5は手早く、10×10は長めです。どのサイズにも4つのレベルがあり、数字がほとんど見えている初級から、答えが1つに決まる最低限の数字しかない超級まであります。",
      "7×7 is the usual size. 5×5 is quick and 10×10 is longer. At every size there are four levels, from easy, with most numbers printed, to extra hard, with as few as the one answer allows.",
    ],
    review: AGENT_READ,
    ask: "The English origin and last rule name other places' titles for this puzzle. The Japanese keeps the names the English gives in Latin letters and adds no Japanese brand name (TERMS.md): is that how John wants it?",
  },
  hitori: {
    tagline: [
      "同じ数字が行や列で重ならず、塗ったマスどうしが触れず、塗らずに残ったマスがつながっているように、マスを塗ります。",
      "Shade squares so no number repeats in any row or column, no two shaded squares touch, and the squares left stay joined up.",
    ],
    inspiredBy: ["重なりを塗りつぶす鉛筆パズル", "the shade-the-repeats pencil puzzle"],
    origin: [
      `日本でニコリが出した鉛筆パズルです。一人は、1人、または独りという意味で、塗られずに残った数字は、それぞれ自分の行と列で1人だけになります。${BY_KAZU[0]}`,
      `A pencil puzzle published in Japan by Nikoli. 一人 (hitori) means one person, or alone: each number left unshaded stands alone in its row and column. ${BY_KAZU[1]}`,
    ],
    rules: [
      [
        "マスをいくつか塗り、塗らずに残ったマスのなかで、どの行にも列にも、同じ数字が2回出てこないようにします。",
        "Shade some of the squares so that no number appears twice among the unshaded squares in any row or column.",
      ],
      ["塗ったマスどうしは、辺で触れてはいけません。", "Two shaded squares may not touch along a side."],
      [
        "塗らずに残ったマスは、辺でつながった1つのまとまりでなければなりません。塗りつぶして、盤を2つに分けてはいけません。",
        "All the unshaded squares must be joined up, in one group, side to side: shading may not cut the board in two.",
      ],
      ["マスをタップすると塗れて、もう1回で消せます。", "Tap a square to shade it, and again to clear it."],
      [
        "答えはちょうど1つです。時計は最初のマスで動き出し、盤が正しくなると止まります。チェックは、まちがっているマスの数だけを教えます。どのマスかは教えません。",
        "There is exactly one answer. The clock starts with the first square and stops when the board is right. Check tells you how many squares are wrong, only; it does not say which.",
      ],
    ],
    board: [
      "7×7が普段の大きさです。5×5は手早く、9×9と12×12は長めです。どのサイズにも4つのレベルがあり、決まりだけで解ける初級から、超級まであります。",
      "7×7 is the usual size. 5×5 is quick; 9×9 and 12×12 are longer. At every size there are four levels, from easy, where the rules alone settle it, to extra hard.",
    ],
    review: AGENT_READ,
    ask: ASK_TITLES,
  },
  crossSums: {
    tagline: [
      "白いマスに1から9を入れて、どの列も手がかりの合計になり、同じ数字を繰り返さないようにします。",
      "Fill the white cells with 1 to 9 so every run adds up to its clue and never repeats a digit.",
    ],
    inspiredBy: ["合計のクロスワード", "the crossword of sums"],
    origin: [
      `合計でできたクロスワードです。Dell Magazinesで働いていたカナダ人のJacob E. Funkが1966年に「Cross Sums」の名で考え、日本で大人気になり、そこからいちばん知られた名前が逆輸入されました。合計は、足した数を表す日本語です。${BY_KAZU[0]}`,
      `A crossword made of sums. Jacob E. Funk, a Canadian working for Dell Magazines, devised it in 1966 as Cross Sums, and it became hugely popular in Japan, from where its best-known name has come back. 合計 (gōkei) is Japanese for a total. ${BY_KAZU[1]}`,
    ],
    rules: [
      ["白いマスすべてに、1から9の数字を入れます。", "Fill every white cell with a digit from 1 to 9."],
      [
        "黒いマスには手がかりがあります。右上の数字は、そこから右へ続く白いマスの合計で、左下の数字は、そこから下へ続く白いマスの合計です。",
        "A black cell holds clues. The number at its top right is the sum of the white cells running to its right; the number at its bottom left is the sum of the white cells running down from it.",
      ],
      ["1つの並びの中に、同じ数字が2回入ってはいけません。", "Within one run, no digit may appear twice."],
      ["白いマスをタップして、数字をタップします。", "Tap a white cell, then a digit."],
      [
        "答えはちょうど1つです。時計は最初の数字で動き出し、すべての並びが正しくなると止まります。チェックは、まちがっているマスの数だけを教えます。どのマスかは教えません。",
        "There is exactly one answer. The clock starts with the first digit and stops when every run is right. Check tells you how many cells are wrong, only; it does not say which.",
      ],
      [
        "合計は、ほかではKakuro、Kakkuro、Cross-sumsの名でも知られています。",
        "Cross Sums is known elsewhere as Kakuro, Kakkuro and Cross-sums.",
      ],
    ],
    board: [
      "8×8が普段の大きさです（合計が書かれた行と列も数えます）。6×6は手早く、10×10と12×12は長めで、最大9マスの並びがあるので、マスが指で押せる大きさになるタブレットかパソコン向きです。",
      "8×8 is the usual size, counting the row and column of sums. 6×6 is quick; 10×10 and 12×12 are longer, with runs of up to nine cells, and best on a tablet or a computer, where the cells are big enough to tap.",
    ],
    review: AGENT_READ,
    ask: "The English origin and last rule name other places' titles for this puzzle. The Japanese keeps the names the English gives in Latin letters and adds no Japanese brand name (TERMS.md): is that how John wants it?",
  },
  regions: {
    tagline: [
      "すべてのマスに数字を入れて、同じ数字のマスのまとまりが、その数字と同じ数のマスになるようにします。",
      "Fill every cell with a number so that each group of cells with the same number is exactly that many cells big.",
    ],
    inspiredBy: ["区画に数字を入れる鉛筆パズル", "the number-the-regions pencil puzzle"],
    origin: [
      `数字が区画の大きさを表す鉛筆パズルで、1980年代に日本でニコリが出し、その後は多くの出版社が出しています。区画は、土地のひと区切りを表す日本語です。${BY_KAZU[0]}`,
      `A pencil puzzle in which the numbers say how big their region is, published in Japan by Nikoli in the 1980s and since by many others. 区画 (kukaku) is Japanese for a block or plot of land. ${BY_KAZU[1]}`,
    ],
    rules: [
      [
        "空いているマスすべてに、数字を入れます。同じ数字で辺が触れ合うマスは、1つの区画になり、区画の数字は、その区画のマスの数です。",
        "Fill every empty cell with a number. Cells with the same number that touch along a side form a region, and a region's number is how many cells it has.",
      ],
      [
        "3は3マスの区画に入り、1は単独で立ち、ほかも同じです。区画に、はじめから書かれた数字がなくてもかまいません。",
        "A 3 sits in a region of three cells, a 1 stands on its own, and so on. A region does not need a printed number in it.",
      ],
      [
        "同じ大きさの2つの区画が、辺で触れてはいけません。触れると、1つの区画になってしまいます。",
        "Two regions of the same size may not touch along a side, or they would be one region.",
      ],
      ["マスをタップして、数字をタップします。はじめから書かれた数字は動きません。", "Tap a cell, then a number. The printed numbers stay where they are."],
      [
        "答えはちょうど1つです。時計は最初の数字で動き出し、盤が正しくなると止まります。チェックは、まちがっているマスの数だけを教えます。どのマスかは教えません。",
        "There is exactly one answer. The clock starts with the first number and stops when the grid is right. Check tells you how many cells are wrong, only; it does not say which.",
      ],
      [
        "区画は、ほかではFillominoやAllied Occupationの名でも知られています。",
        "Regions is known elsewhere as Fillomino and as Allied Occupation.",
      ],
    ],
    board: [
      "8×8が普段の大きさです。6×6は手早く、10×10と12×12は長めです。どのサイズにも4つのレベルがあり、数字がほとんど見えている初級から、答えが1つに決まる最低限の数字しかない超級まであります。",
      "8×8 is the usual size. 6×6 is quick; 10×10 and 12×12 are longer. At every size there are four levels, from easy, with most numbers printed, to extra hard, with as few as the one answer allows.",
    ],
    review: AGENT_READ,
    ask: "The English origin and last rule name other places' titles for this puzzle. The Japanese keeps the names the English gives in Latin letters and adds no Japanese brand name (TERMS.md): is that how John wants it?",
  },
  jirai: {
    tagline: [
      "当て推量なしで、安全なマスをすべて開きます。どの盤も、数字だけで解けるように作られていて、四角、六角形、ハート、星の形があります。",
      "Uncover every safe square without a single guess: each board is dealt so that its numbers alone are enough, on squares, hexagons, a heart or a star.",
    ],
    inspiredBy: ["「マインスイーパ」として売られた、地雷を探すパズル", "the mine-finding puzzle sold as Minesweeper"],
    origin: [
      "地雷が隠れた、伏せたマスの盤を、数字を手がかりに開いていきます。数字は、そのマスのとなりに、地雷がいくつあるかを表します。始まりについては諸説あり、1990年代にMicrosoft Windowsについてきたゲームとして、ほとんどの人に知られました。地雷は、日本語で地中の爆発物のことです。ここの盤は、このサイトのオープンソースのパッケージJiraiが配り、どの盤も、手がかりだけで最後まで進められることを確かめてあるので、当て推量はいりません。",
      "A grid of covered squares with mines hidden among them, uncovered by the numbers that say how many of a square's neighbours are mines. Its beginnings are disputed, and it reached nearly everyone as a game that came with Microsoft Windows in the 1990s. 地雷 (jirai) is Japanese for a land mine. The boards here are dealt by Jirai, our open-source package, which proves each one can be finished from its clues alone, so a guess is never needed.",
    ],
    rules: [
      [
        "地雷のないマスをすべて開きます。開いたマスには、となりの地雷の数が出ます。空白のマスはとなりに地雷がなく、そのまわりのマスは、自分で開きます。",
        "Uncover every square that has no mine. An uncovered square shows how many of its neighbours are mines; a blank one has none, and the squares round it uncover themselves.",
      ],
      [
        "となりのマスは、選んだ盤によって違います。まわりの8マス、上下左右の4マス、接する6つの六角形、またはつながった盤では、端をこえた反対側のマスです。",
        "Neighbours depend on the board you choose: the eight squares round one, the four beside it, the six hexagons that touch it, or, on a wraparound board, the squares across the edge, because the edges join.",
      ],
      [
        "マスをタップして開きます。「旗」をオンにするか、マスを押し続けるか、右クリックすると、地雷だと分かったマスに旗を立てられ、もう1回で旗を外せます。旗がすべて立った数字をタップすると、そのまわりの残りのマスが開きます。",
        "Tap a square to uncover it. Turn on Flag, press and hold a square, or right-click it, to flag a square you know is a mine, and again to take the flag off. Tap an uncovered number that has all its flags to uncover the rest of the squares round it.",
      ],
      [
        "当て推量はいりません。盤の真ん中は、最初から開いていて、どの盤も、数字から、少なくとも1つのマスが安全か地雷かが、必ず分かるように配られています。",
        "You never have to guess. The middle of the board is uncovered for you, and every board is dealt so that the numbers always prove at least one square safe or mined.",
      ],
      [
        "開いてしまった地雷は、その場所に旗が立ち、まちがいとして数えられ、ヒントと同じ点がかかります。パズルは終わりません。",
        "A mine you uncover is flagged where it lies and counted as a mistake, which costs what a Hint does; it does not end the puzzle.",
      ],
      [
        "どの盤にも自分の地雷があります。時計は最初の1手で動き出し、最後の安全なマスが開くと止まります。チェックは、まちがっている旗の数と、残る安全なマスの数だけを教えます。どれかは教えません。「表示」は、まちがっている旗に印をつけます。ヒントは、数字から安全と分かるマスを1つ開きます。",
        "Every board has its own mines: the clock starts on your first move and stops when the last safe square is uncovered. Check says how many flags are wrong and how many safe squares are left, only; it does not say which. Show marks the wrong flags. Hint uncovers a square the numbers prove safe.",
      ],
    ],
    board: [
      "9×9が普段の大きさです。7×7は手早く、12×12と16×16は長めで、巨大な32×32は1000マスを超えるので、スマートフォンでは拡大して動かします。ハート、星、六角形の形には、9×9以上が必要です。「四方」は、ふつうの「八方」より空白が多く、数字が少なくなります。六角形は6つ数えます。つながった盤には、端のマスがありません。",
      "9×9 is the usual size. 7×7 is quick; 12×12 and 16×16 are longer, and 32×32, the Huge board, is more than a thousand squares: on a phone you zoom in and move about it. The heart, star and hexagon shapes need at least 9×9. Four neighbours gives more blanks and fewer numbers than the classic eight; hexagons count six; wraparound has no edge squares.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Partial<Record<string, PuzzleCopyJa>>;
