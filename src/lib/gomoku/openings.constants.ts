import type { ForbiddenPattern, HandicapRule, OpeningRule } from "./gomoku.types";

/**
 * What a player is told about the openings, the forbidden shapes and the
 * handicap toggles, and where the games came from. The games themselves are
 * described in `variants.constants.ts`.
 */
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
  sakata: {
    label: "Sakata",
    kanji: "坂田ルール",
    tagline: "The RIF start and swap; then the fifth stone stays inside the 7×7.",
    rules: [
      "Black opens at tengen, white's first stone touches it inside the 3×3, and black's second lands inside the 5×5.",
      "White then chooses to keep white or take black.",
      "White's second stone, move four, may go anywhere.",
      "Black's third stone, move five, must land inside the central 7×7. There is one fifth move, not a choice of them, which is what sets Sakata apart from the RIF rule.",
    ],
  },
  tarannikov: {
    label: "Tarannikov",
    kanji: "タランニコフ",
    tagline: "Five nested squares, and a chance to swap after each of the first five stones.",
    rules: [
      "The first stone goes on tengen; the second inside the 3×3, the third inside the 5×5, the fourth inside the 7×7 and the fifth inside the 9×9.",
      "After each of those five stones, the player who did not lay it may swap colours or keep their own.",
      "Colours alternate as usual throughout; only the seats holding them change.",
      "From the sixth stone the game is unrestricted. Because the swap comes so often, an unbalanced stone at any point simply hands its colour away.",
    ],
  },
};

/**
 * Where the games came from, and whose names are whose. Some of the games here
 * are our own versions of games sold under other names; the names of those
 * products belong to their owners and are used only to say what a game is like.
 */
export const RULES_ATTRIBUTION = [
  "Some games here are our own versions of games you may know by other names, rebuilt from their rules under names of our own. Drop Four is our version of the falling-stone game sold as Connect Four; Twist Five and Twist Four of the quadrant-turning game sold as Pentago; Ninuki-renju is the Japanese ancestor of the capture game sold as Pente, and Sannuki-renju our version of the pair-and-triple rule sold as Keryo-Pente; Maker and Breaker is our version of the game published as Order and Chaos.",
  "Connect Four is a trademark of Hasbro; Pentago of Mindtwister; Pente and Keryo-Pente of Winning Moves. None of them has any connection with this site, and the names appear here only to say what a game resembles. Renju, Omok, Caro, Connect6, Squava, Teeko, Notakto and Wild tic-tac-toe are traditional or published games whose rules are described in their own words; Trap Three and Square Four are our names for the first two.",
] as const;

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
    from: "Tournament Gomoku, Renju",
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
