import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pmaze.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PMAZE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pmaze.blockBefore": {
    text: "前のブロック",
    back: "The block before",
    review: AGENT_READ,
  },
  "pmaze.blockAfter": {
    text: "次のブロック",
    back: "The block after",
    review: AGENT_READ,
  },
  "pmaze.blockLine": {
    text: "ブロック{block}／{blocks}・レベル{first}～{last}",
    back: "Block {block} of {blocks} · levels {first}–{last}",
    review: AGENT_READ,
  },
  "pmaze.ofCount": {
    text: "全{count}レベル",
    back: "of {count} levels in all",
    review: AGENT_READ,
  },
  "pmaze.keptAccount": {
    text: "解いたレベルは、アカウントに保存されます。",
    back: "Your solved levels are kept on your account.",
    review: AGENT_READ,
  },
  "pmaze.keptBrowser": {
    text: "解いたレベルは、このブラウザーに保存されます。参加すると、アカウントに保存されます。",
    back: "Your solved levels are kept in this browser. Join, and they are kept on an account.",
    review: AGENT_READ,
  },
  "pmaze.startLevel": {
    text: "レベル{level}を始める",
    back: "Start level {level}",
    review: AGENT_READ,
  },
  "pmaze.levelLocked": {
    text: "レベル{level}はロック中",
    back: "Level {level} is locked",
    review: AGENT_READ,
  },
  "pmaze.firstUnfinished": {
    text: "まだ終えていない最初のレベルは、レベル{level}です。",
    back: "Level {level} is the first one you have not finished.",
    review: AGENT_READ,
  },
  "pmaze.playFirst": {
    text: "まだ終えていない最初のレベル、レベル{level}を遊ぶ",
    back: "Play level {level}, the first one you have not finished",
    review: AGENT_READ,
  },
  "pmaze.shut": {
    text: "{size}のレベル{level}は、ブロック{block}（レベル{first}～{last}）のレベルをすべて解くと開きます。",
    back: "Level {level} at {size} opens when every level in block {block} (levels {first}–{last}) is solved.",
    review: AGENT_READ,
  },
  "pmaze.preview.open": {
    text: "{size}のレベル{level}（全{count}レベル）：まだ解いていません。",
    back: "Level {level} of {count} at {size}: not solved yet.",
    review: AGENT_READ,
  },
  "pmaze.preview.solved": {
    text: "{size}のレベル{level}（全{count}レベル）：解決済み、ベストは{time}です。",
    back: "Level {level} of {count} at {size}: solved, best {time}.",
    review: AGENT_READ,
  },
  "pmaze.preview.locked": {
    text: "{size}のレベル{level}（全{count}レベル）：ブロック{block}のレベルをすべて解くまで、ロックされています。",
    back: "Level {level} of {count} at {size}: locked until every level of block {block} is solved.",
    review: AGENT_READ,
  },
  "pmaze.preview.tobiishiOpen": {
    text: "{size}のレベル{level}（全{count}レベル）：{board}、{goal}。まだ解いていません。",
    back: "Level {level} of {count} at {size}: {board}, {goal}. Not solved yet.",
    review: AGENT_READ,
  },
  "pmaze.preview.tobiishiSolved": {
    text: "{size}のレベル{level}（全{count}レベル）：{board}、{goal}。解決済み、ベストは{time}です。",
    back: "Level {level} of {count} at {size}: {board}, {goal}. Solved, best {time}.",
    review: AGENT_READ,
  },
  "pmaze.tally": {
    text: "{what}：{count}レベル中、{done}レベルを解きました。",
    back: "{what}: {done} of {count} levels solved.",
    review: AGENT_READ,
  },
  "pmaze.tallyBlocks": {
    text: "{what}：{count}レベル中、{done}レベルを解きました。16レベルのブロックは、ひとつ前のブロックをすべて解くと開きます。",
    back: "{what}: {done} of {count} levels solved. Each block of 16 levels opens when the one before it is all solved.",
    review: AGENT_READ,
  },
  "pmaze.smallerBoards": {
    text: "← 小さい盤へ、{size}から",
    back: "← Smaller boards, from {size}",
    review: AGENT_READ,
  },
  "pmaze.biggerBoards": {
    text: "大きい盤へ、{size}まで →",
    back: "Bigger boards, to {size} →",
    review: AGENT_READ,
  },
  "pmaze.zoomGroup": {
    text: "拡大と縮小",
    back: "Zoom",
    review: AGENT_READ,
  },
  "pmaze.zoomIn": {
    text: "拡大する",
    back: "Zoom in",
    review: AGENT_READ,
  },
  "pmaze.zoomOut": {
    text: "縮小する",
    back: "Zoom out",
    review: AGENT_READ,
  },
  "pmaze.zoomBoard": {
    text: "盤を拡大・縮小する",
    back: "Zoom the board",
    review: AGENT_READ,
  },
  "pmaze.wholeBoard": {
    text: "盤全体",
    back: "Whole board",
    review: AGENT_READ,
  },
  "pmaze.theLine": {
    text: "線の操作",
    back: "Controls for the line",
    review: AGENT_READ,
  },
  "pmaze.theJumps": {
    text: "ジャンプの操作",
    back: "Controls for the jumps",
    review: AGENT_READ,
  },
  "pmaze.howToPlay": {
    text: "遊び方",
    back: "How to play",
    review: AGENT_READ,
  },
  "pmaze.options.legendSolid": {
    text: "立体",
    back: "Solid",
    review: AGENT_READ,
  },
  "pmaze.options.legendSize": {
    text: "サイズ",
    back: "Size",
    review: AGENT_READ,
  },
  "pmaze.options.legendLength": {
    text: "長さ",
    back: "Length",
    review: AGENT_READ,
  },
  "pmaze.options.kindOfBoard": {
    text: "盤の種類",
    back: "Kind of board",
    review: AGENT_READ,
  },
  "pmaze.options.pieces": {
    text: "駒",
    back: "Pieces",
    review: AGENT_READ,
  },
  "pmaze.count.cell.one": {
    text: "{count}マス",
    back: "{count} cell",
    review: AGENT_READ,
  },
  "pmaze.count.cell.other": {
    text: "{count}マス",
    back: "{count} cells",
    review: AGENT_READ,
  },
  "pmaze.count.peg.one": {
    text: "{count}個の駒",
    back: "{count} peg",
    review: AGENT_READ,
  },
  "pmaze.count.peg.other": {
    text: "{count}個の駒",
    back: "{count} pegs",
    review: AGENT_READ,
  },
  "pmaze.meikyuu.shelfTall": {
    text: "縦長：スマートフォンを縦に持って遊ぶ",
    back: "Tall: played with a phone held upright",
    review: AGENT_READ,
  },
  "pmaze.meikyuu.shelfColossal": {
    text: "超巨大：約1万マス。四角い箱のあと、縦長の箱",
    back: "Colossal: about ten thousand cells; a square box, then a tall box",
    review: AGENT_READ,
  },
  "pmaze.meikyuu.shelfSolid": {
    text: "立体の上：どの立体も、3つのサイズをまとめて",
    back: "Over a solid: each solid's three sizes together",
    review: AGENT_READ,
  },
  "pmaze.meikyuu.colourSample": {
    text: "この色の小さな迷路",
    back: "A little maze in these colours",
    review: AGENT_READ,
  },
  "pmaze.meikyuu.cellsSays": {
    text: "迷路のマスの数です。多いほど見るところが増え、大きい迷路は拡大して遊びます。",
    back: "How many cells the maze has: the more there are, the more there is to look at, and the bigger ones are zoomed.",
    review: AGENT_READ,
  },
  "pmaze.meikyuu.score": {
    text: "{says}このレベルは{score}点です。",
    back: "{says} This one scores {score}.",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.boardSays": {
    text: "このレベルを遊ぶ盤です。",
    back: "The board this level is played on.",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.goalSays": {
    text: "最後の駒が入る穴です。破線の輪で描かれています。",
    back: "The hole the last peg has to be in: it is drawn with a dashed ring.",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.pegsSays": {
    text: "このレベルを始めるときの駒の数です。ジャンプのたびに1個減るので、駒を1個にするには、これより1回少ないジャンプですみます。",
    back: "How many pegs the level starts with. Each jump takes one, so it takes one jump fewer than that to leave one peg.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.withPortals": {
    text: "ポータルありの{size}×{size}",
    back: "{size}×{size} with portals",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.attempt.one": {
    text: "・{count}回目の挑戦",
    back: "· attempt {count}",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.attempt.other": {
    text: "・挑戦{count}回",
    back: "· {count} attempts",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.notJoined.one": {
    text: "まだつながっていない組が{count}組あります。その玉が点滅しています。",
    back: "{count} pair is not joined yet: its marbles are flashing.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.notJoined.other": {
    text: "まだつながっていない組が{count}組あります。その玉が点滅しています。",
    back: "{count} pairs are not joined yet: their marbles are flashing.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.allJoined.one": {
    text: "すべての組がつながりました。空いているマスは、あと{count}マスです。",
    back: "Every pair is joined; {count} cell is still empty.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.allJoined.other": {
    text: "すべての組がつながりました。空いているマスは、あと{count}マスです。",
    back: "Every pair is joined; {count} cells are still empty.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.joinedEmpty.one": {
    text: "すべての組がつながりました。空いているマスは、あと{count}マスです。",
    back: "Every pair joined; {count} cell is still empty.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.joinedEmpty.other": {
    text: "すべての組がつながりました。空いているマスは、あと{count}マスです。",
    back: "Every pair joined; {count} cells are still empty.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.progress": {
    text: "{pairs}組中、{joined}組がつながっています・盤の{percent}％",
    back: "{joined} of {pairs} pairs joined · {percent}% of the board",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.strokesLeft.one": {
    text: "線を引けるのは、あと{left}回（全{count}回）です。",
    back: "{left} more strokes allowed (of {count} in all).",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.strokesLeft.other": {
    text: "線を引けるのは、あと{left}回（全{count}回）です。",
    back: "{left} more strokes allowed (of {count} in all).",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.outOfStrokes": {
    text: "線を引ける回数を使い切りました。やり直して、もう一度挑戦してください。",
    back: "Out of strokes. Restart to try again.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.noteOff": {
    text: "設定のとおり、爆発はなしです。解いた記録には数えられますが、得点はなく、次のブロックも開きません。",
    back: "Explosions are off, as chosen at set-up: a solve counts, scores no points and does not open the next block.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.noteSoft": {
    text: "設定のとおり、爆発は弱めです。解いた記録には数えられますが、得点はありません。",
    back: "Explosions are softened, as chosen at set-up: a solve counts, but scores no points.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.noteSoftCheat": {
    text: "設定のとおり、爆発は弱めで、ズルも使いました。解いた記録には数えられますが、得点はありません。",
    back: "Explosions are softened, as chosen at set-up, and Cheat has been used: a solve counts, but scores no points.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.noteCheat": {
    text: "ズルを使いました。解いた記録には数えられますが、得点はありません。",
    back: "Cheat has been used: a solve counts, but scores no points.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.boomNext": {
    text: "次に線を引くと、爆発します。",
    back: "The next stroke sets off an explosion.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.boomIn.one": {
    text: "あと{count}回線を引くと、爆発します。",
    back: "An explosion in {count} stroke.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.boomIn.other": {
    text: "あと{count}回線を引くと、爆発します。",
    back: "An explosion in {count} strokes.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.blast": {
    text: "ドカン！線が1本消え、隣の線は半分まで短くなりました。",
    back: "Blast! A line was wiped, and the one beside it cut back to half.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.boom": {
    text: "ボン！線が1本、半分まで短くなりました。",
    back: "Boom! A line was cut back to half.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.howTo": {
    text: "玉を押して、相手の玉までドラッグします。戻るようにドラッグすると線が短くなり、玉をタップすると線が消えます。",
    back: "Press a marble and drag to its partner. Drag back to shorten a line; tap a marble to clear it.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cheatSays": {
    text: "未完成の線を1本引きます。使って解くと、得点はありません。",
    back: "Draws one unfinished line. A solve that used it scores no points.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.solvedAlready": {
    text: "このレベルは解決済みです。これは、完成した盤です。",
    back: "You have solved this level. This is your finished board.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.solvedAlreadyBest": {
    text: "このレベルは解決済みで、ベストは{time}です。これは、完成した盤です。",
    back: "You have solved this level, at best in {time}. This is your finished board.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.restartAgain": {
    text: "「最初からやり直す」を押すと、空の盤からもう一度遊べます。",
    back: "Restart plays it again from an empty board.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.restartAttempt": {
    text: "「最初からやり直す」を押すと、空の盤からもう一度遊べます。{count}回目の挑戦になります。",
    back: "Restart plays it again from an empty board; it will be attempt {count}.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.explosionsLegend": {
    text: "爆発（爆発のあるレベルで）",
    back: "Explosions, on the levels that have them",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.explosionsAria": {
    text: "爆発",
    back: "Explosions",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cheatingAria": {
    text: "ズル",
    back: "Cheating",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.explosions.on": {
    text: "ふつう",
    back: "Normal",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.explosions.soft": {
    text: "弱め",
    back: "Softer",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.explosions.off": {
    text: "なし",
    back: "Off",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cheats.off": {
    text: "ズルなし",
    back: "No cheating",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cheats.allowed": {
    text: "ズルを許す",
    back: "Allow cheating",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.costSoft": {
    text: "爆発を弱めて解いたレベルは、記録には数えられますが、得点はなく、最速の表にも載りません。",
    back: "A level solved with explosions softened counts, but scores no points and is not on the fastest table.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.costOff": {
    text: "爆発をなしにして解いたレベルは、記録には数えられますが、得点はなく、最速の表にも載りません。爆発なしでは、次のブロックも開きません。",
    back: "A level solved with explosions off counts, but scores no points and is not on the fastest table; with explosions off, it does not open the next block.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.costCheat": {
    text: "ズルは、未完成の線を1本引きます。ズルを使って解いたレベルは、記録には数えられますが、得点はなく、最速の表にも載りません。",
    back: "Cheat draws one unfinished line. A level solved with Cheat counts, but scores no points and is not on the fastest table.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.costSoftCheat": {
    text: "ズルは、未完成の線を1本引きます。爆発を弱めるかズルを使って解いたレベルは、記録には数えられますが、得点はなく、最速の表にも載りません。",
    back: "Cheat draws one unfinished line. A level solved with explosions softened or Cheat counts, but scores no points and is not on the fastest table.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.costOffCheat": {
    text: "ズルは、未完成の線を1本引きます。爆発をなしにするかズルを使って解いたレベルは、記録には数えられますが、得点はなく、最速の表にも載りません。爆発なしでは、次のブロックも開きません。",
    back: "Cheat draws one unfinished line. A level solved with explosions off or Cheat counts, but scores no points and is not on the fastest table; with explosions off, it does not open the next block.",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.marks.colours": {
    text: "色",
    back: "Colours",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.marks.numbers": {
    text: "数字",
    back: "Numbers",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.fill.marbles": {
    text: "玉",
    back: "Marbles",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.fill.lines": {
    text: "線",
    back: "Lines",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.set.classic": {
    text: "定番",
    back: "Classic",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.set.portals": {
    text: "ポータル",
    back: "Portals",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.joinBy": {
    text: "つなぎ方",
    back: "Join by",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.fillWith": {
    text: "線の中身",
    back: "Fill each line with",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.levelsAria": {
    text: "レベルの種類",
    back: "Levels",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.moveZoom": {
    text: "盤を動かす・拡大する",
    back: "Move and zoom the board",
    review: AGENT_READ,
  },
  "pmaze.pad.up": {
    text: "表示を上へ動かす",
    back: "Move the view up",
    review: AGENT_READ,
  },
  "pmaze.pad.down": {
    text: "表示を下へ動かす",
    back: "Move the view down",
    review: AGENT_READ,
  },
  "pmaze.pad.left": {
    text: "表示を左へ動かす",
    back: "Move the view left",
    review: AGENT_READ,
  },
  "pmaze.pad.right": {
    text: "表示を右へ動かす",
    back: "Move the view right",
    review: AGENT_READ,
  },
  "pmaze.pad.hideArrows": {
    text: "矢印をかくす",
    back: "Hide the arrows",
    review: AGENT_READ,
  },
  "pmaze.pad.showArrows": {
    text: "矢印を表示する",
    back: "Show the arrows",
    review: AGENT_READ,
  },
  "pmaze.pad.arrows": {
    text: "矢印",
    back: "Arrows",
    review: AGENT_READ,
  },
  "pmaze.pad.turn": {
    text: "回す",
    back: "Turn",
    review: AGENT_READ,
  },
  "pmaze.pad.turnAria": {
    text: "すべてのタイルを立てたまま、テーブルを時計回りに4分の1回転させる",
    back: "Turn the table a quarter turn clockwise, keeping every tile upright",
    review: AGENT_READ,
  },
  "pmaze.pad.turnTitle": {
    text: "テーブルを時計回りに4分の1回転させる",
    back: "Turn the table a quarter turn clockwise",
    review: AGENT_READ,
  },
  "pmaze.pad.moveZoomTable": {
    text: "テーブルを動かす・拡大する",
    back: "Move and zoom the table",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.sizePortals": {
    text: "ポータルの{size}×{size}",
    back: "{size}×{size} portals",
    review: AGENT_READ,
  },
  "pmaze.chip.marksOf": {
    text: "5段階中の{marks}",
    back: "{marks} of 5",
    review: AGENT_READ,
  },
  "pmaze.chip.new": {
    text: "新登場：{things}",
    back: "New: {things}",
    review: AGENT_READ,
  },
  "pmaze.pick.group": {
    text: "レベル{first}～{last}",
    back: "Levels {first} to {last}",
    review: AGENT_READ,
  },
  "pmaze.pick.solvedAria": {
    text: "、{time}で解決済み",
    back: ", solved in {time}",
    review: AGENT_READ,
  },
  "pmaze.pick.lockedAria": {
    text: "、ロック中",
    back: ", locked",
    review: AGENT_READ,
  },
  "pmaze.pick.nextAria": {
    text: "、次に遊ぶレベル",
    back: ", next",
    review: AGENT_READ,
  },
  "pmaze.pick.teaches": {
    text: "、新しい考え方：{words}",
    back: ", teaches {words}",
    review: AGENT_READ,
  },
  "pmaze.pick.test": {
    text: "、ブロックのテスト",
    back: ", the block's test",
    review: AGENT_READ,
  },
  "pmaze.pick.attempts.one": {
    text: "、挑戦{count}回",
    back: ", {count} attempt",
    review: AGENT_READ,
  },
  "pmaze.pick.attempts.other": {
    text: "、挑戦{count}回",
    back: ", {count} attempts",
    review: AGENT_READ,
  },
  "pmaze.pick.bestTitle": {
    text: "：ベスト{time}",
    back: ": best {time}",
    review: AGENT_READ,
  },
  "pmaze.pick.lockedTitle": {
    text: "：ロック中",
    back: ": locked",
    review: AGENT_READ,
  },
  "pmaze.pick.tagNew": {
    text: "新",
    back: "New",
    review: AGENT_READ,
  },
  "pmaze.pick.tagTest": {
    text: "試",
    back: "Test",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.peg": {
    text: "{y}行{x}列の駒",
    back: "the peg at row {y}, column {x}",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.hole": {
    text: "{y}行{x}列の空の穴",
    back: "the empty hole at row {y}, column {x}",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.goal": {
    text: "ゴール",
    back: "goal",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.legal": {
    text: "ここへ跳べる",
    back: "can be jumped to from here",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cell.marble": {
    text: "玉{n}",
    back: "marble {n}",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cell.line": {
    text: "線{n}",
    back: "line {n}",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cell.blocked": {
    text: "通れない",
    back: "cannot be passed",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cell.bridge": {
    text: "橋",
    back: "bridge",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cell.empty": {
    text: "空欄",
    back: "empty",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cell.waypoint": {
    text: "線{n}の経由点",
    back: "waypoint for line {n}",
    review: AGENT_READ,
  },
  "pmaze.tsunagi.cell.portal": {
    text: "ポータル{mark}",
    back: "portal {mark}",
    review: AGENT_READ,
  },
  "pmaze.suido.board": {
    text: "水道の盤、{width}×{height}",
    back: "Suido board, {width} by {height}",
    review: AGENT_READ,
  },
  "pmaze.suido.bare": {
    text: "{where}：空き地",
    back: "{where}: bare ground",
    review: AGENT_READ,
  },
  "pmaze.suido.end": {
    text: "{where}：行き止まりの駒",
    back: "{where}: a dead-end piece",
    review: AGENT_READ,
  },
  "pmaze.suido.straight": {
    text: "{where}：直線の駒",
    back: "{where}: a straight piece",
    review: AGENT_READ,
  },
  "pmaze.suido.elbow": {
    text: "{where}：曲がりの駒",
    back: "{where}: an elbow piece",
    review: AGENT_READ,
  },
  "pmaze.suido.tee": {
    text: "{where}：T字の駒",
    back: "{where}: a T-shaped piece",
    review: AGENT_READ,
  },
  "pmaze.suido.cross": {
    text: "{where}：十字の駒",
    back: "{where}: a cross-shaped piece",
    review: AGENT_READ,
  },
  "pmaze.suido.pump": {
    text: "ポンプ",
    back: "pump",
    review: AGENT_READ,
  },
  "pmaze.suido.drain": {
    text: "排水口",
    back: "drain",
    review: AGENT_READ,
  },
  "pmaze.suido.locked": {
    text: "固定",
    back: "locked",
    review: AGENT_READ,
  },
  "pmaze.suido.bigPart": {
    text: "大きな駒の一部で、いっしょに回る",
    back: "part of a big piece, and turns together with it",
    review: AGENT_READ,
  },
  "pmaze.suido.block": {
    text: "ブロックといっしょに回る",
    back: "turns with its block",
    review: AGENT_READ,
  },
  "pmaze.suido.open": {
    text: "{sides}が開いている",
    back: "open on the {sides}",
    review: AGENT_READ,
  },
  "pmaze.suido.north": {
    text: "北",
    back: "north",
    review: AGENT_READ,
  },
  "pmaze.suido.east": {
    text: "東",
    back: "east",
    review: AGENT_READ,
  },
  "pmaze.suido.south": {
    text: "南",
    back: "south",
    review: AGENT_READ,
  },
  "pmaze.suido.west": {
    text: "西",
    back: "west",
    review: AGENT_READ,
  },
  "pmaze.tobiishi.board": {
    text: "{name}の盤",
    back: "{name} board",
    review: AGENT_READ,
  },
  "pmaze.guide.ground.name": {
    text: "地面",
    back: "Ground",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.ground.text": {
    text: "何も置かれていないマス。水をすべての駒に通さなくてよい盤にだけあり、回すことはできません。",
    back: "Bare ground, with nothing on it. Only boards whose water need not reach every piece have it, and it is never turned.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.end.name": {
    text: "行き止まり",
    back: "End",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.end.text": {
    text: "口が1つの駒で、パイプの端です。4方向に向けられます。水が届いたら、口は隣の駒の口と合わせないと、水がこぼれます。",
    back: "One opening: a pipe that stops. It faces any of four ways. Wherever the water reaches an end, the opening must meet the opening of a piece beside it, or the water runs out.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.straight.name": {
    text: "まっすぐ",
    back: "Straight",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.straight.text": {
    text: "向かい合う2辺に口がある駒。縦と横の2通りに向けられるので、押すと切り替わります。",
    back: "Two openings on opposite sides. It faces two ways, along or across, so a tap on it flips it.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.elbow.name": {
    text: "曲がり",
    back: "Elbow",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.elbow.text": {
    text: "隣り合う2辺に口がある、角の駒。4方向に向けられます。",
    back: "Two openings on sides that meet, a corner. It faces any of four ways.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.tee.name": {
    text: "T字",
    back: "Tee",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.tee.text": {
    text: "口が3つで、枝分かれする駒。4方向に向けられ、水はここで分かれます。",
    back: "Three openings, a pipe that branches. It faces any of four ways, and the water splits at it.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.cross.name": {
    text: "十字",
    back: "Cross",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.cross.text": {
    text: "口が4つの交差点で、4方向の隣と全部つながります。回しても同じ見た目なので、押しても何も変わりません。",
    back: "Four openings, a crossing where all four neighbours join. It looks the same turned, so a tap on it changes nothing.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.pump.name": {
    text: "ポンプ",
    back: "Pump",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.pump.text": {
    text: "水の出どころ。駒の上のこい青の円に描かれたしずくです。地面以外のどの駒にも置け、その駒と同じように回ります。ポンプは1つの盤に1つか複数あり、それぞれが自分のパイプを満たします。",
    back: "Where the water comes from, drawn as a drop in a dark blue disc on a piece. A pump may sit on any piece but ground, and is turned like it. A board has one pump or several, and every pump fills its own pipes.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.drain.name": {
    text: "排水口",
    back: "Drain",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.drain.text": {
    text: "水が最後に届くべき場所。駒の上の丸い鉢で、水が届くと満ちます。排水口の盤では、すべての排水口に水を届けます。水がいらない駒は乾いたままで、どの向きでもかまいません。",
    back: "Where the water must end up, a round bowl on a piece that fills when the water reaches it. On a board of drains the water must reach every drain, and pieces it does not need may stay dry and face any way.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.pumpAndDrain.name": {
    text: "ポンプから排水口へ",
    back: "Pump to drain",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.pumpAndDrain.text": {
    text: "口がつながったポンプと排水口。水は一方からもう一方へ流れ、両方が満ちます。これがゲームのすべてです。駒を回して、すべての排水口に水を届け、どこからもこぼさないようにします。",
    back: "A pump and a drain with their openings joined: the water runs from the one to the other and fills both. It is the whole of the game: turn the pieces until every drain is reached and nothing leaks.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.locked.name": {
    text: "固定駒",
    back: "Locked piece",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.locked.text": {
    text: "回せない駒で、小さな鍵がついています。盤に置かれた向きのままなので、ここを手がかりに考えられます。",
    back: "A piece that cannot be turned, marked by a small padlock. It stays as the board gives it, so it is a fixed point to work from.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.wall.name": {
    text: "壁",
    back: "Wall",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.wall.text": {
    text: "2つのマスのあいだにある太い棒。水は越えられません。壁をはさんで向かい合う2つの駒は、つながりません。",
    back: "A thick bar across the edge between two cells, which the water cannot cross: two pieces that face each other across it do not join.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.wrap.name": {
    text: "端がつながる盤",
    back: "Edges that join",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.wrap.text": {
    text: "赤い点線のふちの盤。一方の端から出たパイプが、反対側の端から入ってきます。盤は輪になっていて、端がありません。",
    back: "A board with a dashed red rim: a pipe that leaves one side comes in at the opposite side, so the board is a ring and its edge is no edge.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigSnake.name": {
    text: "大きな駒：口が1つ",
    back: "Big piece: one pipe, one opening",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigSnake.text": {
    text: "4マスが1つの駒で、中にはぐるりと回って止まる1本のパイプがあります。口は1つだけ。ぜんたいで1つの駒として、4分の1ずつ回ります。",
    back: "A square of four cells that is one piece, with one pipe in it that winds round and stops: a single opening. It turns as a whole, a quarter at a time.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigHairpin.name": {
    text: "大きな駒：ヘアピン",
    back: "Big piece: a hairpin",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigHairpin.text": {
    text: "入って、そのまま戻ってくる1本のパイプ。2つの口が、四角の同じ辺に並びます。",
    back: "One pipe that goes in and comes straight back out, so both of its openings are side by side on one edge of the square.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoStraights.name": {
    text: "大きな駒：並んだ2本",
    back: "Big piece: two pipes side by side",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoStraights.text": {
    text: "すれちがうだけで、つながらない2本のパイプ。近くても、片方の水がもう片方に届くことはありません。口は4つで、向かい合う2辺に2つずつ。2方向に向けられます。",
    back: "Two pipes that run past each other and never meet, however close: the water in one never reaches the other. Four openings, two on each of two opposite sides. It faces two ways.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoElbows.name": {
    text: "大きな駒：曲がりの中の曲がり",
    back: "Big piece: one corner inside another",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoElbows.text": {
    text: "どちらも曲がった2本のパイプで、1本がもう1本の内側を曲がります。つながりません。口は4つで、隣り合う2辺にあります。",
    back: "Two pipes, each a corner, one bending inside the other. They never meet. Four openings, on two sides that meet.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigThroughAndBranch.name": {
    text: "大きな駒：通り抜ける1本と枝分かれ",
    back: "Big piece: one pipe through, one branching",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigThroughAndBranch.text": {
    text: "1本のパイプは四角をまっすぐ抜け、もう1本は横に枝分かれします。口は6つで、3辺に2つずつあります。",
    back: "One pipe runs straight through the square while the other branches off to the side. Six openings, two on each of three sides.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigHairpinOverStraight.name": {
    text: "大きな駒：ヘアピンとまっすぐ",
    back: "Big piece: a hairpin and a straight pipe",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigHairpinOverStraight.text": {
    text: "口が同じ辺に2つあるU字のパイプと、四角の反対側を横切るまっすぐなパイプ。2本はつながりません。",
    back: "A U-shaped pipe with both openings on one edge, and a straight pipe running across the opposite side of the square. They never meet.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigBranchAndStraight.name": {
    text: "大きな駒：枝のあるパイプとまっすぐ",
    back: "Big piece: a branching pipe and a straight one",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigBranchAndStraight.text": {
    text: "入って枝分かれし、枝の1つが四角の中で止まるパイプと、まっすぐ横切るパイプが並びます。",
    back: "A pipe that comes in, branches, and has one branch ending inside the square, beside a pipe that runs straight across.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoStubbedPipes.name": {
    text: "大きな駒：中で止まる枝のある2本",
    back: "Big piece: two pipes with a stub inside",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoStubbedPipes.text": {
    text: "口が2つずつの2本のパイプ。どちらもT字で、枝の1つが四角の中で止まります。",
    back: "Two pipes of two openings each. Each is a tee with one of its branches ending inside the square.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigThreePipes.name": {
    text: "大きな駒：口が1つずつの3本",
    back: "Big piece: three pipes, one opening each",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigThreePipes.text": {
    text: "4マスの中に、つながっていない3本のパイプがあります。短い行き止まりが2つと、入って中で止まる少し長い1本です。",
    back: "Three separate pipes in a square of four cells: two short stubs and a longer one that goes in and stops inside. None is joined to another.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigThreePipesTwoOpenings.name": {
    text: "大きな駒：口が2つずつの3本",
    back: "Big piece: three pipes, two openings each",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigThreePipesTwoOpenings.text": {
    text: "口が2つずつの、つながっていない3本のパイプ。ふつうの曲がりが2本と、枝が四角の中で止まる1本です。",
    back: "Three separate pipes of two openings each: two plain corners and a pipe with a branch that stops inside the square.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigCrossingAndStub.name": {
    text: "大きな駒：十字の入った駒と行き止まり",
    back: "Big piece: a crossing inside, and a stub",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigCrossingAndStub.text": {
    text: "十字とT字が中でつながった、口が6つの1本のパイプと、そのとなりにある別の行き止まり。",
    back: "One pipe with six openings, a cross and tees joined inside the square, and a stub of its own beside it.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigGrid.name": {
    text: "大きな駒：十字の格子",
    back: "Big piece: a grid of crossings",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigGrid.text": {
    text: "口が8つの1本のパイプ。四角が持てる最多です。どのマスもT字か十字で、中で水があらゆる方向へ進みます。",
    back: "One pipe with eight openings, the most a square has: every cell a tee or a cross, so the water goes every way inside it.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoTeePipes.name": {
    text: "大きな駒：T字2つの2本",
    back: "Big piece: two pipes of two tees",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTwoTeePipes.text": {
    text: "口が4つずつの2本のパイプが並び、どのマスもT字です。口は合わせて8つで、片方の水がもう片方へ移ることはありません。",
    back: "Two pipes of four openings each, every cell a tee: eight openings in all, and water that never crosses from one pipe to the other.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.blockTurn.name": {
    text: "いっしょに回るブロック",
    back: "Block that turns as one",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.blockTurn.text": {
    text: "曲がり、行き止まり、まっすぐ、T字の4つのふつうの駒。1つずつは回せません。押すと四角ぜんたいが4分の1回り、それぞれの駒が次の場所へ動きながら回ります。中がつながっていない、大きな駒のようなものです。",
    back: "Four ordinary pieces, a corner, an end, a straight and a tee, that cannot be turned on their own. A tap turns the whole square a quarter, and each piece moves round to the next place as it turns, like a bigger piece that is not joined inside.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.title": {
    text: "駒の一覧",
    back: "The pieces",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.lead": {
    text: "水道のすべての駒を、パッケージ自身が描いています。ふつうの駒は、押すと4分の1回ります。大きな駒とブロックは、四角ごといっしょに回ります。",
    back: "Every piece in Suido, each drawn by the package itself. A tap turns an ordinary piece a quarter; a big piece and a block turn as one square.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.groupTurn": {
    text: "回す駒",
    back: "Pieces you turn",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.groupWater": {
    text: "水の出発点と行き先",
    back: "Where the water starts and ends",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.groupTwist": {
    text: "盤に加わるもの",
    back: "What a board adds",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.groupBlock": {
    text: "いっしょに回る四角",
    back: "A square that turns as one",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigTitle": {
    text: "大きな駒",
    back: "Big pieces",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.bigLead": {
    text: "大きな駒は4マスを使い、回すときは1つの駒です。中には1本、2本、または3本の、つながっていないパイプがあります。近くを通っていても、片方の水がもう片方に届くことはありません。大きな駒がとれる699通りの形のうち、いくつかを見せます。",
    back: "A big piece fills four squares and is one piece to turn. Inside it are one, two or three separate pipes: water in one never reaches another, however close they run. These are a few of the 699 shapes a big piece can have.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.familiesTitle": {
    text: "大きな駒の全グループ",
    back: "Every family of big piece",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.familiesLead": {
    text: "グループとは、パイプごとの口の数が同じ大きな駒のことです。2+2は口が2つのパイプ2本、1+1+1は口が1つのパイプ3本です。32グループあり、絵はそれぞれのグループの形を1つずつ、形の数といっしょに示します。",
    back: "A family is the big pieces whose pipes have the same numbers of openings: 2+2 is two pipes of two openings each, and 1+1+1 is three pipes of one opening each. There are 32 families, and each picture is one shape of its family, with how many shapes it has.",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
  "pmaze.guide.family": {
    text: "{family} ・ {count}通り",
    back: "{family} · {count}",
    ask: "Drafted by the builder from the demo's own wording, not yet read by the Japanese reviewer or a person.",
  },
};
