import type { JaOverlay } from "../copyTable";

import type { ONLINE_COPY } from "@/components/party/online/online.constants";
import type { KEPT_COPY } from "@/components/party/kept.constants";
import type { CARD_TABLE_COPY } from "@/components/party/cards/cardTable.constants";
import type { PAIR_GO_COPY } from "@/components/party/pairGo.constants";
import type { DOTS_COPY, GHOST_COPY, MANCALA_COPY, PARTY_COPY, PARTY_GAME_COPY, PARTY_MARBLES, TRAIN_COPY } from "@/components/party/party.constants";
import type { PARTY_BLOCKS_COPY } from "@/components/party/partyBlocks.constants";

/**
 * The words of the party tables' screens, in Japanese: overlays (`copyTable.ts`)
 * of the English tables in `src/components/party/` (`party.constants.ts`,
 * `pairGo.constants.ts`, `partyBlocks.constants.ts`, `kept.constants.ts`,
 * `online/online.constants.ts`, `cards/cardTable.constants.ts`), each line
 * `["日本語", "literal English"]`. A line that depends on a number or a name
 * has `{0}`, `{1}` where the figure goes, in the order the screen gives them.
 *
 * The words used here, so every table reads alike (docs/plans/en-ja-everywhere/TERMS.md):
 * a table is 卓, a seat 席, a turn 手番 or 番, a person at a table is named by their name
 * or 人, never プレイヤー; the computer is コンピュータ; "pass and play" is 回し遊び, and
 * 回し打ち where it is the name of the tab or the page (John's kanji).
 */

/** The line every pass-and-play table says before its own: take your turn, pass it on, or play on several devices. */
const TAKE_YOUR_TURN =
  "自分の番が終わったら次の人へ回します。または「複数の端末」を選ぶと、全員が自分の端末で遊べます。ここでは評価されません。";
const TAKE_YOUR_TURN_BACK = "Take your turn, then pass it on, or choose \"Several devices\" and everybody plays on their own device. Nothing here is rated.";

export const PARTY_COPY_JA = {
  title: ["回し打ち", "Pass and play"],
  resume: ["回し遊びのゲームを続ける", "Continue the pass-and-play game"],
  howMany: ["何人で遊びますか？", "How many are playing?"],
  names: ["名前（なくてもかまいません）", "Names, if you like"],
  start: ["はじめる", "Start"],
  again: ["同じ卓でもう一度", "Play again, same table"],
  pick: [
    "自分の駒をタップし、次に行き先をタップします。ジャンプは続けられます。最後に着いた場所をタップしてください。",
    "Tap one of your pieces, then where it should go. A jump can chain: tap where the last jump lands.",
  ],
  stuck: ["誰も動かせません。勝者なしで、ゲーム終了です。", "Nobody can move. The game is over with no winner."],
  kept: ["このブラウザーに保存されています。離れて戻ってきても、ここにあります。", "Saved in this browser: leave and come back, and it is here."],
  card: ["この端末で回し遊び", "Pass and play on this device"],
  idleDetail: [
    "この卓では、2〜3分、何も動いていません。ここに時計はなく、ゲームはただ待っています。",
    "Nothing has moved at this table for a couple of minutes. There is no clock here, and the game simply waits.",
  ],
  idleKept: [
    "このゲームは、このブラウザーに保存されています。戻ってきたとき、ここにあります。",
    "This game is saved in this browser. It will be here when you come back.",
  ],
} as const satisfies JaOverlay<typeof PARTY_COPY>;

export const PARTY_GAME_COPY_JA = {
  chineseCheckers: {
    offer: ["回し遊び：この端末で2〜6人", "Pass and play: 2 to 6 people on this device"],
    lead: [
      `1台のスマホやタブレットを囲んで、2人、3人、4人、6人で遊ぶダイヤモンドゲームです。${TAKE_YOUR_TURN}`,
      `Chinese Checkers for two, three, four or six people round one phone or tablet. ${TAKE_YOUR_TURN_BACK}`,
    ],
    farCamp: ["向かいの頂点", "the far point"],
    about: ["ダイヤモンドゲームについて：規則と、2人用のレーティング対局", "About Chinese Checkers: its rules and its rated game for two"],
  },
  halma: {
    offer: ["回し遊び：この端末で2人か4人", "Pass and play: 2 or 4 people on this device"],
    lead: [
      `4人で1台のスマホやタブレットを囲んで、または2人で遊ぶハルマです。それぞれが、自分の角から向かいの角へ駒を走らせます。4人のときは13個ずつ、2人のときは19個ずつです。${TAKE_YOUR_TURN}`,
      `Halma for four people round one phone or tablet, or for two: each races their pieces from their own corner into the corner opposite, thirteen each when four play and nineteen each when two do. ${TAKE_YOUR_TURN_BACK}`,
    ],
    farCamp: ["向かいの角", "the far corner"],
    about: ["ハルマについて：規則と、2人用のレーティング対局", "About Halma: its rules and its rated game for two"],
  },
} as const satisfies JaOverlay<typeof PARTY_GAME_COPY>;

export const PARTY_MARBLES_JA = [
  { label: ["赤", "Red"] },
  { label: ["青", "Blue"] },
  { label: ["黄", "Yellow"] },
  { label: ["緑", "Green"] },
  { label: ["紫", "Purple"] },
  { label: ["白", "White"] },
  { label: ["橙", "Orange"] },
  { label: ["空色", "Sky blue"] },
] as const satisfies JaOverlay<typeof PARTY_MARBLES>;

export const DOTS_COPY_JA = {
  lead: [
    `2〜6人で1台のスマホやタブレットを囲んで遊ぶ、陣取りです。${TAKE_YOUR_TURN}`,
    `Dots and Boxes for two to six people round one phone or tablet. ${TAKE_YOUR_TURN_BACK}`,
  ],
  board: ["どの盤にしますか？", "Which board?"],
  lines: ["線{0}本", "{0} lines"],
  tap: [
    "2つの点のあいだをタップして、線を引きます。箱を閉じるとその箱は自分のものになり、もう1本引けます。",
    "Tap between two dots to draw a line. Close a box and it is yours, and you draw again.",
  ],
  closed: {
    by: 0,
    is: { "2": ["箱を2つ閉じました。もう1本引けます。", "Closed two boxes: draw again."] },
    other: ["箱を閉じました。もう1本引けます。", "Closed a box: draw again."],
  },
  boxes: ["箱{0}個", "{0} boxes"],
  drawn: ["{1}本のうち{0}本を引きました。", "{0} of {1} lines drawn."],
  play: ["遊ぶ →", "Play →"],
  about: ["陣取りについて：規則", "About Dots and Boxes and its rules"],
} as const satisfies JaOverlay<typeof DOTS_COPY>;

export const GHOST_COPY_JA = {
  lead: [
    `2〜8人で1台のスマホやタブレットを囲んで、英語でも日本語でも遊ぶ、幽霊です。${TAKE_YOUR_TURN}`,
    `Superghost for two to eight people round one phone or tablet, in English or Japanese. ${TAKE_YOUR_TURN_BACK}`,
  ],
  language: ["どの言語にしますか？", "Which language?"],
  languages: {
    english: {
      name: ["英語", "English"],
      words: ["SCOWLの英単語", "SCOWL's English words"],
    },
    japanese: {
      words: ["JMdictの読みを、組文字のかなで", "JMdict's readings, in the kana of 組文字"],
    },
  },
  table: ["参加者", "Players"],
  loading: ["単語リストを取得しています…", "Fetching the word list…"],
  failed: [
    "単語リストを取得できませんでした。接続を確かめて、ページを読み込み直してください。",
    "The word list could not be fetched. Check the connection, then reload the page.",
  ],
  pick: [
    "文字をタップして、「前に足す」か「後ろに足す」を押します。または挑戦します。",
    "Tap a letter, then press \"Add before\" or \"Add after\", or challenge.",
  ],
  pickJapanese: [
    "かなをタップして、「前に足す」か「後ろに足す」を押します。または挑戦します。「が」は「か」、「ゃ」は「や」として打ちます。",
    "Tap a kana, then press \"Add before\" or \"Add after\", or challenge. が is played as か, and ゃ as や.",
  ],
  addBefore: {
    by: 0,
    is: { null: ["前に足す", "Add before"] },
    other: ["{0}を前に足す", "Add {0} before"],
  },
  addAfter: {
    by: 0,
    is: { null: ["後ろに足す", "Add after"] },
    other: ["{0}を後ろに足す", "Add {0} after"],
  },
  challenge: {
    by: 0,
    is: { null: ["挑戦", "Challenge"] },
    other: ["{0}に挑戦", "Challenge {0}"],
  },
  noChallenge: ["誰かが文字を足すまで、挑戦はできません。", "There is nothing to challenge until somebody adds a letter."],
  empty: ["まだ文字がありません", "No letters yet"],
  answer: [
    "{1}が{0}に挑戦しました。{0}さん、頭に浮かべていた言葉を入力して、Enterを押してください。",
    "{1} challenged {0}. {0}, type the word you had in mind, then press Enter.",
  ],
  typed: ["あなたの言葉", "Your word"],
  cannot: ["思いつきません", "I can't think of one"],
  problems: {
    letters: ["ゲームの文字だけを使ってください。", "Please use only the game's letters."],
    short: ["{0}文字以上の言葉にしてください。", "Please use a word of {0} letters or more."],
    missing: ["言葉には、{0}が、そのままの順にひと続きで入っていなければなりません。", "The word must contain {0} in it, in that order, joined up."],
    unknown: [
      "{0}は、このサイトの単語リストにありません。別の言葉を試すか、このラウンドをあきらめてください。",
      "{0} is not in the site's word list. Try another word, or give up the round.",
    ],
  },
  lost: {
    spelled: ["{0}が、言葉の{1}を完成させたので、1文字もらいます。", "{0} finished the word {1}, and takes a letter."],
    named: ["{0}が{1}と答えたので、{2}が1文字もらいます。", "{0} named {1}, so {2} takes a letter."],
    caught: ["{0}は言葉を答えられなかったので、1文字もらいます。", "{0} could not name a word, and takes a letter."],
    example: {
      by: 0,
      is: { null: ["単語リストにも、ありませんでした。", "The word list had none either."] },
      other: ["リストには、{0}がありました。", "The list had {0}."],
    },
  },
  out: ["脱落", "Out"],
  isOut: ["{0}は脱落しました。", "{0} is out."],
  turn: ["の番", "'s turn"],
  answering: ["は言葉を答えてください", " must name a word"],
  wins: ["{0}の勝ちです。最後まで残りました。", "{0} wins: the last one left."],
  rounds: ["{0}ラウンド行いました。", "{0} rounds played."],
  outAt: ["すべての文字をもらうと脱落です。", "Take every letter and you are out."],
  lettersLeft: {
    by: 1,
    is: { "": ["{0}：文字なし", "{0}: no letters"] },
    other: ["{0}：{1}", "{0}: {1}"],
  },
  play: ["遊ぶ →", "Play →"],
  about: ["幽霊について：規則", "About Superghost and its rules"],
} as const satisfies JaOverlay<typeof GHOST_COPY>;

export const MANCALA_COPY_JA = {
  lead: [
    `2人で1台のスマホやタブレットを回して遊ぶ、種まきです。標準のKalahか、Owareです。${TAKE_YOUR_TURN}`,
    `Mancala for two, passed across one phone or tablet: Kalah, the default, or Oware. ${TAKE_YOUR_TURN_BACK}`,
  ],
  rules: ["どのルールにしますか？", "Which rules?"],
  names: ["名前（なくてもかまいません）", "Names, if you like"],
  ruleLine: {
    kalah: [
      "自分のストアに種を入れます。最後の種がストアに入ったら、もう一度まきます。最後が自分の空の穴なら、向かいを取ります。",
      "Sow into your store. If the last seed lands home, sow again. If the last lands in an empty pit, capture across.",
    ],
    oware: [
      "ストアには取った種だけがたまります。相手の穴が2個か3個になったら取ります。25個で勝ちです。",
      "The stores keep only what is captured. Make 2 or 3 on their side and take them. 25 wins.",
    ],
  },
  tap: [
    "自分の色で丸く囲まれた、自分の穴をタップすると、種をまきます。",
    "Tap one of your pits, ringed in your colour, to sow its seeds.",
  ],
  feed: ["{0}の穴には種がありません。できるなら、相手の列に種を送るようにまいてください。", "{0} has no seeds: if you can, you must sow so as to send seeds into their row."],
  again: ["もう一度まきます。{0}の最後の種が、自分のストアに入りました。", "Another turn: {0}'s last seed fell in their store."],
  captured: ["{0}が{1}個を取りました。", "{0} captured {1}."],
  grandSlam: ["グランドスラム：{1}の種を全部取ってしまうので、{0}は何も取れません。", "Grand slam: it would take all of {1}'s seeds, so {0} takes none."],
  seeds: ["種{0}個", "{0} seeds"],
  sowings: ["{0}回", "{0} sowings"],
  ending: {
    rowEmpty: [
      "どちらかの列の種がなくなり、それぞれが自分の側に残った種を取りました。",
      "A row ran out of seeds, and each took what was left on their side.",
    ],
    majority: ["種の半分より多くが取られました。", "More than half the seeds were taken."],
    even: ["24個ずつです。", "Twenty-four each."],
    cannotFeed: [
      "片方の列が空で、そこに種を送れなかったので、それぞれが自分の側の種を取りました。",
      "One row was empty and no seed could be sent into it, so each took the seeds on their side.",
    ],
    repeated: [
      "同じ局面が3回めに現れたので、それぞれが自分の側の種を取りました。",
      "The same position appeared a third time, so each took the seeds on their side.",
    ],
  },
  store: ["ストア", "store"],
  taken: ["取った数", "taken"],
  play: ["遊ぶ →", "Play →"],
  about: ["種まきについて：規則", "About Mancala and its rules"],
} as const satisfies JaOverlay<typeof MANCALA_COPY>;

export const TRAIN_COPY_JA = {
  lead: [
    "2〜8人で1台のスマホやタブレットを囲んで遊ぶ、メキシカントレインです。どの席にもコンピュータを座らせられます。手札は秘密で、番と番のあいだ、卓が自分の手札を覆います。ここでは評価されず、このブラウザー以外には保存されません。",
    "Mexican Train for two to eight round one phone or tablet, with a computer in any seat you like. Hands are secret, and the table covers yours between turns. Nothing here is rated or saved anywhere but this browser.",
  ],
  set: ["どのセットにしますか？", "Which set?"],
  setLine: {
    "9": ["55枚、10ラウンド。ピップが少なく、短く遊べます。", "55 tiles, 10 rounds. Quicker, with fewer pips."],
    "12": ["91枚、13ラウンド。このゲームに付いてくるセットです。", "91 tiles, 13 rounds. The set the game is sold with."],
    "15": ["136枚、16ラウンド。夜長に。", "136 tiles, 16 rounds. A long evening."],
  },
  howMany: ["何人で遊びますか？", "How many are playing?"],
  seats: ["席", "Seats"],
  computer: ["コンピュータ", "Computer"],
  computerHelp: ["この席は、コンピュータが打ちます", "A computer plays this seat"],
  house: ["ハウスルール", "House rules"],
  lengthLabel: ["ラウンド", "Rounds"],
  lengths: { full: ["すべてのラウンド", "Every round"], short: ["短いゲーム", "A short game"] },
  lengthLine: {
    full: ["ダブルごとに1ラウンド。いちばん大きいダブルからブランクまで。", "One for every double, from the highest down to blank."],
    short: ["いちばん大きいダブルから、ラウンドが半分です。", "Half as many, from the highest double."],
  },
  doublesLabel: ["ダブル", "Doubles"],
  doubles: { one: ["1枚で覆う", "One at a time"], chain: ["連続", "Chained"] },
  doublesLine: {
    one: ["ダブルは、ほかより先に覆います。", "Cover a double before anything else."],
    chain: ["ダブルをさらに置いてよく、最後のダブルを先に覆います。", "Lay more doubles, then cover the last one first."],
  },
  mexicanLabel: ["メキシカントレイン", "Mexican Train"],
  mexican: { any: ["最初から開放", "Open from the start"], ownFirst: ["自分の列車のあと", "After your own"] },
  mexicanLine: {
    any: ["いつでも誰でも、置けます。", "Anybody may lay on it at any time."],
    ownFirst: ["自分の列車が始まってから、置けます。", "Only once your own train has begun."],
  },
  hub: ["ハブ", "Hub"],
  mexicanTrain: ["メキシカントレイン", "Mexican Train"],
  boneyard: ["山{0}枚", "{0} to draw"],
  round: ["第{0}ラウンド（全{1}）", "Round {0} of {1}"],
  engine: ["ハブはダブル{0}", "Double {0} in the hub"],
  tiles: ["{0}枚", "{0} tiles"],
  more: ["+{0}", "+{0}"],
  pass: ["{0}さんに端末を渡してください", "Pass the device to {0}"],
  passNote: ["その人が自分だと言うまで、ドミノは隠されています。", "Their tiles are hidden until they say it is them."],
  iAm: ["{0}です", "I am {0}"],
  hide: ["ドミノを隠す", "Hide my tiles"],
  yourTiles: ["{0}のドミノ", "{0}'s tiles"],
  tap: [
    "ドミノを、光っている列車へドラッグするか、ドミノをタップしてから列車をタップします。ドミノを2回タップすると、そのドミノだけが合う場所に置けます。",
    "Drag a tile onto a lit train, or tap it and then the train. Tap a tile twice to lay it where it alone fits.",
  ],
  pick: ["{0}を選びました。光っている列車をタップして置きます。", "{0} chosen: tap a lit train to lay it."],
  nowhere: ["そのドミノは、いま置ける場所がありません。", "That tile goes nowhere now."],
  draw: ["ドミノを引く", "Draw a tile"],
  passTurn: ["パス：マーカーを出す", "Pass: marker out"],
  mustDraw: ["置けるドミノがありません。ドミノを引いてください。", "Nothing to lay: draw a tile."],
  mustPass: {
    by: 0,
    is: {
      true: ["引いたドミノは置けません。パスして、マーカーを出します。", "The tile drawn will not go: pass, and your marker goes out."],
    },
    other: ["置けるドミノも、引けるドミノもありません。パスして、マーカーを出します。", "Nothing to lay and nothing to draw: pass, and your marker goes out."],
  },
  cover: ["{1}の列車のダブル{0}を、先に覆わなければなりません。", "The double {0} on {1} must be covered first."],
  thinking: ["{0}が考えています…", "{0} is thinking…"],
  turn: ["{0}の番です", "{0} to play"],
  laid: ["{0}が{1}を{2}に置きました。", "{0} laid {1} on {2}."],
  drew: ["{0}がドミノを1枚引きました。", "{0} drew a tile."],
  passed: ["{0}がパスして、マーカーを出しました。", "{0} passed, and put their marker out."],
  roundOver: ["第{0}ラウンド終了", "Round {0} is over"],
  wentOut: ["{0}があがりました。", "{0} went out."],
  blocked: ["誰も置けず、山にも残りがありませんでした。", "Nobody could lay a tile and there was nothing left to draw."],
  nextRound: ["次のラウンドを配る", "Deal the next round"],
  scores: ["得点", "Scores"],
  pips: ["{0}点", "{0} pips"],
  total: ["合計", "Total"],
  lowestWins: ["合計がいちばん低い人の勝ちです。", "The lowest total wins."],
  wins: ["{0}の勝ちです。合計がいちばん低くなりました。", "{0} wins with the lowest total."],
  share: ["{0}が、いちばん低い合計で、勝ちを分け合いました。", "{0} share the win with the lowest total."],
  their: ["{0}の列車", "{0}'s train"],
  play: ["遊ぶ →", "Play →"],
  about: ["メキシカントレインについて：規則", "About Mexican Train and its rules"],
} as const satisfies JaOverlay<typeof TRAIN_COPY>;

export const PAIR_GO_COPY_JA = {
  title: ["ペア碁", "Pair Go"],
  offer: ["ペア碁：この端末で2チーム、2人ずつ", "Pair Go: two teams of two on this device"],
  resume: ["ペア碁のゲームを続ける", "Continue the Pair Go game"],
  lead: [
    "4人で打つ囲碁です。黒と白の2チームが、2人ずつ、1台のスマホやタブレットを囲みます。番は卓を順に回り、黒の1人目、白の1人目、黒の2人目、白の2人目の順です。パートナーは相談できません。または「複数の端末」を選ぶと、全員が自分の端末で遊べ、どの席にも、このサイトの囲碁のコンピュータを座らせられます。ここでは評価されません。",
    "Go for four: two teams of two, black and white, round one phone or tablet. The turns go round the table: black's first person, white's first, black's second, white's second, and partners may not talk. Or choose \"Several devices\" and everybody plays on their own device, with the site's Go computers in any seat you like. Nothing here is rated.",
  ],
  teams: ["2つのチーム", "The two teams"],
  seatLabel: {
    by: 1,
    is: {
      "0": ["{0}、1番目に打ちます", "{0}, plays first"],
      "1": ["{0}、2番目に打ちます", "{0}, plays second"],
      "2": ["{0}、3番目に打ちます", "{0}, plays third"],
      "3": ["{0}、4番目に打ちます", "{0}, plays fourth"],
    },
  },
  size: ["盤", "Board"],
  start: ["はじめる", "Start"],
  pass: ["パス", "Pass"],
  resign: ["投了", "Resign"],
  confirmResign: ["{0}のために投了しますか？相手のチームの勝ちです。", "Resign for {0}? The other team wins."],
  resignYes: ["はい、投了します", "Yes, resign"],
  again: ["同じチームでもう一度", "Play again, same teams"],
  noTalking: ["パートナーは順番に打ち、相談はできません。", "Partners play in turn and may not talk."],
  passed: ["{0}がパスしました。もう1回パスが続くと、ゲームが終わり、盤が数えられます。", "{0} passed. Another pass now ends the game, and the board is counted."],
  counted: [
    "2回続けてパスされたので、盤を数えます。石と、囲んだ地です。",
    "Two passes in a row, so the board is counted: stones and walled-in ground.",
  ],
  kept: ["このブラウザーに保存されています。離れて戻ってきても、ここにあります。", "Saved in this browser: leave and come back, and it is here."],
  idleDetail: [
    "2〜3分、何も動いていません。ペア碁に時計はないので、何も失われません。",
    "Nothing has moved for a couple of minutes. Pair Go has no clock, so nothing is lost.",
  ],
  away: [
    "ペア碁のゲームは、このブラウザーに保存されています。卓の準備ができたら、いつでも戻ってください。",
    "The Pair Go game is saved in this browser. Come back to it whenever the table is ready.",
  ],
  card: ["この端末でペア碁", "Pair Go on this device"],
  about: ["囲碁について：規則と、2人用のレーティング対局 →", "About Go: its rules and its rated game for two →"],
} as const satisfies JaOverlay<typeof PAIR_GO_COPY>;

export const PARTY_BLOCKS_COPY_JA = {
  title: ["4人で積み五目", "Block Five for four"],
  offer: ["回し遊び：この端末で4人", "Pass and play: 4 people on this device"],
  resume: ["4人で積み五目のゲームを続ける", "Continue the Block Five game for four"],
  lead: [
    `2人で遊ぶ積み五目とは別のゲームです。4人が1台のスマホやタブレットを囲み、1人1つの角から、1〜5マスの自分の21個の形を置いていきます。新しく置く形は、必ず自分の形のどれかと角で接し、辺では接してはいけません。誰も新しい形を置けなくなったら、覆ったマスがいちばん多い人の勝ちです。${TAKE_YOUR_TURN}`,
    `A different game from Block Five for two: four people round one phone or tablet, a corner each, each laying their own twenty-one shapes of one to five squares. Every new shape must touch one of your own at a corner and never along a side. When nobody can lay another shape, whoever has covered the most squares wins. ${TAKE_YOUR_TURN_BACK}`,
  ],
  names: ["4人、1人1つの角", "The four people, a corner each"],
  start: ["はじめる", "Start"],
  preview: ["みんな、自分の色の角から始めます。", "Everybody starts from the corner in their colour."],
  tray: ["自分の駒", "Your pieces"],
  how: [
    "形を選び、回すか裏返してから、置く場所をタップします。もう一度タップすると、置きます。",
    "Choose a shape, turn or flip it, then tap where it goes. Tap again to lay it.",
  ],
  keys: ["キー：Rで回転、Fで裏返し。", "Keys: R turns, F flips."],
  refusals: {
    over: ["ゲームは終わっています。", "The game is over."],
    used: ["その形は、もう盤に置かれています。", "That shape is already on the board."],
    offBoard: ["そこには、盤に収まりません。", "It does not fit on the board there."],
    taken: ["埋まっているマスにかかってしまいます。", "Part of it would cover a square that is already taken."],
    sideTouch: ["自分の形と、辺で接してしまいます。", "It would touch one of your own shapes along a side."],
    firstCorner: ["最初の形は、自分の角のマスを覆わなければなりません。", "Your first shape must cover your own corner square."],
    noCorner: ["自分の形のどれかと、角で接しなければなりません。", "It must touch one of your own shapes corner to corner."],
  },
  out: ["置けない", "Out"],
  sittingOut: ["置ける形がなくなったので、残りのゲームはパスします：{0}。", "Passing for the rest of the game, with no shape that fits: {0}."],
  squares: ["{0}マス", "{0} squares"],
  piecesLeft: ["残り{0}", "{0} left"],
  won: ["{0}の勝ちです。{1}マスを覆いました。", "{0} wins, with {1} squares covered."],
  shared: ["{0}が、それぞれ{1}マスで、勝ちを分け合いました。", "{0} share the win, with {1} squares each."],
  ended: ["誰も新しい形を置けないので、ゲーム終了です。マスを数えます。", "Nobody can lay another shape, so the game is over and the squares are counted."],
  again: ["同じ卓でもう一度", "Play again, same table"],
  kept: ["このブラウザーに保存されています。離れて戻ってきても、ここにあります。", "Saved in this browser: leave and come back, and it is here."],
  idleDetail: [
    "この卓では、2〜3分、何も置かれていません。ここに時計はなく、ゲームはただ待っています。",
    "Nothing has been laid at this table for a couple of minutes. There is no clock here, and the game simply waits.",
  ],
  idleKept: [
    "このゲームは、このブラウザーに保存されています。戻ってきたとき、ここにあります。",
    "This game is saved in this browser. It will be here when you come back.",
  ],
  card: ["この端末で回し遊び", "Pass and play on this device"],
  about: ["積み五目について：規則と、2人用のレーティング対局", "About Block Five: its rules and its rated game for two"],
} as const satisfies JaOverlay<typeof PARTY_BLOCKS_COPY>;

export const KEPT_COPY_JA = {
  title: ["履歴から", "From your history"],
  going: ["まだ続いています。この端末で、止めたところから続けられます。", "Still going. Carry on with it on this device, from where you left it."],
  over: ["終了しました。この端末で開くと、終わったときの卓が見られます。", "Finished. Open it on this device to see the table as it ended."],
  left: [
    "終わる前にやめました。この端末で開くと、止めたところから続けられます。",
    "Put away before it ended. Open it on this device to carry on from where it stopped.",
  ],
  carryOn: ["ここで続ける", "Carry on here"],
  look: ["終了したゲームを開く", "Open the finished game"],
  opening: ["開いています…", "Opening…"],
  retired: [
    "このゲームは、そのあと変わった版で遊ばれたので、卓をもう一度開くことはできません。誰が遊び、どう終わったかは、ここに残っています。",
    "Played on a version of this game that has since changed, so the table cannot be opened again. Who played and how it ended are kept here.",
  ],
  unreadable: [
    "この端末では、そのゲームを開けません。サイトの古い版で保存されたのかもしれません。",
    "This device cannot open that game. It may have been saved by an older version of the site.",
  ],
  replaces: [
    "この端末で、同じ種類のゲームが進んでいても、履歴に残り、そこからまた開けます。",
    "A game of this kind already going on this device stays in your history, and can be opened again from there.",
  ],
  back: ["履歴", "Your history"],
  theirs: {
    title: ["ほかの対局者の履歴から", "From another player's history"],
    whose: ["保存されている履歴：", "Kept in the history of"],
    lead: [
      "その人の端末で遊ばれ、その人の履歴に残っています。誰がどの席に座り、どう終わったかがわかります。",
      "Played on their device and kept in their history. Who sat where, and how it ended.",
    ],
    back: ["その人の対局", "Their games"],
  },
} as const satisfies JaOverlay<typeof KEPT_COPY>;

export const CARD_TABLE_COPY_JA = {
  howMany: ["何人で遊びますか？", "How many are playing?"],
  length: ["どのくらいの長さにしますか？", "How long?"],
  seats: ["席", "Seats"],
  person: ["人", "Person"],
  computer: ["コンピュータ", "Computer"],
  onePerson: ["どの卓にも、人が必要です。少なくとも1つの席は自分の席にしてください。", "Every table needs a person: at least one seat has to be yours."],
  start: ["はじめる", "Start"],
  kept: ["このブラウザーに保存されています。離れて戻ってきても、ここにあります。", "Saved in this browser: leave and come back, and it is here."],
  passTo: ["{0}さんに端末を渡してください", "Pass the device to {0}"],
  passNote: ["その人が受け取るまで、誰の札も表示されません。", "Nobody's cards are shown until they have it."],
  ready: ["{0}です。自分の札を表示", "I am {0}: show my cards"],
  yourHand: ["自分の手札", "Your hand"],
  handOf: ["{0}の手札", "{0}'s hand"],
  thinking: ["{0}が考えています…", "{0} is thinking…"],
  over: ["ゲーム終了", "Game over"],
  won: ["{0}の勝ちです。", "{0} won."],
  again: ["同じ卓でもう一度", "Play again, same table"],
  keepTurning: ["めくり続ける", "Keep turning"],
  stopTurning: ["止める", "Stop turning"],
  soundOn: ["カードの音をオン", "Card sound on"],
  soundOff: ["カードの音をオフ", "Card sound off"],
  cards: ["{0}枚", "{0} cards"],
  computerTag: ["コンピュータ", "computer"],
  scores: ["得点", "Scores"],
  lead: [
    "1台のスマホやタブレットを囲んで遊ぶ、{0}です。どの席も、人でもコンピュータでもかまいません。ここでは評価されず、このブラウザー以外には保存されません。",
    "{0} round one phone or tablet, with a person or a computer in every seat. Nothing here is rated or saved anywhere but this browser.",
  ],
  play: ["遊ぶ →", "Play →"],
  card: ["この端末でカード", "Cards on this device"],
  about: ["{0}について：規則と、同じ系統のゲーム", "About {0}: its rules and its family"],
  idleDetail: [
    "この卓では、2〜3分、何も動いていません。ここに時計はなく、ゲームはただ待っています。",
    "Nothing has moved at this table for a couple of minutes. There is no clock here, and the game simply waits.",
  ],
  idleKept: [
    "このゲームは、このブラウザーに保存されています。戻ってきたとき、ここにあります。",
    "This game is saved in this browser. It will be here when you come back.",
  ],
} as const satisfies JaOverlay<typeof CARD_TABLE_COPY>;

export const ONLINE_COPY_JA = {
  where: ["どこで遊びますか？", "Where are you playing?"],
  here: ["この端末", "This device"],
  several: ["複数の端末", "Several devices"],
  hereNote: ["1台のスマホやタブレットを、卓で回します。", "Pass one phone or tablet round the table."],
  severalNote: [
    "全員が、自分のスマホやパソコンで遊びます。仲間を招くか、リンクを送るか、席をコンピュータに任せます。",
    "Everybody plays on their own phone or computer. Invite a buddy, send a link, or give a seat to a computer.",
  ],
  seats: ["席の割り当て", "Who sits where"],
  you: ["あなた", "You"],
  link: ["リンクを知っている誰でも", "Anyone with the link"],
  computer: ["コンピュータ", "Computer"],
  computerLabel: {
    by: 0,
    is: { Computer: ["コンピュータ", "Computer"] },
    other: ["コンピュータ：{0}", "Computer: {0}"],
  },
  buddyLabel: ["仲間：{0}", "Buddy: {0}"],
  keptNote: {
    by: 0,
    is: {
      true: [
        "サイトに保存され、全員の「対局中」で待ちます。ここでは評価されません。",
        "Kept on the site: it waits in everybody's \"My games\", and nothing here is rated.",
      ],
    },
    other: [
      "先に仲間を追加してください。13歳未満の会員は、ほかの席を、自分の仲間リストの人で埋めます。",
      "Add buddies first: a member under 13 fills the other seats with people from their own buddy list.",
    ],
  },
  start: ["オンラインのゲームをはじめる", "Start online game"],
  starting: ["はじめています…", "Starting…"],
  couldNotStart: ["ゲームをはじめられませんでした。", "The game could not be started."],
  tenkaLead: [
    "2〜6人で1台のスマホやタブレットを囲んで遊ぶ、天下です。世界を1領土ずつ取り、次の人へ回します。または「複数の端末」を選ぶと、全員が自分の端末で遊べます。ここでは評価されません。",
    "Tenka for two to six people round one phone or tablet: take the world a territory at a time, then pass it on. Or choose \"Several devices\" and everybody plays on their own device. Nothing here is rated.",
  ],
  trainLead: [
    "2〜8人で1台のスマホやタブレットを囲んで遊ぶ、メキシカントレインです。どの席にもコンピュータを座らせられます。手札は秘密で、番と番のあいだ、卓が自分の手札を覆います。または「複数の端末」を選ぶと、全員が自分の端末で遊べ、見えるのは自分のドミノだけです。ここでは評価されません。",
    "Mexican Train for two to eight round one phone or tablet, with a computer in any seat you like. Hands are secret, and the table covers yours between turns. Or choose \"Several devices\" and everybody plays on their own device, seeing only their own tiles. Nothing here is rated.",
  ],
  title: ["オンライン卓", "Online table"],
  lead: [
    "全員が、自分の端末で遊びます。動かせるのは、いま番の席だけで、ほかの全員には、その手が届いて見えます。",
    "Everybody plays on their own device. Only the seat whose turn it is can move, and everybody else sees the move arrive.",
  ],
  seatsHeading: ["参加者", "Players"],
  yours: ["（あなた）", "(you)"],
  openSeat: ["空席", "Open seat"],
  openNote: ["誰かがリンクを開くのを待っています。", "Waiting for somebody to open its link."],
  computerSeat: ["コンピュータ", "Computer"],
  yourTurn: ["あなたの番です。", "Your turn."],
  waitingOn: ["{0}を待っています。", "Waiting on {0}."],
  waitingOpen: ["誰かが空席に座るのを待っています。", "Waiting for somebody to take the open seat."],
  sending: ["送っています…", "Sending…"],
  computerThinking: ["{0}が、このブラウザーの中で考えています…", "{0} is thinking, in this browser…"],
  sendLink: [
    "空席に座ってほしい人に、このリンクを送ってください。サインインして開いた人が、その席に座ります。",
    "Send this link to whoever you want in the open seat. Whoever opens it, signed in, takes it.",
  ],
  linkMessage: ["{0}の卓に座りませんか：{1}", "Sit at my table of {0}: {1}"],
  leave: ["卓を離れる", "Leave the table"],
  leaveConfirm: ["離れますか？あなたの席は、ほかの人のために空きます。", "Leave? Your seat opens for somebody else."],
  leaveYes: ["はい、離れます", "Yes, leave"],
  end: ["卓を終える", "End the table"],
  endConfirm: ["勝者なしで、全員のために卓を終えますか？", "End the table for everybody, with nobody winning?"],
  endYes: ["はい、終えます", "Yes, end it"],
  keep: ["続ける", "Keep playing"],
  ended: {
    by: 0,
    is: { null: ["この卓は終了しました。勝者はいません。", "This table was ended. Nobody won."] },
    other: ["{0}がこの卓を終了しました。勝者はいません。", "{0} ended this table. Nobody won."],
  },
  idleDetail: [
    "あなたの番ですが、2〜3分、何も起きていません。この卓に時計はなく、あなたを待っているだけです。",
    "It is your turn and nothing has happened for a couple of minutes. There is no clock at this table, and it simply waits for you.",
  ],
  idleKept: [
    "この卓はサイトに保存されています。戻ってきたとき、いつでも「対局中」にあります。",
    "This table is kept on the site. It is in \"My games\" whenever you come back.",
  ],
  paused: [
    "何も起きていないので、手の確認を止めました。画面のどこかをタップすると、確認を再開します。",
    "Stopped checking for moves while nothing was happening. Tap anywhere to check again.",
  ],
  full: ["リンクを開く前に、その席は、ほかの人に取られました。", "That seat was taken before you opened its link."],
  over: ["その卓は終了しました。", "That table is over."],
  refused: ["その席には座れませんでした：", "You could not take that seat:"],
  about: ["ゲームと規則について", "About the game and its rules"],
  myHeading: ["オンライン卓", "Online tables"],
  myHint: ["複数の端末で遊ぶパーティーゲームです。自分の番が先に並びます。", "Party games on several devices. Your move comes first."],
  myFinishedHeading: ["終了した卓", "Finished tables"],
  myFinishedHint: ["座った、新しい順の20のパーティー卓です。", "The newest twenty party tables you sat at."],
  myYourMove: ["あなたの番", "Your move"],
  myTheirMove: ["{0}の番", "{0}'s move"],
  myOpen: ["空席を待っています", "Waiting for the open seat"],
  myNone: ["オンライン卓はありません。", "No online tables."],
  myNoneFinished: ["終了した卓は、まだありません。", "No tables finished yet."],
  myFind: ["パーティーゲームを探す", "Find a party game"],
  myOpenTable: ["開く", "Open"],
  retiredTable: {
    by: 0,
    is: {
      true: [
        "このゲームは、そのあと変わった版で始まったので、表示も続行もできません。卓にいる誰でも、終えるか、離れられます。",
        "This game was started on a version of the game that has since changed, so it cannot be shown or played on. Anybody at the table can end it, or leave it.",
      ],
    },
    other: [
      "このゲームは、そのあと変わった版で始まったので、表示も続行もできません。誰が座り、どう終わったかは、ここに表示されます。",
      "This game was started on a version of the game that has since changed, so it cannot be shown or played on. Who sat at it and how it ended are shown here.",
    ],
  },
  myRetired: ["古い版のゲームで始まったので、続けられません：", "Started on an older version of the game, so it cannot be played on:"],
  myLook: ["見る", "Look"],
  result: {
    won: ["あなたの勝ちです。", "You won."],
    shared: ["勝ちを分け合いました。", "You shared the win."],
    lost: ["ほかの人の勝ちです。", "Somebody else won."],
    ended: ["終了：勝者なし。", "Ended, nobody won."],
  },
} as const satisfies JaOverlay<typeof ONLINE_COPY>;
