import type { JaOverlay } from "../copyTable";

import type { CASUAL_COPY } from "@/components/casual/casual.constants";
import type { DICE_WAR_COPY } from "@/components/party/diceWar/diceWar.constants";
import type { GUNJIN_COPY, GUNJIN_PLACING_RULES, GUNJIN_SIDES } from "@/components/party/gunjin/gunjin.constants";
import type { HITOTSU_COPY, HITOTSU_HOUSE_COPY } from "@/components/party/hitotsu/hitotsu.constants";
import type { PACHISI_COPY } from "@/components/party/pachisi/pachisi.constants";
import type { SUGOROKU_COPY } from "@/components/party/sugoroku/sugoroku.constants";
import type { TENKA_COPY, TENKA_NEUTRAL_MARBLE, TENKA_REGION_NAMES } from "@/components/party/tenka/tenka.constants";
import type { YACHT_BOX_WORDS, YACHT_COPY } from "@/components/party/yacht/yacht.constants";
import type { GUNJIN_BOARDS } from "@/lib/party/gunjin/gunjin.constants";
import type { SUGOROKU_STRENGTH_LINES, SUGOROKU_STRENGTH_NAMES } from "@/lib/party/sugoroku/sugoroku.constants";

/**
 * The words of the games' own tables in Japanese: Hitotsu's, Yacht's, the
 * backgammon games', Dice War's, Pachisi's, Gunjin's, Tenka's and the casual
 * games', overlays (`copyTable.ts`) of the English tables beside the
 * components that draw them. See `party.ja.screens.constants.ts` for how a
 * line is written. Where an English line is built by arithmetic on its
 * arguments (a seat's number, a count compared with another), the words are
 * a phrase instead (`party.*`, `ptenka.*`), and the table keeps none of them.
 */

const IDLE_DETAIL = [
  "この卓では、2〜3分、何も動いていません。ここに時計はなく、ゲームはただ待っています。",
  "Nothing has moved at this table for a couple of minutes. There is no clock here, and the game simply waits.",
] as const;
const IDLE_KEPT = [
  "このゲームは、このブラウザーに保存されています。戻ってきたとき、ここにあります。",
  "This game is saved in this browser. It will be here when you come back.",
] as const;
const KEPT = ["このブラウザーに保存されています。離れて戻ってきても、ここにあります。", "Saved in this browser: leave and come back, and it is here."] as const;
const ONE_PERSON = ["どの卓にも、人が必要です。少なくとも1つの席は自分の席にしてください。", "Every table needs a person: at least one seat has to be yours."] as const;
const HOW_MANY = ["何人で遊びますか？", "How many are playing?"] as const;
const AGAIN = ["同じ卓でもう一度", "Play again, same table"] as const;
const PLAY = ["遊ぶ →", "Play →"] as const;

export const HITOTSU_HOUSE_COPY_JA = {
  stacking: {
    legend: ["ドロー札の積み重ね", "Stacking draw cards"],
    names: { off: ["オフ", "Off"], same: ["同じ札", "Same card"], any: ["どのドロー札でも", "Any draw card"] },
    lines: {
      off: ["ドロー札は、すぐに引きます。", "A draw card is taken at once."],
      same: ["+2に+2、+4に+4。次の人が合計を引きます。", "+2 on +2, +4 on +4: the next person takes the total."],
      any: ["積み重ね式：どのドロー札にも、どのドロー札でも出せます。", "Progressive: any draw card on any."],
    },
  },
  jumpIn: {
    legend: ["割り込み", "Jump-in"],
    on: ["まったく同じ札を、順番を待たずに出せます。", "Play an identical card out of turn."],
    off: ["順番以外では、誰も出しません。", "Nobody plays out of turn."],
    people: ["1人とコンピュータで遊ぶときに使えます。", "Played with one person and computers."],
  },
  sevenZero: {
    legend: ["7と0", "Sevens and zeros"],
    on: ["7は手札を交換し、0は全員の手札を回します。", "A 7 swaps hands, and a 0 passes every hand on."],
    off: ["7と0は、ふつうの数字です。", "Sevens and zeros are plain numbers."],
  },
  drawToMatch: {
    legend: ["引き方", "Drawing"],
    on: ["出せる札が出るまで引きます。", "Draw until a card goes."],
    off: ["1枚引きます。", "Draw one card."],
  },
  wildFour: {
    legend: ["ワイルドドローフォー", "Wild Draw Four"],
    names: { challenge: ["チャレンジできる", "May be challenged"], strict: ["ブラフなし", "No bluffing"] },
    lines: {
      challenge: ["いつでも出せ、次の人はチャレンジできます。", "Play it any time, and the next person may challenge."],
      strict: ["場の色の札がないときだけ。チャレンジはありません。", "Only with nothing of the colour on top, and no challenge."],
    },
  },
} as const satisfies JaOverlay<typeof HITOTSU_HOUSE_COPY>;

export const HITOTSU_COPY_JA = {
  lead: [
    "2〜8人で1台のスマホやタブレットを囲んで遊ぶ、一つです。どの席にもコンピュータを座らせられます。または「複数の端末」を選ぶと、全員が自分の端末で遊べます。色か数字を合わせて出し、残り1枚になったら「一つ！」と言います。ここでは評価されません。",
    "Hitotsu for two to eight round one phone or tablet, with a computer in any seat, or choose \"Several devices\" and everybody plays on their own device. Match the colour or the number, and call \"Hitotsu!\" with one card left. Nothing here is rated.",
  ],
  mode: ["どのゲームにしますか？", "Which game?"],
  classic: ["クラシック", "Classic"],
  classicLine: ["1人7枚、500点まで。公式のルールです。", "Seven cards each, to 500, the published rules."],
  party: ["パーティー", "Party"],
  partyLine: ["1人5枚、1ハンドで、パーティールールがすべてオンです。", "Five cards each, one hand, with the party rules on."],
  howMany: HOW_MANY,
  length: ["どのくらいの長さにしますか？", "How long?"],
  oneHand: ["1ハンド", "One hand"],
  to: ["{0}点まで", "To {0}"],
  seats: ["席の割り当て", "Who sits where"],
  house: ["ハウスルール", "House rules"],
  on: ["オン", "On"],
  off: ["オフ", "Off"],
  start: ["はじめる", "Start"],
  computer: ["コンピュータ", "Computer"],
  onePerson: ONE_PERSON,
  kept: KEPT,
  yourHand: ["自分の手札", "Your hand"],
  handOf: ["{0}の手札", "{0}'s hand"],
  passTo: ["{0}さんに端末を渡してください", "Pass the device to {0}"],
  passNote: ["その人が受け取るまで、誰の札も表示されません。", "Nobody's cards are shown until they have it."],
  ready: ["{0}です。自分の札を表示", "I am {0}: show my cards"],
  thinking: ["{0}が考えています…", "{0} is thinking…"],
  toPlay: ["{0}の番です", "{0} to play"],
  follow: ["{0}に合わせます", "match {0}"],
  round: {
    by: 0,
    is: { true: ["順番は左へ進みます ↻", "Play goes to the left ↻"] },
    other: ["順番は右へ進みます ↺", "Play goes to the right ↺"],
  },
  facing: ["{0}に+{1}が来ています。ドロー札を重ねるか、引き取ります。", "{0} faces +{1}: stack a draw card, or take them."],
  challengeOpen: [
    "{0}：4枚を引き取るか、{1}のワイルドドローフォーにチャレンジします。",
    "{0}: take the four, or challenge {1}'s Wild Draw Four.",
  ],
  drew: ["{0}が引きました。引いた札が出せるなら出し、出さなければ持っておきます。", "{0} drew: play the card drawn if it goes, or keep it."],
  stock: { by: 0, is: { "0": ["山札なし", "No stock"] }, other: ["山札{0}枚", "{0} to draw"] },
  play: ["出す", "Play"],
  playWhy: ["色か数字が合う札を選んでください。", "Choose a card that matches the colour or the number."],
  notThat: ["その札は、これには出せません。", "That card does not go on this one."],
  draw: ["引く", "Draw"],
  keep: ["持っておく", "Keep it"],
  pass: ["パス", "Pass"],
  take: ["{0}枚引き取る", "Take {0}"],
  challenge: ["チャレンジ", "Challenge"],
  call: ["一つ！", "Hitotsu!"],
  called: ["一つ！と言いました", "Hitotsu! called"],
  callHelp: ["残り2枚の札を出す前に言ってください。言わないと2枚引きます。", "Call it before your second-last card goes down, or take two."],
  jumpIn: ["割り込む", "Jump in"],
  callColour: ["{0}を宣言", "Call {0}"],
  swapWith: ["{0}と交換", "Swap with {0}"],
  cards: ["{0}枚", "{0} cards"],
  one: ["一つ！", "Hitotsu!"],
  over: ["ゲーム終了", "Game over"],
  won: ["{0}の勝ちです。", "{0} won."],
  again: AGAIN,
  scores: ["得点", "Scores"],
  scoreWords: ["点数、合計に最初に届いた人の勝ち", "Points, first to the total wins"],
  handWords: ["1ハンド：最初にあがった人の勝ち", "One hand: first out wins"],
  about: ["一つについて：規則と、同じ系統のゲーム", "About Hitotsu: its rules and its family"],
  playButton: PLAY,
  card: ["この端末でカード", "Cards on this device"],
  idleDetail: IDLE_DETAIL,
  idleKept: IDLE_KEPT,
} as const satisfies JaOverlay<typeof HITOTSU_COPY>;

export const YACHT_COPY_JA = {
  lead: [
    "1〜8人で1台のスマホやタブレットを囲んで遊ぶ、ヨットです。どの席にもコンピュータを座らせられます。サイコロ5個、振るのは3回まで、記入欄は13です。ここでは評価されず、このブラウザー以外には保存されません。",
    "Yacht for one to eight round one phone or tablet, with a computer in any seat you like: five dice, three rolls, thirteen boxes. Nothing here is rated or saved anywhere but this browser.",
  ],
  play: ["ヨットを遊ぶ", "Play Yacht"],
  howMany: HOW_MANY,
  alone: ["1人で：得点表を埋めて、自己ベストを更新しましょう。", "Alone: fill the sheet and beat your best."],
  seats: ["席", "Who is at the table"],
  computer: ["コンピュータ", "Computer"],
  computerHelp: ["この席は、このブラウザーの中で、コンピュータが打ちます。", "A computer plays this seat, in this browser."],
  roll: ["振る", "Roll"],
  rollFirst: ["サイコロを振る", "Roll the dice"],
  rollsLeft: ["残り{0}回", "{0} rolls left"],
  noRolls: ["もう振れません：記入欄を選んでください", "No rolls left: choose a box"],
  tapToHold: ["サイコロをタップするとキープ、記入欄をタップすると得点します。", "Tap a die to keep it, and tap a box to score."],
  tapTray: ["トレーをタップするか、「振る」を押すと振ります。", "Tap the tray or press Roll to roll."],
  held: ["キープ", "Held"],
  turn: { by: 1, is: { "0": ["{0}が振る番", "{0} to roll"] }, other: ["{0}：{1}回目（全3回）", "{0}: roll {1} of 3"] },
  thinking: ["{0}が振っています…", "{0} is rolling…"],
  wrote: ["{0}が{2}に{1}点を記入しました。", "{0} scored {1} for {2}."],
  sheet: ["得点表", "Score sheet"],
  box: ["欄", "Box"],
  upper: ["上段の合計", "Upper total"],
  bonus: ["ボーナス（63点以上）", "Bonus (63 or more)"],
  total: ["合計", "Total"],
  highestWins: ["合計がいちばん高い人の勝ちです。", "Highest total wins."],
  wins: ["{0}の勝ちです！", "{0} wins!"],
  share: ["{0}が勝ちを分け合いました。", "{0} share the win."],
  aloneScored: ["得点表が埋まりました：{0}点。", "Your sheet is full: {0} points."],
  sound: ["音", "Sound"],
  soundOn: ["サイコロの音をオン", "Dice sound on"],
  soundOff: ["サイコロの音をオフ", "Dice sound off"],
  about: ["ヨットについて：規則", "About Yacht and its rules"],
} as const satisfies JaOverlay<typeof YACHT_COPY>;

export const YACHT_BOX_WORDS_JA = {
  ones: { name: ["1の目", "Ones"], hint: ["1の目すべて", "every 1"] },
  twos: { name: ["2の目", "Twos"], hint: ["2の目すべて", "every 2"] },
  threes: { name: ["3の目", "Threes"], hint: ["3の目すべて", "every 3"] },
  fours: { name: ["4の目", "Fours"], hint: ["4の目すべて", "every 4"] },
  fives: { name: ["5の目", "Fives"], hint: ["5の目すべて", "every 5"] },
  sixes: { name: ["6の目", "Sixes"], hint: ["6の目すべて", "every 6"] },
  threeKind: { name: ["スリーカード", "Three of a kind"], hint: ["全部の目", "all dice"] },
  fourKind: { name: ["フォーカード", "Four of a kind"], hint: ["全部の目", "all dice"] },
  fullHouse: { name: ["フルハウス", "Full house"] },
  smallStraight: { name: ["スモールストレート", "Small straight"], hint: ["4つ連続：30", "4 in a row: 30"] },
  largeStraight: { name: ["ラージストレート", "Large straight"], hint: ["5つ連続：40", "5 in a row: 40"] },
  yacht: { name: ["ヨット", "Yacht"], hint: ["5個同じ：50", "5 alike: 50"] },
  chance: { name: ["チャンス", "Chance"], hint: ["全部の目", "all dice"] },
} as const satisfies JaOverlay<typeof YACHT_BOX_WORDS>;

export const SUGOROKU_COPY_JA = {
  lead: [
    "{0}を、2人で、1台のスマホやタブレットを囲んで、4つの強さのコンピュータ相手に、または2台の端末で、それぞれ自分の端末で遊びます。サイコロは自動で振られます。ここでは評価されません。",
    "{0} for two, round one phone or tablet, against the computer at four strengths, or on two devices, each on their own. The dice are rolled for you. Nothing here is rated.",
  ],
  play: ["遊ぶ", "Play"],
  card: ["この端末で卓", "Tables on this device"],
  matchLength: ["どのくらいの長さにしますか？", "How long?"],
  seats: ["遊ぶのは誰ですか？", "Who plays?"],
  youAre: ["自分", "Me"],
  person: ["人", "Person"],
  computer: ["コンピュータ", "Computer"],
  strength: ["強さ", "Strength"],
  start: ["はじめる", "Start"],
  startOnline: ["卓をはじめる", "Start the table"],
  onePerson: ONE_PERSON,
  white: ["白", "White"],
  black: ["黒", "Black"],
  roll: ["サイコロを振る", "Roll the dice"],
  rolling: ["待っています…", "Waiting…"],
  done: ["終わり", "Done"],
  undo: ["戻す", "Undo"],
  double: ["ダブル", "Double"],
  take: ["テイク", "Take"],
  drop: ["ドロップ", "Drop"],
  noMove: ["動かせる手がありません。「終わり」を押してください。", "No legal move: press \"Done\"."],
  chooseChecker: ["チェッカーをタップして、次に行き先のポイントをタップします。", "Tap a checker to move it, then the point it goes to."],
  moreToPlay: { by: 0, is: { "1": ["サイコロがあと1個残っています。", "One die left to play."] }, other: ["サイコロがあと{0}個残っています。", "{0} dice left to play."] },
  thinking: ["{0}が考えています…", "{0} is thinking…"],
  over: ["マッチ終了", "Match over"],
  gameOver: ["ゲーム終了", "Game over"],
  again: AGAIN,
  kept: KEPT,
  about: ["このゲームについて：規則と、同じ系統のゲーム", "About this game: its rules and its family"],
  soundOn: ["サイコロの音をオン", "Dice sound on"],
  soundOff: ["サイコロの音をオフ", "Dice sound off"],
  idleDetail: IDLE_DETAIL,
  idleKept: IDLE_KEPT,
  boardLabel: ["{0}の盤", "The {0} board"],
} as const satisfies JaOverlay<Omit<typeof SUGOROKU_COPY, "nameOf" | "giveUp" | "giveUpAsk" | "giveUpYes" | "giveUpNo">>;

export const SUGOROKU_STRENGTH_NAMES_JA = {
  random: ["初心者", "Beginner"],
  greedy: ["気軽", "Casual"],
  careful: ["慎重", "Careful"],
  strong: ["強い", "Strong"],
} as const satisfies JaOverlay<typeof SUGOROKU_STRENGTH_NAMES>;

export const SUGOROKU_STRENGTH_LINES_JA = {
  random: [
    "反則でない手ならどれでも打ち、ダブルはせず、ダブルはすべてテイクします。",
    "Plays any legal move, never doubles, and takes every double.",
  ],
  greedy: ["いちばん良い局面になる手を打ちます。先読みはしません。", "Plays the move that leaves the best position, with no looking ahead."],
  careful: [
    "1手番先を、いちばん良い4つの打ち方について読み、ダブルとテイクを賢く使います。",
    "Looks one turn ahead at its best four plays, and doubles and takes sensibly.",
  ],
  strong: [
    "1手番先を、いちばん良い10の打ち方について読み、ダブルとテイクを賢く使います。",
    "Looks one turn ahead at its best ten plays, and doubles and takes sensibly.",
  ],
} as const satisfies JaOverlay<typeof SUGOROKU_STRENGTH_LINES>;

export const DICE_WAR_COPY_JA = {
  lead: [
    "2〜8人で1台のスマホやタブレットを囲んで遊ぶ、賽合戦です。どの席にもコンピュータを座らせられます。全員が振り、合計がいちばん高い人が得点し、同点は戦争です。ここでは評価されず、このブラウザー以外には保存されません。",
    "Dice War for two to eight round one phone or tablet, with a computer in any seat you like: everybody rolls, the highest total scores, and a tie is war. Nothing here is rated or saved anywhere but this browser.",
  ],
  play: ["賽合戦を遊ぶ", "Play Dice War"],
  howMany: HOW_MANY,
  seats: ["席の割り当て", "Who sits where"],
  person: ["人", "Person"],
  computer: ["コンピュータ", "Computer"],
  computerHelp: ["この席は、このブラウザーの中で、コンピュータが振ります。", "A computer rolls for this seat, in this browser."],
  dice: ["サイコロの数", "Dice each"],
  diceHelp: ["各自、この数のサイコロを振り、合計します。", "Each person rolls this many dice, added up."],
  sides: ["サイコロの面の数", "Sides on each die"],
  goal: ["ゲームの長さ", "Play to"],
  points: ["{0}点", "{0} points"],
  rounds: ["{0}ラウンド", "{0} rounds"],
  odds: ["1回ごとに、{0}の確率で誰かが決着をつけ、{1}の確率で戦争になります。", "Each roll: {0} somebody wins outright, {1} it is war."],
  onePerson: ONE_PERSON,
  start: ["はじめる", "Start"],
  roll: ["振る", "Roll"],
  rollDice: ["サイコロを振る", "Roll the dice"],
  rolling: ["振っています…", "Rolling…"],
  yourTurn: ["「振る」を押してください。", "Press Roll."],
  thinking: ["次は、コンピュータが振ります。", "The computers roll next."],
  war: ["戦争", "War"],
  stake: ["賭け点：{0}", "{0} points at stake"],
  scoreHeading: ["点数", "Points"],
  total: ["合計{0}", "total {0}"],
  notIn: ["この戦争には不参加", "not in this war"],
  over: ["ゲーム終了", "Game over"],
  won: ["{0}の勝ちです。", "{0} won."],
  again: AGAIN,
  soundOn: ["サイコロの音をオン", "Dice sound on"],
  soundOff: ["サイコロの音をオフ", "Dice sound off"],
  kept: KEPT,
  card: ["この端末でサイコロ", "Dice on this device"],
  about: ["賽合戦について：規則と、同じ系統のゲーム", "About Dice War: its rules and its family"],
  idleDetail: IDLE_DETAIL,
  idleKept: IDLE_KEPT,
} as const satisfies JaOverlay<typeof DICE_WAR_COPY>;

export const PACHISI_COPY_JA = {
  lead: [
    "2〜4人で1台のスマホやタブレットを囲んで遊ぶ、二十五（パチーシ）です。どの席にもコンピュータを座らせられます。4つの駒を、十字のコースを回してゴールさせ、途中で相手の駒を送り返しましょう。ここでは評価されず、このブラウザー以外には保存されません。",
    "二十五 (Pachisi) for two to four round one phone or tablet, with a computer in any seat you like: race your four pawns round the cross and home, sending your opponents back as you go. Nothing here is rated or saved anywhere but this browser.",
  ],
  play: ["二十五を遊ぶ", "Play 二十五"],
  howMany: HOW_MANY,
  seats: ["席", "Who is at the table"],
  computer: ["コンピュータ", "Computer"],
  computerHelp: ["この席は、このブラウザーの中で、コンピュータが打ちます。", "A computer plays this seat, in this browser."],
  roll: ["サイコロを振る", "Roll the dice"],
  toRoll: ["{0}が振る番", "{0} to roll"],
  toMove: ["{0}が動かす番", "{0} to move"],
  thinking: ["{0}が打っています…", "{0} is playing…"],
  choose: ["数を1つ選び、丸で囲まれた駒をタップして、その数だけ動かします。", "Choose a number, then tap a ringed pawn to move it that far."],
  both: ["{0}：2個とも", "{0}: both dice"],
  bonus: ["ボーナス{0}", "{0} bonus"],
  noMove: ["動かせるものがありませんでした。", "Nothing could move."],
  moved: ["{0}が駒を{1}マス動かしました。", "{0} moved a pawn {1}."],
  entered: ["{0}が駒を巣から出しました。", "{0} brought a pawn out of the nest."],
  took: ["{0}の駒は巣に戻り、20マス動かせます。", "{0}'s pawn goes back to the nest, and there are 20 to move."],
  home: ["駒がゴールし、10マス動かせます。", "A pawn home, and 10 to move."],
  thirdDouble: ["{0}が3回続けてゾロ目を出したので、先頭の駒が巣に戻ります。", "{0} rolled a third double, so their leading pawn goes back to the nest."],
  home4: ["ゴール{0}/4", "{0} of 4 home"],
  about: ["二十五について：規則", "About 二十五 and its rules"],
} as const satisfies JaOverlay<Omit<typeof PACHISI_COPY, "rolled">>;

export const GUNJIN_SIDES_JA = [{ label: ["赤", "Red"] }, { label: ["青", "Blue"] }] as const satisfies JaOverlay<typeof GUNJIN_SIDES>;

export const GUNJIN_PLACING_RULES_JA = {
  "luzhanqi-mini": [
    "旗は司令部（自分の後ろの列にある印のマス）に、地雷は後ろの列に置き、爆弾は最前列に置いてはいけません。",
    "The flag goes on a headquarters (a marked square on your back row), mines go on your back row, and bombs must not go on your front row.",
  ],
  "gunjin-shogi": ["地雷は、自分の最前列のDかFには置けません。", "A mine may not stand on D or F of your front row."],
} as const satisfies JaOverlay<{ [K in keyof typeof GUNJIN_PLACING_RULES as (typeof GUNJIN_PLACING_RULES)[K] extends string ? K : never]: string }>;

/** What each board's tile says under its name. The names are the boards' own kanji. */
export const GUNJIN_BOARDS_JA = {
  56: { note: ["駒14枚、安全地帯と司令部", "14 pieces, camps and headquarters"] },
  72: { note: ["駒21枚、スパイと、進める旗", "21 pieces, a spy and a flag that can march"] },
  81: { note: ["駒31枚、飛行機、戦車、地雷", "31 pieces, aircraft, tanks and mines"] },
  100: { note: ["駒40枚、湖、爆弾、偵察兵", "40 pieces, lakes, bombs and scouts"] },
} as const satisfies JaOverlay<typeof GUNJIN_BOARDS>;

export const GUNJIN_COPY_JA = {
  lead: [
    "2人で1台のスマホやタブレットを囲んで遊ぶ、軍人です。見えない駒の軍どうしで、自分の駒の階級はわかっても、相手の駒の階級はわかりません。番と番のあいだ、スマホは覆われるので、見てはいけないものは、誰にも見えません。ここでは評価されません。",
    "Gunjin for two, round one phone or tablet: armies of hidden pieces, where you know your own ranks and never theirs. The phone is covered between turns, so nobody sees what they should not. Nothing here is rated.",
  ],
  which: ["どのゲームにしますか？", "Which game?"],
  seats: ["遊ぶのは誰ですか？", "Who plays?"],
  red: ["赤：手前の側。最初に並べて、最初に動かします", "Red, on the near side, arranges first and moves first"],
  blue: ["青：奥の側", "Blue, on the far side"],
  start: ["はじめる", "Start"],
  play: PLAY,
  kept: KEPT,
  card: ["この端末で軍人", "Gunjin on this device"],
  about: ["軍人について：盤と規則", "About Gunjin: its boards and its rules"],
  arrange: ["{0}：自分の駒を並べてください", "{0}: arrange your pieces"],
  arrangeNote: ["見てよいのは、並べる人だけです。ほかの人は、目をそらしてください。", "Only you should be looking. Everyone else, look away."],
  arrangeHelp: [
    "「シャッフル」を押すと、配置が作られます。自分の駒を1つタップし、次に別の駒か、自分の側の空きマスをタップして、入れ替えるか移します。よければ「配置を確定」を押します。",
    "Press \"Shuffle\" for a layout. Tap one of your pieces, then another piece or an empty square on your side, to swap or move it. Press \"Finish setup\" when you are happy.",
  ],
  shuffle: ["シャッフル", "Shuffle"],
  finish: ["配置を確定", "Finish setup"],
  invalid: ["その配置は、このゲームの規則を満たしません。", "That arrangement does not meet this game's rules."],
  yourPieces: ["自分の駒", "Your pieces"],
  turn: ["{0}が動かす番", "{0} to move"],
  passSetUp: ["次は{0}が駒を並べます。", "{0} is next to arrange their pieces."],
  passPlay: ["次は{0}が動かします。", "{0} is next to move."],
  passStart: ["その人が自分だと押すまで、盤は何も表示されません。", "Nothing of the board is shown until they press that it is them."],
  passFirst: ["{0}です。自分の駒を並べはじめる", "{0}: start arranging my pieces"],
  passFirstNote: ["駒は、1人ずつ、こっそり並べます。", "Pieces are arranged in secret, one person at a time."],
  newsFirst: ["両者が駒を並べ終えました。赤が最初に動かします。", "Both sides have arranged their pieces. Red moves first."],
  pickPiece: ["自分の駒を1つ選んでください。", "Choose one of your pieces."],
  pickTarget: ["{0}：光っているマスか、別の駒を選んでください。", "{0}: choose a lit square, or another piece."],
  noMoves: ["その駒は動かせません。", "That piece cannot move."],
  arranging: ["並べています", "arranging"],
  piecesLeft: ["残り{0}個", "{0} pieces left"],
  waitingToArrange: [
    "{0}が駒を並べています。自分の駒は、置かれて隠されています。{0}が並べ終えると、盤が開きます。",
    "{0} is arranging their pieces. Yours are placed and hidden, and the board opens when {0} has finished.",
  ],
  watching: ["相手を待っています。自分の番になるまで、盤は見るだけです。", "Waiting for the other side. The board is only to look at until it is your turn."],
  lastMove: ["最近の手", "Recent moves"],
  noMovesYet: ["まだ手はありません。", "No moves yet."],
  gameOver: ["ゲーム終了", "Game over"],
  drawn: { by: 0, is: { null: ["引き分けです。", "Drawn."] }, other: ["引き分け：{0}。", "Drawn: {0}."] },
  offerDraw: ["引き分けを申し込む", "Offer a draw"],
  offerDrawAsk: [
    "{0}のために、{1}に引き分けを申し込みますか？相手が受ければ、引き分けで終わります。断れば、続きます。",
    "Offer {1} a draw for {0}? The game ends level if they accept, and if they decline, play goes on.",
  ],
  offerDrawYes: ["引き分けを申し込む", "Offer a draw"],
  drawOffered: ["{0}が引き分けを申し込みました。", "{0} has offered a draw."],
  drawAsk: [
    "{0}が引き分けを申し込みました。受けると、引き分けでゲームが終わります。断るか、そのまま動かすと、続きます。",
    "{0} offers a draw. Accept it and the game ends level. Decline it, or just move, and play goes on.",
  ],
  drawAccept: ["引き分けを受ける", "Accept the draw"],
  drawDecline: ["断る", "Decline"],
  drawWaiting: [
    "{0}に引き分けを申し込みました。返事を待っています。相手が動かすと、断ったことになります。",
    "You offered {0} a draw. It waits for their answer, and a move of theirs declines it.",
  ],
  wins: { by: 1, is: { null: ["{0}の勝ちです。", "{0} wins."] }, other: ["{0}の勝ちです：{1}。", "{0} wins: {1}."] },
  finalNote: ["ゲームが終わったので、すべての駒が表示されています。", "Every piece is shown now the game is over."],
  again: AGAIN,
  boardLabel: ["{0}の盤", "The {0} board"],
  hiddenBoard: ["スマホを回すあいだ、盤は覆われています。", "The board is covered while the phone is passed."],
  chosen: ["{0}を選びました", "{0} chosen"],
  opponent: ["相手の駒", "Opponent piece"],
  empty: ["空", "empty"],
  lake: ["湖：入れません", "lake, nothing can enter"],
  cell: ["{0}、{1}", "{0}, {1}"],
  idleDetail: IDLE_DETAIL,
  idleKept: IDLE_KEPT,
} as const satisfies JaOverlay<Omit<typeof GUNJIN_COPY, "nameOf">>;

export const TENKA_NEUTRAL_MARBLE_JA = { label: ["中立", "Neutral"] } as const satisfies JaOverlay<typeof TENKA_NEUTRAL_MARBLE>;

export const TENKA_REGION_NAMES_JA = {
  northAmerica: ["北米", "N. America"],
  southAmerica: ["南米", "S. America"],
  europe: ["欧州", "Europe"],
  africa: ["アフリカ", "Africa"],
  asia: ["アジア", "Asia"],
  australia: ["豪州", "Australia"],
  britishIsles: ["英国", "Britain"],
  scandinavia: ["北欧", "Nordic"],
  iberia: ["イベリア", "Iberia"],
  maghreb: ["マグリブ", "Maghreb"],
  france: ["フランス", "France"],
  germany: ["ドイツ", "Germany"],
  centralEurope: ["中欧", "Central"],
  italy: ["イタリア", "Italy"],
  balkans: ["バルカン", "Balkans"],
  baltic: ["バルト", "Baltic"],
  easternEurope: ["東欧", "East"],
} as const satisfies JaOverlay<typeof TENKA_REGION_NAMES>;

export const TENKA_COPY_JA = {
  lead: [
    "2〜6人で1台のスマホやタブレットを囲んで遊ぶ、天下です。世界を1領土ずつ取り、次の人へ回します。ここでは評価されず、このブラウザー以外には保存されません。",
    "Tenka for two to six people round one phone or tablet: take the world a territory at a time, then pass it on. Nothing here is rated or saved anywhere but this browser.",
  ],
  length: ["どのくらいの長さにしますか？", "How long?"],
  mapChoice: ["地図", "Map"],
  mapWords: { by: 0, is: { europe: ["ヨーロッパ", "Europe"] }, other: ["世界", "The world"] },
  placing: ["最初の部隊", "Starting armies"],
  placingAuto: ["自動で配置", "Placed for you"],
  placingHand: ["順番に置く", "Place them in turn"],
  placingNote: [
    "自動で配置は、すぐに始まります。順番に置くと、全員が卓を順に回って、1つずつ部隊を置きます。",
    "Placed for you starts at once. In turn, everybody places one army at a time round the table.",
  ],
  play: PLAY,
  about: ["天下について：規則", "About Tenka and its rules"],
  oldSave: [
    "この端末に保存されていた天下のゲームは、そのあと変わった地図で遊ばれたので、続けられません。下から新しいゲームをはじめてください。",
    "The Tenka game kept on this device was played on a map that has since changed, so it cannot be continued. Start a new game below.",
  ],
  steps: [["配置", "Place"], ["攻撃", "Attack"], ["移動", "Fortify"], ["手番を終える", "End turn"]],
  passTo: ["{0}さんに渡してください", "Pass to {0}"],
  ready: ["{0}です。自分の番を始める", "I'm {0}: start my turn"],
  place: ["置く部隊：{0}。自分の領土をタップします。", "{0} armies to place: tap your territories."],
  setUp: ["準備：自分の領土に部隊を1つ置きます（残り{0}）。", "Set-up: place one army on a territory of yours ({0} left)."],
  placeAll: ["残りの{0}部隊をすべて{1}に置く", "All {0} on {1}"],
  mustTrade: ["カードが5枚以上あります。置く前に、1組を交換してください。", "Five cards or more: trade a set before placing."],
  attackHint: ["部隊が2つ以上ある自分の領土をタップし、次に、攻撃する隣の領土をタップします。", "Tap one of your territories with two armies or more, then a neighbour to attack."],
  attackTarget: ["{0}が{1}を攻撃", "{0} attacks {1}"],
  roll: ["サイコロ{0}個で振る", "Roll {0}"],
  blitz: ["決着がつくまで振る", "Roll until decided"],
  doneAttacking: ["攻撃を終える", "Done attacking"],
  occupy: ["{0}はあなたのものです。何部隊を進めますか？", "{0} is yours. How many armies move in?"],
  moveIn: ["{0}部隊を進める", "Move {0} in"],
  fortifyHint: [
    "自分の領土どうしが自分の領土でつながっているなら、部隊を1回だけ移せます。または手番を終えます。",
    "Move armies once between two of your territories joined by your own land, or end your turn.",
  ],
  fortifyPair: ["{0}から{1}へ", "From {0} to {1}"],
  fortify: ["{0}部隊を移す", "Move {0}"],
  endTurn: ["手番を終える", "End turn"],
  armies: ["{0}部隊", "{0} armies"],
  territories: ["{0}領土", "{0} territories"],
  cards: ["{0}枚", "{0} cards"],
  hand: ["自分のカード", "Your cards"],
  noCards: ["カードはまだありません。この手番で領土を取ると、もらえます。", "No cards yet: take a territory this turn to earn one."],
  trade: ["{0}部隊と交換", "Trade for {0}"],
  out: ["脱落", "out"],
  mapOf: { by: 0, is: { europe: ["ヨーロッパの地図", "Map of Europe"] }, other: ["世界地図", "Map of the world"] },
  fit: ["地図を動かして拡大", "Move and zoom the map"],
  regions: ["見る場所", "Look at"],
  world: ["世界", "World"],
  wrapTo: { by: 1, is: { true: ["{0} →", "{0} →"] }, other: ["← {0}", "← {0}"] },
  wrapNote: ["{0}（ベーリング海峡の向こう）", "{0}, across the Bering Strait"],
} as const satisfies JaOverlay<Omit<typeof TENKA_COPY, "lengthWords" | "lengthNote" | "roundOf">>;

export const CASUAL_COPY_JA = {
  card: ["カジュアルゲーム", "Casual game"],
  never: ["評価されず、得点もつかず、このブラウザーにだけ保存されます。", "Unrated, worth no points, saved only in this browser."],
  setUpTitle: ["レベルを選ぶ", "Choose a level"],
  start: {
    by: 1,
    is: { true: ["物語{0}をはじめる →", "Start story {0} →"] },
    other: ["レベル{0}をはじめる →", "Start level {0} →"],
  },
  levelWord: { by: 0, is: { true: ["物語", "Story"] }, other: ["レベル", "Level"] },
  won: ["クリア", "Won"],
  going: ["進行中", "In progress"],
  fresh: ["まだ遊んでいません", "Not yet played"],
  wonOf: {
    by: 2,
    is: { true: ["{1}物語中{0}物語をクリア", "{0} of {1} stories won"] },
    other: ["{1}レベル中{0}レベルをクリア", "{0} of {1} levels won"],
  },
  resume: ["続ける →", "Continue →"],
  continueLevel: {
    by: 1,
    is: { true: ["物語{0}を続ける →", "Continue story {0} →"] },
    other: ["レベル{0}を続ける →", "Continue level {0} →"],
  },
  about: ["このゲームについて", "About this game"],
  wonTitle: {
    by: 1,
    is: { true: ["物語{0}クリア", "Story {0} won"] },
    other: ["レベル{0}クリア", "Level {0} won"],
  },
  lostTitle: ["今回は残念", "Not this time"],
  gaveUpTitle: ["あきらめました", "You gave up"],
  gaveUpText: {
    by: 1,
    is: { true: ["物語{0}は、未解決のまま残っています。もう一度挑戦できます。", "Story {0} is left unsolved. It stays open to try again."] },
    other: ["レベル{0}は、未解決のまま残っています。もう一度挑戦できます。", "Level {0} is left unsolved. It stays open to try again."],
  },
  next: ["次のレベル →", "Next level →"],
  nextStory: ["次の物語 →", "Next story →"],
  again: ["もう一度", "Try again"],
  playAgain: ["もう一度遊ぶ", "Play again"],
  idleDetail: [
    "2〜3分、何も動いていません。ここに時計はなく、レベルはただ待っています。",
    "Nothing has moved for a couple of minutes. There is no clock here, and the level simply waits.",
  ],
  idleKept: [
    "クリアしたレベルは、このブラウザーに保存されています。このレベルも、戻ってきたとき、ここにあります。",
    "The levels you have won are saved in this browser. This one will be here when you come back.",
  ],
  allDone: [
    "すべてのレベルをクリアしました。好きなものをもう一度遊ぶか、ほかのゲームを選んでください。",
    "Every level is won. Play any of them again, or choose another game.",
  ],
  levels: ["レベルを選ぶ", "Choose a level"],
  restart: ["やり直す", "Restart"],
  restartKeeps: ["このレベルを、最初からやり直します。", "Starts this level again from the beginning."],
  rulesLink: ["規則", "Rules"],
  idle: ["ゲームを読み込んでいます…", "Loading the game…"],
  board: ["{0}、レベル{1}", "{0}, level {1}"],
} as const satisfies JaOverlay<typeof CASUAL_COPY>;
