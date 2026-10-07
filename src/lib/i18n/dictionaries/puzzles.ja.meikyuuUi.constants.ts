import { MEIKYUU_COLOSSAL_LEVELS_A_SIZE, MEIKYUU_LEVELS_A_SIZE, MEIKYUU_SOLID_LEVELS_A_SIZE } from "../../puzzles/meikyuu/levelCounts";
import { MEIKYUU_SIZE_WORDS } from "../../puzzles/meikyuu/sizes";

/**
 * Meikyuu's screen in Japanese: the overlay of `src/components/puzzles/meikyuu.constants.ts`
 * (`copyTable.ts`), one key for each table there. The name of a shape, a way to
 * play or a solid is its `kanji` and is not here; these are the sentences.
 */
const JA_SIZE_WORDS: Record<string, string> = { small: "小", medium: "中", large: "大", huge: "巨大" };

export const MEIKYUU_WORDS_JA = {
  shape: {
    square: { says: ["マスは四角で、縦と横に並びます。", "Square cells, in columns and rows."] },
    hex: { says: ["マスは六角形で、どのマスにも隣が6つあり、1行おきにずれています。", "Hexagonal cells, six neighbours each, every other row shifted."] },
    triangle: { says: ["マスは三角形で、上向きと下向きが交互に並び、どのマスにも隣が3つあります。", "Triangular cells pointing up and down in turn, three neighbours each."] },
    circle: { says: ["中央のマスのまわりに輪が重なり、外の輪ほどマスが多くなります。", "Rings round a middle cell, the outer rings with more cells than the inner."] },
    heart: { says: ["ハートの輪郭の中に、四角いマスが並びます。", "Square cells inside the outline of a heart."] },
    leaf: { says: ["葉の輪郭の中に、四角いマスが並びます。", "Square cells inside the outline of a leaf."] },
    star: { says: ["星の輪郭の中に、四角いマスが並びます。", "Square cells inside the outline of a star."] },
    ring: { says: ["輪の形に四角いマスが並び、真ん中は穴になっています。", "Square cells in a ring, round a hole in the middle."] },
    diamond: { says: ["ひし形の中に、四角いマスが並びます。", "Square cells inside a diamond."] },
    cross: { says: ["十字の形に、四角いマスが並びます。", "Square cells in the shape of a cross."] },
    moon: { says: ["三日月の形に、四角いマスが並びます。", "Square cells in the shape of a crescent moon."] },
    hexagon: { says: ["大きな1つの六角形の形に、六角形のマスが並びます。", "Hexagonal cells, in the shape of one big hexagon."] },
    pyramid: { says: ["大きな1つの三角形の形に、三角形のマスが並びます。", "Triangular cells, in the shape of one big triangle."] },
  },
  way: {
    "enter-leave": {
      label: ["出入り", "In and out"],
      says: ["外壁の出入口から入り、別の出入口から出ます。2つの出入口は、迷路が許すかぎり離れています。", "In at one door in the outer wall, out at another, the two as far apart as the maze allows."],
    },
    "to-goal": { label: ["ゴールを探す", "Find the goal"], says: ["迷路の中のマスから、奥深くに隠れた点まで行きます。", "From a cell inside the maze to a dot hidden deep in it."] },
    "centre-out": { label: ["中心から出る", "Out from the middle"], says: ["形の真ん中から、外壁の出入口を通って出ます。", "From the middle of the shape out through a door in the outer wall."] },
    keys: {
      label: ["鍵", "Keys"],
      says: [
        "中から出発して、途中の鍵をすべて拾い、外壁の出入口へ向かいます。鍵は分かれ道の先にあるので、拾うたびに回り道になります。鍵は上を通ると拾え、線を戻っても拾ったままです。",
        "From inside, picking up every key on the way to a door in the outer wall. A key is at the end of a branch, so each costs a detour. It is picked up by passing over it, and stays picked up when you draw back.",
      ],
    },
  },
  solid: {
    cube: { says: ["サイコロの6面（d6）です。正方形の6つの面が、それぞれ四角いマスに切られ、どの辺でもつながっています。どのマスからも4方向へ進めます。", "A d6: six square faces, each cut into squares, joined across every edge: four ways out of every cell."] },
    sphere: {
      says: [
        "サッカーボールのように、地球儀が六角形に切られ、角には12個の五角形があります。マスから6方向へ進め、角では5方向です。",
        "A globe cut into hexagons, like a football, with twelve pentagons for corners: six ways out of a cell, five at a corner.",
      ],
    },
    octahedron: { says: ["サイコロの8面（d8）です。8つの三角形の面が、それぞれ小さな三角形に切られています。どのマスからも3方向へ進めます。", "A d8: eight triangular faces, each cut into small triangles: three ways out of every cell."] },
    icosahedron: { says: ["サイコロの20面（d20）です。20の三角形の面が、それぞれ小さな三角形に切られています。どのマスからも3方向へ進めます。", "A d20: twenty triangular faces, each cut into small triangles: three ways out of every cell."] },
    tetrahedron: { says: ["サイコロの4面（d4）です。4つの三角形の面が、それぞれ小さな三角形に切られています。どのマスからも3方向へ進めます。", "A d4: four triangular faces, each cut into small triangles: three ways out of every cell."] },
    prism: { says: ["サイコロの3面（d3）で、3つの側面の上を転がる細長いサイコロです。2つの三角形と3つの長い長方形が、四角と三角のマスに切られています。", "A d3, the long die that rolls on its three sides: two triangles and three long rectangles, cut into squares and triangles."] },
    trapezohedron: { says: ["サイコロの10面（d10）です。10枚のたこ形が、それぞれ小さな四角いマスに切られています。どのマスからも4方向へ進めます。", "A d10: ten kites, each cut into small squares: four ways out of every cell."] },
    dodecahedron: { says: ["サイコロの12面（d12）です。12枚の五角形が、それぞれ5つの四角いマスに切られています。どのマスからも4方向へ進めます。", "A d12: twelve pentagons, each cut into five squares: four ways out of every cell."] },
    "rhombic-dodecahedron": { says: ["もう1つの12面のサイコロ（d12）です。12枚のひし形が、それぞれ小さな四角いマスに切られています。どのマスからも4方向へ進めます。", "The other d12: twelve diamonds, each cut into small squares: four ways out of every cell."] },
    bipyramid: { says: ["サイコロの16面（d16）です。2つの頂点のまわりの16枚の三角形が、それぞれ小さな三角形に切られています。どのマスからも3方向へ進めます。", "A d16: sixteen triangles round two points, each cut into small triangles: three ways out of every cell."] },
    icositetrahedron: { says: ["サイコロの24面（d24）です。24枚のたこ形が、それぞれ小さな四角いマスに切られています。どのマスからも4方向へ進めます。", "A d24: twenty-four kites, each cut into small squares: four ways out of every cell."] },
    triacontahedron: { says: ["サイコロの30面（d30）です。30枚のひし形が、それぞれ小さな四角いマスに切られています。どのマスからも4方向へ進めます。", "A d30: thirty diamonds, each cut into small squares: four ways out of every cell."] },
    box: { says: ["レンガの形で、縦・横・高さが3・2・1です。6つの面が四角いマスに切られ、どの辺でもつながっています。", "A brick, three by two by one: its six faces cut into squares, joined across every edge."] },
    cross: { says: ["立体の十字です。立方体7つで、真ん中の立方体の6つの面すべてに立方体が付いています。腕が後ろを隠すことがあるので、隠れたマスのほうへ立体が回ります。", "A plus sign in three dimensions: seven cubes, a cube on every face of the middle one. An arm can hide the part behind it, so the solid turns to a cell it hides."] },
    ring: { says: ["8つの立方体が四角く並び、真ん中に穴があります。穴から向こう側が見えるので、手前に隠れたマスのほうへ立体が回ります。", "Eight cubes in a square round a hole. The far side shows through the hole, so the solid turns to a cell the near side hides."] },
    torus: { says: ["ドーナツの形です。筒が輪に曲がり、ぐるりと両方向に四角いマスに切られています。穴から向こう側が見えます。", "A doughnut: a tube bent into a ring, cut into squares all the way round both ways. The far side shows through the hole."] },
    star: { says: ["先を上にした五芒星で、少し厚みがあります。2つの面とそのまわりの縁がひと続きの表面です。線をたどって、裏や縁へ回してください。", "A five-pointed star, tips up, a little thick: its two faces and the rim round them are one surface. Turn it to its back or its rim to follow your line."] },
    heart: { says: ["上にくぼみのある丸いハートで、小さな三角形のマスに切られています。どのマスからも3方向へ進めます。", "A rounded heart with a cleft at the top, cut into small triangles: three ways out of every cell."] },
  },
  surface: {
    label: ["表面を進む", "Over the surface"],
    says: [
      "立体の片側のマスから、遠く反対側の点まで、表面全体を通って進みます。立体を回して、自分の線をたどります。見えている面の端に線が届くと、立体が自分で回ります。",
      "From a cell on one side of the solid to a dot far across it, over the whole surface. Turn the solid to follow your line: it turns by itself when the line reaches the edge of the side you can see.",
    ],
  },
  step: {
    small: { label: ["小", "Small"], says: ["約100マス。手早く遊べます。", "About a hundred cells: the quick ones."] },
    medium: { label: ["中", "Medium"], says: ["約300マスです。", "About three hundred cells."] },
    large: { label: ["大", "Large"], says: ["約650マス。時間がかかり、立体を何度も回す必要があります。", "About six hundred and fifty cells: they take a while, and want the solid turned again and again."] },
    huge: { label: ["特大", "Huge"], says: ["約1300マス。拡大して、立体をたびたび回します。", "About thirteen hundred cells: zoom in, and turn the solid often."] },
    colossal: { label: ["超巨大", "Colossal"], says: ["約4000マスで、いちばん難しいサイズです。指の幅のマスになるのは4倍に拡大したときだけなので、拡大して、動かしながら遊びます。", "About four thousand cells, the hardest there are: a cell is a finger wide only when you zoom in four times, so play it zoomed in and move about it."] },
  },
  turn: {
    legend: ["立体を回す", "Turn the solid"],
    left: ["左へ回す", "Turn left"],
    right: ["右へ回す", "Turn right"],
    up: ["上へ回す", "Turn up"],
    down: ["下へ回す", "Turn down"],
    faceMe: ["こちらを向く", "Face me"],
    faceMeSays: ["線の端が自分のほうを向くよう、立体を回します。線がまだないときは、スタートが向きます。", "Turn the solid so that the end of your line faces you. With no line yet it is the start."],
    only: ["回すだけ", "Turn only"],
    onlySays: [
      "オンのあいだは、指をドラッグすると、どこでも立体が回り、線は引かれません。もう1回押すと、線を引けます。線の端から離れる向きにドラッグしても、立体は回ります。",
      "While it is on, a finger turns the solid wherever it drags and draws nothing. Press it again to draw. Dragging away from the end of your line turns the solid anyway.",
    ],
    howTo: [
      "緑のスタートを押して、通路に沿ってドラッグします。線から離れる向きにドラッグするか、矢印を押すと、立体が回ります。見えている面の端に線が届くと、立体は自分で回ります。「こちらを向く」は、線の端を手前に持ってきます。",
      "Press the green start and drag along the passages. Drag away from your line, or press the arrows, to turn the solid; it turns by itself when your line reaches the edge of the side you can see. Face me brings the end of the line to the front.",
    ],
  },
  chips: {
    difficulty: {
      label: ["難しさ", "Difficulty"],
      says: [
        "このレベルの遊びにくさを、0から100で表します。抜け道の長さ、分かれ道の数、ゴールへまっすぐ向かうとまちがえる頻度、まちがえた先の長さ、そして抜け道が迷路のどれだけの広がりを通るかで決まります。道が隅だけにとどまる迷路は、数字が低くなります。",
        "How hard this level is to play, on a scale of 0 to 100: how long the way through is, how many forks it has, how often heading straight for the goal goes wrong, how far the wrong turns go, and how much of the map the way crosses. A way that stays in one corner counts for less.",
      ],
    },
  },
  wayUp: {
    legend: ["縦長の迷路の向き", "Tall mazes, which way up"],
    auto: {
      label: ["自動", "Auto"],
      says: [
        "スマートフォンを縦に持っているときは立てて表示し、画面が広くて、横にしたほうが大きく表示できるときは、横に倒します。",
        "Upright on a phone held upright, and lying on its side where the screen is wide enough for it to be bigger that way.",
      ],
    },
    portrait: { label: ["立てる", "Upright"], says: ["つねに立てて表示します。迷路が作られたとおり、横2列に縦3行です。", "Always stood up, two columns to three rows, as the maze was made."] },
    landscape: {
      label: ["倒す", "Lying down"],
      says: ["つねに4分の1回転して、横にします。広い画面に合います。引く線は、どちらの向きでも同じ線です。", "Always on its side, a quarter turn, which fits a wide screen. The line you draw is the same line either way up."],
    },
  },
  progress: {
    legend: ["解いた数", "Solved"],
    of: ["{1}問中{0}問", "{0} of {1}"],
    whole: ["すべて解決", "All solved"],
    cheer: ["{0}のレベルは、すべて解けました：全{1}問。おめでとうございます！", "Every {0} level is solved: all {1}. Well done!"],
    last: ["これが最後の1問でした：{0}のレベル全{1}問が解けました。おめでとうございます！", "That was the last one: all {1} {0} levels are solved. Well done!"],
    yours: ["自分の進み具合", "Your progress"],
  },
  move: {
    press: ["移動", "Move"],
    says: ["オンのあいだは、拡大した迷路の表示を、指1本のドラッグで動かし、線は引かれません。もう1回押すと、線を引けます。", "While it is on, a finger drags the view of a zoomed maze and draws nothing. Press it again to draw."],
    edge: {
      label: ["線が端に届いたら、表示を動かす", "Slide the view when the line reaches the edge"],
      says: [
        "拡大した迷路で、線を盤の端まで引くと、表示がゆっくりいっしょに動きます。オフにすると、「移動」か2本の指で、自分で表示を動かします。",
        "On a zoomed maze, a line drawn to the edge of the board moves the view along with it, gently. Switch it off to move the view yourself, with Move or two fingers.",
      ],
    },
  },
  stone: {
    press: ["石", "Stone"],
    says: [
      "石を置きます。オンのあいだは、線のそばのマスをタップすると、その通路がふさがれ、線は入れません。石をタップすると取り上げます。もう1回押すと、線を引けます。石を置けるのは、線から通路に沿って最大2マスまでです。",
      "Lay a stone: with it on, tap a cell beside your line to shut that passage, and the line cannot go in. Tap a stone to take it up. Press again to draw. A stone goes at most two cells along the passages from your line.",
    ],
    how: [
      "石のモードです。線のそばの、通路に沿って最大2マスまでのマスをタップすると、線が入れない石が置かれます。石をタップすると取り上げます。",
      "Stone mode. Tap a cell beside your line, up to two cells along the passages from it, to lay a stone the line cannot enter. Tap a stone to take it up.",
    ],
    other: [
      "線のそばのマスに指を半秒ほど置き続けても、石を置けます。Shiftを押しながら、線の端で矢印キーを押しても置けます。",
      "You can also hold a finger on a cell beside your line for half a second to lay a stone, or hold Shift and press an arrow key at the end of your line.",
    ],
    left: ["残りの石：{0}", "Stones left: {0}"],
    laid: ["置いた石：{0}", "Stones laid: {0}"],
    legend: ["石", "Stones"],
    limited: {
      label: ["少しだけ", "A few"],
      says: [
        "同時に置ける石は少しだけで、大きな迷路ほど多くなります。小さい迷路は4つ、巨大な迷路は9つ、超巨大な迷路は13個です。1つ取り上げると、その分を使えます。",
        "A few stones at once, more for a bigger maze: 4 for a small one, 9 for a huge one, 13 for a colossal one. Take one up and you have it back.",
      ],
    },
    unlimited: {
      label: ["好きなだけ", "As many as I like"],
      says: ["同時に置ける石の数に上限はありません。それでも、置けるのは線のそばだけです。", "No limit on how many stones lie at once. They still go only beside your line."],
    },
    note: [
      "石は自分のためだけのものです。答えには入りません。ゲームといっしょに保存されるので、戻ってきたときも、そのままです。",
      "A stone is only for you: it is never part of your answer, and it is kept with your game, so it is still there when you come back.",
    ],
  },
  shapeCopy: {
    legend: ["形", "Shape"],
    square: { label: ["四角", "Square"], says: ["四角い箱の迷路です。サイズは小から巨大まで4つあります。", "Mazes in a square box: four sizes, from small to huge."] },
    tall: {
      label: ["縦長", "Tall"],
      says: [
        "縦長の箱の迷路です。横2列に縦3行で、スマートフォンを縦に持って遊ぶためのものです。広い画面では横に倒れます。",
        "Mazes in a tall box, two columns to three rows, made to be played on a phone held upright. They lie on their side on a wide screen.",
      ],
    },
    colossal: {
      label: ["超巨大", "Colossal"],
      says: ["いちばん大きな迷路で、約1万マスです。四角い箱のものと縦長の箱のものが1つずつあります。拡大して、動かしながら遊びます。", "The biggest mazes there are, about ten thousand cells: one in a square box and one in a tall one. Zoom in, and move about it."],
    },
    solid: {
      label: ["立体", "3D"],
      says: ["立体の表面全体にある迷路です。サイコロ（3面から30面まで）と、形（球、直方体、十字、リング、トーラス、星、ハート）があります。立体を回して、線をたどります。", "Mazes over the whole surface of a solid: a die (a d3 to a d30) or a shape (a globe, a box, a cross, a ring, a torus, a star or a heart). Turn it to follow your line round."],
    },
    stepLegend: ["立体のサイズ", "Size of the solid"],
    moreTall: ["大きいほうへ、{0}まで →", "Bigger, to {0} →"],
    lessTall: ["← 小さいほうへ、{0}から", "← Smaller, from {0}"],
  },
  copy: {
    levelsNote: [
      `レベルは1つの迷路で、全員が同じです。どのサイズにも、やさしい順に${MEIKYUU_LEVELS_A_SIZE}問あります（超巨大は各${MEIKYUU_COLOSSAL_LEVELS_A_SIZE}問、立体は各サイズ${MEIKYUU_SOLID_LEVELS_A_SIZE}問）。どれでも選べます。「スタート」を押すと、まだ解いていない最初の1問が始まります。レベルにはヒントも時計の制限もないので、誰とでもタイムを比べられます。`,
      `A level is a maze, the same for everybody, and each size has ${MEIKYUU_LEVELS_A_SIZE} levels in order from easy to hard (${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} for each colossal one, ${MEIKYUU_SOLID_LEVELS_A_SIZE} for each size of a solid). Pick any of them: Start plays the first one you have not solved. A level has no hint and no clock, so a time on it is one anybody can be compared with.`,
    ],
    levelsLine: [
      `4つのサイズ（${MEIKYUU_SIZE_WORDS.map((word) => JA_SIZE_WORDS[word] ?? word).join("、")}）と、スマートフォンを縦に持つための6つの縦長のサイズに、各${MEIKYUU_LEVELS_A_SIZE}問のレベルがあり、サイズごとにやさしい順に並びます。約1万マスの超巨大な2つに各${MEIKYUU_COLOSSAL_LEVELS_A_SIZE}問、回して遊ぶ18の立体の5つのサイズに各${MEIKYUU_SOLID_LEVELS_A_SIZE}問あります。`,
      `${MEIKYUU_LEVELS_A_SIZE} levels in each of four sizes (${MEIKYUU_SIZE_WORDS.join(", ")}) and in each of six tall ones for a phone held upright, each size easy to hard, ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} in each of two colossal ones of about ten thousand cells, and ${MEIKYUU_SOLID_LEVELS_A_SIZE} in each of five sizes of eighteen solids to turn.`,
    ],
    howTo: [
      "スタートの点を押して、ドラッグします。線は通路に沿って進み、戻ると短くなります。通路をふさぐには、「石」を押して線のそばのマスをタップするか、そこに指を押し続けます。",
      "Press the start dot and drag. The line follows the corridors, and drawing back shortens it. To shut a passage, press Stone and tap a cell beside your line, or hold a finger on it.",
    ],
    status: {
      by: 2,
      is: { "0": ["{0}マス引きました。", "{0} cells drawn."] },
      other: ["{0}マス引きました。鍵は{2}個のうち{1}個を拾いました。", "{0} cells drawn. {1} of {2} keys picked up."],
    },
  },
} as const;
