import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pset.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PSET: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pset.options": {
    text: "設定",
    back: "Options",
    review: AGENT_READ,
  },
  "pset.level": {
    text: "レベル",
    back: "Level",
    review: AGENT_READ,
  },
  "pset.notOffered": {
    text: "{size}では選べません",
    back: "Not offered at {size}",
    review: AGENT_READ,
  },
  "pset.noLevelAt": {
    text: "{size}×{size}には、{level}のパズルはありません",
    back: "A {size}×{size} has no {level} puzzle to make",
    review: AGENT_READ,
  },
  "pset.strict": {
    text: "ストリクト",
    back: "Strict",
    review: AGENT_READ,
  },
  "pset.free": {
    text: "フリー",
    back: "Free",
    review: AGENT_READ,
  },
  "pset.strictBlurb": {
    text: "見つかった文字は、次の予想でも必ず使い、緑の文字は同じ場所に置きます。",
    back: "Every letter found must be played again, a green one in its place.",
    review: AGENT_READ,
  },
  "pset.freeBlurb": {
    text: "どの単語でも予想できます。直前に見つかった文字は関係ありません。",
    back: "Any word may be guessed, whatever the last ones found.",
    review: AGENT_READ,
  },
  "pset.howDrawn": {
    text: "盤の描き方",
    back: "How the grid is drawn",
    review: AGENT_READ,
  },
  "pset.checks": {
    text: "チェック",
    back: "Checks",
    review: AGENT_READ,
  },
  "pset.hints": {
    text: "ヒント",
    back: "Hints",
    review: AGENT_READ,
  },
  "pset.hintsOn": {
    text: "ヒントあり",
    back: "Hints",
    review: AGENT_READ,
  },
  "pset.hintsOff": {
    text: "ヒントなし",
    back: "No hints",
    review: AGENT_READ,
  },
  "pset.raceCouldNotMake": {
    text: "サイトは、競走を作れませんでした。",
    back: "The site could not make the race.",
    review: AGENT_READ,
  },
  "pset.couldNotReach": {
    text: "サイトにつながりません。",
    back: "The site could not be reached.",
    review: AGENT_READ,
  },
  "pset.racePassAndPlay": {
    text: "交代で遊ぶのは1台です。競走は、会員2人が2台で行います。",
    back: "Pass and play is on this device; a race is between two members on two.",
    review: AGENT_READ,
  },
  "pset.raceNeedsAccount": {
    text: "競走は、会員どうしで行います。このセッションには、まだアカウントがありません。",
    back: "A race is between two members; this session has no account yet.",
    review: AGENT_READ,
  },
  "pset.friendNeedsAccount": {
    text: "友だちと始めるには、アカウントが必要です。",
    back: "Starting with a friend needs an account.",
    review: AGENT_READ,
  },
  "pset.clock": {
    text: "時計",
    back: "Clock",
    review: AGENT_READ,
  },
  "pset.clockOwnMeasure": {
    text: "{name}は、成績を自分のやり方で測るので、時計なしで遊びます。",
    back: "{name} keeps its own measure of how you did, so it is played with no clock.",
    review: AGENT_READ,
  },
  "pset.col.puzzle": {
    text: "パズル",
    back: "Puzzle",
    review: AGENT_READ,
  },
  "pset.col.time": {
    text: "時間",
    back: "Time",
    review: AGENT_READ,
  },
  "pset.col.points": {
    text: "点",
    back: "Points",
    review: AGENT_READ,
  },
  "pset.col.when": {
    text: "いつ",
    back: "When",
    review: AGENT_READ,
  },
  "pset.col.guesses": {
    text: "予想",
    back: "Guesses",
    review: AGENT_READ,
  },
  "pset.col.swaps": {
    text: "入れ替え",
    back: "Swaps",
    review: AGENT_READ,
  },
  "pset.col.moves": {
    text: "手",
    back: "Moves",
    review: AGENT_READ,
  },
  "pset.col.replay": {
    text: "再生",
    back: "Replay",
    review: AGENT_READ,
  },
  "pset.link.leaderboard": {
    text: "番付",
    back: "leaderboard",
    review: AGENT_READ,
  },
  "pset.link.playOne": {
    text: "1問遊ぶ",
    back: "play one",
    review: AGENT_READ,
  },
  "pset.link.justMine": {
    text: "自分の分だけ",
    back: "just mine",
    review: AGENT_READ,
  },
  "pset.link.fastestHere": {
    text: "ここでの最速",
    back: "fastest here",
    review: AGENT_READ,
  },
  "pset.link.everybodys": {
    text: "全員の解答",
    back: "everybody's solves",
    review: AGENT_READ,
  },
  "pset.link.rules": {
    text: "規則",
    back: "rules",
    review: AGENT_READ,
  },
  "pset.link.yourSolves": {
    text: "自分の解答",
    back: "your solves",
    review: AGENT_READ,
  },
  "pset.rec.title": {
    text: "{name} · すべての解答",
    back: "{name} · All solves",
    review: AGENT_READ,
  },
  "pset.rec.allSolves": {
    text: "すべての解答",
    back: "All solves",
    review: AGENT_READ,
  },
  "pset.rec.lead": {
    text: "ここに保存された、全員のすべての解答です。タイムを開くと、その解答を1手ずつ見直せます。",
    back: "Every solve of it kept here, by everybody. Open a time to watch that solve again, step by step.",
    review: AGENT_READ,
  },
  "pset.rec.filteredBy": {
    text: "絞り込み",
    back: "Filtered by",
    review: AGENT_READ,
  },
  "pset.rec.stopNarrowing": {
    text: "「{label}」での絞り込みを外す",
    back: "Stop narrowing to {label}",
    review: AGENT_READ,
  },
  "pset.rec.remove": {
    text: "— 外す",
    back: "— remove",
    review: AGENT_READ,
  },
  "pset.rec.sort": {
    text: "並び順：",
    back: "Sort:",
    review: AGENT_READ,
  },
  "pset.rec.newestFirst": {
    text: "新しい順",
    back: "newest first",
    review: AGENT_READ,
  },
  "pset.rec.fastestFirst": {
    text: "速い順",
    back: "fastest first",
    review: AGENT_READ,
  },
  "pset.rec.tallyHead": {
    text: "（{puzzles}{when}）。どの問題も、いちばんよい解答が1回だけ数えられます。",
    back: " from {puzzles}{when}: each puzzle counts once, at its best, and the rows marked",
    review: AGENT_READ,
  },
  "pset.rec.tallyTail": {
    text: "の行が、数えられたものです。",
    back: " are the ones counted.",
    review: AGENT_READ,
  },
  "pset.rec.withStar": {
    text: "星つき",
    back: "with a star",
    review: AGENT_READ,
  },
  "pset.rec.inWhen": {
    text: "（{when}の分）",
    back: " in {when}",
    review: AGENT_READ,
  },
  "pset.rec.previous": {
    text: "← 前へ",
    back: "← Previous",
    review: AGENT_READ,
  },
  "pset.rec.next": {
    text: "次へ →",
    back: "Next →",
    review: AGENT_READ,
  },
  "pset.rec.page": {
    text: "{pages}ページ中の{page}ページ目",
    back: "Page {page} of {pages}",
    review: AGENT_READ,
  },
  "pset.rec.yourSolvesChip": {
    text: "自分の解答",
    back: "Your solves",
    review: AGENT_READ,
  },
  "pset.rec.theirSolvesChip": {
    text: "{name}の解答",
    back: "{name}'s solves",
    review: AGENT_READ,
  },
  "pset.rec.solvedFastest": {
    text: "解けたものを速い順に",
    back: "Solved, fastest first",
    review: AGENT_READ,
  },
  "pset.rec.noMatch": {
    text: "この記録の絞り込みに合う解答はありません。",
    back: "No solves match what this record is narrowed to.",
    review: AGENT_READ,
  },
  "pset.rec.nobody": {
    text: "ここでは、まだ誰も解いていません。",
    back: "Nobody has solved this here yet.",
    review: AGENT_READ,
  },
  "pset.rec.playOneArrow": {
    text: "1問遊ぶ →",
    back: "Play one →",
    review: AGENT_READ,
  },
  "pset.rec.beFirstArrow": {
    text: "最初の一人になる →",
    back: "Be the first →",
    review: AGENT_READ,
  },
  "pset.rec.race": {
    text: "競走",
    back: "race",
    review: AGENT_READ,
  },
  "pset.rec.helped": {
    text: "補助あり",
    back: "helped",
    review: AGENT_READ,
  },
  "pset.rec.counted": {
    text: "上の点に数えられています",
    back: "Counted in the points above",
    review: AGENT_READ,
  },
  "pset.solve.gotThrough": {
    text: "通り抜けた",
    back: "Got through",
    review: AGENT_READ,
  },
  "pset.solve.caught": {
    text: "引っかかった",
    back: "Caught",
    review: AGENT_READ,
  },
  "pset.solve.result": {
    text: "結果",
    back: "Result",
    review: AGENT_READ,
  },
  "pset.solve.theWord": {
    text: "単語",
    back: "The word",
    review: AGENT_READ,
  },
  "pset.solve.keptBackShort": {
    text: "明日まで非公開",
    back: "Kept back until tomorrow",
    review: AGENT_READ,
  },
  "pset.solve.level": {
    text: "レベル",
    back: "Level",
    review: AGENT_READ,
  },
  "pset.solve.time": {
    text: "時間",
    back: "Time",
    review: AGENT_READ,
  },
  "pset.solve.countdown": {
    text: "カウントダウン",
    back: "Countdown",
    review: AGENT_READ,
  },
  "pset.solve.points": {
    text: "点",
    back: "Points",
    review: AGENT_READ,
  },
  "pset.solve.helpUsed": {
    text: "使った補助",
    back: "Help used",
    review: AGENT_READ,
  },
  "pset.solve.none": {
    text: "なし",
    back: "None",
    review: AGENT_READ,
  },
  "pset.solve.finished": {
    text: "終了",
    back: "Finished",
    review: AGENT_READ,
  },
  "pset.solve.checksOf": {
    text: "{checks}（上限{allowed}回）",
    back: "{checks} of {allowed}",
    review: AGENT_READ,
  },
  "pset.solve.levelBand": {
    text: "{number}番、{level}",
    back: "{number}, {level}",
    review: AGENT_READ,
  },
  "pset.solve.yours": {
    text: "自分の",
    back: "Yours",
    review: AGENT_READ,
  },
  "pset.solve.yourTitle": {
    text: "自分の{name}",
    back: "Your {name}",
    review: AGENT_READ,
  },
  "pset.solve.leadBy": {
    text: "{outcome}。解いた人は",
    back: "{outcome} by ",
    review: AGENT_READ,
  },
  "pset.solve.storyOf": {
    text: "の{name}",
    back: "'s {name}",
    review: AGENT_READ,
  },
  "pset.solve.word": {
    text: "単語",
    back: "Word",
    review: AGENT_READ,
  },
  "pset.solve.solve": {
    text: "解答",
    back: "Solve",
    review: AGENT_READ,
  },
  "pset.solve.playedOn": {
    text: "{site}で遊んだ記録 · ",
    back: "Played on {site} · ",
    review: AGENT_READ,
  },
  "pset.solve.keptBackFixed": {
    text: "このレベルは全員が同じ盤なので、解き方は、自分で解くまで非公開です。ここでは、配られたままの盤を見せています。",
    back: "This level is the same board for everybody, so how it was solved is kept back until you have solved it yourself. Here it is as it is dealt.",
    review: AGENT_READ,
  },
  "pset.solve.keptBackToday": {
    text: "今日のパズルは全員が同じなので、解き方は、明日になるか、自分で解き終えるまで非公開です。",
    back: "Today's puzzle is the same for everybody, so how it was solved is kept back until tomorrow, or until you have finished it yourself.",
    review: AGENT_READ,
  },
  "pset.solve.playIt": {
    text: "遊ぶ",
    back: "Play it",
    review: AGENT_READ,
  },
  "pset.solve.playTodays": {
    text: "今日のを遊ぶ",
    back: "Play today's",
    review: AGENT_READ,
  },
  "pset.solve.race": {
    text: "競走",
    back: "Race",
    review: AGENT_READ,
  },
  "pset.solve.theRaceItWas": {
    text: "その競走",
    back: "The race it was",
    review: AGENT_READ,
  },
  "pset.solve.allTheirs": {
    text: "この人の{name}すべて",
    back: "All their {name}",
    review: AGENT_READ,
  },
  "pset.solve.fastestSame": {
    text: "同じ{size}とレベルの最速タイム",
    back: "Fastest times, same {size} and level",
    review: AGENT_READ,
  },
  "pset.solve.onClock": {
    text: "（{clock}の分）",
    back: " on the {clock}",
    review: AGENT_READ,
  },
  "pset.solve.allYours": {
    text: "自分の{name}すべて",
    back: "All your {name}",
    review: AGENT_READ,
  },
  "pset.solve.playAnother": {
    text: "もう1問遊ぶ",
    back: "Play another",
    review: AGENT_READ,
  },
  "pset.me.lead.guest": {
    text: "このページには自分の解答が並びますが、まだ誰なのか分かりません。",
    back: "This page lists your own solves, and it does not know who you are yet.",
    review: AGENT_READ,
  },
  "pset.me.lead.words": {
    text: "遊んだ単語がすべて、見つけたかどうかにかかわらず、予想と点数つきで並びます。",
    back: "Every word you have played, found or not, with your guesses and what each scored.",
    review: AGENT_READ,
  },
  "pset.me.lead.solves": {
    text: "自分の解答が新しい順に、そして競走が並びます。",
    back: "Your solves of it, newest first, and your races.",
    review: AGENT_READ,
  },
  "pset.me.yourSolves": {
    text: "自分の解",
    back: "Your solves",
    review: AGENT_READ,
  },
  "pset.me.yourRaces": {
    text: "競解",
    back: "Your races",
    review: AGENT_READ,
  },
  "pset.me.none": {
    text: "まだありません。",
    back: "None yet.",
    review: AGENT_READ,
  },
  "pset.me.playOne": {
    text: "1問遊ぶ →",
    back: "Play one →",
    review: AGENT_READ,
  },
  "pset.me.playAFriend": {
    text: "友だちと遊ぶ →",
    back: "Play a friend →",
    review: AGENT_READ,
  },
  "pset.me.inARace": {
    text: "競走で",
    back: "in a race",
    review: AGENT_READ,
  },
  "pset.me.against": {
    text: "{size}、相手は{other}",
    back: "{size} against {other}",
    review: AGENT_READ,
  },
  "pset.me.nobodyYet": {
    text: "まだ誰もいません",
    back: "nobody yet",
    review: AGENT_READ,
  },
  "pset.me.notOver": {
    text: "まだ終わっていません",
    back: "not over",
    review: AGENT_READ,
  },
  "pset.me.nobodyWon": {
    text: "勝者なし",
    back: "nobody won",
    review: AGENT_READ,
  },
  "pset.me.youWon": {
    text: "勝ち",
    back: "you won",
    review: AGENT_READ,
  },
  "pset.me.theyWon": {
    text: "負け",
    back: "they won",
    review: AGENT_READ,
  },
  "pset.standings.title": {
    text: "番付",
    back: "Leaderboard",
    review: AGENT_READ,
  },
  "pset.standings.lead": {
    text: "全員の点を通算と今月で、続いて、すべてのサイズとレベルの最速の解答を並べます。1人で解いたときの時間は自分のブラウザが、競走の時間はサイトが計ります。",
    back: "Everybody's points at it, all time and this month, then the fastest solves at every size and level. A solve on your own is timed by your browser; a race by the site.",
    review: AGENT_READ,
  },
  "pset.fast.heading": {
    text: "最速の解答",
    back: "Fastest solves",
    review: AGENT_READ,
  },
  "pset.fast.shut": {
    text: "{title}について読むのは、誰でもできます。誰がいちばん速いかは、このサイトの遊ぶ側のことで、招待が必要です。",
    back: "Reading about {title} is open to anybody. Who is fastest at it is the playing half of this site, and that needs an invite.",
    review: AGENT_READ,
  },
  "pset.fast.every": {
    text: "すべてのサイズとレベル →",
    back: "Every size and level →",
    review: AGENT_READ,
  },
  "pset.fast.nobody": {
    text: "ここでは、まだ誰も解いていません。",
    back: "Nobody has solved this here yet.",
    review: AGENT_READ,
  },
  "pset.fast.beFirst": {
    text: "最初の一人になる →",
    back: "Be the first →",
    review: AGENT_READ,
  },
  "pset.fast.everySolve": {
    text: "このサイズとレベルのすべての解答を、速い順に",
    back: "Every solve at this size and level, fastest first",
    review: AGENT_READ,
  },
  "pset.fast.everySolveLink": {
    text: "· すべての解答 →",
    back: "· every solve →",
    review: AGENT_READ,
  },
  "pset.fast.nobodyYet": {
    text: "まだ誰もいません。最初の一人になりましょう",
    back: "nobody yet — be the first",
    review: AGENT_READ,
  },
  "pset.fast.headStart": {
    text: "先手",
    back: "head start",
    review: AGENT_READ,
  },
  "pset.fast.hints": {
    text: "ヒント",
    back: "hints",
    review: AGENT_READ,
  },
  "pset.fast.watchAgain": {
    text: "この解答を1手ずつ見直す",
    back: "Watch this solve again, step by step",
    review: AGENT_READ,
  },
  "pset.fast.replay": {
    text: "再生 ▸",
    back: "Replay ▸",
    review: AGENT_READ,
  },
  "pset.fast.anySize": {
    text: "どのサイズでも",
    back: "Any size",
    review: AGENT_READ,
  },
  "pset.fast.nobodyOnClock": {
    text: "{clock}では、まだ誰もいません。最初の一人になりましょう",
    back: "nobody yet on the {clock} — be the first",
    review: AGENT_READ,
  },
  "pset.points.heading": {
    text: "番付",
    back: "Leaderboard",
    review: AGENT_READ,
  },
  "pset.points.shut": {
    text: "{title}について読むのは、誰でもできます。誰がリードしているかは、このサイトの遊ぶ側のことで、招待が必要です。",
    back: "Reading about {title} is open to anybody. Who leads at it is the playing half of this site, and that needs an invite.",
    review: AGENT_READ,
  },
  "pset.points.whole": {
    text: "番付のすべて →",
    back: "The whole board →",
    review: AGENT_READ,
  },
  "pset.points.gomoji": {
    text: "見つけた文字ごとに点が入ります。早いほど、正しい場所にあるほど多く入ります。単語そのものは、盤が大きいほど、残った予想が多いほど、速いほど多くなります。見つけられなかった単語でも、文字の点は入り、先手には{help}点かかります。単語ごとに、いちばんよい記録が数えられます。",
    back: "Every letter you find scores, more the sooner and more in its place; the word itself more the bigger the board, and more for guesses left and speed. A word not found still scores its letters, and a head start costs {help}. Your best of each word counts.",
    review: AGENT_READ,
  },
  "pset.points.cardsFull": {
    text: "組札に上がったカード1枚につき{cell}点なので、勝った配りは{total}点になります。配りごとに、いちばんよい記録が数えられます。",
    back: "{cell} for every card brought home, so every deal won scores {total}. Your best of each deal counts.",
    review: AGENT_READ,
  },
  "pset.points.spider": {
    text: "2組のカードのうち、並びに入ったカード1枚につき{cell}点なので、勝った配りは{total}点になります。配りごとに、いちばんよい記録が数えられます。",
    back: "{cell} for every card of both decks put into a run, so every deal won scores {total}. Your best of each deal counts.",
    review: AGENT_READ,
  },
  "pset.points.mahjong": {
    text: "取った牌1枚につき{cell}点、ヒント1回につき−{help}点です。配りごとに、いちばんよい記録が数えられます。",
    back: "{cell} a tile you take, −{help} a Hint. Your best of each deal counts.",
    review: AGENT_READ,
  },
  "pset.points.tobiishi": {
    text: "レベルのいちばん短い手順の跳び1回につき{cell}点なので、短い、中くらい、長いレベルで、{sizes}点です。レベルにチェックとヒントはありません。レベルごとに、いちばんよい記録が数えられます。",
    back: "{cell} for every jump of a level's shortest way, so {sizes} points for a short, a medium or a long level. A level has no Check or Hint. Your best of each level counts.",
    review: AGENT_READ,
  },
  "pset.points.suido": {
    text: "盤のパイプの部品1つにつき{cell}点、ヒント1回につき−{help}点です。盤ごとに、いちばんよい記録が数えられます。",
    back: "{cell} for every piece of pipe on the board, −{help} a Hint. Your best of each board counts.",
    review: AGENT_READ,
  },
  "pset.points.bridges": {
    text: "答えにあるすべての橋の端1つにつき{cell}点（つまり、すべての島の数字の合計）、チェックかヒント1回につき−{help}点です。パズルごとに、いちばんよい記録が数えられます。",
    back: "{cell} for each end of every bridge the answer has — every island's number, added up — and −{help} a Check or Hint. Your best of each puzzle counts.",
    review: AGENT_READ,
  },
  "pset.points.pictureLogic": {
    text: "盤のマス1つにつき{cell}点（塗るか空にするかが、どれも決まっています）、チェックかヒント1回につき−{help}点です。パズルごとに、いちばんよい記録が数えられます。",
    back: "{cell} for every square of the grid, each one decided, shaded or empty, and −{help} a Check or Hint. Your best of each puzzle counts.",
    review: AGENT_READ,
  },
  "pset.points.pencil": {
    text: "答えが決める盤のマス1つにつき{cell}点、チェックかヒント1回につき−{help}点です。パズルごとに、いちばんよい記録が数えられます。",
    back: "{cell} for every cell of the grid the answer decides, and −{help} a Check or Hint. Your best of each puzzle counts.",
    review: AGENT_READ,
  },
  "pset.points.default": {
    text: "埋めたマス1つにつき{cell}点、チェックかヒント1回につき−{help}点です。パズルごとに、いちばんよい記録が数えられます。",
    back: "{cell} a cell you fill, −{help} a Check or Hint. Your best of each puzzle counts.",
    review: AGENT_READ,
  },
  "pset.lf.heading": {
    text: "レベル{level}の最速",
    back: "Fastest on level {level}",
    review: AGENT_READ,
  },
  "pset.lf.nobody": {
    text: "{where}のレベル{level}は、まだ誰も解いていません。ここでの最初のタイムが、超える相手になります。",
    back: "Nobody has solved level {level} at {where} yet. The first time here is the one to beat.",
    review: AGENT_READ,
  },
  "pset.time.noLonger": {
    text: "この解答は、もう保存されていません",
    back: "This solve is no longer kept",
    review: AGENT_READ,
  },
  "pset.time.open": {
    text: "この解答を開く",
    back: "Open this solve",
    review: AGENT_READ,
  },
  "pset.points.madeOf": {
    text: "この点のもとになった解答",
    back: "The solves these points were made of",
    review: AGENT_READ,
  },
  "pset.mine.openSolve": {
    text: "自分の{name}（{ago}に終了）、終わったときのまま",
    back: "Your {name}, finished {ago}, as it ended",
    review: AGENT_READ,
  },
  "pset.mine.points": {
    text: "点",
    back: "points",
    review: AGENT_READ,
  },
  "pset.mine.unitGuesses": {
    text: "予想",
    back: "guesses",
    review: AGENT_READ,
  },
  "pset.mine.unitSwaps": {
    text: "入れ替え",
    back: "swaps",
    review: AGENT_READ,
  },
  "pset.mine.unitMoves": {
    text: "手",
    back: "moves",
    review: AGENT_READ,
  },
  "pset.mine.noHelp": {
    text: "補助なし",
    back: "no help",
    review: AGENT_READ,
  },
  "pset.mine.raceAt": {
    text: "{name}の競走",
    back: "Race at {name}",
    review: AGENT_READ,
  },
  "pset.mine.somebody": {
    text: "誰か",
    back: "somebody",
    review: AGENT_READ,
  },
  "pset.mine.raceAgainst": {
    text: "競走の相手は",
    back: "a race against ",
    review: AGENT_READ,
  },
  "pset.mine.waitingOnYou": {
    text: "、こちらの番です",
    back: ", waiting on you",
    review: AGENT_READ,
  },
  "pset.mine.carryOn": {
    text: "{name}を続ける",
    back: "Carry on with {name}",
    review: AGENT_READ,
  },
  "pset.mine.soFar": {
    text: "{time}経過",
    back: "{time} so far",
    review: AGENT_READ,
  },
  "pset.mine.checks.one": {
    text: "チェック1回",
    back: "one check",
    review: AGENT_READ,
  },
  "pset.mine.checks.other": {
    text: "チェック{count}回",
    back: "{count} checks",
    review: AGENT_READ,
  },
  "pset.mine.hints": {
    text: "ヒントあり",
    back: "hints",
    review: AGENT_READ,
  },
  "pset.mine.strict": {
    text: "ストリクト",
    back: "strict",
    review: AGENT_READ,
  },
  "pset.mine.countdownLeft": {
    text: "{countdown}、残り{time}",
    back: "{countdown}, {time} left",
    review: AGENT_READ,
  },
  "pset.mine.allLevels": {
    text: "すべてのレベル",
    back: "All levels",
    review: AGENT_READ,
  },
  "pset.front.picture": {
    text: "途中まで進んだ{title}のパズル",
    back: "A {title} puzzle part way through",
    review: AGENT_READ,
  },
  "pset.front.todaysDeal": {
    text: "今日の配札 →",
    back: "Today's deal →",
    review: AGENT_READ,
  },
  "pset.front.todaysPuzzle": {
    text: "今日のパズル →",
    back: "Today's puzzle →",
    review: AGENT_READ,
  },
  "pset.front.ourVersion": {
    text: "「{name}」を元にした、このサイトの版です。",
    back: "Our version of \"{name}\".",
    review: AGENT_READ,
  },
  "pset.front.fullRules": {
    text: "{title}の規則をすべて見る",
    back: "Full rules of {title}",
    review: AGENT_READ,
  },
  "pset.front.moreHeading": {
    text: "このゲームについて",
    back: "More on this game",
    review: AGENT_READ,
  },
  "pset.front.rules": {
    text: "規則",
    back: "Rules",
    review: AGENT_READ,
  },
  "pset.front.yourWords": {
    text: "自分の言葉",
    back: "Your words",
    review: AGENT_READ,
  },
  "pset.front.pastDaily": {
    text: "過去の毎日の言葉",
    back: "Past words of the day",
    review: AGENT_READ,
  },
  "pset.front.background": {
    text: "背景",
    back: "Background",
    review: AGENT_READ,
  },
  "pset.race.title": {
    text: "{game}で競う",
    back: "Race at {game}",
    review: AGENT_READ,
  },
  "pset.race.crumb": {
    text: "競争",
    back: "Race",
    review: AGENT_READ,
  },
  "pset.race.checksEach.one": {
    text: "チェックは1人1回まで",
    back: "one check each",
    review: AGENT_READ,
  },
  "pset.race.checksEach.other": {
    text: "チェックは1人{count}回まで",
    back: "{count} checks each",
    review: AGENT_READ,
  },
  "pset.race.faster": {
    text: "先に正解した人の勝ちです。",
    back: "the faster correct solve wins.",
    review: AGENT_READ,
  },
  "pset.race.seats": {
    text: "2つの席",
    back: "The two seats",
    review: AGENT_READ,
  },
  "pset.race.offeredTo": {
    text: "{name}に提案中",
    back: "Offered to {name}",
    review: AGENT_READ,
  },
  "pset.race.aBuddy": {
    text: "バディ",
    back: "a buddy",
    review: AGENT_READ,
  },
  "pset.race.open": {
    text: "もう1つの席は、まだ空いています",
    back: "The other seat, still open",
    review: AGENT_READ,
  },
  "pset.race.host": {
    text: "主催者",
    back: "The host",
    review: AGENT_READ,
  },
  "pset.race.guest": {
    text: "相手",
    back: "The guest",
    review: AGENT_READ,
  },
  "pset.race.you": {
    text: "（自分）",
    back: "(you)",
    review: AGENT_READ,
  },
  "pset.race.nobody": {
    text: "まだ誰も座っていません。",
    back: "Nobody has taken it yet.",
    review: AGENT_READ,
  },
  "pset.race.notStarted": {
    text: "まだ始まっていません。",
    back: "Not started.",
    review: AGENT_READ,
  },
  "pset.race.solvingSince": {
    text: "UTCの{time}から解いています。",
    back: "Solving since {time} UTC.",
    review: AGENT_READ,
  },
  "pset.race.solvedIn": {
    text: "{time}で解きました。",
    back: "Solved in {time}.",
    review: AGENT_READ,
  },
  "pset.race.outOfGuesses": {
    text: "予想の回数を使いきり、完走できませんでした。",
    back: "Out of guesses: no finish.",
    review: AGENT_READ,
  },
  "pset.race.gaveUp": {
    text: "あきらめました。時間切れで、完走できませんでした。",
    back: "Gave up: the sitting ran out with no finish.",
    review: AGENT_READ,
  },
  "pset.race.notOver": {
    text: "まだ終わっていません。",
    back: "Not over yet.",
    review: AGENT_READ,
  },
  "pset.race.tie": {
    text: "勝者はいません。引き分けか、誰も完走しませんでした。",
    back: "Nobody won: a tie, or nobody finished.",
    review: AGENT_READ,
  },
  "pset.race.won": {
    text: "{name}の勝ちです。",
    back: "{name} won.",
    review: AGENT_READ,
  },
  "pset.race.takeSeat": {
    text: "席に着いて、競う →",
    back: "Take the seat and race →",
    review: AGENT_READ,
  },
  "pset.race.needsAccount": {
    text: "競争はメンバー2人のあいだで行います。このサインインにはメンバーのアカウントがないため、席には着けませんでした。",
    back: "A race is between two members, and this sign-in has no member account, so the seat was not taken.",
    review: AGENT_READ,
  },
  "pset.race.notYours": {
    text: "この競争は、上の2人のあいだのものです。自分の競争は、{setup}から始めてください。",
    back: "This race is between the two people above. Start one of your own from {setup}.",
    review: AGENT_READ,
  },
  "pset.race.setUp": {
    text: "設定の画面",
    back: "the set-up",
    review: AGENT_READ,
  },
  "pset.race.otherSeat": {
    text: "もう1つの席",
    back: "The other seat",
    review: AGENT_READ,
  },
  "pset.race.sendLink": {
    text: "このリンクを、競う相手に送ってください。開いた人が、もう1つの席に着きます。",
    back: "Send this link to the person you are racing. Whoever opens it takes the other seat.",
    review: AGENT_READ,
  },
  "pset.race.message": {
    text: "{game}で競争しよう：{url}",
    back: "Race me at {game}: {url}",
    review: AGENT_READ,
  },
  "pset.race.starting": {
    text: "始めています…",
    back: "Starting…",
    review: AGENT_READ,
  },
  "pset.race.startClock": {
    text: "自分の時計を始める →",
    back: "Start my clock →",
    review: AGENT_READ,
  },
  "pset.race.refresh": {
    text: "更新",
    back: "Refresh",
    review: AGENT_READ,
  },
  "pset.race.clockRuns": {
    text: "時計は、「スタート」から、盤が正解になるまで、1回の挑戦のあいだ進みます。",
    back: "The clock runs from Start until your grid is right, in one sitting.",
    review: AGENT_READ,
  },
  "pset.race.noStart": {
    text: "時計を始められませんでした。",
    back: "The clock could not be started.",
    review: AGENT_READ,
  },
  "pset.race.noReach": {
    text: "サイトにつながりませんでした。",
    back: "The site could not be reached.",
    review: AGENT_READ,
  },
  "pset.race.noOffer": {
    text: "サイトが、競争を提案できませんでした。",
    back: "The site could not offer the race.",
    review: AGENT_READ,
  },
  "pset.race.offerNone": {
    text: "バディができたら、名前を選んで、そのバディに提案することもできます。バディは、その人のページから加えます。",
    back: "Or offer it to a buddy by name, once you have one: add them from their page.",
    review: AGENT_READ,
  },
  "pset.race.offerLabel": {
    text: "またはバディに提案する",
    back: "Or offer it to a buddy",
    review: AGENT_READ,
  },
  "pset.race.offering": {
    text: "提案しています…",
    back: "Offering…",
    review: AGENT_READ,
  },
  "pset.race.offerSeat": {
    text: "席を提案する",
    back: "Offer the seat",
    review: AGENT_READ,
  },
  "pset.race.offerInstead": {
    text: "代わりに提案する",
    back: "Offer it instead",
    review: AGENT_READ,
  },
  "pset.crumb.setUp": {
    text: "設定",
    back: "Set up",
    review: AGENT_READ,
  },
  "pset.crumb.play": {
    text: "遊ぶ",
    back: "Play",
    review: AGENT_READ,
  },
  "pset.sizes.shorter": {
    text: "← 短い方へ、{size}から",
    back: "← Shorter, from {size}",
    review: AGENT_READ,
  },
  "pset.sizes.longer": {
    text: "長い方へ、{size}まで →",
    back: "Longer, to {size} →",
    review: AGENT_READ,
  },
  "pset.words.settingsHeading": {
    text: "言語と単語リスト",
    back: "Languages and word lists",
    review: AGENT_READ,
  },
  "pset.words.settingsNote": {
    text: "設定の画面で選びます。それぞれに、今日の言葉、最速のタイム、記録があります。",
    back: "Chosen on the set-up. Each keeps its own words of the day, fastest times and record.",
    review: AGENT_READ,
  },
  "pset.words.daily": {
    text: "日替わり単語",
    back: "Daily words",
    review: AGENT_READ,
  },
  "pset.words.leaderboard": {
    text: "番付",
    back: "Leaderboard",
    review: AGENT_READ,
  },
  "pset.words.gridDrawn": {
    text: "盤の描き方",
    back: "How the grid is drawn",
    review: AGENT_READ,
  },
  "pset.board.pencil": {
    text: "{game}の盤、{size}×{size}",
    back: "{game} board, {size} by {size}",
    review: AGENT_READ,
  },
  "pset.sizes.room": {
    text: "長い方へ →",
    back: "Longer →",
    review: AGENT_READ,
  },
};
