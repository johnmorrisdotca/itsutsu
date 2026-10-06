import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pgrid.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PGRID: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pgrid.check.noneWrong": {
    text: "いまのところ、まちがいはありません",
    back: "Nothing wrong so far",
    review: AGENT_READ,
  },
  "pgrid.check.okFilled": {
    text: "すべて埋まっていて、正しいです。",
    back: "Everything is filled and right.",
    review: AGENT_READ,
  },
  "pgrid.check.okStones": {
    text: "石はすべて正しいです。",
    back: "Every stone is right.",
    review: AGENT_READ,
  },
  "pgrid.check.okBridges": {
    text: "橋はすべて引かれていて、正しいです。",
    back: "Every bridge is drawn and right.",
    review: AGENT_READ,
  },
  "pgrid.check.okSquares": {
    text: "マスはすべて塗られていて、正しいです。",
    back: "Every square is shaded and right.",
    review: AGENT_READ,
  },
  "pgrid.check.okPlace": {
    text: "すべて正しい位置にあります。",
    back: "Everything is in place.",
    review: AGENT_READ,
  },
  "pgrid.check.okJirai": {
    text: "安全なマスは、すべて開きました。",
    back: "Every safe square is uncovered.",
    review: AGENT_READ,
  },
  "pgrid.check.wrongCell.one": {
    text: "まちがっているマスが{count}個",
    back: "{count} cell is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongCell.other": {
    text: "まちがっているマスが{count}個",
    back: "{count} cells are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongStone.one": {
    text: "まちがっている石が{count}個",
    back: "{count} stone is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongStone.other": {
    text: "まちがっている石が{count}個",
    back: "{count} stones are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongBridge.one": {
    text: "まちがっている橋が{count}本",
    back: "{count} bridge is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongBridge.other": {
    text: "まちがっている橋が{count}本",
    back: "{count} bridges are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongSquare.one": {
    text: "まちがっているマスが{count}個",
    back: "{count} square is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongSquare.other": {
    text: "まちがっているマスが{count}個",
    back: "{count} squares are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongRectangle.one": {
    text: "まちがっている長方形が{count}個",
    back: "{count} rectangle is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongRectangle.other": {
    text: "まちがっている長方形が{count}個",
    back: "{count} rectangles are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongBulb.one": {
    text: "まちがっている電球が{count}個",
    back: "{count} bulb is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongBulb.other": {
    text: "まちがっている電球が{count}個",
    back: "{count} bulbs are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongLine.one": {
    text: "まちがっている線が{count}本",
    back: "{count} line is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongLine.other": {
    text: "まちがっている線が{count}本",
    back: "{count} lines are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongFlag.one": {
    text: "まちがっている旗が{count}本",
    back: "{count} flag is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.wrongFlag.other": {
    text: "まちがっている旗が{count}本",
    back: "{count} flags are wrong",
    review: AGENT_READ,
  },
  "pgrid.check.noFlagWrong": {
    text: "まちがっている旗はありません",
    back: "No flag is wrong",
    review: AGENT_READ,
  },
  "pgrid.check.leftFill": {
    text: "あと{count}マスを埋める必要があります",
    back: "{count} still to fill",
    review: AGENT_READ,
  },
  "pgrid.check.leftDraw": {
    text: "あと{count}個を引く必要があります",
    back: "{count} still to draw",
    review: AGENT_READ,
  },
  "pgrid.check.leftShade": {
    text: "あと{count}マスを塗る必要があります",
    back: "{count} still to shade",
    review: AGENT_READ,
  },
  "pgrid.check.leftPlace": {
    text: "あと{count}個を置く必要があります",
    back: "{count} still to place",
    review: AGENT_READ,
  },
  "pgrid.check.leftRows.one": {
    text: "石のない行が{count}行",
    back: "{count} row without one stone",
    review: AGENT_READ,
  },
  "pgrid.check.leftRows.other": {
    text: "石のない行が{count}行",
    back: "{count} rows without one stone",
    review: AGENT_READ,
  },
  "pgrid.check.leftUncover.one": {
    text: "開いていない安全なマスが、あと{count}個",
    back: "{count} safe square still to uncover",
    review: AGENT_READ,
  },
  "pgrid.check.leftUncover.other": {
    text: "開いていない安全なマスが、あと{count}個",
    back: "{count} safe squares still to uncover",
    review: AGENT_READ,
  },
  "pgrid.num.fullNotRight": {
    text: "すべてのマスが埋まっていますが、まだ正しくありません。",
    back: "Every cell is filled, and it is not right yet.",
    review: AGENT_READ,
  },
  "pgrid.num.tap": {
    text: "マスをタップして、数字をタップします。",
    back: "Tap a cell, then a number.",
    review: AGENT_READ,
  },
  "pgrid.num.clear": {
    text: "マスを消す",
    back: "clear the cell",
    review: AGENT_READ,
  },
  "pgrid.bw.fullNotRight": {
    text: "すべてのマスに石がありますが、まだ正しくありません。",
    back: "Every cell holds a stone, and it is not right yet.",
    review: AGENT_READ,
  },
  "pgrid.bw.tap": {
    text: "タップで黒、もう1回で白、もう1回で消えます。",
    back: "Tap for black, again for white, again to clear.",
    review: AGENT_READ,
  },
  "pgrid.hs.fullNotRight": {
    text: "どの行にも石がありますが、まだ正しくありません。",
    back: "A stone in every row, and it is not right yet.",
    review: AGENT_READ,
  },
  "pgrid.hs.tap": {
    text: "タップで石、もう1回で×印、もう1回で消えます。",
    back: "Tap for a stone, again for a cross, again to clear.",
    review: AGENT_READ,
  },
  "pgrid.lines.press": {
    text: "線",
    back: "Lines",
    review: AGENT_READ,
  },
  "pgrid.lines.says": {
    text: "すべての石から、その行と列に沿って線を引きます。ヒント1回に数えられます。",
    back: "A line from every stone along its row and column. Counts as one hint.",
    review: AGENT_READ,
  },
  "pgrid.step.several": {
    text: "複数のマス",
    back: "several cells",
    review: AGENT_READ,
  },
  "pgrid.step.at": {
    text: "{row}行{column}列：{what}",
    back: "row {row}, column {column}: {what}",
    review: AGENT_READ,
  },
  "pgrid.step.hLine": {
    text: "横線{row}、{column}列め",
    back: "horizontal line {row}, column {column}",
    review: AGENT_READ,
  },
  "pgrid.step.vLine": {
    text: "{row}行め、縦線{column}",
    back: "row {row}, vertical line {column}",
    review: AGENT_READ,
  },
  "pgrid.step.cleared": {
    text: "消した",
    back: "cleared",
    review: AGENT_READ,
  },
  "pgrid.step.stone": {
    text: "石を置いた",
    back: "a stone",
    review: AGENT_READ,
  },
  "pgrid.step.cross": {
    text: "×印をつけた",
    back: "a cross",
    review: AGENT_READ,
  },
  "pgrid.step.black": {
    text: "黒",
    back: "black",
    review: AGENT_READ,
  },
  "pgrid.step.white": {
    text: "白",
    back: "white",
    review: AGENT_READ,
  },
  "pgrid.step.island": {
    text: "島{count}",
    back: "island {count}",
    review: AGENT_READ,
  },
  "pgrid.step.flag": {
    text: "旗を立てた",
    back: "a flag",
    review: AGENT_READ,
  },
  "pgrid.step.covered": {
    text: "伏せた",
    back: "covered",
    review: AGENT_READ,
  },
  "pgrid.step.blank": {
    text: "開いた（空白）",
    back: "uncovered, blank",
    review: AGENT_READ,
  },
  "pgrid.step.uncovered": {
    text: "開いた（{count}）",
    back: "uncovered, {count}",
    review: AGENT_READ,
  },
  "pgrid.pencil.label": {
    text: "{thing}のパズル、{size}×{size}。{howTo}",
    back: "{thing} puzzle, {size} by {size}. {howTo}",
    review: AGENT_READ,
  },
  "pgrid.pencil.remove": {
    text: "消す",
    back: "Remove",
    review: AGENT_READ,
  },
  "pgrid.pencil.removeSays": {
    text: "長方形をタップすると、取り除かれます。",
    back: "Tap a rectangle to take it away.",
    review: AGENT_READ,
  },
  "pgrid.jirai.neighbours": {
    text: "となり",
    back: "Neighbours",
    review: AGENT_READ,
  },
  "pgrid.jirai.shape": {
    text: "形",
    back: "Shape",
    review: AGENT_READ,
  },
  "pgrid.jirai.wrapOnly": {
    text: "端がつながる盤は、四角形だけです",
    back: "Edges that join take a rectangle only",
    review: AGENT_READ,
  },
  "pgrid.jirai.shapeLeast": {
    text: "この形には、{size}×{size}以上の盤が必要です",
    back: "A shape needs a board of at least {size}×{size}",
    review: AGENT_READ,
  },
  "pgrid.jirai.flag": {
    text: "旗",
    back: "Flag",
    review: AGENT_READ,
  },
  "pgrid.note.tobiishiFinished": {
    text: "終わった状態：ゴールに駒が1つ残っています。跳んだ手順で、そうなりました。",
    back: "How it ended: one peg left, in the goal, by the jumps that were made.",
    review: AGENT_READ,
  },
  "pgrid.note.tobiishiWorkedOut": {
    text: "跳んだ手順が保存される前に解かれたものです。どのレベルにも答えがあるので、これは、そのレベルが作られたときの答えです。",
    back: "Solved before its jumps were kept. Every level has an answer, so this is the one it was made from.",
    review: AGENT_READ,
  },
  "pgrid.note.tobiishiDealt": {
    text: "跳んだ手順は非公開です。そのため、配られたままの盤を見せています。",
    back: "Its jumps are kept back, so this is the board as it was dealt.",
    review: AGENT_READ,
  },
  "pgrid.note.meikyuuFinished": {
    text: "終わった状態：スタートからゴールまで引かれた線です。",
    back: "How it ended: the line drawn from the start to the goal.",
    review: AGENT_READ,
  },
  "pgrid.note.meikyuuWorkedOut": {
    text: "線が保存される前に解かれたものです。ここの迷路は、どれも抜け道が1つなので、これがその道です。",
    back: "Solved before its line was kept. Every maze here has one way through, so this is that way.",
    review: AGENT_READ,
  },
  "pgrid.note.meikyuuDealt": {
    text: "線は非公開です。そのため、配られたままの迷路を見せています。",
    back: "Its line is kept back, so this is the maze as it was dealt.",
    review: AGENT_READ,
  },
  "pgrid.note.suidoFinished": {
    text: "終わった状態：水がポンプから、届くべきすべての場所に流れ、どこからも漏れていません。",
    back: "How it ended: the water runs from the pump to everything it should reach, and nothing leaks.",
    review: AGENT_READ,
  },
  "pgrid.note.suidoUnsolved": {
    text: "時計が切れて、解けないまま終わりました。これが、そのときの状態です。",
    back: "It ended unsolved, when its clock ran out: this is where it stood.",
    review: AGENT_READ,
  },
  "pgrid.note.suidoWorkedOut": {
    text: "盤が保存される前に解かれたものです。ここの盤は、どれも答えが1つなので、これはパズルから導いたその答えです。",
    back: "Solved before its board was kept. Every board here has one answer, so this is that answer, worked out from the puzzle.",
    review: AGENT_READ,
  },
  "pgrid.note.suidoDealt": {
    text: "終わった盤は保存されていません。そのため、配られたままの盤を見せています。",
    back: "Its finished board was not kept, so this is the board as it was dealt.",
    review: AGENT_READ,
  },
  "pgrid.note.replay": {
    text: "スクラバーで見返せます。最初の状態から答えまでをたどれます。",
    back: "Step back through it with the scrubber: from where it started to the answer.",
    review: AGENT_READ,
  },
  "pgrid.note.finished": {
    text: "手順は保存されていないので、終わったときの状態を見せています。たどる手順はありません。",
    back: "Its steps were not kept, so it shows how it ended, with nothing to step through.",
    review: AGENT_READ,
  },
  "pgrid.note.workedOut": {
    text: "盤が保存される前に解かれたものです。ここのパズルは、どれも答えが1つなので、これはパズルから導いたその答えです。",
    back: "Solved before its grid was kept. Every puzzle here has one answer, so this is that answer, worked out from the puzzle.",
    review: AGENT_READ,
  },
  "pgrid.note.dealt": {
    text: "終わった盤は保存されていません。そのため、配られたままのパズルを見せています。",
    back: "Its finished grid was not kept, so this is the puzzle as it was dealt.",
    review: AGENT_READ,
  },
  "pgrid.note.unsolved": {
    text: "時計が切れて、解けないまま終わりました。これが、そのときの状態で、スクラバーで、そこまでの経過をたどれます。",
    back: "It ended unsolved, when its clock ran out: this is where it stood, and the scrubber steps back through how it got there.",
    review: AGENT_READ,
  },
  "pgrid.finished.thisPuzzle": {
    text: "このパズル",
    back: "this puzzle",
    review: AGENT_READ,
  },
  "pgrid.finished.jirai": {
    text: "この手順での、終わった地雷の盤",
    back: "A finished Jirai board, as it stood at this step",
    review: AGENT_READ,
  },
  "pgrid.finished.puzzle": {
    text: "この手順での、終わったパズル",
    back: "A finished puzzle, as it stood at this step",
    review: AGENT_READ,
  },
  "pgrid.cell.where": {
    text: "{row}行{col}列",
    back: "row {row}, column {col}",
    review: AGENT_READ,
  },
  "pgrid.cell.empty": {
    text: "空欄",
    back: "empty",
    review: AGENT_READ,
  },
  "pgrid.cell.given": {
    text: "最初からある数字",
    back: "there from the start (a number)",
    review: AGENT_READ,
  },
  "pgrid.cell.printed": {
    text: "最初からある石",
    back: "there from the start (a stone)",
    review: AGENT_READ,
  },
  "pgrid.cell.cage": {
    text: "合計{sum}のケージ",
    back: "a cage totalling {sum}",
    review: AGENT_READ,
  },
  "pgrid.cell.blank": {
    text: "空白",
    back: "blank",
    review: AGENT_READ,
  },
  "pgrid.cell.black": {
    text: "黒",
    back: "black",
    review: AGENT_READ,
  },
  "pgrid.cell.white": {
    text: "白",
    back: "white",
    review: AGENT_READ,
  },
  "pgrid.cell.region": {
    text: "区画{region}",
    back: "region {region}",
    review: AGENT_READ,
  },
  "pgrid.cell.stone": {
    text: "石",
    back: "stone",
    review: AGENT_READ,
  },
  "pgrid.cell.cross": {
    text: "×印",
    back: "cross",
    review: AGENT_READ,
  },
  "pgrid.bridges.island": {
    text: "{where}：島{count}、{bridges}",
    back: "{where}: island {count}, {bridges}",
    review: AGENT_READ,
  },
  "pgrid.bridges.has.one": {
    text: "橋{count}本",
    back: "{count} bridge",
    review: AGENT_READ,
  },
  "pgrid.bridges.has.other": {
    text: "橋{count}本",
    back: "{count} bridges",
    review: AGENT_READ,
  },
  "pgrid.bridges.full": {
    text: "橋が足りている",
    back: "the bridges are enough",
    review: AGENT_READ,
  },
  "pgrid.bridges.over": {
    text: "橋が多すぎる",
    back: "too many bridges",
    review: AGENT_READ,
  },
  "pgrid.jirai.wrongFlag": {
    text: "{where}：まちがった旗",
    back: "{where}: a flag that is wrong",
    review: AGENT_READ,
  },
  "pgrid.tower.top": {
    text: "{n}列目の上から",
    back: "from the top of column {n}",
    review: AGENT_READ,
  },
  "pgrid.tower.bottom": {
    text: "{n}列目の下から",
    back: "from the bottom of column {n}",
    review: AGENT_READ,
  },
  "pgrid.tower.left": {
    text: "{n}行目の左から",
    back: "from the left of row {n}",
    review: AGENT_READ,
  },
  "pgrid.tower.right": {
    text: "{n}行目の右から",
    back: "from the right of row {n}",
    review: AGENT_READ,
  },
  "pgrid.tower.seen": {
    text: "{side}見える塔の数：",
    back: "Number of towers seen {side}: ",
    review: AGENT_READ,
  },
};
