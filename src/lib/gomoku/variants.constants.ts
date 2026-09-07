import type {
  ForbiddenPattern,
  HandicapRule,
  OpeningRule,
  RuleVariant,
} from "./gomoku.types";

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
  rules: readonly string[];
  /** Board advice, e.g. the size the game is traditionally played on. */
  board: string;
};

export const RULE_VARIANT_DISPLAY: Record<RuleVariant, VariantCopy> = {
  freestyle: {
    label: "Freestyle",
    kanji: "自由",
    tagline: "Five or more in a row wins.",
    origin: "The casual game played everywhere, with no restrictions at all.",
    rules: [
      "Players take turns placing one stone on any empty intersection.",
      "The first to line up five or more of their own stones, in any direction, wins.",
      "An overline of six or more counts as a win.",
      "Either colour may open, or the first stone can be drawn by lot.",
    ],
    board: "Any size. Black has a proven forced win on 15×15 with perfect play, so stronger players give the first stone away or pick an opening protocol.",
  },
  standard: {
    label: "Standard",
    kanji: "五目",
    tagline: "Exactly five wins. Six or more does not.",
    origin: "The tournament form of gomoku, as played at Gomocup.",
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
    rules: [
      "Players take turns placing one stone.",
      "Flank exactly two enemy stones in a line, with your own stone at each end, and the pair is captured and removed. Only the stone that closes the trap captures — moving into a flanked position is safe.",
      "Five or more in a row wins. Capturing five pairs also wins.",
      "Captured points are open again, so a broken line can be rebuilt and a five can be prevented by taking a stone out of it first.",
    ],
    board: "Traditionally a 19×19 go board. Pair it with the Pro opening for the tournament form.",
  },
  connect6: {
    label: "Connect6",
    kanji: "六子棋",
    tagline: "Two stones a turn. Six in a row wins.",
    origin: "Devised by I-Chen Wu in 2003 and played at the Computer Olympiad.",
    rules: [
      "Black opens with a single stone. From then on each player places two stones per turn.",
      "Six or more in a row wins.",
      "Nothing is forbidden and there is no swap: placing two stones a turn is what balances the first move.",
      "A line of four with both ends open is already unstoppable, so threats arrive faster than in gomoku.",
    ],
    board: "19×19 is the standard board. 15×15 gives a shorter game.",
  },
  dropFour: {
    label: "Drop Four",
    kanji: "落とし四目",
    tagline: "Stones fall to the bottom of their column. Four in a row wins.",
    origin: "Our version of the upright four-in-a-row game, with a magnet under the board instead of a frame.",
    rules: [
      "Play anywhere in a column and the stone slides to the lowest empty point in it, as if the board were upright and the stones magnetic.",
      "Four in a row, in any direction, wins.",
      "A full board with no four is a draw.",
      "Either colour may open.",
    ],
    board: "7×7 is the classic feel. 9×9 gives a longer game.",
  },
  twistFive: {
    label: "Twist Five",
    kanji: "回し五目",
    tagline: "Place a stone, then turn one quarter of the board. Five wins.",
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
    rules: [
      "Players take turns placing one stone.",
      "Three in a row, in any direction, wins.",
      "With sound play it is always a draw, which is the whole lesson of the game.",
    ],
    board: "3×3.",
  },
};

export type OpeningCopy = {
  label: string;
  kanji: string;
  tagline: string;
  rules: readonly string[];
};

export const OPENING_DISPLAY: Record<OpeningRule, OpeningCopy> = {
  free: {
    label: "Free",
    kanji: "自由",
    tagline: "Anywhere, in any order.",
    rules: ["No restriction on where the first stones go."],
  },
  pro: {
    label: "Pro",
    kanji: "五路制限",
    tagline: "Black's second stone must leave the central 5×5.",
    rules: [
      "Black opens at tengen, the centre point.",
      "White's first stone may go anywhere.",
      "Black's second stone, move three, must land outside the central 5×5 square.",
      "After that the game is unrestricted. This is also the tournament rule in the capture game.",
    ],
  },
  longPro: {
    label: "Long Pro",
    kanji: "七路制限",
    tagline: "Black's second stone must leave the central 7×7.",
    rules: [
      "Black opens at tengen.",
      "White's first stone may go anywhere.",
      "Black's second stone, move three, must land outside the central 7×7 square.",
      "A stiffer handicap than Pro for the first player.",
    ],
  },
  swap: {
    label: "Swap",
    kanji: "交換",
    tagline: "One player sets three stones, the other picks a colour.",
    rules: [
      "Player 1 places three stones: black, white, black, anywhere on the board.",
      "Player 2 looks at the position and chooses to play black or white.",
      "White moves next, whoever holds it. The chooser's clock runs while they decide.",
    ],
  },
  swap2: {
    label: "Swap2",
    kanji: "交換二",
    tagline: "As Swap, but the chooser may add two stones and hand the choice back.",
    rules: [
      "Player 1 places three stones: black, white, black.",
      "Player 2 chooses: play black, play white, or add two more stones — white then black — and let Player 1 choose the colour instead.",
      "White moves next once colours are settled.",
      "The opening used at the Gomoku World Championship, because a fair three-stone position is hard to set.",
    ],
  },
  rif: {
    label: "RIF",
    kanji: "連珠",
    tagline: "The classic renju opening: centre, 3×3, 5×5, then white may swap.",
    rules: [
      "Black opens at tengen.",
      "White's first stone must touch it, inside the central 3×3.",
      "Black's second stone must land inside the central 5×5.",
      "White then chooses to keep white or take black. The full tournament rule also has black offer two fifth moves for white to reject one; that step is not enforced here.",
    ],
  },
};

export const FORBIDDEN_PATTERN_DISPLAY: Record<
  ForbiddenPattern,
  { label: string; kanji: string }
> = {
  doubleThree: { label: "double three", kanji: "三三" },
  doubleFour: { label: "double four", kanji: "四四" },
  overline: { label: "overline", kanji: "長連" },
};

export const HANDICAP_RULE_DISPLAY: Record<
  HandicapRule,
  { label: string; kanji: string; description: string; from: string }
> = {
  doubleThree: {
    label: "No double three",
    kanji: "三三禁",
    description: "May not make two open threes with one stone.",
    from: "Renju, Omok",
  },
  doubleFour: {
    label: "No double four",
    kanji: "四四禁",
    description: "May not make two fours with one stone.",
    from: "Renju",
  },
  overline: {
    label: "No overline",
    kanji: "長連禁",
    description: "May not make six or more in a row at all, and six never wins.",
    from: "Renju",
  },
  exactLine: {
    label: "Exactly five",
    kanji: "五連限定",
    description: "An overline does not win; the line must be exactly the length.",
    from: "Standard, Renju",
  },
  openLine: {
    label: "Open line only",
    kanji: "両端開放",
    description: "A line shut in at both ends by the opponent does not win.",
    from: "Caro",
  },
  longerLine: {
    label: "One more in a row",
    kanji: "六連",
    description: "Needs one more stone in a row than the opponent.",
    from: "A traditional gomoku handicap",
  },
  singleStone: {
    label: "One stone a turn",
    kanji: "一手一子",
    description: "Places one stone a turn where the game gives two.",
    from: "Connect6",
  },
  noCaptures: {
    label: "No captures",
    kanji: "取り無し",
    description: "Flanking a pair takes nothing.",
    from: "Ninuki-renju",
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
