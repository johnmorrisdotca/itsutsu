import { AGENT_READ_2026_10_06, type CopyReview, type JaLine } from "../copyJa.types";
import type { BotTier } from "../../gomoku/opponent.types";

/**
 * The computer players' words in Japanese, beside the English rows they sit
 * with: `BOT_PROFILES` (`opponent.constants.ts` and `opponentSpecialists.constants.ts`,
 * which the measured ladder's fingerprint hashes, so they are never edited
 * for a translation) and `BOT_MEMBERS[…].bio` (`bots.constants.ts`).
 *
 * John, 2026-10-06: the bots are コンピュータ in Japanese, never 機械 or 棋士
 * and never コンピューター. A player's NAME is not translated: the Latin name
 * and its `native` form (級, 名人, 国手, 李文静…) stay as the English rows have
 * them, and a sentence that names a player writes the given name as it is.
 */
export type BotCopyJa = {
  /** The tier in the words a player choosing an opponent needs. */
  strength: JaLine;
  /** The few lines under a name when an opponent is chosen. */
  blurb: JaLine;
  /** What the player's own page says about it. */
  bio: JaLine;
  review?: CopyReview;
  ask?: string;
};

export const BOT_COPY_JA: Record<BotTier, BotCopyJa> = {
  minaPark: {
    strength: ["いちばんやさしい・守り型", "Gentlest, defensive"],
    blurb: [
      "目の前の手に応じるだけで、その先までは見ません。Minaは見えている狙いはふさぎますが、先を読まず反応しているだけなので、たくさん見落とします。初心者の守りは、実際そういうものです。",
      "She only answers what is in front of her and does not look beyond it. Mina blocks the threats she can see, but she is reacting rather than planning, so she misses a great deal. That is what a beginner's defence really is.",
    ],
    bio: [
      "Minaは学校でオモク（韓国の五目並べ）を覚え、多くの人が始めるときと同じように打ちます。相手がいま打った手を見て、それに応じるだけで、その先までは見ません。作るよりふさぐことが多いのは、そう決めたからではなく、計画がなくても見えるのがふさぐ手だからです。見落としが多く、誰にでも倒せます。",
      "Mina learned omok (the Korean form of gomoku) at school and plays the way most people start: she looks at the move you have just made and answers it, and does not look any further. She blocks more than she builds, not because she decided to, but because blocking is what you can see without a plan. She misses a great deal and anyone can beat her.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  kenjiArakawa: {
    strength: ["強い・攻め型", "Hard, attacking"],
    blurb: [
      "名人の強さを攻めに向けた打ち手です。Kenjiは問題を解くより、問題を突きつけるほうが好きで、この強さだと、突きつけられる問題は本物です。ただし、そのために勝負を手放すことはありません。",
      "A player who aims Meijin's strength at attacking. Kenji prefers setting problems to solving them, and at this strength the problems he sets are real. But he never gives up a game to do it.",
    ],
    bio: [
      "Kenjiは名人の強さで打ち、そのすべてを相手に向けます。問いに答えるより、問いを出すほうが好きなので、彼との対局は、彼の脅しのどれを本気にするかを決める勝負になりがちです。そのために勝負を手放すことはありません。攻めは好みであって、賭けではありません。",
      "Kenji plays at Meijin's strength and aims all of it at his opponent. He prefers asking questions to answering them, so a game against him tends to be about deciding which of his threats to take seriously. He never gives up a game to do it. The attack is a preference, not a gamble.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  liWenjing: {
    strength: ["最強・守り型", "Strongest, defensive"],
    blurb: [
      "国手の強さを、相手が作ろうとしているものに向けた打ち手です。Wenjingは、自分が打ちたい点より先に、相手が打ちたかった点を取り、勝負が自分のほうへ来るのを待ちます。",
      "A player who aims 国手's strength at whatever the opponent is building. Wenjing takes the point the opponent wanted before the one she wanted herself, and waits for the game to come to her.",
    ],
    bio: [
      "Wenjingは国手の強さで打ち、相手が作ろうとしているものすべてにそれを向けます。自分が打ちたい点より先に、相手が打ちたかった点を取るので、勝つのは遅いのですが、急がせるのはとても難しい相手です。彼女との対局は、1つの手に負けるより、手が尽きて終わることが多くなります。",
      "Wenjing plays at 国手's strength and aims it at whatever her opponent is building. She takes the point the opponent wanted before the one she wanted herself, so she wins slowly, but she is very hard to hurry. Games against her tend to end with the opponent running out of ideas rather than losing to a single move.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  amaraOkafor: {
    strength: ["中程度・気まぐれ", "Medium, changeable"],
    blurb: [
      "段の強さで打ち、打ち方を気まぐれに変えます。Amaraはしばらく激しく攻め、そのあと静かになってすべてに受け答えし、また攻めに戻ります。難しいのは、どれと対局しているのか分からないことです。",
      "She plays at Dan's strength and changes how she plays on a whim. Amara attacks hard for a while, then goes quiet and answers everything, then goes back to attacking. The difficulty is not knowing which of them you are playing.",
    ],
    bio: [
      "Amaraは段の強さで打ち、その使い方を気まぐれに変えます。6手か7手のあいだ激しく攻め、そのあと静かになって相手のどの試みにも応じ、また攻めてきます。これは乱数ではありません。彼女はただ気分で打っていて、その気分が移り変わるだけです。",
      "Amara plays at Dan's strength and changes on a whim how she uses it. For six or seven moves she attacks hard, then goes quiet and answers everything the opponent tries, then attacks again. None of it is random. She is simply playing by mood, and the mood turns over.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  ingridSolheim: {
    strength: ["やさしい・守り型", "Easy, defensive"],
    blurb: [
      "級の強さで打ち、自分で作る前にまず受けます。Ingridは見落としもあり、本人もそれを知っていますが、急がせるのがとても難しい相手です。負ける人の多くは、自分の焦りに負けています。",
      "She plays at Kyu's strength and answers before she builds. Ingrid misses things and knows it, but she is very hard to hurry. Most of the players who lose to her lose to their own impatience.",
    ],
    bio: [
      "Ingridはベルゲンで30年間、子どもたちに「待てば盤が何をすべきか教えてくれる」と教えてきて、教えたとおりに打ちます。いつも相手の脅しが先で、自分の計画はそのあとです。強くはなく、強そうに見せることもありません。級の強さで打ち、見落としもあります。ただ、急がせるのがとても難しい相手です。",
      "Ingrid spent thirty years in Bergen teaching children that the board tells you what to do if you wait, and she plays the way she taught. The opponent's threat always comes first, and her own plan after it. She is not strong and does not pretend to be. She plays at Kyu's strength and misses things. She is simply very hard to hurry.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  rafaDuarte: {
    strength: ["中程度・攻め型", "Medium, attacking"],
    blurb: [
      "段の強さで打ち、いつも問いを出す側でいたがります。Rafaは受けるより先に脅威を作るので、思いのほかうまくいきます。うまくいかないときは、見ている誰もが、Rafaより1手早くそれに気づいています。",
      "He plays at Dan's strength and always prefers to be the one asking the question. Rafa builds threats faster than he answers them, which works better than it should. When it does not, everyone watching saw it coming one move before he did.",
    ],
    bio: [
      "Rafaはサンパウロの広場にあるコンクリートの台でドラフツを覚えました。そこでの規則は単純で、いちばん長く取る手を、いますぐ取ることです。五目並べには遅れて出会い、その癖は抜けませんでした。段の強さで打ち、相手の問題を解くより、相手に問題を解かせたがります。段と同じ打ち手を、逆向きにしたようなものです。",
      "Rafa learned draughts on a concrete table in a square in São Paulo, where the rule is simple: you take the longest capture, and you take it now. He came to five in a row late and never lost the habit. He plays at Dan's strength and would rather make the opponent solve a problem than solve the opponent's. He is the same player as Dan, pointed the other way.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  razryad: {
    strength: ["いちばんやさしい", "Gentlest"],
    blurb: [
      "始めたばかりです。Razryadはそれらしい手を打ち、たまたま見えた勝ちは取りますが、ほとんどは見逃し、取るより多く渡してしまいます。最初に対局する相手で、最初に倒す相手です。",
      "Just starting out. Razryad plays a reasonable-looking move and takes a win it happens to see, but misses most of them and gives away more than it takes. The first one to play and the first one to beat.",
    ],
    bio: [
      "разрядは、5つの階級のうち、いちばんやさしいコンピュータです。この言葉は、ロシアのアマチュアがスポーツで持つ等級のことで、ロシアでは連珠もスポーツです。Razryadは、勝ちがあってもそのうち3回に1回ほどしか見つけられず、ときどき手番を無駄にします。Razryadとの対局はレーティング対局で、Razryad自身にもレーティングがあります。",
      "разряд is the gentlest computer of the five grades. The word is the classification a Russian amateur holds in a sport, and renju is a sport in Russia. Razryad sees a win only about once in three times it has one, and now and then wastes a turn. Games against Razryad are rated games, and Razryad has a rating of its own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  kyu: {
    strength: ["やさしい", "Easy"],
    blurb: [
      "形を覚えている段階です。Kyuは目の前にある勝ちは取りますが、相手が作っているものの多くを見落とします。最初の相手にちょうどよく、数局打った人なら誰でも勝てます。",
      "Still learning the shapes. Kyu takes a win that is right in front of it but misses much of what the opponent is building. A good first opponent, and anyone who has played a few games can beat it.",
    ],
    bio: [
      "級は、5つの階級のうち、2番目にやさしいコンピュータです。Kyuは1手先を読みます。すでにある列は完成させますが、相手が作っているものの多くを見落とします。Kyuとの対局はレーティング対局で、Kyu自身にもレーティングがあります。",
      "級 is the second gentlest computer of the five grades. Kyu looks one move ahead. It completes a line that is already there but misses much of what the opponent is building. Games against Kyu are rated games, and Kyu has a rating of its own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  dan: {
    strength: ["中程度", "Medium"],
    blurb: [
      "段位を持つ打ち手です。Danは盤上にある実際の手に受け答えし、目の前で列を完成させることは許しません。強いられていないときは自分で作ります。遠くまでは見えないので、先を読んで上回ることはできます。",
      "A graded player. Dan answers what is actually on the board and will not let a line be completed in front of it. When nothing is forced, it builds its own. It does not see far, so it can still be out-planned.",
    ],
    bio: [
      "段は、5つの階級の真ん中のコンピュータです。Danはすべての手について、相手がどう返せるかを確かめるので、目の前で列を完成させることは許しません。それより先は読みません。Danとの対局はレーティング対局で、Dan自身にもレーティングがあります。",
      "段 is the computer in the middle of the five grades. Dan checks every move against how the opponent could reply, so it will not let a line be completed in front of it. It does not read further than that. Games against Dan are rated games, and Dan has a rating of its own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  meijin: {
    strength: ["強い", "Hard"],
    blurb: [
      "名人です。Meijinは脅威が現れる前に読み、四にも三にも受け、返しの手で勝ちを渡すことがありません。最初の数局は負ける覚悟をしてください。",
      "The master. Meijin reads threats before they appear, answers both a four and a three, and never hands over a win in its reply. Expect to lose the first few games.",
    ],
    bio: [
      "名人は、5つの階級のうち、2番目に強いコンピュータです。Meijinは、列を読めるゲームでは数手先まで読み、脅しが現れる前に受けます。Meijinとの対局はレーティング対局で、Meijin自身にもレーティングがあります。",
      "名人 is the second strongest computer of the five grades. In games where lines can be read, Meijin reads several moves ahead and answers a threat before it appears. Games against Meijin are rated games, and Meijin has a rating of its own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  guoshou: {
    strength: ["全般に最強", "Strongest all-round"],
    blurb: [
      "国の手、つまり国手です。Guoshouは動く前にMeijinより多くの盤面を検討し、さらに2手先まで読むよう求められていて、大きな盤や終盤で差が出ます。温めていた脅威は、打つ前に受けられてしまいます。小さな盤では、両者とも同じ深さで考える時間が尽きるので、よく似た打ち方になります。どちらに勝っても、誰かに話す価値があります。",
      "The hand of the nation, that is 国手. Before moving, Guoshou weighs more of the board than Meijin and is asked to read two moves further, and the difference shows on big boards and in endgames. A threat that was being saved is answered before it is played. On small boards both run out of thinking time at the same depth and play much alike. Beating either is worth telling somebody about.",
    ],
    bio: [
      "国手は、段位のある5つのうち、いちばん強いコンピュータです。この言葉は「国の手」という意味で、中国が、五目並べと一緒に育った盤上ゲームの最高の打ち手に与えた称号です。Guoshouは名人より先まで読み、動く前に盤のより多くを検討し、このサイトのどのゲームでも打ちます。これは専門のコンピュータにはできないことです。Guoshouとの対局はレーティング対局で、Guoshou自身にもレーティングがあります。",
      "国手 is the strongest computer of the five graded ones. The word means \"the nation's hand\" and is the title China gave its finest player of the board games that five in a row grew up beside. Guoshou reads further than Meijin, weighs more of the board before moving, and plays any game on this site, which is something the specialist computers cannot do. Games against Guoshou are rated games, and Guoshou has a rating of its own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  tamenoki: {
    strength: ["リバーシで最強", "Strongest at Reversi"],
    blurb: [
      "リバーシが専門で、ほかはほとんど打ちません。Tamenokiは、リバーシの打ち手が数えるものを数えます。角、角を渡してしまうマス、相手に残された応手の数です。そして最後の12マスほどは、推測せずに正確に読み切ります。中盤に築いた石数のリードは、彼がまさに奪おうとしているものです。",
      "A specialist in Reversi who plays almost nothing else. Tamenoki counts what a Reversi player counts: corners, the squares that give away a corner, and how many replies the opponent has left. The last dozen or so squares he reads out exactly rather than guessing. The lead in discs built in the middle of the game is exactly what he is trying to take away.",
    ],
    bio: [
      "為乃木秀正は、ここで1つのゲームだけを打つコンピュータです。Tamenokiはリバーシを打ち、リバーシの打ち手と同じように読みます。まず角、次に双方に残された打てる手、次に最前線で、石の数は最後です。終盤では、最後の12マスほどを、判断ではなく正確に数え切ります。名前は、オセロの世界選手権で7回優勝し、史上最高の打ち手と広く認められているHideshi Tamenoriへのオマージュです。Tamenokiとの対局はレーティング対局で、Tamenoki自身にもレーティングがあります。",
      "為乃木秀正 is a computer that plays only one game here. Tamenoki plays Reversi and reads it the way a Reversi player does: corners first, then the moves each side has left to play, then the front line, and the number of discs last of all. In the endgame he counts out the last dozen or so squares exactly instead of judging them. The name is an homage to Hideshi Tamenori, seven times world champion at Othello and widely regarded as the finest player ever. Games against Tamenoki are rated games, and Tamenoki has a rating of his own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  meritalu: {
    strength: ["五目並べで最強", "Strongest at five in a row"],
    blurb: [
      "五目並べが専門で、ほかはほとんど打ちません。Meritaluは形ではなく脅威を数えます。受けなければならない四、誰にも止められない活四、そして1つの石で2つの脅威を作って勝負を決める手です。引き分けに持ち込めない相手で、そこが段位のコンピュータとの違いです。",
      "A specialist in five in a row who plays almost nothing else. Meritalu counts threats rather than shape: the four that must be answered, the open four that nobody can stop, and the move that makes two threats with one stone and ends the game. He cannot be drawn with, which is the difference between him and the graded computers.",
    ],
    bio: [
      "ここで五目並べだけを打つコンピュータで、ほかはほとんど打ちません。Meritaluは形ではなく脅威を数えます。受けなければならない四、受けようのない活四、そして1つの石で2つの脅威を同時に作る手です。名前は、連珠の世界選手権で4回優勝し、ヨーロッパ人として初めてその称号を得たAndo Meriteeへのオマージュです。Meritaluとの対局はレーティング対局で、Meritalu自身にもレーティングがあります。",
      "A computer that plays only five in a row here and almost nothing else. Meritalu counts threats rather than shape: the four that must be answered, the open four that cannot be answered, and the move that makes two threats at once with one stone. The name is an homage to Ando Meritee, four times world champion at renju and the first European to hold the title. Games against Meritalu are rated games, and Meritalu has a rating of his own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  monkton: {
    strength: ["ダイヤモンドゲームで最強", "Strongest at Chinese Checkers (the Diamond Game)"],
    blurb: [
      "競走ゲームが専門で、ほかはほとんど打ちません。Monktonは、競走の打ち手が数えるものを数えます。盤が実際に描かれている格子の上で、各駒があと何歩残っているかを数え、向かい側の陣のマスを各駒に1つずつ割り当て、陣の奥から先に埋めます。彼が本当に狙っているのは、相手が後ろに残した駒です。最後の1つが入るまでゲームは終わらないので、相手が見事な中盤を築いても、先にゴールします。ハルマも打ち、駒が込み合って互いの邪魔になる盤でいちばん力を発揮します。",
      "A specialist in the race games who plays almost nothing else. Monkton counts what a race player counts: on the lattice the board is really drawn on, how many steps each piece has left, with a square of the far camp set aside for each piece and the back of the camp filled first. What he is really playing for is the piece the opponent leaves behind. The game is not over until the last one is in, so even if the opponent builds a fine middlegame he finishes first. He plays Halma too, and is at his best on crowded boards where the pieces get in each other's way.",
    ],
    bio: [
      "ここで競走ゲームだけを打つコンピュータです。MonktonはハルマとChinese Checkers（ダイヤモンドゲーム）を打ち、競走の打ち手と同じように読みます。盤が実際に描かれている格子の上で、各駒があと何歩残っているかを数え、向かい側の陣のマスを各駒に1つずつ割り当て、陣の奥から先に埋めます。相手が後ろに残した駒こそ、彼が狙っているものです。最後の1つが入るまでゲームは終わりません。星形の盤と、駒が込み合うハルマの盤でいちばん力を発揮します。ほぼ純粋な競走になる、広い16×16のハルマの盤では、段位の上位のコンピュータと変わりません。名前は、1880年代にハルマを考案したボストンの外科医、George Howard Monksへのオマージュです。Chinese Checkersは彼のゲームを星形に移したもので、どちらにも、名前を借りられるような優勝者はいません。Monktonとの対局はレーティング対局で、Monkton自身にもレーティングがあります。",
      "A computer that plays only the race games here. Monkton plays Halma and Chinese Checkers (the Diamond Game) and reads them the way a race player does: on the lattice the board is really drawn on, how many steps each piece has left, with a square of the far camp set aside for each piece and the back of the camp filled first. The piece the opponent leaves behind is exactly what he is playing for. The game is not over until the last one is in. He is at his best on the star board and on the crowded Halma boards. On the big 16×16 Halma board, which is nearly a pure race, he is no different from the top graded computers. The name is an homage to George Howard Monks, the Boston surgeon who devised Halma in the 1880s. Chinese Checkers is his game moved onto a star, and neither has had a champion whose name could be borrowed. Games against Monkton are rated games, and Monkton has a rating of his own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  tinsdale: {
    strength: ["チェッカーとドラフツで最強", "Strongest at checkers and draughts"],
    blurb: [
      "チェッカーと5つのドラフツが専門で、ほかは打ちません。Tinsdaleは、ドラフツの打ち手が数えるものを数えます。まず駒の数で、キングはふつうの駒2.5個分、次に自陣の最後列で、相手にキングになれる駒が残っているうちは手放しません。そして盤の中央です。優勢なら、駒を交換します。5対4はまだ勝負ですが、2対1はもう勝負になりません。劣勢なら、交換しません。",
      "A specialist in checkers and the five draughts games, and nothing else. Tinsdale counts what a draughts player counts: material first, with a king worth two and a half ordinary pieces, then his own back row, which he will not give up while the opponent still has a piece that could be crowned, and the middle of the board. When ahead, he trades pieces: five against four is still a game, but two against one is no longer a game. When behind, he does not trade.",
    ],
    bio: [
      "ここでチェッカーとドラフツだけを打つコンピュータです。Tinsdaleは、イギリス式のチェッカーと、国際、ブラジル、カナダ、ロシア、プールのゲームを打ち、ドラフツの打ち手と同じように読みます。まず駒の数、次に、キングになれる駒が残っているうちは守る最後列、盤の中央、そして優勢なときに交換する理由です。名前は、チェッカーの世界チャンピオンで、45年間でわずか7局しか負けず、史上最高の打ち手と広く認められているMarion Tinsleyへのオマージュです。Tinsdaleとの対局はレーティング対局で、Tinsdale自身にもレーティングがあります。",
      "A computer that plays only checkers and draughts here. Tinsdale plays English checkers and the international, Brazilian, Canadian, Russian and pool games, and reads them the way a draughts player does: material first, then the back row he keeps while there is a piece that could be crowned, the middle of the board, and a reason to trade when ahead. The name is an homage to Marion Tinsley, world champion at checkers, who lost only seven games in forty-five years and is widely regarded as the finest player ever. Games against Tinsdale are rated games, and Tinsdale has a rating of his own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  hondo: {
    strength: ["小さい盤の囲碁で最強", "Strongest at Go on the small boards"],
    blurb: [
      "囲碁だけを打ちます。Hondōは、碁会所の打ち手がまず見るところを見ます。それぞれの空き点が、近くにある石の持ち主によって、どちらの地になるか、そしてどの一団が呼吸点に乏しいかです。相手の一団がアタリになっていれば取りにいき、自分の一団がアタリになっていれば助けにいきます。",
      "Plays only Go. Hondō looks first where a club player looks: whose territory each empty point is, depending on whose stones are nearer, and which groups are short of liberties. If an opponent's group is in atari he means to take it, and if one of his own is, he means to save it.",
    ],
    bio: [
      "本堂秀策は、ここで囲碁だけを打つコンピュータです。Hondōは、碁会所の打ち手と同じように盤を読みます。それぞれの空き点が、近くにある石の持ち主によって、どちらの地になるか、そしてどの一団が呼吸点に乏しいかです。アタリになった一団は、取るか助けるかを、ほかの何より先に決めます。名前は、御城碁で19年間不敗だった本因坊秀策へのオマージュで、日本の碁を学ぶ人が誰でも敬うよう教えられる打ち手です。Hondōとの対局はレーティング対局で、Hondō自身にもレーティングがあります。",
      "本堂秀策 is a computer that plays only Go here. Hondō reads the board the way a club player does: whose territory each empty point is, depending on whose stones are nearer, and which groups are short of liberties. A group in atari is taken or saved before anything else is considered. The name is an homage to Hon'inbō Shūsaku, who was unbeaten for nineteen years of castle games and is the player every Japanese student of Go is taught to revere. Games against Hondō are rated games, and Hondō has a rating of his own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  wuyi: {
    strength: ["Connect6で最強", "Strongest at Connect6"],
    blurb: [
      "Connect6だけを打ちます。Wuyiは、Connect6の打ち手が数えるものを数えます。双方に列が何本あるかではなく、それをすべてふさぐには石が何個必要かです。1手に2つしか置けないので、3つの脅威が同時にあれば勝ちが決まり、彼は最初の石から3つを目指して築いていきます。",
      "Plays only Connect6. Wuyi counts what a Connect6 player counts: not how many lines each side has, but how many stones it would take to block them all. Only two stones are placed per move, so three threats at once means a won game, and he builds towards three from the very first stone.",
    ],
    bio: [
      "吳一辰は、ここでConnect6だけを打つコンピュータです。Wuyiは、ゲーム自身の理論と同じように読みます。脅威とは、石があと2つで六になる列のことで、1つの石でそれをふさげ、1手は石2つです。そのため大切なのは、盤上のすべての脅威をふさぐのに石が何個要るかで、3個なら勝ちです。名前は、2003年にConnect6を考案し、その開局の解明を主導したI-Chen Wuへのオマージュです。Wuyiとの対局はレーティング対局で、Wuyi自身にもレーティングがあります。",
      "吳一辰 is a computer that plays only Connect6 here. Wuyi reads it the way the game's own theory does: a threat is a line that is two stones short of six, one stone blocks it, and a move is two stones. So what matters is how many stones it takes to block every threat on the board, and three means a win. The name is an homage to I-Chen Wu, who devised Connect6 in 2003 and led the work that solved its openings. Games against Wuyi are rated games, and Wuyi has a rating of his own.",
    ],
    review: AGENT_READ_2026_10_06,
  },
};
