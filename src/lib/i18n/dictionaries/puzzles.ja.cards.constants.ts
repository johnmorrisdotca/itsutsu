
/**
 * The card, tile and Solitaire screens' lines under the board, in Japanese: overlays
 * (`copyTable.ts`) of the tables in `src/components/puzzles/mahjong.constants.ts` and
 * `puzzles.constants.ts` (whose files the pictures' stamp hashes, so a translation sits
 * beside them) and of the Solitaire set-up's choices.
 */
export const MAHJONG_COPY_JA = {
  howTo: ["空いている牌をタップして、その相方をタップします。片方をもう片方へドラッグしてもかまいません。ダブルタップすると、空いている相方といっしょに取れます。", "Tap a free tile, then its match — or drag one onto the other. Double-tap takes a tile with its free match."],
  chosen: ["次は、相方です。同じ牌で、空いているものを選びます。", "Now its match: another free tile the same."],
  blocked: ["その牌は空いていません。上に何かが載っているか、左右の両側がふさがっています。", "That tile is not free: something lies on it, or it is held on both sides."],
  noMatch: ["その2枚は合いません。", "Those two do not match."],
  stuck: ["取れる空きのペアが、もうありません。牌をシャッフルするか、「元に戻す」を押してください。", "No free pair is left. Shuffle the tiles, or Undo."],
  hopeless: ["どれだけシャッフルしても、これは空きません。「元に戻す」で戻ってください。", "No shuffle can free these: Undo to go back."],
  shuffled: ["シャッフルしました。残った牌は、もとの場所に並べ直されています。", "Shuffled: the tiles left are laid again where they lay."],
  freeOn: ["空き牌を明るく", "Free tiles lit"],
  freeOff: ["ふつうの見た目", "Classic look"],
  freeBlurb: {
    on: ["動かせない牌は暗くなり、空いている牌が目立ちます。", "Blocked tiles are dimmed, so the free ones stand out."],
    off: ["本物のテーブルのように、どの牌も同じ見た目です。空いている牌は、自分で見つけます。", "Every tile looks alike, as on a real table: find the free ones yourself."],
  },
  findOn: ["探す", "Find"],
  findOff: ["探さない", "No find"],
  findBlurb: {
    on: [
      "牌を指すか選ぶと、その相方が光ります。実線の輪は、いま同時に取れるもの、破線の輪は、まだ動かせないものです。",
      "Point at or choose a tile and its matches light up: a solid ring can be taken with it now, a dashed one is held.",
    ],
    off: ["相方は表示されません。自分で探します。", "Matches are not shown: look for them yourself."],
  },
  noFreeMatch: ["その牌と合う空き牌はありません。ほかのペアを示します。", "No free tile matches that one: here is another pair."],
  bonusGroup: ["どの花も、どの季節も", "Any flower, any season"],
  bonusSame: ["同じもの同士", "Identical"],
  bonusBlurb: {
    group: ["ふつうのルールです。どの花牌も、ほかの花牌と、どの季節牌も、ほかの季節牌と組めます。", "The usual rule: any flower takes any flower and any season any season."],
    same: ["花牌と季節牌は、同じものが2枚ずつあり、その相方としか組めません。", "Flowers and seasons come in identical pairs, and match only their twin."],
  },
  tableLead: ["2人から4人が、1つの配置を、1回に1組ずつ取りながら順番に遊びます。三元牌と風牌が、いちばん高得点です。", "Two to four take turns on one layout, a pair a turn; dragons and winds score most."],
} as const;

export const FREECELL_COPY_JA = {
  howTo: ["カードをドラッグするか、タップしてから置き場所をタップします。カードを2回タップすると、ホームへ送れます。", "Drag a card, or tap it and then where it goes. Tap a card twice to send it home."],
  picked: ["次に、置き場所をタップします。もう一度そのカードをタップすると、元に戻ります。", "Now tap where it goes, or tap it again to put it back."],
  cannot: ["そこには置けません。連なったカードを動かせるのは、空きセルと空の列が許す枚数までです。", "That cannot go there: a run moves only as far as the free cells and empty columns allow."],
  stuck: ["動かせるカードが、もうありません。「元に戻す」を押すか、配り直してください。", "No move is left: no card can go anywhere. Undo, or deal again."],
  finishing: ["残りのカードは、すべてホームへ置けます。自動で送っています。", "Every card left can go home: they are going."],
} as const;

export const SPIDER_COPY_JA = {
  howTo: ["カードをドラッグするか、タップしてから置く列をタップします。カードを2回タップすると、いちばん合う場所へ動きます。", "Drag a card, or tap it and then the column it goes on. Tap a card twice to move it where it fits best."],
  picked: ["次に、置く列をタップします。もう一度そのカードをタップすると、元に戻ります。", "Now tap the column it goes on, or tap it again to put it back."],
  cannot: [
    "そこには置けません。カードは、1つ大きい数のカードの上に置けます。連なりを動かせるのは、すべて同じマークのときだけです。",
    "That cannot go there: a card goes on one a rank higher, and a run moves only if it is all one suit.",
  ],
  cannotDeal: ["列が空のあいだは、山札から配れません。", "The stock cannot deal while a column is empty."],
  stuck: ["動かせるカードが、もうありません。「元に戻す」を押すか、配り直してください。", "No move is left. Undo, or deal again."],
  finishing: ["すべてのカードが表になりました。残りは、順番に並べています。", "Every card is showing: the rest are being put in order."],
  dealsLeft: {
    by: 0,
    is: { "0": ["山札は、すべて配りました。", "The stock is dealt."] },
    other: ["山札には、あと{0}回、配る分があります。", "{0} deals left in the stock."],
  },
} as const;

export const SOLITAIRE_COPY_JA = {
  howTo: ["カードをドラッグするか、タップしてから置き場所をタップします。カードを2回タップすると、ホームへ送れます。", "Drag a card, or tap it and then where it goes. Tap a card twice to send it home."],
  picked: ["次に、置き場所をタップします。もう一度そのカードをタップすると、元に戻ります。", "Now tap where it goes, or tap it again to put it back."],
  cannot: ["そのカードは、そこには置けません。", "That card cannot go there."],
  stuck: ["動かせるカードが、もうありません。山札は使い切られ、どのカードも置き場所がありません。配り直して続けてください。", "No move is left: the stock is spent and no card can go anywhere. Deal again to play on."],
  finishing: ["すべてのカードが表になりました。残りは、ホームへ送っています。", "Every card is face up: the rest are going home."],
  passesLeft: {
    by: 0,
    is: {
      Infinity: ["山札は、何回でもめくれます。", "Turn the stock as often as you like."],
      "0": ["山札をめくるのは、これが最後の1周です。", "Last time through the stock."],
    },
    other: ["この後、山札をあと{0}周、めくれます。", "{0} more times through the stock after this."],
  },
} as const;

/** The Solitaire set-up's two choices: the kind of deal, and how the score is kept. The names beside their kanji are the kanji for a Japanese reader, except where the kanji alone says too little. */
export const SOLITAIRE_OPTIONS_JA = {
  deals: {
    winnable: { label: ["勝てる配り", "Winnable deals"], says: ["どの配りも、このサイトの解法ですでに勝てているので、必ず勝てます。", "Every deal has already been won by our solver, so it can be won."] },
    any: { label: ["どんな配りでも", "Any deal"], says: ["本物のカードのように、混ぜたままの配りです。勝てない配りもあります。", "The shuffle as it falls, as with a real deck: some deals cannot be won."] },
  },
  scores: {
    none: { label: ["得点なし", "No score"], says: ["時計と手数だけです。", "Just the clock and the count of moves."] },
    standard: {
      label: ["標準", "Standard"],
      says: ["ホームへ1枚で10点、捨て札から列へ移すときと、カードを表にしたときに5点です。速いほどボーナスがつきます。", "10 a card home, 5 from the waste to a column and for a card turned over; a bonus for speed."],
    },
    vegas: {
      label: ["ベガス", "Vegas"],
      says: ["山札を使うところで52点を失い、ホームへ1枚入るごとに5点を取り戻します。点数だけで、お金は動きません。", "52 down for the deck and 5 back for every card home: points only, never money."],
    },
  },
} as const;
