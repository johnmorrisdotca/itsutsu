import type { JaOverlay } from "../copyTable";

import type { PARTY_TABLE_WORDS } from "../../party/partyTableWords";
import type { SugorokuKind } from "../../party/sugoroku/sugoroku.constants";

/**
 * What the backgammon games' and the family card games' tables say of
 * themselves on their rules pages, in Japanese: the rest of the overlay of
 * `PARTY_TABLE_WORDS` (`party.ja.tableWords.constants.ts` has the other
 * party games). The buttons are the words the tables show in Japanese:
 * 「出す」, 「パス」, 「渡す」, 「聞く」, 「引く」, 「捨てる」, 「ノック」, 「ニル」.
 */

/** What every family card game says of a table shared by two or more people, and of the red cards. */
const SHARED = [
  "2人以上が1台を使うときは、番と番のあいだ、卓が、名前を挙げて、端末を回すよう求め、その人が受け取ったと言うまで、誰の札も表示しません。1人とコンピュータだけの卓では、求めません。ほかの手札は、すべて伏せて描かれます。赤い札には、縁の内側に細い赤い線が付いていて、色だけで見分ける必要がありません。評価はされず、このブラウザー以外には保存されません。",
  "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that person says they have it. A table of one person and computers never asks. Every other hand is drawn face down. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
] as const;

const SHARED_TWO = [
  "2人が1台を使うときは、番と番のあいだ、卓が、名前を挙げて、端末を回すよう求め、その人が受け取ったと言うまで、誰の札も表示しません。1人でコンピュータと遊ぶときは、求めません。",
  "When two people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that person says they have it. One person against the computer never asks.",
] as const;

/** The opening of a turn line, and the way a hand is played, which most of the family share. */
const HAND =
  "手札は卓の手前に並びます。札をタップして選び（札が持ち上がります）、その手のボタンを押します。または、札を卓へドラッグします。その札でできることが1つだけのときは、札を2回タップすると、すぐに出せます。コンピュータは、番が来ると、少しあとに、自分で自分の席を打ちます。";
const HAND_BACK =
  "Your hand is along the foot of the table. Tap a card to choose it (it rises), then press the button for the play, or drag it onto the table, or, where that is the only thing it can do, tap a card twice to play it at once. A computer plays its own seat by itself, a moment after its turn comes.";

const SUGOROKU_TURN = [
  "盤の上の行に、誰の番か、何をするかが表示されます。「サイコロを振る」を押すと、サイコロが振られて盤に表示され、使った目は薄くなります。自分のチェッカーをタップすると、行けるポイントが光ります。1つをタップして動かすか、チェッカーをドラッグします。バーにあるチェッカーが先です。「終わり」を押すまでは、1手ずつ戻せます。サイコロを振る前に、キューブが自分のものか、中央にあるときは、「ダブル」ボタンで提案できます。相手は、「テイク」か「ドロップ」を押します。",
  "The line over the board says whose turn it is and what to do. Press \"Roll the dice\" and they are rolled for you and shown on the board, a die dimmed as it is used. Tap one of your checkers and the points it may go to light up, then tap one to move it there, or drag the checker. A checker on the bar goes first. You may take the turn back, move by move, until you press \"Done\". Before you roll, with the cube yours or in the middle, a \"Double\" button offers it, and the other side then presses \"Take\" or \"Drop\".",
] as const;

const SUGOROKU_HOUSE = [
  "2人で、1台を囲んでも、2台で、それぞれ自分のスマホやパソコンで遊んでもかまいません。または、2番目の席にコンピュータを座らせ、4つの強さから選びます：初心者、気軽、慎重、強い。盤は、スマホでは縦長に、パソコンでは横長に表示され、ここのどのゲームにもある「盤だけ表示」モードもあります。",
  "Two play, round one device or on two, each on their own phone or computer. Or put the computer in the second seat at one of four strengths: beginner, casual, careful, strong. The board stands up on a phone and lies across on a desk, and there is a \"Just the board\" mode, as there is for every game here.",
] as const;

const SUGOROKU_MORE = [
  [
    "サイコロはゲーム自身のものです。ゲームは始まるときにシードを与えられ、すべての出目は、そのシードが作るサイコロの次の目です。ブラウザーに保存されたゲームは、読み戻すと、もとと同じ出目を出します。2台で遊ぶときは、サイトがすべての手をルールと、すべての出目をシードと照らし合わせます。シードはゲームとともに保存されるので、保存されたテキストを探す人は、先を見られます。卓は、その人に何も隠しません。",
    "The dice are the game's own: each game is given a seed when it starts, every roll is the next of the dice that seed makes, and a game kept in the browser rolls what it rolled when it is read back. On two devices the site checks every move against the rules and every roll against the seed. The seed is stored with the game, so a person who goes looking in the stored text could look ahead, and the table keeps no secret from them.",
  ],
  [
    "1つの番は、記録の1手で、振ったサイコロと、動かしたチェッカーが、標準の表記（24/18 13/11、bar/22*、6/off）で書かれます。評価はされず、順位表にも数えられません。",
    "A turn is one move on the record: the dice as rolled and the checkers played, in the standard notation (24/18 13/11, bar/22*, 6/off). Nothing is rated, and no ladder counts a game.",
  ],
  [
    "あきらめると、その局面で最大にかかる点でゲームが終わります。自分のチェッカーを1個でもベアオフしていれば、シングルゲーム、していなければギャモンで、相手がまだ自分のチェッカーをヒットできるなら、バックギャモンです。",
    "Giving up ends the game at the most the position could cost: a single game once you have borne a checker off, otherwise a gammon, or a backgammon where the other side could still hit a checker of yours.",
  ],
] as const;

const SUGOROKU_ONE = { turn: SUGOROKU_TURN, house: SUGOROKU_HOUSE, more: SUGOROKU_MORE } as const;

export const PARTY_TABLE_WORDS_JA_SUGOROKU = {
  backgammon: SUGOROKU_ONE,
  backgammonRace: SUGOROKU_ONE,
  antiBackgammon: SUGOROKU_ONE,
  nackgammon: SUGOROKU_ONE,
  longGammon: SUGOROKU_ONE,
  hypergammon: SUGOROKU_ONE,
  tabula: SUGOROKU_ONE,
} as const satisfies Record<SugorokuKind, unknown>;

export const PARTY_TABLE_WORDS_JA_CARDS = {
  hearts: {
    turn: [
      `卓の上の行に、誰の番かが、名前で表示されます。${HAND}札を渡すときは、3枚を選んで「渡す」を押します。`,
      `The line over the table says whose turn it is, by name. ${HAND_BACK} When passing, choose three cards and press \"Pass\".`,
    ],
    house: SHARED,
    more: [
      [
        "コンピュータは、自分からムーンシュートを狙うことはありませんが、こちらがムーンシュートを決めれば、26点を加算されます。",
        "The computer never tries to shoot the moon, though it will be charged the twenty-six if you do.",
      ],
    ],
  },
  bigTwo: {
    turn: [
      `卓の上の行に、誰の番かが、名前で表示されます。${HAND}ペアや5枚の役を出すときは、そのすべての札を選んでから「出す」を押します。「パス」を押すと、その場をあきらめます。`,
      `The line over the table says whose turn it is, by name. ${HAND_BACK} Choose every card of a pair or a five-card hand before pressing \"Play\", and \"Pass\" gives up the trick.`,
    ],
    house: SHARED,
    more: [
      [
        "毎回の配りは、配られたなかでいちばん弱い札を持つ人から始まり、前の配りの勝者からではありません。",
        "The lowest card dealt leads every deal, not the winner of the deal before.",
      ],
    ],
  },
  president: {
    turn: [
      `卓の上の行に、誰の番かが、名前で表示されます。${HAND}ペアやそれ以上の組を出すときは、そのすべての札を選んでから「出す」を押します。「パス」を押すと、その場をあきらめます。札を渡すときは、選んで「渡す」を押します。`,
      `The line over the table says whose turn it is, by name. ${HAND_BACK} Choose every card of a pair or a set before pressing \"Play\", and \"Pass\" gives up the trick. When handing cards over, choose them and press \"Give\".`,
    ],
    house: SHARED,
  },
  goFish: {
    turn: [
      "卓の上の行に、誰の番かが、名前で表示されます。手札の札をタップして数字を選び、聞く相手をタップします。または、相手を選んで「聞く」を押します。聞いたことと答えは、声に出して言ったとおりに、卓の下に書かれます。",
      "The line over the table says whose turn it is, by name. Tap a card in your hand to choose its rank, then tap the person to ask, or choose them and press \"Ask\". Everything asked and answered is written under the table, as it would be said aloud.",
    ],
    house: SHARED,
  },
  crazyEights: {
    turn: [
      `卓の上の行に、誰の番かが、名前で表示されます。${HAND}8では、宣言するスートを聞かれます。出せないときは「引く」を押し、引いた札も出せなければ「パス」を押します。`,
      `The line over the table says whose turn it is, by name. ${HAND_BACK} An eight asks which suit to call. Press \"Draw\" when you cannot play, and \"Pass\" when the card you drew cannot be played either.`,
    ],
    house: SHARED,
    more: [
      [
        "引けるのは、出せる札がないときだけで、1枚ずつです。引いた札が合えば、出してもかまいません。",
        "You may draw only when you cannot play, one card at a time, and may play the card you drew if it matches.",
      ],
      ["最初に出す人は、ハンドごとに、卓を1席ずつ回ります。", "The first person to play moves one seat round the table each hand."],
    ],
  },
  spades: {
    turn: [
      "卓の上の行に、誰の番か、そのパートナーが誰かが、名前で表示されます。ビッドするには、手札の下の「ニル」か、トリックの数を押します。そのあと、手札は卓の手前に並びます。札をタップして選び（札が持ち上がります）、「出す」を押します。または、札を卓へドラッグします。または、札を2回タップして、すぐに出します。コンピュータは、番が来ると、少しあとに、自分で自分の席を打ちます。名前の横に、ビッドした数と、取ったトリックの数が表示されます。",
      "The line over the table says whose turn it is, by name, and who their partner is. To bid, press \"Nil\" or a number of tricks under your hand. Then your hand is along the foot of the table: tap a card to choose it (it rises) and press \"Play\", or drag it onto the table, or tap a card twice to play it at once. A computer plays its own seat by itself, a moment after its turn comes. Beside each name is what they bid and how many tricks they have taken.",
    ],
    house: SHARED,
    more: [
      [
        "パートナーは、1番目と3番目の席の組が、2番目と4番目の席の組と戦い、誰でもコンピュータにできます。",
        "Partners are the first and third seats against the second and fourth, and any of them may be a computer.",
      ],
      [
        "ブラインドニルも、ボーナスのある10トリックのビッドもありません。ビッドは、ニルか1から13で、上のとおりに得点します。",
        "There is no blind nil, and no bid of ten tricks for a bonus: a bid is nil or one to thirteen, scored as above.",
      ],
    ],
  },
  ginRummy: {
    turn: [
      "卓の上の行に、誰の番かが、名前で表示されます。「山札から引く」を押すか、「取る」を押して、捨て札の札を拾います。そのあと、手札の札をタップして選び（札が持ち上がります）、「捨てる」を押します。または、札を2回タップして、すぐに捨てます。デッドウッドが10点以下なら、代わりに「ノック」を押します（デッドウッドがないときは「ジン！」と表示されます）。いちばん良い場合のデッドウッドは、卓に書かれます。コンピュータは、番が来ると、少しあとに、自分で自分の席を打ちます。",
      "The line over the table says whose turn it is, by name. Press \"Draw from the stock\", or \"Take\" to pick up the card on the discard pile. Then tap a card in your hand to choose it (it rises) and press \"Throw\", or tap it twice to throw it at once. With ten or fewer points of deadwood, press \"Knock\" instead (it reads \"Gin!\" with none). Your deadwood at its best is written on the table. A computer plays its own seat by itself, a moment after its turn comes.",
    ],
    house: [
      `${SHARED_TWO[0]}もう1つの手札は伏せて描かれ、卓が、すべての手札のメルドを計算して、いちばん良い組み合わせを広げてくれます。赤い札には、縁の内側に細い赤い線が付いていて、色だけで見分ける必要がありません。評価はされず、このブラウザー以外には保存されません。`,
      `${SHARED_TWO[1]} The other hand is drawn face down, and the table works out every hand's melds for you, laying down the best. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.`,
    ],
    more: [
      [
        "各ハンドの最初の人は、山札か表の札から、ふつうに引くだけです。最初の表の札を差し出す手順は、ありません。最初の人は、ハンドごとに交代します。",
        "The first person of each hand simply draws, from the stock or the upcard: there is no offering of the first upcard. The first person alternates hand by hand.",
      ],
      [
        "ノックされたら、まず相手のメルドが広げられ、そのあと、ノックした人のメルドに合う札が、そこに付け足されます。ボックス、ライン、ゲームのボーナスはなく、得点は各ハンドの点で、合計に最初に届いた人の勝ちです。",
        "When a knock is laid down, the other person's melds are laid first and then whatever fits the knocker's melds is laid off onto them. There are no box, line or game bonuses: the score is the hands' points, and the first to the total wins.",
      ],
    ],
  },
  euchre: {
    turn: [
      "卓の上の行に、誰の番か、そのパートナーが誰かが、名前で表示されます。切り札を決めるあいだは、「切り札にする」（配る人は「取る」）か「パス」を押し、2周目は、スートの「指定」ボタンか「パス」を押します。札を取った配る人は、1枚を選んで「捨てる」を押します。そのあと、札をタップして選び（札が持ち上がります）、「出す」を押すか、札を卓へドラッグするか、札を2回タップして、すぐに出します。切り札と、それを決めた人は、卓に書かれます。コンピュータは、番が来ると、少しあとに、自分で自分の席を打ちます。",
      "The line over the table says whose turn it is, by name, and who their partner is. While trumps are made, press \"Order up\" (\"Pick up\", for the dealer) or \"Pass\", and in the second round a \"Call\" button for a suit, or \"Pass\". A dealer who picked the card up chooses one card and presses \"Throw away\". Then tap a card to choose it (it rises) and press \"Play\", drag it onto the table, or tap it twice to play it at once. Trumps, and who made them, are written on the table. A computer plays its own seat by itself, a moment after its turn comes.",
    ],
    house: [
      `${SHARED[0].replace("ほかの手札は、すべて伏せて描かれます。赤い札", "ほかの手札は、すべて伏せて描かれ、自分の手札は、切り札が最後に来るよう並べ替えられ、レフトバウアーも切り札に含まれます。赤い札")}`,
      `${SHARED[1].replace("Every other hand is drawn face down. A red card", "Every other hand is drawn face down, and your hand is sorted with trumps last, the left bower among them. A red card")}`,
    ],
    more: [
      [
        "全員が2周目もパスしたときは、配る人が切り札を必ず指定します（スティック・ザ・ディーラー）。そのため、どのハンドも必ず遊ばれます。",
        "The dealer must name trumps if everybody passes in the second round (stick the dealer), so every hand is played.",
      ],
      [
        "1人勝負（ゴーイング・アローン）はありません。どのハンドも4人全員で遊び、5つのトリックをすべて取ると2点です。",
        "There is no going alone: every hand is played by all four, and taking all five tricks scores two.",
      ],
    ],
  },
  cribbage: {
    turn: [
      "卓の上の行に、誰の番かが、名前で表示されます。まず、2枚を選び（札が持ち上がります）、「クリブに置く」を押します。そのあとのペギングでは、札をタップして「出す」を押すか、札を卓へドラッグするか、札を2回タップして、すぐに出します。合計の数と、各札の得点は卓に書かれ、出せないときは、「ゴー」が自動で宣言されます。ペギングのあと、両方の手札とクリブが、卓の上に表示され、数えられます。コンピュータは、番が来ると、少しあとに、自分で自分の席を打ちます。",
      "The line over the table says whose turn it is, by name. First choose two cards (they rise) and press \"Lay to the crib\". Then, in the pegging, tap a card and press \"Play\", drag it onto the table, or tap it twice to play it at once. The count and what each card scored are written on the table, and a go is called for you when you cannot play. After the pegging, both hands and the crib are shown and counted on the table. A computer plays its own seat by itself, a moment after its turn comes.",
    ],
    house: [
      `${SHARED_TWO[0]}もう1つの手札は伏せて描かれ、卓が、すべてのショーを数えてくれます。赤い札には、縁の内側に細い赤い線が付いていて、色だけで見分ける必要がありません。評価はされず、このブラウザー以外には保存されません。`,
      `${SHARED_TWO[1]} The other hand is drawn face down, and the table counts every show for you. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.`,
    ],
    more: [
      [
        "最初は1番目の席が配り、配る人はハンドごとに交代します。得点は、盤の上のペグでなく、名前の横の数字で記録されます。",
        "Seat one deals first, and the deal passes each hand. The score is kept as numbers beside each name rather than pegs on a board.",
      ],
      [
        "手で申告するものはありません。15、ペア、ラン、ゴー、ショーは、すべて自動で数えられるので、相手が数え忘れた点を取る「マギンズ」もありません。",
        "Nothing is claimed by hand: every fifteen, pair, run, go and show is counted for you, so there is no muggins, taking points a person missed.",
      ],
    ],
  },
  ohHell: {
    turn: [
      "卓の上の行に、誰の番かが、名前で表示されます。ビッドするには、手札の下のトリックの数を押します。配る人がビッドできない数は、表示されません。そのあと、札をタップして選び（札が持ち上がります）、「出す」を押すか、札を卓へドラッグするか、札を2回タップして、すぐに出します。めくった札、つまり切り札は卓にあり、名前の横には、ビッドした数と、取った数が表示されます。コンピュータは、番が来ると、少しあとに、自分で自分の席を打ちます。",
      "The line over the table says whose turn it is, by name. To bid, press a number of tricks under your hand, and the one the dealer may not bid is not offered. Then tap a card to choose it (it rises) and press \"Play\", drag it onto the table, or tap it twice to play it at once. The turned card, and so trumps, sit on the table, and beside each name is what they bid and how many they have taken. A computer plays its own seat by itself, a moment after its turn comes.",
    ],
    house: [
      `${SHARED[0].replace("ほかの手札は、すべて伏せて描かれます。赤い札", "ほかの手札は、すべて伏せて描かれ、自分の手札は、切り札が最後に来るよう並べ替えられます。赤い札")}`,
      `${SHARED[1].replace("Every other hand is drawn face down. A red card", "Every other hand is drawn face down, and your hand is sorted with trumps last. A red card")}`,
    ],
    more: [
      [
        "最初は1番目の席が配り、配る人は、毎回左へ移ります。手札は、3人でも4人でも、7枚までです。",
        "Seat one deals first, and the deal passes to the left each time. Hands go no higher than seven cards, at three people as at four.",
      ],
      [
        "ビッドを果たすと、10点とビッドの数が入り、外れると0点です。外れて点を引かれることはなく、0のビッドに、10点以上のボーナスはありません。",
        "A made bid scores ten and the bid, and a missed one nothing: no points are taken away for missing, and there is no bonus for a bid of none beyond its ten.",
      ],
    ],
  },
  war: {
    turn: [
      "卓の上の行に、何ターン目か、ゲームが最大で何ターン続くかが表示されます。「札をめくる」を押すと、2枚の一番上の札が同時にめくられ、卓の下の行に、それぞれが何で、誰が取ったかが表示されます。「めくり続ける」を押すと、ゲームが終わるか「止める」を押すまで、ターンが自動で次々に進みます。コンピュータは、自分の札を自分でめくるので、コンピュータ2人の卓は、ひとりでに進みます。",
      "The line over the table says which turn it is and how many the game may last. Press \"Turn the cards over\" and both top cards are turned up at once, and a line under the table says what each was and who took them. Press \"Keep turning\" to let the turns come by themselves, one after another, until the game ends or you press \"Stop turning\". A computer turns its own cards, so a table of two computers plays itself.",
    ],
    house: [
      "手札を持つ人も、隠すものもないので、番と番のあいだに端末を回すことはありません。2つの山は、卓の両端に、枚数とともに伏せて置かれ、各ターンの札は、その間に置かれます。赤い札には、縁の内側に細い赤い線が付いていて、色だけで見分ける必要がありません。評価はされず、このブラウザー以外には保存されません。",
      "Nobody holds a hand and nothing is hidden, so the device is never passed between turns: the two piles lie face down at each end of the table with their counts, and each turn's cards lie between them. A red card carries a fine red line inside its edge, so colour is never the only sign of it. Nothing is rated or kept anywhere but this browser.",
    ],
    more: [
      [
        "戦争では、3枚を伏せて置きます。1枚の卓もありますが、多くの場所で、子どもたちは3枚で遊びます。",
        "A war lays three cards face down. Some tables lay one, and three is how children play it in many places.",
      ],
      [
        "勝った札は、ゲームのシードから決まる、混ぜた順に、自分の山の下に戻るので、ゲームが永遠に同じところを回ることはなく、このブラウザーから読み戻したゲームは、そのときと同じように進みます。",
        "The cards a person wins go back under their pile in a shuffled order, drawn from the game's seed, so a game cannot go round in a circle for ever, and a game read back from this browser plays out exactly as it did.",
      ],
      [
        "ターンの上限は卓ごとに決められていて、ゲームが必ず終わるようになっています。上限に達したら、札を多く持つ人の勝ちです。",
        "The turn limit is the table's own, so that a game always ends: when it runs out, the person with more cards wins.",
      ],
    ],
  },
} as const satisfies JaOverlay<Partial<typeof PARTY_TABLE_WORDS>>;
