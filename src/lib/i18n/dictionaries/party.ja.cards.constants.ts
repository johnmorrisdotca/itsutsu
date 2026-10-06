import type { CardGameKind } from "../../cardGames/cardGames.constants";
import { AGENT_READ_2026_10_06 } from "../copyJa.types";

import type { PartyCopyJa } from "./party.ja.types";

/**
 * The family card games' words in Japanese (`CARD_GAME_DISPLAY`, in
 * `src/lib/cardGames/cardGames.copy.ts`), in the words the package uses for
 * the cards and the plays (`@johnmorrisdotca/toranpu`: トリック, マストフォロー,
 * ビッド, ニル, ブック, デッドウッド, ノック).
 */
const AGENT_READ = AGENT_READ_2026_10_06;

/** The two lines every partnership game says about its table, which differ only in the points offered. */
const FOUR = [
  "いつも4人で、2対2です。1人とコンピュータ3人、2人がパートナーを組んでコンピュータ2人と、または4人が1台を囲んで遊べます。",
  "Always four, two against two: one person and three computers, two people as partners against two computers, or four people round one device.",
] as const;

export const PARTY_COPY_JA_CARDS = {
  hearts: {
    tagline: [
      "ハートも、スペードのクイーンも取らないようにします。あるいは、すべて取って、ムーンシュートを決めましょう。",
      "Take no hearts and never the queen of spades, or take every one of them and shoot the moon.",
    ],
    origin: [
      "1880年代から北米で遊ばれているトリックテイキングゲームで、スペインやフランスの「レヴェルシ」に連なる、できるだけ点を取らないことを目指す系統の、最後に生まれたものです。長年、デスクトップパソコンに無料で付いていたので、多くの人がそれで覚えました。誰のものでもありません。",
      "A trick-taking game played in North America since the 1880s, the last of a family of games going back to the Spanish and French Reversis, in which the aim is to win as few points as possible. It came free with desktop computers for years, which is how most people learned it. It belongs to nobody.",
    ],
    rules: [
      [
        "3〜4人で遊びます。トランプ1組をすべて配り、1人13枚ずつです。3人のときは、先にダイヤの2を除き、1人17枚ずつ持ちます。",
        "Three or four people play. The whole pack is dealt out, thirteen each. With three, the two of diamonds is taken out first and each holds seventeen.",
      ],
      [
        "配りごとに、プレイを始める前に、全員が3枚を渡します。渡す先は、左、右、向かい、渡さない、の順に回ります（3人のときは、左、右、渡さない）。",
        "Before play in each deal, everybody passes three cards. The direction goes round as left, right, across, keep (with three: left, right, keep).",
      ],
      [
        "最初のトリックは、クラブの2から始めます。出せるなら同じスートを出し（マストフォロー）、出せなければ、何を出してもかまいません。出されたスートでいちばん強い札がそのトリックを取り、次のトリックを始めます。エースがいちばん強いです。",
        "The two of clubs leads the first trick. Follow suit if you can, and if you cannot, play anything. The highest card of the suit led takes the trick and starts the next. Aces are high.",
      ],
      [
        "取ったハートは1枚ごとに1点、スペードのクイーンは13点の失点です。最初のトリックには、点になる札は出せません。ハートは、ほかのスートの上に一度出されるまで、最初の札としては出せません。",
        "Each heart taken costs a point, and the queen of spades thirteen. No points may be played to the first trick. Hearts may not be led until one has been played on another suit.",
      ],
      [
        "1回の配りで26点をすべて取ると、ムーンシュートです。自分は0点で、ほかの全員に26点が入ります。",
        "Take all twenty-six points in one deal and you shoot the moon: you score nothing, and everybody else scores twenty-six.",
      ],
      [
        "誰かがゲームの合計点（短いゲームは50点、ふつうは100点）に達したら、いちばん点の低い人の勝ちです。",
        "When somebody reaches the game's total (50 for a short game, 100 for the usual one), the lowest score wins.",
      ],
    ],
    board: [
      "4人が昔ながらの卓で、3人でも遊べます。夜じゅう遊ぶなら100点、短くするなら50点を選びます。どの席もコンピュータにできるので、1人で、コンピュータ3人を相手に遊べます。",
      "Four is the classic table, and three works too. Choose 100 points for an evening and 50 for a quicker game. Any seat can be a computer, so one person can play against three of them.",
    ],
    review: AGENT_READ,
  },
  bigTwo: {
    tagline: [
      "場の札より大きい、同じ枚数の札を出していき、最初に手札を出し切りましょう。いちばん強いのは2です。",
      "Play bigger cards of the same number than the play on the table, and be first to play out your hand. The two is the strongest.",
    ],
    origin: [
      "中国南部が発祥の、手札を出し切るゲームで、香港、台湾、東南アジアで遊ばれ、いちばん強い札にちなんで名付けられました。十以上の名前で知られていて、誰のものでもありません。大老二（ダーラオアル、「大きな2」）は、台湾での名前です。",
      "A shedding game from southern China, played across Hong Kong, Taiwan and Southeast Asia and named for its highest card. It is known by a dozen names, and belongs to nobody. 大老二 (da lao er, \"big two\") is its name in Taiwan.",
    ],
    rules: [
      [
        "2〜4人で、1人13枚ずつ配ります。3人のときは、1人17枚ずつで、残りの1枚は、ダイヤの3を持っている人のものになります。",
        "Two to four people, thirteen cards each. With three, each holds seventeen, and the last card goes to whoever holds the three of diamonds.",
      ],
      [
        "強さは、3がいちばん弱く、2がいちばん強い順です（3 4 5 6 7 8 9 10 J Q K A 2）。同じ数字では、ダイヤ、クラブ、ハート、スペードの順に強くなり、いちばん弱い札はダイヤの3、いちばん強い札はスペードの2です。",
        "The ranks run from 3 weakest to 2 strongest (3 4 5 6 7 8 9 10 J Q K A 2), and within a rank the suits strengthen in the order diamonds, clubs, hearts, spades, so the weakest card is the three of diamonds and the strongest the two of spades.",
      ],
      [
        "配られたなかでいちばん弱い札を持っている人が先頭で、最初に出す札には、それを必ず含めます。出し方は、1枚、ペア、スリーカード、または5枚の役で、弱い順に、ストレート、フラッシュ、フルハウス、フォーカード（残り1枚は何でも）、ストレートフラッシュです。",
        "Whoever holds the weakest card dealt leads, and that first play must include it. A play is one card, a pair, three of a kind, or a five-card hand, which from weakest are a straight, a flush, a full house, four of a kind (with any fifth card) and a straight flush.",
      ],
      [
        "卓を順に回り、場の札を、同じ枚数のより強い出し方で上回るか、パスします。パスは、その場が終わるまで続きます。ほかの全員がパスしたら、最後に出した人が、好きな出し方で新しく始めます。",
        "Round the table, each beats the play on the table with a stronger play of the same number of cards, or passes. A pass holds until the trick is over. When everybody else has passed, the last to play starts afresh with any play they like.",
      ],
      [
        "最初に手札がなくなった人が、その配りの勝ちです。ほかの全員は、残った札1枚につき1点の失点で、10枚以上なら2倍、13枚以上なら3倍です。ゲームの配りがすべて終わったら、失点がいちばん少ない人の勝ちです。",
        "The first to run out of cards wins the deal. Everybody else is charged a point for each card left, double for ten or more and treble for thirteen or more. After all the game's deals, whoever has the fewest points wins.",
      ],
    ],
    board: [
      "4人がふつうの卓ですが、2人でも3人でも同じように遊べます。短くなら1回、ふつうは3回、長くなら5回の配りを選びます。",
      "Four is the usual table, and two or three play just as well. Choose one deal for a quick game, three for the usual one, and five for a long one.",
    ],
    review: AGENT_READ,
  },
  president: {
    tagline: [
      "誰よりも先に手札をなくしましょう。次のラウンドでは、大富豪が、大貧民のいちばん強い札をもらいます。",
      "Get rid of your cards before everybody else. In the next round the President takes the Beggar's best cards.",
    ],
    origin: [
      "世界中で、さまざまな名前で遊ばれている、手札を出し切るゲームで、日本では大富豪（「大金持ち」）の名前で知られています。北米の多くの卓では、このサイトが使わない名前で呼ばれています。階級の呼び名と、勝者へ渡される札が、みんなで遊ぶゲームにしています。誰のものでもありません。",
      "A shedding game played round the world under many names, known in Japan as Daifugō, 大富豪 (\"the grand millionaire\"). At many North American tables it goes by a name this site does not use. Its titles, and the cards handed up to the winner, make it a game for a group. It belongs to nobody.",
    ],
    rules: [
      [
        "3〜8人で、トランプ1組をすべて配るので、1枚多く持つ人が出ることもあります。2がいちばん強く、3がいちばん弱く、スートは関係ありません。",
        "Three to eight people, with the whole pack dealt out, so some may hold one card more. Twos are strongest and threes weakest, and suits do not matter.",
      ],
      [
        "最初の出し方は、1枚、または同じ数字の2枚、3枚、4枚です。卓を順に回り、同じ枚数で、より強い数字の札を出すか、パスします。パスは、その場が終わるまで続きます。ほかの全員がパスしたら、最後に出した人が、もう一度新しく始めます。",
        "The lead is one card, or two, three or four of one rank. Round the table, each plays the same number of cards of a stronger rank, or passes. A pass holds until the trick is over. When everybody else has passed, the last to play starts afresh.",
      ],
      [
        "最初に手札がなくなった人が大富豪、次が富豪で、最後になった人が大貧民です。最後から2番目は貧民で、その間の全員が平民です。",
        "The first to run out of cards is the President, the next the Vice-President, and the last the Beggar. The one second from last is the Vice-Beggar, and everybody in between is a Citizen.",
      ],
      [
        "2ラウンド目からは、始める前に、大貧民が大富豪にいちばん強い札2枚を渡し、大富豪が選んだ2枚を受け取ります。貧民と富豪も、同じように1枚ずつ交換します（3人の卓では、大富豪と大貧民の間で1枚）。そのあと、大貧民が最初に出します。",
        "From the second round, before play, the Beggar hands the President their two best cards and gets back two of the President's choosing, and the Vice-Beggar and the Vice-President swap one card each in the same way (at a table of three, one card between President and Beggar). Then the Beggar leads.",
      ],
      [
        "各ラウンドで、自分よりあとに出し切った人1人につき、1点を得ます。ゲームのラウンドがすべて終わったら、得点がいちばん多い人の勝ちです。",
        "Each round scores a point for every person who went out after you. After all the game's rounds, the most points wins.",
      ],
    ],
    board: [
      "4〜6人がいちばんにぎやかな卓で、3〜8人まで座れます。短くなら3ラウンド、長くなら5か7ラウンドを選びます。",
      "Four to six is the liveliest table, and it seats three to eight. Choose three rounds for a short game, and five or seven for a longer one.",
    ],
    review: AGENT_READ,
  },
  goFish: {
    tagline: [
      "自分が持っている数字を相手に聞いて、4枚そろえたブックを作ります。相手が持っていなければ、池から釣り上げます。",
      "Ask for a rank you hold, and make books of four. When they have none, fish one up from the pond.",
    ],
    origin: [
      "英語圏の子どものカードゲームで、多くの人が、初めて覚えたカードゲームです。どこでも、ふつうのトランプで遊ばれていて、誰のものでもありません。",
      "A children's card game of the English-speaking world, and for many the first card game they ever learned. It is played everywhere with an ordinary pack, and belongs to nobody.",
    ],
    rules: [
      [
        "2〜6人で、2人か3人なら1人7枚、4人以上なら1人5枚を配ります。残りは、伏せて広げ、池にします。",
        "Two to six people, seven cards each for two or three, five each for four or more. The rest are spread face down as the pond.",
      ],
      [
        "自分の番には、自分が持っている数字を、誰か1人に聞きます。相手が持っていれば、その数字の札をすべて渡してくれて、もう一度聞けます。",
        "On your turn, ask one person for a rank you hold yourself. If they have any, they hand you every one of them, and you may ask again.",
      ],
      [
        "持っていなければ、相手は「ゴーフィッシュ」と言い、自分は池から1枚引きます。聞いた数字を引いたら、それを見せて、もう一度聞けます。それ以外を引いたら、番は終わりです。",
        "If they have none, they say \"Go fish\" and you draw one from the pond. If you draw the rank you asked for, show it and ask again. If you draw anything else, your turn is over.",
      ],
      [
        "同じ数字が4枚そろうと、ブックで、すぐに場に出します。手札がなくなった人は、自分の番に1枚引き、池も空になったら、お休みです。",
        "Four of a rank make a book, which is laid down at once. A person whose hand runs out draws a card when their turn comes, and sits out once the pond is empty too.",
      ],
      [
        "13個のブックがすべて出そろったら、いちばん多く持っている人の勝ちで、同数なら勝ちを分け合います。",
        "When all thirteen books are down, whoever has the most wins, and those level on the most share the win.",
      ],
    ],
    board: [
      "3人がふつうの卓で、2〜6人まで座れます。ゲームは1回の配りで、すべてのブックが出るまで遊びます。",
      "Three is the usual table, and it seats two to six. The game is one deal, played until every book is down.",
    ],
    review: AGENT_READ,
  },
  crazyEights: {
    tagline: [
      "スートか数字を合わせて出します。8を出すと好きなスートを指定でき、最初に手札を出し切りましょう。",
      "Match the suit or the rank. Play an eight to call any suit you like, and be first to empty your hand.",
    ],
    origin: [
      "20世紀の中ごろから、イギリスと北米で遊ばれている、手札を出し切るゲームで、商品化された色札ゲームの土台になったゲームです。ふつうのトランプで遊び、誰のものでもありません。",
      "A shedding game played in Britain and North America since the middle of the twentieth century, and the game that the commercial colour-card games are built on. It is played with an ordinary pack and belongs to nobody.",
    ],
    rules: [
      [
        "2〜7人で、2人なら1人7枚、それより多ければ1人5枚を配ります。山札の一番上をめくって捨て札の最初にし、8がめくれたら、山札の下に戻します。",
        "Two to seven people, seven cards each for two and five for more. The top card of the stock is turned up to start the discard pile, and an eight turned up goes back under the stock.",
      ],
      [
        "自分の番には、いちばん上の札と同じスートか同じ数字の札を出します。8はワイルドで、何の上にでも出せ、次に出すスートを指定します。",
        "On your turn, play a card of the same suit or the same rank as the top card. Eights are wild: play one on anything, and name the suit that must follow.",
      ],
      [
        "出せなければ、1枚引きます。それが出せるなら出してもよく、出せなければ番は終わりです。山札がなくなったら、いちばん上以外の捨て札を混ぜて新しい山札にします。それもなければ、出せない人はパスします。",
        "If you cannot play, draw one card. If it can be played you may play it, and otherwise your turn is over. When the stock runs out, the discards under the top card are shuffled into a new one. When there are none left either, a person who cannot play passes.",
      ],
      [
        "最初に手札を出し切った人がそのハンドの勝ちで、ほかの全員の残りの札の点数を得ます。8は50点、キング、クイーン、ジャックは10点、エースは1点、そのほかは数字のとおりです。全員が続けてパスしたハンドは行き詰まりで、残りの手札がいちばん少ない人のものになります。",
        "The first to run out of cards wins the hand and scores what everybody else still holds: fifty for an eight, ten for a king, queen or jack, one for an ace, and the face value of the rest. A hand in which everybody passes in turn is blocked, and goes to whoever holds the fewest.",
      ],
      [
        "ゲームの合計点（50点、100点、200点）に最初に届いた人の勝ちです。",
        "The first to the game's total (50, 100 or 200 points) wins.",
      ],
    ],
    board: [
      "3〜4人がふつうの卓で、2〜7人まで座れます。ふつうは100点、短くなら50点、長くなら200点を選びます。",
      "Three or four is the usual table, and it seats two to seven. Choose 100 points for the usual game, 50 for a quick one and 200 for a long one.",
    ],
    review: AGENT_READ,
  },
  spades: {
    tagline: [
      "自分とパートナーが取るトリックの数をビッドし、その数だけ取りましょう。切り札はいつもスペードです。",
      "Bid the number of tricks you and your partner will take, then take that many. Spades are always trumps.",
    ],
    origin: [
      "1930年代のアメリカで生まれた、パートナーを組むトリックテイキングゲームで、ブリッジやホイストよりも簡単な親戚です。切り札は常にスペードで、各自が自分のビッドをします。第二次世界大戦中に軍隊で広まり、以来、北米でいちばん遊ばれているカードゲームの1つです。誰のものでもありません。",
      "A partnership trick-taking game from the United States of the 1930s, a simpler cousin of Bridge and Whist in which spades are always trumps and each person bids for themselves. It spread through the armed forces in the Second World War and has been one of the most played card games in North America ever since. It belongs to nobody.",
    ],
    rules: [
      [
        "4人が2組に分かれ、パートナーは向かい合って座ります。トランプ1組をすべて配り、1人13枚ずつで、配る人は毎回1席ずつ移ります。",
        "Four people in two partnerships, with partners sitting across from each other. The whole pack is dealt, thirteen each, and the dealer moves one seat round each time.",
      ],
      [
        "配る人の左から順に、自分が取れると思うトリックの数を、1から13で、または1つも取らない「ニル」でビッドします。組の契約は、2人のビッドの合計です。",
        "From the dealer's left, each person bids how many tricks they expect to take, from one to thirteen, or \"nil\" for none at all. A partnership's contract is its two bids added together.",
      ],
      [
        "最初のトリックは、配る人の左から始めます。出せるなら同じスートを出し、出せなければ何を出してもかまいません。スペードは切り札で、いちばん強いスペードがトリックを取り、スペードがなければ、出されたスートでいちばん強い札が取ります。エースがいちばん強いです。スペードは、ほかのスートの上に一度出されるまで、最初の札としては出せません。ただし、ほかに持っていなければ出せます。",
        "The dealer's left leads the first trick. Follow suit if you can, and if you cannot, play anything. Spades are trumps: the highest spade takes the trick, and if there is none, the highest card of the suit led. Aces are high. Spades may not be led until one has been played on another suit, unless you hold nothing else.",
      ],
      [
        "契約を果たすと、ビッドしたトリック1つにつき10点、それを超えたトリック1つにつき1点（バッグ）が入ります。足りなければ、ビッドしたトリック1つにつき10点を失います。組が10個のバッグをためるごとに、100点を失います。",
        "Make your contract and score ten points for each trick bid and one point for each trick over (a bag). Take fewer and lose ten points for each trick bid. Every ten bags a partnership collects costs it a hundred points.",
      ],
      [
        "ニルは、ビッドした人が1つもトリックを取らなければ100点、1つでも取れば100点を失います。パートナーのビッドはそれとは別に数えられ、ニルの人が取ったトリックは、バッグになります。",
        "Nil scores a hundred if the person who bid it takes no trick at all, and costs a hundred if they take even one. Their partner's bid stands separately, and any trick the nil bidder takes is a bag.",
      ],
      [
        "ゲームの合計点（200点、300点、ふつうは500点）に最初に届いた組の勝ちで、その点数のマイナスまで下がった組は負けです。同点で終わったら、もう1回配って遊びます。",
        "The first partnership to the game's total (200, 300 or the usual 500) wins, and a partnership that sinks to minus that total loses. If level at the end, another deal is played.",
      ],
    ],
    board: [
      `${FOUR[0]}ふつうは500点、短くなら300点か200点を選びます。`,
      `${FOUR[1]} Choose 500 for the usual game, and 300 or 200 for a quicker one.`,
    ],
    review: AGENT_READ,
  },
  ginRummy: {
    tagline: [
      "引いて、捨てて、10枚の手札をセットとランにします。そろったらノック、余りがなければジンです。",
      "Draw, throw, and make your ten cards into sets and runs. Knock when you are ready, or go gin when nothing is left over.",
    ],
    origin: [
      "アメリカで生まれた、2人用のラミーのゲームで、1909年に、ホイストの先生エルウッド・ベイカーと息子が、古いゲーム「ノック・ラミー」の、より速い親戚として考え出したと言われています。1930年代から1940年代にハリウッドを席巻し、以来、北米の、2人用カードゲームの定番です。誰のものでもありません。",
      "A two-person rummy game from the United States, said to have been worked out in 1909 by the whist teacher Elwood Baker and his son as a faster cousin of the older game Knock Rummy. It swept Hollywood in the 1930s and 1940s, and has been the classic two-person card game of North America ever since. It belongs to nobody.",
    ],
    rules: [
      [
        "2人で、1人10枚を配ります。残りは山札で、その一番上をめくって、捨て札の最初にします。",
        "Two people, ten cards each. The rest is the stock, and its top card is turned up to start the discard pile.",
      ],
      [
        "自分の番には、山札か捨て札の一番上から1枚引き、そのあと、1枚を捨て札に捨てます。捨て札から取ったばかりの札を、そのまま捨てることはできません。",
        "On your turn, draw one card from the top of the stock or of the discard pile, then throw one card onto the discard pile. A card just taken from the pile may not go straight back.",
      ],
      [
        "メルドは、同じ数字の3〜4枚、または同じスートの3枚以上の連続です（エースは1として低く数えます）。どのメルドにも入らない札は、すべてデッドウッドです。エースは1点、ジャック、クイーン、キングは10点、そのほかは数字のとおりです。",
        "Melds are three or four cards of one rank, or three or more in a row in one suit (the ace counts low). Every card in no meld is deadwood. An ace counts one, a jack, queen or king ten, and the rest their number.",
      ],
      [
        "デッドウッドが10点以下なら、ノックできます。札を1枚伏せて捨て、手札を広げます。相手も手札を広げ、ノックした人のメルドに合う札を付け足します。ノックした人は、デッドウッドの差を得点します。相手のデッドウッドが同じか少なければ、アンダーカットで、相手が、その差と25点を得ます。",
        "With ten or fewer points of deadwood you may knock: throw one card face down and lay your hand out. The other person lays out theirs and lays off any cards that fit the knocker's melds. The knocker scores the difference in deadwood. If the other person has the same or less, that is an undercut, and they score the difference and 25.",
      ],
      [
        "デッドウッドが1枚もない状態でノックすると、ジンです。25点と、相手のデッドウッドすべてを得て、相手は付け足せません。山札が2枚になっても誰もあがらなければ、そのハンドは引き分けで、誰にも点は入りません。",
        "Knock with no deadwood at all and it is gin: you score 25 and all the other person's deadwood, and they may lay nothing off. If the stock runs down to two cards and nobody has gone out, the hand is drawn and nobody scores.",
      ],
      [
        "ゲームの合計点（50点、100点、150点）に最初に届いた人の勝ちです。",
        "The first to the game's total (50, 100 or 150 points) wins.",
      ],
    ],
    board: [
      "いつも2人です。1人でコンピュータと、または2人で1台を回して遊べます。ふつうは100点、短くなら50点、長くなら150点を選びます。",
      "Always two: one person against the computer, or two people passing one device. Choose 100 points for the usual game, 50 for a quick one and 150 for a long one.",
    ],
    review: AGENT_READ,
  },
  euchre: {
    tagline: [
      "パートナーと切り札を決め、5つのトリックのうち3つを取りましょう。いちばん強いのは、ジャックです。",
      "Make trumps with your partner and take three of the five tricks. The jacks are the strongest cards of all.",
    ],
    origin: [
      "枚数を減らしたトランプで遊ぶ、パートナー制のトリックゲームで、19世紀の初めから、アメリカで遊ばれています。おそらく、ペンシルベニアのドイツ系入植者が、アルザスの「ユッカーシュピール」から持ち込んだものです。ジョーカーは、最強の切り札として、このゲームのために、トランプに加えられました。いまも、オンタリオ、ミシガン、オハイオ、インディアナの、代表的なカードゲームです。誰のものでもありません。",
      "A partnership trick game with a short pack, played in the United States since the early nineteenth century and brought, most likely, by German settlers in Pennsylvania from an Alsatian game called Juckerspiel. The Joker was added to the pack for this game, as a top trump. It is still the great card game of Ontario, Michigan, Ohio and Indiana. It belongs to nobody.",
    ],
    rules: [
      [
        "4人が2組に分かれ、パートナーは向かい合います。9からエースまでの24枚を使い、1人5枚を配ります。残った4枚の一番上を、表にします。",
        "Four people in two partnerships, with partners across the table, using the twenty-four cards from nine to ace. Five each are dealt, and the top card of the four left over is turned up.",
      ],
      [
        "配る人の左から順に、その札のスートを切り札にするよう指示するか、パスします。指示されたら、配る人はその札を取り、手札から1枚を捨てます。4人全員がパスしたら、その札は伏せられ、順に、ほかのスートを指定するか、パスします。最後の配る人は、必ず指定しなければなりません。",
        "From the dealer's left, each may order that card's suit as trumps, or pass. If it is ordered, the dealer picks the card up and throws one card away. If all four pass, the card is turned down and each may name another suit, or pass. The dealer, last, must name one.",
      ],
      [
        "切り札では、ジャックがいちばん強く（ライトバウアー）、次に、同じ色のもう1枚のジャック（レフトバウアー。切り札として扱われ、もとのスートではなくなります）、そのあと、エース、キング、クイーン、10、9の順です。ほかのスートでは、エースがいちばん強いです。",
        "In trumps, the jack is the strongest card (the right bower), then the other jack of the same colour (the left bower, which counts as a trump and no longer as its own suit), then ace, king, queen, ten and nine. In the other suits the ace is high.",
      ],
      [
        "配る人の左から始めます。出せるなら同じスートを出し、出せなければ何を出してもかまいません。いちばん強い切り札がトリックを取り、切り札がなければ、出されたスートでいちばん強い札が取ります。",
        "The dealer's left leads. Follow suit if you can, and if you cannot, play anything. The highest trump takes the trick, and if there is none, the highest card of the suit led.",
      ],
      [
        "切り札を決めた組は、3つか4つのトリックで1点、5つすべてで2点を得ます。2つ以下だと「ユーカー」で、相手の組が2点を得ます。",
        "The partnership that made trumps scores one for three or four tricks and two for all five. With two or fewer it is euchred, and the other partnership scores two.",
      ],
      [
        "ゲームの合計点（短いゲームは5点、ふつうは10点）に最初に届いた組の勝ちです。",
        "The first partnership to the game's total (5 for a quick game, or the usual 10) wins.",
      ],
    ],
    board: [
      `${FOUR[0]}ふつうは10点、短くなら5点を選びます。`,
      `${FOUR[1]} Choose 10 points for the usual game and 5 for a quick one.`,
    ],
    review: AGENT_READ,
  },
  cribbage: {
    tagline: [
      "2枚をクリブに置き、カードを出しながら、15、ペア、ランでペグを進め、そのあと手札を数えます。最初に121点に届いた人の勝ちです。",
      "Lay two cards to the crib, peg fifteens, pairs and runs as the cards go down, then count your hand. The first to 121 wins.",
    ],
    origin: [
      "17世紀の初めのイギリスで生まれたゲームで、詩人のジョン・サックリング卿が、古い「ノディ」というゲームから作ったと伝えられています。穴のあいた盤にペグを刺して点数を数えるので、カードを出すたびに、点数が2人の目の前を回ります。英語圏のどの国でも遊ばれ、アメリカの潜水艦に持ち込みが許された、ただ1つのカードゲームです。誰のものでもありません。",
      "An English game of the early seventeenth century, credited to the poet Sir John Suckling, who is said to have made it from an older game called Noddy. It is scored with pegs on a board of holes, so the score moves round in front of both people as the cards go down. It is played in every English-speaking country, and is the one card game allowed aboard American submarines. It belongs to nobody.",
    ],
    rules: [
      [
        "2人で、1人6枚を配ります。それぞれ2枚を伏せてクリブに置きます。クリブは配る人のものです。そのあと、山の上をカットして、1枚をめくり、スターターにします。ジャックがめくれたら、配る人に2点（ヒールズ）が入ります。",
        "Two people, six cards each. Each lays two cards face down to the crib, which belongs to the dealer. Then the top of the pack is cut and a card turned up as the starter. If a jack is turned up, the dealer scores two (his heels).",
      ],
      [
        "ペギング：配る人の相手から、順に1枚ずつ札を出し、合計の数を声に出して数えます。合計は31を超えられません。15で2点、31で2点、ペアで2点、同じ数字3枚で6点、4枚で12点、3枚以上のランは、順序を問わず、1枚につき1点です。",
        "The pegging: starting with the dealer's opponent, lay one card at a time in turn, calling the running count, which may not pass thirty-one. Fifteen scores two, thirty-one two, a pair two, three alike six, four alike twelve, and a run of three or more, in any order, a point a card.",
      ],
      [
        "31を超えずに出せないときは、「ゴー」と言い、相手が出せるあいだ続けて出します。最後に札を出した人が、ゴーとして1点を得て、合計は0から数え直します。最後の1枚で、1点を得ます。",
        "If you cannot play without passing thirty-one, you say go, and the other person plays on for as long as they can. Whoever laid the last card scores one for the go, and the count starts again from nought. The very last card scores one.",
      ],
      [
        "ショー：4枚の手札に、スターターを加えて、合計が15になる札の組ごとに2点、ペアごとに2点、ランは1枚につき1点、手札の4枚が同じスートなら4点（スターターも同じなら5点）、スターターと同じスートのジャックで1点（ノブス）を得ます。クリブは配る人のもので、フラッシュは、5枚すべてが同じスートのときだけ得点になります。",
        "The show: each hand of four, with the starter, scores two for every set of cards adding up to fifteen, two for every pair, a point a card for every run, four for four of one suit in the hand (five with the starter), and one for the jack of the starter's suit (his nobs). The crib is the dealer's, and scores a flush only when all five cards are one suit.",
      ],
      [
        "ショーは、配る人の相手が先で、次に配る人、最後に配る人のクリブの順です。そのあと、配る人が交代します。ゲームの合計点（121点か61点）に最初に届いた人は、ショーの途中でも、その瞬間に勝ちです。",
        "The dealer's opponent shows first, then the dealer, then the dealer's crib, and then the deal passes. The first to the game's total (121 or 61) wins the moment they reach it, even partway through the show.",
      ],
    ],
    board: [
      "いつも2人です。1人でコンピュータと、または2人で1台を回して遊べます。ふつうは、盤を2周する121点、短くなら、1周の61点を選びます。",
      "Always two: one person against the computer, or two people passing one device. Choose 121 for the usual game, twice round the board, or 61 for once round.",
    ],
    review: AGENT_READ,
  },
  ohHell: {
    tagline: [
      "取るトリックの数を、ぴったりビッドします。1つ多くても少なくてもだめです。手札は1枚から7枚へと増えていきます。",
      "Bid exactly how many tricks you will take, not one more and not one fewer, as the hands grow from one card to seven.",
    ],
    origin: [
      "19世紀の終わりか20世紀の初めの、イギリスのトリックテイキングゲームで、ロンドンのクラブで遊ばれていたと言われ、以来、ブラックアウトから、アップ・アンド・ダウン・ザ・リバーまで、十以上の名前で知られています。いちばんの痛みどころは、配る人のルールで、ビッドの合計が、トリックの数とちょうど等しくならないようにします。誰のものでもありません。",
      "An English trick-taking game of the late nineteenth or early twentieth century, said to have been played in London clubs, and known since under a dozen names from Blackout to Up and Down the River. Its sting is the dealer's rule, which stops the bids from ever adding up to exactly the number of tricks there are. It belongs to nobody.",
    ],
    rules: [
      [
        "3〜4人で、それぞれ個人戦です。最初の配りは1人1枚、次は2枚、と7枚まで増え、長いゲームでは、また1枚まで戻ります。配るたびに、次の札を1枚表にして、そのスートが切り札になります。",
        "Three or four people, each for themselves. The first deal is one card each, the next two, and so on up to seven. The long game comes back down to one. After each deal the next card is turned up, and its suit is trumps.",
      ],
      [
        "配る人の左から順に、自分が取るトリックの数を、0から全部まで、ぴったりでビッドします。配る人は最後にビッドし、ビッドの合計がトリックの数と等しくなる数は、ビッドできません。そのため、少なくとも1人は外れます。",
        "From the dealer's left, each person bids exactly how many tricks they will take, from none to all of them. The dealer bids last and may not bid the number that would make the bids add up to the number of tricks, so at least one person must miss.",
      ],
      [
        "配る人の左から始めます。出せるなら同じスートを出し、出せなければ何を出してもかまいません。いちばん強い切り札がトリックを取り、切り札がなければ、出されたスートでいちばん強い札が取ります。",
        "The dealer's left leads. Follow suit if you can, and if you cannot, play anything. The highest trump takes the trick, and if there is none, the highest card of the suit led.",
      ],
      [
        "ビッドどおりに取ると、10点にビッドの数を足した点を得ます。0のビッドを成功させれば10点です。それ以外の数を取ると、その配りは0点です。",
        "Take exactly what you bid and score ten plus your bid, so a bid of none made scores ten. Take any other number and score nothing for the deal.",
      ],
      [
        "配る人は、毎回左へ移ります。最後の配りのあと、得点がいちばん高い人の勝ちで、トップが同点なら、勝ちを分け合います。",
        "The deal passes to the left each time. After the last deal the highest score wins, and those level at the top share the win.",
      ],
    ],
    board: [
      "3〜4人で、誰でもコンピュータにできます。1人で残りを相手にしても、全員で1台を囲んでもかまいません。7枚まで増えてまた戻る、13回のフルゲームか、増えていくだけの7回を選びます。",
      "Three or four people, any of whom may be a computer: one person against the rest, or everybody round one device. Choose 13 deals for the full game, up to seven cards and back down, or 7 for the climb alone.",
    ],
    review: AGENT_READ,
  },
  war: {
    tagline: [
      "自分の一番上の札と相手の札を同時にめくり、大きい方が2枚とも取ります。同じ数なら、戦争です。",
      "Turn your top card over together with your opponent's, and the bigger takes both. If they are the same, it is war.",
    ],
    origin: [
      "子どもや、何かを待っている人が、多くの国で遊んでいる、完全に運だけのゲームです。すべてをカードが決め、誰も札を選びません。イギリスでは「バトル」、フランスでは「ラ・バタイユ」、日本では「戦争」と呼ばれています。誰のものでもありません。",
      "A game of pure chance played in many countries by children, and by anybody waiting for something. The cards decide everything and nobody picks one. It is known as Battle in Britain, La Bataille in France and 戦争 (sensō, \"war\") in Japan. It belongs to nobody.",
    ],
    rules: [
      [
        "2人で遊びます。トランプ1組をすべて配り、1人26枚ずつを、伏せて持ちます。誰も自分の札を見ず、選びもしません。各自の一番上の札が、いつも次の札です。",
        "Two people play. The whole pack is dealt out, twenty-six cards each, held face down. Nobody looks at their cards and nobody picks one: each person's top card is always the next.",
      ],
      [
        "毎ターン、2人が同時に、一番上の札をめくります。大きい方の札が、2枚とも取って、自分の山の下に入れます。エースがいちばん強く、スートは関係ありません。",
        "Each turn, both turn their top card over at the same time. The bigger card takes both and puts them under its pile. Aces are high, and suits do not matter.",
      ],
      [
        "2枚が同じ数字なら、戦争です。それぞれ3枚を伏せて置き、次の1枚をめくります。そのめくった2枚のうち、大きい方が、場の札をすべて取ります。",
        "If the two cards are the same rank, it is war. Each lays three cards face down and turns the next one over. The bigger of those two cards takes everything on the table.",
      ],
      [
        "そのめくった2枚も同じ数字なら、戦争は続きます。さらに3枚を伏せ、もう1枚をめくり、決着がつくまで、何度でも繰り返します。",
        "If those two are the same too, the war goes on: three more face down and one more turned over, as many times as it takes.",
      ],
      [
        "戦争には、それぞれ4枚の札が必要です。それより少ない人は、戦争を終えられず、負けとなり、相手がすべての札を取ります。どちらも足りないときは、札の少ない方が負けで、同じ枚数なら、引き分けです。",
        "A war needs four cards from each. A person with fewer cannot finish it and loses, and the other takes every card. If neither can, the one with fewer cards loses, and with the same number each it is a draw.",
      ],
      [
        "取った札は、混ぜた順に、自分の山の下に入ります。そのため、ゲームが永遠に同じところを回ることはありません。1人がすべての札を持ったら、ゲーム終了です。その前にターンが尽きたら、札を多く持つ人の勝ちで、同じ枚数なら、勝ちを分け合います。",
        "The cards a person wins go under their pile in a shuffled order, so a game cannot go round in circles for ever. The game ends when one person holds every card. If the turns run out first, the person holding more cards wins, and equal piles share the win.",
      ],
    ],
    board: [
      "いつも2人です。1人でコンピュータと、または2人で1台でカードをめくって遊べます。ゲームが続くターン数は、短くなら50、ふつうは100、長くなら200、最後まで遊ぶなら1000を選びます。ターンが尽きたら、札を多く持つ人の勝ちです。",
      "Always two: one person against the computer, or two people turning cards on one device. Choose how many turns the game may last: 50 for a quick one, 100 for the usual game, 200 for a long one, or 1000 to play it out. When the turns run out, the person holding more cards wins.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Record<CardGameKind, PartyCopyJa>;
