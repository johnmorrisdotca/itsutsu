import type { VariantCopy } from "../gomoku/variants.constants";

import type { PuzzleKind, PuzzleLevel, PuzzleSpec } from "./puzzles.types";

/**
 * The puzzles: what each is, how big it comes, and what a reader is told.
 *
 * The copy is in the same shape as a game's (`VariantCopy`) so the rules
 * page, the catalogue's cards and the family page draw a puzzle with the
 * template they already have — one template, read once, is the reason the
 * shape was kept rather than a puzzle getting a page of its own.
 *
 * NAMES OF OUR OWN. "Sudoku" 数独 is Nikoli's trademark in Japan, and the
 * others below are named after published puzzles too, so each is called
 * something of ours and says what it is our version of (`inspiredBy`), the
 * way Drop Four does for Connect Four. See `RULES_ATTRIBUTION`.
 */
export const PUZZLE_KINDS = {
  numberPlace: "numberPlace",
  hiddenStones: "hiddenStones",
  moreOrLess: "moreOrLess",
  jigsaw: "jigsaw",
  diagonal: "diagonal",
} as const satisfies Record<PuzzleKind, PuzzleKind>;

/** Every puzzle, in the order the family shows them. Read by the coverage gate, the tour and the catalogue. */
export const PUZZLE_KIND_LIST: readonly PuzzleKind[] = [
  PUZZLE_KINDS.numberPlace,
  PUZZLE_KINDS.jigsaw,
  PUZZLE_KINDS.diagonal,
  PUZZLE_KINDS.hiddenStones,
  PUZZLE_KINDS.moreOrLess,
];

export const PUZZLE_LEVELS = { easy: "easy", medium: "medium", hard: "hard" } as const satisfies Record<PuzzleLevel, PuzzleLevel>;

export const PUZZLE_LEVEL_LIST: readonly PuzzleLevel[] = ["easy", "medium", "hard"];

export const PUZZLE_LEVEL_DISPLAY: Record<PuzzleLevel, { label: string; kanji: string; blurb: string }> = {
  easy: { label: "Easy", kanji: "初級", blurb: "Every step can be found by looking; nothing has to be tried." },
  medium: { label: "Medium", kanji: "中級", blurb: "Looking gets you most of the way; somewhere you have to try one thing and see." },
  hard: { label: "Hard", kanji: "上級", blurb: "More than one place where you have to try something and see." },
};

/**
 * Hidden Stones is made at six sides and offered at four — Quick, Usual, Long
 * and Longest — because the set-up screen keeps room for four boards and no
 * more (see `offered`). 6×6 and 8×8 stay in `sizes` for anything already made
 * at them.
 */
export const PUZZLE_SPECS: Record<PuzzleKind, PuzzleSpec> = {
  numberPlace: { sizes: [4, 6, 9], offered: [4, 6, 9], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 81 },
  hiddenStones: { sizes: [5, 6, 7, 8, 9, 10], offered: [5, 7, 9, 10], defaultSize: 7, levels: ["easy", "hard"], defaultLevel: "easy", mostCells: 100 },
  // 133: the 49 cells of a 7×7 and the 84 edges between them, which its code writes after the cells.
  moreOrLess: { sizes: [4, 5, 6, 7], offered: [4, 5, 6, 7], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 133 },
  // 162: a 9×9's 81 cells and then its 81 region letters, which its code writes after the cells.
  jigsaw: { sizes: [5, 6, 7, 9], offered: [5, 6, 7, 9], defaultSize: 7, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 162 },
  diagonal: { sizes: [6, 9], offered: [6, 9], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 81 },
};

/**
 * THE LONGEST CODE ANY PUZZLE HAS — a 9×9 Jigsaw's cells and regions, 162
 * characters — which is what a route may accept before it asks the kind's own
 * `mostCells`. The solved route used to cap a code at 100, and every 9×9
 * Jigsaw and 7×7 More or Less handed in was refused as a bad request, kept
 * nowhere and paid nothing. Read from the specs, so a longer kind raises it.
 */
export const PUZZLE_CODE_LONGEST = Math.max(...Object.values(PUZZLE_SPECS).map((spec) => spec.mostCells));


/**
 * WHAT EACH SIZE IS FOR, under its picture on the size tiles — the board
 * games' tiles, drawn by `BoardPicker`, whose own names ("Mini" for 9×9) are
 * a board game's and would call the classic Sudoku grid the small one. The big
 * number in the picture already says the size, so the name says what the size
 * is for: the quick one, the usual one, the long one.
 */
export const PUZZLE_SIZE_NAMES: Record<PuzzleKind, Record<number, { label: string; kanji: string }>> = {
  numberPlace: {
    4: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    9: { label: "Classic", kanji: "定番" },
  },
  hiddenStones: {
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Usual", kanji: "定番" },
    8: { label: "Longer", kanji: "長め" },
    9: { label: "Long", kanji: "長" },
    10: { label: "Longest", kanji: "最長" },
  },
  moreOrLess: {
    4: { label: "Quick", kanji: "速" },
    5: { label: "Usual", kanji: "定番" },
    6: { label: "Longer", kanji: "長め" },
    7: { label: "Long", kanji: "長" },
  },
  jigsaw: {
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Usual", kanji: "定番" },
    9: { label: "Classic", kanji: "本格" },
  },
  diagonal: {
    6: { label: "Short", kanji: "短" },
    9: { label: "Classic", kanji: "定番" },
  },
};

export const PUZZLE_DISPLAY: Record<PuzzleKind, VariantCopy> = {
  numberPlace: {
    label: "Number Place",
    kanji: "ナンプレ",
    tagline: "Fill the grid so every row, column and box holds each number once. One person, one answer.",
    inspiredBy: "Sudoku",
    origin:
      "Howard Garns's Number Place, printed by Dell in 1979; Nikoli took it to Japan in 1984 and named it Sudoku, and from there it went round the world.",
    alsoKnownAs: ["Sudoku", "Nanpure"],
    country: "US",
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The numbers already printed are the givens. They stay where they are, and every puzzle here has exactly one answer that fits them.",
      "There is no guessing at the easy level: every cell can be found by reasoning from what is already there. Medium and hard ask you to try something and see.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board:
      "9×9 with 3×3 boxes is the puzzle everybody knows. 4×4 with 2×2 boxes is over in a minute and is the one to give a child; 6×6 with boxes two rows tall and three wide sits between.",
  },
  hiddenStones: {
    label: "Hidden Stones",
    kanji: "隠し石",
    tagline: "One black stone hides in every row, every column and every region, and no two touch.",
    inspiredBy: "Star Battle (one star)",
    origin: "The one-star form of Hans Eendebak's Star Battle (2003), which a daily version made a habit in 2024.",
    alsoKnownAs: ["Queens"],
    country: "NL",
    rules: [
      "Place a black stone in every row, every column and every region, one each.",
      "No two stones may touch, not even at a corner.",
      "Every puzzle has exactly one answer. Tap a cell once for a stone, again for a cross to mark a cell you have ruled out, and again to clear it; the puzzle is done when every row's stone is right.",
      "Easy puzzles yield to looking alone; hard ones ask you to try a stone somewhere and see.",
    ],
    board: "7×7 is the everyday size. 5×5 is a first puzzle; 10×10 is an evening.",
  },
  moreOrLess: {
    label: "More or Less",
    kanji: "大小",
    tagline: "Fill the square so every row and column holds each number once, and every more-than mark is true.",
    inspiredBy: "Futoshiki",
    origin: "Our version of Futoshiki 不等式, Tamaki Seimiya's puzzle of 2001, which Nikoli published.",
    alsoKnownAs: ["Futoshiki", "Unequal"],
    country: "JP",
    wikipedia: "Futoshiki",
    rules: [
      "Fill every cell with a number from 1 up to the side of the square, so that each row and each column holds every number exactly once.",
      "A mark between two cells says which is the bigger: the open end faces the larger number, the point the smaller.",
      "Every puzzle has exactly one answer, and every mark and given is needed to reach it.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 7×7 is the long one.",
  },
  jigsaw: {
    label: "Jigsaw",
    kanji: "変形ナンプレ",
    tagline: "Number Place with the boxes cut into irregular regions: every row, column and region holds each number once.",
    inspiredBy: "Jigsaw Sudoku",
    origin:
      "Number Place with its boxes traded for irregular shapes, printed under names such as Nonomino and Jigsaw Sudoku. Without boxes it is not tied to sides that divide evenly, so it comes at five and seven as well.",
    alsoKnownAs: ["Jigsaw Sudoku", "Nonomino", "Irregular Sudoku"],
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each outlined region holds every number exactly once.",
      "The regions are drawn in heavier lines, and each has as many cells as the grid is wide, in a shape of its own.",
      "Every puzzle has exactly one answer. Easy yields to reasoning alone; medium and hard ask you to try something and see.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "7×7 is the usual size. 5×5 is quick; 9×9 is the classic grid with the boxes cut up.",
  },
  diagonal: {
    label: "Diagonal",
    kanji: "対角ナンプレ",
    tagline: "Number Place where the two long diagonals must hold each number once too.",
    inspiredBy: "Sudoku X",
    origin:
      "The most common extra rule laid on Number Place: the two diagonals count as groups as well. Newspapers print it as Sudoku X, The Daily Mail at six by six.",
    alsoKnownAs: ["Sudoku X", "Diagonal Sudoku"],
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The two long diagonals, shaded corner to corner, must each hold every number exactly once as well.",
      "Every puzzle has exactly one answer, and the diagonals are part of reaching it: fewer numbers are printed than a plain grid would need.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "9×9 is the usual size; 6×6, with boxes two rows tall and three wide, is the short one.",
  },
};
