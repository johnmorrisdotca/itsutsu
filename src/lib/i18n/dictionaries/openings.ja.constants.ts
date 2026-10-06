import { AGENT_READ_2026_10_06, type CopyReview, type JaLine } from "../copyJa.types";
import type { HandicapRule, OpeningRule } from "../../gomoku/gomoku.types";

/**
 * The openings' words in Japanese, beside the English `OPENING_DISPLAY`
 * (`openings.constants.ts`). `label` is the name a Japanese reader sees for an
 * opening: the kanji already published beside the English one. Terms follow
 * `docs/plans/en-ja-everywhere/TERMS.md`: 開局ルール for an opening rule, 天元
 * for the centre point, 手 for a move, 持ち時間 for a clock.
 */
export type OpeningCopyJa = {
  label: string;
  tagline: JaLine;
  rules: readonly JaLine[];
  review?: CopyReview;
  ask?: string;
};

export const OPENING_COPY_JA: Record<OpeningRule, OpeningCopyJa> = {
  free: {
    label: "自由",
    tagline: ["どこにでも、どの順でも。", "Anywhere, in any order."],
    rules: [["最初の石を打つ場所に制限はありません。", "There is no restriction on where the first stones go."]],
    review: AGENT_READ_2026_10_06,
  },
  pro: {
    label: "五路制限",
    tagline: ["黒の2つ目の石は、中央の5×5の外に打つ。", "Black's second stone goes outside the central 5×5."],
    rules: [
      ["黒は天元（盤の中央の点）に打って始めます。", "Black starts by playing on tengen (the centre point of the board)."],
      ["白の最初の石は、どこに打ってもかまいません。", "White's first stone may be played anywhere."],
      [
        "黒の2つ目の石（3手目）は、中央の5×5の正方形の外に打たなければなりません。",
        "Black's second stone (move 3) must be played outside the central 5×5 square.",
      ],
      [
        "それ以降は制限がありません。これは、取りのある五目並べ（二抜き連珠）の大会規則でもあります。",
        "After that there are no restrictions. It is also the tournament rule of the gomoku with captures (ninuki-renju).",
      ],
    ],
    review: AGENT_READ_2026_10_06,
  },
  longPro: {
    label: "七路制限",
    tagline: ["黒の2つ目の石は、中央の7×7の外に打つ。", "Black's second stone goes outside the central 7×7."],
    rules: [
      ["黒は天元に打って始めます。", "Black starts by playing on tengen."],
      ["白の最初の石は、どこに打ってもかまいません。", "White's first stone may be played anywhere."],
      [
        "黒の2つ目の石（3手目）は、中央の7×7の正方形の外に打たなければなりません。",
        "Black's second stone (move 3) must be played outside the central 7×7 square.",
      ],
      ["先手にとって、五路制限より厳しい制約です。", "A stricter constraint for the first player than the 五路制限 (Pro) rule."],
    ],
    review: AGENT_READ_2026_10_06,
  },
  swap: {
    label: "交換",
    tagline: ["一方が3つの石を置き、もう一方が色を選ぶ。", "One side places three stones and the other chooses a colour."],
    rules: [
      [
        "対局者1が、黒・白・黒の順に3つの石を、盤の好きな場所に置きます。",
        "Player 1 places three stones, black, white, black in that order, anywhere on the board.",
      ],
      [
        "対局者2は盤面を見て、黒と白のどちらで打つかを選びます。",
        "Player 2 looks at the position and chooses whether to play black or white.",
      ],
      [
        "次に打つのは、どちらが持っていても白です。選ぶ側の持ち時間は、選んでいる間も進みます。",
        "White plays next, whoever holds it. The chooser's clock keeps running while they choose.",
      ],
    ],
    review: AGENT_READ_2026_10_06,
  },
  swap2: {
    label: "交換二",
    tagline: ["交換と同じだが、選ぶ側は2つ石を足して、選択を相手に返せる。", "Like 交換 (Swap), but the chooser can add two stones and hand the choice back."],
    rules: [
      [
        "対局者1が、黒・白・黒の順に3つの石を置きます。",
        "Player 1 places three stones, black, white, black in that order.",
      ],
      [
        "対局者2は、黒で打つ、白で打つ、または白・黒の順にさらに2つの石を足して色の選択を対局者1に任せる、のいずれかを選びます。",
        "Player 2 chooses one of: play black, play white, or add two more stones, white then black, and leave the choice of colour to Player 1.",
      ],
      ["色が決まったら、次は白が打ちます。", "Once the colours are settled, White plays next."],
      [
        "五目並べの世界選手権で使われる開局ルールです。3つの石で公平な局面をつくるのは難しいためです。",
        "It is the opening rule used at the gomoku world championship, because it is hard to make a fair position with three stones.",
      ],
    ],
    review: AGENT_READ_2026_10_06,
  },
  rif: {
    label: "国際ルール",
    tagline: [
      "連珠の定番の開局ルール。中央、3×3、5×5と進み、そのあと白が交換できる。",
      "The standard renju opening rule: centre, 3×3, 5×5, and then White may swap.",
    ],
    rules: [
      ["黒は天元に打って始めます。", "Black starts by playing on tengen."],
      [
        "白の最初の石は、中央の3×3の内側で、その石に接する点に打たなければなりません。",
        "White's first stone must be played inside the central 3×3, on a point touching that stone.",
      ],
      [
        "黒の2つ目の石は、中央の5×5の内側に打たなければなりません。",
        "Black's second stone must be played inside the central 5×5.",
      ],
      [
        "そのあと白は、白のまま打つか、黒を取るかを選びます。大会の正式な規則では、黒が5手目の候補を2つ示し、白がその一方を退ける手順もありますが、ここではその手順は行いません。",
        "Then White chooses to stay white or take black. The official tournament rule also has Black show two candidates for move 5 and White reject one of them, but that step is not carried out here.",
      ],
    ],
    review: AGENT_READ_2026_10_06,
  },
  sakata: {
    label: "坂田ルール",
    tagline: ["RIFの開局と交換のあと、5手目は7×7の内側に打つ。", "After the RIF opening and swap, move 5 is played inside the 7×7."],
    rules: [
      [
        "黒は天元に打って始め、白の最初の石は3×3の内側でそれに接して打ち、黒の2つ目の石は5×5の内側に打ちます。",
        "Black starts on tengen, White's first stone goes inside the 3×3 touching it, and Black's second stone goes inside the 5×5.",
      ],
      [
        "そのあと白は、白のまま打つか、黒を取るかを選びます。",
        "Then White chooses to stay white or take black.",
      ],
      ["白の2つ目の石（4手目）は、どこに打ってもかまいません。", "White's second stone (move 4) may be played anywhere."],
      [
        "黒の3つ目の石（5手目）は、中央の7×7の内側に打たなければなりません。5手目の候補を示すのではなく1手だけ打つ点が、坂田ルールをRIFの規則と分けています。",
        "Black's third stone (move 5) must be played inside the central 7×7. What sets the 坂田ルール apart from the RIF rule is that one move is played rather than candidates for move 5 being shown.",
      ],
    ],
    review: AGENT_READ_2026_10_06,
  },
  tarannikov: {
    label: "タランニコフ",
    tagline: [
      "入れ子になった5つの正方形。最初の5つの石のたびに交換の機会がある。",
      "Five nested squares, with a chance to swap after each of the first five stones.",
    ],
    rules: [
      [
        "1つ目の石は天元、2つ目は3×3の内側、3つ目は5×5の内側、4つ目は7×7の内側、5つ目は9×9の内側に打ちます。",
        "The first stone goes on tengen, the second inside the 3×3, the third inside the 5×5, the fourth inside the 7×7 and the fifth inside the 9×9.",
      ],
      [
        "この5つの石のそれぞれのあとに、その石を打たなかった方が、色を交換するか、そのままにするかを選べます。",
        "After each of these five stones, the side that did not play it can choose to swap colours or keep them as they are.",
      ],
      [
        "石の色は終始ふつうに交互になり、変わるのは、その色を持つ席だけです。",
        "The colours alternate as usual throughout; only the seat that holds each colour changes.",
      ],
      [
        "6つ目の石からは制限がありません。交換の機会が頻繁にあるため、どこかで釣り合いの悪い石を打つと、その色をそのまま相手に渡すことになります。",
        "From the sixth stone there are no restrictions. Because the chance to swap comes so often, playing an unbalanced stone anywhere simply hands that colour to the opponent.",
      ],
    ],
    review: AGENT_READ_2026_10_06,
  },
};

/**
 * The handicap switches' words in Japanese, beside `HANDICAP_RULE_DISPLAY`. A
 * switch's NAME is its `kanji` (三三禁, 四四禁…), which a Japanese reader is shown
 * in place of the English label; what is here is the sentence under it and the
 * game it comes from.
 */
export type HandicapCopyJa = {
  description: JaLine;
  from: JaLine;
  review?: CopyReview;
};

export const HANDICAP_COPY_JA: Record<HandicapRule, HandicapCopyJa> = {
  doubleThree: {
    description: ["1つの石で活三を2つ作ることはできません。", "You cannot make two open threes with one stone."],
    from: ["連珠、オモク", "Renju, Omok"],
    review: AGENT_READ_2026_10_06,
  },
  doubleFour: {
    description: ["1つの石で四を2つ作ることはできません。", "You cannot make two fours with one stone."],
    from: ["連珠", "Renju"],
    review: AGENT_READ_2026_10_06,
  },
  overline: {
    description: [
      "6つ以上並べることはできず、6つでは勝てません。",
      "You cannot make six or more in a row, and six does not win.",
    ],
    from: ["連珠", "Renju"],
    review: AGENT_READ_2026_10_06,
  },
  exactLine: {
    description: [
      "長連は勝ちになりません。列はちょうどの長さでなければなりません。",
      "An overline does not win. The line must be exactly the length.",
    ],
    from: ["競技五目、連珠", "Tournament Gomoku, Renju"],
    review: AGENT_READ_2026_10_06,
  },
  openLine: {
    description: [
      "両端を相手にふさがれた列は勝ちになりません。",
      "A line shut in at both ends by the opponent does not win.",
    ],
    from: ["Caro（ベトナムの五目並べ）", "Caro (the Vietnamese gomoku)"],
    review: AGENT_READ_2026_10_06,
  },
  longerLine: {
    description: ["相手より1つ多く並べる必要があります。", "You need to line up one more than the opponent."],
    from: ["五目並べの昔からのハンデ", "A traditional gomoku handicap"],
    review: AGENT_READ_2026_10_06,
  },
  singleStone: {
    description: [
      "ゲームが2つ置かせる手番でも、1つしか置けません。",
      "You can place only one stone on a move where the game lets you place two.",
    ],
    from: ["六子棋（Connect6）", "六子棋 (Connect6)"],
    review: AGENT_READ_2026_10_06,
  },
  noCaptures: {
    description: ["2つ組を挟んでも何も取れません。", "Flanking a pair captures nothing."],
    from: ["二抜き連珠", "Ninuki-renju"],
    review: AGENT_READ_2026_10_06,
  },
};

/** The choices for the second stone's restriction, by the number of squares it must leave (`SECOND_STONE_EXCLUSION_DISPLAY`). */
export const SECOND_STONE_COPY_JA: Record<number, { label: JaLine; review?: CopyReview }> = {
  0: { label: ["どこでも", "Anywhere"], review: AGENT_READ_2026_10_06 },
  2: { label: ["中央の5×5の外", "Outside the central 5×5"], review: AGENT_READ_2026_10_06 },
  3: { label: ["中央の7×7の外", "Outside the central 7×7"], review: AGENT_READ_2026_10_06 },
};
