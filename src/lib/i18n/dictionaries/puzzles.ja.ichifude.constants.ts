import type { CopyReview } from "../copyJa.types";

import type { PuzzleCopyJa } from "./puzzles.ja.types";

/** Ichifude's words in Japanese, the sibling of `ICHIFUDE_DISPLAY`. Read by the reviewer agent on 2026-10-30. */
const AGENT_READ: CopyReview = { by: "agent", on: "2026-10-30" };

export const PUZZLE_COPY_JA_ICHIFUDE = {
  ichifude: {
    tagline: ["1本の線で数字を順に通りながら、すべてのマスを埋めます。", "Fill every square with one line, passing through the numbers in order."],
    inspiredBy: ["1本の線で数字をたどるパズル", "the puzzle of following the numbers with one line"],
    origin: [
      "盤のすべての点をちょうど1回ずつ通る道筋は、ハミルトン路と呼ばれます。1857年にこれを遊びにしたアイルランドの数学者、ウィリアム・ローワン・ハミルトンにちなむ名前です。マス目に通る順の数字を付けたものは、今では毎日のパズルとして親しまれています。名前の一筆は一筆書きの一筆で、線を途中で離さず、ひと続きでたどります。このサイトの盤は、すべて自前のコードで新しく作っています。",
      "A route that passes each point of a board exactly once is called a Hamiltonian path, a name after William Rowan Hamilton, the Irish mathematician who made a game of it in 1857. With numbers on a grid for the order to pass them, it is now loved as a daily puzzle. The 一筆 in the name is the one of 一筆書き (one-stroke drawing): the line is not lifted on the way, and is followed in one run. The boards on this site are all newly made by our own code.",
    ],
    rules: [
      ["1のマスからいちばん大きい数字まで、上下左右に1マスずつ進んで、1本の線を引きます。", "From the square of 1 to the largest number, moving up, down, left or right one square at a time, draw one line."],
      ["線は数字を順番に通り、すべてのマスをちょうど1回ずつ通ります。順番の来ていない数字のところで、線は止まります。", "The line passes the numbers in order and goes through every square exactly once. The line stops at a number whose turn has not come."],
      ["線の端からドラッグするか、その隣のマスをタップします。線を戻るようにドラッグするか、線の上のマスをタップすると、そこから先を取り消せます。", "Drag from the end of the line, or tap a square beside it. Dragging back along the line, or tapping a square on it, cancels what comes after."],
      ["答えはちょうど1つです。時計は最初の1歩で動き出し、最後のマスが埋まると止まります。チェックは、答えからはずれているマスの数だけを教えます。どのマスかは教えません。", "There is exactly one answer. The clock starts with the first step and stops when the last square is filled. Check tells you only how many squares are off the answer; it does not say which."],
    ],
    board: ["6×6が標準の大きさです。5×5は手早く遊べ、7×7と8×8は長めです。どのサイズにも3つのレベルがあり、初級は数字が多く、上級は答えを1つに絞るのに必要な数字だけです。", "6×6 is the standard size. 5×5 can be played quickly, and 7×7 and 8×8 are longer. Every size has three levels: easy has many numbers, and hard only the numbers necessary to narrow the answer down to one."],
    review: AGENT_READ,
  },
} as const satisfies Record<"ichifude", PuzzleCopyJa>;
