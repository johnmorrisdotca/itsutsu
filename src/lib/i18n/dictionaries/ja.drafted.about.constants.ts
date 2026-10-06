import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the about.* phrases (ENJA-10). Joined into `JA_DRAFTED`.
 * Game names inside the prose are the Japanese ones the catalogue uses (五目並べ, 連珠, オセロ). The computer players are コンピュータ. Tags and `{names}` are kept in each phrase and left out of its back-translation.
 * Every row has been read by the reviewer agent (`review`): the standards are `japanese-reviewer.md`, the terms `TERMS.md`.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_ABOUT: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The story: where it comes from
  "about.where.title": r(
    "このサイトの由来",
    "Where this site comes from",
  ),
  "about.where.a": r(
    "このサイトの創設者は、長年、両親とふたつの家に分かれて、初期のウェブにあった大きな順番制のサイトで遊んでいました。<out https://www.itsyourturn.com/>ItsYourTurn</out>と<out https://www.goldtoken.com/>GoldToken</out>です。父とは何よりも<game reversi>オセロ</game>を、母とは<game freestyle>五目並べ</game>と<game ninuki>ペンテ</game>、そしてオセロを遊びました。1日に1手ではなく、1日に何時間も遊ぶこともありました。同じ3人のあいだで数十局を同時に進め、数分おきに自分の番かどうかを見に戻り、たいてい自分の番でした。サイトには手数の制限があり、無料の会員は1日に決まった手数までで、一方では20手、もう一方では100手でした。20手では昼まで持たないので、家族は制限を外すために会員になりました。父は通好みのサイト<out https://www.littlegolem.net/>Little Golem</out>でも、世界中の見知らぬ相手と対局していました。創設者はそこに参加しませんでしたが、同じ家のゲームの輪の一部でした。",
    "For years the founder of this site and his parents played, split between two houses, on the big turn-based sites of the early web: ItsYourTurn and GoldToken. With his father he played Othello above all, and with his mother five-in-a-row (gomoku narabe) and Pente, and Othello too. Not one move a day; sometimes he played for hours a day. They ran dozens of games at once among the same three people, went back every few minutes to see whether it was their turn, and it usually was. The sites limited the number of moves: a free member got a set number of moves a day, twenty on one and a hundred on the other. Twenty moves would not last until lunch, so the family became members to lift the limit. His father also played against strangers from all over the world on Little Golem, the connoisseur's site. The founder did not join it, but it was part of the same circle of games.",
  ),
  "about.where.b": r(
    "それらのサイトが分かっていたことは、その後なかば忘れられています。互いを大切に思う人どうしの対局は、速い必要はありませんが、<em>残されている</em>必要はあります。戻ってきたときにいつもそこにある局面、自分を待つ対局の一覧、誰が誰に勝ったかの記録、そして上っていく順位表です。それは、ふたつの家に離れて暮らしながら、同じ部屋にいる方法でもありました。1手は、<em>ここにいるよ、あなたのことを考えているよ</em>と伝える小さな便りで、1日に100手も打てば、それは会話になります。",
    "What those sites understood has since been half forgotten. A game between people who care about each other does not need to be fast, but it does need to be kept there: the position that is always there when you come back, the list of games waiting for me, the record of who beat whom, and a ladder to climb. It was also a way of being in the same room while living apart in two houses. One move is a small note saying \"I am here, I am thinking of you\", and a hundred moves in a day make a conversation.",
  ),
  "about.where.c": r(
    "{site}は、その流れを受け継ぐものであり、その人たちへの敬意でもあります。大切だったことはそのまま残しました。対局は自分を待ってくれ、自分の手番を待つ対局が先頭に並び、終わった対局はすべて記録され、相手の席は誰にでも渡せるリンクです。そこに、ポケットの中のスマートフォンだからできることを加えました。相手の席のためのQRコード、危ないときに知らせてくれる盤、ほしいときのヒントです。手数の制限はありません。100手でも打ってください。",
    "{site} carries that on, and is a tribute to those people. What mattered is kept as it was: the game waits for me, the games waiting for my move line up first, every finished game is recorded, and the other seat is a link that can be handed to anyone. To that I added what only the smartphone in my pocket makes possible: a QR code for the other seat, a board that tells me when I am in danger, and a hint when I want one. There is no limit on moves. Play a hundred moves if you like.",
  ),

  // The story: five stones
  "about.stones.title": r(
    "五つの石と、その来歴",
    "Five stones, and where they came from",
  ),
  "about.stones.a": r(
    "5つ並べるゲームは、今も遊ばれている娯楽のなかで、ほとんど何よりも古いものです。日本では<jp>五目並べ</jp>と呼ばれ、記録に残る最も古い例は千年前の平安時代にさかのぼります。家にあった道具が碁盤と碁石だったので、それを使って遊んでいました。似たゲームは、中国ではさらに古くからあったとされています。規則は爪の上にも書けるほど短く、<game freestyle>自分の色を5つ一列に並べれば勝ち</game>です。だからこそ、今まで続いてきました。",
    "The game of lining up five is older than almost anything else people still play for fun. In Japan it is called gomoku narabe, and the oldest example in the records goes back a thousand years, to the Heian period. The tools a house had were a go board and go stones, so they used those. Similar games are said to have existed even earlier in China. The rules are short enough to write on a fingernail: if I line up five of my colour in a row, I win. That is exactly why it has lasted.",
  ),
  "about.stones.b": r(
    "これほど単純な規則には、正しく打てば先手が勝つという問題があり、日本の打ち手は19世紀にはそれに気づいていました。その答えが<game renju>連珠</game>です。「連なった真珠」という意味で、この名前は1899年に記者の黒岩涙香が仏教の言葉から取って付けました。連珠では、三三、四四、長連を禁じることで黒に制限を課します。連珠は20世紀を通じて日本で本格的な競技になり、国際連珠連盟は1988年に設立され、第1回連珠世界選手権は1989年に京都で開かれました。今もそこで打たれています。",
    "The trouble with such a simple rule is that the first player wins if play is correct, and Japanese players had noticed this by the 19th century. The answer was renju. It means \"a string of pearls\", and the name was taken from a Buddhist phrase by the journalist Kuroiwa Ruikō in 1899. In renju, black is restricted by forbidding the double three, the double four and the overline. Renju became a serious competition in Japan through the 20th century; the Renju International Federation was founded in 1988, and the first Renju World Championship was held in Kyoto in 1989. It is still played there today.",
  ),
  "about.stones.c": r(
    "連珠の親戚で、石を取れる<game ninuki>二抜き連珠</game>は、2つの石を両側から挟んで取ることができます。これは意外な形で太平洋を渡りました。1977年、オクラホマ州スティルウォーターのレストランで働いていたゲーリー・ガブレルがこれを<game ninuki><em>ペンテ</em></game>に仕立て、ペンテは1980年代初めのアメリカで、最もよく売れた抽象ゲームのひとつになりました。ペンテは創設者が母と最もよく遊んだゲームで、ここにある石取りのゲームも同じ源から来ています。",
    "Renju's relative, ninuki-renju, in which a pair of stones can be captured by bracketing it, crossed the Pacific in an unexpected way. In 1977 Gary Gabrel, who was working at a restaurant in Stillwater, Oklahoma, turned it into Pente, and Pente became one of the best-selling abstract games in America in the early 1980s. Pente is the game the founder played most with his mother, and the capture games here come from the same source.",
  ),
  "about.stones.d": r(
    "この系統は広がり続けてきました。<game connect6>Connect6</game>は2003年に台湾の呉毅成教授が考案したもので、先手の有利をすっかり消すひとつの工夫があります。黒の最初の1手のあとは、毎回2つずつ石を置くのです。<game tictactoe>三目並べ</game>はこの系統で最も古く、3つ並べる盤はローマの床に刻まれており、そこでは<em>terni lapilli</em>と呼ばれていました。石を落とす<game dropFour>コネクトフォー</game>は1974年にミルトン・ブラッドリー社が発売し、1988年には解かれています。先手は中央の列から始めれば勝てます。ここにある落とすゲームは、その発想から出発して八方に広がっています。",
    "The family has kept growing. Connect6 was devised in 2003 by Professor I-Chen Wu of Taiwan, with one idea that erases the first player's advantage entirely: after black's single first stone, each turn places two stones. Tic-tac-toe is the oldest of the family; boards for lining up three are carved into Roman floors, where it was called terni lapilli. Connect Four, in which stones are dropped, was released by Milton Bradley in 1974 and was solved in 1988: the first player wins by starting in the middle column. The drop games here start from that idea and spread out in eight directions.",
  ),
  "about.stones.hogetsu": r(
    "<jp>浦月</jp>（<em>Hogetsu</em>）、斜めの開局です。連珠では26の開局すべてに月や星の名が付いており、この開局は黒にとって非常に強いため、大会の規則では、これを打たれた白が席を入れ替えられます。",
    "Hogetsu, the diagonal opening. In renju all twenty-six openings are named after the moon and stars, and because this opening is very strong for black, the tournament rules let white swap seats after it.",
  ),
  "about.stones.hogetsuLabel": r(
    "連珠盤の中央に、斜めに並んだ3つの石：黒、白、黒。",
    "Three stones in a diagonal in the centre of a renju board: black, white, black.",
  ),
  "about.stones.capture": r(
    "ペンテの石取りです。黒の輪の付いた石が白の2つを挟み、白の石は両方とも盤から消えます。5つ並べれば勝ちである点は同じで、5組を取っても勝ちです。",
    "A capture in Pente. The black stone with a ring brackets the two white stones, and both white stones disappear from the board. Lining up five still wins, and so does capturing five pairs.",
  ),
  "about.stones.captureLabel": r(
    "2つの白い石の両端に黒い石が1つずつあり、その2つの石は薄く表示され、取られる直前です。",
    "A black stone at each end of a pair of white stones; the pair is faded, about to be captured.",
  ),
  "about.stones.originsLabel": r(
    "1875年から2025年までの年表で、リバーシ、連珠、オセロ、コネクトフォー、ペンテ、Connect6が登場した年を示しています。",
    "A chronology from 1875 to 2025 showing the years Reversi, renju, Othello, Connect Four, Pente and Connect6 appeared.",
  ),
  "about.stones.originsCaption": r(
    "この系統の新しいゲームが生まれた年です。五目並べ自体は、左の端から9世紀はみ出し、三目並べは20世紀はみ出しています。",
    "The years the newer games of the family were born. Gomoku itself overflows the left edge by nine centuries, and tic-tac-toe by twenty.",
  ),
  "about.stones.evReversi": r(
    "リバーシ",
    "Reversi",
  ),
  "about.stones.evReversiNote": r(
    "ロンドン",
    "London",
  ),
  "about.stones.evRenju": r(
    "連珠の命名",
    "Renju named",
  ),
  "about.stones.evRenjuNote": r(
    "東京",
    "Tokyo",
  ),
  "about.stones.evOthello": r(
    "オセロ",
    "Othello",
  ),
  "about.stones.evOthelloNote": r(
    "日本",
    "Japan",
  ),
  "about.stones.evConnectFour": r(
    "コネクトフォー",
    "Connect Four",
  ),
  "about.stones.evConnectFourNote": r(
    "アメリカ",
    "USA",
  ),
  "about.stones.evPente": r(
    "ペンテ",
    "Pente",
  ),
  "about.stones.evPenteNote": r(
    "オクラホマ",
    "Oklahoma",
  ),
  "about.stones.evConnectSix": r(
    "コネクト6",
    "Connect6",
  ),
  "about.stones.evConnectSixNote": r(
    "台湾",
    "Taiwan",
  ),

  // The story: the Japanese thread
  "about.japan.title": r(
    "日本という糸",
    "The Japanese thread",
  ),
  "about.japan.a": r(
    "創設者の家族は半分が日本人で、ゲームもその血筋とともにありました。<game freestyle>五目並べ</game>、囲碁、<game reversi>オセロ</game>は、画面を通して遊ぶずっと前から家で遊ばれており、ここで英語のラベルの横に添えられた日本語の名前は、飾りではなく、食卓でそのゲームがそう呼ばれていた名前です。サイトの名前は数字です。{name}、<em>{reading}</em>は、そのまま「5」を意味します。一列に並ぶ5つの石と、マークの中の5つの石です。",
    "The founder's family is half Japanese, and the games came with that heritage. Gomoku narabe, go and Othello were played at home long before they were played through a screen, and the Japanese names added beside the English labels here are not decoration but the names by which those games were called at the table. The name of the site is a number. {name}, {reading}, simply means \"five\": the five stones in a row, and the five stones in the mark.",
  ),
  "about.japan.b": r(
    "サイトの見た目は、何世紀ものあいだ使われてきた道具に由来しています。蛤の碁石の象牙色、那智黒の石の炭の色、榧の碁盤の蜂蜜色、棋譜を印刷した和紙。日本語の表示書体は明朝体で、囲碁の本が図に使う書体の仲間です。ラベルの横に日本語の名前があるときは、そちらのほうが古い名前です。",
    "The look of the site comes from the tools used over centuries: the ivory colour of a clamshell go stone, the charcoal colour of slate stones, the honey colour of a kaya board, the washi on which game records were printed. The Japanese typeface is a mincho face, of the family go books use for their diagrams. When a label has a Japanese name beside it, that name is the older one.",
  ),
  "about.japan.c": r(
    "その底には、日本の考え方である設計の発想もあります。<jp>間</jp>、<em>ma</em>、つまり、ものの形を決める、ものとものとの間の空きです。盤は、ほとんどが空いています。よい局面は、石がある場所だけでなく、石がない場所からも読み取られます。ここにあるページも、同じように余白を残し、1回にひとつのことだけを伝えようとしています。",
    "There is also a design idea underneath, and it is a Japanese one: ma, the gap between things that gives them their form. A board is mostly empty. A good position is read not only from where the stones are but from where they are not. The pages here also try to leave room in the same way and to say only one thing at a time.",
  ),

  // The story: Othello
  "about.othello.title": r(
    "オセロ",
    "Othello",
  ),
  "about.othello.a": r(
    "<game reversi>オセロ</game>は、創設者が父と何よりもよく遊んだゲームで、何時間も続けて遊び、しっかり上達しました。そして、意外に思われますが、日本のゲームです。その祖先の<game classicReversi>リバーシ</game>は、1880年代のイギリスの室内遊戯で、2人の発明者が、新聞の投書欄で自分が考案者だと言い争いました。今、世界で遊ばれている形、つまり、中央に4枚を置く決まった開始、8×8の盤、ムーア人とヴェネチア人を描いたシェイクスピアの劇にちなんだ名前、黒と白が裏返し合うという形は、日本の長谷川五郎が定め、1973年に日本で発売されました。1977年の第1回世界選手権以来、世界チャンピオンの大半は日本から出ており、このゲームの一言の売り文句「覚えるのに1分、極めるのに一生」も日本の宣伝文句です。",
    "Othello was the game the founder played most with his father, for hours at a stretch, and he got properly good at it. It is, perhaps surprisingly, a Japanese game. Its ancestor Reversi was an English parlour game of the 1880s, and two inventors argued in the letters column of a newspaper over who had devised it. The form now played around the world, with the fixed start of four discs in the centre, the 8×8 board, the name taken from Shakespeare's play about a Moor and a Venetian, and black and white flipping each other, was fixed by Goro Hasegawa of Japan and released in Japan in 1973. Since the first world championship in 1977 most world champions have come from Japan, and the game's one-line selling point, \"a minute to learn, a lifetime to master\", is also a Japanese slogan.",
  ),
  "about.othello.b": r(
    "オセロは、ひとつの大事な点で五目並べの正反対です。<game freestyle>五目並べ</game>では一度置いた石は永久にそのままですが、オセロでは終わるまで何も自分のものではなく、50手目でほぼ一色に染まった盤が、60手目には相手のものになることもあります。両方を何年も遊ぶと、一種の二重の視点が身につきます。局面を、線の集まりとして、そして、辺と角の集まりとして、同時に見る視点です。ここには今、次のものが盤に載っています。家族が遊んだままの<game reversi>オセロ</game>、開始が自由な古い<game classicReversi>リバーシ</game>、石が少ないほうが勝つ<game antiReversi>逆リバーシ</game>、対局の途中で大きな盤に広げられる<game miniReversi>小リバーシ</game>、辺が2マス遠くなる<game grandReversi>大リバーシ</game>、そして<game honeycomb>同じゲームを六角形で遊ぶ</game>もので、並びは8方向ではなく6方向にでき、取れる角も4つではなく6つあります。",
    "In one important respect Othello is the opposite of five in a row. In gomoku a stone stays for ever once placed, but in Othello nothing is mine until the end, and a board that is nearly all one colour at move 50 can belong to the opponent at move 60. Playing both for years gives a kind of double vision: seeing a position at once as a set of lines and as a set of edges and corners. The following are on the board here now: Othello as the family played it, the old Reversi with a free start, the reversed Reversi in which having fewer discs wins, the small Reversi that can grow to a bigger board mid-game, the large Reversi whose edges are two squares further off, and the same game played on a hexagon, where lines can run in six directions rather than eight and there are six corners to take rather than four.",
  ),
  "about.othello.c": r(
    "オセロは、古い議論にも決着をつけました。自由な五目並べは1993年に、連珠は2001年に解かれました。どちらも先手の勝ちで、連珠に制限があるのはそのためです。6×6のオセロは、同じ年に<em>後手</em>の勝ちだと示されました。完全な盤は2023年まで残り、滝沢弘樹が、双方が最善を尽くすと引き分けで、32枚ずつになると示しました。誰も完璧には打てないでしょうが、それがこのゲームの面白さです。",
    "Othello also settled an old argument. Free gomoku was solved in 1993 and renju in 2001, both as first-player wins, which is why renju has restrictions. 6×6 Othello was shown in the same year to be a win for the second player. The full board remained unsolved until 2023, when Hiroki Takizawa showed that with best play on both sides it is a draw, thirty-two discs each. Nobody will ever play it perfectly, but that is what makes the game interesting.",
  ),
  "about.othello.startLabel": r(
    "オセロの盤で、最初の4枚と、f5に置かれた黒の最初の1枚が、e5を裏返しています。",
    "An Othello board with the first four discs and black's first disc placed at f5, flipping e5.",
  ),
  "about.othello.startCaption": r(
    "オセロの決まった開始と、f5に置かれた黒の最初の1枚で、隣の白を裏返しています。どの手も少なくとも1枚は裏返さなければならず、最初の手は4通りしかなく、対称なのですべて同じです。",
    "The fixed start of Othello and black's first disc placed at f5, flipping the neighbouring white disc. Every move must flip at least one disc, and there are only four first moves, all the same by symmetry.",
  ),
  "about.othello.solvedLabel": r(
    "1985年から2025年までの年表で、コネクトフォー、五目並べ、6×6のオセロ、連珠、8×8のオセロが解かれた年と、それぞれが最善を尽くしたときの勝者を示しています。",
    "A chronology from 1985 to 2025 showing the years Connect Four, gomoku, 6×6 Othello, renju and 8×8 Othello were solved, and the winner of each with best play.",
  ),
  "about.othello.solvedCaption": r(
    "コンピュータが解いたこの系統のゲームと、最善を尽くしたときの勝者です。自由な五目並べと連珠は黒の勝ち、小さいほうのオセロの盤は後手の勝ち、本物の盤は引き分けです。ペンテとConnect6は、まだ解かれていません。",
    "The games of this family that computers have solved, and who wins with best play. Free gomoku and renju are won by black, the smaller Othello board is won by the second player, and the real board is a draw. Pente and Connect6 have not yet been solved.",
  ),
  "about.othello.evConnectFourNote": r(
    "アリス、アレン",
    "Allis; Allen",
  ),
  "about.othello.evGomoku": r(
    "五目並べ 15×15",
    "Gomoku 15×15",
  ),
  "about.othello.evGomokuNote": r(
    "アリス",
    "Allis",
  ),
  "about.othello.evOthelloSix": r(
    "オセロ 6×6",
    "Othello 6×6",
  ),
  "about.othello.evOthelloSixNote": r(
    "ファインスタイン",
    "Feinstein",
  ),
  "about.othello.evRenju": r(
    "連珠",
    "Renju",
  ),
  "about.othello.evRenjuNote": r(
    "ワグナー、ヴィラーグ",
    "Wágner and Virág",
  ),
  "about.othello.evOthelloEight": r(
    "オセロ 8×8",
    "Othello 8×8",
  ),
  "about.othello.evOthelloEightNote": r(
    "滝沢",
    "Takizawa",
  ),

  // The story: ladders, ratings and tournaments
  "about.ladders.title": r(
    "順位表、レーティング、大会",
    "Ladders, ratings and tournaments",
  ),
  "about.ladders.a": r(
    "順番制のサイトは、順位表で動いていました。自分より上の人に挑み、勝てば順位が入れ替わり、一覧の先頭は、最近誰にも負けていない人でした。それは計算のないレーティングのようなもので、どの対局にも、その対局以上の意味を持たせました。のちに登場した計算の背後にいるのが、物理学の教授でチェスの名手でもあったアルパド・エロです。彼の方式は、1960年にアメリカチェス連盟が、1970年に国際チェス連盟が採用しました。ゲームのサイトで目にするレーティングは、ほとんどすべてその子孫です。",
    "The turn-based sites ran on ladders. I asked the player above me for a game, if I won we swapped places, and the head of the list was the person nobody had beaten lately. It was a rating without any calculation, and it gave every game a meaning beyond itself. Behind the calculation that came later stands Arpad Elo, a physics professor who was also a master chess player. His method was adopted by the United States Chess Federation in 1960 and by the world chess federation in 1970. Almost every rating you see on a game site is a descendant of it.",
  ),
  "about.ladders.b": r(
    "5つ並べるゲームには、思われているよりずっと前から独自の選手権があります。連珠の世界選手権は1989年から続いており、別に五目並べの世界選手権が2009年から開かれ、その後は2つが合わせて開かれています。上位の選手は、日本、中国、エストニア、ロシア、チェコの出身者が中心で、使われる開局には、チェスの定跡と同じように名前があります。そのいくつかは、対局を始めるときにここでも選べます。",
    "Five in a row has had its own championships for much longer than people think. The renju world championship has run since 1989, a separate Gomoku World Championship has been held since 2009, and since then the two have been held together. The players at the top are mostly from Japan, China, Estonia, Russia and the Czech Republic, and the openings they use have names, just as chess openings do. Some of them can also be chosen here when starting a game.",
  ),
  "about.ladders.c": r(
    "このサイトでは、終わった対局はすべて<in /history>棋譜</in>に記録され、名前のあるどの対局者にも、<in /players/ladder>対局者</in>のページにレーティングと階級があり、結果が出るたびに動きます。コンピュータも同じ条件です。レーティングは、全体のものに加えて、ゲームごとにもあります。ひとつのゲームが強いからといって、次のゲームも強いとは限らないからです。",
    "On this site every finished game is recorded in the game records, and every named player has a rating and a tier on the players page, which move with each result. Computers are on the same terms. In addition to the overall rating there is one for each game, because being strong at one game does not mean being strong at the next.",
  ),

  // Words inside the figures
  "about.legendFirst": r(
    "先手の勝ち",
    "first player wins",
  ),
  "about.legendSecond": r(
    "後手の勝ち",
    "second player wins",
  ),
  "about.legendDraw": r(
    "引き分け",
    "a draw",
  ),

  // Go, the board underneath
  "about.go.title": r(
    "囲碁、すべての下にある盤",
    "Go, the board underneath",
  ),
  "about.go.captureLabel": r(
    "小さな碁盤の中央に白い石があり、隣り合う4つの点すべてに黒い石があります。白い石は薄く表示され、取り上げられる直前です。",
    "A white stone in the centre of a small go board, with black stones on all four neighbouring points. The white stone is shown faded, just before it is lifted off.",
  ),
  "about.go.capture": r(
    "呼吸点とは、石が線に沿って接している空いた点のことです。白い石は4つから始まり、輪の付いた黒い石が最後のひとつをふさぎ、白は盤から取り上げられます。ここにある石取りのゲームがすることは、すべて、この考え方を簡単にしたもの（<game ninuki>2つの石を挟んで取る</game>など）です。",
    "Liberties are the empty points a stone touches along the lines. The white stone began with four, the black stone with the ring blocks the last of them, and white is lifted from the board. Everything the capture games here do (such as bracketing a pair) is a simplified form of this one idea.",
  ),
  "about.go.eyesLabel": r(
    "黒い石の輪が、離れた2つの空いた点をそれぞれ囲んでいます。これは取られることのない形です。",
    "A ring of black stones enclosing two separate single empty points, a shape that can never be captured.",
  ),
  "about.go.eyes": r(
    "目が2つあれば、その石の集まりは永遠に生きています。どちらの空いた点をふさいでも、白自身の石に呼吸点がなくなって、それは禁じられており、白は両方を同時にふさぐことはできません。これが、生き死にのすべてを1枚にした図で、囲碁が見かけより難しいゲームである理由です。",
    "With two eyes the group is alive for ever. If white fills either empty point, white's own stone is left with no liberty, which is forbidden, and white cannot fill both at once. This is the whole of life and death in one picture, and the reason go is a harder game than it looks.",
  ),
  "about.go.sizeGame": r(
    "ゲーム",
    "Game",
  ),
  "about.go.sizeBoard": r(
    "盤",
    "Board",
  ),
  "about.go.sizePositions": r(
    "ルール上あり得る局面の数",
    "Positions allowed by the rules",
  ),
  "about.go.sizeTicTacToe": r(
    "三目並べ",
    "Tic-tac-toe",
  ),
  "about.go.sizeConnectFour": r(
    "コネクトフォー",
    "Connect Four",
  ),
  "about.go.sizeChess": r(
    "チェス",
    "Chess",
  ),
  "about.go.sizeChessCount": r(
    "約4.8 × 10⁴⁴",
    "about 4.8 × 10⁴⁴",
  ),
  "about.go.sizeGomoku": r(
    "五目並べ",
    "Gomoku",
  ),
  "about.go.sizeGomokuCount": r(
    "3²²⁵未満 ≈ 10¹⁰⁷",
    "less than 3²²⁵ ≈ 10¹⁰⁷",
  ),
  "about.go.sizeGo": r(
    "囲碁",
    "Go",
  ),
  "about.go.sizes": r(
    "盤上に規則どおりに現れうる局面の数であって、打ちうる対局の数ではありません。対局の数はさらに大きくなります。三目並べとコネクトフォーの数は正確で、確定しています。囲碁の数も正確で、ジョン・トロンプが2016年に、171桁すべてを数え上げました。チェスの数はトロンプの推定で、五目並べの数は、盤の225点がそれぞれ3通りの状態をとるとしたときの上限にすぎません。規則に合う局面を数えた人はいないからです。",
    "These are the numbers of positions that can legally stand on the board, not of games that can be played; the numbers of games are larger still. The numbers for tic-tac-toe and Connect Four are exact and settled. The figure for go is also exact: John Tromp counted all 171 digits in 2016. The chess number is Tromp's estimate, and the gomoku number is only the upper limit when each of the board's 225 points has three possible states, because nobody has counted the positions that obey the rules.",
  ),
  "about.go.a": r(
    "ここにあるものはすべて碁盤の上に描かれています。格子、星、蛤と那智黒の色合い、日本語の名前に使う明朝体、どれも囲碁から借りたものです。その囲碁も今ではここで遊べるゲームのひとつなので、どんなゲームかを説明しておく価値があります。囲碁は2500年以上前に中国で生まれ、規則がほぼそのまま残っている盤上ゲームとしては最も古いものです。紀元前4世紀の中国の打ち手と今の打ち手は、数え方を決めるのに数分かかるだけで、あとはそのまま打ち始められるでしょう。中国では<jp>围棋</jp>（<em>weiqi</em>）、韓国では<jp>바둑</jp>（<em>baduk</em>）、日本では<jp>囲碁</jp>（<em>igo</em>）と呼ばれ、英語に入ったのは日本の呼び名です。規則は五目並べより短く、黒から先に、空いている交点に石を置いていきます。石やひと続きの石の集まりは、接している最後の空き点がふさがれると取られます。自分の最後の呼吸点をふさぐことはできず、盤面全体を繰り返すこともできません。これが<em>コウ</em>の規則で、2人が同じ石を永遠に取り合うのを防ぎます。双方がパスをしたら、盤をより広く囲んだほうが勝ちです。規則はこれですべてで、2千年の議論を生むには十分でした。1つめの図は石を取る場面、2つめは生き死にのすべてを表す図です。離れた2つの目を持つ石の集まりは、ふさぐことができず、したがって取られることがありません。",
    "Everything here is drawn on a go board. The grid, the star points, the colours of clamshell and slate, and the mincho typeface used for the Japanese names are all borrowed from go. Go is now one of the games that can be played here, so it is worth explaining what kind of game it is. Go was born in China more than 2,500 years ago, and it is the oldest board game still played with its rules almost unchanged. A Chinese player of the 4th century BC and a player today would need only a few minutes to agree on how to count, and could then begin playing as they are. It is called weiqi in China, baduk in Korea and igo in Japan, and the Japanese name is the one that entered English. The rules are shorter than those of five in a row. Starting with black, stones are placed on empty intersections. A stone, or a connected group of stones, is captured when the last empty point it touches is filled. You cannot fill your own last liberty, and you cannot repeat the whole position of the board. That is the ko rule, which stops two players taking the same stone back and forth for ever. When both players pass, whoever has enclosed more of the board wins. That is all of the rules, and it was enough to produce two thousand years of discussion. The first picture shows a capture, and the second shows the whole of life and death: a group with two separate eyes cannot be filled, and so is never captured.",
  ),
  "about.go.b": r(
    "その大きさこそが有名な点です。19×19の盤には361の点があり、そこに規則どおりに現れうる局面の数は、何年もの計算の末に、2016年にジョン・トロンプによって正確に決められました。2.08 × 10¹⁷⁰、171桁の数です。観測できる宇宙にある原子はおよそ10⁸⁰個なので、この盤の局面の数は、宇宙の原子の数よりおよそ90桁多くなります。これは誇張ではなく、<game dropFour>コネクトフォー</game>をすでに解き終え、チェスで世界チャンピオンを破っていた力押しの手法が、囲碁では通用しなかった理由です。囲碁が生んだ工夫のうち2つは、このサイトにあるものの直接の祖先です。ひとつは<em>コミ</em>で、後手の白に与えられる点です。6目半、中国ルールでは7目半で、半目は引き分けをなくすためだけにあります。もうひとつは置き碁で、黒が最大9子を先に置いて始めることで、9段違う2人でも、形だけでない本物の対局ができます。<in /players/ladder>対局者のページ</in>にあるレーティングと階級はすべて、置き碁が先に果たしていたことを追いかけています。囲碁はコンピュータが最も長く寄せつけなかったゲームでもあります。チェスは1997年に破られましたが、囲碁はあと10年は持ちこたえると思われていました。そこへ2016年3月、ソウルでディープマインドのアルファ碁がイ・セドルに4勝1敗で勝ちました。人々が覚えているのは第2局の37手目、5線へのカタツキで、プロなら誰も打たない手であり、解説者は最初それを悪手と呼びました。その手が勝ちを決め、そのあと人々が口にした言葉は<em>美しい</em>でした。イ・セドルは第4局を自分の78手目で勝ち取りました。互角の対局で人間が最上位のプログラムに勝った最後の例ですが、2023年には、別のプログラムに探させていた弱点を突く打ち方で、ある研究者がまた勝っています。これは別の種類の勝ち方です。囲碁は今、ここで盤に載っています。学ぶには小さな盤で、準備ができたら正式な盤で<game go>遊べます</game>。終局時には盤全体を数え、白には{komi}目のコミが付きます。囲碁は、<game hex>ヘックス</game>と並んで領域の系統にあります。ヘックスは、線ではなく、囲むか、つなぐかで勝敗が決まる、ここにあるもうひとつのゲームです。",
    "The size is the famous part. A 19×19 board has 361 points, and the number of positions that can legally appear on it was determined exactly in 2016 by John Tromp after years of computation: 2.08 × 10¹⁷⁰, a number of 171 digits. There are about 10⁸⁰ atoms in the observable universe, so the number of positions on this board exceeds the number of atoms in the universe by about 90 digits. This is no exaggeration; it is the reason that brute force, which had already solved Connect Four and beaten the world champion at chess, did not work for go. Two of the ideas go produced are direct ancestors of things on this site. One is komi, the points given to white, who plays second: 6.5 points, or 7.5 under Chinese rules, where the half point exists only to remove draws. The other is the handicap game, in which black begins with up to nine stones already placed, so that two people nine ranks apart can have a real game and not merely a formality. Every rating and tier on the players page is chasing what the handicap game did first. Go is also the game computers were kept at bay longest. Chess fell in 1997, but it was thought go would hold out another ten years, and then in Seoul in March 2016 DeepMind's AlphaGo beat Lee Sedol four games to one. What people remember is move 37 of the second game, a shoulder hit on the fifth line, a move no professional would play, which commentators first called a mistake. That move decided the game, and the word people used afterwards was \"beautiful\". Lee Sedol won the fourth game with his own move 78. It was the last time a human beat a top-level program in an even game, although in 2023 a researcher won again by playing to a weakness found by another program he had set to look for one. That is a different kind of win. Go is now on the board here. To learn, play it on the small boards, and when ready, on the full board. At the end the whole board is counted, and white receives {komi} points of komi. Go sits in the territory family together with Hex, the other game here in which the result is decided not by a line but by enclosing or connecting.",
  ),

  // The Japanese words, read aloud
  "about.words.title": r(
    "ラベルにある言葉",
    "The words on the labels",
  ),
  "about.words.head.word": r(
    "言葉",
    "Word",
  ),
  "about.words.head.reading": r(
    "ローマ字",
    "Romanisation",
  ),
  "about.words.head.meaning": r(
    "意味",
    "Meaning",
  ),
  "about.words.head.where": r(
    "出会う場所",
    "Where you meet it",
  ),
  "about.words.itsutsuMeaning": r(
    "5つ（のもの）",
    "five (things)",
  ),
  "about.words.itsutsuWhere": r(
    "サイトの名前：一列に並ぶ5つの石",
    "the name of the site: five stones in a row",
  ),
  "about.words.gomoku": r(
    "5つ並べること",
    "lining up five pieces",
  ),
  "about.words.gomokuGame": r(
    "五目並べ",
    "Gomoku",
  ),
  "about.words.renju": r(
    "連なった真珠",
    "a string of pearls",
  ),
  "about.words.renjuGame": r(
    "連珠",
    "Renju",
  ),
  "about.words.igo": r(
    "囲むゲーム",
    "the game of surrounding",
  ),
  "about.words.igoGame": r(
    "囲碁",
    "Go",
  ),
  "about.words.goban": r(
    "碁盤と碁石",
    "a go board and go stones",
  ),
  "about.words.gobanWhere": r(
    "どのゲームにも使われている、盤と石",
    "the board and stones used for every game",
  ),
  "about.words.hoshi": r(
    "星と天元（中央の点）",
    "star points and tengen (the centre point)",
  ),
  "about.words.hoshiWhere": r(
    "盤にある点々と、中央だけは空けておく障害物の配置",
    "the dots on the board, and the layout of obstacles that keeps the centre clear",
  ),
  "about.words.sente": r(
    "先に打つこと・後に打つこと",
    "moving first and moving second",
  ),
  "about.words.senteWhere": r(
    "誰が先に打つかと、コミや入れ替えがある理由",
    "who plays first, and why komi and swaps exist",
  ),
  "about.words.joseki": r(
    "定まった手順",
    "a settled sequence of moves",
  ),
  "about.words.josekiWhere": r(
    "有名な開局",
    "the famous openings",
  ),
  "about.words.ko": r(
    "永遠。コウの規則",
    "eternity; the ko rule",
  ),
  "about.words.koWhere": r(
    "すぐに取り返すことを禁じる、囲碁の規則",
    "go's rule against retaking immediately",
  ),
  "about.words.taikyoku": r(
    "2人で行う1局",
    "one game between two people",
  ),
  "about.words.taikyokuWhere": r(
    "自分の対局",
    "My games",
  ),
  "about.words.kifu": r(
    "書き記された対局の記録",
    "a written record of a game",
  ),
  "about.words.kifuWhere": r(
    "棋譜",
    "game records",
  ),
  "about.words.meikyoku": r(
    "名高い対局",
    "a famous game",
  ),
  "about.words.meikyokuWhere": r(
    "名局",
    "famous games",
  ),
  "about.words.banzuke": r(
    "相撲から来た、順位を並べた表",
    "a ranking table, from sumo",
  ),
  "about.words.banzukeWhere": r(
    "順位表",
    "the ladder",
  ),
  "about.words.kyu": r(
    "級（修業中の位）・段（上級の位）・名人",
    "kyū (the student grade), dan (the master grade) and meijin",
  ),
  "about.words.kyuWhere": r(
    "コンピュータ（いちばん易しいものから最強まで）",
    "the computers, from the gentlest to the strongest",
  ),
  "about.words.ma": r(
    "ものとものとの間の空き",
    "the space between things",
  ),
  "about.words.maWhere": r(
    "これらのページの配置のしかた",
    "how these pages are laid out",
  ),
  "about.words.caption": r(
    "このサイトで使っている日本語の言葉と、その読みです。級は、上達するにつれて1に向かって数が減り、段は、そのあと1から数が増えていきます。これは囲碁でも将棋でも武道でも同じです。",
    "The Japanese words this site uses and their readings. Kyū decrease toward 1 as a player improves, and after that dan increase from 1. This is the same in go, shogi and the martial arts.",
  ),
  "about.words.a": r(
    "これらのページにある日本語の大半は囲碁から来ています。盤と石にまつわる語彙が定まったのが、囲碁だったからです。どんなゲームを記録したものでも、対局の記録は<em>棋譜</em>で、対局者を順位づけする表は、相撲の番付表から借りた<em>番付</em>です。位には<em>級</em>と<em>段</em>があり、昔の囲碁の家元の頂点には<em>名人</em>がいました。表には、ここで出会う言葉のすべてと、その出会う場所を並べています。",
    "Most of the Japanese on these pages comes from go, because go is where the vocabulary of boards and stones was settled. A record of a game, whatever game it records, is a kifu, and the table that ranks players is a banzuke, borrowed from the sumo ranking sheet. Ranks are kyū and dan, and at the top of the old go houses was the meijin. The table lists all the words met here, and where they are met.",
  ),
  "about.words.b": r(
    "アニメで聞いたことのある言葉があるなら、それも偶然ではありません。ほったゆみ原作、小畑健作画の<em>ヒカルの碁</em>は、1998年から2003年まで週刊少年ジャンプに連載され、続いてアニメにもなりました。平安時代の囲碁の名人の幽霊にとりつかれた少年が、その幽霊から碁を学び、少しずつ自分の力で打つ打ち手になっていく物語です。この作品は、ひと世代の日本の子どもたちを囲碁の教室に向かわせたと広く言われ、日本の外の多くの読者が、<em>先手</em>、<em>定石</em>、<em>名人</em>といった言葉を初めて知ったのもこの作品です。幽霊が打つゲームは、{boards}の盤で、<game go>ここでも遊べます</game>。",
    "If some of these words sound familiar from anime, that is no accident either. Hikaru no Go, with story by Yumi Hotta and art by Takeshi Obata, was serialised in Weekly Shōnen Jump from 1998 to 2003 and then became an anime. It tells of a boy possessed by the ghost of a Heian-period go master, who learns go from the ghost and gradually becomes a player in his own right. It is widely said to have sent a generation of Japanese children to go classes, and it is also where many readers outside Japan first learned words such as sente, jōseki and meijin. The game the ghost plays can also be played here, on boards of {boards}.",
  ),

  // One engine, every game
  "about.engine.title": r(
    "ひとつのエンジンで、すべてのゲーム",
    "One engine for every game",
  ),
  "about.engine.label": r(
    "{count}行の規則が1つのエンジンに入り、盤、サーバー、コンピュータ、棋譜のすべてがそのエンジンに問い合わせます。",
    "{count} rows of rules go into one engine, and the board, the server, the computers and the game records all consult that engine.",
  ),
  "about.engine.rowsTitle": r(
    "規則{count}行",
    "{count} rows of rules",
  ),
  "about.engine.rows": r(
    "ゲームごとに1行で、使う盤、勝ちと負けの条件、石を取るのか、裏返すのか、跳び越すのか、動かないのかが書かれています。",
    "One row per game, giving the boards used, the conditions for winning and losing, and whether stones are captured, flipped, jumped over or do not move.",
  ),
  "about.engine.engineTitle": r(
    "ひとつのエンジン",
    "One engine",
  ),
  "about.engine.engine": r(
    "純粋な関数です。局面と1手を受け取り、新しい局面を返し、ほかには何にも触れません。どのゲームを遊んでいるのかは尋ねず、行に尋ねます。",
    "Pure functions. They take a position and a move and return a new position, touching nothing else. They never ask which game is being played; they ask the row.",
  ),
  "about.engine.askBoard": r(
    "盤",
    "The playing board",
  ),
  "about.engine.askBoardBody": r(
    "打てる点はどこか、何が狙われているか、そして、求めればヒントを示します。",
    "It shows which points are legal, what is under threat, and a hint when one is asked for.",
  ),
  "about.engine.askServer": r(
    "サーバー",
    "The server",
  ),
  "about.engine.askServerBody": r(
    "各手を保存する前にもう一度打ち直し、規則が認めない手で勝つことができないようにします。",
    "It replays each move before saving it, so that a game cannot be won by a move the rules refuse.",
  ),
  "about.engine.askBots": r(
    "コンピュータ",
    "The computers",
  ),
  "about.engine.askBotsBody": r(
    "規則が認める手を探索します。処理はお使いのブラウザの中の作業スレッドで行われます。",
    "They search the moves the rules allow, in a worker thread inside your own browser.",
  ),
  "about.engine.askRecord": r(
    "棋譜",
    "The game record",
  ),
  "about.engine.askRecordBody": r(
    "局面を描くために、対局を最初の1手から再生します。SGFの番号があるゲームでは、SGFも書き出します。",
    "To draw a position, it replays a game from its first move. For games that have an SGF number, it also writes SGF.",
  ),
  "about.engine.caption": r(
    "サイトの組み立てです。ゲームを加えることは行を加えることで、その下にあるものは、何をすればよいかをすでに知っています。",
    "How the site is put together. Adding a game means adding a row, and everything below already knows what to do.",
  ),
  "about.engine.stackPart": r(
    "部分",
    "Part",
  ),
  "about.engine.stackRuns": r(
    "動かしているもの",
    "What it runs on",
  ),
  "about.engine.stackPages": r(
    "ページ",
    "Pages",
  ),
  "about.engine.stackPagesBody": r(
    "Next.js 16とReact 19をTypeScriptで書き、可能な限りサーバーで描画しています。",
    "Written in Next.js 16 and React 19 with TypeScript, and drawn on the server wherever possible.",
  ),
  "about.engine.stackRules": r(
    "規則",
    "Rules",
  ),
  "about.engine.stackRulesBody": r(
    "規則ごとにモジュールを持つ純粋なエンジンがひとつ。各モジュールは、そのソースのそばでテストされています。",
    "One pure engine with a module for each rule, and each module is tested right next to its source.",
  ),
  "about.engine.stackGames": r(
    "対局と対局者",
    "Games and players",
  ),
  "about.engine.stackGamesBody": r(
    "Prisma経由のPostgres",
    "Postgres, through Prisma",
  ),
  "about.engine.stackBots": r(
    "コンピュータ",
    "Computers",
  ),
  "about.engine.stackBotsBody": r(
    "読者のブラウザ内のWeb Workerで、サーバーでは動きません。",
    "A Web Worker inside the reader's browser, never on the server.",
  ),
  "about.engine.stackFiles": r(
    "対局ファイル",
    "Game files",
  ),
  "about.engine.stackTests": r(
    "テスト",
    "Tests",
  ),
  "about.engine.stackTestsBody": r(
    "規則とページにはVitest、全ゲームをブラウザで遊ばせるテストにはPlaywright。",
    "Vitest for the rules and pages, and Playwright for tests that have a browser play every game.",
  ),
  "about.engine.stackCaption": r(
    "サイトを支えているものです。すべてのゲームは、シミュレータによって最初から最後まで自動的に遊ばれ、規則は、手で書き出した別の写しと突き合わせて確かめられます。",
    "What the site stands on. Every game is also played automatically from start to finish by a simulator, which checks the rules against a second copy written out by hand.",
  ),
  "about.engine.a": r(
    "作りを知りたい読者のために説明します。ここにあるゲームはすべて、1つの表の1行で、ひとつのエンジンがそのすべてを動かしています。エンジンはゲームの名前を知りません。知っているのは行に書かれていること、つまり、盤の大きさ、いくつ並べば勝ちか、挟まれた並びが裏返るのか取られるのかです。そして、どのゲームに対しても同じいくつかの問いに答えます。この手を打てるか、打ったあと盤はどうなるか、です。",
    "This is for readers who want to know how it is built. Every game here is one row in one table, and a single engine runs all of them. The engine does not know the names of games. What it knows is what a row says: the size of the board, how many in a line win, and whether a bracketed run is flipped or captured. It answers the same few questions for every game: can this move be played, and what does the board look like after it.",
  ),
  "about.engine.b": r(
    "サイトの4つの部分がエンジンにそれらを問い合わせ、どの部分も独自の規則を持ちません。そのため、新しいゲームは、その行ができた日に、盤、コンピュータの対戦相手、棋譜、再生とともに現れ、一度直した規則は、どこでも直ります。変更は<in /releases>リリースノート</in>に、公開した順にすべて載っています。",
    "Four parts of the site ask the engine these questions, and none of them has rules of its own. That is why a new game arrives, on the day its row is made, together with its board, its computer opponents, its record and its replay, and why a rule fixed once is fixed everywhere. Every change is listed in the release notes in the order it was released.",
  ),

  // How a move is written down
  "about.notation.title": r(
    "手の書き方",
    "How a move is written down",
  ),
  "about.notation.centreLabel": r(
    "9×9の盤の中央の点に黒い石が1つあり、E5と書かれています。",
    "A 9×9 board with one black stone on the central point, labelled E5.",
  ),
  "about.notation.centre": r(
    "9×9の盤の中央です。Eは左から数えて5列め、5は下の端から数えて5行めです。同じ点をファイル用に書くと<mono>ee</mono>になります。",
    "The centre of a 9×9 board. E is the fifth column counting from the left, and 5 is the fifth row counting from the bottom edge. The same point written for a file is ee.",
  ),
  "about.notation.headBoard": r(
    "盤上の表記",
    "Notation on the board",
  ),
  "about.notation.headSgf": r(
    "SGFでの表記",
    "Notation in SGF",
  ),
  "about.notation.headWhere": r(
    "その位置",
    "That position",
  ),
  "about.notation.centreOf": r(
    "15×15の盤の中央",
    "the centre of a 15×15 board",
  ),
  "about.notation.bottomLeft": r(
    "左下の隅",
    "the bottom-left corner",
  ),
  "about.notation.topRight": r(
    "右上の隅",
    "the top-right corner",
  ),
  "about.notation.table": r(
    "15×15の盤の同じ3点を、2つの方式で並べました。原点の位置、行を数える向き、文字のIがあるかどうかなど、ほとんどすべてが異なります。そのため、右上の列は、盤上ではPですが、ファイルでは15番めの文字<mono>o</mono>になります。",
    "The same three points on a 15×15 board, in the two schemes. They differ in almost everything: where the origin is, which way the rows are counted, and whether the letter I exists. That is why the rightmost column is P on the board but the fifteenth letter, o, in the file.",
  ),
  "about.notation.a": r(
    "ここでの1手は、文字と数字で表します。たとえば<mono>H8</mono>は、正式な盤の中央です。文字は左から数えた列、数字は下の端から数え上げた行で、1行めは盤の上ではなく下です。この表記は、<in /history>棋譜</in>のすべての手、ヒントを求めたときのヒントの横、対局の脇にある手の一覧に現れます。",
    "A move here is written as a letter and a number. For example H8 is the centre of the full board. The letter is the column counted from the left, and the number is the row counted up from the bottom edge, so row 1 is at the bottom of the board and not the top. This notation appears on every move in the game records, next to a hint when one is asked for, and in the list of moves beside a game.",
  ),
  "about.notation.b": r(
    "Iの列はありません。囲碁の盤は、文字を付けるようになって以来、Iを抜いてきました。I、l、1は一見して同じ形で、座標を読み違えれば対局を読み違えるからです。列はAからH、次はJと続きます。19×19の盤では、文字はSではなくTまで進みます。連珠の公刊された棋譜も同じ約束を使っているので、京都で打たれた選手権の対局を、何も変換せずに、手順どおりにここで再生できます。",
    "There is no column I. Go boards have left out the letter ever since letters were put on them, because I, l and 1 look the same at a glance and misreading a coordinate means misreading the game. The columns run A to H, then J. On a 19×19 board the letters go up to T and not S. The published records of renju use the same convention, so a championship game played in Kyoto can be replayed here move by move without converting anything.",
  ),
  "about.notation.c": r(
    "この表記が属する規格は<out https://www.red-bean.com/sgf/>SGF</out>（スマート・ゲーム・フォーマット）で、1987年にアンダース・キルフが自分のプログラム「スマート碁」のために書き、1990年代に現在の第4版になりました。囲碁の棋譜はこの形式で保存されており、囲碁だけのものではありません。SGFは、対応するゲームごとに番号を割り当てており、<mono>GM[1]</mono>は囲碁、<mono>GM[2]</mono>はオセロ、<mono>GM[4]</mono>は五目並べと連珠、<mono>GM[11]</mono>はヘックスです。このサイトの系統の大半は、ウェブより前にできた規格に番号がありました。名前を挙げておく価値があるのは、思い浮かぶ代わりの規格がそうではないからです。PGNはチェス専用で、五目並べの棋譜がチェスの対局のふりをする理由はありません。",
    "The standard this belongs to is SGF, the Smart Game Format, which Anders Kierulf wrote in 1987 for his program Smart Go and which became its present fourth edition in the 1990s. Go records are saved in this format, and not only go records. SGF assigns a number to each game it supports: GM[1] is go, GM[2] is Othello, GM[4] is gomoku and renju, and GM[11] is Hex. Most of the families on this site had a number in a standard made before the web. It is worth naming because the alternative that comes to mind is not suitable: PGN is for chess only, and there is no reason for a gomoku record to pretend to be a chess game.",
  ),
  "about.notation.d": r(
    "SGFは、盤と同じ書き方で点を表さず、存在しない互換性をほのめかすより、はっきり言っておくほうがよいでしょう。SGFの点は、小文字2字で、列、行の順に書き、左上の隅から数え、飛ばす文字はありません。そのため、ここでの<mono>H8</mono>は<mono>hh</mono>、左下にある<mono>A1</mono>は<mono>ao</mono>になります。一方は読むための方式、もう一方は保存するための方式で、下の表が両者の違いのすべてです。",
    "SGF does not write a point the way the board does, and it is better to say so plainly than to imply a compatibility that does not exist. An SGF point is two lowercase letters, the column and then the row, counted from the top-left corner with no letter skipped. So H8 here is hh, and A1 at the bottom-left is ao. One scheme is for reading and the other for storing, and the table below shows the whole of the difference between them.",
  ),
  "about.notation.e": r(
    "終わった対局はすべて保存され、1局は再生画面からテキストとして写し取れ、記録全体も、単純な一覧として持ち出せます。囲碁、オセロ、五目並べ、連珠、ヘックスの終わった対局は、再生画面から<mono>.sgf</mono>ファイルとしてダウンロードでき、そのゲームを読めるどのプログラムでも開けます。SGFに番号がないゲーム、つまり石取りのゲーム、Connect6、落とすゲーム、チェッカーなどは、ファイルをまったく提供しません。それらがその4つの番号のどれかを名乗るファイルは、名前を借りた別のゲームになってしまうからです。",
    "Every finished game is saved, a single game can be copied out as text from its replay screen, and the whole record can also be taken away as a plain list. A finished game of go, Othello, gomoku, renju or Hex can be downloaded as an .sgf file from its replay screen and opened in any program that can read that game. For games that SGF has no number for, namely the capture games, Connect6, the drop games, checkers and so on, no file is offered at all, because a file claiming one of those four numbers would be a different game that has borrowed the name.",
  ),

  // Experience and levels
  "about.xp.title": r(
    "経験値とレベル",
    "Experience points and levels",
  ),
  "about.xp.headAward": r(
    "獲得内容",
    "Award",
  ),
  "about.xp.headPoints": r(
    "経験値",
    "Experience points",
  ),
  "about.xp.headCap": r(
    "1日の上限",
    "Daily maximum",
  ),
  "about.xp.headFor": r(
    "対象",
    "For",
  ),
  "about.xp.prices": r(
    "いくつかの獲得内容と、その経験値です。経験値を支払う表から読み取っています。ダッシュは1日の上限がないことを表し、1回しか起こりえないものにはそれが適切です。",
    "A few of the awards and the experience points each pays, read from the table that pays them. A dash means no daily limit, which is appropriate for things that can happen only once.",
  ),
  "about.xp.a": r(
    "ここには2つの順位表があり、測っているものは別です。<em>レーティング</em>は、どれだけ上手に打つかを表します。動くのはレーティング対局のときだけで、ゲームごとの数と、全体の数が1つずつあり、上がるのと同じように下がります。<em>経験値</em>は、顔を出していろいろ試したことを表します。終えた対局のたびに、負けた対局でも、いくらか加わり、決して減りません。どちらも、もう一方で買うことはできません。",
    "There are two ladders here, and they measure different things. The rating shows how well I play. It moves only in rated games, there is one number for each game and one overall, and it falls as easily as it rises. Experience shows that I showed up and tried things. Every finished game adds some, even a game I lost, and it never goes down. Neither can be bought with the other.",
  ),
  "about.xp.b": r(
    "経験値はレベルに使われ、レベルは{levels}段階あり、どれにもゲームの歴史から取った名前が付いています。レベル1は{first}、レベル10は{tenth}、頂点は{last}で、{top}経験値が必要です。最初の10段階は早く上がるので、新しい会員にも手応えがあります。10を過ぎると上りは厳しくなり、20を過ぎるとさらに厳しくなって、最後の10段階だけで、順位表全体の{share}％にあたります。一生をかけて積み重ねる位として作られています。コンピュータも人間と同じ条件で、終えた対局から上り、仲間を作る、プロフィールを設定するといった、コンピュータには獲得できない項目だけが対象外です。",
    "Experience points are spent on levels. There are {levels} levels, and each has a name taken from the history of games. Level 1 is {first}, level 10 is {tenth}, and the top is {last}, which needs {top} experience points. The first ten levels come quickly, so a new member has something to hold on to. After ten the climb gets harder, and after twenty harder still, and the last ten levels alone make up {share}% of the whole ladder. It is designed as a standing built up over a lifetime. The computers climb on the same terms as people, from the games they finish, and only the awards a computer cannot earn, such as making a buddy or setting up a profile, are excluded.",
  ),
  "about.xp.c": r(
    "獲得できる経験値は、顔を出しただけなら少なく、新しいことをするとより多くなります。遊んだことのないゲーム、出会ったことのない系統、自分よりずっと高いレーティングの相手への勝ちなどです。多くの項目には1日の上限があるので、いちばん易しいコンピュータとの短い対局を100局こなしても、数局分以上にはなりません。段階ごとにそれぞれのページが<in /xp>経験値</in>の下にあり、そこにいる人も分かります。",
    "The awards are small for just showing up and larger for doing something new: a game I have never played, a family I have never met, a win over someone with a much higher rating than mine. Most have a daily limit, so a hundred quick games against the gentlest computer are worth no more than a handful. Each level has its own page under experience points, and you can see who is standing there.",
  ),
  "about.tiers.unrated": r(
    "未定",
    "Undetermined",
  ),
  "about.tiers.unratedNote": r(
    "数字ではなくダッシュ",
    "a dash, not a number",
  ),
  "about.tiers.provisional": r(
    "仮",
    "Provisional",
  ),
  "about.tiers.provisionalNote": r(
    "大きく動く",
    "moves a lot",
  ),
  "about.tiers.established": r(
    "確定",
    "Established",
  ),
  "about.tiers.establishedNote": r(
    "ゆっくり動く",
    "moves slowly",
  ),
  "about.tiers.games": r(
    "{range}局",
    "{range} games",
  ),
  "about.tiers.label": r(
    "レーティングは、最初の{unrated}局のレーティング対局までは未定、{provisional}局までは仮、それ以降は確定です。",
    "A rating is undetermined for the first {unrated} rated games, provisional up to {provisional} games, and established after that.",
  ),
  "about.tiers.caption": r(
    "レーティングの3つの段階を、その裏にあるレーティング対局の数で示しています。誰もが{start}から始まり、仮の間は1局で最大{provisionalK}、確定後は最大{establishedK}動きます。",
    "The three stages of a rating, shown by the number of rated games behind it. Everyone starts from {start}. The number moves by up to {provisionalK} per game while provisional, and up to {establishedK} once established.",
  ),
  "about.curve.label": r(
    "レベル1から{levels}までの各レベルに必要な経験値の合計です。最初の20レベルまではほぼ平らで、そのあとは次第に急になり、頂点で{top}に達します。",
    "The total experience needed for each level from 1 to {levels}: nearly flat up to the first twenty levels, then becoming steeper, reaching {top} at the top.",
  ),
  "about.curve.axis": r(
    "レベル",
    "level",
  ),
  "about.curve.caption": r(
    "各レベルに立つのに必要な経験値の合計で、節目の段階には名前が付いています。色の付いた帯は最後の10レベルで、{top}までの上りの全体の{share}％にあたります。",
    "The total experience needed to stand on each level, with the milestone levels named. The shaded band is the last ten levels, which make up {share}% of the whole climb to {top}.",
  ),
  "about.elo.label": r(
    "対戦相手に対する期待される得点で、400点下から400点上までを示しています。レーティングが等しいところで2分の1を通る、なめらかなS字曲線です。",
    "The expected score against an opponent from 400 points behind to 400 points ahead: a smooth S-shaped curve passing through one half where ratings are equal.",
  ),
  "about.elo.axis": r(
    "自分のレーティング − 相手のレーティング",
    "my rating minus the opponent's rating",
  ),
  "about.elo.caption": r(
    "エロ式があなたに期待する成績です。レーティングが等しいなら、1局あたり半点。200点上なら、4局で3勝。400点上なら、10局で9勝。期待を上回れば、その不足分にKを掛けただけレーティングが上がります。",
    "What the Elo method expects of me. With equal ratings, half a point per game. With 200 points more, three wins in four games. With 400 points more, nine wins in ten. If I beat the expectation, my rating rises by the shortfall times K.",
  ),

  // How strong the bots are
  "about.bots.title": r(
    "コンピュータの強さ",
    "How strong the computers are",
  ),
  "about.bots.headGrade": r(
    "段位",
    "Grade",
  ),
  "about.bots.headStrength": r(
    "強さ",
    "Strength",
  ),
  "about.bots.headDoes": r(
    "盤上でしていること",
    "What it does at the board",
  ),
  "about.bots.grades": r(
    "段位のある5人の対局者を、いちばん易しい順に並べました。ほかの会員と同じ会員で、対局はレーティング対局になり、それぞれの戦績が残り、人間と同じ条件で、対局から経験値を得ます。仲間を加える、プロフィールを設定するといった、人間にしかできないことだけは除きます。",
    "The five graded players, gentlest first. They are members just like the others: games against them are rated, each one's record is kept, and they earn experience from games on the same terms as people. The only exceptions are things only a person can do, such as adding a buddy or setting up a profile.",
  ),
  "about.bots.a": r(
    "ここには、いつでも相手がいます。対局者のうち5人はコンピュータだからです。ただし5つのプログラムではなく、ひとつのプログラムに5通りの持ち時間を与えたものです。同じコードが、サイトにある{games}のゲームすべてを遊びますが、それは、どのゲームを遊んでいるかを知らないからこそできることです。盤と同じように、規則に、打てる手を尋ね、5つ並べるゲームについて知っていることを、聞いたこともないドラフツのゲームにもそのまま当てはめます。この5人のほかに専門家が2人いて、やり方は正反対です。そのうち1人は<game reversi>オセロ</game>だけを遊び、オセロの打ち手と同じ読み方をします。まず角を取り、石の数は最後に考えます。",
    "There is always someone to play against here, because five of the players are computers. But they are not five programs; they are one program given five different thinking budgets. The same code plays all {games} of the games on the site, and it can do this because it does not know which game it is playing. It asks the rules what a legal move is, in the same way the board does, and it applies everything it knows about five in a row to a game of draughts it has never heard of. Besides the five there are two specialists, who do the opposite. One of them plays only Othello and reads it as an Othello player does: corners first, and the number of discs last of all.",
  ),
  "about.bots.b": r(
    "1手は探索です。ある手を試し、それに対するもっともな返しをすべて試し、さらにその返しをすべて試して、相手にとっていちばん悪い結果になる変化を残します。問題は、その木に底がないことなので、本当の問いは、どこまで深く読むかではなく、何を使うかです。各手には<mono>{millis}</mono>ミリ秒の実時間が与えられ、それがなくなるまで深く読み進めるので、時間切れになっても失うのは答えではなく、1手分の先読みです。ミリ秒ではなく局面の数で持ち分を数えると、この役目は果たせません。同じ局面数が、ある盤では10分の1秒、別の盤では3分になり、コードのどこにも書かれていないまま、ドラフツでは見事で、五目並べでは使い物にならない対局者になってしまうからです。",
    "One move is a search. It tries a move, tries every plausible reply to it, tries every reply to that, and keeps the line that comes out worst for the opponent. The problem is that the tree has no bottom, so the real question is not how deep to read but what to spend. Each move is given {millis} milliseconds of real time and reads deeper until it runs out, so running out of time costs it one move's worth of foresight, not an answer. A budget counted in the number of positions instead of milliseconds cannot do this job. The same number of positions is a tenth of a second on one board and three minutes on another, and without anything in the code saying so, the player would be superb at draughts and useless at gomoku.",
  ),
  "about.bots.c": r(
    "この{millis}ミリ秒を何に使うかが、高くついた教訓でした。線を並べるゲームで局面を判断するには、石を置いてみて、そこから5つになりうるものをすべて探します。数百回の小さな探索で、約1ミリ秒かかります。これを木のすべての節でやるのは、探索が遅くなるのではなく、探索ではなくなるということです。実測では、15×15の盤で1手を出すのに195秒かかりました。今では、それを最上部で1回だけ、軽い判断で見つけた上位<mono>{reading}</mono>手に使い、その下の木は軽い判断で読んでいます。0.5秒で答えるプログラムと3分で答えるプログラムの違いのほとんどは、この種類のものです。もっと賢い考えではなく、高くつく考えをどこでなら使えるかという判断です。",
    "What to spend the {millis} milliseconds on was the expensive lesson. To judge a position in the line-making games, you place a stone and look for every five it could still become. That is a few hundred small searches and takes about a millisecond. Doing it at every node of the tree does not make the search slower; it stops being a search at all. Measured, it took 195 seconds to produce one move on a 15×15 board. Now it is done once, at the top, for the best {reading} moves the light judgement can find, and the tree below is read with the light judgement. Almost all of the difference between a program that answers in half a second and one that answers in three minutes is of this kind: not a cleverer idea, but a decision about where an expensive idea is affordable.",
  ),
  "about.bots.d": r(
    "そして、考えるのはお使いのブラウザの中です。コンピュータの手は、サーバーではなく、これを読んでいるその端末の上で計算されます。だから5人がいつでもそこにいられ、同時に開く対局の数に上限がなく、午前2時に1局遊んでもこのサイトには何の費用もかかりません。自前の機械で考えるゲームのサイトは、いずれ利用者に利用量を計るしかなくなります。ここには、その問題を解く必要がありません。",
    "And the thinking happens in your browser. The computer's move is calculated not on a server but on the very device you are reading this on. That is why all five can always be there, why there is no upper limit on how many games you can have open against them, and why it costs this site nothing for you to play one at two in the morning. A game site that thinks on its own machines eventually has to meter its users' usage. This site has no such problem to solve.",
  ),
  "about.bots.e": r(
    "ここまでの話は、段位の順番が正しいかどうかを教えてくれません。そこで、各段位どうしを戦わせました。すべての段位が、ほかのすべての段位と、実際の1手が与えられるのと同じ持ち時間で、先後を交互にして、1組あたり20局ずつです。結果は、それぞれのページに、ゲームごとに載っています。ひとつのラベルでは伝えられない正直さがあり、コンピュータが、オセロより五目並べのほうが本当に強いこともあります。両方にひとつの名前を付けるのが、誤解のもとです。下の数字は、総当たり戦全体の合計です。",
    "None of this tells me whether the order of the grades is correct, so I made the grades play each other. Every grade played every other grade, with the same thinking time a real move is given, with colours alternating, twenty games per pairing. The results are on each one's own page, game by game. They are honest in a way a single label cannot be: a computer can really be stronger at five in a row than at Othello, and giving both one name is what misleads. The numbers below are the totals of the whole round robin.",
  ),
  "about.bots.f": {
    ...r(
      "公表する価値のあることが分かりました。<em>上位2つの段位は同じ対局者</em>だということです。互いに対戦させると、名人と国手の成績は、オセロでは7勝13敗、ドラフツでは3勝6敗11引き分けでした。どちらも結果のように見えて、そうではありません。これだけの局数で、実力が等しい同士なら、コインを投げても、およそ4回に1回、およそ半分の割合で、同じ程度の結果になります。そのため表は、結果を装わず、互角と書いています。この2つの名前の違いは、およそ10倍の思考時間をかけたときにしか現れず、このサイトでは、どの1手にもそれだけの時間は与えられていません。20局で、はっきり分かるのは、反対側の端です。段は、名人に1局も勝てませんでした。そして、サイトの目玉のゲームは、数字から完全に抜けています。<game freestyle>五目並べ</game>の総当たり戦は、1時間以上走っても終わらなかったので、その行はなく、行がないのは、ページが分からないときに見せるものです。どのコンピュータにも、<in /players/bots>対局者のページ</in>から会えます。",
      "This showed something worth publishing: the top two grades are the same player. Played against each other, 名人 and 国手 finished 7 wins to 13 at Othello and 3 to 6 with 11 draws at draughts. Both look like results, and neither is one. Over this many games between equals, even a coin toss would come out about this far from even about one time in four, and about half the time. So the table says level and does not pretend otherwise. The difference between these two names only appears at about ten times the thinking time, which no move on this site is given. What twenty games shows clearly is the other end: 段 did not win a single game against 名人. And the site's own flagship is missing from the numbers entirely. A round robin at gomoku ran for over an hour without finishing, so there is no row for it, and having no row is what the page shows when it does not know. You can meet any of them from the players page.",
    ),
    ask: "The English is an uneven sentence about how likely a coin toss is to look as lopsided as two measured results; the Japanese follows its meaning, and a reader should confirm it says what the writer meant.",
  },
  "about.bots.measuredHeadGrade": r(
    "段位",
    "Grade",
  ),
  "about.bots.measured": r(
    "総当たり戦全体の勝ち–負け–引き分けです。各段位が、ほかのすべての段位と、先後を交互にして1組あたり{games}局、実際の1手が与えられるのと同じ持ち時間で対戦しました。測定日は{date}、{boards}です。段位の打ち方を決めるコードのどれかが変更されると、この数字はページから消え、測り直されたときに戻ります。",
    "Wins–losses–draws over the whole round robin. Each grade played every other grade, {games} games per pairing with colours alternating, with the same thinking time a real move is given. Measured on {date}, at {boards}. If any of the code that decides how a grade plays is changed, these figures disappear from the page, and they return when measured again.",
  ),
  "about.bots.measuredBoard": r(
    "{board}の{game}",
    "{game} on {board}",
  ),
  "about.bots.measuredAnd": r(
    "と",
    " and ",
  ),
  "about.bots.graphLabel": r(
    "コンピュータの各段位が、すぐ下の段位に勝った割合を、{games}のゲームにわたる{pairings}組の測定で示しています。棒が半分に届いていれば、2つの段位は同じ強さです。",
    "How often each computer grade beat the grade just below it, shown over {pairings} measured pairings across {games} games. A bar that reaches halfway means the two grades are equally strong.",
  ),
  "about.bots.graphOver": r(
    "{higher}対{lower}",
    "{higher} against {lower}",
  ),
  "about.bots.graphCaption": r(
    "各棒は、あるゲームでの順位表の1段で、上の段位が、すぐ下の段位に勝った割合を、測定した{played}局にわたって示しています。半分なら、何も違いのない2人です。",
    "Each bar is one step of the ladder at one game: how often the higher grade beat the grade just below it, over {played} measured games. A half would mean two players nothing separates.",
  ),
  "about.bots.graphInOrder": r(
    "ここのどの段も半分を超えているので、これらのゲームでは、順位表は言うとおりの順番になっています。最も接近しているのは、{game}での{higher}対{lower}（{share}％）です。",
    "Every step here is above half, so for these games the ladder is in the order it says. The closest is {higher} against {lower} at {game} ({share}%).",
  ),
  "about.bots.graphClosest": r(
    "最も接近している段は、{game}での{higher}対{lower}で、{share}％です。",
    "The closest step is {higher} against {lower} at {game}, at {share}%.",
  ),

  // What is on the board here
  "about.catalogue.title": r(
    "ここにあるゲーム",
    "The games that are here",
  ),
  "about.catalogue.headFamily": r(
    "系統",
    "Family",
  ),
  "about.catalogue.headGames": r(
    "ゲーム",
    "Games",
  ),
  "about.catalogue.headDecides": r(
    "勝敗の決め方",
    "How it is decided",
  ),
  "about.catalogue.families": r(
    "{families}の系統と、それぞれが持つゲームの数を、一覧そのものから読み取っています。系統は、書類棚ではなく、ゲームを見つけるための方法です。ゲームはどれかひとつの系統に属し、そこを探す人が見つけたいと思う場合には、別の系統の棚にも並びます。",
    "The {families} families and the number of games each holds, read from the catalogue itself. A family is a way of finding a game, not a filing cabinet. A game belongs to one family, and is also shown on another family's shelf when someone looking there would want to find it.",
  ),
  "about.catalogue.a": r(
    "ここには{families}の系統に分かれた{games}のゲームがあり、この数は、この文に書き込まれたものではなく、ページが描かれるたびに一覧から数えています。サイトの大きさを伝えるページが、それについて間違えることがあってはなりません。ゲームとは、規則、棋譜、順位表、盤を備えた、専用のページを持つ規則のことです。それぞれが遊ばれる盤の種類まで数えると、座って遊べるゲームは{setups}通りあり、そのうち{choice}のゲームでは、始める前に盤の大きさを選べます。",
    "There are {games} games here, divided into {families} families, and these numbers are not written into this sentence; they are counted from the catalogue every time the page is drawn. A page that tells how big a site is must not be able to be wrong about it. A game here means a set of rules with its own page, with its rules, its records, its standings and a board. Counting the kinds of board each is played on, there are {setups} different games you can sit down to, and for {choice} of them you can choose the size of the board before you start.",
  ),
  "about.catalogue.b": r(
    "そのほとんどは、サイトの名前の由来でもある<game freestyle>5つ並べるゲーム</game>から派生していますが、{notLine}のゲームは、まったく別のもので勝敗が決まります。裏返る石、盤から跳び越して取られる駒、ひとつの隅からもうひとつの隅へのレース、2つの辺をつなぐ連鎖、囲んで数える領域などです。最初からそのつもりだったわけではありません。このサイトが敬意を表している2つの家も、ひとつのゲームだけを遊んだわけではなかったからです。夜が更けるにつれて、オセロからペンテへ、そして誰も名前を思い出せないゲームへと移っていき、線だけのサイトでは、思い出そうとしている部屋より狭い部屋になってしまったでしょう。",
    "Most of them derive from five in a row, which is where the site's name comes from, but {notLine} of them have their winner decided by something quite different: discs that flip, pieces that are jumped over and taken from the board, a race from one corner to another, a chain connecting two sides, or territory that is enclosed and counted. That was not the plan from the start. It happened because the two households this site pays tribute to did not play only one game either. As the evening went on they moved from Othello to Pente to a game whose name no one could remember, and a site with only lines would have been a smaller room than the one it is trying to remember.",
  ),
  "about.catalogue.c": r(
    "{games}のうち{ours}は、このサイト独自のものです。私たちの知るかぎり、ここにしかない規則で、辺がつながった盤で遊ぶ落とすゲーム、下の1行がそろうと消えるもの、共有の列から取ったドミノで遊ぶ五目並べ、石を置くたびに盤の4分の1が回る盤などがあります。残りの{others}は、他の人が発表したゲームを私たちなりに作ったもので、それぞれの規則のページに、本来の名前と、考案した人が書かれています。ゲームを借りながら誰のものかを書かないのは、ほかの人の夜を材料に作られたサイトが、決して言い訳できないことでしょう。",
    "Of the {games}, {ours} are our own. As far as we know they are rules that exist only here: a drop game played on a board whose edges are joined, one in which a full bottom row disappears, a five in a row played with dominoes taken from a shared queue, and a board in which a quarter of the board turns each time a stone is placed. The remaining {others} are our versions of games that someone else published, and each says so on its own rules page, with its proper name and who devised it. Borrowing a game without saying whose it is would be the one thing a site made out of other people's evenings has no excuse for.",
  ),
  "about.catalogue.d.other": r(
    "系統のうち{groups}は、盤上のゲームではまったくなく、{families}は、1人で遊ぶ{count}種類のパズルを収めています。{puzzles}。どれもお使いのブラウザの中で、ひとつの数から作られ、答えはちょうどひとつで、最初の入力から時間が計られます。サイトは、完成した盤面を確認して会員に経験値を与え、パズルのために、サーバーには何の費用もかかりません。",
    "Of the families, {groups} are not board games at all. {families} contain {count} kinds of puzzle for one person: {puzzles}. Each is made in your own browser from a number, has exactly one answer, and is timed from the first entry. The site checks a finished grid and gives the member experience points for it, and a puzzle costs the server nothing.",
  ),
  "about.catalogue.d.one": r(
    "系統のうち{groups}は、盤上のゲームではまったくなく、{families}は、1人で遊ぶ{count}種類のパズルを収めています。{puzzles}。どれもお使いのブラウザの中で、ひとつの数から作られ、答えはちょうどひとつで、最初の入力から時間が計られます。サイトは、完成した盤面を確認して会員に経験値を与え、パズルのために、サーバーには何の費用もかかりません。",
    "Of the families, {groups} are not board games at all. {families} contain {count} kind of puzzle for one person: {puzzles}. Each is made in your own browser from a number, has exactly one answer, and is timed from the first entry. The site checks a finished grid and gives the member experience points for it, and a puzzle costs the server nothing.",
  ),
  "about.catalogue.puzzle": r(
    "{game}（{inspired}を私たちなりに作ったもので、{sizes}）",
    "{game} (our version of {inspired}, at {sizes})",
  ),
  "about.catalogue.sizesRange": r(
    "{from}×{from}から{to}×{to}まで",
    "{from}×{from} up to {to}×{to}",
  ),
  "about.catalogue.e": r(
    "すべてのゲームの一覧は<in /games>こちら</in>にあり、アカウントがなくても読めます。1手も打たないとしても、どのゲームの規則も読めます。",
    "The whole catalogue is here, and it can be read without an account. You can read the rules of every game, whether or not you ever play a move.",
  ),

  // The catalogue in charts
  "about.charts.title": r(
    "図で見るゲーム一覧",
    "The catalogue in charts",
  ),
  "about.charts.deciderLine": r(
    "並べる",
    "Make a line",
  ),
  "about.charts.deciderLineNote": r(
    "5つ、4つ、3つのいずれかを並べる。落とすゲームや、ひねりのあるゲームを含む",
    "line up five, four or three, including drop games and games with a twist",
  ),
  "about.charts.deciderCapture": r(
    "並べるか、取る",
    "A line, or captures",
  ),
  "about.charts.deciderCaptureNote": r(
    "2つの石を挟んで取り上げる。十分な組数を取っても勝ち",
    "bracket a pair and lift it; capturing enough pairs also wins",
  ),
  "about.charts.deciderAvoid": r(
    "並べない",
    "Avoid a line",
  ),
  "about.charts.deciderAvoidNote": r(
    "逆の勝敗のゲーム。自分が並べた線が負けになる",
    "the reversed games, where the line you make is the one that loses",
  ),
  "about.charts.deciderFlip": r(
    "石の数",
    "Most discs",
  ),
  "about.charts.deciderFlipNote": r(
    "挟まれた並びは裏返り、最後に数える",
    "bracketed runs are flipped, and the discs are counted at the end",
  ),
  "about.charts.deciderJump": r(
    "駒をすべて取る",
    "Take every piece",
  ),
  "about.charts.deciderJumpNote": r(
    "相手が動けなくなるまで、跳んで、成る",
    "jump and promote until the other side cannot move",
  ),
  "about.charts.deciderRace": r(
    "競走",
    "Race home",
  ),
  "about.charts.deciderRaceNote": r(
    "向こう側の陣を先に埋めたほうが勝ち",
    "the first to fill the camp on the far side wins",
  ),
  "about.charts.deciderConnect": r(
    "辺をつなぐ",
    "Join two sides",
  ),
  "about.charts.deciderConnectNote": r(
    "辺から辺までの連鎖",
    "a chain from edge to edge",
  ),
  "about.charts.deciderTerritory": r(
    "地を囲む",
    "Surround ground",
  ),
  "about.charts.deciderTerritoryNote": r(
    "石と、囲い込んだ空き点の合計で、白にはコミが付く",
    "stones plus enclosed empty points, with komi for white",
  ),
  "about.charts.noCountry": r(
    "特定の国なし",
    "No particular country",
  ),
  "about.charts.noCountryNote": r(
    "私たち独自のゲームと、他の人のゲームの私たちなりの変形",
    "our own games, and our variations of other people's games",
  ),
  "about.charts.a": r(
    "ここにあるゲームは、縮小画像では似て見え、格子と2色の石ですが、遊び方はまるで違います。違いを見るいちばん早い方法は、どうやって勝つかです。線で決まるゲームがほかのどれよりも多く、そこがこのサイトの出発点でした。残りは、数える、跳ぶ、競う、つなぐ、囲むのいずれかで決まります。",
    "The games here look alike in a thumbnail, with a grid and stones of two colours, but they play nothing alike. The quickest way to see the difference is how a game is won. More games are decided by a line than by anything else, which is where the site started, and the rest are decided by counting, jumping, racing, connecting or surrounding.",
  ),
  "about.charts.b": r(
    "ゲームは、あちこちから来ています。5つ並べるゲームとその大会向けの形は日本で整えられ、そのためサイトの名前も日本語です。ドラフツの系統は、それだけでひとつの地図のようで、国ごとの規則が次々と続きます。残りのかなりの部分は、ここで作られたため、どの国にも属していません。",
    "They come from all over the place. Five in a row and its tournament forms were settled in Japan, which is why the site's name is Japanese. The draughts family is a map in itself, with one national rule set after another. And a good share of the rest belongs to no country at all, because it was made here.",
  ),
  "about.charts.c": r(
    "そして、遊ばれる盤も多様です。15×15の盤は、5つ並べるゲームが大会で使う盤、19×19は正式な碁盤で、5つ並べるゲームはどちらも用意し、短く遊ぶための小さな盤もあります。ゲームごとの盤はすべて、設定ページにあり、全体の一覧は<in /games>ゲーム一覧</in>にあります。",
    "And they are played on many kinds of board. 15×15 is the board used in competition for five in a row, and 19×19 is the full go board. The five-in-a-row games offer both, along with smaller boards for a quicker game. Every board a game offers is on its set-up page, and the whole list is on the games list.",
  ),
  "about.charts.wonLabel": r(
    "ここにあるゲームの勝ち方を、それぞれの方法で決まるゲームの数で示しています。",
    "How the games here are won, shown by the number of games decided each way.",
  ),
  "about.charts.wonCaption": r(
    "{games}のゲームの勝ち方で、このページが描かれるときに、各ゲームの規則から読み取っています。",
    "How the {games} games are won, read from the rules of each game when this page is drawn.",
  ),
  "about.charts.fromLabel": r(
    "ここにあるゲームの出身国を、国ごとのゲームの数で示しています。",
    "Where the games here come from, shown by the number of games from each country.",
  ),
  "about.charts.fromCaption": r(
    "ゲームの出身国です。各ゲームの規則のページに書かれた国で、日本には印が付いています。国のないゲームは、私たち独自のものか、他の人のゲームを私たちなりに変えたものです。",
    "Where the games come from: the country named on each game's rules page, with Japan marked. A game with no country is one of ours, or our variation of someone else's.",
  ),
  "about.charts.boardsLabel": r(
    "正方形の盤の大きさごとに、いくつのゲームがその盤を用意しているかを示しています。",
    "How many games offer each size of square board.",
  ),
  "about.charts.boardsCaption": r(
    "正方形の盤ごとに、いくつのゲームが遊べるかを示しています。六角形と星形の盤は、大きさが辺ではなくマスや点の数で表されるため、除いています。",
    "How many games can be played on each square board. Hexagonal and star-shaped boards are left out, because their sizes are counted in cells and points, not in the length of a side.",
  ),

  // Ratings, in numbers
  "about.ratings.title": r(
    "数字で見るレーティング",
    "Ratings in numbers",
  ),
  "about.ratings.a": r(
    "ここの順位表はエロ式で、アルパド・エロが1960年にチェスのために作り、1970年にFIDE（国際チェス連盟）が採用した方式です。その考え方は一行で言えます。レーティングは予測だということです。自分のレーティングが<em>R</em>、相手が<em>R′</em>なら、エロ式が自分に期待する得点は<mono>E = 1 / (1 + 10^((R′ − R) / 400))</mono>で、400点の差は10対1を意味します。対局のあと、自分のレーティングは<mono>K × (S − E)</mono>だけ動きます。<em>S</em>は実際の得点で、勝ちは1、引き分けは半分、負けは0です。<em>K</em>は、その数がどれだけ速く動けるかを表します。",
    "The ladder here uses the Elo method, which Arpad Elo devised for chess in 1960 and FIDE (the international chess federation) adopted in 1970. The whole idea can be said in one line: a rating is a prediction. If my rating is R and my opponent's is R′, the score the Elo method expects of me is E = 1 / (1 + 10^((R′ − R) / 400)), so a gap of 400 points means ten to one. After a game my rating moves by K × (S − E). S is the score I actually got, 1 for a win, a half for a draw and 0 for a loss, and K expresses how fast the number may move.",
  ),
  "about.ratings.b": r(
    "ここではKは、対局者の最初の20局のレーティング対局では40、それ以降は20で、これは、FIDEが新しい人に対してしていることとほぼ同じです。誰もが1600から始まります。レーティング対局が4局入るまでは<em>未定</em>で、数は存在しますが、ページにはダッシュが表示されます。3局から計算したレーティングは、小数点付きのコイン投げだからです。20局までは<em>仮</em>、それ以降は<em>確定</em>です。サイトは、順位表のための全ゲームを通したレーティングを1つと、遊んだゲームごとのレーティングを1つずつ保ちます。<game renju>連珠</game>の打ち手と<game ninuki>ペンテ</game>の打ち手は、同じ打ち手ではないからです。",
    "Here K is 40 for a player's first twenty rated games and 20 after that, which is about what FIDE does for newcomers. Everyone starts at 1600. Until four rated games have been played the rating is undetermined: the number exists, but the page shows a dash, because a rating calculated from three games is a coin toss with decimals. Up to twenty games it is provisional, and after that it is established. The site keeps one rating across all games for the ladder, and one rating for each game I play, because a renju player and a Pente player are not the same player.",
  ),
  "about.ratings.c": r(
    "このサイトの母体になったサイトの多くは、同じ考え方で、ゲームの種類ごとに数を持っています。FIDEとアメリカチェス連盟は今もエロ式そのものを使い、LichessとChess.comはその子孫であるグリコとグリコ2を使い、これは数がどれだけ確かかの尺度を加えたものです。ヨーロッパの囲碁は、エロ式の変種に級と段の尺度を重ねたものを使い、Little Golem、PlayOK、ItsYourTurnは、提供するすべてのゲームに、エロ式のレーティングを持っています。ここで新しい名前の横に見えるダッシュは、それらのサイトが疑問符で表示しているものの、正直な形です。",
    "Most of the sites this one grew out of keep a number for each kind of game, in the same spirit. FIDE and the US Chess Federation still use the Elo method itself. Lichess and Chess.com use its descendants, Glicko and Glicko-2, which add a measure of how certain the number is. Go in Europe uses a variant of the Elo method with a scale of kyu and dan on top of it. Little Golem, PlayOK and ItsYourTurn each keep an Elo-style rating for every game they offer. The dash you see beside a new name here is the honest form of what those sites show as a question mark.",
  ),
  "about.ratings.d": r(
    "ここには、上の計算にない規則がひとつあり、易しい相手を探し始める前に知っておく価値があります。相手より400点を超えて上にいる人は、勝っても、まったく何も得られません。負けは数えられ、引き分けも数えられます。エロ式はそれだけでも、大きな本命の勝ちをほとんど無価値にします。400点差では期待得点が10対1なので、増える分は1、2点に丸められますが、ほとんどゼロでも、ゼロではありません。初心者に勝つことで上げられる数は、実際に上げられてしまう数です。その差を超えると、数は単純に上へ動きません。",
    "There is one rule here that is not in the calculation above, and it is worth knowing before anyone goes looking for easy opponents. A player who is more than 400 points above the opponent gains nothing at all from winning. A loss is still counted, and so is a draw. The Elo method by itself already makes a big favourite's win worth almost nothing: at a 400-point difference the expected score is ten to one, so the gain rounds to a point or two. But almost nothing is not nothing, and a number that can be raised by beating beginners will in fact be raised that way. Beyond that gap, the number simply does not move upward.",
  ),
  "about.ratings.e": r(
    "先達のサイトは、同じ問いに違う答えを出しており、<out https://www.pente.org/>Pente.org</out>は、その仕組みを公開しています。これは、もっと多くのサイトが見習ってよい心配りです。そのFAQによれば、確定した対局者のKは32で、ここの1.5倍を超える速さで動き、1局ではなく1セットの対局では64です。仮の対局者には、より大きなKは使わず、それまでの対局の値を平均します。その奇妙で率直な結果として、仮の対局者は、自分よりずっと下の相手に勝った場合、勝ってもレーティングが下がることがあります。そして2019年5月以降は、下限があります。レーティングは、その人がこれまでに持った最高値より200点を超えて下がることはありません。ここには、その3つのどれもありません。",
    "The older sites answered the same questions in different ways, and Pente.org publishes how it works, a courtesy more sites should follow. According to its own FAQ, an established player there moves on a K of 32, more than one and a half times as fast as ours, and 64 for a set of games rather than a single game. For its provisional players it does not use a larger K at all, but averages the value of the games played so far. A strange and candid result of that is that a provisional player can lose rating by winning, if the win was against someone far enough below them. And since May 2019 it has had a floor: a rating cannot fall more than 200 points below the best that player has ever held. We have none of those three.",
  ),
  "about.ladder.player": r(
    "対局者",
    "Player",
  ),
  "about.ladder.rating": r(
    "レーティング",
    "Rating",
  ),
  "about.ladder.games": r(
    "対局数",
    "Games",
  ),
  "about.ladder.tier": r(
    "階級",
    "Tier",
  ),
  "about.ladder.win": r(
    "勝",
    "W",
  ),
  "about.ladder.loss": r(
    "敗",
    "L",
  ),
  "about.ladder.draw": r(
    "分",
    "D",
  ),
  "about.ladder.caption": r(
    "ここでの順位表がどう見えるかを、架空の名前で示しています。誰もが1600から始まります。レーティング対局が4局未満ならダッシュが表示され、Kが大きい次の16局で数が落ち着き、20局を過ぎるとゆっくり動きます。",
    "What a ladder looks like here, shown with made-up names. Everyone starts from 1600. With fewer than four rated games a dash is shown, the number settles over the next sixteen games while K is high, and after twenty it moves slowly.",
  ),
  "about.rules.here": r(
    "ここ",
    "Here",
  ),
  "about.rules.provisionalUntil": r(
    "仮の期間",
    "Provisional until",
  ),
  "about.rules.provisionalHere": r(
    "レーティング対局20局まで",
    "twenty rated games",
  ),
  "about.rules.provisionalThere": r(
    "20局まで",
    "twenty games",
  ),
  "about.rules.kEstablished": r(
    "確定した対局者のK",
    "K for an established player",
  ),
  "about.rules.kEstablishedThere": r(
    "1局なら32、1セットなら64",
    "32 for one game, 64 for a set",
  ),
  "about.rules.kProvisional": r(
    "仮の対局者のK",
    "K for a provisional player",
  ),
  "about.rules.kProvisionalThere": r(
    "これまでの対局の平均で、Kではない",
    "an average of the games so far, not a K",
  ),
  "about.rules.facing": r(
    "仮の相手との対局",
    "Playing against a provisional opponent",
  ),
  "about.rules.facingHere": r(
    "違いなし",
    "no difference",
  ),
  "about.rules.facingThere": r(
    "Kに、相手の対局数÷20を掛ける",
    "K scaled by the opponent's games ÷ 20",
  ),
  "about.rules.floor": r(
    "レーティングの下限",
    "A rating floor",
  ),
  "about.rules.floorHere": r(
    "なし",
    "none",
  ),
  "about.rules.floorThere": r(
    "自己最高の200点下。2019年5月から",
    "200 below your best, since May 2019",
  ),
  "about.rules.favourite": r(
    "大きな本命が勝つこと",
    "A heavy favourite winning",
  ),
  "about.rules.favouriteHere": r(
    "400点を超える差では、何も得られない",
    "gains nothing beyond a 400-point gap",
  ),
  "about.rules.favouriteThere": r(
    "記載なし",
    "not mentioned",
  ),
  "about.rules.caption": r(
    "右の列はPente.orgのもので、公開されているFAQによる、そのサイトについての説明であり、このサイトのものではありません。左の列は、ここのコードが実際にしていることで、順位表の計算に使うのと同じファイルによるため、両者が食い違うところは、本当に食い違っています。",
    "The right-hand column is Pente.org's, from its published FAQ, and describes that site, not this one. The left-hand column is what the code here actually does, from the same file the ladder is calculated with, so where the two disagree, they really do disagree.",
  ),

  // Famous openings and Connect Four, solved
  "about.openings.title": r(
    "有名な開局",
    "Famous openings",
  ),
  "about.openings.kagetsuLabel": r(
    "連珠盤の中央に3つの石があります。黒、そのすぐ隣の白、そして黒の最初の石から斜めの位置にある、白の上の黒です。",
    "Three stones in the centre of a renju board: black, white right beside it, and black above the white stone, diagonal from black's first stone.",
  ),
  "about.openings.kagetsu": r(
    "<jp>花月</jp>（<em>Kagetsu</em>、「花の月」）は、直接開局のなかで最も強いものです。<jp>浦月</jp>（<em>Hogetsu</em>）とともに、連珠のどの規則も抑えなければならなかった一組です。",
    "Kagetsu (\"flower moon\") is the strongest of the direct openings. Together with Hogetsu it is the pair that every renju rule set has had to tame.",
  ),
  "about.openings.direct": r(
    "直接",
    "Direct",
  ),
  "about.openings.indirect": r(
    "間接",
    "Indirect",
  ),
  "about.openings.table": r(
    "連珠の26の開局です。白の2手目が黒の隣にあるものが13、斜めにあるものが13です。どれも月（月）か星（星）にちなんだ名前で、その名前は3手目の位置を表しています。",
    "The twenty-six renju openings: thirteen where white's second stone is beside black's, and thirteen where it is diagonal. Every one is named after a moon (月) or a star (星), and the name stands for the position of the third stone.",
  ),
  "about.openings.a": r(
    "<game renju>連珠</game>は、この系統のなかで、名前のついた定まった開局を持つ唯一のゲームで、その名前は小さな詩のようです。白の2手目は、黒の最初の石のすぐ隣（<em>直接</em>開局）か、そこから斜めの位置（<em>間接</em>開局）に置かれ、黒の3手目は、どちらの場合も13か所のうちのひとつに置かれます。合わせて26の開局があり、それぞれ月か星にちなんだ名前です。そのうち<jp>花月</jp>（Kagetsu）と<jp>浦月</jp>（Hogetsu）は黒にとって非常に強く、現代の大会の規則は、主にそれを抑えるために存在します。2017年から世界選手権で使われている規則は、提案したエストニアの選手にちなんでSoosõrv-8と呼ばれ、先手が開局を指名し、後手は席を入れ替えることができ、5手目は複数の候補から選ぶ形で提示されます。これにより、どちらの側も、勝ちが分かっている形へ持っていくことはできません。",
    "Renju is the one game in this family with a canon of named openings, and the names are like a small poem. White's second stone goes either right beside black's first stone (a direct opening) or diagonally from it (an indirect opening), and in either case black's third stone lands on one of thirteen points. That makes twenty-six openings, each named after a moon or a star. Two of them, Kagetsu and Hogetsu, are so strong for black that the modern tournament rules exist largely to blunt them. Under the rule used at world championships since 2017, called Soosõrv-8 after the Estonian player who proposed it, the first player names the opening, the second may swap seats, and the fifth move is offered as a choice among several, so that neither side can steer the game into a known win.",
  ),
  "about.openings.b": {
    ...r(
      "世界選手権は、1989年の京都以来2年ごとに開かれ、優勝者は日本、ロシア、エストニア、中国、台湾から順に出ています。現在の時代では、中国のQi Guanが何度か優勝しており、最も強い挑戦者はロシアとエストニアから来ています。対局は、国際連珠連盟が1手ずつ公開しています。それらの対局を決める開局は、ほとんどが間接開局（浦月とその近くの形）です。花月以外の直接開局では、白にとって楽な対局になりすぎるからです。ここの学習の棚には、そこから生まれる形をまとめた<in /learn/renju>連珠の手引き</in>があり、<game renju>連珠の盤</game>は、同じ3つの禁手で遊びます。",
      "The world championship has been held every two years since Kyoto in 1989, and the winners have come in turn from Japan, Russia, Estonia, China and Taiwan. In the present era China's Qi Guan has won it more than once, and the strongest rivals come from Russia and Estonia. The Renju International Federation publishes the games move by move. The openings that decide those games are almost all indirect ones, Hogetsu and its neighbours, because a direct opening other than Kagetsu gives white too easy a game. The Learn shelf here has a renju guide covering the shapes that come out of them, and the renju board is played with the same three forbidden shapes.",
    ),
    ask: "Names the winner and the rule 'Soosõrv-8' in Latin script, because their Japanese spellings are not settled; a native read can decide whether a katakana form exists.",
  },
  "about.openings.c": r(
    "<game ninuki>ペンテ</game>にも独自の選手権があります。パーカー・ブラザーズ社は、1980年代初めのこのゲームの最初のブームのときに全国大会を開き、世紀の変わり目以降は<out https://pente.org/>Pente.org</out>が、ほとんど毎年オンラインの世界チャンピオンを決めており、順位表は20年続いています。ペンテの開局には名前がありませんが、名前のある規則がひとつあります。大会では、黒の2手目は中央から少なくとも3交点離れなければならず、これは<em>大会ルール</em>と呼ばれ、連珠における入れ替えと同じ役割をペンテで果たします。ここの<game ninuki>石取りのゲーム</game>は、設定の中の<em>プロ</em>開局としてこれを提供しています。最初の石は中央に置き、黒の2手目は中央の5×5の外に置きます。",
    "Pente has its own championship too. Parker Brothers held a national tournament during the game's first boom in the early 1980s, and since the turn of the century Pente.org has crowned an online world champion most years, with a ladder that has run for twenty years. Pente openings have no names, but there is one rule that does. In tournament play black's second stone must be at least three intersections from the centre. It is called the tournament rule, and does for Pente what the swap does for renju. The capture games here offer it as the Pro opening in their set-up: the first stone goes in the centre, and black's second stone goes outside the central 5×5.",
  ),
  "about.drop.title": r(
    "解かれたコネクトフォー",
    "Connect Four, solved",
  ),
  "about.drop.label": r(
    "7列6行のコネクトフォーの盤で、最初の黒い円盤が中央の列の底にあり、そのまわりにいくつかの円盤が積まれています。",
    "A Connect Four grid with seven columns and six rows, with the first black disc at the bottom of the middle column and a few more discs stacked around it.",
  ),
  "about.drop.caption": r(
    "勝てる唯一の最初の手です。中央の列に落とせば、先手は最善を尽くして、41手目までに勝ちます。その隣の列なら引き分けで、ほかのどの列でも、後手が勝ちます。",
    "The only winning first move. If dropped in the middle column, the first player wins by move 41 with best play; beside it, the game is a draw; anywhere else, the second player wins.",
  ),
  "about.drop.a": r(
    "<game dropFour>コネクトフォー</game>は、この系統のなかで、コンピュータが最初に解き終えたゲームです。ミルトン・ブラッドリー社が1974年に発売し、1988年10月にジェームズ・アレンがユーズネットのニュースグループで、先手が勝つと発表し、その2週間後に、ヴィクター・アリスが、アムステルダム自由大学の修士論文で、同じことを独立に証明しました。探索ではなく9つの経験則から作ったプログラムによるものです。盤には、規則に合う局面が4,531,985,219,092あります。結果は正確です。中央の列から始めれば先手が勝ち、その隣の列から始めれば引き分け、ほかの列から始めれば、正しく打てば後手が勝ちます。のちにジョン・トロンプが、すべての開始局面の値を計算し、どれでも調べられます。",
    "Connect Four is the game in this family that a computer solved first. Milton Bradley released it in 1974. In October 1988 James Allen announced on a Usenet newsgroup that the first player wins, and two weeks later Victor Allis independently proved the same thing in his master's thesis at the Vrije Universiteit Amsterdam, using a program built from nine rules of thumb, not a search. The board has 4,531,985,219,092 positions allowed by the rules. The result is exact. If the first player starts in the middle column, the first player wins; if in the columns beside it, the game is a draw; if in any other column, the second player wins with correct play. John Tromp later calculated the value of every starting position, and you can look any of them up.",
  ),
  "about.drop.b": r(
    "だからといって、人間にとって易しいゲームになるわけではなく、そこに賭け遊びの名手が登場します。ここ数年、ニューヨークの公園や広場（ワシントン・スクエア、ユニオン・スクエア、タイムズ・スクエアの歩道）では、通りがかりの人を相手に、お金を賭けてコネクトフォーを打つ小さな商売があり、腕に覚えのある誰とでも対戦する常連がいます。その映像は世界中に広まりました。常連は、ほとんどの対局に勝ち、ときには別の誰かと話しながらでも勝ちます。チェスの打ち手が定跡を知っているように、狙いの形を覚えているからです。映像のなかの子どもたちは、人々の記憶に残る部分です。「奇数の狙い」の形を覚えた6、7歳の子どもは、覚えていない大人に毎回勝ち、対局は短いので、人だかりができます。それが、解かれたゲームの教訓のすべてです。答えが知られていることではなく、答えを学べるということです。ここの<game dropFour>落とすゲーム</game>は、標準の盤から出発して八方に広がり、どれもまだ解かれていません。",
    "None of that makes it an easy game for a person, and this is where the hustlers come in. For some years now the parks and squares of New York (Washington Square, Union Square, the pavements of Times Square) have had a small business of playing Connect Four for money against passers-by, with regulars who will play anyone who thinks they have a chance. The video footage has spread everywhere. The regulars win almost every game, sometimes while talking to someone else, because they have memorised the threats the way a chess player knows an opening. The children in the clips are the part people remember. A child of six or seven who has learned the pattern of \"odd threats\" beats an adult who has not, every time, and the games are short enough for a crowd to gather. That is the whole lesson of a solved game: it is not that the answer is known, it is that the answer can be learned. The drop games here start from the standard board and spread out in eight directions, and none of them is solved.",
  ),

  // Sites worth knowing
  "about.sites.title": r(
    "知っておきたいサイト",
    "Sites worth knowing",
  ),
  "about.sites.headSite": r(
    "サイト",
    "Site",
  ),
  "about.sites.headSince": r(
    "開設",
    "Since",
  ),
  "about.sites.headGames": r(
    "ゲーム",
    "Games",
  ),
  "about.sites.headFree": r(
    "無料",
    "Free",
  ),
  "about.sites.headPaid": r(
    "有料",
    "Paid",
  ),
  "about.sites.headRatings": r(
    "レーティング",
    "Ratings",
  ),
  "about.sites.iytSince": r(
    "1998年",
    "1998",
  ),
  "about.sites.iytGames": r(
    "変種を含めて約40",
    "about 40, with variants",
  ),
  "about.sites.iytFree": r(
    "1日の手数に上限あり",
    "a daily limit on moves",
  ),
  "about.sites.iytPaid": r(
    "手数無制限、大会、より多くのゲーム",
    "unlimited moves, tournaments, more games",
  ),
  "about.sites.iytRatings": r(
    "ゲームの種類ごとに1つの数",
    "one number per kind of game",
  ),
  "about.sites.gtSince": r(
    "2000年ごろ",
    "around 2000",
  ),
  "about.sites.gtGames": r(
    "変種を含めて60超",
    "over 60, with variants",
  ),
  "about.sites.gtFree": r(
    "同時に開ける対局と手数に上限あり",
    "a limit on open games and moves",
  ),
  "about.sites.gtPaid": r(
    "より多くの同時対局、大会、順位表",
    "more open games, tournaments, ladders",
  ),
  "about.sites.gtRatings": r(
    "レーティングとトークン",
    "ratings and tokens",
  ),
  "about.sites.lgSince": r(
    "2002年",
    "2002",
  ),
  "about.sites.lgGames": r(
    "抽象ゲーム30超、多くの変種",
    "over 30 abstract games, many variants",
  ),
  "about.sites.lgFree": r(
    "すべて",
    "everything",
  ),
  "about.sites.lgPaid": r(
    "なし。寄付による",
    "none; donations",
  ),
  "about.sites.lgRatings": r(
    "エロ式でゲームごと、月ごとの選手権",
    "Elo-style, per game, with monthly championships",
  ),
  "about.sites.penteGames": r(
    "ペンテとその変種",
    "Pente and its variants",
  ),
  "about.sites.pentePaid": r(
    "会員制、任意",
    "membership, optional",
  ),
  "about.sites.penteRatings": r(
    "レーティング、大会、世界選手権",
    "ratings, tournaments, a world championship",
  ),
  "about.sites.playokGames": r(
    "リアルタイム対戦30超",
    "over 30 live games",
  ),
  "about.sites.playokPaid": r(
    "なし",
    "none",
  ),
  "about.sites.playokRatings": r(
    "ゲームごとのエロ式",
    "Elo per game",
  ),
  "about.sites.caption": r(
    "各サイト自身のページと、長い記憶によるものです。上限や価格の細かい点は変わるので、正確なことは各サイトに尋ねてください。{site}は、{games}のゲームがあり、すべて無料で、有料の段階はまったくなく、手数の上限もなく、同時に{limit}局まで開けて、ゲームごとのレーティングと全体の順位表があります。この数は、ここに書き込まずに、一覧から読み取っています。「約35」と書かれていた期間が長く、実際には10ゲーム分も違っていたからです。",
    "From each site's own pages and long memory. Exact limits and prices change, so ask each site for the precise details. {site} has {games} games, everything free with no paid tier at all, no limit on moves, up to {limit} games open at once, a rating for each game and an overall ladder. This number is read from the catalogue and not typed in here, because for a long time it said \"about 35\" while it was really ten games off.",
  ),
  "about.sites.a": r(
    "ここは、このサイトが学んだ場所で、今もあります。<out https://www.itsyourturn.com/>ItsYourTurn</out>は、ウェブの最初の時代の1998年から、メールで順番制のゲームを運営しており、創設者の家族が何年も遊んだ場所です。その形は、このサイトの形そのものです。自分を待つ対局の一覧、相手を待つ対局の一覧、招待、そして記録です。無料の会員は1日の手数に上限があり、家族が会員になったのはそのためです。有料の段階では上限がなくなり、大会やめずらしいゲームも開きます。ゲームの数は、変種を含めて約40で、ゲームの種類ごとにレーティングを持っています。",
    "These are the places this site learned from, and they are still there. ItsYourTurn has run turn-based games by email since 1998, from the first period of the web, and it is where the founder's family played for years. Its form is the form of this site: a list of games waiting for me, a list waiting for the other player, invitations and records. A free account has a limit on the moves per day, which is why the family became members. The paid tier removes the limit and opens tournaments and the rarer games. It has about forty games counting variants, and it keeps a rating for each kind of game.",
  ),
  "about.sites.b": r(
    "<out https://www.goldtoken.com/>GoldToken</out>は、その少しあと、2000年ごろに、より大きなゲームの一覧とともに現れました。60を超えるゲームとその変種があり、クラブのように感じられる集まりでした。遊ぶと得られるトークン、順位表、大会、掲示板です。無料の会員は、同時に開ける対局の数に制限があり、会員になるとそれが外れ、さらに増えます。家族の夜の、もう半分でした。<out https://www.littlegolem.net/>Little Golem</out>は、2002年にスロバキアのリチャード・マラシュチッツが始めた、通好みのサイトです。ヘックス、囲碁、五目並べ、アマゾン、トゥイクストなど数十の抽象ゲームがあり、多くはいくつもの変種があり、それぞれに月ごとの選手権とエロ式のレーティングがあり、有料の段階はまったくなく、寄付で運営されています。そのゲームのいくつかで世界屈指の打ち手が、ここの選手権に参加し、創設者の父もここで何年も遊びました。",
    "GoldToken came soon after, around 2000, with a bigger catalogue of over sixty games and their variants, and a community that felt like a club: tokens earned by playing, ladders, tournaments and a forum. A free account limits how many games you can have open at once, and membership removes that and adds more. It was the other half of the family's evenings. Little Golem, started in 2002 by Richard Malaschitz in Slovakia, is the connoisseur's site. It has Hex, Go, gomoku, Amazons, Twixt and dozens of other abstract games, many in several variants, with monthly championships and an Elo-style rating for each, and no paid tier at all, running on donations. Some of the strongest players in the world in several of those games enter its championships, and the founder's father played there for years.",
  ),
  "about.sites.c": r(
    "<out https://pente.org/>Pente.org</out>は、20年にわたって、レーティングのあるペンテをオンラインで保ち続けており、大会ルール、独自の変種、順位表、世界選手権があり、会員になるかどうかは任意です。<out https://www.playok.com/>PlayOK</out>は、マレク・フトレガが2001年にポーランドで始めたときの名前から、今もクルニクと呼ぶ人が多く、午前2時に見知らぬ人とリアルタイムで五目並べを打ちたいときに行く場所で、ゲームごとのエロ式レーティングがあり、部屋は空になることがないようです。会員数は、これらのサイトのどこも、はっきりとは公表していないものです。どのサイトも、最盛期には数万人の登録者がおり、どこにも、20年そこにいる中核の人たちがいます。",
    "Pente.org has kept ranked Pente alive online for twenty years, with the tournament rule, several variants of its own, a ladder and a world championship, and membership is optional. PlayOK, which many still call Kurnik, the name Marek Futrega gave it when he started it in Poland in 2001, is where you go for a live game of gomoku against a stranger at two in the morning, with an Elo rating for each game and rooms that never seem to empty. Membership numbers are the one thing none of these sites states plainly. Each has had tens of thousands of registered players at its peak, and each has a hard core of people who have been there for twenty years.",
  ),
  "about.sites.d": {
    ...r(
      "ItsYourTurnやGoldTokenで何年も遊んできましたか。戦績は、一緒に持ってくることができます。遊んでいたサイトと、使っていた名前を添えて{mail}にメールをくだされば、対局、勝ち、負け、引き分けを、対局ごとに、手作業で写し取ります。そのため、ここでのあなたのページには、ここでの対局に加えた、持ち込んだすべてのサイトを通した1つの戦績として表示されます。そのように合算した戦績を表示するサイトは、ほかにありません。ただし、2つのことは、そうではありません。まず、これは一度だけ写し取った写しです。そのあと向こうで打った対局は、もう一度ご連絡いただかないかぎり、ここには現れません。次に、合算されるのは戦績であって、レーティングではありません。対局数や勝ち数はサイトを超えて足せますが、レーティングは各サイト独自の尺度で測られているため、ほかのサイトのレーティングが、ここのものに混ざることは決してありません。",
      "Have you played for years on ItsYourTurn or GoldToken? Your record can come with you. If you email {mail} with the site and the name you used, the games, wins, losses and draws will be copied over by hand, game by game, so your page here shows them added to what you play here, as one record spanning every site you have brought. No other site shows a combined record like that. There are two things it is not. First, it is a snapshot copied once: games you play there afterwards will not appear here unless you contact us again. Second, what is combined is the record, not the rating. Numbers of games and wins can be added across sites, but each site measures ratings on its own scale, so a rating from another site is never mixed into the one here.",
    ),
    ask: "A promise to copy a member's record over from another site, and what it is not: it binds the site, so a native read is recommended.",
  },
  "about.sites.e": r(
    "コードをお持ちなら、入口は<in /join>こちら</in>です。お持ちでなくても、<in /learn>学習の棚</in>は誰にでも開かれています。",
    "If you have a code, the door is here. If you do not, the learning shelf is open to everyone.",
  ),
  "about.sites.playokSince": r(
    "2001年",
    "2001",
  ),

  // The screenshots
  "about.shots.boardDesk": r(
    "デスクトップでの練習盤（英語表示）です。五目並べが12手進み、横のパネルに、黒が勝ちを強制できると表示されています。",
    "The practice board on a desk (English display). A game of gomoku twelve moves in, with the side panel showing that black can force a win.",
  ),
  "about.shots.boardPhone": r(
    "同じ練習盤をスマートフォンで見たところ（英語表示）です。盤が画面の幅いっぱいに広がっています。",
    "The same practice board on a smartphone (English display). The board fills the width of the screen.",
  ),
  "about.shots.setUp": r(
    "設定画面にあるコンピュータの一覧（英語表示）です。それぞれに段位か棋風があり、Rafa Duarteが選ばれています。",
    "The list of computers on the set-up screen (English display). Each has a grade or a style, and Rafa Duarte is chosen.",
  ),
  "about.shots.vsComputer": r(
    "コンピュータとの五目並べの対局（英語表示）です。盤、その下に「全局面」が付いた手の一覧、非公開のメモ、確定の切り替え、手と一緒に送る絵文字と定型メッセージの列があります。",
    "A game of gomoku against a computer (English display). It shows the board, the list of moves with \"every position\" beneath it, private notes, the confirm switch, and a row of emoji and ready-made messages to send with a move.",
  ),
  "about.shots.replayDesk": r(
    "級と段の間で終わったリバーシの対局（英語表示）です。対戦成績のカードと、60手中33手目にスライダーを合わせた盤があります。",
    "A finished game of Reversi between Kyu and Dan (English display). It shows the head-to-head card and the board with the slider at move 33 of 60.",
  ),
  "about.shots.replayPhone": r(
    "終わった同じ対局をスマートフォンで見たところ（英語表示）です。スライダーは盤の下にあります。",
    "The same finished game on a smartphone (English display), with the slider under the board.",
  ),
  "about.shots.pictureWindow": r(
    "アルファ碁対イ・セドルの上に開いた絵のウィンドウ（英語表示）です。2つの形、長い対局のための選択、ダウンロードのボタン、そして、タイトルバーの下の絵があります。",
    "The picture window opened over AlphaGo against Lee Sedol (English display). It shows the two shapes, the choice for a long game, a Download button and, under the title bar, the picture.",
  ),
  "about.shots.wallDesk": r(
    "ダウンロードしたアルファ碁対イ・セドルの横長の絵です。対局名を示すタイトルバーと、最後の手で終わる、8つの全段に並んだ128個の小さな盤があります。",
    "A downloaded landscape picture of AlphaGo against Lee Sedol. It has a title bar naming the game, and 128 small boards in eight full rows, ending on the last move.",
  ),
  "about.shots.wallPhone": r(
    "同じ対局を、スマートフォン向けの縦長の絵にしたものです。タイトルバーは3行にわたり、その下に16の全段が並びます。",
    "The same game as a portrait picture for a smartphone, tall and narrow, with the title bar on three lines above sixteen full rows.",
  ),
  "about.shots.gamePage": r(
    "囲碁のページ（英語表示）です。盤、このゲームの目的、ここで遊ばれた対局、そして、横の欄に最近の対局の終局時の局面があります。",
    "The Go page (English display). It shows the board, the object of the game, the games played here and, in the side column, the final positions of recent games.",
  ),
  "about.shots.famous": r(
    "名局のページ（英語表示）です。冒頭に、2016年のGoogleディープマインド・チャレンジマッチでの、イ・セドルとアルファ碁の4局があります。",
    "The Famous games page (English display), opening with the four games of the 2016 Google DeepMind Challenge Match between Lee Sedol and AlphaGo.",
  ),
  "about.shots.computerPlayer": r(
    "コンピュータのページ（英語表示）です。ゲームごとに、その前後の段位と比べてどうだったかを載せています。",
    "A computer's page (English display), listing for each game how it measured against the grades on either side of it.",
  ),
  "about.shots.xpBoard": r(
    "経験値の順位表（英語表示）です。人かコンピュータか、ここで得た経験値かすべての場所のものかを選ぶ絞り込みがあります。",
    "The XP board (English display), with filters for people or computers, and for experience earned here or everywhere.",
  ),

  // Playing here: at the board
  "about.board.title": r(
    "盤の上で",
    "On the board",
  ),
  "about.board.a": r(
    "盤は、デスクトップでもスマートフォンでも同じです。石を置き、それを見て、送ります。スマートフォンでは、石がどの点に落ちたかが表示され、送る前に、4つの矢印で1点ずつ動かせ、送るボタンは画面の下に固定されています。ボタンや一覧は、どれも親指で押せる大きさです。コンピュータとの対局では、盤の上の切り替えで、触れたらすぐ打つようにでき、その選択はサイトが覚えています。",
    "The board is the same on a desktop and on a smartphone. I place a stone, look at it, and then send it. On a smartphone the stone shows which point it landed on, four arrows can move it one point at a time before I send it, and the send button stays fixed at the bottom of the screen. Every button and list is big enough to press with a thumb. Against a computer, a switch on the board lets the move be played immediately on touch, and the site remembers the choice.",
  ),
  "about.board.b": r(
    "盤は、代わりに打つことなく助けてくれます。取ることが強制されるときや、打てる手が1つか2つしかないときは、それを印で示し、残りを暗くして、理由を伝えます。打てる手がまったくないときは、代わりにパスをして、両方の盤にそう表示します。<game go>囲碁</game>では、初心者のために特別な助けがあります。石を置けない場所の×印、取る手やアタリの石を救う手の点にある輪、自分の目をふさぐ前の警告です。対局が終わると、盤の上のカードに、誰が勝ってその理由、対局で得た経験値が示され、再戦も申し込めます。",
    "The board helps without playing for me. When a capture is forced, or when I have only one or two legal moves, it marks them, dims the rest and tells me why. When I have no legal move at all, it passes for me and says so on both boards. Go gets extra help for beginners: a cross on points where a stone cannot be placed, a ring on the point that captures or saves a group in atari, and a warning before a stone would fill my own eye. When a game ends, a card over the board shows who won and why and the experience the game paid, and offers a rematch.",
  ),
  "about.board.c": r(
    "進行中の対局のまわりには、次のものがあります。手と一緒に送るメッセージは、定型の一言（「{hello}」「{noRush}」）か、絵文字つきの自分の言葉です。ブラウザの中にだけ残る非公開のメモ欄、盤を回して反対側から見るボタン、盤の大きさの選択もあり、投了もできます。",
    "Around a live game there is the following. A message to send with the move can be one of the ready-made lines (\"{hello}\", \"{noRush}\") or my own words with an emoji. There is a private notes box that stays only in the browser, a button to turn the board round and see it from the other side, and a choice of board size. I can also resign.",
  ),
  "about.board.d": r(
    "<em>練習盤</em>は、すぐに使い始められる盤です。両方の側を自分で打ち、手を戻し、どちらかに勝ちの筋があるかを尋ね、ItsYourTurnやGoldTokenの対局を貼り付けて、順に進めることもできます。そこで打った対局は、レーティングに入りません。<em>盤だけ</em>は、ページの上に盤だけを開き、打つのに必要な操作か、終わった対局のスライダーだけを表示します。Escか「閉じる」で戻れ、戻すまで、対局をまたいでそのまま続きます。木目も選べます。{themes}。",
    "The practice board is the one I can start using straight away. I play both sides, take moves back, ask whether either side has a winning line, and paste in a game from ItsYourTurn or GoldToken to step through it. Games played there do not count toward ratings. \"Just the board\" opens only the board over the page, showing only the controls needed to play, or the slider of a finished game. Esc or \"Close\" takes me back, and it stays on from game to game until I turn it off. The wood grain can also be chosen: {themes}.",
  ),
  "about.board.e": r(
    "対局を始めるのは、ひとつの画面で済みます。ゲーム、盤、対戦相手、すべての規則、自分の色が表示され、ボタンをひとつ押せば始まります。コンピュータは、名前と段位で並び、それぞれに、前後の段位と実際に対戦してどうだったかのメモが付いています。",
    "Starting a game takes one screen. It shows the game, the board, the opponent, every rule and which colour I take, and a single press starts it. The computers are listed there by name and grade, each with a note on how it actually fared against the grades on either side of it.",
  ),
  "about.board.shotA": r(
    "<game freestyle>五目並べ</game>の練習盤で、12手進んだところを、デスクトップとスマートフォンで示しています。横のパネルが、黒が勝ちを強制できることを見つけています。",
    "The practice board at gomoku, twelve moves in, on a desktop and on a smartphone. The panel beside it has noticed that black can force a win.",
  ),
  "about.board.shotB": r(
    "名前のあるコンピュータのひとり、Rafa Duarteとの<game freestyle>五目並べ</game>で、8手進んだところです。盤の下のメッセージと絵文字は、次の手と一緒に送られます。",
    "Eight moves into a game of gomoku against Rafa Duarte, one of the named computers. The messages and emoji under the board go with my next move.",
  ),
  "about.board.shotC": r(
    "対戦相手を選んでいるところです。名前のあるコンピュータには、段位のほかに棋風があり、攻め型、守り型、変化型があります。",
    "Choosing who to play. The named computers have styles as well as grades: attacking, defensive or changeable.",
  ),

  // Playing here: every move, forwards and back
  "about.replay.title": r(
    "すべての手を、進めても戻しても",
    "Every move, forwards and back",
  ),
  "about.replay.headControl": r(
    "操作",
    "Control",
  ),
  "about.replay.headDoes": r(
    "働き",
    "What it does",
  ),
  "about.replay.slider": r(
    "スライダー",
    "The slider",
  ),
  "about.replay.sliderDoes": r(
    "最初の手から最後の手まで動かします。盤には、その局面が、手数と打った点とともに表示されます。",
    "Drag from the first move to the last. The board shows that position, with its move number and the point played.",
  ),
  "about.replay.steps": r(
    "最初へ・戻る・進む・最後へ",
    "To the start · Back · Forward · To the end",
  ),
  "about.replay.stepsDoes": r(
    "1手ずつ、または、どちらかの端まで一気に動きます。",
    "One move at a time, or straight to either end.",
  ),
  "about.replay.list": r(
    "手の一覧",
    "The move list",
  ),
  "about.replay.listDoes": r(
    "すべての手が、番号つきで並びます。クリックすると、その手へ移ります。",
    "Every move, numbered. Click one to jump to it.",
  ),
  "about.replay.fork": r(
    "分岐",
    "Fork",
  ),
  "about.replay.forkDoes": r(
    "自分が打った対局で手を戻すと表示されます。まさにその局面から、同じ相手との新しい対局を始めます。",
    "Shown once I step back in a game I played: a new game from exactly that position, against the same opponent.",
  ),
  "about.replay.pictureDoes": r(
    "対局全体を、画面の大きさの1枚の絵にします。次の節をご覧ください。",
    "The whole game as one picture, the size of the screen. See the next section.",
  ),
  "about.replay.sgf": r(
    "SGFファイル",
    "SGF file",
  ),
  "about.replay.sgfDoes": r(
    "終わった対局を、SGFファイル（棋譜のプログラムが読む形式）としてダウンロードします。SGFに番号があるゲームが対象です。",
    "Download a finished game as an SGF file (the format that game-record programs read). This applies to every game that SGF has a number for.",
  ),
  "about.replay.applause": r(
    "拍手",
    "Applause",
  ),
  "about.replay.applauseDoes": r(
    "終わった対局に誰でも残せる、5つの絵文字です。遊ぶ価値があった対局だったという気持ちを伝えます。",
    "Five emoji that anyone can leave on a finished game, to say it was worth playing.",
  ),
  "about.replay.controls": r(
    "終わった対局の盤の下にある操作です。1つの画面で打つ対局にも、同じスライダーがあります。",
    "The controls under the board of a finished game. A game played on one screen has the same slider.",
  ),
  "about.replay.a": r(
    "ここのどの対局も、手をすべて保存しており、どの手へも戻れます。終わった対局は、最終局面で開き、盤の横にスライダーがあります。動かすか、その下の矢印で進めるか、再生を押すと、盤にその局面が、手数と石が置かれた場所とともに表示されます。横の手の一覧では、クリックした手へ移ります。進行中の対局も、同じパネルに手が表示され、2人が1つの画面で打つ対局にも、同じスライダーがあります。",
    "Every game here saves its moves, and I can go back to any of them. A finished game opens at its final position, with a slider beside the board. If I drag it, step with the arrows under it or press play, the board shows that position with its move number and where the stone went. In the move list beside it, clicking a move jumps to it. A game in progress shows its moves in the same panel, and a game played by two people on one screen has the same slider.",
  ),
  "about.replay.b": r(
    "終わった対局の上には、対戦成績のカードがあり、2人の対戦成績を数えています。互いの勝ち、引き分け、現在の連続記録、最後に対局した日です。自分が打った対局で、前の局面まで戻ると、<em>分岐</em>が現れます。まさにその局面から、同じ相手と始める2局目の対局です。ほかの対局の申し込みや再戦と同じく、相手が受け入れるまで待機します。",
    "Above a finished game there is a head-to-head card counting how the two players stand against each other: each one's wins, draws, the current streak and when they last played. In a game I played, if I step back to an earlier position, \"Fork\" appears. It is a second game that starts from exactly that position against the same opponent. Like any other offer of a game, or a rematch, it waits until the opponent accepts.",
  ),
  "about.replay.shotA": r(
    "2つのコンピュータの間で終わった<game reversi>リバーシ</game>の対局で、スライダーを60手中33手目まで戻したところです。対戦成績のカードは盤の上にあります。",
    "A finished game of Reversi between two computers, with the slider dragged back to move 33 of 60. The head-to-head card is above the board.",
  ),

  // Playing here: the game as one picture
  "about.picture.title": r(
    "対局を1枚の絵に",
    "The game as one picture",
  ),
  "about.picture.a": r(
    "どの対局の手の一覧の横にも、控えめなボタン<em>{open}</em>があります。これを押すと、対局が1枚の絵として開きます。手ごとに小さな盤が1つ、順に全局面が並び、その上の帯に、ゲーム名、対局した日、結果が書かれています。形は2つあり、{landscape}（{landscapeNote}）と{portrait}（{portraitNote}）です。画面の向きに合うほうで始まるので、壁紙としてちょうどよく収まります。<em>{download}</em>で、PNGとして保存できます。絵は、ページがすでに持っている手から、お使いのブラウザが描きます。どこにも送られず、何も保存されないので、再読み込みすると、描き直されるだけです。",
    "Beside the move list of every game there is a quiet button, \"{open}\". It opens the game as one picture: all the positions in order, one small board per move, and above them a bar giving the name of the game, when it was played and how it ended. It comes in two shapes: {landscape} ({landscapeNote}) and {portrait} ({portraitNote}). It starts with the one that matches my screen's orientation, so the picture fits well as a wallpaper. \"{download}\" saves it as a PNG. My own browser draws it from the moves the page already has. Nothing is sent anywhere and nothing is stored, so refreshing simply draws it again.",
  ),
  "about.picture.b": r(
    "盤は、いつも完全な格子になるため、絵は右下の隅の最後の手で終わります。長い対局では、1枚の絵に収まるより多くの手があります。盤が{most}枚ほどを超えると、1枚1枚が小さくなりすぎて、対局として読めなくなるので、長い対局には選択肢があります。手を均等に飛ばした対局全体か、最後の手から数えて戻る終盤です。手の数が長方形にならないときは、いくつか飛ばし、帯には、全局面の何個を絵が含んでいるかが表示されます。",
    "The boards always form a complete grid, so the picture ends with the last move in the bottom-right corner. A long game has more moves than a picture has room for. Past about {most} boards, each one becomes too small to read as a game, so a long game offers a choice: the whole game with moves skipped evenly, or the ending, counted back from the last move. If the number of moves does not form a rectangle, a few are skipped, and the bar shows how many positions out of the total the picture contains.",
  ),
  "about.picture.c": r(
    "同じ絵は、ほかに4か所に現れます。進行中の対局は、これまでの全局面を表示し、1手ごとに描き直します。対局者自身のページでは、ある種類の対局を並べて、それぞれの終わり方で、勝ち、負け、またはすべてを表示できます。各ゲームのページには、ここで最近遊ばれた対局がどう終わったかが表示され、それぞれのタイルは、その対局へ移ります。<in /famous>名局</in>は、選手権や歴史的な対局（アルファ碁対イ・セドルなど）を、このサイト自身の規則で再生し、それぞれの全手の絵を作ります。",
    "The same picture appears in four more places. A game in progress shows every position so far, and redraws after each move. On a player's own page, games of one kind can be put side by side, each as it ended: won, lost or all. Each game's page shows how the most recent games played here ended, and each tile leads to that game. Famous games replays championship and historic games, including AlphaGo against Lee Sedol, under this site's own rules, and makes a picture of every move of each of them.",
  ),
  "about.picture.shotA": r(
    "アルファ碁対イ・セドルの上に開いた絵のウィンドウで、19×19の盤での、長い<game go>囲碁</game>の対局です。1枚の絵に収まる以上の局面があるので、収め方が2通り示され、上の帯には、いくつ表示しているかが書かれています。",
    "The picture window opened over AlphaGo against Lee Sedol, a long game of go on the 19×19 board. It has more positions than a picture can hold, so it offers the two ways of fitting them, and the bar across the top says how many it shows.",
  ),
  "about.picture.shotB": r(
    "同じ対局のダウンロードした2枚の絵で、ボタンが保存するそのままの形です。2016年の対局の第4局、<game go>囲碁</game>のアルファ碁対イ・セドルです。左は、1920×1080の画面向けの横長、右は、スマートフォン向けの縦長です。どちらも、右下の隅の最後の手で終わります。",
    "Two downloaded pictures of the same game, exactly as the button saves them: AlphaGo against Lee Sedol, the fourth game of their 2016 match, in go. On the left is the landscape one for a 1920×1080 screen, and on the right the portrait one for a smartphone. Each ends with the last move in the bottom-right corner.",
  ),
  "about.picture.shotC": r(
    "横の欄に、ここで遊ばれた対局の終局時の局面がある<game go>囲碁</game>のページと、冒頭にイ・セドルとアルファ碁の2016年の対局がある<in /famous>名局</in>です。",
    "The go page, with the final positions of games played here in its side column, and Famous games, opening with the 2016 match between Lee Sedol and AlphaGo.",
  ),

  // Playing here: with people
  "about.people.title": r(
    "人と遊ぶ",
    "Playing with people",
  ),
  "about.people.headWhat": r(
    "内容",
    "What",
  ),
  "about.people.headWhere": r(
    "場所",
    "Where",
  ),
  "about.people.headShort": r(
    "ひとことで",
    "In short",
  ),
  "about.people.rematch": r(
    "対局、再戦、分岐",
    "Play, rematch, fork",
  ),
  "about.people.rematchWhere": r(
    "対局者のページ、終わった対局",
    "A player's page, a finished game",
  ),
  "about.people.rematchShort": r(
    "相手が受け入れるまでは、申し込みのままです。断っても何も失わず、取り下げることもできます。",
    "It remains an offer until the other player accepts it. Declining costs nothing, and it can be withdrawn.",
  ),
  "about.people.paired": r(
    "組になった対局",
    "Paired games",
  ),
  "about.people.pairedWhere": r(
    "対局の設定",
    "Setting up a game",
  ),
  "about.people.pairedShort": r(
    "1人の相手と{sizes}局を同時に行う対局で、色を交互に持ちます。",
    "A match of {sizes} games at once against one player, taking each colour in turn.",
  ),
  "about.people.waiting": r(
    "待合室",
    "The waiting room",
  ),
  "about.people.waitingShort": r(
    "対局を待つ全員が、レーティング、持ち時間、国とともに並びます。「着席」を押すと、参加する前に対局内容を確認できます。",
    "Everyone waiting for a game, shown with rating, time limit and country. \"Sit down\" shows me the game before I join.",
  ),
  "about.people.note": r(
    "手に添えるメッセージ",
    "A message with a move",
  ),
  "about.people.noteWhere": r(
    "「送る」の横",
    "Beside the send button",
  ),
  "about.people.noteShort": r(
    "絵文字と最大{max}文字で、手と一緒に届きます。",
    "An emoji and up to {max} characters, which arrive with the move.",
  ),
  "about.people.messages": r(
    "メッセージ",
    "Messages",
  ),
  "about.people.messagesWhere": r(
    "対局者のページ",
    "A player's page",
  ),
  "about.people.messagesShort": r(
    "最大{max}文字で、相手の受信箱に届きます。誰かを無視すると、双方向のメッセージが止まります。",
    "Up to {max} characters, delivered to their inbox. Ignoring someone stops messages in both directions.",
  ),
  "about.people.inbox": r(
    "受信箱",
    "Inbox",
  ),
  "about.people.inboxShort": r(
    "留守のあいだに起きたことです。終わった対局、申し込まれた対局、埋まった席、メッセージ。{days}日間保存されます。",
    "What happened while I was away: a game that finished, a game that was offered, a seat that was taken, a message. Kept for {days} days.",
  ),
  "about.people.buddies": r(
    "仲間",
    "Buddies",
  ),
  "about.people.buddiesWhere": r(
    "自分のページ",
    "My own page",
  ),
  "about.people.buddiesShort": r(
    "知っている人、その人が今いるかどうか、2人の間の対局、そして、各名前の横の「遊ぶ」です。",
    "The people I know, whether they are around, the games between us, and \"Play\" beside each name.",
  ),
  "about.people.headStart": r(
    "ハンデ",
    "A head start",
  ),
  "about.people.headStartShort": r(
    "弱いほうの側に与える先打ちの手、または囲碁、オセロ、ドラフツの昔からのハンデです。レーティングには入りません。",
    "Free turns for the weaker player, or the traditional handicap in go, Othello and draughts. It does not count toward ratings.",
  ),
  "about.people.words": r(
    "合言葉",
    "Four words (合言葉)",
  ),
  "about.people.wordsWhere": r(
    "他の人の端末",
    "Somebody else's device",
  ),
  "about.people.wordsShort": r(
    "共有のタブレットで、自分の合言葉をタップすると、入力なしで自分の席に着けます。",
    "Tapping my 合言葉 takes my own seat on a shared tablet, with nothing to type.",
  ),
  "about.people.link": r(
    "席のリンク",
    "A seat link",
  ),
  "about.people.linkWhere": r(
    "盤の横",
    "Beside the board",
  ),
  "about.people.linkShort": r(
    "空いた席のためのリンクかQRコードで、そこに座るべき人に渡します。",
    "A link or QR code for an empty seat, to hand to whoever should sit in it.",
  ),
  "about.people.language": r(
    "言語",
    "Language",
  ),
  "about.people.languageWhere": r(
    "名前の下のメニュー",
    "The menu under my name",
  ),
  "about.people.languageShort": r(
    "英語か日本語で、アカウントに保存されるので、どの端末でも引き継がれます。",
    "English or Japanese, kept on my account so that it follows me to every device.",
  ),
  "about.people.where": r(
    "対局者どうしの間で起きることの、見つけ方です。どれも無料です。",
    "Where to find the things that happen between players. None of them costs anything.",
  ),
  "about.people.a": r(
    "ここの対局の多くは、ゆっくり進みます。手を打つと、相手は都合のよいときに答えます。手を送ると、自分を待つ次の対局が、古いものから順に、自動で開きます。手にはメッセージを添えられます。絵文字を選び、「送る」の横に1行書けば、手と一緒に届きます。相手が同意するまでは、誰ともつながりません。対戦の申し込み、再戦、分岐は、相手の一覧で、「受ける」と「辞退」とともに待ちます。",
    "Most games here are slow. I make a move, and my opponent answers when they get to it. When I send a move, the next game waiting for me opens by itself, oldest first. A message can go with a move: I choose an emoji, write a line beside the send button, and it arrives with the move. Nothing ties me to another person until they agree to it. An offered game, a rematch or a fork waits in their list with \"Accept\" and \"Decline\".",
  ),
  "about.people.b": r(
    "上の表に、それぞれがどこにあるかが書かれています。<in /players>対局者</in>のページは全員を一覧にし、どの列でも並べ替えられ、コンピュータもほかの全員と一緒に並びます。<in /xp>経験値の順位表</in>は、全員を経験値で順位づけし、人、コンピュータ、またはその両方を数えられます。",
    "The table above says where each of these is. The players page lists everyone, sortable by every column, and the computers are listed together with everybody else. The XP board ranks everyone by experience, and can count people, computers or both.",
  ),
  "about.people.shotCaption": r(
    "コンピュータのページで、ゲームごとに、隣の段位と比べてどうだったかを示したものと、経験値の順位表です。どちらも、スクリーンショットを撮った手元のコピーのもので、対局者はごくわずかでした。",
    "A computer's page, showing how it measured against the neighbouring grades at each game, and the XP board. Both are from the local copy where the screenshots were taken, which held only a handful of players.",
  ),

  // The pages of the site
  "about.page.games": r(
    "ゲーム",
    "Games",
  ),
  "about.page.gamesWhat": r(
    "ここにあるすべてのゲームを、系統ごとに、規則、盤、背景とともに載せています。",
    "Every game here, by family, with its rules, its board and its background.",
  ),
  "about.page.learn": r(
    "学び",
    "Learn",
  ),
  "about.page.learnWhat": r(
    "戦略の手引きです。勝ちにつながる形、相手に選ばせない手、誰もが一度はする間違いをまとめています。",
    "Strategy guides: the shapes that win, the moves that leave no choice, and the mistakes everyone makes once.",
  ),
  "about.page.about": r(
    "このサイトについて",
    "About this site",
  ),
  "about.page.aboutWhat": r(
    "このページです。サイトとそのゲームがどこから来たかを説明しています。",
    "This page: where the site and its games came from.",
  ),
  "about.page.join": r(
    "入会",
    "Join",
  ),
  "about.page.joinWhat": r(
    "招待コードを使うか、コードを頼みます。",
    "Use an invitation code, or ask for one.",
  ),
  "about.page.play": r(
    "自分の対局",
    "My games",
  ),
  "about.page.playWhat": r(
    "自分の対局です。自分の手番と相手の手番を並べ、参加できる空いた対局があります。終わった対局、1台で交代、パズルは、それぞれ別のタブにあります。",
    "My games: my move beside the opponent's move, and open games I can join. Finished games, taking turns on one device and puzzles are each on a tab.",
  ),
  "about.page.history": r(
    "棋譜",
    "Game records",
  ),
  "about.page.historyWhat": r(
    "終わったすべての対局を、1手ずつ再生できます。",
    "Every finished game, which can be replayed move by move.",
  ),
  "about.page.players": r(
    "対局者",
    "Players",
  ),
  "about.page.playersWhat": r(
    "遊んでいる全員、順位表、そしてコンピュータです。",
    "Everybody who plays, the ladder, and the computers.",
  ),
  "about.page.champions": r(
    "名人",
    "Champions",
  ),
  "about.page.championsWhat": r(
    "各ゲームの頂点に立っているのが誰かを示します。",
    "Who stands at the top of each game.",
  ),
  "about.page.famous": r(
    "名局",
    "Famous games",
  ),
  "about.page.famousWhat": r(
    "選手権や歴史的な対局を、このサイト自身の規則で再生します。",
    "Championship and historic games, replayed under this site's own rules.",
  ),
  "about.page.xp": r(
    "経験値",
    "Experience points",
  ),
  "about.page.xpWhat": r(
    "経験値とレベルです。全員を、獲得したものの順に並べます。",
    "Experience and levels: everybody ranked by what they have earned.",
  ),
  "about.page.inbox": r(
    "受信箱",
    "Inbox",
  ),
  "about.page.inboxWhat": r(
    "留守のあいだに、自分の対局で起きたことです。",
    "What happened in my games while I was away.",
  ),
  "about.page.open": r(
    "誰でも読める",
    "open to everyone to read",
  ),
  "about.page.members": r(
    "会員のみ",
    "members only",
  ),

  // How a game goes here
  "about.how.title": r(
    "ここでの対局の流れ",
    "How a game goes here",
  ),
  "about.how.stepsLabel": r(
    "ここでの対局の6つの段階で、ゲームを選ぶところから順位表までです。",
    "The six steps of a game here, from choosing one to the ladder.",
  ),
  "about.how.choose": r(
    "選ぶ",
    "Choose",
  ),
  "about.how.chooseBody": r(
    "{families}の系統に{games}のゲームがあり、規則はそれぞれ専用のページにあります。",
    "{games} games in {families} families, each with its rules on its own page.",
  ),
  "about.how.setUp": r(
    "設定",
    "Set up",
  ),
  "about.how.setUpBody": r(
    "盤の大きさ、開局、レーティング対局か親善対局か、そして対戦相手です。",
    "The size of the board, the opening, rated or friendly, and who I am playing.",
  ),
  "about.how.seat": r(
    "着席",
    "Take a seat",
  ),
  "about.how.seatBody": r(
    "相手の席をリンクやQRコードで送るか、1台の端末をテーブル越しに回すか、段位のある{bots}人のコンピュータのひとりと遊びます。",
    "Send the other seat as a link or a QR code, pass one device across the table, or play one of the {bots} graded computers.",
  ),
  "about.how.play": r(
    "対局",
    "Play",
  ),
  "about.how.playBody": r(
    "自分のペースで交代して打ちます。対局は待ってくれ、自分を待つ対局が先頭に並びます。",
    "Take turns at my own pace. The game waits, and the games waiting for me are listed first.",
  ),
  "about.how.file": r(
    "棋譜",
    "Record",
  ),
  "about.how.fileBody": r(
    "終わった対局はすべて棋譜に入り、1手ずつ再生できます。",
    "Every finished game goes into the record, and can be replayed move by move.",
  ),
  "about.how.climb": r(
    "番付",
    "Climb",
  ),
  "about.how.climbBody": r(
    "レーティング対局はレーティングを動かし、終えた対局はすべて、次のレベルに向けた経験値になります。",
    "Rated games move my rating, and every game I finish earns experience toward the next level.",
  ),
  "about.how.stepsCaption": r(
    "ここでの対局を、最初から最後まで示しました。人との対局は同時に最大{limit}局まで、コンピュータとの対局は好きなだけ開けます。どれも利用量は計られません。",
    "A game here, from start to finish. Up to {limit} games can be open at once against people, and as many as I like against the computers. Nothing about any of it is metered.",
  ),
  "about.how.pageHead": r(
    "ページ",
    "Page",
  ),
  "about.how.forHead": r(
    "用途",
    "What it is for",
  ),
  "about.how.noInviteHead": r(
    "招待なしでは",
    "Without an invitation",
  ),
  "about.how.where": r(
    "ものの在りかです。ゲームについて読むのは誰にでも開かれていますが、遊んでいる人、その戦績、順位表は会員のためのものです。対局者のページには名前が載り、子どももいるからです。",
    "Where things are. Reading about the games is open to anybody, but the people who play them, their records and the ladders are for members, because a player's page carries their name and some of them are children.",
  ),
  "about.how.terms": r(
    "今の{site}",
    "{site} today",
  ),
  "about.how.stage": r(
    "段階",
    "Stage",
  ),
  "about.how.stageBody": r(
    "ベータ版。会員に公開されており、毎週変わっています",
    "Beta: open to members, and still changing every week",
  ),
  "about.how.price": r(
    "料金",
    "Price",
  ),
  "about.how.priceBody": r(
    "無料。有料の段階も広告もなく、手数の上限もありません",
    "Free. No paid tier, no advertisements, and no limit on moves",
  ),
  "about.how.gettingIn": r(
    "入り方",
    "How to get in",
  ),
  "about.how.gettingInBody": r(
    "招待コードで入れます。会員か私たちから受け取ります",
    "By an invitation code, from a member or from us",
  ),
  "about.how.games": r(
    "ゲーム",
    "Games",
  ),
  "about.how.gamesBody": r(
    "{games}で、すべて無料で遊べます",
    "{games}, all of them free to play",
  ),
  "about.how.open": r(
    "同時に開ける数",
    "Open at once",
  ),
  "about.how.openBody": r(
    "人との対局は最大{limit}局まで。プログラムとの対局には上限なし",
    "up to {limit} games against people; no limit against programs",
  ),
  "about.how.botsRow": r(
    "コンピュータ",
    "Computers",
  ),
  "about.how.botsRowBody": r(
    "段位のあるものが{bots}人で、お使いのブラウザの中で考えます",
    "{bots} graded ones, thinking inside your own browser",
  ),
  "about.how.termsCaption": r(
    "ご登録いただく内容です。ゲームの数と上限は、サイト自体から読み取っています。",
    "What you are signing up for. The number of games and the limits are read from the site itself.",
  ),
  "about.how.a": r(
    "{site}は、ボードゲームを、ゆっくりでも速くでも、知っている人とでも、誰もいないときはコンピュータとでも遊べる場所です。{games}のどのゲームも、同じ6つの段階をたどります。すべてが1つのエンジンと1組のページで動いているからです。",
    "{site} is a place to play board games, slowly or quickly, with people I know or, when nobody is around, with a computer. Every one of the {games} games follows the same six steps, because all of them run on one engine and one set of pages.",
  ),
  "about.how.b": r(
    "相手の席は、ほとんどのサイトと違う部分です。ロビーで対戦相手を探す必要はなく、メッセージのリンクや画面のQRコードで席を渡せば、それを開いた人が座ります。1台の端末をテーブル越しに回して遊ぶこともできます。これらのゲームの歴史の大半は、そうして遊ばれてきました。どちらの場合も対局は保存されるので、1手打ったらスマートフォンを置き、明日続きから取り上げられます。",
    "The other seat is the part that is different from most sites. I do not need to look for an opponent in a lobby. I hand over the seat as a link in a message or a QR code on my screen, and whoever opens it sits down. A game can also be played on one device passed across a table, which is how most of these games were played for most of their history. Either way the game is kept, so I can put my smartphone down after a move and pick it up tomorrow.",
  ),
  "about.how.c": r(
    "サイトは、ゲームは興味のある誰にでも開かれ、人は会員のためのものになるように作られています。アカウントがなくても、どのゲームの規則、系統、背景、戦略の手引きも読めます。対局者、その戦績、順位表には、招待が必要です。",
    "The site is laid out so that the games are open to anyone curious and the people are for members. Without an account I can read every game's rules, its family, its background and the strategy guides. The players, their records and the ladders need an invitation.",
  ),

  // In beta, free, and by invitation
  "about.beta.title": r(
    "ベータ版で、無料で、招待制",
    "In beta, free, and by invitation",
  ),
  "about.beta.a": r(
    "{site}はベータ版です。動いており、人が遊んでいますが、毎週変わるということでもあります。新しいゲームが加わり、規則が整理され、ページが移ります。費用はかからず、無料の段階の裏に有料の段階が控えているわけでもありません。このサイトの母体になったサイトは、手数の上限を外すために会員権を売っていましたが、ここには外す上限がありません。",
    "{site} is in beta. That means it works and people play on it, and also that it changes every week: new games are added, rules are tidied up, and pages move. It costs nothing, and there is no paid tier waiting behind the free one. The sites this one grew out of sold memberships to lift a limit on moves, but here there is no limit to lift.",
  ),
  "about.beta.b": r(
    "今のところ、入口は招待制です。そのため、作っている間はサイトが小さく保たれ、対局者のページは、招かれた人たちのあいだに限られます。ここで遊んでいる知り合いがいれば、その人にコードを頼んでください。いなければ、<ask>入会のページでコードを頼んで</ask>ください。名前、メールアドレス、遊ぶのが好きなゲームについての一言があれば十分です。または、{mail}にご連絡ください。",
    "For now the door is by invitation. That keeps the site small while it is being built, and keeps the players' pages among people who were invited in. If I know someone who plays here, I can ask them for a code. If I do not, I can ask for one on the join page, which needs only a name, an email address and a sentence about what I like to play, or write to {mail}.",
  ),
  "about.beta.c": r(
    "ベータ版のテスターも探しています。たくさんのゲームを遊び、変わったゲームも試し、おかしい、分かりにくい、足りないところを教えてくれる人です。規則がおかしく思えるゲーム、スマートフォンで遅いページ、ここにあればいいと思うゲームなど、どれも役に立ち、ゲームの名前と、期待していたことが分かれば、さらに助かります。コードを頼むときにテストしたいとお書きいただくか、同じアドレスにご連絡ください。",
    "We are also looking for beta testers: people who will play lots of games, try the unusual ones, and tell us when something is wrong, confusing or missing. A game whose rule seems off, a page that is slow on a smartphone, a game you wish were here: all of it is useful, and it helps even more with the name of the game and what you expected. When asking for a code, say that you want to test, or write to the same address.",
  ),

  // The page itself
  "about.page.title": r(
    "このサイトについて",
    "About this site",
  ),
  "about.page.description": r(
    "{site}の由来、ここでの対局の流れ、招待の受け方、図で見るゲーム、そして、そのすべてを貫く日本という糸を紹介します。",
    "Where {site} comes from, how a game here goes, how to get an invitation, the games in charts, and the Japanese thread running through all of it.",
  ),
  "about.page.lead": r(
    "ある家族が遊んだサイトと、千年前のゲームへの敬意です。",
    "A tribute to the sites a family played on, and to a game a thousand years old.",
  ),
  "about.page.tabs": r(
    "物語のどの部分を読むか",
    "Which part of the story to read",
  ),
};
