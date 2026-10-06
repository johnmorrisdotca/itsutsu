import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the learn.* phrases (ENJA-10). Joined into `JA_DRAFTED`.
 * The terms follow the gomoku and renju literature: 四, 活三, 活四, 四三, 三三, 四四, 四追い, 天元, 禁手, 長連. The computer players are コンピュータ.
 * Every row has been read by the reviewer agent (`review`): the standards are `japanese-reviewer.md`, the terms `TERMS.md`.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_LEARN: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The shelf
  "learn.pageTitle": r(
    "学び",
    "Learn",
  ),
  "learn.lead": r(
    "{learn}：勝ちにつながる形、相手に選ばせない手、そして、誰もが一度はする間違いをまとめています。",
    "{learn}: the shapes that lead to a win, the moves that leave the opponent no choice, and the mistakes everyone makes once.",
  ),
  "learn.tabsLabel": r(
    "ゲームの見せ方",
    "How to show the games",
  ),
  "learn.crumb": r(
    "学び",
    "Learn",
  ),
  "learn.cubePageTitle": r(
    "キューブを解く",
    "Solve the cube",
  ),

  // Five in a row, from the first stone
  "learn.five.title": r(
    "最初の石から学ぶ五目並べ",
    "Five in a row, from the first stone",
  ),
  "learn.five.summary": r(
    "狙い、形、手番。五目並べの仲間のゲームすべての土台になる考え方です。",
    "Threats, shapes and tempo: the ideas that underlie every game of the gomoku family.",
  ),
  "learn.five.threatsH": r(
    "大事なのは線ではなく狙い",
    "The game is about threats, not lines",
  ),
  "learn.five.threatsA": r(
    "黙々と5つを作って勝つ人はいません。5つは、相手が受けなければならなかった狙いの連続の終わりで、その狙いのたびに、相手の選べる手は少しずつ減っていきます。狙いで考えると、盤面は自然に読めるようになります。",
    "Nobody wins by quietly building a five. A five is the end of a series of threats the opponent had to answer, and with each one the opponent's choices shrink a little. If I think in threats, the board starts to read itself.",
  ),
  "learn.five.threatsB": r(
    "四とは、少なくとも片方の端が空いた4つの並びで、すぐにふさがなければ5つになります。活三とは、両端が空いていて、その先にも余地がある3つの並びで、今すぐ受ける必要があります。次の手で活四になり、ふさぐ端が2つあるのに、ふさぐ石は1つしかないからです。階段はこれがすべてです。三は相手に受けさせ、四はもっと強く受けさせ、活四は勝ちです。",
    "A four (四) is a line of four with at least one open end, and unless it is blocked at once it becomes five. An open three (活三) is a line of three with both ends open and room beyond them, and it has to be answered right now, because on the next move it becomes an open four (活四), which has two ends to block with only one stone to block with. That is the whole staircase: a three makes the opponent respond, a four makes the opponent respond more urgently, and an open four wins.",
  ),
  "learn.five.shapesH": r(
    "勝ちにつながる形",
    "The shapes that win",
  ),
  "learn.five.shapesA": r(
    "四三：1つの石で、四と活三を同時に作ります。四はふさがなければならず、三は活四になります。これが標準の勝ちの形で、連珠で黒に許されている唯一の二重の形です。",
    "Four-three (四三): one stone makes a four and an open three at the same time. The four must be blocked, and the three becomes an open four. This is the standard winning shape, and in renju the only double that black is allowed.",
  ),
  "learn.five.shapesB": r(
    "三三：1つの石で、活三を2つ同時に作ります。どちらをふさいでも、もう一方が活四になります。連珠では黒に、オモクでは両者に禁じられており、その強さがうかがえます。",
    "Three-three (三三): one stone makes two open threes at the same time. Whichever is blocked, the other becomes an open four. It is forbidden to black in renju and to both sides in omok, which shows how strong it is.",
  ),
  "learn.five.shapesC": r(
    "四四：2つの四を同時に作ります。ふさげません。連珠では黒に禁じられています。",
    "Four-four (四四): two fours at the same time. It cannot be blocked. It is forbidden to black in renju.",
  ),
  "learn.five.shapesD": r(
    "VCF、つまり連続する四による勝ち（四追い）は、すべての手が四で、最後の手が四三かそれに類する二重の形になる手順です。すべての手が相手に受けを強いるので、相手は自由に石を置けません。自分の石が2つか3つ近くにあり、相手の石がないときは、いつでも探してみてください。",
    "A VCF, a win by continuous fours (四追い), is a sequence in which every move is a four and the last is a four-three or a similar double. Because every move forces a reply, the opponent never gets to place a stone freely. Look for one whenever I have two or three stones near each other and the opponent has none.",
  ),
  "learn.five.tempoH": r(
    "手番と自由な1手",
    "Tempo and the free stone",
  ),
  "learn.five.tempoA": r(
    "狙いを作った側は、相手の応手がどこに来るかを決めます。受ける側は、その手から何も得られません。ですから、1手ごとに考えるべきことは、この石は相手に応手を強いるか、そうでないなら、相手は自由な1手で何をするか、です。",
    "The player who makes a threat decides where the reply goes. The player who answers gains nothing from it. So the question after every move is: does this stone force a reply, and if it does not, what will the opponent do with the free stone?",
  ),
  "learn.five.tempoB": r(
    "受ける石が、同時に狙いにもなるようにしましょう。自分の三を作る受けは、2手分の価値があります。何も作らない受けは、主導権をそのまま相手に返します。",
    "Defend with a stone that also threatens. A block that makes my own three is worth two moves. A block that makes nothing hands the initiative straight back.",
  ),
  "learn.five.openingH": r(
    "序盤",
    "The opening",
  ),
  "learn.five.openingA": r(
    "黒の最初の石は中央、つまり天元に置きます。天元を通る線は、どれも最も余地が大きいからです。",
    "Black's first stone belongs in the centre, at tengen (天元), because every line through tengen has the most room.",
  ),
  "learn.five.openingB": r(
    "白の最初の石は、その石の隣か斜めに置きます。離れすぎると黒が邪魔なく組み立て、近すぎると白が動きにくくなります。",
    "White's first stone goes next to it or diagonal to it. If too far away, black builds unopposed; if too close, white gets tangled up.",
  ),
  "learn.five.openingC": r(
    "制限のない五目並べは、最善を尽くせば黒が勝つと分かっています。そのため、本格的な規則では、黒を制限したり（連珠）、先後を入れ替えたり（スワップ2）、黒の2手目を中央から離したり（プロ）します。大事な対局で制限なしの五目並べを打つなら、ときどき白に先手を譲るか、開局ルールを使ってください。",
    "Plain gomoku is known to be a win for black with best play, which is why serious rule sets restrict black (renju), swap colours (Swap2) or push black's second stone away (Pro). If I play the plain game when a game matters, I should now and then give white the first move, or use an opening.",
  ),
  "learn.five.readingH": r(
    "読み",
    "Reading",
  ),
  "learn.five.readingA": r(
    "打つ前に、盤上の相手の狙いを数えましょう。四があれば、ふさぎます。活三があれば、先に打てる自分の四がないかぎり、ふさぎます。",
    "Before playing, count the opponent's threats on the board. If there is a four, block it. If there is an open three, block it, unless I have a four of my own to play first.",
  ),
  "learn.five.readingB": r(
    "活三をふさぐときは、自分の石が役に立つほうの端をふさぎます。たいていは、自分の石に近いほうの端です。",
    "When blocking an open three, block the end that leaves my stone useful, usually the end nearer my own stones.",
  ),
  "learn.five.readingC": r(
    "片方の端に相手の石がある並びは、死三です。四にはなりますが、活四にはなりません。四になるまでは、その受けに手を使わないでください。",
    "A line with an enemy stone at one end is a dead three. It can become a four but never an open four. Do not spend moves answering it until it becomes a four.",
  ),
  "learn.five.misereH": r(
    "負け五目：わざと負ける",
    "Misère Five: losing on purpose",
  ),
  "learn.five.misereA": r(
    "5つ作ると負けなので、四は、作った本人にとっての脅しになります。相手の目標は、自分に5つ目の点しか残さないことです。自分の並びは短く、途切れさせておき、相手の並びを伸ばさせましょう。",
    "Making five loses, so a four is a threat against the one who makes it: the opponent's aim is to leave me with nothing but the fifth point. I should keep my lines short and broken, and make the opponent's lines grow.",
  ),
  "learn.five.misereB": r(
    "終盤は偶奇で決まります。盤が埋まっていき、5つを作らされた側が負けで、5つのないまま盤が埋まれば、先手の勝ちです。終盤は、ノタクトと同じように、安全な点の数を数えましょう。",
    "The end is decided by parity. As the board fills, whoever is forced to complete a five loses, and a full board with no five goes to the player who opened. Late in the game, count the safe points as in Notakto.",
  ),

  // Renju
  "learn.renju.title": r(
    "連珠：手を縛られた黒で打つ",
    "Renju: playing black with your hands tied",
  ),
  "learn.renju.summary": r(
    "禁じ手が黒から何を奪い、白がそれをどう使うか。そして開局です。",
    "What the forbidden shapes take from black, how white uses them, and the openings.",
  ),
  "learn.renju.restrictH": r(
    "黒の制限は白の武器",
    "Black's restrictions are white's weapon",
  ),
  "learn.renju.restrictA": r(
    "黒は、三三、四四、長連を作れません。白は3つとも作ることができ、白の長連は勝ちです。この規則の狙いは、黒の先手の有利がちょうどそれくらいの価値だと見て、双方を互角にすることです。",
    "Black may not make a double three, a double four or an overline. White may make all three, and white's overline wins. The aim of the rules is to judge that black's advantage of moving first is worth about that much, and so to make the two sides even.",
  ),
  "learn.renju.restrictB": r(
    "白にとっては、何よりもひとつのことを意味します。黒を禁手の点へ追い込むことです。黒が打てない点は、白が守る必要のない点です。黒の自然な勝ちの石が三三になるように形を組めば、黒には勝ちの石がありません。",
    "For white this means one thing above all: drive black towards forbidden points. A point black may not play is a point white does not have to defend. If white builds the shape so that black's natural winning stone would be a three-three, black has no winning stone.",
  ),
  "learn.renju.threeH": r(
    "三とは何か、正確には",
    "What a three is, precisely",
  ),
  "learn.renju.threeA": r(
    "三が三として数えられるのは、あと1つの石で、まっすぐな四（活四）にできるときだけで、その石は、黒にとって合法な手でなければなりません。唯一の完成の手が禁じられている三は、三ではなく、二重の形の数にも入りません。",
    "A three counts as a three only if one more stone can make it a straight four, and that stone must itself be a legal move for black. A three whose only completion is forbidden is not a three, and does not count towards a double.",
  ),
  "learn.renju.threeB": r(
    "四とは、ちょうど5つになるまであと1つの石が足りない並びのことです。両端が空いたまっすぐな四は、2つではなく、1つの四です。",
    "A four is any line that is one stone short of exactly five. A straight four with two open ends is one four, not two.",
  ),
  "learn.renju.threeC": r(
    "5つができれば、同じ石が禁じ手の形も作っていたとしても、その場で勝ちです。",
    "A five wins at once, even if the same stone would also have made a forbidden shape.",
  ),
  "learn.renju.threeD": r(
    "盤は、黒の禁手の点に×印を付けます。印が出る前に見えるように学んでください。それこそが、このゲームが試している力です。",
    "The board marks black's forbidden points with a cross. I should learn to see them before the marks appear, since that is the skill the game tests.",
  ),
  "learn.renju.openingsH": r(
    "開局",
    "The openings",
  ),
  "learn.renju.openingsA": r(
    "RIFの開局は、最初の3手を制限します。天元、次に3×3の内側、その次に5×5の内側で、そのあと白は先後を入れ替えられます。その結果できる26の開局には名前があり、それぞれに評価が知られています。直接開局（直接。白の石が天元と同じ線上）と間接開局（間接。斜め）は、まったく違う展開になります。",
    "The RIF opening confines the first three stones: tengen, then inside the 3×3, then inside the 5×5, after which white may swap colours. The twenty-six openings that result have names, and each has a known evaluation. Direct openings (直接, white's stone on a line with tengen) and indirect openings (間接, diagonal) play out very differently.",
  ),
  "learn.renju.openingsB": r(
    "4手目は白の自由な選択で、対局の性格を決めます。大会では、そのあと黒が5手目の候補を2つ示し、白が1つを取り除きます。ここではその段階は強制されず、黒がそのまま5手目を打ちます。",
    "The fourth move is white's free choice and decides the character of the game. In tournament play black then offers two candidates for the fifth move and white removes one. Here that step is not enforced, and black simply plays the fifth move.",
  ),
  "learn.renju.openingsC": r(
    "入れ替えをするときの白のよい習慣は、均衡した開局では黒を、鋭い開局では白を取ることです。局面が鋭いときほど、黒の禁手の点が効くからです。",
    "A good habit for white when swapping: take black in the balanced openings and white in the sharp ones, because black's forbidden points bite hardest when the position is sharp.",
  ),
  "learn.renju.protocolsH": r(
    "開局の取り決めと、ここにあるもの",
    "The opening protocols, and which are here",
  ),
  "learn.renju.protocolsA": r(
    "連珠は、1世紀をかけて開局の均衡を取ってきており、その取り決めがそのまま歴史です。ここでは3つが遊べます。RIF（連珠国際連盟ルール）は最初の3手を制限し、白に入れ替えを認めます。坂田ルールは、RIFに、中央の7×7の内側に収めなければならない5手目を1つだけ加えたもので、黒の最も鋭い5手目を取り除きます。タラニコフは、最初の5手を、1×1、3×3、5×5、7×7、9×9に順に収め、その各手のあとに入れ替えを認めるので、均衡を崩す石は、そのまま相手に渡されます。",
    "Renju has spent a century balancing its opening, and the protocols are its history. Three can be played here. RIF (the Renju International Federation rule) confines the first three stones and lets white swap. Sakata is RIF with a single fifth move that must stay inside the central 7×7, which removes black's sharpest fifth stones. Tarannikov nests the first five stones in the 1×1, 3×3, 5×5, 7×7 and 9×9 and offers a swap after every one of them, so any stone that tips the balance is simply handed to the other player.",
  ),
  "learn.renju.protocolsB": {
    ...r(
      "あと3つはまだ作っていません。どれも、この盤にない同じ仕組みに頼っているからです。黒が5手目の候補を複数並べ、白が1つを残して取り除くという仕組みです。山口は、入れ替えの前に、黒が示す5手目の数を宣言します。Soosyrv-8は、白の4手目のあとで、最大8つまでの数を宣言し、そのあと入れ替えを認めます。Taraguchi-10は、タラニコフの入れ子の正方形で、最初の4手のあとに入れ替えを行い、そのあと白は代わりに10通りの5手目の候補を求められます。候補の仕組みができたら、3つとも一緒に加わり、正式なRIFの5手目の2択もできます。",
      "Three more have not been built yet, because they all rely on one mechanism this board does not have: black placing several candidate fifth moves and white removing all but one. In Yamaguchi, black declares before the swap how many fifth moves it will offer. Soosyrv-8 declares the number, up to eight, after white's fourth stone, and then offers the swap. Taraguchi-10 is Tarannikov's nested squares with a swap after each of the first four stones, after which white may instead demand ten candidates for the fifth move. When the candidate mechanism arrives, all three will come with it, along with the pair of fifth-move candidates in full RIF.",
    ),
    ask: "Names three opening protocols (Yamaguchi, Soosyrv-8, Taraguchi-10) as the sources spell them; their Japanese spellings are not settled, so a renju player should confirm them.",
  },

  // Captures
  "learn.caps.title": r(
    "二抜き連珠：勝つ道は2つ",
    "Ninuki-renju: two ways to win",
  ),
  "learn.caps.summary": r(
    "石を取れることで、すべての形の価値が変わります。狙いは崩され、2つの組は点になります。",
    "Captures change the value of every shape. Threats can be taken apart, and pairs are points.",
  ),
  "learn.caps.pairH": r(
    "端が空いた2つの組を放置しない",
    "Never leave a pair with an open end",
  ),
  "learn.caps.pairA": r(
    "並んだ2つの自分の石で、片方の端が空き、もう一方の端に相手の石があれば、取られるのを待っている状態です。組を作るたびに、挟まれる側はどこかを確かめましょう。3つ並んだ石は取られないので、三は2つの組よりずっと安全です。",
    "Two of my stones side by side, with an empty point at one end and an enemy stone at the other, are a capture waiting to happen. Every time I make a pair, I should ask where the flank is. Three in a row cannot be captured, which makes a three far safer than a pair.",
  ),
  "learn.caps.pairB": r(
    "すでに挟まれている位置に自分から入るのは安全です。取るのは、罠を閉じる石だけだからです。ですから、相手の石2つのあいだにある組は危険ではなく、見るべきは空いている端です。",
    "Moving into a flanked position is safe: only the stone that closes the trap captures. So a pair between two enemy stones is not in danger; what to watch is the empty end.",
  ),
  "learn.caps.defenceH": r(
    "受けとしての石取り",
    "Capture as defence",
  ),
  "learn.caps.defenceA": r(
    "四は、その石の1つを取ることで崩せます。四をふさぐ前に、取る手を探してください。石を取り除けて、勝ちに近づく組の数も得られます。",
    "A four can be broken by capturing one of its stones. Before blocking a four, I should look for a capture: it removes the stone and also gives me a pair towards the win.",
  ),
  "learn.caps.defenceB": r(
    "組に1つ足してできた活三は、ふさぐのではなく、取って消せることがよくあります。",
    "An open three built from a pair plus one can often be captured away instead of being blocked.",
  ),
  "learn.caps.defenceC": r(
    "5組を取れば、そのまま勝ちです。3組か4組を取った時点では、取る狙いはどれも四と同じくらい相手に受けを強いるものになります。",
    "Capturing five pairs wins outright. At three or four captures, every threat to capture is as forcing as a four.",
  ),
  "learn.caps.proH": r(
    "プロ開局",
    "The Pro opening",
  ),
  "learn.caps.proA": r(
    "黒の2手目は、中央の5×5の外に置かなければなりません。大会ルールにはわけがあります。石取りのあるゲームでは、先手の有利が制限のない五目並べより大きく、この除外がその一部を取り戻すからです。",
    "Black's second stone must be placed outside the central 5×5. There is a reason this is the tournament rule: in the capture game the first player's advantage is larger than in plain gomoku, and the exclusion takes back some of it.",
  ),
  "learn.caps.sannukiH": r(
    "三抜き連珠：3つの組も取られる",
    "Sannuki-renju: triples fall too",
  ),
  "learn.caps.sannukiA": r(
    "3つ並んでいても、もう安全ではありません。片方の端が空き、もう一方の端に相手の石がある三は、2つの組とまったく同じように危険です。取られないのは、四だけです。",
    "Three in a row is no longer safe. A three with an empty point at one end and an enemy stone at the other is exactly as exposed as a pair. Only a four cannot be taken.",
  ),
  "learn.caps.sannukiB": r(
    "数えるのは石の数で、15個で勝ちです。3つの組は、2つの組の1.5倍の価値があるので、挟まれた三を放置している相手は、真っ先に見るべき相手です。",
    "The count is of stones, and fifteen wins. A triple is worth half as much again as a pair, so an opponent who has left a flanked three is the first thing to look at.",
  ),
  "learn.caps.sannukiC": r(
    "三が取れるため、活三の狙いは、2つの組を取るゲームより弱くなります。相手は、取ることで受け、3つの石を得られるからです。できるかぎり、三に1つ足すのではなく、組に1つ足して四を作りましょう。",
    "Because threes can be captured, an open three is a weaker threat than in the pair game: the opponent may answer it by capturing it, and gain three stones. Where possible, build fours from a pair plus one rather than from a three plus one.",
  ),

  // Connect6
  "learn.six.title": r(
    "Connect6：1手に石を2つ",
    "Connect6: two stones a turn",
  ),
  "learn.six.summary": r(
    "狙いは2つ組で現れ、両端が空いた4つの並びは、それだけで決め手になります。",
    "Threats arrive in pairs, and a line of four with open ends is already decisive.",
  ),
  "learn.six.countH": r(
    "狙いは2つずつ数える",
    "Count threats in twos",
  ),
  "learn.six.countA": r(
    "石は2つずつ置くので、2つのものをふさぐことも、2つのものを作ることもできます。ふさぐのに3つ必要な相手の形は、ふさげません。",
    "I place two stones, so I can block two things or make two things. An opponent's shape that needs three blocks cannot be blocked.",
  ),
  "learn.six.countB": r(
    "両端が空いた4つの並びをふさぐには石が2つ必要で、相手の石はちょうど2つです。両端が空いた4つの並びに、ほかの狙いが加われば、勝ちです。",
    "Four in a row with both ends open needs two stones to block, and the opponent has exactly two. Four with both ends open plus any other threat wins.",
  ),
  "learn.six.countC": r(
    "片方の端だけが空いた5つの並びは、1つの狙いにすぎません。慌てないでください。石1つでふさげ、もう1つは自由に使えます。",
    "Five in a row with one open end is a single threat. Do not panic: one stone blocks it, and the other is free.",
  ),
  "learn.six.shapeH": r(
    "形",
    "Shape",
  ),
  "learn.six.shapeA": r(
    "石を2つずつ置くため、つながった形は、五目並べよりも重要です。間が空いた2つの石は、2手で四になりえます。石を近くに置いて、相手が毎手、両方の石を守りに使わざるをえないようにしましょう。",
    "Because I place stones in pairs, connected shapes matter more than in gomoku. Two stones with a gap between them are a potential four in two moves. I should keep my stones near each other and force the opponent to spend both stones on defence every turn.",
  ),

  // The drop family
  "learn.drops.title": r(
    "落とすゲームの系統：重力が盤を決める",
    "The drop family: gravity is the board",
  ),
  "learn.drops.summary": r(
    "列、偶奇、そして、あとのために仕掛けておく狙いです。",
    "Columns, parity, and the threats I set up for later.",
  ),
  "learn.drops.storedH": r(
    "狙いは打つのではなく、蓄える",
    "Threats are stored, not played",
  ),
  "learn.drops.storedA": r(
    "落とすゲームでの狙いとは、自分の四を完成させる空いた点で、まだ置かれていない石の上にあります。その列が、すぐ下まで埋まるまでは、取られません。ですから、このゲームは、どの狙いをどこに積むか、そして、下の列を埋めさせられるのは誰かの勝負です。",
    "A threat in a drop game is an empty point that would complete my four, sitting above stones that have not yet been placed. It cannot be taken until the column fills up to just below it. So the game is about which threats are stacked where, and who is forced to fill the column beneath.",
  ),
  "learn.drops.storedB": r(
    "同じ列に、上下に続けて自分の狙いが2つあれば、決め手になります。下の狙いの手前まで埋めた側は、それを失い、もう一方の側が上の狙いを得ます。隣り合う列の同じ行に狙いが2つあるのも、ほぼ同じくらい強力です。",
    "Two of my threats in the same column, one directly above the other, is decisive: whoever fills up to the lower one loses it, and the other side then gets the upper one. Two threats in adjacent columns on the same row are nearly as good.",
  ),
  "learn.drops.parityH": r(
    "偶奇",
    "Parity",
  ),
  "learn.drops.parityA": r(
    "列の数が奇数で行の数が偶数の盤では、双方が最後まで打ちきると、先手が偶数行の最後の点を埋め、後手が奇数行の最後の点を埋めることになります。そのため、奇数行の狙いは一方に、偶数行の狙いはもう一方に有利です。下から行を数えて、どの行が自分のものかを覚えておきましょう。",
    "On a board with an odd number of columns and an even number of rows, if both sides play it out, the player who moved first will fill the last point of an even row and the second player the last point of an odd row. So threats on odd rows favour one side and threats on even rows favour the other. Count the rows from the bottom and remember which are mine.",
  ),
  "learn.drops.parityB": r(
    "中央の列が最も価値があります。すべての横の並びと、2本の斜めの並びが、その列を通るからです。",
    "The middle column is worth the most, because every horizontal line and both diagonals pass through it.",
  ),
  "learn.drops.variantsH": r(
    "各種のゲーム",
    "The variants",
  ),
  "learn.drops.variantsA": r(
    "輪落とし：辺がつながっています。右の端の三は、左の端を狙います。辺を安全だと思わないでください。",
    "Ring Drop: the edges join. A three at the right edge threatens the left, so do not think of the sides as safe.",
  ),
  "learn.drops.variantsB": r(
    "穴落とし、熱点落とし：ランダムなマスは、その列の偶奇を変えます。その側で方針を決める前に、狙いがどの行に押し出されるかを確かめましょう。",
    "Hole Drop and Hot Drop: the random squares change the parity of their column. Before committing to a plan on that side, work out which rows they push my threats onto.",
  ),
  "learn.drops.variantsC": r(
    "消し落とし：下の1行がそろうと消えて、すべてが落ちます。1行上に蓄えた狙いは、すぐに打てるようになり、一番下の行の狙いは消えます。消えるタイミングを見計らいましょう。",
    "Clear Drop: a full bottom row vanishes and everything drops. A stored threat one row up becomes playable at once, and one on the bottom row disappears. Time the clearing well.",
  ),
  "learn.drops.variantsD": r(
    "譲り落とし：並びから離れて打ちます。相手の最後の石の真上には打てない規則があるため、1つの列だけで四を作らされることはありません。ニムのように、残っている安全な手の数を数えましょう。",
    "Giveaway Drop: play away from lines. Because of the rule against playing on top of the opponent's last stone, I cannot be forced into a four by a single column. As in a game of nim, count the safe moves left.",
  ),
  "learn.drops.variantsE": r(
    "縁寄せ：盤は外側から埋まっていきます。辺に沿った並びは早く現れ、中央を通る並びは最後に現れます。勝負が決まるのは中央です。",
    "Edge Drop: the board fills from the outside in. Lines along the edges appear early and lines through the centre appear last, and the centre is where the game is decided.",
  ),
  "learn.drops.variantsF": r(
    "穴通し落とし：2つのワームホールの口が、盤を自分自身につなげます。一方の口に達した並びは、同じ向きのまま、もう一方の口から続くため、自分の石から離れた列や斜めが、実は隣り合っていることがあります。局面を安全と判断する前に、口を通るすべての並びを読みましょう。",
    "Worm Drop: the two wormhole mouths join the board to itself. A line that reaches one mouth continues from the other in the same direction, so a column or diagonal that looks far from my stones may in fact be next to them. Before calling a position safe, read every line through the mouths.",
  ),

  // Twist
  "learn.twist.title": r(
    "回し五目と回し四目：盤が動く",
    "Twist Five and Twist Four: the board moves",
  ),
  "learn.twist.summary": r(
    "区画で考え、1回の回転で崩れる並びには頼らないことです。",
    "Think in quadrants, and never rely on a line that a single turn undoes.",
  ),
  "learn.twist.edgeH": r(
    "区画の境をまたぐ並びは並びではない",
    "A line across a quadrant edge is not a line",
  ),
  "learn.twist.edgeA": r(
    "毎回の手の最後に、ひとつの区画が回ります。ひとつの区画から別の区画へまたがる並びは、そのどちらを回しても崩れます。ひとつの区画の中にある並びは、ほかの3つの区画の回転にはすべて耐え、自分の区画を回しても、動くだけです。",
    "Every turn ends with a quadrant rotating. A line that crosses from one quadrant into another can be broken by turning either one. A line that lives inside a single quadrant survives every turn of the other three, and turning its own quadrant only moves it.",
  ),
  "learn.twist.edgeB": r(
    "ですから、強い形は区画の中にあるもので、とくに3×3の区画の中央のマスは、その区画が回っても、まったく動きません。6×6の盤では、その4つの中央の点が、あらゆる方針の拠り所です。",
    "So the strong shapes are the ones inside a quadrant, especially the centre cell of a 3×3 quadrant, which does not move at all when the quadrant turns. On the 6×6 board those four centre points are the anchors of every plan.",
  ),
  "learn.twist.turnH": r(
    "自分の手で回転を使う",
    "Use the turn on your own move",
  ),
  "learn.twist.turnA": r(
    "石を置いてから、回します。回したあとに並ぶ石を置くのが基本の戦術です。石は、並びが今ある場所ではなく、これからできる場所に置きます。",
    "I place, then turn. The basic tactic is to place a stone that will line up after the turn: the stone goes where the line will be, not where it is now.",
  ),
  "learn.twist.turnB": r(
    "相手の並びを崩す回転は守りで、自分の並びを完成させる回転は攻めです。最高の回転は、その両方を兼ねます。",
    "Turning to break the opponent's line is defence, and turning to complete my own is attack. The best turns do both.",
  ),
  "learn.twist.turnC": r(
    "双方が同時に5つを作った場合は、引き分けです。負けそうなときは、相手の5つと自分の5つを一緒に作る回転を探しましょう。",
    "If both sides make five at once, it is a draw. When I am losing, I should look for a turn that makes the opponent's five and mine together.",
  ),

  // Small games
  "learn.small.title": r(
    "罠三、四角四目、三目並べ、そして、ひとひねりのあるゲーム",
    "Trap Three, Square Four, tic-tac-toe and the trick games",
  ),
  "learn.small.summary": r(
    "最後まで読みきれるほど短いゲームと、最後まで読むとはどういう感覚かを紹介します。",
    "Games short enough to read to the end, and what reading to the end feels like.",
  ),
  "learn.small.trapH": r(
    "罠三",
    "Trap Three",
  ),
  "learn.small.trapA": r(
    "置く石は1つごとに、次に打てる手を狭めます。自分の石で三を作る石は、負けになるので、実際には自分にとって打てない手です。自分の安全な手と、相手の安全な手を数えましょう。",
    "Every stone I place narrows what I can play next: a stone that would make three of my own is, in practice, illegal for me, because it loses. Count my safe moves, and count the opponent's.",
  ),
  "learn.small.trapB": r(
    "勝つための考え方は、相手に安全な手を残さないことです。5×5の盤では、それがすぐに来ます。空いているどの点も、相手には三、自分には四になる局面を目指して打ちましょう。",
    "The winning idea is to leave the opponent with no safe move. On a 5×5 board that comes quickly. Play towards a position where every empty point makes a three for the opponent and a four for me.",
  ),
  "learn.small.trapC": r(
    "四は、作っても安全で、勝ちです。両端が空いた2つの並びは、2手で四になる狙いですが、続きがすべて三になるなら、自分にとっても罠です。両方を確かめましょう。",
    "A four is safe to make and wins. A line of two with both ends open is a threat to make four in two moves, but it is also a trap for me if the only continuation makes three. Check both.",
  ),
  "learn.small.squareH": r(
    "四角四目",
    "Square Four",
  ),
  "learn.small.squareA": r(
    "2×2の正方形は、静かな勝ちです。L字形の3つの駒は、1手で正方形を作る狙いで、相手は4つ目の点に居座るか、そこに駒を動かして入れなければなりません。",
    "The 2×2 square is the quiet win. Three pieces in an L shape threaten to make a square in one move, and the opponent must sit on the fourth point or move a piece into it.",
  ),
  "learn.small.squareB": r(
    "置く段階では、並びと正方形の両方を狙えるように、十分に広げます。滑らせる段階では、1手が、点を離れることと、点を取ることの両方になります。動かした駒が、何を守らなくなるかを見ましょう。",
    "In the placing phase, spread out enough to threaten both a line and a square. In the sliding phase, every move both leaves a point and takes one, so look at what the piece I move stops guarding.",
  ),
  "learn.small.squareC": r(
    "このゲームは、最善を尽くせば引き分けです。勝ちは、相手が並びを守って正方形を忘れるか、その逆のときに生まれます。",
    "With perfect play the game is a draw. Wins come when the opponent guards the line and forgets the square, or the other way round.",
  ),
  "learn.small.tttH": r(
    "三目並べ",
    "Tic-tac-toe",
  ),
  "learn.small.tttA": r(
    "最初の手は中央が最強で、それに対する最強の返しは角です。最初の手を辺に打つと、正しく打たれて負けます。",
    "The centre is the strongest first move, and a corner is the strongest reply. An edge as the first move loses to correct play.",
  ),
  "learn.small.tttB": r(
    "勝つための考え方はひとつ、フォークです。2つの並びを同時に2つにする手のことです。引き分けにする戦略は、すべて、防ぐべきフォークの一覧です。",
    "The only winning idea is the fork: a move that makes two lines of two at once. Every drawing strategy is a list of forks to prevent.",
  ),
  "learn.small.tttC": r(
    "それを知っている者どうしなら、必ず引き分けです。それが教訓であり、より大きな盤がある理由です。",
    "Between players who know that, it is always a draw. That is the lesson, and the reason the bigger boards exist.",
  ),
  "learn.small.wildH": r(
    "自由三目",
    "Wild tic-tac-toe",
  ),
  "learn.small.wildA": r(
    "どちらの色でも置け、どちらの色の並びでも、完成させた側の勝ちです。ですから、どちらの色でも、端が空いた2つの並びは、自分にも相手にも同じ狙いで、次に打つ側が取ります。",
    "I may place either colour, and a line of either colour wins for whoever completes it. So a line of two of any colour with an open end is equally a threat to me and to my opponent: whoever moves next takes it.",
  ),
  "learn.small.wildB": r(
    "強いられた場合を除き、端が空いた2つの並びを、相手の手番に残さないでください。先手は、中央に打ち、そのあとも正しく打てば勝ちます。後手の仕事は、すべての並びを、石1つのままか、埋まった状態に保つことです。",
    "Never leave a two with an open end on the opponent's turn unless forced to. The first player wins by taking the centre and then playing correctly, and the second player's job is to keep every line at one stone or full.",
  ),
  "learn.small.notaktoH": r(
    "ノタクト",
    "Notakto",
  ),
  "learn.small.notaktoA": r(
    "石はすべて黒で、3つ並べると負けです。盤を、生きている並び（空き点が2つ以上あり、まだ三になっていない）と、死んだ並びの集まりと考えましょう。",
    "Every stone is black, and making three in a row loses. Think of the board as a set of lines that are alive (two or more empty points, no three yet) and dead.",
  ),
  "learn.small.notaktoB": r(
    "3×3の盤が1枚なら、先手は、正しく打たれると負けます。中央が唯一安全な出だしですが、それでも負けます。候補の手ごとに、そのあとに残る安全な手を数えましょう。先に尽きたほうが負けなので、偶数を残します。",
    "On a single 3×3 board the first player loses against correct play: the centre is the only safe start, and it still loses. After each candidate move, count the safe moves left. The player who runs out first loses, so I should leave an even number.",
  ),
  "learn.small.makerH": r(
    "作り手と壊し手",
    "Maker and Breaker",
  ),
  "learn.small.makerA": r(
    "作り手は、誰が置いたかを問わず、同じ色の5つを望み、壊し手は、それがないまま盤が埋まることを望みます。壊し手の仕事は、言うほど簡単ではありません。どちらの色の活四にも、すぐに反対の色で受けなければならないからです。",
    "The Maker wants five of one colour, whoever placed them, and the Breaker wants the board to fill up without one. The Breaker's job is easier to describe than to do: every open four of either colour must be answered at once with the other colour.",
  ),
  "learn.small.makerB": r(
    "作り手のときは、2色の狙いを作ります。点を共有しない黒の四と白の四は、1手では両方をふさげません。壊し手のときは、異なる色の2つの並びを同時に断つ場所に石を置き、すべての並びを混ぜておきます。",
    "As Maker, I build two-colour threats: a black four and a white four that share no point cannot both be blocked in one move. As Breaker, I place stones where they cut two lines of different colours at once, and keep every line mixed.",
  ),
  "learn.small.makerC": r(
    "6×6の盤では、一般に、作り手が有利だと考えられており、そのため、このサイトでは、対局ごとに席を替えられます。",
    "On the 6×6 board the Maker is generally thought to have the advantage, which is why the site lets the players change seats between games.",
  ),

  // Pieces
  "learn.pieces.title": r(
    "二連五目と積み五目：駒の列を読む",
    "Domino Five and Block Five: playing the queue",
  ),
  "learn.pieces.summary": r(
    "双方に同じ駒が来るのが見えています。勝負は、できれば持ちたくない駒をどう使うかにあります。",
    "You both see the same pieces coming. The game is in what you do with a piece you would rather not have.",
  ),
  "learn.pieces.queueH": r(
    "盤の前に駒の列を読む",
    "Read the queue before the board",
  ),
  "learn.pieces.queueA": r(
    "双方に同じ並びの駒が来て、次の3つが表示されます。そのため、相手がこれから置かなければならない駒が分かり、相手にも自分の駒が分かります。黒の手にある白白のドミノも、白の石が使えない場所に置けば、災難ではありません。盤の遠い側や、黒がすでにふさいだ並びの中です。",
    "Both players get the same run of pieces, and the next three are shown. So I know what my opponent will have to lay, and they know mine. A white-white domino in black's hand is not a disaster if black lays it where white's stones cannot use it: on the far side of the board, or into a line black has already blocked.",
  ),
  "learn.pieces.queueB": r(
    "駒を2つ先まで考えて計画します。次の次の駒が自分によいものなら、今の駒は、その駒が効く場所に余地を残すように置きます。",
    "Plan two pieces ahead. If the piece after next is good for me, place the current one so as to make room for it where it will count.",
  ),
  "learn.pieces.cutsH": r(
    "どの駒も両刃",
    "Every piece cuts both ways",
  ),
  "learn.pieces.cutsA": r(
    "相手の色を持つ駒は、相手の5つを完成させることがあり、その場合は、誰が置いたかにかかわらず、相手の勝ちです。置く前に、駒のすべてのマスを、自分の並びだけでなく、相手の並びとも照らし合わせましょう。",
    "A piece carrying the opponent's colour can complete the opponent's five, and then the opponent wins no matter who laid it. Before laying a piece, check every cell of it against the opponent's lines, not only my own.",
  ),
  "learn.pieces.cutsB": r(
    "両方の色を持つ駒は、自分の石が自分の並びを伸ばし、相手の石が死んだ点に落ちるように置けます。端のそば、またはすでにふさがれた並びの上です。",
    "A piece carrying both colours can be laid so that my stone extends my line while the opponent's stone lands on a dead point: next to the edge, or on a line that is already blocked.",
  ),
  "learn.pieces.cutsC": r(
    "積み五目では、1マスの駒が貴重な資源です。1マスの駒は、四が必要とする唯一の隙間を埋めるか、相手の四が必要とする唯一の隙間をふさぎます。決め手にだけ使い、手番稼ぎには使わないでください。",
    "In Block Five, single pieces are the scarce resource. A single fills the one gap a four needs, or blocks the one gap the opponent's four needs. Spend them on decisive moments, never on tempo.",
  ),
  "learn.pieces.nothingH": r(
    "どこにも入らないとき",
    "When nothing fits",
  ),
  "learn.pieces.nothingA": r(
    "終盤には、大きな形が入る余地がなくなり、手番はパスになります。パスが2回続くと、引き分けで終わります。盤上で優勢なら、自分の駒がまだ入るよう、整理しておきます。劣勢なら、混み合った盤と引き分けが、得られる最良の結果かもしれません。",
    "Late in the game the board runs out of room for the larger shapes and the turn passes. Two passes in a row end the game as a draw. If I am ahead on the board, I keep it tidy so my pieces still fit; if I am behind, a crowded board and a draw may be the best result available.",
  ),

  // The cube's method
  "learn.cube.holdTitle": r(
    "白い面を下にして持つ",
    "Hold it with the white side down",
  ),
  "learn.cube.holdAim": r(
    "キューブ全体を回して、白が下になるようにします。このあとのどの手順も、この向きで持つことを前提に書かれています。",
    "Turn the whole cube so that white is underneath. Every step after this is written for the cube held this way.",
  ),
  "learn.cube.holdHow": r(
    "3×3では、白の中心を下にします。中心は動かないので、各面が何色になるかを示してくれます。2×2には中心がないので、後ろ左の角の下に白いシールが来るように持ち、その角を軸に組み立てます。",
    "On a 3×3 the white centre goes on the bottom. The centres never move, so they show which colour each face will be. A 2×2 has no centres, so hold it with a white sticker underneath its back-left corner, and build around that corner.",
  ),
  "learn.cube.crossTitle": r(
    "白の十字",
    "The white cross",
  ),
  "learn.cube.crossAim": r(
    "4つの白い辺を、白の中心のまわりに置き、それぞれの辺のもう一方の色を、隣の中心の色に合わせます。",
    "Put the four white edges around the white centre, each with its other colour matching the centre beside it.",
  ),
  "learn.cube.crossHow": r(
    "1つずつ、面を回して、その辺を自分の色の中心の下へ下ろします。ここで覚える手順はなく、目で見て考えます。表示される回転は、そのやり方のひとつです。",
    "One edge at a time, turn faces to bring it down under its own centre. There is no algorithm to learn here; it is worked out by eye, and the turns shown are one way of doing it.",
  ),
  "learn.cube.cornersTitle": r(
    "白の角",
    "The white corners",
  ),
  "learn.cube.cornersAim": r(
    "4つの白い角を入れて、白の段全体を完成させます。",
    "Put in the four white corners, finishing the whole white layer.",
  ),
  "learn.cube.cornersHow": r(
    "上の面を回して、角が入るべき場所の真上に来るようにし、その側から R U R' U' を、白が下を向いて収まるまで繰り返します。1回繰り返すごとに角は1ひねり進むので、1回、3回、5回のいずれかです。",
    "Turn the top until a corner sits above the place it belongs, then repeat R U R' U' from that side until it drops in with white facing down. Each repetition moves it one twist, so it takes one, three or five.",
  ),
  "learn.cube.layerTitle": r(
    "最初の段",
    "The first layer",
  ),
  "learn.cube.layerAim": r(
    "持っている角のまわりに、ほかの3つの白い角を、それぞれ隣と色が合うように入れます。",
    "Put the other three white corners in around the one you are holding, each matching its neighbours.",
  ),
  "learn.cube.layerHow": r(
    "2×2の最初の段は、下の面全体です。上、右、前の面を1面ずつ回して、それぞれの角を、すでに収まっている角の隣へ下ろします。",
    "The first layer of a 2×2 is its whole bottom. Turn the top, the right and the front, one face at a time, to bring each corner down beside the ones already home.",
  ),
  "learn.cube.middleTitle": r(
    "中段",
    "The middle layer",
  ),
  "learn.cube.middleAim": r(
    "4つの中段の辺を入れて、最初の2段を完成させます。",
    "Put in the four middle edges, finishing the first two layers.",
  ),
  "learn.cube.middleHow": r(
    "上の面で、黄色を含まない辺を探し、その前の色が下の中心と合うように上の面を回し、それぞれの側の手順で、右か左へ送り込みます。",
    "Find an edge on top with no yellow, turn the top so that its front colour matches the centre below, then send it to the right or left with the algorithm for that side.",
  ),
  "learn.cube.yCrossTitle": r(
    "黄色の十字",
    "The yellow cross",
  ),
  "learn.cube.yCrossAim": r(
    "上の面に黄色の十字を作ります。辺は、まだ側面と色が合っていなくてかまいません。",
    "Make a yellow cross on top. The edges do not need to match their sides yet.",
  ),
  "learn.cube.yCrossHow": r(
    "黄色の線が左右に走る向きか、角の形が後ろ左を指す向きに持ち、F R U R' U' F' を行います。点なら3回、角の形なら2回、線なら1回かかります。",
    "Hold a yellow line running left to right, or a corner shape pointing to the back left, and do F R U R' U' F'. A dot takes three times, a corner shape twice, and a line once.",
  ),
  "learn.cube.yFaceTitle": r(
    "黄色の面",
    "The yellow face",
  ),
  "learn.cube.yFaceAim": r(
    "すべての黄色いシールを上に向けます。",
    "Turn every yellow sticker to face up.",
  ),
  "learn.cube.yFaceHow": r(
    "上の面をまず回してから、スーネ（R U R' U R U2 R'）を行います。黄色の角がすでに1つ上を向いているときは、それを前左に持ちます。上の面全体が黄色になるまで繰り返します。",
    "Do the Sune, R U R' U R U2 R', after first turning the top. When one yellow corner is already up, hold it at the front left. Repeat until the whole top is yellow.",
  ),
  "learn.cube.yCornersTitle": r(
    "黄色の角",
    "The yellow corners",
  ),
  "learn.cube.yCornersAim": r(
    "黄色の角を、それぞれ自分の色の間に収まるまで回して動かします。",
    "Move the yellow corners around until each sits between its own colours.",
  ),
  "learn.cube.yCornersHow": r(
    "すでに自分の色の間に収まっている角を探し、それを前左に持ちます。角の入れ替え（R' F R' B2 R F' R' B2 R2）で、残りの3つがその角のまわりを回り、1、2回で収まります。",
    "Find a corner that already sits between its own colours and hold it at the front left. The corner cycle, R' F R' B2 R F' R' B2 R2, moves the other three around it, and once or twice puts them home.",
  ),
  "learn.cube.yEdgesTitle": r(
    "黄色の辺",
    "The yellow edges",
  ),
  "learn.cube.yEdgesAim": r(
    "最後の辺を入れ替えて収めれば、キューブは完成です。",
    "Cycle the last edges into place, and the cube is solved.",
  ),
  "learn.cube.yEdgesHow": r(
    "完成した側面があれば、それを後ろに持ち、辺の入れ替え（R U' R U R U R U' R' U' R2）を行います。1、2回で完成します。",
    "If there is a finished side, hold it at the back and do the edge cycle, R U' R U R U R U' R' U' R2. Once or twice finishes it.",
  ),
  "learn.cube.algCornerIn": r(
    "角を入れる",
    "Corner in",
  ),
  "learn.cube.algEdgeRight": r(
    "辺を右へ",
    "Edge to the right",
  ),
  "learn.cube.algEdgeLeft": r(
    "辺を左へ",
    "Edge to the left",
  ),
  "learn.cube.algYellowCross": r(
    "黄色の十字",
    "Yellow cross",
  ),
  "learn.cube.algSune": r(
    "スーネ",
    "Sune",
  ),
  "learn.cube.algCornerCycle": r(
    "角の入れ替え",
    "Corner cycle",
  ),
  "learn.cube.algEdgeCycle": r(
    "辺の入れ替え",
    "Edge cycle",
  ),
  "learn.cube.guideLead": r(
    "多くの人が最初に覚える、段ごとに進める方法です。白を下に、次に中段、そして、上に黄色です。短い手順が7つあり、どの段階も、キューブで練習できます。",
    "The layer-by-layer method most people learn first: white on the bottom, then the middle, then yellow on top. There are seven short algorithms, and a cube to practise every step on.",
  ),
  "learn.cube.notationHeading": r(
    "回転の読み方",
    "Reading the turns",
  ),
  "learn.cube.notationA": r(
    "各文字は、正面から見た面を表します。R は右、L は左、U は上、D は下、F は前、B は後ろです。文字だけなら、その面を、その面を見たまま時計回りに回します。",
    "Each letter is a face as seen from the front: R is right, L is left, U is up, D is down, F is front and B is back. A letter on its own turns that face clockwise, as seen looking at it.",
  ),
  "learn.cube.notationB": r(
    "文字のあとの印（R'）は、反時計回りに回します。あとの 2（R2）は、半回転です。",
    "A mark after the letter, R', turns it anticlockwise. A 2 after it, R2, turns it a half turn.",
  ),
  "learn.cube.notationC": r(
    "x、y、z は、R、U、F が回すのと同じ向きに、キューブ全体を回します。x は前を上へ持ち上げ、y は机の上で回し、z は上を右へ倒します。キューブ全体を回すことは、手としては数えません。",
    "x, y and z turn the whole cube the way R, U and F turn their faces: x brings the front up to the top, y spins the cube on the table, and z tips the top over to the right. Turning the whole cube never counts as a move.",
  ),
  "learn.cube.sizeLabel": r(
    "どのキューブか",
    "Which cube",
  ),
  "learn.cube.twoByTwo": r(
    "2×2には中段も辺もないので、手順は4つで済みます。持つ向き、最初の段、そして、3×3と同じ手順を使う黄色の面と、黄色の角です。",
    "A 2×2 has no middle layer and no edges, so it takes four of the steps: holding it, building the first layer, and then the yellow face and the yellow corners using the same algorithms as the 3×3.",
  ),
  "learn.cube.practise": r(
    "この段階を練習する",
    "Practise this step",
  ),
  "learn.cube.practising": r(
    "この段階が終わるまでキューブを回します。シールをドラッグして、その段を回し、キューブの周囲をドラッグして見回すか、回転を入力します（x、y、z はキューブ全体を回します）。",
    "Turn the cube until the step is done: drag a sticker to turn its layer, drag around the cube to look at it, or type the turns (x, y and z turn the whole cube).",
  ),
  "learn.cube.lineUp": r(
    "向きを合わせる",
    "Line it up",
  ),
  "learn.cube.showTurns": r(
    "回転を表示する",
    "Show the turns",
  ),
  "learn.cube.turnFor": r(
    "代わりに回す",
    "Turn it for me",
  ),
  "learn.cube.another": r(
    "別のキューブ",
    "Another cube",
  ),
  "learn.cube.again": r(
    "最初からやり直す",
    "Start again",
  ),
  "learn.cube.done": r(
    "できました。この段階は完了です。",
    "Done: that step is finished.",
  ),
  "learn.cube.playHeading": r(
    "そのあと、時間を計る",
    "Then time yourself",
  ),
  "learn.cube.play": r(
    "手順を見なくてもできるようになったら、本物のキューブを混ぜてみましょう。遊ぶページでは、行き詰まったときに「やり方を見る」で次の段階が示されますが、それを使った解き方には点が付きません。",
    "Once the steps come without looking, scramble one for real. On the play page, \"Show me how\" gives the next step whenever I am stuck, but a solve that uses it scores no points.",
  ),
};
