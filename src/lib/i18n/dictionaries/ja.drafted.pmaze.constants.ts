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
};
