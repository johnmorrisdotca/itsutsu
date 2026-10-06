import { AGENT_READ_2026_10_06, type CopyReview, type JaLine } from "../copyJa.types";

/**
 * The families' words in Japanese, beside the English rows of
 * `src/lib/gomoku/families.data.ts`.
 *
 * A family's NAME is not here: like a game's, its Japanese name is the `kanji`
 * field on the English row (五目, 落とし, 反転と取り…), which a Japanese reader
 * is shown in place of the English title. What is here is the blurb under it,
 * and the reasons a game is also shelved on another family (`familyShelves.ts`),
 * which are sentences. Terms follow `docs/plans/en-ja-everywhere/TERMS.md`.
 */
export type FamilyCopyJa = {
  blurb: JaLine;
  review?: CopyReview;
  ask?: string;
};

/** By the family's `key`, the identity the XP ledger stores. */
export const FAMILY_COPY_JA: Record<string, FamilyCopyJa> = {
  "five-in-a-row": {
    blurb: [
      "定番の五目並べと、その競技形式です。まず五目並べから始めてください。ほかは、規則を少しずつ厳しくしたものです。",
      "The classic gomoku and its tournament forms. Start with gomoku; the others are that with the rules made a little stricter step by step.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  drops: {
    blurb: [
      "石は列のいちばん下まで落ちます。短時間で終わり、スマートフォンにも向いています。",
      "Stones fall to the bottom of their column. Games finish quickly and suit smartphones.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  flips: {
    blurb: [
      "終わるまで、石は誰のものとも決まりません。相手の色の石の並びを挟んでひっくり返すか、2つ組を盤から取ります。",
      "Until the end, no stone is anyone's for certain. You bracket a run of the other colour and turn it over, or take a pair off the board.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  "strange-boards": {
    blurb: [
      "ふつうとは違う動きをする盤です。つながる端、最初からある岩、途中で落ちてくる岩、順番に出てくる駒、そして回る区画があります。",
      "Boards that behave differently from the usual: edges that join, rocks there from the start, rocks that fall partway through, pieces that come out in order, and sections that turn.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  checkers: {
    blurb: [
      "列も、順番に出てくる駒も、石でいっぱいの盤もありません。相手の駒を飛び越えて取り除くか、自分が動かせる駒をなくすかの勝負です。",
      "There are no lines, no pieces coming out in order and no board full of stones. It comes down to jumping over the other side's pieces and removing them, or being left with no piece that can move.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  territory: {
    blurb: [
      "列を作る必要はありません。終わったときにどこに立っているかで勝負が決まります。相手より広く盤を囲むか、自分の二辺をつなぐか、相手より先にすべての駒を向かい側の陣に入れます。",
      "There are no lines to make. The game is decided by where you stand when it ends: surround more of the board than the other side, connect your own two sides, or get all your pieces into the far camp before the other side does.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  "small-boards": {
    blurb: [
      "最後まで読み切れるゲームと、してはいけないことが鍵になるゲームです。",
      "Games you can read through to the end, and games where the key is what you must not do.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  numbers: {
    blurb: [
      "1人で解くパズルです。盤面と、いくつかの手がかりから、答えを導きます。時計と競って、自分の力で解きます。",
      "Puzzles solved alone. From a board and a few clues you work out the answer. You solve it by yourself, against the clock.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  logic: {
    blurb: [
      "1人で筋道を立てて解くパズルです。橋、パイプ、絵、石、ビー玉、麻雀牌、そして回して揃えるキューブがあります。",
      "Puzzles solved alone by reasoning. There are bridges, pipes, pictures, stones, marbles, mahjong tiles and a cube to turn and match.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  pencil: {
    blurb: [
      "鉛筆で解く、1人用のパズルです。盤を長方形に切り分け、すべてのマスを照らし、1本の輪を描き、重なる数字を塗りつぶし、列の合計を求め、区画に数字を入れ、地雷を片づけます。",
      "Puzzles for one, worked out with a pencil. Cut the grid into rectangles, light every square, draw a single loop, shade the repeated numbers, work out the sums of runs, put numbers in the regions and clear the mines.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  cards: {
    blurb: [
      "このサイト独自の絵柄のトランプで遊ぶゲームです。1人用のソリティア、フリーセル、スパイダーと、1台の端末を囲んで遊ぶ家族向けのカードゲームがあり、空いた席にはコンピュータが入ります。",
      "Games played with a deck of playing cards in this site's own design. There are the one-player Solitaire, FreeCell and Spider, and family card games played round one device, where a computer takes any empty seat.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  "table-cards": {
    blurb: [
      "テーブルを囲んで1枚ずつ出して遊ぶカードゲームで、空いた席にはコンピュータが入ります。ハートを1枚も取らないようにするもの、取る手数を宣言するもの、クリベッジで121点まで進むもの、戦争（War）でカードをめくるもの、Hitotsu（一つ）で色か数字を合わせて先に手札をなくすものがあります。",
      "Card games for a table, played one card at a time, where a computer takes any empty seat. There is one where you try to take none of the hearts, one where you declare how many tricks you will take, one where you peg up to 121 in cribbage, one where you turn over cards in War, and one where you match the colour or number to be first out of cards in Hitotsu (一つ).",
    ],
    review: AGENT_READ_2026_10_06,
    ask: "Card-game terms (cribbage, War, hearts) are standard katakana and kanji names, but a native card player should confirm them.",
  },
  tables: {
    blurb: [
      "バックギャモンと、その盤で遊ぶゲームです。15個のチェッカーをゴールまで走らせ、相手の1個だけのチェッカーを叩き、試合ではダブリングキューブを使います。ほかに、4個のチェッカーを後ろに置いて始めるもの、すべて1つの点に置いて始めるもの、各自3個で遊ぶもの、バーから始めるもの、負けを競うもの、サイコロ3個で遊ぶローマ式があります。",
      "Backgammon and the games played on its board. You race fifteen checkers home, hit the other side's lone checkers, and use the doubling cube in a match. There are also games that start with four checkers back, with all the checkers on one point, with three each, or off the bar, a game played to lose, and the Roman game with three dice.",
    ],
    review: AGENT_READ_2026_10_06,
    ask: "Backgammon terms (blot, bar, doubling cube) were written from the usual Japanese backgammon words; a backgammon player should confirm them.",
  },
  party: {
    blurb: [
      "1台のスマートフォンやタブレットを囲んで遊ぶ、みんな向けのゲームです。自分の番が終わったら次の人へ回します。箱を埋める、種をまく、世界を征服する、サイコロで最高点を競う、出た目で駒をゴールまで進める、隣の人から自分の軍を隠す、といったゲームがあります。",
      "Games for a group, played round one smartphone or tablet. When your turn is over you pass it to the next person. There are games of filling in boxes, sowing seeds, conquering the world, rolling dice for the highest score, moving pawns home by what the dice show, and hiding your army from the player beside you.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  "word-games": {
    blurb: [
      "文字でできたゲームです。6回の推測で隠れた言葉を当てるもの（英語、フランス語、ドイツ語、かな）、手持ちのタイルでクロスワードを組むもの、6つの言葉を格子に入れ替えるもの、完成させないように文字を足していくものがあります。",
      "Games made of letters. There is one where you find a hidden word in six guesses (in English, French, German or kana), one where you build a crossword from your own tiles, one where you swap six words into a lattice, and one where you add letters to a word without finishing it.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  karakuri: {
    blurb: [
      "指1本で遊ぶ小さなゲームで、1つの面は1、2分で終わります。ブロックを抜き出す、色を注ぎ分ける、板のネジを外す、正しい順でピンを抜く、正しい縄を切る、避難所を描く、腕を杭の周りに伸ばす、仕事に合う道具を選ぶ、といった遊びがあります。1人で遊び、レーティングはなく、登録も要りません。",
      "Small games played with one finger, each level taking a minute or two. There are games of sliding a block out, pouring colours apart, unscrewing plates, pulling pins in the right order, cutting the right rope, drawing a shelter, stretching an arm round pegs, and choosing the right tool for the job. You play alone, nothing is rated, and there is nothing to sign up for.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  houseki: {
    blurb: [
      "1人で遊ぶ宝石と石のパズルで、1回に1レベルずつ進めます。3つ並んだ宝石の列を落として色を入れ替える、2つ組を回して連鎖を作る、同じ色の石のかたまりを取る、隣り合う宝石を入れ替える、引き寄せる床の上にブロックを置く、といった遊びがあります。どれも難しさ順のレベルが50から100あり、レッスンと毎日の1局（Daily）もあります。レベルをクリアするとポイントがもらえます。",
      "Gem and stone puzzles for one, a level at a time. Cycle a falling column of three, turn a pair into chains, take groups of stones, swap neighbours, or set a magnetic block down on a floor that pulls. Fifty to a hundred graded levels in each, with lessons and a Daily, played alone. A level won earns points.",
    ],
    ask: "Drafted by the builder, not yet read by the Japanese reviewer; the names ストーンコラプス and ジェムスワップ are the package demo's own.",
  },
};

/**
 * Why a game is also shelved on another family, in Japanese, by
 * `<game>/<family key>`: the sentences of `ALSO_LISTED_IN` in `familyShelves.ts`.
 */
export const ALSO_LISTED_COPY_JA: Record<string, { why: JaLine; review?: CopyReview }> = {
  "tobiishi/small-boards": {
    why: [
      "小さな盤でのペグソリティア。1人用のパズルで、最初の1個から最後の1個まで数回の跳びで、1、2分で終わります。",
      "Peg solitaire on a small board. A puzzle for one that takes a few jumps from the first peg to the last, over in a minute or two.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  "chineseCheckers/checkers": {
    why: [
      "名前がチェッカーというだけです。駒は取られず、キングにもなりません。10個の駒を星の向かい側の頂点へ走らせる競走です。",
      "It is checkers in name only. No piece is captured and none is crowned. It is a race to bring your ten pieces to the opposite point of the star.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  "chineseCheckers/party": {
    why: [
      "最大6人で回して遊べます。2人、3人、4人、6人が1台の端末を囲み、それぞれ10個の駒を星の向こうへ走らせます。",
      "Pass and play for up to six. Two, three, four or six players gather round one device, each racing their ten pieces across the star.",
    ],
    review: AGENT_READ_2026_10_06,
  },
};
