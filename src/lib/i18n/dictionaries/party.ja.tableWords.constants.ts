import type { JaOverlay } from "../copyTable";

import type { PARTY_TABLE_WORDS } from "../../party/partyTableWords";

/**
 * What each party game's table says of itself on its rules page, in Japanese:
 * the overlay of `PARTY_TABLE_WORDS` (`src/lib/party/partyTableWords.ts`).
 *
 * The buttons a sentence names are the ones the table shows in Japanese, so a
 * reader can find them by the word on the page: 「振る」, 「出す」, 「パス」,
 * 「挑戦」 (Superghost's), 「チャレンジ」 (Hitotsu's), 「一つ！」, 「ノック」.
 */
export const PARTY_TABLE_WORDS_JA_GAMES = {
  dotsAndBoxes: {
    turn: [
      "上の行に、誰の番かが、名前、色、文字で表示されます。2つの点のあいだをタップして線を引きます。箱を閉じると、そう表示され、そのまま自分の番が続きます。",
      "The line at the top says whose turn it is, by name, colour and letter. Tap between two dots to draw a line. When you close a box it says so, and it is still your turn.",
    ],
    house: [
      "自分のものになった箱には、持ち主の色だけでなく、文字も付くので、数えるときに、2つの色を見分ける必要がありません。",
      "Every box that becomes yours carries its owner's letter as well as their colour, so nobody has to tell two colours apart in order to count.",
    ],
  },
  superghost: {
    turn: [
      "上の行に、誰の番かが、名前、色、文字で表示されます。キーボードの文字をタップして、「前に足す」か「後ろに足す」を押します。または「挑戦」を押します。挑戦されたら、頭に浮かべていた言葉を入力して、Enterを押します。ゲームが、単語リストと照らし合わせます。",
      "The line at the top says whose turn it is, by name, colour and letter. Tap a letter on the keyboard, then press \"Add before\" or \"Add after\", or press \"Challenge\". When challenged, type the word you had in mind and press Enter, and the game checks it against its word list.",
    ],
    house: [
      "サイトは、答えられた言葉を、サイト自身のリストと照らし合わせます。英語はSCOWLの単語、日本語はJMdictの読みです。リストにない言葉を答えたときは、打ち間違いでラウンドに負けるのではなく、突き返されて、もう一度答えられます。答えを思いつかないときは、「思いつきません」と言って、そのラウンドをあきらめます。それぞれの文字は、名前の横に書き出され、脱落した人は、灰色になるだけでなく、取り消し線も付きます。",
      "The site checks each word named against its own list: SCOWL's English words, and the readings of JMdict for Japanese. A word named that is not in the list is handed back to try again, instead of losing the round to a typo. Say you cannot think of one to give the round up. Each person's letters are written out beside their name, and a person who is out is struck through as well as greyed.",
    ],
  },
  mancala: {
    turn: [
      "上の行に、誰の番か、どのルールで遊んでいるかが表示されます。自分の色で丸く囲まれた、自分の穴をタップすると、種をまきます。種は1つずつ落ちていき、下の行に、最後の1つが何をしたか、もう一度まくのか、いくつ取ったのかが表示されます。",
      "The line at the top names whose turn it is and which rules are being played. Tap one of your own pits, ringed in your colour, to sow its seeds. They fall one at a time, and the line beneath says what the last one did: another turn, or how many were captured.",
    ],
    house: [
      "どの穴にもストアにも、種の数が、種そのものの横に数字で表示されるので、数える必要がありません。",
      "Every pit and store shows how many seeds it holds as a number beside the seeds themselves, so nobody has to count them.",
    ],
  },
  tenka: {
    turn: [
      "地図の下のバーに、誰の番か、次に何をするかが表示されます。「配置」、「攻撃」、「移動」、「手番を終える」の順です。領土をタップして選ぶと、行ける領土が光るので、行き先をタップします。スマホでは、攻撃先や移動元を選ぶときに、地図が寄ります。大陸の名前を地図の下でタップすると、その大陸を見られ、ピンチやスクロールで拡大し、ドラッグで見回し、「世界」を押すと全体に戻ります。海をタップすると、指先の範囲でいちばん近い領土が選ばれます。",
      "The bar under the map says whose turn it is and what comes next: Place, Attack, Fortify, End turn. Tap a territory to choose it, and the ones it can reach light up, then tap where to go. On a phone the map zooms in when you choose where to attack or move from. Tap a continent's name under the map to look at it, pinch or scroll to zoom, drag to look round, and press World to see it all again. A tap on the sea chooses the nearest territory within a fingertip.",
    ],
    house: [
      "どの領土にも、持ち主の色だけでなく、文字も付くので、数えるときに、2つの色を見分ける必要がありません。中立の部隊は灰色で、Nの文字が付きます。",
      "Every territory shows its owner's letter as well as their colour, so nobody has to tell two colours apart in order to count. The neutral army is grey, with an N.",
    ],
    more: [
      [
        "最初の部隊の数：2人のときは各自40（中立の部隊も40）、3人は各自35、4人は30、5人は25、6人は20です。最初の部隊は、すばやく始められるよう、無作為に置かれます。希望すれば、卓を順に回って、1つずつ手で置くこともできます。",
        "Starting armies: forty each for two (and forty for the neutral army), thirty-five each for three, thirty for four, twenty-five for five, twenty for six. They are placed at random, so as to start quickly, or by hand if you choose, one at a time round the table.",
      ],
      [
        "守る側は、いつも許される最大の数のサイコロを振ります。部隊が2つ以上なら2個、1つなら1個です。多く振って不利になることはないからです。サイコロは、人ではなくゲームが振り、ページを読み込み直しても、もう一度振られることはありません。すべての出目が、ゲームとともに保存されています。",
        "The defender always rolls as many dice as allowed, two with two armies or more and one with one, since rolling more never hurts a defence. The dice are rolled by the game, not by a person, and a reloaded page rolls nothing again: every die is kept with the game.",
      ],
      [
        "カードには、領土と、陸、海、空の3種類のうち1つが描かれています。自分が持つ領土を含む組を交換すると、その領土に、さらに2部隊が、すぐ置かれます。交換したカードは、山がなくなったら、山の下に戻されます。",
        "A card shows a territory and one of three kinds: land, sea or air. A set that includes a territory you hold puts two more armies straight onto that territory. Cards traded in go back under the deck once it runs out.",
      ],
      [
        "設定で「複数の端末」を選ぶと、全員が、それぞれ自分のスマホやパソコンで遊びます。仲間でも、リンクを知っている誰でも、どの席にも座れます。各自、自分のカードは表向きに、ほかの全員のカードは枚数だけが見えます。番と番のあいだ、卓は「対局中」で待っています。",
        "Choose \"Several devices\" in the set-up and each person plays on their own phone or computer: a buddy, anyone with the link, in any seat. Each sees their own cards face up and only the number of cards everybody else holds. Between turns the table waits in \"My games\".",
      ],
    ],
  },
  mexicanTrain: {
    turn: [
      "手札は秘密です。2人の番のあいだ、卓は手札を覆い、端末を誰に渡すかを表示し、その人が自分だと言うまで、見せません。ドミノを列車の端へドラッグするか、ドミノをタップしてから列車をタップします。ドミノを2回タップすると、置ける列車が1つだけのとき、そこに置けます。置ける列車は、光って見えます。置けるドミノがなければ「引く」を押し、引いたドミノを置くか、「パス」を押します。",
      "Hands are secret. Between two people's turns the table covers the hand and names who to pass the device to, and it shows nothing until that person says it is them. Drag a tile onto the end of a train, or tap the tile and then the train. Tap a tile twice to lay it on the one train it fits, when there is only one. The trains it may go on are lit. With nothing to lay, press \"Draw\", then lay the tile drawn or press \"Pass\".",
    ],
    house: [
      "各列車は、最後の数枚と、その前に置かれた枚数だけを表示するので、卓はスマホに収まり、開いている端は、いつも同じ場所にあります。マーカーが出ている列車は、列車の始まりに描かれます。ピップは、数字ごとに専用の色で描かれていて、ダブル12のセットの多くがそうであるように、9と12がひと目で見分けられます。設定では、ふつうのハウスルールが選べます。ラウンドが半分の短いゲーム、連続するダブル、自分の列車が始まってからでないと開かないメキシカントレインです。コンピュータはどの席にも座れ、ブラウザーの中で遊びます。設定で「複数の端末」を選ぶと、全員が、それぞれ自分のスマホやパソコンで遊びます。仲間でも、リンクを知っている誰でも、どの席のコンピュータでもかまいません。各自、自分のドミノだけが見え、番と番のあいだ、卓は「対局中」で待っています。",
      "Each train shows its last few tiles and how many are laid on it before them, so the table fits a phone and every open end is always where it always is. A marker out is drawn at the train's start. Pips are drawn in a colour of their own for each number, as most double-twelve sets are, so a nine and a twelve can be told apart at a glance. The set-up offers the usual house rules: a short game of half the rounds, chained doubles, and a Mexican Train that only opens once your own train has started. Computers can take any seat and play in the browser. Choose \"Several devices\" in the set-up and each person plays on their own phone or computer, a buddy, anyone with the link or a computer in any seat, and sees only their own tiles. Between turns the table waits in \"My games\".",
    ],
  },
  diceWar: {
    turn: [
      "上の行に、何ラウンド目か、直前の出目が何をしたかが表示されます。「サイコロを振る」を押すと、卓の全員が一度に振り、コンピュータの出目も、いっしょに出ます。各自の出目と合計が、それぞれの行に書かれます。最高の合計が得点し、並んだ人は丸で囲まれて「戦争」と表示され、その人たちだけが、もう一度振ります。",
      "The line at the top says which round it is and what the last roll did. Press \"Roll the dice\" and everybody at the table rolls at once, with the computers' dice coming up together with theirs. Each person's dice and their total are written in their row. The highest total scores, and those tied for it are ringed and marked \"War\", and only they roll again.",
    ],
    house: [
      "サイコロは、このサイトのDiceタブのもとになっている、オープンソースのサイコロのパッケージ、Korokoroが、端末自身の暗号用の乱数で振り、すべての出目はゲームとともに保存されるので、ページを読み込み直しても、もう一度振られることはありません。コンピュータの出目は、ゲームのシードから作られます。隠すものはなく、端末を回す必要もないので、卓の誰かが「振る」を押します。サイコロの音は、オンにするまで鳴りません。",
      "The dice are rolled by Korokoro, the open-source dice package behind the Dice tab, from your device's own cryptographic generator, and every roll is kept with the game, so a reloaded page rolls nothing again. A computer's dice come from the game's seed. Nothing is hidden, so there is no device to pass: anybody at the table presses \"Roll\". The sound of the dice is off until you turn it on.",
    ],
    more: [
      [
        "コンピュータだけの戦争は、直前の出目の少しあとに、自動で振られます。",
        "A war left to computers alone is rolled for them, a moment after the last roll.",
      ],
      [
        "何度も並び続けるラウンドは、そのまま続きます。100回の戦争のあとは、打ち切られて、誰にも点は入りません。サイコロの面が2つ以上あれば、実際には起こりません。",
        "A round that ties again and again goes on, and after a hundred wars it is called off and nobody scores, which never happens in practice with a die of two or more sides.",
      ],
    ],
  },
  yacht: {
    turn: [
      "上の行に、誰の番か、何回目に振るところかが表示されます。「振る」を押すか、サイコロのトレーをタップすると振ります。サイコロをタップするとキープされ（丸で囲まれて「キープ」と表示）、もう一度タップすると解除です。出目を書き込める欄には、それぞれ、書き込んだ場合の得点が表示されます。1つをタップして書き込むと、サイコロは次の人に渡ります。",
      "The line at the top says whose turn it is and which roll this is. Press \"Roll\", or tap the dice tray, to roll. Tap a die to keep it (it is ringed and marked \"HELD\"), and tap again to release it. Every box you could write the dice into shows what it would score. Tap one to write it down, and the dice pass on.",
    ],
    house: [
      "サイコロは、ゲームが新しい乱数のシードから振り、すべての出目はゲームとともに保存されるので、ページを読み込み直しても、もう一度振られることはありません。コンピュータはどの席にも座れ、ブラウザーの中で、卓が見ていられるよう、少しずつ遊びます。サイコロの音は、オンにするまで鳴りません。",
      "The dice are rolled by the game from a fresh random seed, and every roll is kept with the game, so a reloaded page rolls nothing again. A computer can take any seat and plays in the browser, a moment at a time so the table can watch. The sound of the dice is off until you turn it on.",
    ],
    more: [
      [
        "2つ目のヨットは、それ以上の得点になりません。ヨットの欄が埋まったあとの、5個同じ出目は、ほかの欄に、ふつうの出目として書き込みます。",
        "A second Yacht scores nothing more. Once the Yacht box is filled, five of a kind is written into another box like any other roll.",
      ],
    ],
  },
  pachisi: {
    turn: [
      "上の行に、誰の番かが表示されます。「サイコロを振る」を押して振ります。使える目が、サイコロの下に出るので、1つを選びます（動かせる最初の目は、自動で選ばれます）。そのあと、丸で囲まれた駒をタップして、その数だけ動かします。もらった20や10も、そこに加わります。2個の合計が5のときは、ボタンで、2つの目をまとめて、駒を1つ入れられます。",
      "The line at the top says whose turn it is. Press \"Roll the dice\" to roll. The values you may use appear under the dice: choose one (the first that can move is chosen for you), then tap a ringed pawn to move it that far. A 20 or a 10 you earn joins them. When the two dice add up to five, a button enters a pawn using the two together.",
    ],
    house: [
      "サイコロは、ゲームが新しい乱数のシードから振り、すべての出目はゲームとともに保存されるので、ページを読み込み直しても、もう一度振られることはありません。コンピュータはどの席にも座れ、ブラウザーの中で、卓が見ていられるよう、少しずつ遊びます。サイコロの音は、オンにするまで鳴りません。",
      "The dice are rolled by the game from a fresh random seed, and every roll is kept with the game, so a reloaded page rolls nothing again. A computer can take any seat and plays in the browser, a moment at a time so the table can watch. The sound of the dice is off until you turn it on.",
    ],
    more: [
      [
        "自分の入口のマスに入る駒は、そこにいる1つだけの相手の駒を取ります。入口のマスは、そのほかのときは安全です。",
        "A pawn entering onto its own entry square takes a lone opponent's pawn standing there, though the entry square is otherwise safe.",
      ],
      ["2人のときは、十字の向かい合う腕に座ります。", "Two people sit on opposite arms of the cross."],
    ],
  },
  hitotsu: {
    turn: [
      "卓の上の行に、誰の番か、どの色に合わせるか、順番がどちら回りかが表示されます。手札は卓の手前に並びます。札をタップして選ぶと（札が持ち上がります）、「出す」を押すか、札を2回タップして、すぐに出します。ワイルドでは、宣言する色を聞かれ、7と0のルールがオンのときの7では、手札を交換する相手を聞かれます。残り2枚になったら、出す前に「一つ！」を押します。引かされる場面では、「引き取る」を押すか、積み重ねるか、ワイルドドローフォーに「チャレンジ」を押します。コンピュータは、番が来ると、少しあとに、自分で自分の席を打ちます。",
      "The line over the table says whose turn it is, which colour to follow, and which way play is going round. Your hand is along the foot of the table. Tap a card to choose it (it rises) and press \"Play\", or tap a card twice to play it at once. A wild asks which colour to call, and a seven, with sevens and zeros on, which person to swap hands with. With two cards left, press \"Hitotsu!\" before you play. Facing a draw, press \"Take it\", or stack, or press \"Challenge\" on a Wild Draw Four. A computer plays its own seat by itself, a moment after its turn comes.",
    ],
    house: [
      "2人以上が1台を使うときは、番と番のあいだ、卓が、名前を挙げて、端末を回すよう求め、その人が受け取ったと言うまで、誰の札も表示しません。1人とコンピュータだけの卓では、求めません。どの札にも、その色の元素が角に付いていて（火は赤、土は黄、木は緑、水は青）、色だけで見分ける必要がありません。設定で「複数の端末」を選ぶと、全員が、それぞれ自分のスマホやパソコンで遊びます。仲間でも、リンクを知っている誰でも、どの席のコンピュータでもかまいません。各自、自分の手札だけが見えます。",
      "When two or more people share the device, the table asks for it to be passed on by name between turns, and shows nobody's cards until that person says they have it. A table of one person and computers never asks. Every card carries its colour's element in its corners (火 for red, 土 for yellow, 木 for green, 水 for blue), so colour is never the only sign of it. Choose \"Several devices\" in the set-up and each person plays on their own phone or computer: a buddy, anyone with the link, or a computer in any seat, each seeing only their own hand.",
    ],
    more: [
      [
        "ハウスルールは、どれも設定で選べます。公式のルールが最初です。",
        "The house rules are each a choice in the set-up, with the published rule first.",
      ],
      [
        "積み重ね：オフ（公式のルール）。同じ札（ドロー2にドロー2、ワイルドドローフォーにワイルドドローフォー）。またはどのドロー札でも（積み重ねドロー）で、ドロー2にワイルドドローフォーも、ワイルドドローフォーに、宣言した色のドロー2も出せます。積み重ねられない次の人が、合計をすべて引きます。",
        "Stacking: off (the published rule), the same card (a Draw Two on a Draw Two and a Wild Draw Four on a Wild Draw Four), or any draw card (progressive draw), with a Wild Draw Four allowed on a Draw Two too, and a Draw Two of the colour called on a Wild Draw Four. The next person who cannot stack takes the whole total.",
      ],
      [
        "割り込み：場の札とまったく同じ札（同じ色で、同じ数字か記号）を持つ人は、誰でも、自分の番でなくても出せ、遊びはその人から続きます。1人とコンピュータの卓では、ほかの手札はコンピュータのものです。",
        "Jumping in: a card identical to the one on top, the same colour and the same number or symbol, may be played out of turn by anybody holding one, and play goes on from them. At a table of one person with computers, the other hands are the computers'.",
      ],
      [
        "7と0：7を出すと、好きな相手と手札を交換し、0を出すと、全員の手札が、遊びの向きに、1つずつ渡されます。",
        "Sevens and zeros: a seven swaps your hand with a person of your choice, and a zero passes every hand on, in the direction of play.",
      ],
      [
        "出せるまで引く：出せる札が出るまで、引き続けます。1枚だけではありません。",
        "Draw until you can play: draw until a card goes, rather than just one.",
      ],
      [
        "ブラフなし：ワイルドドローフォーは、場の色の札を1枚も持っていないときだけ出せ、チャレンジはできません。",
        "No bluffing: a Wild Draw Four may be played only when you hold nothing of the colour on top, and it cannot be challenged.",
      ],
      [
        "パーティーモード：1人5枚、1ハンドだけで、積み重ね、割り込み、7と0がすべてオンです。",
        "Party mode: five cards each, one hand, with stacking, jumping in and sevens and zeros all on.",
      ],
      [
        "最初にめくる札は、いつも数字札です。アクション札やワイルドがめくれたら、山札の下に戻します。最後の1枚で出したドロー札も、次の人が引き、その人の失点になります。",
        "The first card turned up is always a number. An action card or a wild turned up goes back under the stock. A draw card played as your last card is still taken by the next person, and counts against them.",
      ],
    ],
  },
  gunjin: {
    turn: [
      "上の行に、誰の番かが表示されます。ゲームの前には、画面が、スマホを誰に渡すかを表示し、その人が自分だと押すまで、何も見せません。駒を並べるには、「シャッフル」で配置を作り、自分の駒を1つタップして、別の駒か、自分の側の空きマスをタップして、入れ替えるか移し、「配置を確定」を押します。動かすには、自分の駒をタップして、光るマスをタップします。相手の駒のいるマスへ進むと、戦います。",
      "The line at the top says whose turn it is. Before a game the screen names who to pass the phone to and shows nothing until they press that it is them. To arrange your pieces, press \"Shuffle\" for a layout, tap one of your pieces and then another piece or an empty square on your side to swap or move it, and press \"Finish setup\". To move, tap one of your pieces and then a lit square. Moving onto an enemy piece fights it.",
    ],
    house: [
      "自分の階級が画面に出るのは自分の番だけで、相手の階級は、決して出ません。動かしたあとは、スマホが覆われ、誰に渡すかが表示されます。戦いでは、何が取られたかだけが、両者に知らされます（キャプチャー・フラッグでは、規則どおり、両者の階級）。ゲームが終わると、すべての駒が表示されます。どの駒にも、色だけでなく、文字で階級が付いています。ゲームは、2人の配置と手の記録として、このブラウザーに保存されるので、タブを閉じても失われません。ページを開き直すたびに、盤はまた覆われます。設定で「複数の端末」を選ぶと、全員が、それぞれ自分のスマホやパソコンで遊びます。サーバーは両者の配置を預かり、各自には、自分の階級だけを送り、相手の側のものは決して送りません。",
      "Your ranks are on the screen only on your own turn, and the other side's never. After a move the phone is covered again and names who to pass it to. A fight tells both sides only what was taken (on Capture Flag, both ranks, as its rules say), and at the end of a game every piece is shown. Every piece carries its rank in letters as well as in colour. The game is kept in this browser as the two arrangements and the moves, so closing the tab does not lose it, and the board is covered again whenever the page is opened. Choose \"Several devices\" in the set-up and each person plays on their own phone or computer: the server keeps both arrangements and sends each person only their own ranks, never the other side's.",
    ],
    more: [
      [
        "軍人将棋と陸戦棋ミニは、盤に、司令部と安全地帯が示され、キャプチャー・フラッグは、湖に色が付きます。引き分けの申し込みはありません。ゲームは、旗、動かせる駒のない側、投了で終わります。",
        "Gunjin Shogi and Luzhanqi Mini mark their headquarters and camps on the board, and Capture Flag shades its lakes. There is no draw offer: a game ends with a flag, a side with no move, or a resignation.",
      ],
      [
        "コンピュータはいません。パッケージに入っていないので、どちらの席も人です。パッケージの5つ目のゲーム、隠し挟み将棋は、ここにはありません。",
        "There is no computer player. The package has none, so both seats are people. Hidden Hasami, the package's fifth game, is not offered here.",
      ],
    ],
  },
} as const satisfies JaOverlay<typeof PARTY_TABLE_WORDS>;
