import type { JaLine } from "../copyJa.types";
import { TOBIISHI_LEVELS_A_SIZE } from "../../puzzles/tobiishi/levelCounts";
import { TOBIISHI_SIZES, tobiishiJumpsWord } from "../../puzzles/tobiishi/sizes";
import { speaker } from "../i18n";

/**
 * The words of Suido's, Tobiishi's and the Cube's screens, and of Tsunagi's row of
 * chips, in Japanese: overlays (`copyTable.ts`) of the tables in
 * `src/components/puzzles/suido.constants.ts`, `tobiishi.constants.ts`,
 * `cube.constants.ts` and `puzzles.constants.ts`. A name that has its kanji beside it
 * is not here: a Japanese reader is shown the kanji (`Speaker.pairName`).
 */
export const SUIDO_WORDS_JA = {
  kinds: {
    drains: { label: ["排水口", "Drains"], blurb: ["水をすべての排水口へ導きます。水の要らない駒は予備なので、どの向きのままでもかまいません。", "Lead the water to every drain. Pieces the water does not need are spares: leave them facing any way."] },
    network: { label: ["ネットワーク", "Network"], blurb: ["すべての駒に水を通す必要があるので、予備はありません。盤全体が、ひと続きの管になります。", "Every piece must carry water, so there are no spares: the whole board is one set of pipes."] },
    "inlet-outlet": {
      label: ["入口から出口", "Inlet to outlet"],
      blurb: [
        "水は左上から入り、右下から出ます。枝分かれのない1本の道になります。ほかの駒はおとりで、乾いたままです。",
        "The water comes in at the top left and must leave at the bottom right, in one path with no branches. The other pieces are decoys and stay dry.",
      ],
    },
  },
  squares: {
    none: { label: ["1マスの駒", "Single pieces"], blurb: ["どの駒も1マスで、タップするとその駒が回ります。", "Every piece is one square, and a tap turns that piece."] },
    big: {
      label: ["大きい駒", "Big pieces"],
      blurb: [
        "大きい駒があります。4マスで1つの駒になり、開口部は最大8つです。タップすると、その場で駒全体が4分の1回転します。ネットワークなので、すべての駒に水を通す必要があります。",
        "Some pieces are big: four squares that are one piece, with up to eight openings. A tap turns the whole piece a quarter, where it stands. A network, so every piece must carry water.",
      ],
    },
    turn: {
      label: ["ブロック回転", "Block turns"],
      blurb: [
        "4つの駒の四角が、輪で囲まれていることがあります。タップすると4つがいっしょに4分の1回転し、それぞれ次の位置へ回り込みます。ネットワークなので、すべての駒に水を通す必要があります。",
        "Some squares of four pieces are ringed: a tap turns all four together a quarter, each moving round to the next place as it turns. A network, so every piece must carry water.",
      ],
    },
  },
  twists: {
    drains: { label: ["排水口", "Drains"], says: ["すべての排水口へ届かせます。水の要らない駒は、どの向きでも、乾いたままでかまいません。", "Reach every drain. Pieces the water does not need may stay dry, facing any way."] },
    pumps: { label: ["ポンプ", "Pumps"], says: ["ポンプが複数あり、それぞれが自分の管に水を送ります。", "More than one pump, each feeding its own pipes."] },
    locked: { label: ["固定された駒", "Locked pieces"], says: ["錠のついた駒は回せません。すでに正しい向きなので、これを起点に組み立てます。", "A piece with a padlock cannot be turned. It already faces the right way, so build from it."] },
    walls: { label: ["壁", "Walls"], says: ["水は壁を越えられません。壁に向かって開いた管からは、水がこぼれます。", "Water cannot cross a wall: a pipe open towards one runs out."] },
    wrap: {
      label: ["端がつながる", "Edges join"],
      says: [
        "盤の端はつながっています。右端から出た水は左端から入り、下端から出た水は上端から入ります。破線の縁がそれを示します。",
        "The edges of the board join: water leaving the right side comes in at the left, and out of the bottom at the top. A dashed rim shows it.",
      ],
    },
    "inlet-outlet": {
      label: ["入口から出口", "Inlet to outlet"],
      says: [
        "水は左上から入り、右下から出ます。枝分かれのない1本の道になります。ほかの駒はおとりで、乾いたままです。",
        "The water comes in at the top left and must leave at the bottom right, in one path with no branches. The other pieces are decoys and stay dry.",
      ],
    },
    "big-pieces": {
      label: ["大きい駒", "Big pieces"],
      says: ["大きい駒は4マスを占め、開口部は最大8つです。1回タップすると、その場で駒全体が4分の1回転します。", "A big piece fills four squares and has up to eight openings. One tap turns the whole piece a quarter, where it stands."],
    },
    "block-turns": {
      label: ["ブロック回転", "Block turns"],
      says: [
        "4つの駒が破線で囲まれているところでは、タップすると4つがいっしょに回り、それぞれ次の位置へ回り込みます。1つだけを回すことはできません。",
        "Where four pieces are ringed by a dashed line, a tap turns all four together: each moves round to the next place as it turns. They cannot be turned on their own.",
      ],
    },
  },
  chips: {
    difficulty: {
      label: ["難しさ", "Difficulty"],
      says: [
        "同じサイズの盤の中で、このレベルがどれだけ難しいかの目安です。ひと目でわかることの少なさ、見直しの回数、試さなければならない量で決まります。",
        "How hard this level measured among boards of its size: how little is plain at the first look, how many looks it takes, and how much has to be tried.",
      ],
    },
    teaches: { says: ["このブロックの新しい考え方です。15番目のレベルが、やさしく見せてくれます。", "This block's new idea: its 15th level shows it gently."] },
    tests: {
      label: ["ブロックのテスト", "Block's test"],
      says: ["このブロックのテストです。16番目のレベルが、その仕掛けを強く使います。", "This block's test: its 16th level uses its twist hard."],
    },
  },
  modes: {
    levels: {
      label: ["レベル", "Levels"],
      says: [
        "やさしい順に並んだ固定の盤で、全員が同じです。14×14までの各サイズに256問、巨大な盤には64問あります。",
        "Fixed boards at every size, easy to hard, the same for everybody: 256 at each size to 14×14, and 64 on the huge ones.",
      ],
    },
    make: { label: ["盤を作る", "Make a board"], says: ["選んだサイズとレベルで、そのつど新しい盤を作ります。", "A new board each time, at a size and a level you choose."] },
  },
  copy: {
    levelsNote: [
      "どのサイズにも固定のレベルがあり、14×14までは各256問、巨大な盤は各64問です。やさしい順に並び、どのレベルも答えがちょうど1つです。レベルには仕掛けがつくことがあります。ポンプが複数、固定された駒、壁、つながる端、入口から出口までの1本の道です。16レベルのブロックは、ひとつ前のブロックを解くと開きます。",
      "Every size has fixed levels, 256 of them up to 14×14 and 64 on the huge boards, easy to hard, and each has exactly one answer. A level can come with a twist: several pumps, locked pieces, walls, edges that join, or a single path from an inlet to an outlet. A block of 16 levels opens when the one before it is solved.",
    ],
    levelsLine: [
      "16のサイズに、やさしい順の固定レベルもあります。5×5から14×14までと、細長い5×7、6×10、8×14は各256問、巨大な20×20、28×28、20×50は各64問です。",
      "Also fixed levels at each of 16 sizes, easy to hard: 256 at each from 5×5 to 14×14 and the long boards 5×7, 6×10 and 8×14, and 64 at each of the huge 20×20, 28×28 and 20×50.",
    ],
    levelsNoHint: ["レベルにはヒントがないので、そのタイムは、誰とでも比べられます", "A level has no hint, so a time on it is one anybody can be compared with"],
    levelsNoHelp: ["レベルにはヒントも時計の制限もないので、そのタイムは、誰とでも比べられます。", "A level has no hint and no clock, so a time on it is one anybody can be compared with."],
    howTo: ["駒をタップすると、4分の1回転します。水はポンプから、つながっているすべての管を流れ、開いた端からしたたり落ちます。", "Tap a piece to turn it a quarter. The water runs from the pump along every pipe that joins, and drips out of any open end."],
    turn: ["回す", "Turn"],
    status: {
      by: 0,
      is: {
        "inlet-outlet": {
          by: 1,
          is: { true: ["水は入口から出口まで1本の道を流れ、漏れはありません。", "The water runs from the inlet to the outlet in one path, and nothing leaks."] },
          other: {
            by: 4,
            is: { "0": ["{2}個の駒が濡れています。漏れはありません。", "{2} pieces wet, nothing leaking."] },
            other: ["{2}個の駒が濡れています。開いた端{4}か所から漏れています。", "{2} pieces wet, {4} open ends leaking."],
          },
        },
        network: {
          by: 1,
          is: { true: ["すべての駒が濡れていて、漏れはありません。", "Every piece is wet and nothing leaks."] },
          other: {
            by: 4,
            is: { "0": ["{3}個中{2}個の駒が濡れています。漏れはありません。", "{2} of {3} pieces wet, nothing leaking."] },
            other: ["{3}個中{2}個の駒が濡れています。開いた端{4}か所から漏れています。", "{2} of {3} pieces wet, {4} open ends leaking."],
          },
        },
        drains: {
          by: 1,
          is: { true: ["すべての排水口に水が届いていて、漏れはありません。", "Every drain is reached and nothing leaks."] },
          other: {
            by: 4,
            is: { "0": ["{3}か所中{2}か所の排水口に水が届いています。漏れはありません。", "{2} of {3} drains reached, nothing leaking."] },
            other: ["{3}か所中{2}か所の排水口に水が届いています。開いた端{4}か所から漏れています。", "{2} of {3} drains reached, {4} open ends leaking."],
          },
        },
      },
    },
  },
} as const;

export const TOBIISHI_WORDS_JA = {
  chips: {
    difficulty: {
      label: ["難しさ", "Difficulty"],
      says: [
        "ゴールまでの最短の道が何回のジャンプかを表します。3回で印が1つ、6回で3つ、9回で5つです。ジャンプが多いほど駒が多く、行き詰まる道も増えます。",
        "How many jumps the shortest way to the goal has: 3 is one mark, 6 is three and 9 is five. More jumps means more pegs, and more ways to get stuck.",
      ],
    },
  },
  copy: {
    levelsNote: [
      "レベルは、数個の駒とゴールの穴がある盤で、全員が同じです。長さを選んでから、その中のレベルを選びます。「スタート」を押すと、まだ解いていない最初の1問が始まります。レベルにはヒントも時計の制限もないので、そのタイムは、誰とでも比べられます。",
      "A level is a board with a few pegs on it and a goal hole, the same for everybody. Pick a length, then any level of it: Start plays the first one you have not solved. A level has no hint and no clock, so a time on it is one anybody can be compared with.",
    ],
    howTo: [
      "駒をタップし、その駒が飛び込む空の穴をタップします。ドラッグして動かしてもかまいません。最後の駒1個を、ゴールに残します。",
      "Tap a peg, then the empty hole it should jump to, or drag it there. Leave one peg, in the goal.",
    ],
    status: ["ジャンプ{1}回で、駒は{0}個になりました。", "{0} pegs left after {1} jumps."],
    stuck: ["飛べる駒がありません。ジャンプを1つ戻して、別の順番を試してください。", "No jump is left. Undo a jump and try another order."],
    wrongHole: ["駒は1個になりましたが、ゴールの穴ではありません。元に戻して、別の順番を試してください。", "One peg is left, but not in the goal. Undo and try another order."],
  },
} as const;

/** The front door's line for Tobiishi's levels, from the package's own word for each length (`tobiishiJumpsWord`) said in each language. */
export function tobiishiLevelsLineJa(jaWord: (size: number) => string, enWord: (size: number) => string): JaLine {
  const parts = TOBIISHI_SIZES.map((size) => `${jaWord(size)}が${TOBIISHI_LEVELS_A_SIZE}問`).join("、");
  const back = TOBIISHI_SIZES.map((size) => `${TOBIISHI_LEVELS_A_SIZE} of ${enWord(size)}`).join(", ");
  return [`${parts}：9つの盤があり、それぞれにゴールの穴が3つあります。`, `${back}: nine boards, three goal holes each.`];
}

/** Tobiishi's screen as a reader of Japanese is given it: the table above, with the front door's line for the levels made from the package's own word for each length. */
const JA_SAYS = speaker("ja");
export const TOBIISHI_JA = {
  chips: TOBIISHI_WORDS_JA.chips,
  copy: { ...TOBIISHI_WORDS_JA.copy, levelsLine: tobiishiLevelsLineJa((size) => tobiishiJumpsWord(size, JA_SAYS), (size) => tobiishiJumpsWord(size)) },
};

export const CUBE_COPY_JA = {
  label: ["{0}×{0}のキューブです。ステッカーをドラッグすると、その層が回ります。キューブのまわりをドラッグすると、向きを変えて見られます。", "A {0}×{0} cube. Drag a sticker to turn its layer, or drag around the cube to look at it."],
  inspecting: ["よく見てください。時計は、{0}秒後か、最初に回したときに始まります。", "Look it over: the clock starts in {0} or with your first turn."],
  howTo: [
    "ステッカーをドラッグすると、その層が回ります。キューブのまわりをドラッグすると、向きを変えて見られます。ステッカーの上でホイールを回すと行、Ctrlを押しながらだと列、Shiftを押しながらだと面が回ります。キー：R L U D F B、Shiftで逆回し、M E S、x y z、内側の層は先に数字を押します。",
    "Drag a sticker to turn its layer; drag around the cube to look. Wheel over a sticker turns its row, Ctrl+wheel its column, Shift+wheel its face. Keys: R L U D F B, Shift for back, M E S, x y z, a digit first for an inner layer.",
  ],
  solving: ["すべての面が1色になるまで回します。", "Turn it until every face is one colour."],
  scramble: ["スクランブル", "Scramble"],
  undo: ["元に戻す", "Undo"],
  giveUp: ["あきらめる", "Give up"],
  resetLook: ["正面に戻す", "Front on"],
  moves: ["{0}手", "{0} moves"],
  zoomGroup: ["キューブの拡大・縮小", "Zoom the cube"],
  zoomIn: ["キューブを拡大する", "Zoom the cube in"],
  zoomOut: ["キューブを縮小する", "Zoom the cube out"],
  zoomReset: ["キューブを最初の大きさに戻す", "Put the cube back to its first size"],
  zoomHow: ["ピンチするか、Altを押しながらホイールを回すと、拡大・縮小できます。", "Pinch, or hold Alt and use the wheel, to zoom."],
  replayStart: ["スクランブル", "The scramble"],
  replayAt: ["{1}手中{0}手め", "Move {0} of {1}"],
  replaySolved: ["スクラバーで、スクランブルから完成まで、解き方を1手ずつたどれます。", "Step through the solve with the scrubber, from the scramble to solved."],
  replayGivenUp: ["ここであきらめました。ここまでの道筋を、さかのぼってたどれます。", "Given up here: step back through how it got there."],
  replayNone: ["配られたままのスクランブルです。", "The scramble, as it was dealt."],
  guideOpen: ["やり方を見る", "Show me how"],
  guideCost: [
    "初心者向けの解き方の、次の手順を見せます。使って解いても記録には数えられますが、得点はなく、最速の表にも載りません。",
    "Shows the next step of the beginner's method. A solve that uses it still counts, but scores no points and stays off the fastest tables.",
  ],
  guideNext: ["次へ", "Next"],
  guideLeft: ["あと{0}手順", "{0} steps to go"],
  guideTurn: ["代わりに回す", "Turn it for me"],
  guideHide: ["かくす", "Hide"],
  guideOnCube: ["キューブの上に表示する", "Show me on the cube"],
  guideOffCube: ["キューブの上の表示をやめる", "Stop showing it on the cube"],
  guideMoveNow: ["今の手", "Now"],
  guideShow: ["次の手順を見る", "Show the next step"],
  guideSizes: ["手順つきの案内は、2×2と3×3だけです。", "The step-by-step help is for the 2×2 and 3×3."],
  guideLearn: ["解き方を学ぶ", "Learn the method"],
} as const;

export const TSUNAGI_CHIPS_JA = {
  difficulty: {
    label: ["難しさ", "Difficulty"],
    says: [
      "同じサイズのレベルの中で、このレベルがどれだけ難しいかの目安です。角の数、推測が必要な量、手順だけでは埋められないマス、いちばん長い線で決まります。",
      "How hard this level measured among this size's levels: its corners, the guessing it asks for, the cells you cannot fill by forced moves, and its longest line.",
    ],
  },
  bridges: {
    label: ["橋", "Bridges"],
    says: [
      "橋は、2本の線が交わる場所です。1本は横にまっすぐ、もう1本は縦にまっすぐ通ります。どちらも橋の上では曲がれず、必ず交差します。",
      "A bridge is crossed by two lines: one straight across, a different one straight down. Neither may turn on it, and both must cross.",
    ],
  },
  walls: { label: ["壁", "Walls"], says: ["線は、壁を越えることも、ふさがれたマスに入ることもできません。", "No line may cross a wall, or go into a blocked cell."] },
  waypoints: { label: ["経由点", "Waypoints"], says: ["マスの上の輪は経由点です。その色の線は必ず通り、ほかの線は通れません。", "A ring on a cell is a waypoint: the line of its colour must pass through it, and no other line may."] },
  wrap: {
    label: ["端がつながる", "Wrap"],
    says: [
      "盤の端はつながっています。ある辺から出た線は、反対側から戻ってきます。端の外にある薄いコピーへドラッグして、反対側の線の端から続けます。",
      "The edges join: a line leaving one side comes back in on the other. Drag off an edge onto its faded copy, then carry on from the line's end on the far side.",
    ],
  },
  portals: {
    label: ["ポータル", "Portals"],
    says: [
      "同じ輪が2つあると、それがポータルです。1つに入った線は、同じ向きのまま、もう1つから出てきます。どちらの輪も、線が埋めるマスです。ポータルは、ちょうど1本の線が1回だけ通ります。輪を指すかタップすると、相手が見えます。",
      "Two rings alike are a portal. A line that goes into one comes out of the other, going the same way, and both rings are cells it fills. Each portal is gone through by exactly one line, once. Point at a ring, or tap it, to see its partner.",
    ],
  },
  explosions: {
    label: ["爆発", "Explosions"],
    says: [
      "何回か線を引くごとに、引いた線の1本が壊れます。半分まで短くなり、いちばん難しい盤では、隣の線もいっしょに消えます。盤の下の数が、次の爆発までの回数を教えてくれます。同じ引き方なら、いつも同じ線が壊れます。レベルを解く最後の線では、爆発しません。",
      "Every few strokes, a drawn line is broken: cut back to half, or on the hardest boards wiped with a line beside it cut too. The count under the board says when the next one goes off. The same strokes always break the same line, and the stroke that solves the level sets nothing off.",
    ],
  },
  strokes: {
    label: ["線を引ける回数", "Stroke limit"],
    says: [
      "線を引ける回数に限りがあります。盤を変えて指を離すたびに1回使い、「元に戻す」では戻りません。解く前に使い切っても、「最初からやり直す」で全部戻ります。",
      "Only so many strokes: every time you lift your finger having changed the board, one is spent, and Undo gives none back. Run out before it is solved and Restart gives you them all again.",
    ],
  },
  sparse: {
    label: ["組が少ない", "Few lines"],
    says: [
      "この大きさの盤にしては、組の数が少なく、1本1本の線が長く、遠くまで行きます。新しいルールはなく、距離が難しさです。",
      "Fewer pairs than a board this size usually has, so each line is long and has far to go. No new rule: the distance is the difficulty.",
    ],
  },
  hexagon: { label: ["六角形", "Hexagon"], says: ["ハチの巣の形です。どのマスにも隣が6つあり、線は上下、左右、斜め2方向に進めます。", "A honeycomb: every cell has six neighbours, so a line may run up and down, side to side, and along both slants."] },
  teaches: {
    label: ["新登場：{0}", "New: {0}"],
    says: ["このブロックの新しい考え方です。15番目のレベルが、やさしく見せてくれます。", "This block's new idea: its 15th level shows it gently."],
  },
  tests: { label: ["ブロックのテスト", "Block's test"], says: ["このブロックのテストです。16番目のレベルが、その仕掛けを強く使います。", "This block's test: its 16th level uses its twist hard."] },
} as const;
