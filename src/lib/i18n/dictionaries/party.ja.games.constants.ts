import { AGENT_READ_2026_10_06 } from "../copyJa.types";

import type { PartyCopyJa } from "./party.ja.types";

/**
 * The party games' words in Japanese: Dots and Boxes, Superghost, Mancala,
 * Tenka, Mexican Train, Yacht, Pachisi, Hitotsu, Dice War and Gunjin. The
 * English rows are `PARTY_DISPLAY` (`src/lib/party/party.constants.ts`) and the
 * copy files beside the packages' rules (`hitotsu.copy.ts`, `gunjin.copy.ts`).
 *
 * Words used here, so a table reads alike everywhere (docs/plans/en-ja-everywhere/TERMS.md):
 * a table is 卓, a seat 席, a turn 手番, the computer コンピュータ. A person at a table is
 * named by what they did or by 人, never プレイヤー (TERMS: the word for a player is 対局者, and
 * a card table is not a 対局), so a rule says 「出した人」 and not 「出したプレイヤー」.
 */
const AGENT_READ = AGENT_READ_2026_10_06;

export const PARTY_COPY_JA_GAMES = {
  dotsAndBoxes: {
    tagline: [
      "線を1本引きます。箱を閉じるとその箱は自分のものになり、続けてもう1本引けます。",
      "Draw a line. Close a box and it becomes yours, and you can draw another straight away.",
    ],
    origin: [
      "1889年にフランスの数学者エドゥアール・リュカが「ラ・ピポピネット」の名で初めて発表した、紙と鉛筆のゲームです。それ以来、学校のノートの裏で遊ばれてきました。誰のものでもありません。",
      "A pencil-and-paper game first published by the French mathematician Édouard Lucas in 1889 under the name La Pipopipette, and played on the backs of school notebooks ever since. It belongs to nobody.",
    ],
    rules: [
      [
        "盤は、点が格子状に並んでいるだけの状態から始まります。順番に、隣り合う2つの点を、縦か横に1本の線で結びます。",
        "The board starts as nothing but a grid of dots. In turn, join two neighbouring dots with one line, across or down.",
      ],
      [
        "箱の4本目の辺を引くと、その箱は自分のものになり、自分の色と文字で塗られます。続けて、もう1本引かなければなりません。",
        "Draw the fourth side of a box and the box becomes yours, filled with your colour and your letter. You must then draw another line.",
      ],
      [
        "1本の線で、2つの箱が同時に閉じることもあります。どちらも自分のものになりますが、続けて引くのは1本だけです。",
        "One line can close two boxes at once. Both become yours, but you still draw only one more line.",
      ],
      [
        "箱を閉じない線を引くと手番が終わり、卓の次の人が引きます。",
        "A line that closes no box ends your turn, and the next person round the table draws.",
      ],
      [
        "すべての線が引かれたら、ゲーム終了です。いちばん多くの箱を持っている人の勝ちで、最多が同数なら、勝ちを分け合います。",
        "When every line has been drawn the game is over. Whoever has the most boxes wins, and those level on the most share the win.",
      ],
    ],
    board: [
      "2人で短く遊ぶなら3×3マス、3〜4人なら4×4か5×5、5〜6人なら6×6がおすすめです。全員が、長い連鎖に加われます。",
      "Choose 3×3 boxes for a quick game for two, 4×4 or 5×5 for three or four, and 6×6 for five or six, so that everybody gets a share of the long chains.",
    ],
    review: AGENT_READ,
  },
  superghost: {
    tagline: [
      "文字を前か後ろに1つ足します。言葉を完成させてしまったり、はったりを見破られたりすると、おばけに一歩近づきます。",
      "Add a letter at the front or the back. Finish a word, or have a bluff seen through, and you step closer to a ghost.",
    ],
    origin: [
      "ゴーストは、英語圏で昔から遊ばれてきた、声に出す言葉遊びで、文字は後ろにしか足せません。スーパーゴーストでは、前にも後ろにも足せます。ジェームズ・サーバーがニューヨーカー誌に書いたエッセイ「Do You Want to Make Something Out of It?」は、このゲームと、それを遊ぶ人たちを描いた、いちばん有名な文章です。どちらも誰のものでもありません。",
      "Ghost is an old spoken word game of the English-speaking world, in which letters can only be added at the back. In Superghost a letter can go on at the front or the back. James Thurber's essay for the New Yorker, \"Do You Want to Make Something Out of It?\", is the best-known piece describing the game and the people who play it. Neither belongs to anybody.",
    ],
    rules: [
      [
        "順番に、伸びていく文字の並び（断片）の前か後ろに、文字を1つ足します。そのラウンドの最初の人は、好きな文字を1つ置きます。",
        "In turn, add one letter to the front or the back of a growing string of letters (the fragment). The first person of a round sets down any letter.",
      ],
      [
        "4文字以上の言葉を完成させると、そのラウンドは負けです。それより短い言葉は数えないので、CATは大丈夫ですが、CATSはだめです。",
        "Finish a word of four letters or more and you lose the round. Shorter words do not count, so CAT is fine but CATS is not.",
      ],
      [
        "文字を足す代わりに、直前に文字を足した人に挑戦できます。挑戦された人は、断片の文字をそのままの順にひと続きで含む、実在の言葉を答えなければなりません。",
        "Instead of adding a letter, you may challenge the person who added the last one. They must name a real word that contains the fragment's letters in the same order, joined up.",
      ],
      [
        "答えられたら挑戦した人の負け、答えられなければ答える側の負けです。答える言葉は4文字以上で、このサイトの単語リストにあるものに限ります。",
        "If they can name one, the challenger loses the round. If they cannot, they lose it. A word named must be four letters or more and in the site's word list.",
      ],
      [
        "ラウンドに負けた人は、GHOST（日本語では「おばけだぞ」）の次の1文字をもらい、次のラウンドを始めます。5文字そろうと脱落で、最後まで残った人の勝ちです。",
        "Whoever loses a round takes the next letter of GHOST (in Japanese, \"obake da zo\") and begins the next round. Take all five and you are out. The last person left wins.",
      ],
    ],
    board: [
      "2〜8人で、英語でも日本語でも遊べます。日本語では、組文字と同じかなを使います。「が」は「か」、「ゃ」は「や」、「を」は「お」として打つので、どちらにするか迷うことはありません。",
      "Two to eight people, in English or in Japanese. In Japanese the letters are the same kana as in 組文字 (Kumimoji): が is played as か, ゃ as や and を as お, so nobody has to choose between them.",
    ],
    review: AGENT_READ,
  },
  mancala: {
    tagline: [
      "種を1つずつ穴にまきながら盤をまわり、相手より多くの種を自分のストアに集めます。",
      "Sow seeds round the board one to a pit, and gather more into your store than your opponent does.",
    ],
    origin: [
      "種をまいていく遊びは、いまも遊ばれている盤上ゲームのなかで、いちばん古い部類に入ります。アフリカ全域、中東、南アジア・東南アジアで知られていて、名前はアラビア語の「ナカラ」（動かす）に由来します。Owareは、西アフリカからカリブ海にかけて遊ばれる、ガーナのアカン人の遊びです。Kalahは、1940年代にウィリアム・ジュリアス・チャンピオン・ジュニアがアメリカで発表したもので、北米で「マンカラ」として売られているセットの多くが、この版に従っています。どちらも誰のものでもありません。",
      "Sowing games are among the oldest board games still played, known right across Africa, the Middle East and South and Southeast Asia, and the name comes from the Arabic \"naqala\" (to move). Oware is the Akan game of Ghana, played from West Africa to the Caribbean. Kalah was published in the United States by William Julius Champion Jr. in the 1940s, and most sets sold as Mancala in North America follow this version. Neither belongs to anybody.",
    ],
    rules: [
      [
        "盤は、6つの穴が2列に並び、どの穴にも種が4つずつ入っていて、両端にストアがあります。手前の列が先手、奥の列が後手の持ち場で、それぞれのストアは、自分から見て右端にあります。",
        "The board is two rows of six pits with four seeds in each pit and a store at each end. The near row is the first player's and the far row the second's, and each one's store is at their right-hand end.",
      ],
      [
        "自分の番には、自分の穴を1つ選んで種を全部つかみ、反時計回りに、次の穴から1つずつまいていきます。",
        "On your turn, pick up all the seeds from one of your pits and sow them counter-clockwise, one to each pit, starting from the next.",
      ],
      [
        "Kalah（標準）：自分のストアには、通るときに種を入れ、相手のストアには入れません。最後の種が自分のストアに入ったら、もう一度まきます。最後の種が自分の空の穴に入り、向かいの穴に種があれば、その種と、いま入れた種を、すべて自分のストアに取ります。",
        "Kalah (the default): put a seed in your own store as you pass it, never in your opponent's. If the last seed lands in your store, sow again. If the last seed lands in an empty pit of yours and the pit opposite has seeds, take those seeds and the one you just put in, all into your store.",
      ],
      [
        "Oware：ストアには種をまきません。ストアには、取った種だけがたまります。12個以上をまくときは、もとの穴を飛ばして一周し、その穴は空のままにします。最後の種で相手の穴が2個か3個になったら、それを取り、その手前の穴も、さらにその手前も、2個か3個であるかぎり、相手の列をさかのぼって取っていきます。",
        "Oware: no seed is sown into the stores. They keep only what you take. A sowing of twelve or more goes round past the pit it came from and leaves it empty. If the last seed makes two or three in an opponent's pit, take them, then the pit before it, and the one before that, going back along their row for as long as each holds two or three.",
      ],
      [
        "Owareの2つの決まりごと：相手の種を全部取ってしまうまき方では、何も取れません（グランドスラム）。また、相手の列が空のときは、できるなら相手の列に種を送るようにまかなければなりません。できなければ、自分の側の種を取って、ゲーム終了です。",
        "Oware's two courtesies: a sowing that would take every one of your opponent's seeds takes none (the grand slam), and when your opponent's row is empty you must sow so as to send seeds into it, if you can. If you cannot, you take the seeds on your side and the game is over.",
      ],
      [
        "Kalahは、どちらかの列が空になると終わり、それぞれ自分の側に残った種を、自分のストアに加えます。Owareは、誰かが25個に達したとき、両者とも24個のとき、または同じ局面が3回めに現れたときに終わり、それぞれ自分の側の種を取ります。種がいちばん多い側の勝ちで、同数なら引き分けです。",
        "Kalah ends when either row is empty, and each adds what is left on their side to their own store. Oware ends when somebody reaches 25, when both have 24, or when the same position appears a third time, and each takes the seeds on their side. The side with the most seeds wins, and level is a draw.",
      ],
    ],
    board: [
      "Kalahは、北米で「マンカラ」として売られているセットの多くが採用しているルールで、覚えるのも早い方です。Owareは、もっと古くて奥が深いゲームで、西アフリカやカリブ海の大会でも遊ばれています。2人ともKalahに慣れたら、選んでみてください。",
      "Kalah is the one that most sets sold as Mancala in North America follow, and it is quicker to learn. Oware is older and deeper, and is played in tournaments in West Africa and the Caribbean: choose it once both players are used to Kalah.",
    ],
    review: AGENT_READ,
    ask: "Kalah and Oware are left in Latin letters because no established katakana spelling could be confirmed for either; a native reader may prefer one.",
  },
  tenka: {
    tagline: [
      "世界を1領土ずつ手に入れます。サイコロで攻め、守り、カードを部隊に交換して戦力を増やします。",
      "Take the whole world one territory at a time: attack with dice, hold what you take, and trade cards for armies to grow stronger.",
    ],
    origin: [
      "1950年代から世界地図の上で遊ばれてきた、世界征服ゲームの仲間です。戦いはサイコロで決め、大陸をまるごと押さえると部隊が増え、カードを交換するとさらに増えます。ゲームの規則は誰のものでもありません。名前は、16世紀の日本の戦国武将が目指した「天下取り」にちなんで、このサイトが付けたもので、舞台は世界地図です。",
      "A game of world conquest in the family that has been played on world maps since the 1950s. Battles are decided by dice, holding a whole continent brings more armies, and trading in cards brings more again. The rules of a game belong to nobody. The name was given by this site, after the 天下取り (\"taking the realm\") that the warlords of sixteenth-century Japan set out to do, and the setting is a map of the world.",
    ],
    rules: [
      [
        "世界の42の領土が全員に配られ、どの領土にも部隊が1つずつ置かれます。そのうえで、全員が最初の部隊を、自分の領土に置きます。2人で遊ぶときは、中立の部隊が世界の3分の1を押さえます。中立の部隊は動かず、守るだけです。",
        "The world's forty-two territories are dealt out to everyone, with one army on each, and everybody then places their starting armies on their own territories. At a table of two, a neutral army holds a third of the world. It never moves and only defends.",
      ],
      [
        "手番は、新しい部隊を受け取るところから始まります。持っている領土3つにつき1つ（最低3つ）、大陸をまるごと押さえていればその分、3枚組のカードを交換すればその分も加わります。部隊は自分の領土に、1つずつでも、残りをまとめてでも、好きなように分けて置けます。",
        "Your turn starts with new armies: one for every three territories you hold (never fewer than three), more for each continent you hold whole, and more again for a set of three cards traded in. Place them on your own territories, one at a time or all the rest at once, divided as you like.",
      ],
      [
        "そのあとは、何度でも攻撃できます。部隊が2つ以上ある領土から、ほかの人が持つ隣の領土へ、陸の国境か、破線の海路を越えて攻めます。世界はつながっていて、アラスカとカムチャツカは、地図の両端にありながら、ベーリング海峡をはさんで隣り合っています。サイコロは、その領土の部隊より1つ少ない数まで、最大3個振れます。守る側は最大2個です。",
        "Then attack as often as you like, from a territory with at least two armies into a neighbouring territory that somebody else holds, across a land border or a dashed sea route. The world wraps round: Alaska and Kamchatka are neighbours across the Bering Strait, though they lie at opposite edges of the map. You roll up to three dice, one fewer than your armies there; the defender rolls up to two.",
      ],
      [
        "出目の大きい順に組にして比べ、大きい方の勝ちで、同じ目は守る側の勝ちです。負けた組ごとに、部隊を1つ失います。相手の領土を空にしたら、そこは自分のものです。振ったサイコロの数以上の部隊を、進めてください。",
        "The highest dice are compared in pairs, the higher wins, and a tie goes to the defender. Each pair lost costs one army. Empty the territory and it is yours: move in at least as many armies as the dice you rolled.",
      ],
      [
        "手番の最後に、自分の領土どうしが、自分の領土だけでつながっているなら、部隊を1回だけ移せます。この手番で領土を取ったなら、カードを1枚引きます。同じ種類3枚、各種類1枚ずつ、またはワイルドを含む2枚で1組になり、交換すると4、6、8、10、12、15部隊、以降は1組ごとに5部隊ずつ増えます。カードが5枚になったら、必ず交換します。",
        "At the end of your turn, if you like, move armies once between two of your own territories joined through your own land. If you took a territory this turn, take a card. Three alike, one of each kind, or two with a wild make a set, and trading one in gives 4, 6, 8, 10, 12 or 15 armies, then five more for each set after that. With five cards you must trade.",
      ],
      [
        "相手を全滅させると、その人のカードは自分のものになります。ほかの全員を倒して世界をすべて手に入れたら、勝ちです。ラウンド数を決めたゲームは、最後のラウンドで終わり、領土をいちばん多く持つ人が勝ちます。",
        "Knock somebody out and their cards become yours. Defeat everybody else and take the whole world and you win. A game of a set number of rounds ends at the last one, and whoever holds the most territories wins.",
      ],
    ],
    board: [
      "地図は2つあります。世界は、6つの大陸に42の領土があり、どこがどこと接し、どの大陸にどれだけの価値があるかは、昔ながらの配置です。ヨーロッパは、11の地域に49のエリアがあり、アイルランドからコーカサスまで、マグリブの海岸から北極圏まで広がり、海は破線の航路で渡ります。短く遊ぶなら10ラウンド、夜じゅう遊ぶなら20ラウンド、または1人が地図全体を押さえるまで遊べます（そこまで続いても、60ラウンド目で集計します）。",
      "There are two maps. The world has forty-two territories in six continents, in the classic arrangement of who touches whom and what each continent is worth. Europe has forty-nine areas in eleven regions, from Ireland to the Caucasus and from the coast of the Maghreb to the Arctic Circle, with its seas crossed by dashed routes. For a quick game choose ten rounds, for an evening twenty, or play until one person holds the whole map (counted at round sixty if it ever gets that far).",
    ],
    review: AGENT_READ,
  },
  mexicanTrain: {
    tagline: [
      "ハブから自分のドミノの列車を伸ばします。メキシカントレインや、開放されている誰かの列車にもつなぎ、いちばん少ない点数で最初にあがりましょう。",
      "Build your own train of dominoes out from the hub. Add to the Mexican Train or to anybody's train left open too, and go out first with the fewest pips.",
    ],
    origin: [
      "列車系のドミノゲームです。中央にハブがあり、そこから全員の列車が伸び、さらに誰でもつなげるもう1本、メキシカントレインがあります。始まりがどこかは、はっきりしません。20世紀の終わりごろ北米に広まり、いまは、91枚のダブル12のセットを使い、1ゲーム13ラウンドで遊ぶのがいちばん一般的です。誰のものでもありません。",
      "A domino game of the train family. There is a hub in the middle, a train out of it for everybody, and one more, the Mexican Train, that anyone may add to. Where it began is not certain. It spread across North America in the late twentieth century, and is now most often played with a double-twelve set of ninety-one tiles, thirteen rounds to a game. It belongs to nobody.",
    ],
    rules: [
      [
        "各ラウンドは、ハブにダブルを1枚置いて始まります。最初のラウンドはセットでいちばん大きいダブル、以降は1つずつ小さくなり、最後はダブルブランクです。全員に手札が配られ（ほかの人には裏向き）、残りのドミノは山（ボーンヤード）になります。",
        "Each round begins with one double in the hub: the set's highest in the first round, then one lower each round, down to double blank. Everybody is dealt a hand (face down to the others), and the rest of the tiles are the boneyard.",
      ],
      [
        "自分の番には、ドミノを1枚、端の数字が合う場所に置きます。置けるのは、自分の列車、メキシカントレイン、またはマーカーが出ている誰かの列車の、開いている端です。どの列車も、最初の1枚は、ハブのダブルに合わせます。",
        "On your turn, lay one tile where its end matches. You may lay on the open end of your own train, of the Mexican Train, or of any train that has its marker out. The first tile of every train matches the double in the hub.",
      ],
      [
        "置けるドミノがなければ、山から1枚引きます。置けるなら、そのまま置きます。置けない場合や、山に残りがない場合は、自分の列車にマーカーを出します。自分がその列車に置くまで、誰でもそこに置けるようになります。",
        "If you cannot lay a tile, draw one from the boneyard. If it can go, lay it. If it cannot, or if there is nothing left to draw, put your marker on your train. Until you lay on it yourself, anybody may now lay on it.",
      ],
      [
        "ダブルを置いたら、続けてもう1枚、それに合うドミノでふたをしなければなりません。ふたのないダブルがあるときは、ほかのどこにも置く前に、置ける人が、誰の列車であってもふたをします。",
        "Lay a double and you must lay again to cover it, with a tile that matches it. A double left uncovered must be covered, by whoever can and whoever's train it is on, before anybody lays anything anywhere else.",
      ],
      [
        "誰かが最後のドミノを置くか、誰も置けず山も空になると、ラウンド終了です。全員、手札に残った点（ピップ）の合計が得点になります。",
        "A round ends when somebody lays their last tile, or when nobody can lay and the boneyard is empty. Everybody scores the pips left in their hand.",
      ],
      [
        "最終ラウンドのあと、合計がいちばん低い人の勝ちで、同点なら勝ちを分け合います。",
        "After the last round, the lowest total wins, and those level on the lowest share the win.",
      ],
    ],
    board: [
      "ダブル12は、このゲームに付いてくるセットで、最初に遊ぶのに向いています。ダブル9は、ピップの数が少ない、短いゲームになります。ダブル15は、大人数の卓向きの、長いゲームです。短いゲームは、いちばん大きいダブルから数えて、ラウンドが半分になります。",
      "Double-twelve is the set the game is sold with, and the one to start with. Double-nine makes a quicker game with fewer pips. Double-fifteen makes a long game for a big table. A short game has half the rounds, counting down from the highest double.",
    ],
    review: AGENT_READ,
  },
  yacht: {
    tagline: [
      "サイコロ5個、振れるのは3回まで、記入欄は13。キープしたいものを残して残りを振り直し、得点表を埋めて高得点を目指します。",
      "Five dice, up to three rolls, thirteen boxes. Keep what you like, roll the rest again, and fill your sheet for a high score.",
    ],
    origin: [
      "ポーカーダイスの仲間のサイコロゲームで、1930年代からヨットの名前でゲームのルール集に載り、以来、家庭の食卓で遊ばれてきました。フランスのヤムス、中南米のヘネララは、その近い親戚です。ここで使うのは、いま多くの卓で使われている13欄の得点表で、上段にはボーナスがあります。誰のものでもありません。",
      "A dice game of the poker-dice family, in books of game rules since the 1930s under the name Yacht, and played at kitchen tables ever since. Yams in France and Generala in Latin America are its close cousins. The sheet used here is the thirteen-box one most tables use today, with the bonus for the upper half. It belongs to nobody.",
    ],
    rules: [
      [
        "自分の番には、まず5個すべてを振ります。そのあと、振り直したいものだけをもう一度振り、残りはそのままにします。振れるのは全部で3回までです。サイコロをタップするとキープ、もう一度タップすると解除です。",
        "On your turn, first roll all five dice. Then roll again only the ones you want to, leaving the rest where they lie, for up to three rolls in all. Tap a die to keep it, and tap again to release it.",
      ],
      [
        "最後に振ったあと、または出目に満足したらその前でも、出目を得点表の空いている欄の1つに書き込みます。どの欄も一度しか埋められません。その欄の役にならない出目は0点になり、それがその番の最善であることもあります。",
        "After your last roll, or sooner if you like what you see, write the dice into one empty box on your sheet. Each box is filled only once. Dice that do not make a box's combination score zero there, which is sometimes the best a turn can do.",
      ],
      [
        "上段は1から6までの欄で、5個のうちその数字の目の合計が得点になります。上段の合計が63点（どの数字も3個ずつ）に届くと、さらに35点のボーナスです。",
        "The upper half is the boxes for one to six, and each scores the total of that number among the five. Reach 63 in the upper half (three of every number) and earn 35 more as a bonus.",
      ],
      [
        "下段は、スリーカードとフォーカードが5個すべての合計、フルハウス（ある数字が3個と別の数字が2個）が25点、スモールストレート（4つ連続）が30点、ラージストレート（5つ連続）が40点、ヨット（5個とも同じ）が50点で、チャンスは何でもよく、5個すべての合計です。",
        "In the lower half, three of a kind and four of a kind score the total of all five dice, a full house (three of one number and two of another) 25, a small straight (four in a row) 30, a large straight (five in a row) 40, a Yacht (all five the same) 50, and Chance, which can be anything, the total of all five.",
      ],
      [
        "13回の番で、得点表はすべて埋まります。合計がいちばん高い人の勝ちで、同点なら勝ちを分け合います。",
        "Thirteen turns fill every sheet. The highest total wins, and those level on the highest share the win.",
      ],
    ],
    board: [
      "得点表は、13欄の1種類です。1人で自己ベストに挑んでも、最大8人で1台のスマホを回しても、どの席にもコンピュータを座らせても遊べます。",
      "There is one sheet, of thirteen boxes. Play alone to beat your best, pass one phone round up to eight people, or put the computer in any seat.",
    ],
    review: AGENT_READ,
  },
  pachisi: {
    tagline: [
      "サイコロ2個、ひとり4つの駒、十字形のコース。全部の駒をゴールさせ、止まった先にいる相手の駒はスタートへ送り返します。",
      "Two dice, four pawns each and a cross-shaped course. Bring all your pawns home, and send back to the start any pawn of an opponent you land on.",
    ],
    origin: [
      "インドの国民的なゲームで、何世紀も、十字形の布の上で遊ばれてきました。アクバル大帝は、宮殿の中庭で、人を駒にして遊んだと伝えられています。19世紀に、サイコロ2個の箱入りゲームとして西洋に伝わり、スペインではパルチースと呼ばれて遊ばれています。ここで遊べるのは、その西洋の形で、封鎖、安全なマス、ボーナスがあります。誰のものでもありません。",
      "The national game of India, played on a cloth cross for centuries: Akbar is said to have played it in his palace courtyard with people for pawns. It came west in the nineteenth century as a boxed game with two dice, and Spain plays it under the name Parchís. The form here is that Western one, with its blockades, safe squares and bonuses. It belongs to nobody.",
    ],
    rules: [
      [
        "ひとり4つの駒が、自分の巣に入っています。自分の番にサイコロを2個振り、それぞれの目で駒を1つずつ動かします。同じ駒でも別の駒でもよく、順番も自由です。駒は、5の目か、2個の合計が5になる目で、巣から自分の入口のマスに出ます。",
        "Each person has four pawns in their nest. On your turn throw two dice and move a pawn by each die separately, the same pawn or different ones, in either order. A pawn comes out of the nest onto your entry square on a 5, or when the two dice add up to five.",
      ],
      [
        "駒は、共通のコースを一周したあと、自分のホームの道を通って中央へ向かいます。ゴールには、ちょうどの数で入らなければなりません。どの駒にも使えない目は、捨てます。",
        "Pawns go round the shared course, then up their own home path to the middle. A pawn must reach home by the exact count. A value that no pawn can use is lost.",
      ],
      [
        "ふつうのマスで、1つだけいる相手の駒の上に止まると、その駒は巣に戻り、自分はどの駒でも、さらに20マス進められます。丸で囲まれたマスは安全で、そこでは誰も取られません。駒をゴールさせたときは、さらに10マス進められます。",
        "Land on an opponent's lone pawn on an ordinary square and it goes back to its nest, and you move 20 more with any pawn. The ringed squares are safe, and nobody is taken there. Bring a pawn home and you move 10 more.",
      ],
      [
        "自分の駒が2つ同じマスに重なると封鎖になり、自分の駒も含めて、誰もそこを通れず、そこに止まれません。",
        "Two of your pawns on one square make a blockade: no pawn, yours included, may pass it or land there.",
      ],
      [
        "ゾロ目が出たら、もう一度振ります。1回の番に3回続けてゾロ目が出ると、コース上でいちばん先頭の駒が、巣に戻されます。4つの駒を最初にゴールさせた人の勝ちです。",
        "A double throws again. A third double in one turn sends your leading pawn on the course back to its nest. The first to bring all four pawns home wins.",
      ],
    ],
    board: [
      "中央をめぐる68マスの十字形のコースに、各色7マスのホームの道があります。2人なら向かい合い、3人か4人なら、十字の腕を1本ずつ使います。1台のスマホを回しても、どの席にもコンピュータを座らせても遊べます。",
      "A cross-shaped course of sixty-eight squares round a middle, with a home path of seven for each colour. Two sit opposite each other, and three or four take one arm of the cross each. Pass one phone round, or put the computer in any seat.",
    ],
    review: AGENT_READ,
  },
  hitotsu: {
    tagline: [
      "色か数字を合わせて出します。スキップやリバースを使い、次の人に札を引かせ、残り1枚になったら「一つ！」と言いましょう。",
      "Match the colour or the number. Use skip and reverse, make the next person draw, and say \"Hitotsu!\" when you are down to one card.",
    ],
    origin: [
      "クレイジーエイトから生まれた、色札を出し切る仲間の、このサイト独自のゲームです。4色に数字札とアクション札があるこの種のゲームは、1971年にアメリカで初めて発売され、以来、所有者の商標である名前で売られてきました。遊び方は誰のものでもありません。名前はこのサイトのもので、日本語で「1」を意味する「一つ」は、最後の1枚になったときに言う言葉です。札の絵柄もこのサイト独自で、色ごとに五行のうちの1つ、火・土・木・水が付いています。",
      "Our own game in the family of colour-card shedding games that grew out of Crazy Eights. A deck of four colours with numbers and action cards was first published in the United States in 1971 and has been sold ever since under a name that is its owner's trademark. The way of playing belongs to nobody. The name is this site's own, 一つ, meaning \"one\" in Japanese, the word called when a player is down to their last card, and so is the deck's design, with each colour marked by one of the five elements: fire, earth, wood and water.",
    ],
    rules: [
      [
        "2〜8人で、108枚のデッキから、1人7枚（パーティーモードは5枚）を配ります。デッキは、4色それぞれに、0が1枚、1から9までの数字が2枚ずつ、スキップ、リバース、ドロー2が2枚ずつ、それに、ワイルドが4枚、ワイルドドロー4が4枚です。最初にめくった数字札が、場の最初の札になります。",
        "Two to eight people, seven cards each (five in party mode) from a deck of 108: in each of four colours one zero, two of every number from one to nine, and two each of Skip, Reverse and Draw Two, plus four Wilds and four Wild Draw Fours. The first number card turned up starts the pile.",
      ],
      [
        "自分の番には、場の札と同じ色、同じ数字、同じ記号の札か、ワイルドを出します。出せないときは1枚引き、それが出せるなら、すぐに出してもかまいません。出せなければ、番は終わりです。",
        "On your turn, play a card of the same colour, the same number or the same symbol as the one on top, or a wild. If you cannot, draw one card, and if it can be played you may play it at once. If it cannot, your turn is over.",
      ],
      [
        "スキップ：次の人は、番を飛ばされます。リバース：順番が逆回りになります（2人のときはスキップと同じです）。ドロー2：次の人は、2枚引いて、番を飛ばされます。",
        "Skip: the next person misses their turn. Reverse: the order turns the other way round (with two, it acts as a skip). Draw Two: the next person draws two cards and misses their turn.",
      ],
      [
        "ワイルド：好きな色を宣言します。ワイルドドロー4：色を宣言し、次の人は4枚引いて番を飛ばされますが、チャレンジもできます。出した人が、それを出した時点の場の色の札を持っていたなら、出した人が代わりに4枚引きます。持っていなければ、チャレンジした人が6枚引きます。",
        "Wild: call any colour. Wild Draw Four: call a colour, and the next person draws four and misses their turn, but may challenge it. If the person who played it held a card of the colour that was on top when they played it, they draw the four instead. If they did not, the challenger draws six.",
      ],
      [
        "手札が残り1枚になるときに、「一つ！」と言います。言い忘れて見つかると、2枚引きます。",
        "When you are going down to one card, say \"Hitotsu!\" as you do it. If you forget and are caught, draw two.",
      ],
      [
        "最初に手札を出し切った人がそのハンドの勝ちで、ほかの全員の手札の点数を得ます。数字札はその数字、アクション札は20点、ワイルドは50点です。誰も出し切れないハンドは、手札がいちばん少ない人のものになります。ゲームの合計点（200点、フルゲームは500点）に最初に届いた人の勝ちです。1ハンドだけのゲームでは、最初に出し切った人が勝ちです。",
        "The first to run out of cards wins the hand and scores what everybody else holds: a number card its number, an action card 20, a wild 50. A hand nobody can finish goes to whoever holds the fewest. The first to the game's total (200, or 500 for the full game) wins. In a game of one hand, whoever goes out first wins.",
      ],
    ],
    board: [
      "4人がふつうの卓で、2〜8人まで座れます。フルゲームなら500点、短くするなら200点、または1ハンドを選びます。パーティーモードは、1人5枚を配って1ハンドだけ遊び、積み重ね、割り込み、7と0のパーティールールがすべて入ります。どれも単独で選ぶこともできます。",
      "Four is the usual table, and it seats two to eight. Choose 500 points for the full game, 200 for a shorter one, or one hand. Party mode deals five cards each, plays a single hand, and turns on all the party rules (stacking, jumping in, sevens and zeros), each of which can also be chosen on its own.",
    ],
    review: AGENT_READ,
  },
  diceWar: {
    tagline: [
      "全員がサイコロを振り、合計がいちばん高い人が得点します。同点は「戦争」で、より多くの点をかけて、もう一度振ります。",
      "Everybody rolls and the highest total scores. A tie is a \"war\": roll again with more points at stake.",
    ],
    origin: [
      "全員が振って、いちばん高い人が勝つ遊びは、サイコロと同じくらい古いものです。同点なら、より多くをかけて決着をつけるという決まりは、トランプのゲーム「戦争」から借りたもので、このゲームの名前もそこから来ています。どんなサイコロでも、どこでも遊べて、誰のものでもありません。",
      "Games in which everybody rolls and the highest wins are as old as dice. The rule that a tie is fought out again, for more, is borrowed from the card game War, which is where this game gets its name. It can be played with any dice anywhere, and it belongs to nobody.",
    ],
    rules: [
      [
        "2〜8人で、誰がコンピュータでもかまいません。毎ラウンド、全員が同じサイコロを振って合計します。サイコロは1個が基本で、卓の決めで最大10個まで増やせます。サイコロの面の数は、4面から100面まで選べます。",
        "Two to eight people, any of whom may be a computer. Each round everybody rolls the same dice and adds them up. It is one die unless the table chooses more, up to ten. A die may have anything from four sides to a hundred.",
      ],
      [
        "合計がいちばん高い人がそのラウンドに勝ち、1点を得ます。",
        "The highest total wins the round and scores a point.",
      ],
      [
        "2人以上が最高の合計で並んだら、戦争です。並んだ人だけがもう一度振り、戦争のたびに賭け点が1つ増えます。最後にいちばん高くなった人が、賭け点をすべて取ります。",
        "If two or more tie for the highest total, it is war. Only those who tied roll again, and the points at stake grow by one with every war. Whoever finally has the highest takes everything at stake.",
      ],
      [
        "そのあと、全員が次のラウンドのために振ります。",
        "Then everybody rolls for the next round.",
      ],
      [
        "ゲームは、5、10（標準）、25、50点のどれかを目標点にして、最初にそこへ届いた人が勝ちます。または、10、20、50ラウンドのどれかを決めて遊び、終わったときにいちばん点が多い人が勝ちで、同点なら勝ちを分け合います。",
        "A game is played to a target score of 5, 10 (the usual game), 25 or 50 points, and the first to reach it wins. Or it is played for a number of rounds, 10, 20 or 50, and when they are up the person with the most points wins, and those level on the most share the win.",
      ],
    ],
    board: [
      "振るサイコロが多いほど、合計は中央に集まるので、最高が並ぶことは少なくなります。面の少ないサイコロ1個だと、戦争がよく起きます。選んだ卓について、出目ごとの正確な確率を、設定画面で見られます。隠すものはなく、回す手札もないので、卓の誰かが「振る」を押します。",
      "The more dice each person rolls, the more their totals gather round the middle, so a tie for the highest is rarer, while one die with few sides makes war common. The set-up shows the exact odds of every throw for the table you choose. Nothing is hidden and there is no hand to pass, so anybody at the table presses Roll.",
    ],
    review: AGENT_READ,
  },
  gunjin: {
    tagline: [
      "見えない駒の2つの軍が戦います。自分の駒の階級はわかっても、相手の駒はわかりません。旗を探し出し、自分の旗を守りましょう。",
      "Two armies of hidden pieces fight. You know your own ranks but never theirs. Find the flag, and keep yours safe.",
    ],
    origin: [
      "どの駒も、相手から見えない盤上ゲームの仲間です。自分の駒はわかっても、相手の駒は推測するしかなく、戦いは階級で決まります。名前のもとになった軍人将棋は、英語で「日本の陸軍チェス」と呼ばれる遊びで、かつては審判が、どちらが勝つかだけを告げて遊ばれていました。サルパカンはフィリピン、陸戦棋は中国の遊びで、キャプチャー・フラッグは、この種のゲームでいちばん有名な箱入りゲームの形です。これらのゲームの規則は誰のものでもありません。ここにある盤はどれも、パッケージが丁寧に作った、それぞれの版です。",
      "A family of board games in which every piece is hidden from the other side. You can see what yours are and have to guess at theirs, and a fight is settled by rank. Gunjin shogi, the game it is named for, which English calls Japanese army chess, was once played with an umpire who says who wins each fight and no more. Salpakan comes from the Philippines and Luzhanqi from China, and Capture Flag is the shape of the best-known boxed game of the kind. The rules of these games belong to nobody. Each board here is the package's own careful version of one of them.",
    ],
    rules: [
      [
        "盤を選び、各自が自分の側の列に、駒を相手に見せずに並べます。1人ずつ、スマホを手渡しして行います。並べ方が最初の一手です。旗は届きにくい場所に、地雷や爆弾は、攻められそうな場所に置きましょう。",
        "Choose a board, then each side arranges its pieces in secret on its own rows, one person at a time with the phone handed over. The arrangement is the first move. Put the flag where it is hard to reach, and mines and bombs where they will be attacked.",
      ],
      [
        "そのあとは、順番に駒を1つ動かします。駒は縦か横に動き、何マス動けるかは、駒によって違います。相手の駒のいるマスへ進むと、戦いになります。自分の階級は自分の番に見られますが、相手の階級は見られません。",
        "Then take turns moving one piece. Pieces move along the rows and columns, and how far depends on the piece. Move onto an enemy piece to fight it. Your own ranks are shown to you on your turn, and the other side's are never shown.",
      ],
      [
        "戦いは階級で決まりますが、盤ごとに例外があります。スパイは大将に勝ち、工兵は地雷や爆弾を処理でき、地雷や爆弾は、ほとんどの駒を止めます。同じ階級の駒は、相打ちで盤から取り除かれます。戦った2つの駒の階級を両者に見せるのはキャプチャー・フラッグだけで、ほかの盤では、何が取られたかだけが知らされます。",
        "A fight is decided by rank, with exceptions on each board: a spy beats a general, an engineer or miner defuses a mine or bomb, and a mine or bomb stops almost everything. Pieces of equal rank remove each other. Only Capture Flag shows both ranks to both sides when pieces fight; on the other boards you are told only what was taken.",
      ],
      [
        "旗を取れば勝ちです（軍人将棋では司令部に着いたとき、サルパカンでは自分の旗を敵陣の端まで進めたとき）。相手に動ける駒がなくなっても勝ちです。いつでも投了でき、自分の番には引き分けも申し込めます。相手が受ければ引き分けで終わり、断るか、そのまま指せば、続きます。",
        "Win by taking the flag (on Gunjin Shogi, by reaching a headquarters; on Salpakan, by marching your flag to the far end of the enemy's side), or by leaving the other side with no move. Resign at any time, or offer a draw on your turn. If the other side accepts it, the game ends level, and if they decline it, or simply move, play goes on.",
      ],
      [
        "番のあいだは、スマホの画面が覆われます。誰に渡すかが表示され、その人が「自分です」を押すまで、盤は何も見えません。",
        "Between turns the phone's screen is covered. It names who to pass it to, and shows nothing of the board until that person presses that it is them.",
      ],
    ],
    board: [
      "軍人将棋（9×9、駒31枚）は、このゲームの名前のもとで、標準の盤です。サルパカン（9×8、駒21枚）と陸戦棋ミニ（7×8、駒14枚）は、もっと短く遊べます。キャプチャー・フラッグ（10×10、駒40枚、湖あり）は、長いゲームです。2人で1台のスマホを回しても、2台の端末で遊んでもかまいません。",
      "Gunjin Shogi (9×9, 31 pieces) is the one the game is named for, and the default. Salpakan (9×8, 21 pieces) and Luzhanqi Mini (7×8, 14 pieces) are quicker. Capture Flag (10×10, 40 pieces, with lakes) is the long game. Pass one phone between two people, or play on two devices.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Record<string, PartyCopyJa>;
