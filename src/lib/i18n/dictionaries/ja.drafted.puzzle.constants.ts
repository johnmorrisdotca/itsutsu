import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the puzzle.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PUZZLE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "puzzle.clock.timeUp": {
    text: "時間切れです。",
    back: "Time is up.",
    review: AGENT_READ,
  },
  "puzzle.clock.tenSeconds": {
    text: "残り10秒です。",
    back: "Ten seconds left.",
    review: AGENT_READ,
  },
  "puzzle.clock.minutesLeft.one": {
    text: "残り1分です。",
    back: "One minute left.",
    review: AGENT_READ,
  },
  "puzzle.clock.minutesLeft.other": {
    text: "残り{count}分です。",
    back: "{count} minutes left.",
    review: AGENT_READ,
  },
  "puzzle.clock.countdown": {
    text: "{clock}のカウントダウン",
    back: "{clock} countdown",
    review: AGENT_READ,
  },
  "puzzle.outcome.won": {
    text: "勝ち",
    back: "Won",
    review: AGENT_READ,
  },
  "puzzle.outcome.found": {
    text: "発見",
    back: "Found",
    review: AGENT_READ,
  },
  "puzzle.outcome.solved": {
    text: "解決",
    back: "Solved",
    review: AGENT_READ,
  },
  "puzzle.outcome.outOfTime": {
    text: "時間切れ",
    back: "Out of time",
    review: AGENT_READ,
  },
  "puzzle.outcome.outOfSwaps": {
    text: "入れ替えの回数切れ",
    back: "Out of swaps",
    review: AGENT_READ,
  },
  "puzzle.outcome.outOfGuesses": {
    text: "予想の回数切れ",
    back: "Out of guesses",
    review: AGENT_READ,
  },
  "puzzle.outcome.givenUp": {
    text: "投了",
    back: "Given up",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.draw": {
    text: "めくる枚数",
    back: "Draw",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.freeCells": {
    text: "フリーセル",
    back: "Free cells",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.suits": {
    text: "マーク",
    back: "Suits",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.layout": {
    text: "配置",
    back: "Layout",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.length": {
    text: "長さ",
    back: "Length",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.hand": {
    text: "手札",
    back: "Hand",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.lattice": {
    text: "格子",
    back: "Lattice",
    review: AGENT_READ,
  },
  "puzzle.sizeLabel.size": {
    text: "サイズ",
    back: "Size",
    review: AGENT_READ,
  },
  "puzzle.level.number": {
    text: "レベル{number}",
    back: "Level {number}",
    review: AGENT_READ,
  },
  "puzzle.level.portal": {
    text: "ポータルのレベル{number}",
    back: "Portal level {number}",
    review: AGENT_READ,
  },
  "puzzle.level.big": {
    text: "大きい駒のレベル{number}",
    back: "Big-pieces level {number}",
    ask: "Drafted by the builder, not yet read by the Japanese reviewer or a person: is 大きい駒 the term for the big 2×2 pieces?",
  },
  "puzzle.level.next": {
    text: "レベル{next} →",
    back: "Level {next} →",
    review: AGENT_READ,
  },
  "puzzle.level.nextSkipping": {
    text: "レベル{next}（まだ終えていない最初のレベル） →",
    back: "Level {next}, the first one you have not finished →",
    review: AGENT_READ,
  },
  "puzzle.key.inWordTwice": {
    text: "単語に2回入っています",
    back: "in the word twice",
    review: AGENT_READ,
  },
  "puzzle.key.inWordTimes": {
    text: "単語に{count}回入っています",
    back: "in the word {count} times",
    review: AGENT_READ,
  },
  "puzzle.key.inRow": {
    text: "この行に{count}個あります",
    back: "{count} in the row",
    review: AGENT_READ,
  },
  "puzzle.help.headStart": {
    text: "先手",
    back: "Head start",
    review: AGENT_READ,
  },
  "puzzle.count.hint.one": {
    text: "ヒント{count}回",
    back: "{count} hint",
    review: AGENT_READ,
  },
  "puzzle.count.hint.other": {
    text: "ヒント{count}回",
    back: "{count} hints",
    review: AGENT_READ,
  },
  "puzzle.help.cheated": {
    text: "チートで線を引いた",
    back: "Cheat drew a line",
    review: AGENT_READ,
  },
  "puzzle.help.explosionsSoft": {
    text: "爆発をやわらげた",
    back: "explosions softened",
    review: AGENT_READ,
  },
  "puzzle.help.explosionsOff": {
    text: "爆発をなしにした",
    back: "explosions off",
    review: AGENT_READ,
  },
  "puzzle.help.guided": {
    text: "解き方の手順を見せた",
    back: "the solve's steps were shown",
    review: AGENT_READ,
  },
  "puzzle.help.helped": {
    text: "補助あり：{help}",
    back: "Helped: {help}",
    review: AGENT_READ,
  },
  "puzzle.mode.sakasa.blurb": {
    text: "単語を見つけてはいけません。その単語を打たずに、{rows}行すべてを埋めます。緑はそのまま、オレンジは使い直し、灰色は二度と打てません。",
    back: "Don't find the word: fill all {rows} rows without typing it. Every green stays, every orange is used again, and a grey is never typed twice.",
    review: AGENT_READ,
  },
  "puzzle.mode.sakasa.ruleLetter": {
    text: "「逆さ」は、どのレベルでも選べる遊び方で、Antiwordleのこのサイト版です。パズルを裏返し、単語は隠れたままですが、目標は、その単語を絶対に打たないことです。その単語を打たずにすべての行を埋めれば勝ちで、打ってしまえばゲームオーバーです。見つかった文字は、必ず使い直します。緑の文字は同じ場所に、オレンジの文字はどこかに使います。灰色の文字は、もう打てません。同じ単語も2回は打てません。そのため、1行ごとに、避けているただ1つの単語に近づいていきます。難しいほど長くなります。初級は、ふつうの上級の五文字と同じ行数、上級は盤全体の行数です。先手はなく、かなでも無料の灰色の単語はありません。通り抜けた行ごとに{row}点、すべて通り抜けるとさらに{through}点です。「逆さ」は、どの長さにも日替わりがあり、全員が同じ単語です。",
    back: "Sakasa 逆さ (the wrong way round), a choice at any level and our version of Antiwordle, turns the puzzle over: a word is hidden as ever, and the aim is never to type it. Fill every row without it and you have won; type it and the game is over. Every letter you uncover must be used again, a green in its place and an orange anywhere, a grey letter may never be typed again, and no word twice, so each row closes in on the one word you are avoiding. Harder is longer: easy asks for as many rows as an ordinary hard Gomoji gives, hard the whole board. There is no head start, and in kana no free grey word. Each row got through scores {row}, and getting through them all {through} more. There is a Sakasa of the day at every length, the same word for everybody.",
    review: AGENT_READ,
  },
  "puzzle.mode.sakasa.ruleKana": {
    text: "「逆さ」は、どのレベルでも選べる遊び方で、Antiwordleのこのサイト版です。パズルを裏返し、単語は隠れたままですが、目標は、その単語を絶対に打たないことです。その単語を打たずにすべての行を埋めれば勝ちで、打ってしまえばゲームオーバーです。見つかったかなは、必ず使い直します。緑のかなは同じ場所に、オレンジのかなはどこかに使います。灰色のかなは、もう打てません。同じ単語も2回は打てません。そのため、1行ごとに、避けているただ1つの単語に近づいていきます。難しいほど長くなります。初級は、ふつうの上級の五文字と同じ行数、上級は盤全体の行数です。先手はなく、無料の灰色の単語もありません。通り抜けた行ごとに{row}点、すべて通り抜けるとさらに{through}点です。「逆さ」は、どの長さにも日替わりがあり、全員が同じ単語です。",
    back: "Sakasa 逆さ (the wrong way round), a choice at any level and our version of Antiwordle, turns the puzzle over: a word is hidden as ever, and the aim is never to type it. Fill every row without it and you have won; type it and the game is over. Every kana you uncover must be used again, a green in its place and an orange anywhere, a grey kana may never be typed again, and no word twice, so each row closes in on the one word you are avoiding. Harder is longer: easy asks for as many rows as an ordinary hard Gomoji gives, hard the whole board. There is no head start, and in kana no free grey word. Each row got through scores {row}, and getting through them all {through} more. There is a Sakasa of the day at every length, the same word for everybody.",
    review: AGENT_READ,
  },
  "puzzle.mode.nige.blurb": {
    text: "単語はまだ隠れていません。予想のたびに、残る単語がいちばん多くなる色が返され、ほかに何も残らなくなったときに、見つかったことになります。予想は{rows}回です。",
    back: "No word is hidden yet: each guess gets the colours that leave the most words, and it is found only when nothing else is left. {rows} guesses.",
    review: AGENT_READ,
  },
  "puzzle.mode.nige.ruleLetter": {
    text: "「逃げ」は、どのレベルでも選べる遊び方で、Absurdleのこのサイト版です。隠れた単語はありません。予想のたびに、残りの単語がいちばん多く残る色が返され、すでに出た色を取り消すことはありません。予想した単語が、残った1語になったときに、見つかったことになります。どのレベルでも盤のすべての行が使え、難しさは、レベルの単語リストで決まります。先手はなく、かなでも無料の灰色の単語はありません。盤の下の行は、まだいくつの単語のなかに隠れられるかを表し、行が尽きると、そのうちの1語を教えます。「逃げ」にも、どの長さにも日替わりがあり、全員が同じです。文字と色はいつもどおりです。",
    back: "Nige 逃げ (running away), a choice at any level and our version of Absurdle, hides no word at all: every guess is answered with the colours that leave the most words still possible, never going back on a colour already shown, and the word is found only when your guess is the one word left. It gives every row of the board at every level, the level's word list being its difficulty; there is no head start, and in kana no free grey word. The line under the board says how many words it still has to hide among, and when the rows run out it names one of them. There is a Nige of the day at every length as well, the same for everybody, the letters and the colours the same as ever.",
    review: AGENT_READ,
  },
  "puzzle.mode.nige.ruleKana": {
    text: "「逃げ」は、どのレベルでも選べる遊び方で、Absurdleのこのサイト版です。隠れた単語はありません。予想のたびに、残りの単語がいちばん多く残る色が返され、すでに出た色を取り消すことはありません。予想した単語が、残った1語になったときに、見つかったことになります。どのレベルでも盤のすべての行が使え、難しさは、レベルの単語リストで決まります。先手はなく、無料の灰色の単語もありません。盤の下の行は、まだいくつの単語のなかに隠れられるかを表し、行が尽きると、そのうちの1語を教えます。「逃げ」にも、どの長さにも日替わりがあり、全員が同じです。かなと色はいつもどおりです。",
    back: "Nige 逃げ (running away), a choice at any level and our version of Absurdle, hides no word at all: every guess is answered with the colours that leave the most words still possible, never going back on a colour already shown, and the word is found only when your guess is the one word left. It gives every row of the board at every level, the level's word list being its difficulty; there is no head start, and in kana no free grey word. The line under the board says how many words it still has to hide among, and when the rows run out it names one of them. There is a Nige of the day at every length as well, the same for everybody, the kana and the colours the same as ever.",
    review: AGENT_READ,
  },
  "puzzle.mode.futago.ruleLetter": {
    text: "「双子」は、どのレベルでも選べる遊び方で、2つの単語を同時に隠し、1つの盤に並べます。予想は、単語が見つかるまで、両方の単語に送られます。キーは2つに分かれ、両方の盤の色を表します。予想は、単語が1つのときより1回多くなります。どの長さにも、日替わりの単語が2つあります。",
    back: "Futago 双子 (twins), a choice at any level, hides two words at once, side by side on one board: every guess goes to both words until a word is found, each key is split to show both boards' colours, and there is one guess more than for one word. There are two words of the day at every length as well.",
    review: AGENT_READ,
  },
  "puzzle.mode.futago.ruleKana": {
    text: "「双子」は、どのレベルでも選べる遊び方で、2つのかなの単語を同時に隠し、1つの盤に並べます。無料の灰色の単語は、両方の単語に対して灰色です。予想は、単語が見つかるまで、両方の単語に送られ、かなのキーは2つに分かれて、両方の盤の色を表します。予想は、単語が1つのときより1回多くなります。どの長さにも、日替わりの単語が2つあります。",
    back: "Futago 双子 (twins), a choice at any level, hides two kana words at once, side by side on one board, the free grey word grey against both: every guess goes to both words until a word is found, each kana key is split to show both boards' colours, and there is one guess more than for one word. There are two words of the day at every length as well.",
    review: AGENT_READ,
  },
  "puzzle.mode.yotsugo.ruleLetter": {
    text: "「四つ子」は、どのレベルでも選べる遊び方で、4つの単語を同時に隠し、2つの盤の4つの区画に分けて並べます。予想は、その単語が見つかるまで、すべての区画に送られます。キーは4つの角に分かれ、各区画の色を表します。予想は、単語が1つのときより3回多くなり、どの長さでも上級で9回です。",
    back: "Yotsugo 四つ子 (quadruplets), a choice at any level, hides four words at once, in the four quarters of two boards: every guess goes to every quarter until its word is found, each key is split in four corners to show each quarter's colour, and there are three guesses more than for one word — nine at hard at every length.",
    review: AGENT_READ,
  },
  "puzzle.mode.yotsugo.ruleKana": {
    text: "「四つ子」は、どのレベルでも選べる遊び方で、4つのかなの単語を同時に隠し、2つの盤の4つの区画に分けて並べます。無料の灰色の単語は、4つすべてに対して灰色です。予想は、その単語が見つかるまで、すべての区画に送られ、かなのキーは4つの角に分かれて、各区画の色を表します。予想は、単語が1つのときより3回多くなります。",
    back: "Yotsugo 四つ子 (quadruplets), a choice at any level, hides four kana words at once, in the four quarters of two boards, the free grey word grey against all four: every guess goes to every quarter until its word is found, each kana key is split in four corners to show each quarter's colour, and there are three guesses more than for one word.",
    review: AGENT_READ,
  },
  "puzzle.size.short": {
    text: "短",
    back: "Short",
    review: AGENT_READ,
  },
  "puzzle.size.medium": {
    text: "中",
    back: "Medium",
    review: AGENT_READ,
  },
  "puzzle.size.long": {
    text: "長",
    back: "Long",
    review: AGENT_READ,
  },
  "puzzle.size.small": {
    text: "小",
    back: "Small",
    review: AGENT_READ,
  },
  "puzzle.size.large": {
    text: "大",
    back: "Large",
    review: AGENT_READ,
  },
  "puzzle.size.huge": {
    text: "巨大",
    back: "Huge",
    review: AGENT_READ,
  },
  "puzzle.size.colossal": {
    text: "超巨大",
    back: "Colossal",
    review: AGENT_READ,
  },
  "puzzle.size.cube": {
    text: "立方体",
    back: "Cube",
    review: AGENT_READ,
  },
  "puzzle.size.sphere": {
    text: "球",
    back: "Sphere",
    review: AGENT_READ,
  },
  "puzzle.size.octahedron": {
    text: "八面体",
    back: "Octahedron",
    review: AGENT_READ,
  },
  "puzzle.size.icosahedron": {
    text: "二十面体",
    back: "Icosahedron",
    review: AGENT_READ,
  },
  "puzzle.size.solid": {
    text: "{solid}（{step}サイズ）",
    back: "{step} {solid}",
    review: AGENT_READ,
  },
  "puzzle.size.colossalTall": {
    text: "超巨大の縦長 {width}×{height}",
    back: "Colossal tall {width}×{height}",
    review: AGENT_READ,
  },
  "puzzle.size.tall": {
    text: "縦長 {width}×{height}",
    back: "Tall {width}×{height}",
    review: AGENT_READ,
  },
  "puzzle.size.inWords": {
    text: "{size}サイズ",
    back: "{size} size",
    review: AGENT_READ,
  },
  "puzzle.size.inWordsSolid": {
    text: "{size}の盤",
    back: "the {size}",
    review: AGENT_READ,
  },
  "puzzle.rules.sizes": {
    text: "サイズ",
    back: "Sizes",
    review: AGENT_READ,
  },
  "puzzle.rules.boardsYouMake": {
    text: "作れる盤",
    back: "Boards you make",
    review: AGENT_READ,
  },
  "puzzle.rules.proofSuido": {
    text: "どのレベルも盤も、答えはちょうど1つです。レベルは1度作られ、元のパッケージが、ビルドのたびにすべてもう一度確かめます。自分で作った盤も、見る前に同じように確かめられます。そのため、答えが2つある盤や、1つもない盤はありません。",
    back: "Every level and every board has exactly one answer. The levels were made once, and the package they come from proves every one of them again each time it is built; a board you make is checked in the same way before you see it. So there is never a board with two answers or none.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofTobiishi": {
    text: "どのレベルにも、少なくとも1つの答えがあります。ゴールから1回ずつ逆向きに跳んで作ってあり、元のパッケージが、ビルドのたびに、すべてのレベルでその答えをもう一度再現して確かめます。そのため、解けないレベルはありません。答えが複数あることもあり、どれでも解けたことになります。",
    back: "Every level has at least one answer: each was made by working backward from its goal, one jump at a time, and the package they come from replays that answer on every level each time it is built. So there is never a level with no way through. A level may have more than one, and any of them solves it.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofMeikyuu": {
    text: "どの迷路も、抜け道はちょうど1つです。通路は、どの2つの場所のあいだにも道が1本だけになるように掘られ、元のパッケージが、ビルドのたびにすべてのレベルでもう一度確かめます。そのため、抜け道が2つある迷路や、1つもない迷路はありません。",
    back: "Every maze has exactly one way through: the passages are carved so that there is one path between any two places, and the package they come from proves it again for every level each time it is built. So there is never a maze with two ways through, or none.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofLevels": {
    text: "どのレベルも、答えはちょうど1つです。レベルを作るときにこのサイトの解析プログラムが確かめ、サイトをビルドするたびにもう一度確かめるので、答えが2つある盤や、1つもない盤はありません。",
    back: "Every level has exactly one answer. The site's own solver proved it when the levels were made, and proves it again every time the site is built, so there is never a board with two answers or none.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofDeal": {
    text: "どの配りも勝てます。配ったブラウザが、最後のカードまで遊び切って確かめてあり、確かめていない配りは配りません。",
    back: "Every deal can be won: the browser that deals it has already played it out to the last card, and deals none it has not.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofWinnable": {
    text: "「勝てる配り」は、必ず勝てます。配ったブラウザが最後のカードまで遊び切って確かめてあり、確かめた配りだけを「勝てる」と呼びます。「どの配りでも」は、シャッフルしたままで、勝てないものもあります。",
    back: "Every winnable deal can be won: the browser that deals it has already played it out to the last card, and a deal is only called winnable once it has. Any deal is the shuffle as it falls, and some of those cannot be won.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofCube": {
    text: "どのシャッフルも解けます。そろったキューブを回して作るので、来た道を戻れば必ず解けます。ほかの方法で、すべての面を1色にそろえても、解けたことになります。",
    back: "Every scramble can be solved: it is made by turning a solved cube, so turning back the way it came always solves it, and any other way to every face one colour counts as well.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofLayout": {
    text: "どの配りも、取り切れます。配ったブラウザが、先に牌を2枚ずつ逆の順に並べるので、その順で取り切れます。ほかの順で取り切っても、取り切ったことになります。",
    back: "Every deal can be cleared: the browser that deals it lays the tiles out pair by pair in reverse first, so the order it laid them in clears it, and any other order that clears it counts as well.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofTiles": {
    text: "どの袋も、使い切れます。配ったブラウザが、先にタイルを1つのクロスワードとして並べるので、ほかの並べ方のクロスワードでも、使い切ったことになります。",
    back: "Every bag can be finished: the browser that deals it lays its tiles out as one crossword first, and any other crossword of the same tiles counts as well.",
    review: AGENT_READ,
  },
  "puzzle.rules.proofGrid": {
    text: "どのパズルも、答えはちょうど1つです。作ったブラウザが、見る前に確かめるので、答えが2つある盤や、1つもない盤はありません。",
    back: "Every puzzle has exactly one answer. The browser that makes it checks that before you see it, so there is never a grid with two answers or none.",
    review: AGENT_READ,
  },
  "puzzle.rules.levelsLine": {
    text: "レベル：{list}。",
    back: "Levels: {list}.",
    review: AGENT_READ,
  },
  "puzzle.rules.madeLevelsLine": {
    text: "自分で作る盤のレベル：{list}。",
    back: "A board you make, at a level: {list}.",
    review: AGENT_READ,
  },
  "puzzle.rules.aloneGame": {
    text: "1人で、自分のブラウザで遊びます。配りのシャッフルも手の確認も、そこで行い、最後のカードが組札に上がるまで、何もどこにも送られません。",
    back: "A game is for one person, in your own browser: the deal is shuffled and every move is checked there, and nothing is sent anywhere until the last card is home.",
    review: AGENT_READ,
  },
  "puzzle.rules.aloneSolve": {
    text: "解くのは1人で、1回の席で、自分のブラウザで行います。パズルについて、終わるまで何もどこにも送られません。",
    back: "Solving is for one person, in one sitting, in your own browser: nothing about a puzzle is sent anywhere until it is done.",
    review: AGENT_READ,
  },
  "puzzle.rules.paidCube": {
    text: "そろったキューブは、サイトがシャッフルから1手ずつ確かめ、会員には経験値が入ります。1回のシャッフルにつき1回です。",
    back: "A solved cube is checked by the site, turn by turn from the scramble, and a member is paid XP for it, once per scramble.",
    review: AGENT_READ,
  },
  "puzzle.rules.paidCards": {
    text: "勝ったゲームは、サイトが配りから1手ずつ確かめ、会員には経験値が入ります。1回の配りにつき1回です。",
    back: "A won game is checked by the site, move by move from the deal, and a member is paid XP for it, once per deal.",
    review: AGENT_READ,
  },
  "puzzle.rules.paidGrid": {
    text: "終わったパズルは、サイトが上のすべての決まりに照らして確かめ、正しい盤には、会員に経験値が入ります。1つの盤につき1回です。",
    back: "A finished puzzle is checked by the site against every rule above, and a member is paid XP for a grid that is right, once per grid.",
    review: AGENT_READ,
  },
  "puzzle.rules.keptSuido": {
    text: "途中まで回したレベルや盤は、会員のために保存され、「対局中」で待っています。部品も時計も、そのままです。解いたレベルは、アカウントに保存され、アカウントがなければこのブラウザに保存されます。",
    back: "A level or a board left half turned is kept for a member and waits in My games, pieces and clock as they were. The levels you have solved are kept on your account, or in this browser without one.",
    review: AGENT_READ,
  },
  "puzzle.rules.keptLevels": {
    text: "途中まで引いたレベルは、会員のために保存され、「対局中」で待っています。線も時計も、そのままです。解いたレベルは、アカウントに保存され、アカウントがなければこのブラウザに保存されます。",
    back: "A level left half drawn is kept for a member and waits in My games, lines and clock as they were. The levels you have solved are kept on your account, or in this browser without one.",
    review: AGENT_READ,
  },
  "puzzle.rules.keptPuzzle": {
    text: "途中までのパズルは、会員のために保存され、「対局中」で、時計も含めて、そのままの状態で待っています。アカウントがなければ何も保存されません。同じアドレスを開くと同じパズルが出て、時計は最初からになります。",
    back: "A puzzle left half done is kept for a member and waits in My games, as it was left, clock and all. Without an account nothing is kept: the same address brings back the same puzzle, and its clock starts again.",
    review: AGENT_READ,
  },
  "puzzle.rules.notRated": {
    text: "レーティングはなく、誰かに勝つことも負けることもなく、順位表に解いた回数が数えられることもありません。パズルは、カタログのゲームのひとつで、2人で戦う対局ではありません。",
    back: "Nothing is rated, nobody is beaten and no ladder counts a solve. A puzzle is a game in the catalogue and not a game between two players.",
    review: AGENT_READ,
  },
  "puzzle.rules.tilesInHand": {
    text: "手札{count}枚",
    back: "{count} tiles in hand",
    review: AGENT_READ,
  },
  "puzzle.rules.layoutSize": {
    text: "{name}（{count}枚）",
    back: "{name} ({count} tiles)",
    review: AGENT_READ,
  },
  "puzzle.count.jump.one": {
    text: "{count}回の跳び",
    back: "{count} jump",
    review: AGENT_READ,
  },
  "puzzle.count.jump.other": {
    text: "{count}回の跳び",
    back: "{count} jumps",
    review: AGENT_READ,
  },
  "puzzle.count.letter.one": {
    text: "{count}文字",
    back: "{count} letter",
    review: AGENT_READ,
  },
  "puzzle.count.letter.other": {
    text: "{count}文字",
    back: "{count} letters",
    review: AGENT_READ,
  },
  "puzzle.count.kana.one": {
    text: "{count}文字",
    back: "{count} kana",
    review: AGENT_READ,
  },
  "puzzle.count.kana.other": {
    text: "{count}文字",
    back: "{count} kana",
    review: AGENT_READ,
  },
  "puzzle.count.tile.one": {
    text: "{count}枚",
    back: "{count} tile",
    review: AGENT_READ,
  },
  "puzzle.count.tile.other": {
    text: "{count}枚",
    back: "{count} tiles",
    review: AGENT_READ,
  },
  "puzzle.count.word.one": {
    text: "{count}語",
    back: "{count} word",
    review: AGENT_READ,
  },
  "puzzle.count.word.other": {
    text: "{count}語",
    back: "{count} words",
    review: AGENT_READ,
  },
  "puzzle.size.across": {
    text: "横{count}枚",
    back: "{count} across",
    review: AGENT_READ,
  },
  "puzzle.solve.timeTaken": {
    text: "経過時間",
    back: "time taken",
    review: AGENT_READ,
  },
  "puzzle.solve.pause": {
    text: "一時停止",
    back: "Pause",
    review: AGENT_READ,
  },
  "puzzle.solve.resume": {
    text: "再開",
    back: "Resume",
    review: AGENT_READ,
  },
  "puzzle.solve.paused": {
    text: "一時停止中",
    back: "Paused",
    review: AGENT_READ,
  },
  "puzzle.solve.pausedWords": {
    text: "時計は止まり、戻ってくるまで盤は隠れています。",
    back: "The clock has stopped, and the grid is covered until you come back.",
    review: AGENT_READ,
  },
  "puzzle.solve.timeLeft": {
    text: "{clock}の残り時間",
    back: "time left on the {clock}",
    review: AGENT_READ,
  },
  "puzzle.solve.hint": {
    text: "ヒント",
    back: "Hint",
    review: AGENT_READ,
  },
  "puzzle.solve.hintUsed": {
    text: "ヒント · {count}回使用",
    back: "Hint · {count} used",
    review: AGENT_READ,
  },
  "puzzle.solve.hintNoRace": {
    text: "競走ではヒントは使えません",
    back: "No hints in a race",
    review: AGENT_READ,
  },
  "puzzle.solve.hintChosenAtSetUp": {
    text: "ヒントは、パズルの設定で選びます",
    back: "Hints are chosen when the puzzle is set up",
    review: AGENT_READ,
  },
  "puzzle.solve.show": {
    text: "表示",
    back: "Show",
    review: AGENT_READ,
  },
  "puzzle.solve.showSpent": {
    text: "チェックが残っていません。表示は、チェックの回数から使います",
    back: "No checks left: Show is paid for from the checks",
    review: AGENT_READ,
  },
  "puzzle.solve.showWords": {
    text: "まちがっているマスに印をつけます",
    back: "Mark the cells that are wrong",
    review: AGENT_READ,
  },
  "puzzle.solve.check": {
    text: "チェック",
    back: "Check",
    review: AGENT_READ,
  },
  "puzzle.solve.checkLeft": {
    text: "チェック · 残り{count}回",
    back: "Check · {count} left",
    review: AGENT_READ,
  },
  "puzzle.solve.noChecks": {
    text: "チェックは残っていません",
    back: "No checks left",
    review: AGENT_READ,
  },
  "puzzle.way.gamePage": {
    text: "{name}のページ",
    back: "{name}'s page",
    review: AGENT_READ,
  },
  "puzzle.way.family": {
    text: "同族",
    back: "Family",
    review: AGENT_READ,
  },
  "puzzle.done.inMoves.one": {
    text: "、{count}手",
    back: ", in {count} move",
    review: AGENT_READ,
  },
  "puzzle.done.inMoves.other": {
    text: "、{count}手",
    back: ", in {count} moves",
    review: AGENT_READ,
  },
  "puzzle.done.givenUpTail": {
    text: "：{time}経過{moves}。",
    back: " after {time}{moves}.",
    review: AGENT_READ,
  },
  "puzzle.done.wonTail": {
    text: "：所要{time}{moves}。",
    back: " in {time}{moves}.",
    review: AGENT_READ,
  },
  "puzzle.done.outOfTimeTail": {
    text: "：{clock}が{time}から尽きて、解けませんでした。",
    back: ": the {clock} ran down from {time} before it was solved.",
    review: AGENT_READ,
  },
  "puzzle.done.solvedTail": {
    text: "：所要{time}{moves}{onClock}。",
    back: " in {time}{moves}{onClock}.",
    review: AGENT_READ,
  },
  "puzzle.done.onClock": {
    text: "、{clock}で",
    back: ", on the {clock}",
    review: AGENT_READ,
  },
  "puzzle.done.resultGivenUp": {
    text: "投了：{time}{moves}",
    back: "Given up after {time}{moves}",
    review: AGENT_READ,
  },
  "puzzle.done.resultWon": {
    text: "勝ち：{time}{moves}",
    back: "Won in {time}{moves}",
    review: AGENT_READ,
  },
  "puzzle.done.resultSolved": {
    text: "解決：{time}",
    back: "Solved in {time}",
    review: AGENT_READ,
  },
  "puzzle.done.joinToBePaid": {
    text: "経験値が入るのは会員だけです。会員になると、次の解答から数えられます。",
    back: "A member is paid XP for a solve. Join, and the next one counts.",
    review: AGENT_READ,
  },
  "puzzle.done.paid": {
    text: "+{points}経験値：{awards}。",
    back: "+{points} XP, for {awards}.",
    review: AGENT_READ,
  },
  "puzzle.done.alreadyPaid": {
    text: "このパズルはすでに経験値が入っているか、その日の上限に達しました。解答は有効です。",
    back: "Already paid for this puzzle, or the day's allowance is spent — the solve still stands.",
    review: AGENT_READ,
  },
  "puzzle.done.recording": {
    text: "解答を記録しています…",
    back: "Recording your solve…",
    review: AGENT_READ,
  },
  "puzzle.done.unsolvedGuest": {
    text: "解けないまま終わりました。会員なら保存され、最後まで遊んだことで少し経験値が入ります。",
    back: "It ends unsolved. A member's is kept, and paid a little for playing it out.",
    review: AGENT_READ,
  },
  "puzzle.done.unsolvedPaid": {
    text: "解けないまま終わりました：最後まで遊んで+{points}経験値。",
    back: "It ends unsolved: +{points} XP for playing it out.",
    review: AGENT_READ,
  },
  "puzzle.done.unsolved": {
    text: "解けないまま終わりました。",
    back: "It ends unsolved.",
    review: AGENT_READ,
  },
  "puzzle.done.unsolvedKeeping": {
    text: "解けないまま終わりました。保存しています…",
    back: "It ends unsolved. Keeping it…",
    review: AGENT_READ,
  },
  "puzzle.done.keptBefore": {
    text: "終わったパズルといっしょに、状態そのままで",
    back: "Kept in",
    review: AGENT_READ,
  },
  "puzzle.done.keptLink": {
    text: "対局中",
    back: "My games",
    review: AGENT_READ,
  },
  "puzzle.done.keptAfter": {
    text: "に保存されています。",
    back: "as it stood, with your finished puzzles.",
    review: AGENT_READ,
  },
  "puzzle.done.helpedCounts": {
    text: "{says}。解けたものとして数えられますが、点は入らず、最速の表にも載りません。",
    back: "{says}. It counts as solved, but scores no points and is not on the fastest table.",
    review: AGENT_READ,
  },
  "puzzle.done.helpedNoBlock": {
    text: "{says}。解けたものとして数えられますが、点は入らず、最速の表にも載らず、次のブロックも開きません。開くには、爆発ありで解いてください。",
    back: "{says}. It counts as solved, but scores no points and is not on the fastest table, and it does not open the next block: solve it with its explosions on for that.",
    review: AGENT_READ,
  },
  "puzzle.done.handedIn": {
    text: "提出しました。上の競走に、いまの状況が出ています。",
    back: "Handed in. The race above says how it stands.",
    review: AGENT_READ,
  },
  "puzzle.done.dealAgain": {
    text: "もう一度配る →",
    back: "Deal again →",
    review: AGENT_READ,
  },
  "puzzle.done.another": {
    text: "別の{name} →",
    back: "Another {name} →",
    review: AGENT_READ,
  },
  "puzzle.done.changeDraw": {
    text: "めくる枚数と回数を変える",
    back: "Change the draw or passes",
    review: AGENT_READ,
  },
  "puzzle.done.changeSize": {
    text: "サイズかレベルを変える",
    back: "Change the size or level",
    review: AGENT_READ,
  },
  "puzzle.done.seeHowFar": {
    text: "どこまで進んだかを見る",
    back: "See how far it got",
    review: AGENT_READ,
  },
  "puzzle.done.seeGame": {
    text: "このゲームを見る",
    back: "See this game",
    review: AGENT_READ,
  },
  "puzzle.done.replay": {
    text: "この解答をもう一度見る",
    back: "Replay this solve",
    review: AGENT_READ,
  },
  "puzzle.award.puzzleSolved": {
    text: "解答",
    back: "the solve",
    review: AGENT_READ,
  },
  "puzzle.award.puzzleEnded": {
    text: "最後まで遊んだこと",
    back: "playing it out",
    review: AGENT_READ,
  },
  "puzzle.award.firstOfVariant": {
    text: "このパズルの初めての解答",
    back: "your first of this puzzle",
    review: AGENT_READ,
  },
  "puzzle.award.firstOfFamily": {
    text: "初めてのパズル",
    back: "your first puzzle at all",
    review: AGENT_READ,
  },
  "puzzle.award.everyVariantPlayed": {
    text: "サイトのすべてのゲームを遊んだこと",
    back: "every game on the site played",
    review: AGENT_READ,
  },
  "puzzle.award.everyFamilyPlayed": {
    text: "すべての系統に出会ったこと",
    back: "every family met",
    review: AGENT_READ,
  },
  "puzzle.award.raceWon": {
    text: "競走に勝ったこと",
    back: "winning the race",
    review: AGENT_READ,
  },
  "puzzle.solve.queued": {
    text: "オフラインなので、この解答はこの端末に保存され、オンラインに戻ったときに提出されます。",
    back: "You're offline, so this is kept on this device and handed in when you're back online.",
    review: AGENT_READ,
  },
  "puzzle.solve.couldNotRecord": {
    text: "サイトは、その解答を記録できませんでした。",
    back: "The site could not record that solve.",
    review: AGENT_READ,
  },
  "puzzle.solve.couldNotReach": {
    text: "サイトにつながらず、その解答を記録できませんでした。",
    back: "The site could not be reached to record that solve.",
    review: AGENT_READ,
  },
  "puzzle.solve.couldNotKeep": {
    text: "サイトは、それを保存できませんでした。",
    back: "The site could not keep it.",
    review: AGENT_READ,
  },
  "puzzle.count.point.one": {
    text: "{count}点",
    back: "{count} point",
    review: AGENT_READ,
  },
  "puzzle.count.point.other": {
    text: "{count}点",
    back: "{count} points",
    review: AGENT_READ,
  },
  "puzzle.count.puzzle.one": {
    text: "{count}問",
    back: "{count} puzzle",
    review: AGENT_READ,
  },
  "puzzle.count.puzzle.other": {
    text: "{count}問",
    back: "{count} puzzles",
    review: AGENT_READ,
  },
  "puzzle.count.check.one": {
    text: "チェック{count}回",
    back: "{count} check",
    review: AGENT_READ,
  },
  "puzzle.count.check.other": {
    text: "チェック{count}回",
    back: "{count} checks",
    review: AGENT_READ,
  },
  "puzzle.press.undo": {
    text: "元に戻す",
    back: "Undo",
    review: AGENT_READ,
  },
  "puzzle.press.restart": {
    text: "最初からやり直す",
    back: "Start over",
    review: AGENT_READ,
  },
  "puzzle.press.cheat": {
    text: "ズル",
    back: "Cheat",
    review: AGENT_READ,
  },
  "puzzle.press.fit": {
    text: "全体表示",
    back: "Show the whole",
    review: AGENT_READ,
  },
  "puzzle.press.playAgain": {
    text: "もう一度遊ぶ",
    back: "Play it again",
    review: AGENT_READ,
  },
  "puzzle.press.solved": {
    text: "解決済みです。",
    back: "Solved.",
    review: AGENT_READ,
  },
  "puzzle.press.solvedBest": {
    text: "解決済みです。ベストは{time}です。",
    back: "Solved, best {time}.",
    review: AGENT_READ,
  },
  "puzzle.replay.back": {
    text: "1手戻る",
    back: "One move back",
    review: AGENT_READ,
  },
  "puzzle.replay.move": {
    text: "手",
    back: "Move",
    review: AGENT_READ,
  },
  "puzzle.replay.on": {
    text: "1手進む",
    back: "One move on",
    review: AGENT_READ,
  },
  "puzzle.replay.deal": {
    text: "配り",
    back: "The deal",
    review: AGENT_READ,
  },
};
