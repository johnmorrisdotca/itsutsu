import { AGENT_READ_2026_10_06, type JaCases, type JaLine, type JaNode } from "../copyJa.types";
import { KUMIMOJI_HANDS, KUMIMOJI_WILDS } from "../../puzzles/kumimoji/tiles.constants";
import { SCRAMBLE_LENGTHS } from "../../puzzles/cube/generate";
import { MEIKYUU_EVERY_SIZE, meikyuuSizeLabel, meikyuuSolidOf, MEIKYUU_COLOSSAL_SIZE, MEIKYUU_COLOSSAL_TALL_SHAPE, MEIKYUU_COLOSSAL_TALL_SIZE, meikyuuTallShape } from "../../puzzles/meikyuu/sizes";
import type { PuzzleKind, PuzzleLevel } from "../../puzzles/puzzles.types";
import { TOBIISHI_SIZES, tobiishiSizeLabel } from "../../puzzles/tobiishi/sizes";

/**
 * The words about levels, countdowns and sizes, in Japanese: overlays of the
 * English tables in `src/lib/puzzles/puzzles.constants.ts` and of
 * `jirai/jirai.constants.ts`. A level's, a clock's and a size's NAME is its
 * `kanji` (初級, 亀, 速), which a Japanese reader is shown in place of the English
 * label; only the sentences are here.
 */
export const AGENT_READ = AGENT_READ_2026_10_06;

/** `PUZZLE_LEVEL_DISPLAY`: what a level means where it means "how much has to be tried". */
export const PUZZLE_LEVEL_DISPLAY_JA: Record<PuzzleLevel, { blurb: JaLine }> = {
  easy: { blurb: ["どの手も、見るだけで見つかります。試す必要はありません。", "Every step can be found by looking; nothing has to be tried."] },
  medium: {
    blurb: ["見るだけでほとんど進みますが、どこかで1つ試して確かめる必要があります。", "Looking gets you most of the way; somewhere you have to try one thing and see."],
  },
  hard: { blurb: ["何かを試して確かめる場所が、2か所以上あります。", "More than one place where you have to try something and see."] },
  "extra-hard": { blurb: ["何かを試して確かめる場所が、いちばん多くあります。", "The most places where you have to try something and see."] },
};

/**
 * A line for each size a puzzle offers, for an English word that is made from the size by a function
 * (`CARD_SIZE_WORDS`): what the size is called is looked up, and a size with no line is read in English.
 */
function bySize(sizes: readonly number[], line: (size: number) => JaLine): JaCases {
  return { by: 0, is: Object.fromEntries(sizes.map((size): [string, JaNode] => [String(size), line(size)])) };
}

/** `checkAllowanceWords`: how many times Check may be pressed (`null` is no limit). */
export const CHECK_ALLOWANCE_BLURB_JA = {
  by: 0,
  is: {
    null: [
      "チェックと表示は、何度でも使えます。チェックはまちがっているマスの数を、表示はどのマスかを示します。",
      "Check and Show as often as you like: Check says how many cells are wrong, Show marks which.",
    ],
    "1": [
      "チェックか表示は、1回だけです。大切に使ってください。使い切ると使えなくなりますが、パズルは続きます。",
      "One Check or Show, so spend it well. Running out takes them away; the puzzle goes on.",
    ],
    "3": [
      "チェックと表示を合わせて3回です。使い切ると使えなくなりますが、パズルは続きます。",
      "Three Checks or Shows between them. Running out takes them away; the puzzle goes on.",
    ],
  },
  other: ["チェックと表示を合わせて{0}回です。使い切ると使えなくなりますが、パズルは続きます。", "{0} Checks or Shows between them. Running out takes them away; the puzzle goes on."],
} as const satisfies JaCases;

/** `PUZZLE_CLOCK_DISPLAY`: the countdowns. */
export const PUZZLE_CLOCK_DISPLAY_JA = {
  none: {
    label: ["時計なし", "No clock"],
    blurb: ["時計は進むだけで、切れることはありません。好きなだけ時間をかけられます。", "The clock counts up and never runs out: take as long as it takes."],
  },
  tortoise: {
    label: ["亀", "Tortoise"],
    blurb: ["5分からのカウントダウンです。時間切れになると、解けないまま終わり、そのときの状態が記録されます。", "Five minutes, counting down. Out of time ends it unsolved, and it is kept as it stood."],
  },
  fox: {
    label: ["狐", "Fox"],
    blurb: ["3分からのカウントダウンです。時間切れになると、解けないまま終わり、そのときの状態が記録されます。", "Three minutes, counting down. Out of time ends it unsolved, and it is kept as it stood."],
  },
  rabbit: {
    label: ["兎", "Rabbit"],
    blurb: ["1分からのカウントダウンです。時間切れになると、解けないまま終わり、そのときの状態が記録されます。", "One minute, counting down. Out of time ends it unsolved, and it is kept as it stood."],
  },
} as const;

const WORD_LEVELS: Record<PuzzleLevel, JaLine> = {
  easy: ["いちばん身近な単語のどれかで、予想は8回です。", "One of the commonest words, and eight guesses to find it in."],
  medium: ["もっと広い単語のリストからで、予想は7回です。", "A wider list of words, and seven guesses."],
  hard: ["もっと広い単語のリストからで、予想は6回、昔ながらの回数です。", "A wider list of words, and six guesses, the classic count."],
  "extra-hard": ["もっと広い単語のリストからで、予想は6回、昔ながらの回数です。", "A wider list of words, and six guesses, the classic count."],
};
const KANA_LEVELS: Record<PuzzleLevel, JaLine> = {
  easy: [
    "いちばん身近な単語のどれかで、無料の灰色の単語があり、予想は7回、行は8行です。",
    "One of the commonest words, a free grey word and seven guesses: eight rows.",
  ],
  medium: ["もっと広い単語のリストからで、無料の灰色の単語があり、予想は6回、行は7行です。", "A wider list of words, a free grey word and six guesses: seven rows."],
  hard: ["もっと広い単語のリストからで、予想は6回、無料の単語はありません。", "A wider list of words, six guesses and no free word."],
  "extra-hard": ["もっと広い単語のリストからで、予想は6回、無料の単語はありません。", "A wider list of words, six guesses and no free word."],
};

const CLASSIC_WILDS = KUMIMOJI_WILDS[KUMIMOJI_HANDS.classic]!;

/** `JIRAI_LEVEL_BLURBS`. */
export const JIRAI_LEVEL_BLURBS_JA: Record<PuzzleLevel, JaLine> = {
  easy: ["8マスに1つくらいが地雷です。", "About one square in eight is a mine."],
  medium: ["6マスに1つくらいが地雷です。", "About one square in six is a mine."],
  hard: ["5マスに1つくらいが地雷で、定番のゲームの上級盤に近い密度です。", "About one square in five is a mine: closer to the expert board of the classic game."],
  "extra-hard": ["4マスに1つが地雷で、定番のゲームの上級盤より密ですが、当て推量は必要ありません。", "One square in four is a mine: thicker than the expert board of the classic game, and still never a guess."],
};

/** `PUZZLE_LEVEL_BLURBS`: what a level means for the kinds that mean something other than "how much has to be tried". */
export const PUZZLE_LEVEL_BLURBS_JA = {
  gomoji: WORD_LEVELS,
  gomojiMot: WORD_LEVELS,
  gomojiWort: WORD_LEVELS,
  gomojiKana: KANA_LEVELS,
  gomojiPop: {
    easy: ["ポップカルチャーのリストの言葉で、カテゴリが示され、予想は8回です。", "A word from the pop list with its category shown, and eight guesses to find it in."],
    medium: ["同じリストと手がかりで、予想は7回です。", "The same list and clue, and seven guesses."],
    hard: ["同じリストと手がかりで、予想は6回、昔ながらの回数です。", "The same list and clue, and six guesses, the classic count."],
  },
  tsunagi: {
    easy: ["サイズごとのレベルの最初の3分の1です。どの線も、見るだけで見つかります。", "The first third of a size's levels: every line can be found by looking."],
    medium: ["真ん中の3分の1です。線が長くなり、どこかで1本を試す必要があります。", "The middle third: longer lines, and somewhere one has to be tried."],
    hard: ["最後の3分の1です。線が曲がりくねり、何かを試して確かめる場所が2か所以上あります。", "The last third: winding lines, and more than one place to try something and see."],
  },
  kumimoji: {
    easy: [
      `ワイルドのタイルがいちばん多く、「クラシック」の手札から始める「ショート」では${CLASSIC_WILDS.easy}枚です。`,
      `The most wild tiles: ${CLASSIC_WILDS.easy} in a Short game from the Classic hand.`,
    ],
    medium: [
      `ワイルドのタイルはその半分で、「クラシック」の手札から始める「ショート」では${CLASSIC_WILDS.medium}枚です。`,
      `Half as many wild tiles: ${CLASSIC_WILDS.medium} in a Short game from the Classic hand.`,
    ],
    hard: ["ワイルドのタイルはなく、どのタイルも、印刷された文字かかなのままです。", "No wild tiles: every tile is the letter or kana printed on it."],
  },
  cube: {
    easy: [
      `そろった状態から数手のところです。3×3では${SCRAMBLE_LENGTHS.easy[3]}手で、見るだけで戻せます。`,
      `A few turns from solved: ${SCRAMBLE_LENGTHS.easy[3]} on the 3×3, enough to take back by looking.`,
    ],
    medium: [
      `3×3では${SCRAMBLE_LENGTHS.medium[3]}手です。見るだけで戻すには多すぎるので、解き方を考える必要があります。`,
      `${SCRAMBLE_LENGTHS.medium[3]} turns on the 3×3: too many to take back by looking, so it has to be solved.`,
    ],
    hard: [
      `大会と同じ長さの、完全なシャッフルです。3×3では${SCRAMBLE_LENGTHS.hard[3]}手です。`,
      `A full scramble, as long as a competition's: ${SCRAMBLE_LENGTHS.hard[3]} turns on the 3×3.`,
    ],
  },
  meikyuu: {
    easy: [
      "サイズごとのレベルの最初の3分の1です。道のりは短いのですが、どれも避けるべき行き止まりがあり、すぐ終わります。",
      "The first third of a size's levels: short ways through, but every one has wrong turns to avoid, and they end quickly.",
    ],
    medium: ["真ん中の3分の1です。道のりが長くなり、枝分かれが、長く続いてから行き止まりになります。", "The middle third: longer ways, and branches that lead a long way before they stop."],
    hard: [
      "最後の3分の1です。いちばん長い道のりと、いちばん多い分かれ道があり、大きな迷路では、見るところがずっと増えます。",
      "The last third: the longest ways and the most forks, and in the biggest mazes much more to look at.",
    ],
  },
  tobiishi: {
    easy: ["ゴールまで3回跳びます。駒は4つで、いくつかの誤りのなかに、正しい順番が1つあります。", "Three jumps to the goal: four pegs, and one way in the right order, among a few wrong ones."],
    medium: ["ゴールまで6回跳びます。駒は7つで、最後の前に行き詰まる道が増えます。", "Six jumps to the goal: seven pegs, with more ways to get stuck before the last one."],
    hard: ["ゴールまで9回跳びます。駒は10個で、駒を取り始める前に、正しい順番を見つける必要があります。", "Nine jumps to the goal: ten pegs, and the right order has to be found before you start taking pegs."],
  },
  suido: {
    easy: ["同じサイズの盤のなかで、やさしいほうです。ほとんどの部品が、となりを見るだけで決まります。", "Among the plainer boards of its size: most pieces can be settled by looking at what is beside them."],
    medium: ["同じサイズの盤のなかで、ふつうです。まわりの部品が何を必要とするかを考えないと、決まらない場所があります。", "A middling board of its size: some places can only be settled by working out what the pieces around them need."],
    hard: [
      "同じサイズの盤のなかで、難しいほうです。考え抜くまで決まらないことが多く、どこかで向きを試して確かめる必要があるかもしれません。",
      "Among the harder boards of its size: much stays open until you work it through, and somewhere you may have to try a turn and see.",
    ],
  },
  solitaire: {
    easy: ["山札を、何度でも通せます。", "Through the stock as many times as you like."],
    medium: ["山札を通せるのは3回までです。", "Three times through the stock, and no more."],
    hard: ["山札を通せるのは1回だけで、めくったカードは、どれも1度しか見られません。", "Once through the stock: every card turned is seen once."],
  },
  freecell: {
    medium: ["すべてのカードが最初から表向きで、フリーセルが少ないほど、配りは難しくなります。", "Every card is face up from the start: fewer free cells make the deal harder."],
  },
  spider: {
    medium: ["マークが多いほど難しくなります。並びをまとめて動かせるのは、すべて同じマークのときだけです。", "More suits make the game harder: a run moves as a whole only while it is all one suit."],
  },
  bridges: {
    easy: ["数えるだけで解けます。島ごとに、同じ線上の島があと何本の橋を出せるかと見比べます。", "Counting alone: every island against what the islands in line with it can still give."],
    medium: ["数えることと、つながりの決まりを使います。島の集まりを、ほかから切り離してはいけません。", "Counting, and the joining rule: no group of islands may close itself off from the rest."],
    hard: ["数えることもつながりも行き詰まるところがあり、橋を試して確かめる必要があります。", "Somewhere counting and joining both run out, and a bridge has to be tried and seen."],
  },
  pictureLogic: {
    easy: ["端だけで解けます。それぞれの線の並びを片側と反対側へ寄せて、重なるところを塗ります。", "The ends alone: slide each line's runs to one side and the other, and shade where they overlap."],
    medium: ["端だけでは進まなくなるところがあり、交わる線で決まったことを手がかりに、1本の線全体を読む必要があります。", "Somewhere the ends run out, and a whole line has to be read against what its crossing lines have settled."],
    hard: ["線全体を読んでも進まなくなるところがあり、1つのマスを試して、手がかりが破れるまでたどる必要があります。", "Somewhere even whole lines run out, and a square has to be tried and followed until a clue breaks."],
  },
  mahjong: {
    easy: ["5つの配りのなかで、いちばんやさしい配りです。うっかり組を取っても、行き詰まることはあまりありません。", "The most forgiving of five deals: a pair taken carelessly seldom leaves you stuck."],
    medium: ["ふつうの配りです。ときどき、早く取りすぎた組のせいで、別の組が取れなくなります。", "A middling deal: now and then a pair taken too soon closes off another."],
    hard: ["5つの配りのなかで、いちばん厳しい配りです。早く取る組をまちがえると、「元に戻す」か「シャッフル」が必要になります。", "The least forgiving of five deals: take the wrong pair early and you will need Undo or Shuffle."],
  },
  jirai: JIRAI_LEVEL_BLURBS_JA,
  koushi: {
    easy: ["8回の入れ替えで解けます。使えるのは13回で、いちばん身近な単語です。", "Solvable in 8 swaps, with 13 to do it in, and the commonest words."],
    medium: ["10回の入れ替えで解けます。使えるのは15回で、いちばん身近な単語です。", "Solvable in 10 swaps, with 15 to do it in, and the commonest words."],
    hard: ["12回の入れ替えで解けます。使えるのは17回で、もっと広い単語のリストです。", "Solvable in 12 swaps, with 17 to do it in, and a wider list of words."],
  },
} as const satisfies Partial<Record<PuzzleKind, Partial<Record<PuzzleLevel, JaLine>>>>;

const TOBIISHI_LENGTHS: Readonly<Record<number, string>> = { 3: "短", 6: "中", 9: "長" };
const SOLID_NAMES: Readonly<Record<string, string>> = { cube: "立方体", sphere: "球", octahedron: "八面体", icosahedron: "二十面体" };
const SOLID_STEPS: Readonly<Record<string, string>> = { small: "小", medium: "中", large: "大" };
const MAZE_SIZES: Readonly<Record<number, string>> = { 1: "小", 2: "中", 3: "大", 4: "巨大" };

/** A maze's size as a Japanese sentence names it: the kanji its tile carries, or the solid and its step. */
function mazeSizeJa(size: number): string {
  const solid = meikyuuSolidOf(size);
  if (solid !== null) return `${SOLID_NAMES[solid.kind]}（${SOLID_STEPS[solid.step]}サイズ）`;
  if (size === MEIKYUU_COLOSSAL_SIZE) return "超巨大";
  if (size === MEIKYUU_COLOSSAL_TALL_SIZE) return `超巨大の縦長 ${MEIKYUU_COLOSSAL_TALL_SHAPE[0]}×${MEIKYUU_COLOSSAL_TALL_SHAPE[1]}`;
  const tall = meikyuuTallShape(size);
  if (tall !== null) return `縦長 ${tall.width}×${tall.height}`;
  return MAZE_SIZES[size] ?? String(size);
}

/** `CARD_SIZE_WORDS`: what a card game's size is, in the heading over its tiles and in a sentence. */
export const CARD_SIZE_WORDS_JA = {
  tobiishi: {
    legend: ["長さ", "Length"],
    heading: ["長さ", "Lengths"],
    word: bySize(TOBIISHI_SIZES, (size) => [TOBIISHI_LENGTHS[size] ?? String(size), tobiishiSizeLabel(size)]),
  },
  meikyuu: {
    legend: ["サイズ", "Size"],
    heading: ["サイズ", "Sizes"],
    word: bySize(MEIKYUU_EVERY_SIZE, (size) => [mazeSizeJa(size), meikyuuSizeLabel(size)]),
  },
  solitaire: {
    legend: ["めくる枚数", "Draw"],
    heading: ["めくる枚数", "Draws"],
    word: ["{0}枚めくり", "draw {0}"],
  },
  freecell: {
    legend: ["フリーセル", "Free cells"],
    heading: ["フリーセルの数", "Free cells"],
    word: ["セル{0}つ", "{0} cells"],
  },
  spider: {
    legend: ["マーク", "Suits"],
    heading: ["マークの数", "Suits"],
    word: ["{0}マーク", "{0} suits"],
  },
} as const;

/** `JIRAI_GRID_DISPLAY`: the four ways of counting neighbours. */
export const JIRAI_GRID_DISPLAY_JA = {
  square: {
    blurb: ["定番の数え方です。どのマスも、角も含めて、まわりの8マスの地雷を数えます。", "The classic count: every square counts the mines in the eight squares round it, corners included."],
  },
  orthogonal: {
    blurb: ["どのマスも、上下左右の4マスだけを数えます。", "Every square counts only the four beside it: above, below, left and right."],
  },
  hex: { blurb: ["マスは六角形で、どのマスも、接する6つを数えます。", "The squares are hexagons, and each counts the six that touch it."] },
  wrap: {
    blurb: [
      "盤の端がつながります。左の端は右の端に、上の端は下の端につながるので、端のマスはありません。",
      "The edges join: the left edge meets the right and the top meets the bottom, so no square is on the edge.",
    ],
  },
} as const;
