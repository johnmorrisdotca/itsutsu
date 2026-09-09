import type { CountryCode } from "../learn/origins";
import type { RuleVariant } from "./gomoku.types";

/**
 * What a player is told about each rule set. `tagline` fits under a select;
 * `rules` is the full explanation the game browser shows, one bullet each.
 */
export type VariantCopy = {
  label: string;
  /** The name in its own script: kanji, hangul, or Vietnamese. */
  kanji: string;
  tagline: string;
  origin: string;
  /**
   * The game this one is our version of, when it is a clone of a game sold or
   * published under another name. Absent for the traditional games and for
   * our own inventions. The name belongs to its owner; see RULES_ATTRIBUTION.
   */
  inspiredBy?: string;
  /**
   * Other names this game is really sold, published or played under, for the
   * player who arrives knowing one of them and not ours.
   *
   * Only names a source could be shown for: a game's own history, or a box it
   * was sold in. The names the play-by-mail sites used are not repeated here —
   * they are already in `lib/legacy/gameAliases.ts`, and the rules page shows
   * both lists as one. Absent where a game is our own invention, or where its
   * name is simply its name.
   */
  alsoKnownAs?: readonly string[];
  /**
   * The country the game is from, as an ISO 3166-1 alpha-2 code, when it has
   * one a source could be shown for. Our own inventions and our own variants
   * have none: there is no country that Ring Drop is from.
   */
  country?: CountryCode;
  /**
   * The English Wikipedia article that explains this game, by title, so the
   * page can be checked against something outside this site. Some are
   * redirects on purpose — Ninuki-renju leads to Pente, which is the article
   * that explains the family. Every one was checked against the API before it
   * was written here; see `origins.ts`.
   */
  wikipedia?: string;
  rules: readonly string[];
  /** Board advice, e.g. the size the game is traditionally played on. */
  board: string;
};

export const RULE_VARIANT_DISPLAY: Record<RuleVariant, VariantCopy> = {
  freestyle: {
    label: "Gomoku",
    kanji: "五目並べ",
    tagline: "Five or more in a row wins.",
    origin: "The game as it is played everywhere, with no restrictions at all: the plain name belongs to the plain game, and the others are this one with a rule tightened.",
    // The Chinese name was the gap here: the entry gave the game's Japanese
    // and British names and not the one used where most of its players are.
    // "Go-Moku" is gone because it never reached the page — it folds to the
    // same key as our own label and was dropped before printing.
    alsoKnownAs: ["Five in a Row", "Gobang", "Gomoku Narabe", "Wuziqi", "五子棋", "Spoil Five"],
    country: "JP",
    wikipedia: "Gomoku",
    rules: [
      "Players take turns placing one stone on any empty intersection.",
      "The first to line up five or more of their own stones, in any direction, wins.",
      "An overline of six or more counts as a win.",
      "Either colour may open, or the first stone can be drawn by lot.",
    ],
    board: "Any size. Black has a proven forced win on 15×15 with perfect play, so stronger players give the first stone away or pick an opening protocol.",
  },
  standard: {
    label: "Tournament Gomoku",
    kanji: "競技五目",
    tagline: "Exactly five wins. Six or more does not.",
    origin: "The tournament form of Gomoku, as played at Gomocup: the plain game with the overline taken away.",
    alsoKnownAs: ["Standard Gomoku"],
    country: "JP",
    wikipedia: "Gomoku",
    rules: [
      "Players take turns placing one stone.",
      "Exactly five in a row wins. An overline (長連) of six or more is not a win — play simply continues.",
      "Black always opens.",
      "Nothing else is forbidden: a double three or a double four is legal for both sides.",
    ],
    board: "15×15 is the tournament size.",
  },
  renju: {
    label: "Renju",
    kanji: "連珠",
    tagline: "Black may not make a double three, a double four or an overline. White may.",
    origin: "The Japanese tournament game, codified by the Renju International Federation.",
    country: "JP",
    wikipedia: "Renju",
    rules: [
      "Black opens. Black wins with exactly five; white wins with five or more.",
      "Black may not play a stone that makes two open threes at once (三三), two fours at once (四四), or six or more in a row (長連). Those points are marked on the board and cannot be played.",
      "A five made at the same moment as a forbidden shape still wins for black.",
      "A three only counts if the point that would turn it into an open four is itself allowed. The engine reads that ahead, so the marks are exact.",
      "White has no restrictions of any kind.",
    ],
    board: "15×15. Choose the RIF opening to play the classic restricted start with a colour swap.",
  },
  omok: {
    label: "Omok",
    kanji: "오목",
    tagline: "The double three is forbidden for both sides. Overlines win.",
    origin: "The Korean game, played on a 15×15 or 19×19 board.",
    country: "KR",
    wikipedia: "Gomoku",
    rules: [
      "Players take turns placing one stone. Black opens.",
      "Neither player may make two open threes with one stone (삼삼). Those points are marked and cannot be played.",
      "Five or more in a row wins for either side, so an overline counts.",
      "Double fours are allowed.",
    ],
    board: "15×15 or 19×19.",
  },
  caro: {
    label: "Caro",
    kanji: "Cờ ca-rô",
    tagline: "Exactly five wins, and only if it is not shut in at both ends.",
    origin: "The Vietnamese game, traditionally played on squared paper.",
    alsoKnownAs: ["Gomoku+"],
    country: "VN",
    rules: [
      "Players take turns placing one stone. Black opens.",
      "Exactly five in a row wins. An overline does not.",
      "A five with an opponent's stone at both ends does not win (chặn hai đầu). The edge of the board is not a block.",
      "No shape is forbidden for either side.",
    ],
    board: "Any size; the larger the board, the more room to block.",
  },
  ninuki: {
    label: "Ninuki-renju",
    kanji: "二抜き連珠",
    tagline: "Five in a row wins. So does capturing five pairs.",
    origin: "The Japanese capture game, and the ancestor of the boxed capture games sold in the West.",
    country: "JP",
    wikipedia: "Pente",
    rules: [
      "Players take turns placing one stone.",
      "Flank exactly two enemy stones in a line, with your own stone at each end, and the pair is captured and removed. Only the stone that closes the trap captures — moving into a flanked position is safe.",
      "Five or more in a row wins. Capturing five pairs also wins.",
      "Captured points are open again, so a broken line can be rebuilt and a five can be prevented by taking a stone out of it first.",
    ],
    board: "Traditionally a 19×19 go board. Pair it with the Pro opening for the tournament form.",
  },
  sannuki: {
    label: "Sannuki-renju",
    kanji: "三抜き連珠",
    tagline: "The capture game where a flank takes a pair or a triple. Fifteen stones win.",
    inspiredBy: "Keryo-Pente",
    origin: "Our name for the three-removal form of the capture game, played in the West as a tournament variant since the 1980s.",
    country: "US",
    wikipedia: "Pente",
    rules: [
      "Players take turns placing one stone.",
      "Flank exactly two or exactly three enemy stones in a line, with your own stone at each end, and they are captured. Only the closing stone captures.",
      "Five or more in a row wins. Capturing fifteen stones also wins.",
      "A four can be broken by capturing out of it, and a captured point is open again.",
    ],
    board: "19×19 traditionally; 15×15 for a shorter game.",
  },
  misereFive: {
    label: "Misère Five",
    kanji: "負け五目",
    tagline: "Five in a row loses. Make your opponent complete it.",
    origin: "The traditional losing form of gomoku.",
    alsoKnownAs: ["Misère Gomoku", "Reverse Gomoku"],
    rules: [
      "Players take turns placing one stone. Either colour may open.",
      "A player who makes five or more in a row loses.",
      "If the board fills with no five, the player who opened wins.",
      "Every stone you place is one fewer safe point later. The game is about counting them.",
    ],
    board: "9×9 is sharp; 15×15 is a long, slow squeeze.",
  },
  makerBreaker: {
    label: "Maker and Breaker",
    kanji: "作り手と壊し手",
    tagline: "Both players place either colour. One wants a five, the other wants none.",
    inspiredBy: "Order and Chaos",
    origin: "Our name for the classic order-versus-chaos game published in 1981, which mathematicians call a maker-breaker game.",
    country: "US",
    wikipedia: "Order and Chaos",
    rules: [
      "The first player is the Maker and wants five in a row of either colour, anywhere. The second is the Breaker and wants the board to fill with no five.",
      "Each turn you place one stone of whichever colour you like.",
      "A five of either colour, whoever placed the last stone of it, is a win for the Maker.",
      "A full board with no five is a win for the Breaker.",
    ],
    board: "6×6.",
  },
  wildTicTacToe: {
    label: "Wild Tic-tac-toe",
    kanji: "自由三目",
    tagline: "Place either mark. Three in a row of either wins for whoever makes it.",
    origin: "The traditional wild form of tic-tac-toe.",
    rules: [
      "Each turn you place one stone of either colour.",
      "Whoever completes three in a row, of either colour, wins.",
      "A full board with no three is a draw.",
    ],
    board: "3×3.",
  },
  notakto: {
    label: "Notakto",
    kanji: "黒だけ三目",
    tagline: "Only black stones. Whoever makes three in a row loses.",
    origin: "The traditional all-X misère form of tic-tac-toe, on one board.",
    alsoKnownAs: ["No-Tac-Toe", "Neutral Tic-tac-toe"],
    country: "US",
    wikipedia: "Notakto",
    rules: [
      "Every stone is black, whoever places it.",
      "A player who completes three in a row loses.",
      "The full game is played across several boards at once; this is the single-board form.",
    ],
    board: "3×3.",
  },
  connect6: {
    label: "Connect6",
    kanji: "六子棋",
    tagline: "Two stones a turn. Six in a row wins.",
    origin: "Devised by I-Chen Wu in 2003 and played at the Computer Olympiad.",
    alsoKnownAs: ["Liuziqi", "六子棋"],
    country: "TW",
    wikipedia: "Connect6",
    rules: [
      "Black opens with a single stone. From then on each player places two stones per turn.",
      "Six or more in a row wins.",
      "Nothing is forbidden and there is no swap: placing two stones a turn is what balances the first move.",
      "A line of four with both ends open is already unstoppable, so threats arrive faster than in gomoku.",
    ],
    board: "19×19 is the standard board. 15×15 gives a shorter game.",
  },
  toroidalFive: {
    label: "Toroidal Five",
    kanji: "輪王五目",
    tagline: "Five in a row on a board with no edges: every side joins its opposite.",
    origin:
      "Our own game. Gomoku wrapped onto a torus, so the board has a middle everywhere and a corner nowhere.",
    rules: [
      "Five in a row wins, as in freestyle.",
      "The left and right edges join, and so do the top and bottom: a line running off one side continues from the other.",
      "Every intersection is therefore a centre intersection. There are no corners to hide in and no edge to shut a line against.",
      "A line still has to be five distinct stones — a run cannot wrap the whole way round and meet itself.",
    ],
    board: "15×15 by default. A smaller board makes the wrapping easier to see.",
  },
  obstacleFive: {
    label: "Obstacle Five",
    kanji: "石場五目",
    tagline: "Five in a row across a board scattered with dead squares and hotspots.",
    origin:
      "Our own game. The dead squares and hotspots of the drop family, on a board where stones stay where they are put.",
    rules: [
      "Five in a row wins.",
      "Six squares are dead: no stone may be played there, and no line runs through them.",
      "Two squares are hotspots, which count as a stone of either colour. A line may run through one.",
      "Because a hotspot serves both sides, a stone that completes the other colour's five through one loses on the spot.",
      "The squares are drawn from the game's seed, so both players see the same board and a replay lands them in the same places.",
    ],
    board: "15×15 by default; the same eight squares are scattered whatever the size.",
  },
  dropFour: {
    label: "Drop Four",
    kanji: "落とし四目",
    tagline: "Stones fall to the bottom of their column. Four in a row wins.",
    inspiredBy: "Connect Four",
    origin: "Our version of the upright four-in-a-row game, with a magnet under the board instead of a frame.",
    country: "US",
    wikipedia: "Connect Four",
    rules: [
      "Play anywhere in a column and the stone slides to the lowest empty point in it, as if the board were upright and the stones magnetic.",
      "Four in a row, in any direction, wins.",
      "A full board with no four is a draw.",
      "Either colour may open.",
    ],
    board: "7×7 is the classic feel. 9×9 gives a longer game.",
  },
  dominoFive: {
    label: "Domino Five",
    kanji: "二連五目",
    tagline: "Gomoku with dominoes: every piece is two stones, and not always yours.",
    origin: "Our own game. Both players draw the same random run of dominoes and can see what is coming.",
    rules: [
      "Each turn you must lay the next domino in the queue: two stones side by side, black-black, white-white, black-white or white-black. Turn it any way you like.",
      "Both players draw from the same queue, so your fifth piece is your opponent's fifth piece. The next three are shown to both.",
      "Five in a row wins for its colour, whoever laid the stones. A domino that completes both colours at once is a draw.",
      "If no domino fits anywhere, the turn passes; two passes in a row end the game as a draw.",
    ],
    board: "15×15 by default; 13×13 for a sharper game, 19×19 for a long one.",
  },
  blockFive: {
    label: "Block Five",
    kanji: "積み五目",
    tagline: "Gomoku with falling-block pieces: four stones each, two of each colour.",
    inspiredBy: "the seven tetromino shapes",
    origin: "Our own game. The seven four-square shapes, coloured two and two, in a queue both players share.",
    rules: [
      "Each turn you lay the next piece in the queue: one of the seven four-square shapes, holding two black and two white stones. Rotate or flip it as you like.",
      "Both players draw from the same queue, and the next three pieces are shown to both, as in a two-player falling-block match.",
      "Instead of a piece you may lay a single stone of your own colour to fill a gap. Each player has six singles for the whole game.",
      "Five in a row wins for its colour, whoever laid it. Both colours at once is a draw. If nothing fits and no singles remain, the turn passes; two passes in a row is a draw.",
    ],
    board: "15×15 by default; 19×19 gives the shapes room.",
  },
  ringDrop: {
    label: "Ring Drop",
    kanji: "輪落とし",
    tagline: "Drop Four on a cylinder: the left and right edges join.",
    inspiredBy: "Connect Four",
    origin: "Our version of the cylindrical four-in-a-row variant.",
    rules: [
      "Stones fall to the bottom of their column, as in Drop Four.",
      "The left edge joins the right, so a line may run off one side and continue on the other.",
      "Four in a row wins.",
    ],
    board: "7×7 or 9×9.",
  },
  holeDrop: {
    label: "Hole Drop",
    kanji: "穴落とし",
    tagline: "One square is dead: nothing can land on it or count through it.",
    inspiredBy: "Connect Four",
    origin: "Our version of the dead-square four-in-a-row variant.",
    rules: [
      "Stones fall to the bottom of their column.",
      "One square, chosen at random when the game starts, is a hole. Nothing can rest on it, a falling stone drops past it, and no line runs through it.",
      "Four in a row wins.",
    ],
    board: "7×7 or 9×9. The hole is never on the bottom row.",
  },
  hotDrop: {
    label: "Hot Drop",
    kanji: "熱点落とし",
    tagline: "A hotspot counts as either colour, and a hole counts as nothing.",
    inspiredBy: "Connect Four",
    origin: "Our version of the double-trouble four-in-a-row variant.",
    rules: [
      "Stones fall to the bottom of their column.",
      "One random square is a hotspot: it is a stone of whichever colour is counting, so it can finish your line or your opponent's.",
      "One random square is a hole that nothing can land on.",
      "Four in a row wins. A stone that completes your opponent's four through the hotspot loses.",
    ],
    board: "7×7 or 9×9.",
  },
  clearDrop: {
    label: "Clear Drop",
    kanji: "消し落とし",
    tagline: "A full bottom row vanishes and everything drops a row.",
    inspiredBy: "Connect Four",
    origin: "Our version of the row-clearing four-in-a-row variant, borrowing the falling-block game's rule.",
    rules: [
      "Stones fall to the bottom of their column.",
      "When the bottom row fills, it disappears and every stone above it drops one row. The game goes on.",
      "Four in a row wins, and a four made by the stone that fills the row wins before the row clears.",
    ],
    board: "7×7 or 9×9.",
  },
  giveawayDrop: {
    label: "Giveaway Drop",
    kanji: "譲り落とし",
    tagline: "Making four loses. Force your opponent into it.",
    inspiredBy: "Connect Four",
    origin: "Our version of the giveaway four-in-a-row variant.",
    rules: [
      "Stones fall to the bottom of their column.",
      "A player who makes four in a row loses.",
      "You may not play directly on top of your opponent's last stone while any other column has room.",
      "If the board fills with no four, the player who opened wins.",
    ],
    board: "7×7 or 9×9.",
  },
  wormDrop: {
    label: "Wormhole Drop",
    kanji: "穴通し落とし",
    tagline: "Two squares are joined: a line entering one comes out of the other.",
    inspiredBy: "Connect Four",
    origin: "Our version of the wormhole four-in-a-row variant.",
    rules: [
      "Stones fall to the bottom of their column.",
      "Two random squares are the mouths of a wormhole. Nothing can land on them, and a line that runs into one continues from the square beyond the other. The mouths themselves do not count.",
      "Four in a row wins, through the wormhole or not.",
    ],
    board: "7×7, 9×9 or 10×10.",
  },
  edgeDrop: {
    label: "Edge Drop",
    kanji: "縁寄せ",
    tagline: "Gravity from all four edges: a stone must rest on something.",
    inspiredBy: "Connect Four",
    origin: "Our version of the four-edge gravity variant.",
    rules: [
      "A stone may be placed on any edge of the board, or beside a stone that is already there — above, below, left or right. Nothing floats.",
      "Four in a row wins.",
      "The board fills from the outside in, so the centre is the last ground to take.",
    ],
    board: "7×7 or 9×9.",
  },
  twistFive: {
    label: "Twist Five",
    kanji: "回し五目",
    tagline: "Place a stone, then turn one quarter of the board. Five wins.",
    inspiredBy: "Pentago",
    origin: "Our version of the quadrant-rotation game, on four 3×3 quadrants.",
    rules: [
      "A move is two parts: place a stone anywhere, then turn any one of the four 3×3 quadrants a quarter, either way.",
      "Five in a row, anywhere on the board and for either colour, ends the game after the turn. Five made by placing alone wins at once.",
      "If the turn makes five for both colours, the game is a draw.",
      "A full board with no five, after its last turn, is a draw.",
    ],
    board: "6×6, divided into four quadrants.",
  },
  twistFour: {
    label: "Twist Four",
    kanji: "回し四目",
    tagline: "The small twist game: four 2×2 quadrants, four in a row.",
    inspiredBy: "Pentago",
    origin: "Our own smaller board for the rotation mechanic.",
    rules: [
      "Place a stone, then turn any one of the four 2×2 quadrants a quarter.",
      "Four in a row, anywhere and for either colour, wins after the turn.",
      "Five for both at once is a draw, and so is a full board.",
    ],
    board: "4×4. Fast and surprisingly sharp.",
  },
  trapThree: {
    label: "Trap Three",
    kanji: "罠三",
    tagline: "Four in a row wins. Three in a row loses.",
    inspiredBy: "Squava",
    origin: "Our version of the four-wins-three-loses game on a square board.",
    rules: [
      "Players take turns placing one stone. Either colour may open.",
      "Four in a row, in any direction, wins.",
      "Making exactly three of your own in a row loses on the spot, unless the same stone makes four.",
      "The board is small, so every stone narrows what you can safely play next.",
    ],
    board: "5×5.",
  },
  squareFour: {
    label: "Square Four",
    kanji: "四角四目",
    tagline: "Four pieces each. Line them up, or make a square.",
    inspiredBy: "Teeko",
    origin: "Our version of the place-then-slide game with a square as a second way to win.",
    rules: [
      "Each player has four pieces. First they are placed, one a turn; then a turn moves one of your pieces one step to an adjacent empty point, in any direction.",
      "Four in a row, in any direction, wins. So does four of your pieces in a 2×2 square.",
      "Both ways to win count during the placing phase as well.",
      "Pick a piece to move, then the point it goes to.",
    ],
    board: "5×5.",
  },
  tictactoe: {
    label: "Tic-tac-toe",
    kanji: "三目並べ",
    tagline: "Three in a row on a 3×3 board.",
    origin: "The one everybody knows.",
    alsoKnownAs: ["Noughts and Crosses", "Xs and Os", "Tick-tack-toe"],
    wikipedia: "Tic-tac-toe",
    rules: [
      "Players take turns placing one stone.",
      "Three in a row, in any direction, wins.",
      "With sound play it is always a draw, which is the whole lesson of the game.",
    ],
    board: "3×3.",
  },
  reversi: {
    label: "Reversi",
    kanji: "リバーシ",
    tagline: "Bracket a run of the other colour and it turns. Most discs at the end wins.",
    origin: "The flipping game as the world plays it now: the fixed centre, the forced pass, the count. Japan set the rules down in 1973.",
    inspiredBy: "Othello",
    country: "GB",
    wikipedia: "Reversi",
    rules: [
      "The centre starts with two discs of each colour on the diagonals.",
      "A disc goes only where it brackets one or more of the other colour in a straight run, with one of your own at the far end. Every bracketed run turns.",
      "A colour with nowhere to go passes; the turn stays with the other colour until both are stuck.",
      "When neither can move, the discs are counted. More wins; equal is a draw.",
    ],
    board: "8×8. The corners cannot be turned once taken, which is most of the strategy.",
  },
  classicReversi: {
    label: "Classic Reversi",
    kanji: "古式リバーシ",
    tagline: "The 1880s rule: the players lay the first four discs themselves. Any flipping game here can be set up either way.",
    origin: "The English parlour game before the fixed opening: the centre four were placed by the players, in turn, so two openings were possible.",
    country: "GB",
    wikipedia: "Reversi",
    rules: [
      "The board starts empty. The first four discs are laid in the centre four squares, one a turn, without turning anything.",
      "From the fifth disc on, a disc goes only where it brackets a run of the other colour, which turns.",
      "A colour with nowhere to go passes.",
      "When neither can move, the discs are counted. More wins; equal is a draw.",
    ],
    board: "8×8. Laying the centre yourself allows the parallel opening the fixed rule rules out.",
  },
  antiReversi: {
    label: "Anti-Reversi",
    kanji: "逆リバーシ",
    tagline: "Everything turns as usual, but the fewer discs wins.",
    origin: "The giveaway form. Every rule is the same; the object is upside down, so the corners become the last thing you want.",
    rules: [
      "The centre starts with two discs of each colour on the diagonals.",
      "A disc goes only where it brackets a run of the other colour, which turns. You may not decline a move that is available.",
      "A colour with nowhere to go passes.",
      "When neither can move, the discs are counted. Fewer wins; equal is a draw.",
    ],
    board: "8×8. Giving the other side discs is the whole game; a corner is a liability.",
  },
  miniReversi: {
    label: "Mini Reversi",
    kanji: "小リバーシ",
    tagline: "The flipping game on a 4×4 or 6×6 board, which can grow to 8×8 mid-game.",
    origin: "The small boards the game is taught and studied on. 6×6 has been solved — a second-player win — which is no help at all over a real board.",
    rules: [
      "The centre starts with two discs of each colour on the diagonals.",
      "A disc goes only where it brackets a run of the other colour, which turns.",
      "A colour with nowhere to go passes.",
      "When neither can move, the discs are counted. More wins; equal is a draw.",
      "If the board feels small, both players may agree to grow it: the position moves to the centre of the next size up and play goes on.",
    ],
    board: "4×4, 6×6 or 8×8, and the smaller boards can grow.",
  },
  grandReversi: {
    label: "Grand Reversi",
    kanji: "大リバーシ",
    tagline: "The flipping game on a 10×10 board: a longer game, with more middle to fight over before anyone reaches an edge.",
    origin: "The big board the play-by-mail sites kept beside the usual one — ItsYourTurn called it Flipversi 10×10. The same rules, thirty-six more squares, and the corners farther from everything.",
    inspiredBy: "Othello",
    rules: [
      "The centre starts with two discs of each colour on the diagonals, as on the small board.",
      "A disc goes only where it brackets one or more of the other colour in a straight run, with one of your own at the far end. Every bracketed run turns.",
      "A colour with nowhere to go passes; the turn stays with the other colour until both are stuck.",
      "When neither can move, the discs are counted. More wins; equal is a draw.",
    ],
    board: "10×10, and only that. Ninety-six discs go down instead of sixty, and the edges are two squares farther from the centre, so the opening runs long before either side touches one.",
  },
  halma: {
    label: "Halma",
    kanji: "ハルマ",
    tagline: "A race across the board: step, or jump chains over any piece, and fill the far corner first.",
    origin: "Invented in Boston in 1883 by George Howard Monks, a surgeon, and named from the Greek for a jump. The play-by-mail sites kept it beside the line games; the family played it on ItsYourTurn.",
    country: "US",
    wikipedia: "Halma",
    rules: [
      "Each side starts with its pieces filling a camp in one corner: nineteen on the 16×16 board, thirteen on 10×10, ten on 8×8.",
      "A move is one piece, either a step to a neighbouring empty square in any direction, or a jump over an adjacent piece of either colour into the empty square beyond. A jump may go on jumping in the same move as long as there is a piece to cross.",
      "Nothing is ever captured. A piece jumped over stays where it is.",
      "The first side to fill the far camp wins. A side that stays at home to block loses anyway once every other square in the camp is taken.",
    ],
    board: "16×16 is Halma as published, with nineteen pieces a side; 10×10 and 8×8 are the quick boards, with thirteen and ten. Played in the squares, like Reversi.",
  },
  hex: {
    label: "Hex",
    kanji: "ヘックス",
    tagline: "Join your own two sides of the board with an unbroken chain. A draw is impossible.",
    origin: "Found twice: by Piet Hein in Copenhagen in 1942, and again by John Nash at Princeton in 1948, who is said to have proved that the first player wins with perfect play without anyone finding out how. The proof that it cannot end in a draw is the same argument.",
    alsoKnownAs: ["Nash", "John", "Con-tac-tix", "Polygon"],
    country: "DK",
    wikipedia: "Hex (board game)",
    rules: [
      "The board is a rhombus of hexagons; each one touches six others. Black owns the top and bottom sides, White the left and right.",
      "Players take turns placing one stone on any empty cell. Nothing ever moves, and nothing is ever taken.",
      "The first to join their own two sides with an unbroken chain of their stones wins.",
      "A full board always has exactly one winner, so there are no draws: the two chains cannot both cross, and they cannot both fail.",
      "Black has the advantage of the first stone, so the swap opening is offered: White may take Black's opening move as their own instead of answering it.",
    ],
    board: "11×11 is the usual size, and the one the world championship uses; 13×13 and 19×19 are played too. The corners belong to both of their sides.",
  },
  checkers: {
    label: "Checkers",
    kanji: "チェッカー",
    tagline: "Jump the other side's pieces off the board. Capturing is forced, and a king moves both ways.",
    origin: "Descended from alquerque, a jumping-capture game played around the Mediterranean and the Middle East for centuries; a French rule-maker is said to have set it on a chessboard and added the forced capture around 1100. The English form the site plays here was written down in the 18th century and crossed the Atlantic largely unchanged, as American checkers.",
    alsoKnownAs: ["Draughts", "English Draughts", "American Checkers"],
    country: "GB",
    wikipedia: "English draughts",
    rules: [
      "Each side has twelve men, filling the dark squares of its own three rows. Black moves first.",
      "A man moves one square diagonally forward, onto an empty square.",
      "Capturing is a jump over an adjacent enemy piece into the empty square beyond, and it is forced: if any of your pieces can capture, you must play one of those captures rather than a step.",
      "A piece that captures and can capture again from where it lands keeps jumping in the same move. A man crowned partway through always stops there — only a king may carry a chain on, and only on a later move.",
      "A man reaching the far row is crowned a king, and may then move and capture backward as well as forward.",
      "The game is won by leaving the other side with no piece that can move: no pieces left, or every one shut in.",
    ],
    board: "8×8, played on the dark squares only — thirty-two of the sixty-four. Twelve pieces a side, filling the first three rows.",
  },
  chineseCheckers: {
    label: "Chinese Checkers",
    kanji: "ダイヤモンドゲーム",
    tagline: "Fill the point of the star directly opposite yours, one step or jump-chain at a time.",
    origin: "Invented in Germany in 1892 as Stern-Halma — \"star Halma\" — a six-pointed board built for the American game Halma, itself only nine years old. An American toy company sold it from 1928 under the name it is known by now, Chinese Checkers, though the game has no connection to China at all: the name was chosen to sound exotic to buyers.",
    alsoKnownAs: ["Stern-Halma", "Hoppers", "Diamond Game"],
    country: "DE",
    wikipedia: "Chinese checkers",
    rules: [
      "Each side has ten pieces, filling one point of the star at the start: black at the top, white at the bottom.",
      "A move is one piece: a step to a neighbouring empty cell, or a jump over an adjacent piece of either colour into the empty cell straight beyond it. A jump may go on jumping in the same move, turning corners, as long as each jump crosses a piece.",
      "Nothing is ever captured. A piece jumped over stays exactly where it is.",
      "The first side to fill the point directly opposite its own wins.",
    ],
    board: "The standard 121-hole star board, ten pieces a side, playing point to point straight across it. The full board seats up to six; this site plays the two-player form, the two points furthest apart.",
  },
  go: {
    label: "Go",
    kanji: "囲碁",
    tagline: "Surround more of the board than the other colour. Capture by taking a group's last liberty.",
    origin: "The oldest game still played in its original form: from China, at least 2,500 years old, and the subject of the earliest written game rules anywhere. It reached Japan by the 7th century, where the name most of the world knows it by — Go, short for igo — comes from.",
    alsoKnownAs: ["Weiqi", "围棋", "Baduk", "바둑", "Igo"],
    country: "CN",
    wikipedia: "Go (game)",
    rules: [
      "Players take turns placing one stone on any empty intersection. Black always opens. Stones never move once placed.",
      "A stone touches its orthogonal neighbours only, not the diagonals. A connected group of one colour shares its liberties — the empty points touching any stone in it — and a group with none left is captured, every stone of it, at once.",
      "You may not play a stone that would leave your own group with no liberties, unless doing so captures an enemy group and so gives it one. A move that would exactly retake the single stone a capture just lifted is forbidden for one turn — the ko rule — so a capture cannot be instantly undone.",
      "Either side may pass instead of playing. Two passes in a row end the game.",
      "The board is then counted: every stone left on it, plus every empty point surrounded by one colour alone, is a point for that colour. White receives a fixed 6.5-point bonus, komi, for playing second. Higher total wins; the half point means it is never a tie.",
    ],
    board: "19×19 is the full game; 13×13 and 9×9 play much faster and are the usual way to learn. Star points mark the traditional handicap spots.",
  },
};

export const SECOND_STONE_EXCLUSION_DISPLAY: Record<number, { label: string; kanji: string }> = {
  0: { label: "Anywhere", kanji: "自由" },
  2: { label: "Outside the central 5×5", kanji: "五路制限" },
  3: { label: "Outside the central 7×7", kanji: "七路制限" },
};

/** The label for a variant read back from storage, which may predate this list. */
export function variantLabel(variant: string): string {
  return (RULE_VARIANT_DISPLAY as Record<string, VariantCopy | undefined>)[variant]
    ?.label ?? variant;
}
