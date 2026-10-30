import type { CopyReview } from "../copyJa.types";
import type { PuzzleCopyJa } from "./puzzles.ja.types";

/**
 * Hachinosu's words in Japanese, the sibling of `HACHINOSU_DISPLAY`. Drafted on 2026-10-30 and NOT YET READ: the
 * reviewer agent reads it before this lands, and this stamp is then its real one. Until then
 * `puzzles.coverage.test.ts` says so, on purpose, rather than a made-up stamp saying it was read.
 */
const NOT_YET_READ = undefined as unknown as CopyReview;

export const PUZZLE_COPY_JA_HACHINOSU = {
  hachinosu: {
    tagline: ["7つの文字で言葉を作ります。真ん中の文字は必ず使います。", "Make words from seven letters. Always use the centre letter."],
    inspiredBy: ["7文字の蜂の巣で言葉を作るパズル", "the puzzle of making words from a beehive of seven letters"],
    origin: [
      "1文字を6文字で囲んだ輪から言葉を作るのは、新聞でおなじみになった言葉のパズルです。蜂の巣はハチの巣のことです。このサイトの蜂の巣は、自前のコードと、自前のオープンソースの単語リストKotobaで作っています。Kotobaは各言語の本物の辞書をもとにしています。",
      "Making words from a ring of six letters round one is a word puzzle that newspapers made familiar. 蜂の巣 is a bee's nest. The hives on this site are made with our own code and our own open-source word lists, Kotoba, which are based on real dictionaries of each language.",
    ],
    rules: [
      ["蜂の巣の7文字で、4文字以上の言葉を作ります。どの言葉にも真ん中の文字を使い、同じ文字は何回使ってもかまいません。", "With the seven letters of the beehive, make words of four letters or more. Use the centre letter in every word; the same letter may be used any number of times."],
      ["4文字の言葉は1点です。それより長い言葉は、文字の数だけ点になります。", "A four-letter word is one point. A longer word is as many points as it has letters."],
      ["目標の点に届くと、その蜂の巣は終わりです。よく使う言葉だけでも必ず届き、一覧にあるほかの言葉も数えます。", "Reaching the goal points ends that beehive. Commonly used words alone will always reach it, and other words on the list also count."],
      ["今日のパズルは、言語ごとに誰にとっても同じ蜂の巣です。それ以外は、番号ごとに新しい蜂の巣が出ます。", "Today's puzzle is the same beehive for everybody in each language. Otherwise a new beehive comes with each number."],
    ],
    board: ["英語、フランス語、ドイツ語から選びます。アクセント記号とウムラウトは省きます。初級はよく使う言葉の点数の約3分の1、中級は半分近く、上級は5分の3で終わります。", "Choose from English, French or German. Accent marks and umlauts are left out. Easy finishes at about a third of the points of the commonly used words, medium at nearly half, and hard at three fifths."],
    review: NOT_YET_READ,
    ask: "Written on 2026-10-30 with Hachinosu; nobody has read it.",
  },
} as const satisfies Record<"hachinosu", PuzzleCopyJa>;
