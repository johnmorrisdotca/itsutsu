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
