import { layoutFor } from "@johnmorrisdotca/jarajara";

import { AGENT_READ_2026_10_06 } from "../copyJa.types";

import type { PuzzleCopyJa } from "./puzzles.ja.types";

/**
 * The drawn puzzles' words in Japanese: Bridges, Picture logic, the three
 * card games, Mahjong Solitaire and the Cube.
 */
const AGENT_READ = AGENT_READ_2026_10_06;

const tiles = (size: number): number => layoutFor(size)?.slots.length ?? 0;

export const PUZZLE_COPY_JA_DRAWN = {
  bridges: {
    tagline: [
      "島と島を、直線の橋で1本か2本ずつつなぎ、すべての島が数字どおりになって、全部がひとつにつながるようにします。",
      "Join the islands with straight bridges, one or two at a time, until every island has its number and all of them are one.",
    ],
    inspiredBy: [
      "1990年にニコリが初めて載せた、島と橋のパズル",
      "the island-and-bridge puzzle Nikoli first printed in 1990",
    ],
    origin: [
      "島と、そのあいだにかかる橋のパズルで、日本の鉛筆パズルです。1990年にニコリが初めて載せ、いまはさまざまな名前でパズル本に載っています。橋は、ただ橋という意味の日本語です。ここのパズルは、このサイトのコードが作り、どれも答えがちょうど1つです。",
      "A Japanese pencil puzzle of islands and the bridges between them, first printed by Nikoli in 1990 and found since in puzzle books everywhere under many names. 橋 is simply Japanese for a bridge. The puzzles here are made by our own code, each with exactly one answer.",
    ],
    rules: [
      ["丸は島で、その中の数字は、その島にかかる橋の本数です。", "Every circle is an island, and its number is how many bridges it must have."],
      [
        "橋は、一直線に並んだ2つの島のあいだを、縦か横にまっすぐかけます。水の上だけを通り、ほかの島を通り抜けたり、ほかの橋と交わったりはできません。",
        "A bridge runs straight across or straight down between two islands in line with each other, over water only: it never passes through another island or crosses another bridge.",
      ],
      ["2つの島のあいだには、橋を1本か2本かけられます。3本以上はかけられません。", "Two islands may be joined by one bridge or by two, never more."],
      [
        "すべての島に、ちょうど数字の本数の橋がかかり、どの島からも橋を渡ってほかのすべての島へ行けると完成です。答えはちょうど1つです。",
        "The puzzle is solved when every island has exactly its number of bridges and every island can be reached from every other along the bridges. There is exactly one answer.",
      ],
      [
        "島をタップして、一直線上のもう1つの島をタップすると橋がかかります。もう1回で2本め、3回めで2本とも消えます。島から島へドラッグしても同じです。数字どおりになった島は、塗りつぶされ、下にチェックがつきます。",
        "Tap an island and then another in line with it to lay a bridge; do it again for a second, and a third time to take them both away. Or drag from one island to the other. An island that has its number turns solid, with a tick under it.",
      ],
      [
        "初級は、数えるだけで解けます。中級は、つながりの決まりも使います。島の集まりを、ほかから切り離してはならないので、2つの1どうしをつなぐことはありません。上級では、どこかで橋を試して確かめる必要があります。",
        "Easy yields to counting alone. Medium needs the joining rule as well: no group of islands may be cut off from the rest, so two 1s are never joined to each other. Hard needs you, somewhere, to try a bridge and see.",
      ],
    ],
    board: [
      "9×9が普段の大きさです。7×7は手早く、11×11と13×13は夜長向き、17×17、21×21、25×25は根気のある人向きです。スマートフォンでは、大きな盤は拡大され、盤の下の「全体」と矢印で動かします。",
      "9×9 is the usual size. 7×7 is quick; 11×11 and 13×13 are long evenings, and 17×17, 21×21 and 25×25 are for the patient. On a phone the bigger boards zoom, with Fit and the arrows under the board.",
    ],
    review: AGENT_READ,
  },
  pictureLogic: {
    tagline: [
      "数字のとおりに、行ごと、列ごとにマスを塗ると、絵が現れます。",
      "Shade the squares the numbers ask for, row by row and column by column, and a picture appears.",
    ],
    inspiredBy: [
      "英語でノノグラムと呼ばれる、1987年に日本で考えられた絵のパズル",
      "the grid picture puzzle known in English as the nonogram, devised in Japan in 1987",
    ],
    origin: [
      "絵が隠れた、日本のパズルです。1987年、グラフィックエディターのNon Ishidaが、格子の窓に灯りをともして描いた絵で東京のコンテストに入賞しました。パズル作家のTetsuya Nishioも、同じ考えに自分で行き着いていました。Ishidaは1988年に、3つを「ウィンドウアートパズル」として出しています。イギリスではJames Dalgetyが、彼女にちなんで「ノノグラム」と名づけ、The Sunday Telegraph紙が1990年から毎週1問を載せました。絵解きは、絵を読み解くという意味です。ここの絵は、このサイトのコードが描き、どのパズルも答えがちょうど1つです。",
      "A Japanese puzzle of hidden pictures. In 1987 Non Ishida, a graphics editor, won a competition in Tokyo with pictures drawn in the lit windows of a grid, and the puzzle maker Tetsuya Nishio came to the same idea on his own; Ishida published three as Window Art Puzzles in 1988. In Britain James Dalgety named them nonograms, after her, and The Sunday Telegraph printed one every week from 1990. 絵解き means reading a picture out. The pictures here are drawn by our own code, and each puzzle has exactly one answer.",
    ],
    rules: [
      [
        "どの行の横にも、どの列の上にも手がかりがあります。塗るマスが続く長さを、順番に並べたものです。0は、塗るマスがないことです。",
        "Every row has a clue beside it and every column a clue above it: the lengths of its runs of shaded squares, in order. A 0 means none.",
      ],
      [
        "1本の線の中で、2つの塗る列のあいだには、空いたマスが少なくとも1つあります。最初の前と最後のあとには、いくつあってもかまいません。",
        "Between two runs in a line there is at least one empty square; before the first and after the last there may be any number.",
      ],
      [
        "すべての行とすべての列が、ちょうど手がかりのとおりになると、絵が現れて完成です。答えはちょうど1つです。",
        "The puzzle is solved when every row and every column has exactly its runs, and the picture they draw appears. There is exactly one answer.",
      ],
      [
        "マスをタップすると塗れて、もう1回で「×」（空と決めたしるし）、もう1回で消えます。「×」のペンでは、最初のタップが×になります。行や列に沿ってドラッグすると、最初のマスと同じことを、通ったマスすべてにします。満たされた手がかりは、薄くなって打ち消し線が引かれます。",
        "Tap a square to shade it, again to mark it ✕ (sure to be empty), and again to clear it; with the ✕ pen, the first tap marks. Drag along a row or column to do the same to every square like the first. A clue that is met turns pale and is struck through.",
      ],
    ],
    board: [
      "10×10が普段の大きさです。5×5は手早く、15×15と20×20は夜長向き、40×40と50×50は根気のある人向きで、初級と中級だけです。どの線も、当て推量なしで解けます。10×10より大きな盤は、スマートフォンでは拡大され、盤の下の「全体」と矢印で動かします。動かしても、手がかりは同じ場所にあります。",
      "10×10 is the usual size. 5×5 is quick; 15×15 and 20×20 are long evenings, and 40×40 and 50×50 are for the patient, on easy and medium only: every line can still be worked out without a guess. Past 10×10 the board zooms on a phone, with Fit and the arrows under it, and the clues stay put as you move.",
    ],
    review: AGENT_READ,
  },
  solitaire: {
    tagline: [
      "誰もが知っているソリティア、クロンダイクです。7つの列と山札からカードを取って、4つのマークを、エースから順に積み上げます。",
      "Klondike, the Solitaire everybody knows: build the four suits up from their Aces, taking the cards out of seven columns and the stock.",
    ],
    inspiredBy: ["伝統的なペイシェンスゲーム、クロンダイク", "Klondike, the traditional patience game"],
    origin: [
      "19世紀後半からある、1人で遊ぶカードゲーム（ペイシェンス）です。名前は、1890年代にカナダのユーコンで起きたクロンダイクのゴールドラッシュにちなむといわれます。パソコンに無料でついてくるようになって、世界でいちばん遊ばれているカードゲームになりました。ここの配りは、このサイトのコードがシャッフルして、カードを描いています。",
      "A patience game, a card game for one, from the late nineteenth century, named, most accounts say, after the Klondike Gold Rush in Canada's Yukon in the 1890s. It became the most played card game in the world when it came free with desktop computers. The deals here are shuffled and the cards drawn by our own code.",
    ],
    rules: [
      [
        "7つの列に、1列めは1枚、7列めは7枚と配り、どの列も一番上のカードは表向きです。残りの24枚が山札です。",
        "Seven columns are dealt, one card in the first up to seven in the last, each with its top card face up. The other twenty-four cards are the stock.",
      ],
      [
        "それぞれのマークの組札を、エースからキングまで積み上げます。52枚すべてが組札に上がると勝ちです。",
        "Build each suit's foundation up from its Ace to its King. You win when all fifty-two cards are home.",
      ],
      [
        "列の上では、色を交互にして、小さいほうへ積みます。黒の7の上に赤の6、といった具合です。表向きの並びは、1つ大きい反対の色のカードの上に、まとめて動かせます。空いた列に置けるのは、キングか、キングで始まる並びだけです。",
        "On the columns, build down in alternating colours: a red 6 on a black 7. Any face-up run may move as a whole onto a card one higher of the other colour, and only a King, or a run headed by one, may go into an empty column.",
      ],
      [
        "列の表向きのカードをすべて動かすと、その下のカードは自動で表に返ります。",
        "When all of a column's face-up cards are moved away, the card under them turns over by itself.",
      ],
      [
        "山札は1枚ずつ、または3枚ずつ、捨て札へめくります。捨て札のいちばん上のカードは使えます。山札がなくなると、捨て札を裏返して山札に戻せます。何回戻せるかはゲームによって違い、何度でも、3回まで、1回だけのどれかです。",
        "Turn the stock one card at a time or three, onto the waste; the waste's top card may be played. Once the stock is empty the waste turns back over, as many times as the game allows: as often as you like, three times through, or once.",
      ],
      ["組札のカードは、列に戻すこともできます。", "A card on a foundation may come back down onto a column."],
      [
        "表向きのカードをドラッグすると、その上のカードもいっしょに動きます。カードをタップして、置きたい場所をタップしても動かせます。カードを2回タップすると、組札へ上がります。「元に戻す」で1手戻せ、すべてのカードが表向きになると、ゲームは自分で最後まで進みます。",
        "Drag any face-up card, and the cards on it go with it; or tap a card and then where it should go. Tap a card twice to send it home. Undo takes back a move, and once every card is face up the game finishes itself.",
      ],
    ],
    board: [
      "「1枚めくり」は、山札から1枚ずつめくる、やさしいゲームです。「3枚めくり」は3枚めくり、使えるのは一番上の1枚だけです。「勝てる配り」は、このサイトの解析プログラムがすでに勝った配りから出すので、必ず勝てます。「どの配りでも」を選ぶと、本物のカードのようにシャッフルしたままで、勝てないこともあります。",
      "Draw 1 turns one card at a time from the stock, and is the gentler game; Draw 3 turns three and only the top one can be played. Winnable deals are dealt from deals our solver has already won, so every one can be won; choose any deal for the shuffle as it falls, which sometimes cannot be.",
    ],
    review: AGENT_READ,
  },
  freecell: {
    tagline: [
      "すべてのカードが最初から表向きです。4つのフリーセルを使って4つのマークを組札に上げます。ほとんどの配りは勝てます。",
      "Every card face up from the start: bring the four suits home through four free cells, and nearly every deal can be won.",
    ],
    inspiredBy: ["Paul Alfilleが1978年に作ったペイシェンスゲーム、フリーセル", "FreeCell, the patience game Paul Alfille made in 1978"],
    origin: [
      "全部のカードが表向きに配られる、古いほうのペイシェンスゲームの仲間です。Paul Alfilleが1978年にPLATOシステムでフリーセルとして作り、パソコンに無料でついてくるようになって有名になりました。ほとんどの配りは勝てるので、運よりも先を読む力のゲームです。ここの配りは、このサイトのコードがシャッフルして、カードを描いています。",
      "A patience game of the older family where the whole deck is dealt face up. Paul Alfille wrote it as FreeCell on the PLATO system in 1978, and it became famous when it came free with desktop computers. Almost every deal can be won, so it is a game of thinking ahead more than of luck. The deals here are shuffled and the cards drawn by our own code.",
    ],
    rules: [
      [
        "山札全部が表向きで8つの列に配られます。最初の4列は7枚ずつ、残りは6枚ずつです。",
        "The whole deck is dealt face up into eight columns: seven cards in each of the first four and six in the rest.",
      ],
      [
        "それぞれのマークの組札を、エースからキングまで積み上げます。52枚すべてが組札に上がると勝ちです。",
        "Build each suit's foundation up from its Ace to its King. You win when all fifty-two cards are home.",
      ],
      [
        "列の上では、色を交互にして、小さいほうへ積みます。黒の7の上に赤の6、といった具合です。空いた列には、どのカードでも置けます。",
        "On the columns, build down in alternating colours: a red 6 on a black 7. Any card may go into an empty column.",
      ],
      [
        "フリーセルには、カードを1枚だけ置けます。動かせるのは、列の一番上のカードと、フリーセルのカードだけです。",
        "A free cell holds any one card. Only the top card of a column or a card in a cell can move.",
      ],
      [
        "順に並んだカードの並びは、1枚ずつ動かせる余裕があれば、まとめて動かせます。その余裕は、空いたフリーセルの数より1枚多く、さらに、行き先でない空いた列1つごとに2倍です。",
        "A run in order may move as a whole when there is room to move it a card at a time: one more card than the empty cells, doubled for every empty column it is not going into.",
      ],
      [
        "カードをドラッグすると、その上の並びもいっしょに動きます。カードをタップして、置きたい場所をタップしても動かせます。カードを2回タップすると、組札へ上がります。「元に戻す」で1手戻せ、残りのカードがすべて順番に組札へ上がれるようになると、ゲームは自分で最後まで進みます。",
        "Drag a card, and the run on it goes with it; or tap a card and then where it should go. Tap a card twice to send it home. Undo takes back a move, and once every card left can go home in turn the game finishes itself.",
      ],
    ],
    board: [
      "フリーセル4つが、ふつうに遊ばれているフリーセルです。3つと2つは、作業できる場所が少なくなって、難しくなります。どの配りも、そのセルの数で、このサイトの解析プログラムがすでに勝っているので、必ず勝てます。",
      "4 cells is FreeCell as it is usually played; 3 cells and 2 cells leave less room to work in, and are harder. Every deal is one our solver has already won with those cells, so every one can be won.",
    ],
    review: AGENT_READ,
  },
  spider: {
    tagline: [
      "2組のカードを10列に配ります。同じマークで、キングからエースまでそろった並びを作り、8組ぜんぶを盤から取り除きます。",
      "Two decks, ten columns: build full runs of one suit from King down to Ace, and clear all eight off the table.",
    ],
    inspiredBy: ["伝統的な2組のペイシェンスゲーム、スパイダー", "Spider, the traditional two-deck patience game"],
    origin: [
      "少なくとも19世紀から遊ばれている、2組のカードのペイシェンスゲームです。組札が8つで、クモの足の数と同じなので、この名がついたといわれます。パソコンに無料でついてくるようになって、いちばん遊ばれたカードゲームのひとつになりました。1つのマークだけなら、やさしく遊べます。4つのマークだと、ペイシェンスの中でもっとも難しいゲームのひとつです。ここの配りは、このサイトのコードがシャッフルして、カードを描いています。",
      "A two-deck patience game played since at least the nineteenth century and named, it is said, for its eight foundations, as many as a spider's legs. It became one of the most played card games of all when it came free with desktop computers. Played with one suit it is gentle; with all four it is one of the hardest patience games there is. The deals here are shuffled and the cards drawn by our own code.",
    ],
    rules: [
      [
        "2組のカードを10列に配ります。最初の4列は6枚、残りは5枚で、どの列も一番上だけが表向きです。残りの50枚が山札です。",
        "Two decks are dealt into ten columns: six cards in each of the first four and five in the rest, only the top card of each face up. The other fifty are the stock.",
      ],
      [
        "カードは、どのマークでも、1つ大きいカードの上に置けます。空いた列にも置けます。まとめて動かせる並びは、すべて同じマークで順番に並んだものだけです。",
        "A card may go onto any card one higher, of any suit, or into an empty column. A run moves as a whole only if it is all one suit, in order.",
      ],
      [
        "同じマークで、キングからエースまでそろった並びは、自動で盤から取り除かれます。8組すべてを取り除くと勝ちです。",
        "A full run of one suit, from King down to Ace, is taken off the table by itself. Clear all eight to win.",
      ],
      [
        "列の表向きのカードをすべて動かすと、その下のカードは自動で表に返ります。",
        "When all of a column's face-up cards are moved away, the card under them turns over by itself.",
      ],
      [
        "山札をタップすると、10列すべてに1枚ずつ配られます。全部で5回です。列が1つでも空だと、配れません。",
        "Tap the stock to deal one card onto every column at once, five times in all. It cannot deal while a column is empty.",
      ],
      [
        "カードをドラッグすると、その上の並びもいっしょに動きます。カードをタップして、置きたい列をタップしても動かせます。カードを2回タップすると、並びがいちばん合う列へ動きます。「元に戻す」で1手戻せ、すべてのカードが配られて表向きになると、ゲームはできるところまで自分で進みます。",
        "Drag a card, and the run on it goes with it; or tap a card and then the column it should go on. Tap a card twice to move its run to the best column that takes it. Undo takes back a move, and once every card is dealt and face up the game finishes itself as far as it can.",
      ],
    ],
    board: [
      "「1マーク」は、2組をスペードだけ8組にしたやさしいゲームです。「2マーク」は、スペードとハートです。「4マーク」は、2組そのままで、難しいゲームです。どの配りも、このサイトの解析プログラムがすでに勝っているので、必ず勝てます。",
      "1 suit plays both decks as eight sets of spades, and is the gentle game; 2 suits is spades and hearts; 4 suits is the full two decks, and hard. Every deal is one our solver has already won, so every one can be won.",
    ],
    review: AGENT_READ,
  },
  mahjong: {
    tagline: [
      "積まれた麻雀牌を、2枚ずつ取って消します。同じ牌の自由な組を取り続け、盤を空にします。",
      "Clear a stack of mahjong tiles two at a time: take matching pairs of free tiles until the table is empty.",
    ],
    inspiredBy: ["Brodie Lockardが1981年に最初に作った麻雀ソリティア", "mahjong solitaire, first made by Brodie Lockard as Mah-Jongg in 1981"],
    origin: [
      "麻雀の牌を使うペイシェンスゲームです。牌をある形に積み、2枚ずつ取っていきます。Brodie Lockardが1981年に、PLATOシステムのコンピュータゲームとして最初に作り、以来あらゆる種類の画面で遊ばれてきました。ここの牌は、日本式の144枚の完全な1組で、このサイトのために描きました。2つの巨大な配置は、2組と4組の牌を使います。牌の配りと配置は、このサイトのものです。",
      "The patience game played with a mahjong set: the tiles are stacked into a shape and taken off two at a time. Brodie Lockard first made it as a computer game on the PLATO system in 1981, and it has been played on every kind of screen since. The tiles here are a full set of 144 in the Japanese style, drawn for this site, and the two mega layouts use two and four sets; the deals and the layouts are our own.",
    ],
    rules: [
      [
        "牌は、最大6段の配置に積まれています。同じ牌の組を2枚ずつ取り、1枚もなくなるまで続けます。",
        "The tiles are stacked in a layout of up to six layers. Take them off in matching pairs, two at a time, until none are left.",
      ],
      [
        "取れるのは、自由な牌だけです。上に何も載っていない（半分だけ載っている牌も不可）こと、そして左右どちらかの側が空いていることが条件です。上に載られているか、両側がふさがれている牌は、まわりの牌がなくなるまで待ちます。",
        "Only a free tile can be taken: nothing lying on it, not even half a tile, and its left side or its right side open. A tile that is covered, or held on both sides, waits until the tiles around it are gone.",
      ],
      [
        "同じ牌の2枚が組になります。同じ種類の同じ数、同じ風牌、同じ三元牌です。花牌はどれとでも、季節牌はどれとでも組になります。設定画面で「同じ牌だけ」を選ぶと、同じ1枚だけと組になります。",
        "Two tiles match when they are the same: the same number of the same suit, the same wind or the same dragon. Any flower matches any flower and any season any season, or, with Identical chosen on the set-up screen, only the same one.",
      ],
      [
        "自由な牌をタップして、その組の相手をタップするか、片方をもう片方へドラッグします。自由な牌をダブルタップすると、自由な相手がいれば、いっしょに取れます。取れない牌は揺れて、その場にとどまります。",
        "Tap a free tile and then its match, or drag one onto the other. Double-tap a free tile to take it with its match, when it has a free one. A blocked tile shakes and stays where it is.",
      ],
      [
        "自由な組がなくて行き詰まったときは、「シャッフル」で、残った牌が、いま埋まっている場所に並び直され、遊びを続けられます。場所が許すかぎり、最後まで取れる並びになります。「元に戻す」は、直前の手を何度でも戻します。",
        "Stuck, with no free pair? Shuffle lays the tiles left in the places they fill, so play can go on, and lays them so they can be finished whenever the places allow. Undo takes back the last move, as often as you like.",
      ],
      [
        "設定画面で「ヒント」を選ぶと、ヒントで自由な組が光ります。ヒント1回分の点がかかります。「自由な牌を光らせる」は、ふつうの選び方で、取れない牌を暗くして、自由な牌を目立たせます。本物の牌のように遊びたいときは、切ってください。",
        "Choose Hints on the set-up screen and Hint lights a free pair, at a hint's cost in points. Free tiles lit, the usual choice, dims every blocked tile so the free ones stand out; turn it off for the classic look.",
      ],
      [
        "どの配りも、必ず取り切れます。見る前に、2枚ずつ逆の順に並べて作ってあります。かかった時間が、記録になります。",
        "Every deal can be cleared: it is laid out pair by pair in reverse before you see it. Your time is your score.",
      ],
      [
        "テーブルで遊ぶ場合は、設定画面で2人、3人、4人を選び、1台をまわします。1回の手番で1組を取り、取った人の得点になります。数牌は1点、1と9は2点、風牌は3点、三元牌は4点、花牌と季節牌は2点で、もう1回手番があります。取れる組がなくなると、牌がシャッフルされ、同じ人が続けます。盤が空になるか、シャッフルしても残りが取れなくなると、得点がいちばん多い人の勝ちで、同点なら分け合います。どの席もコンピュータにできます。隠すものはないので、画面を隠す必要はありません。",
        "For a table: choose two, three or four players on the set-up screen and pass one device round. Each turn takes one pair, scored to whoever took it: a plain suit tile 1, a one or a nine 2, a wind 3, a dragon 4, and a flower or season 2 and another turn. With no pair to take, the tiles are shuffled and the same player goes on. When the table is clear, or no shuffle can free what is left, the most points wins, and a tie shares it. Any seat can be a computer. Nothing is secret, so nobody hides the screen.",
      ],
    ],
    board: [
      `配置は6つです。鳥居（${tiles(8)}枚、横8枚）と富士（${tiles(9)}枚、横9枚）は手早く、スマートフォンにも収まります。城（${tiles(10)}枚、横10枚）はやや長めです。亀は定番の${tiles(15)}枚、横15枚で、スマートフォンでは拡大され、盤の下の「全体」と矢印で動かします。2つは複数の牌のセットから配る巨大な配置で、2セットと4セットを使います。長城（${tiles(20)}枚、横20枚）と宮殿（${tiles(26)}枚、横26枚）は、スマートフォンでも拡大でき、最大4倍まで広げられます。小さな配置は、144枚の完全な1組から選んだ組を使います。`,
      `Six layouts. Torii 鳥居 (${tiles(8)} tiles, eight across) and Fuji 富士 (${tiles(9)}, nine across) are quick and fit a phone; Castle 城 (${tiles(10)}, ten across) is longer; the Turtle 亀 is the classic ${tiles(15)}, fifteen across, and on a phone it zooms, with Fit and the arrows under the board. Two are mega layouts dealt from more than one set of tiles, a double set and a quadruple set: the Great Wall 長城 (${tiles(20)} tiles, twenty across) and the Palace 宮殿 (${tiles(26)} tiles, twenty-six across), which also zoom on a phone, as far as four times. A smaller layout uses pairs drawn from the full set of 144.`,
    ],
    review: AGENT_READ,
  },
  cube: {
    tagline: [
      "回転するキューブです。シャッフルされたキューブの層を回して、6つの面がすべて1色にそろった状態に戻します。2×2から7×7まで、3Dで遊べます。",
      "The turning cube: scramble it, then turn its layers until every face is one colour again. From the 2×2 to the 7×7, in 3D.",
    ],
    inspiredBy: ["Ernő Rubikが1974年に発明したルービックキューブ", "the Rubik's Cube, invented by Ernő Rubik in 1974"],
    origin: [
      "ハンガリーの建築の教師Ernő Rubikが1974年に、部品が動いても全体がばらばらにならないしくみを学生に見せようと、最初の1つを作りました。自分でそろえるのに1か月かかったそうです。1980年に発売され、史上もっとも売れたパズルになりました。いまでは100分の1秒の単位で計る大会で、早さが競われています。ここのキューブは、このサイトのコードが描いて、回しています。",
      "Ernő Rubik, a Hungarian teacher of architecture, made the first one in 1974 to show his students how parts can move without the whole falling apart, and took a month to solve it himself. It went on sale in 1980 and became the best-selling puzzle ever made. People now race to solve it, in competitions timed to the hundredth of a second. The cube here is drawn and turned by our own code.",
    ],
    rules: [
      [
        "そろったキューブは、1つの面が1色です。キューブは、ばらばらの状態から始まります。層を回して、すべての面を1色に戻します。",
        "Each face of a solved cube is one colour. The cube starts scrambled; turn its layers until every face is one colour again.",
      ],
      [
        "どの層も、4分の1回転か半回転できます。面でも、大きなキューブなら内側の層でもかまいません。キューブ全体を回して別の面を見るのは自由で、手には数えません。",
        "Any layer can be turned a quarter or a half turn: a face, or on a bigger cube a layer inside it. Turning the whole cube to look at another side is free, and is not counted as a move.",
      ],
      [
        "ステッカーをキューブの上でドラッグすると、それが載っている層が、その向きに回ります。キューブのまわりの空いた場所をドラッグすると、キューブ全体が回り、どこからでも見られます。",
        "Drag a sticker across the cube to turn the layer it sits in that way. Drag the space around the cube to turn the whole cube and look at it from anywhere.",
      ],
      [
        "マウスでは、キューブの上でホイールを回すと、ポインタの下の層が回り、Ctrlを押しながらだと、それと交わる層が回ります。キューブのまわりの空いた場所でホイールを回すと、キューブ全体が回ります。キーボードでも、キューバーが書く記法で操作できます。R、L、U、D、F、Bは、その面を時計回りに回し、Shiftを押すと反時計回りです。M、E、Sは中央の層、x、y、zはキューブ全体を回します。先に2から7の数字を打つと、面からその分だけ内側の層を回します。",
        "With a mouse, the wheel over the cube turns the layer under the pointer, and Ctrl with the wheel turns the layer across it; over the space around the cube, the wheel turns the whole cube. Keys work too, in the notation cubers write: R, L, U, D, F and B turn a face clockwise, with Shift anticlockwise; M, E and S turn a middle layer, and x, y and z the whole cube. A number first, 2 to 7, turns a layer that many in from the face.",
      ],
      [
        "シャッフルされたキューブを、15秒だけ眺められます。大会と同じです。時計は、最初の1手か、眺める時間が終わったときに動き出し、キューブがそろった瞬間に止まります。",
        "You get fifteen seconds to look at the scramble, as a competition gives. The clock starts with your first turn, or when the look runs out, and stops the moment the cube is solved.",
      ],
      [
        "「元に戻す」は、1手ずつ何度でも戻せます。かかった時間が記録になり、手も残るので、解いたあとで見直せます。",
        "Undo takes back a turn, as often as you like. Your time is your score, and your moves are kept, so a solve can be seen again.",
      ],
    ],
    board: [
      "3×3が定番のキューブです。2×2は、面の色を示す中央のマスがないので、手早く覚えるのに向いています。4×4と5×5は内側に層があり、夜長向きです。6×6と7×7はさらに長く、初めて解くのに1000手以上かかります。スマートフォンでは、キューブを拡大してステッカーを探します。初級は、そろった状態から数手のところ、上級は大会と同じ長さの完全なシャッフルです（7×7では100手）。",
      "The 3×3 is the classic cube. The 2×2 has no centres to show which colour a face should be, so it is a quick one to learn on; the 4×4 and 5×5 have layers inside, and are long evenings, and the 6×6 and 7×7 are longer still: a first solve is a thousand turns or more, and on a phone the cube zooms in to find the stickers. Easy is a few turns from solved; hard is a full scramble, as long as a competition gives (a hundred turns on the 7×7).",
    ],
    review: AGENT_READ,
  },
} as const satisfies Partial<Record<string, PuzzleCopyJa>>;
