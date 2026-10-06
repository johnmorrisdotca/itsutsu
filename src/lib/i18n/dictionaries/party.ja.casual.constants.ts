import type { CasualKind } from "../../casual/casual.types";
import { AGENT_READ_2026_10_06 } from "../copyJa.types";

import type { PartyCopyJa } from "./party.ja.types";

/**
 * Karakuri's eight casual games' words in Japanese (`CASUAL_DISPLAY`, in
 * `src/lib/casual/casual.constants.ts`). The buttons the rules mention are
 * the ones the table shows in Japanese (「やり直す」, `CASUAL_COPY.restart`).
 */
const AGENT_READ = AGENT_READ_2026_10_06;

export const PARTY_COPY_JA_CASUAL = {
  saveTheCharacter: {
    tagline: [
      "線を1本描いて彼をかばい、指を離したら、3秒間、ハチと岩から守りましょう。",
      "Draw one line to shelter him, let go, and keep him safe from the bees and the rocks for three seconds.",
    ],
    origin: [
      "スマホにあふれている、小さな物理ゲームの一種です。形を描いて落とし、持ちこたえるか見ます。ここでのルールはこのサイト独自のもので、Karakuriパッケージの物理演算の上で、ハチ、岩、線を、すべてコードで描いています。このアイデアは、誰のものでもありません。",
      "A kind of small physics game that fills phones: draw a shape, let it fall, and see whether it holds. The rules here are this site's own, on the Karakuri package's physics, with bees, rocks and a line, all drawn in code. The idea belongs to nobody.",
    ],
    rules: [
      [
        "指を離すまで、何も動きません。指を置いてドラッグし、線を1本描きます。線はインクを使い、盤の下のバーに残りが表示されます。インクがなくなると、線はそこで止まります。親指より短い線は捨てられ、描き直しになります。",
        "Until you let go, nothing moves. Put a finger down and drag to draw one line. It uses ink, with what is left shown in the bar under the board, and when the ink is gone the line stops. A line shorter than a thumb is thrown away and you draw again.",
      ],
      [
        "指を離すと、線は固い物体になって、重力で落ち、足場やキャラクターの上に乗り、危険が始まります。",
        "When you let go, the line becomes a solid body and falls under gravity, landing on the ledges and on the character, and the danger starts.",
      ],
      [
        "ハチはキャラクターめがけて一直線に飛び、邪魔するものがあれば、乗り越えるか、回り込みます。岩は、上にある印から落ち、線にはね返されます。",
        "Bees fly straight at the character and go over or round anything in their way. Rocks fall from the marks at the top and bounce off the line.",
      ],
      [
        "勝ち：指を離して3秒後、危険がすべて来たあとで、キャラクターが触れられておらず、足場から落ちてもいなければ勝ちです。",
        "Win: three seconds after you let go, once all the danger has arrived, if the character has not been touched and has not fallen off his ledge.",
      ],
      [
        "負け：ハチか岩が彼に触れたか、彼が落ちたときです。線は1本だけで、「やり直す」を押すと、同じレベルを描き直せます。",
        "Lose: when a bee or a rock touches him, or he falls. There is only one line, and pressing \"Restart\" lets you draw the same level again.",
      ],
    ],
    board: [
      "レベルは5つで、地面すれすれを飛ぶハチから、下に床のない小さな足場までです。危険が来る側で、彼を囲むように描いた線なら勝てます。頭の上だけの線では、横から来るハチを止められません。",
      "Five levels, from bees along the ground to a small ledge with no floor under it. A line drawn closing round him on the side the danger comes from wins. A line over his head alone does not stop bees coming from the side.",
    ],
    review: AGENT_READ,
  },
  pinRescue: {
    tagline: [
      "ピンを正しい順に抜きます。ヒーローを溶岩に近づけず、ヒーローか金貨を、安全な場所へ届けましょう。",
      "Pull the pins in the right order. Keep the hero away from the lava, and get the hero or the gold to the safe place.",
    ],
    origin: [
      "ピンとパズルの、小さな物理ゲームの一種です。何かがピンの上にのっていて、抜いたときに何が起こるかが、このゲームです。ここでのルールはこのサイト独自のもので、Karakuriパッケージの物理演算の上で、粒子でできた溶岩、水、石を動かします。このアイデアは、誰のものでもありません。",
      "A kind of small physics game of pins and puzzles: something rests on a pin, and what happens when you pull it is the game. The rules here are this site's own, on the Karakuri package's physics, with lava, water and stone made of particles. The idea belongs to nobody.",
    ],
    rules: [
      [
        "ピンは、それを支えている壁から、すっと抜ける棒です。ピンか、その輪をタップすると抜けます。抜いたピンは、そのまま戻りません。",
        "A pin is a bar that slides out of the wall holding it. Tap a pin, or its ring, to pull it. Once pulled, it stays out.",
      ],
      [
        "ピンを抜くと、その上にのっているものが落ちます。ヒーロー、金貨、溶岩、水です。ヒーローと金貨は、落ちて、転がって、止まる円盤で、溶岩と水は、落ちて流れる粒子の山です。",
        "Pulling a pin lets whatever rests on it fall: the hero, the gold, the lava, the water. The hero and the gold are discs that fall, roll and come to rest, and lava and water are heaps of particles that fall and pour.",
      ],
      [
        "溶岩がヒーローに触れたら負けです。トゲも同じです。金貨を守らなければならないレベルでは、溶岩が金貨に触れても負けです。",
        "Lava touching the hero loses, and so do spikes. In levels where the gold has to be saved, lava touching the gold loses too.",
      ],
      [
        "水が溶岩に出会うと、どちらも石になります。石は、できた場所にとどまり、固く、ヒーローはその上に立てます。",
        "Water that meets lava turns both to stone. The stone stays where it formed and is solid, and the hero can stand on it.",
      ],
      [
        "勝ち：ヒーロー（レベルによっては金貨）が、緑の破線の箱の、安全な場所で止まったときです。時間制限はないので、ピンを抜くあいだに、ものが落ち着くのを待ちましょう。",
        "Win: when the hero (or the gold, in some levels) is at rest in the safe place, the green dashed box. There is no time limit, so wait for things to settle between pulls.",
      ],
    ],
    board: [
      "レベルは5つで、進むたびに、ピンも負け方も増えます。早く抜きすぎると（水がまだ落ちているうちにヒーローのピンを抜くなど）、石の殻ができる前に、彼は落ちてしまいます。",
      "Five levels, with more pins and more ways to lose each time. Pull too early (the hero's pin while the water is still falling, say) and he falls before the crust has formed.",
    ],
    review: AGENT_READ,
  },
  nutsAndBolts: {
    tagline: [
      "板を正しい順にはずします。出ているネジをタップし、ネジが残っていない板は、落ちていきます。",
      "Take the plates off in the right order. Tap a screw that is showing, and a plate with no screws left falls away.",
    ],
    origin: [
      "小さな、仕分けと順番のパズルの一種です。板が、ネジで何層にも留められていて、ネジを外す順番がゲームです。ここでのルールはこのサイト独自のもので、各レベルに必要な最少のスロットは、探索で求めているので、どのレベルも必ずクリアできます。このアイデアは、誰のものでもありません。",
      "A kind of small sorting-and-order puzzle: plates pinned in layers by screws, and the game is the order the screws come out in. The rules here are this site's own, and the fewest slots each level needs is worked out by a search, so every level can be won. The idea belongs to nobody.",
    ],
    rules: [
      [
        "板は何層にも重なり、1枚ごとに2〜5本のネジで盤に留められています。上にある板は、下の板のネジのうち、覆っているものを隠します。",
        "Plates lie in layers, each pinned to the board by two to five screws. A plate on top hides those screws of the plates under it that it covers.",
      ],
      [
        "見えているネジをタップすると、下にある置き場のスロットに移ります。覆われているネジは、タップできません。",
        "Tap a screw that is showing to move it to a holding slot at the bottom. A covered screw cannot be tapped.",
      ],
      [
        "ネジが1本も残っていない板は、盤から落ち、その板のネジはスロットから出ていくので、ふさがっていたスロットは、また空きます。",
        "A plate with no screw left falls off the board, and the screws it held leave their slots, so the slots they took are free again.",
      ],
      [
        "勝ち：すべての板が落ちたとき。負け：置き場のスロットがすべて埋まり、板がまだ盤に残っているときです。",
        "Win: when every plate has fallen. Lose: when every holding slot is full and a plate is still on the board.",
      ],
      [
        "各レベルのスロットは、最善の順番で必要な数ちょうどなので、たくさんの板から同時にネジを取ると、スロットが埋まって負けになります。",
        "Each level has exactly as many slots as the best order of play needs, so taking screws from many plates at once fills the slots and loses.",
      ],
    ],
    board: [
      "レベルは5つで、板3枚とネジ6本から、板7枚とネジ22本までです。できるときは、1枚ずつ、板を終わらせましょう。",
      "Five levels, from three plates and six screws to seven plates and twenty-two. Where you can, finish one plate at a time.",
    ],
    review: AGENT_READ,
  },
  stretchGrabber: {
    tagline: [
      "よく伸びる腕を、杭や壁を回り込ませて、星まで導きます。赤いものには触れないようにします。",
      "Lead a stretchy arm round pegs and walls to the star, without touching anything red.",
    ],
    origin: [
      "小さな、手を伸ばすパズルの一種です。土台から伸びる腕、ものを避ける道、近づいてはいけない危険があります。ここでのルールはこのサイト独自のもので、各レベルの、星までの最短経路を探索で求め、腕には、その長さに少しの余裕を足した長さを与えています。このアイデアは、誰のものでもありません。",
      "A kind of small reaching puzzle: an arm that grows from a base, a way round things, and hazards to keep clear of. The rules here are this site's own. The shortest route to the star in each level was found by a search, and the arm is given that length plus a little slack. The idea belongs to nobody.",
    ],
    rules: [
      [
        "腕の先を、指かマウスでつかんで、導きます。腕は、先が土台から通ってきた道です。",
        "Take hold of the arm's tip with a finger or the mouse and lead it. The arm is the path the tip has taken from the base.",
      ],
      [
        "先は、杭や壁には入れないので、それらに沿ってすべり、腕は曲がって回り込みます。腕が伸びるのには限りがあり、先を腕に沿って戻すと、縮みます。",
        "The tip cannot enter a peg or a wall, so it slides along them and the arm bends round. The arm can stretch only so far, and if you bring the tip back along it, it draws in.",
      ],
      ["勝ち：先が星に触れたとき。", "Win: when the tip touches the star."],
      [
        "負け：腕のどこかが、赤い塊かレーザーに触れたとき。即座に負けです。",
        "Lose: when any part of the arm touches a red blob or a laser beam. It is immediate.",
      ],
      [
        "指を離すと、腕はそのままの形で止まります。続けるには、もう一度先をつかみます。",
        "Let go and the arm stays as it is. To go on, take hold of the tip again.",
      ],
    ],
    board: [
      "レベルは5つで、進むたびに、腕の余裕が小さくなります。最後のレベルでは、腕は、最短の道より、ほんの少し長いだけです。",
      "Five levels, with less arm to spare each time. In the last, the arm is only a little longer than the shortest way.",
    ],
    review: AGENT_READ,
  },
  gridEscape: {
    tagline: [
      "ブロックをレーンに沿ってすべらせ、道を空けて、鍵のブロックを出口から外へ出します。",
      "Slide the blocks along their lanes to clear a way, and take the key block out through the exit.",
    ],
    origin: [
      "駐車場パズルの仲間の、すべらせブロックのパズルで、紙やプラスチックで、100年にわたって遊ばれてきました。ここでのルールは、ルールだけをもとに書いていて、どのレベルにも、すべての局面を探索して求めた、最少手数が示されます。このアイデアは、誰のものでもありません。",
      "A sliding-block puzzle in the family of the car-park puzzles that have been played on paper and plastic for a century. The rules here are written from the rules alone, and every level shows its fewest possible moves, worked out by searching every position. The idea belongs to nobody.",
    ],
    rules: [
      [
        "盤は6×6です。ブロックは幅1マスで、長さは2か3マス、横か縦に置かれ、長さの方向にしかすべりません。ブロックは、ほかのブロックを通り抜けられず、盤の外にも出られません。",
        "The board is 6 by 6. Blocks are 1 cell wide and 2 or 3 long, laid across or down, and slide only along their length. A block cannot pass through another block or leave the board.",
      ],
      [
        "鍵の付いた金色のブロックが1つ、3行目に横向きに置かれています。出口は、その行の右端にあるすき間です。",
        "One block, gold with a key on it, lies across the third row. The exit is the gap in the right edge of that row.",
      ],
      [
        "1手は、1つのブロックを、もとの位置から指を離した位置まで、何マスでもすべらせることです。もとの場所で指を離したブロックは、1手に数えません。",
        "A move is sliding one block from where it was to where it is let go, by any number of cells. A block let go where it started does not count as a move.",
      ],
      [
        "勝ち：鍵のブロックが出口に着いたとき。負け：手数が尽きたとき。どのレベルも、最少手数の2倍に6手を足した手数まで使えます。",
        "Win: when the key block reaches the exit. Lose: when the moves run out. Each level allows twice its fewest moves, plus six.",
      ],
    ],
    board: ["レベルは5つで、最少手数は7手から36手までです。", "Five levels, with fewest moves from 7 to 36."],
    review: AGENT_READ,
  },
  ropeCut: {
    tagline: [
      "ロープを横切ってなぞって切り、ランタンを穴に落とさずに、ゴールまで届けます。",
      "Swipe across a rope to cut it, and bring the lantern to the goal without letting it fall into the pit.",
    ],
    origin: [
      "ロープとタイミングの、小さな物理ゲームの一種です。何かがぶら下がっていて、切ると、落ちたり揺れたりします。ここでのルールはこのサイト独自のもので、Karakuriパッケージの物理演算の上で、ランタン、フック、かご、ボタンを動かします。このアイデアは、誰のものでもありません。",
      "A kind of small physics game of ropes and timing: something hangs, you cut, and it falls or swings. The rules here are this site's own, on the Karakuri package's physics, with a lantern, hooks, a basket and a button. The idea belongs to nobody.",
    ],
    rules: [
      [
        "ロープは、点がつながった鎖です。上はフックに固定され、下はランタンで、ランタンは重くて丸く、足場に乗ります。",
        "A rope is a chain of points. Its top is fixed to a hook, and its bottom is the lantern, which is heavy and round and rests on platforms.",
      ],
      [
        "ロープを横切ってなぞる（指かマウスをその上でドラッグする）と、切れます。なぞった線が横切るロープのつなぎ目は、すべて切れ、何も横切らなければ、何も起こりません。",
        "Swipe across a rope (drag a finger or the mouse over it) to cut it. A swipe cuts every rope link it crosses, and a swipe that crosses nothing does nothing.",
      ],
      [
        "最初に切るまで、ランタンはじっとぶら下がっています。そのあとは、すべて物理演算で動きます。",
        "The lantern hangs still until the first cut, and after that everything moves by the physics.",
      ],
      [
        "勝ち：ランタンが目標（緑の破線の箱の中）に着いたとき。ボタンのレベルでは、赤いボタンに触れたとき。",
        "Win: when the lantern reaches the target (inside the green dashed box) or, in the button levels, touches the red button.",
      ],
      [
        "負け：ランタンが盤の下、トゲの穴、または横の外へ落ちたとき。レベルによっては、切るロープだけでなく、切るタイミングも大事です。",
        "Lose: when the lantern falls below the board, into the spiked pit, or out of the sides. In some levels it is not only which rope but when you cut that matters.",
      ],
    ],
    board: [
      "レベルは5つで、かごの上の1本のロープから、3本のロープと壁、高い足場の上のボタンまでです。",
      "Five levels, from one rope over a basket to three ropes, a wall and a button on a high ledge.",
    ],
    review: AGENT_READ,
  },
  tubeSort: {
    tagline: [
      "チューブからチューブへ色の層を注ぎ、中身のあるチューブがすべて1色になるようにします。",
      "Pour coloured layers from tube to tube until every tube with anything in it holds one colour.",
    ],
    origin: [
      "小さな、仕分けパズルの一種で、チューブに入った色つきの液体や層を使って遊びます。ここでのルールはこのサイト独自のもので、どのレベルも、決まったシードから配り、探索で勝つ方法が見つかり、しかも行き止まりにも行ける場合だけを残しています。このアイデアは、誰のものでもありません。",
      "A kind of small sorting puzzle, played with coloured liquid or layers in tubes. The rules here are this site's own, and every level was dealt from a fixed seed and kept only if a search finds a way to win it and a dead end can also be reached from it. The idea belongs to nobody.",
    ],
    rules: [
      [
        "チューブには、最大4層が入り、各層は1色です。チューブをタップして持ち上げ、別のチューブをタップすると、一番上の色が注がれます。",
        "A tube holds up to four layers, each of one colour. Tap a tube to pick it up, then tap another to pour the top colour across.",
      ],
      [
        "注げるのは、注ぐ側が空でなく、注がれる側がいっぱいでなく、さらにその側が空か、一番上が同じ色のときです。一番上の同じ色の連なりを、入る分だけまとめて移します。",
        "A pour is allowed when the tube poured from is not empty, and the one poured into is not full and is either empty or has the same colour on top. It moves the whole run of that colour on top, as far as there is room.",
      ],
      [
        "勝ち：中身のあるチューブが、すべて1色になったとき。",
        "Win: when every tube with anything in it holds a single colour.",
      ],
      [
        "負け：意味のある注ぎ方が、1つも残っていないとき。1色のチューブを空のチューブに注いでも、何も変わらず、逃げ道には数えません。",
        "Lose: when no pour that does anything is left. Pouring a one-colour tube into an empty tube changes nothing, and does not count as a way out.",
      ],
      [
        "どの色にも小さな印があるので、色がわからなくても、見分けられます。",
        "Each colour has its own small mark, so they can be told apart without the colour.",
      ],
    ],
    board: [
      "レベルは5つで、4本のチューブに3色から、8本に7色までです。空のチューブは、できるだけ長く、空けておきましょう。",
      "Five levels, from 3 colours in 4 tubes to 7 colours in 8. Keep the empty tube empty for as long as you can.",
    ],
    review: AGENT_READ,
  },
  choiceStory: {
    tagline: [
      "3つの場面でできた物語です。場面ごとに、役に立つ道具を選びます。",
      "A story made of three stages. At each stage, pick the tool that helps.",
    ],
    origin: [
      "子どもにも大人にも向く、小さな絵本ゲームの一種です。行く手に何かがあり、選べる道具が2つあります。言葉はやさしく親しみやすく、起こるいちばん悪いことは、ばしゃっ、ぼよん、どさっ、くらいです。絵はすべて、コードで描いています。このアイデアは、誰のものでもありません。",
      "A kind of small storybook game for children and grown-ups alike: something is in the way, and there are two tools to choose from. The words are gentle and friendly, and the worst that ever happens is a splash, a boing or a flump. All the pictures are drawn in code. The idea belongs to nobody.",
    ],
    rules: [
      [
        "1つのレベルは、3つの場面でできた、1つの物語です。場面には、行く手をふさぐもの、キャラクター、タップできる2つの道具が出ます。",
        "Each level is one story made of three stages. A stage shows what is in the way, the character, and two tools to tap.",
      ],
      [
        "正しい道具をタップすると、小さなアニメーションで、それが役立つ様子が見え、次の場面が始まります。3つ目が終わると、物語はクリアです。",
        "Tap the right tool and a little animation shows it working, and the next stage begins. After the third, the story is won.",
      ],
      [
        "間違った道具をタップすると、害のない失敗が再生され、なぜ役に立たなかったかがメッセージで示され、その場面をもう一度やります。失敗は数えられ、1つもなければ、物語は星3つで終わります。",
        "Tap the wrong tool and a harmless failure plays, a message says why it did not help, and the stage is tried again. The slips are counted, and if there were none, the story ends with three stars.",
      ],
      ["時間制限はなく、挑戦の回数が尽きることもありません。", "There is no time limit, and no way of running out of tries."],
    ],
    board: [
      "物語は4つ、場面は12です。雨の日のおさんぽ、洞くつの夜、雪の日、宝島です。",
      "Four stories, twelve stages: a walk on a rainy day, a night in the cave, a snow day and treasure island.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Record<CasualKind, PartyCopyJa>;
