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
} as const satisfies Record<PuzzleKind, PuzzleKind>;

/** Every puzzle, in the order the family shows them. Read by the coverage gate, the tour and the catalogue. */
export const PUZZLE_KIND_LIST: readonly PuzzleKind[] = [PUZZLE_KINDS.numberPlace, PUZZLE_KINDS.hiddenStones];

export const PUZZLE_LEVELS = { easy: "easy", medium: "medium", hard: "hard" } as const satisfies Record<PuzzleLevel, PuzzleLevel>;

export const PUZZLE_LEVEL_LIST: readonly PuzzleLevel[] = ["easy", "medium", "hard"];

export const PUZZLE_LEVEL_DISPLAY: Record<PuzzleLevel, { label: string; kanji: string; blurb: string }> = {
  easy: { label: "Easy", kanji: "初級", blurb: "Every step can be found by looking; nothing has to be tried." },
  medium: { label: "Medium", kanji: "中級", blurb: "Looking gets you most of the way; somewhere you have to try one thing and see." },
  hard: { label: "Hard", kanji: "上級", blurb: "More than one place where you have to try something and see." },
};

export const PUZZLE_SPECS: Record<PuzzleKind, PuzzleSpec> = {
  numberPlace: { sizes: [4, 6, 9], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 81 },
  hiddenStones: { sizes: [5, 6, 7, 8, 9, 10], defaultSize: 7, levels: ["easy", "hard"], defaultLevel: "easy", mostCells: 100 },
  moreOrLess: { sizes: [4, 5, 6, 7], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 49 },
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
      "A mark between two cells says which is the bigger: the open end faces the larger number.",
      "Every puzzle has exactly one answer, and every mark and given is needed to reach it.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 7×7 is the long one.",
  },
};
