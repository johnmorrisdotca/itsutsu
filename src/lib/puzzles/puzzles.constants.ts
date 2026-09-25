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
 * NAMES A PLAYER ALREADY KNOWS. John, 2026-09-24, of "Number Place", "More or
 * Less" and the rest: "those names need work… wth is number place? sudoku?",
 * and then "do best guesses for names. I can change later." So a puzzle goes
 * by the English name people search for — Sudoku, Killer Sudoku, Futoshiki,
 * Skyscrapers — where that name is in common use. The kanji stays ours:
 * 数独 is Nikoli's trademark in Japan, so the Japanese name is ナンプレ, the
 * word Japanese publishers use. A puzzle whose name belongs to somebody
 * (Queens is LinkedIn's; Takuzu and Binairo are trademarks in the EU) keeps a
 * name of our own. Each still says what it is our version of (`inspiredBy`),
 * because the puzzle is made here by our own code. See `RULES_ATTRIBUTION`.
 * The addresses did not follow the rename (`PUZZLE_SLUGS`): links already
 * sent, a race's included, keep working.
 */
export const PUZZLE_KINDS = {
  numberPlace: "numberPlace",
  hiddenStones: "hiddenStones",
  moreOrLess: "moreOrLess",
  jigsaw: "jigsaw",
  diagonal: "diagonal",
  sumCages: "sumCages",
  towers: "towers",
  blackAndWhite: "blackAndWhite",
  wordDrop: "wordDrop",
} as const satisfies Record<PuzzleKind, PuzzleKind>;

/** Every puzzle, in the order the family shows them. Read by the coverage gate, the tour and the catalogue. */
export const PUZZLE_KIND_LIST: readonly PuzzleKind[] = [
  PUZZLE_KINDS.numberPlace,
  PUZZLE_KINDS.jigsaw,
  PUZZLE_KINDS.diagonal,
  PUZZLE_KINDS.sumCages,
  PUZZLE_KINDS.moreOrLess,
  PUZZLE_KINDS.towers,
  PUZZLE_KINDS.hiddenStones,
  PUZZLE_KINDS.blackAndWhite,
  PUZZLE_KINDS.wordDrop,
];

export const PUZZLE_LEVELS = { easy: "easy", medium: "medium", hard: "hard" } as const satisfies Record<PuzzleLevel, PuzzleLevel>;

export const PUZZLE_LEVEL_LIST: readonly PuzzleLevel[] = ["easy", "medium", "hard"];

export const PUZZLE_LEVEL_DISPLAY: Record<PuzzleLevel, { label: string; kanji: string; blurb: string }> = {
  easy: { label: "Easy", kanji: "初級", blurb: "Every step can be found by looking; nothing has to be tried." },
  medium: { label: "Medium", kanji: "中級", blurb: "Looking gets you most of the way; somewhere you have to try one thing and see." },
  hard: { label: "Hard", kanji: "上級", blurb: "More than one place where you have to try something and see." },
};

/**
 * HOW MANY TIMES CHECK MAY BE PRESSED: no limit, three, or one. John,
 * 2026-09-24: "We should have difficulty or game ending rules where, should
 * they choose this level, they only get 3 CHECKS, or 1 CHECK... or unlimited
 * CHECKS. That should be an option."
 *
 * Running out takes the help away and does NOT end the puzzle. Sudoku.com
 * ends a game at three mistakes, but there every wrong entry is marked the
 * moment it is made; here Check only says how many cells are wrong, never
 * which, so a solver who never presses it has made no mistake anybody saw,
 * and ending their puzzle for pressing it would punish the asking rather
 * than the error. `null` is no limit, which every solve kept before this
 * existed truly had.
 */
export const PUZZLE_CHECK_ALLOWANCES: readonly (number | null)[] = [null, 3, 1];

export function checkAllowanceWords(allowed: number | null): { label: string; kanji: string; blurb: string } {
  if (allowed === null) return { label: "No limit", kanji: "無制限", blurb: "Check as often as you like. It says how many cells are wrong, never which." };
  if (allowed === 1) return { label: "One", kanji: "一回", blurb: "One Check, so spend it well. Running out takes the help away; the puzzle goes on." };
  if (allowed === 3) return { label: "Three", kanji: "三回", blurb: "Three Checks. Running out takes the help away; the puzzle goes on." };
  return { label: String(allowed), kanji: `${allowed}回`, blurb: `${allowed} Checks. Running out takes the help away; the puzzle goes on.` };
}

/** Whether a number is one of the allowances offered, so an address or a request can name no other. */
export function isCheckAllowance(value: unknown): value is number | null {
  return PUZZLE_CHECK_ALLOWANCES.includes(value as number | null);
}

/**
 * Hidden Stones is made at six sides and offered at four — Quick, Usual, Long
 * and Longest — because the set-up screen keeps room for four boards and no
 * more (see `offered`). 6×6 and 8×8 stay in `sizes` for anything already made
 * at them.
 */
export const PUZZLE_SPECS: Record<PuzzleKind, PuzzleSpec> = {
  // 256: a 16×16's cells, one character each, 1–9 then A–G.
  numberPlace: { sizes: [4, 6, 9, 16], offered: [4, 6, 9, 16], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 256 },
  hiddenStones: { sizes: [5, 6, 7, 8, 9, 10], offered: [5, 7, 9, 10], defaultSize: 7, levels: ["easy", "hard"], defaultLevel: "easy", mostCells: 100 },
  // 133: the 49 cells of a 7×7 and the 84 edges between them, which its code writes after the cells.
  moreOrLess: { sizes: [4, 5, 6, 7], offered: [4, 5, 6, 7], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 133 },
  // 162: a 9×9's 81 cells and then its 81 region letters, which its code writes after the cells.
  jigsaw: { sizes: [5, 6, 7, 9], offered: [5, 6, 7, 9], defaultSize: 7, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 162 },
  diagonal: { sizes: [6, 9], offered: [6, 9], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 81 },
  // 286: a 9×9's 81 cells, its 81 cage letters and two characters for each of up to 62 cages' sums.
  sumCages: { sizes: [6, 9], offered: [6, 9], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 286 },
  // 77: a 7×7's 49 cells and then the 28 places around its edge where a clue can stand.
  towers: { sizes: [4, 5, 6, 7], offered: [4, 5, 6, 7], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 77 },
  // Even sides only: a line holds as many black stones as white.
  blackAndWhite: { sizes: [6, 8, 10, 12], offered: [6, 8, 10, 12], defaultSize: 8, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 144 },
  // A size is the word's length. 30: six guesses of five letters, the longest answer; the givens are the word alone.
  wordDrop: { sizes: [4, 5], offered: [4, 5], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 30, helps: false },
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
    16: { label: "Giant", kanji: "特大" },
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
  sumCages: {
    6: { label: "Short", kanji: "短" },
    9: { label: "Classic", kanji: "定番" },
  },
  towers: {
    4: { label: "Quick", kanji: "速" },
    5: { label: "Usual", kanji: "定番" },
    6: { label: "Longer", kanji: "長め" },
    7: { label: "Long", kanji: "長" },
  },
  blackAndWhite: {
    6: { label: "Quick", kanji: "速" },
    8: { label: "Usual", kanji: "定番" },
    10: { label: "Long", kanji: "長" },
    12: { label: "Longest", kanji: "最長" },
  },
  wordDrop: {
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
  },
};

export const PUZZLE_DISPLAY: Record<PuzzleKind, VariantCopy> = {
  numberPlace: {
    label: "Sudoku",
    kanji: "ナンプレ",
    tagline: "Fill the grid so every row, column and box holds each number once. One person, one answer.",
    inspiredBy: "Sudoku",
    origin:
      "Howard Garns's Number Place, printed by Dell in 1979; Nikoli took it to Japan in 1984 and named it Sudoku, and from there it went round the world.",
    alsoKnownAs: ["Number Place", "Nanpure"],
    country: "US",
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The numbers already printed are the givens. They stay where they are, and every puzzle here has exactly one answer that fits them.",
      "The 16×16 Giant has sixteen symbols: 1 to 9, then A to G for 10 to 16. Type the letter, or press its key.",
      "There is no guessing at the easy level: every cell can be found by reasoning from what is already there. Medium and hard ask you to try something and see.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board:
      "9×9 with 3×3 boxes is the puzzle everybody knows. 4×4 with 2×2 boxes is over in a minute and is the one to give a child; 6×6 with boxes two rows tall and three wide sits between. 16×16, the Giant, has boxes four by four and the letters A to G after 9; it is best on a tablet or a computer, where its cells are big enough to tap.",
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
    label: "Futoshiki",
    kanji: "不等式",
    tagline: "Fill the square so every row and column holds each number once, and every more-than mark is true.",
    inspiredBy: "Futoshiki",
    origin: "Our version of Futoshiki 不等式, Tamaki Seimiya's puzzle of 2001, which Nikoli published.",
    alsoKnownAs: ["Unequal", "Greater Than Sudoku"],
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
    label: "Jigsaw Sudoku",
    kanji: "変形ナンプレ",
    tagline: "Sudoku with the boxes cut into irregular regions: every row, column and region holds each number once.",
    inspiredBy: "Jigsaw Sudoku",
    origin:
      "Sudoku with its boxes traded for irregular shapes, printed under names such as Nonomino and Jigsaw Sudoku. Without boxes it is not tied to sides that divide evenly, so it comes at five and seven as well.",
    alsoKnownAs: ["Nonomino", "Irregular Sudoku"],
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
    label: "Diagonal Sudoku",
    kanji: "対角ナンプレ",
    tagline: "Sudoku where the two long diagonals must hold each number once too.",
    inspiredBy: "Sudoku X",
    origin:
      "The most common extra rule laid on Sudoku: the two diagonals count as groups as well. Newspapers print it as Sudoku X, The Daily Mail at six by six.",
    alsoKnownAs: ["Sudoku X", "X-Sudoku"],
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The two long diagonals, shaded corner to corner, must each hold every number exactly once as well.",
      "Every puzzle has exactly one answer, and the diagonals are part of reaching it: fewer numbers are printed than a plain grid would need.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "9×9 is the usual size; 6×6, with boxes two rows tall and three wide, is the short one.",
  },
  sumCages: {
    label: "Killer Sudoku",
    kanji: "サムナンプレ",
    tagline: "Sudoku with no numbers printed: dashed cages each give the sum of the numbers inside them.",
    inspiredBy: "Killer Sudoku",
    origin:
      "Played in Japan in the 1990s as sum number place, and made famous as Killer Sudoku by The Times in 2005, which printed it daily beside the plain grid.",
    alsoKnownAs: ["Sumdoku", "Sum Number Place"],
    wikipedia: "Killer_sudoku",
    rules: [
      "Fill every cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The dashed outlines are cages. The small number in a cage's corner is the sum of the numbers inside it, and no number appears twice in one cage.",
      "Almost nothing is printed: the sums are the clues. Every puzzle has exactly one answer, and the harder levels have fewer, bigger cages.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "9×9 is the usual size; 6×6, with boxes two rows tall and three wide, is the short one.",
  },
  towers: {
    label: "Skyscrapers",
    kanji: "摩天楼",
    tagline: "Every number is a tower's height. The clues around the edge say how many towers you can see from there.",
    inspiredBy: "Skyscrapers",
    origin:
      "A Japanese logic puzzle known in English as Skyscrapers, set at the first World Puzzle Championship in 1992; Simon Tatham's puzzle collection calls it Towers.",
    alsoKnownAs: ["Towers", "Building Heights"],
    country: "JP",
    rules: [
      "Fill every cell with a tower from 1 up to the side of the square, so that each row and each column holds every height exactly once.",
      "A number outside the square says how many towers can be seen looking in from there. A taller tower hides every shorter one behind it.",
      "So a 1 means the tallest tower stands right beside the clue, and a clue as big as the square means the towers climb one step at a time.",
      "Every puzzle has exactly one answer. The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 7×7 is the long one.",
  },
  blackAndWhite: {
    label: "Black and White",
    kanji: "白黒",
    tagline: "Fill the grid with black and white stones: half of each in every row and column, and never three alike in a line.",
    inspiredBy: "Takuzu",
    origin:
      "The binary puzzle made around 2009 by Adolfo Zanellati and, separately, by Peter De Schepper and Frank Coussement, printed as Takuzu and Binairo. LinkedIn plays a form of it daily as Tango, with suns and moons.",
    alsoKnownAs: ["Takuzu", "Binairo", "Binary puzzle"],
    wikipedia: "Takuzu",
    rules: [
      "Fill every empty cell with a black stone or a white one.",
      "Every row and every column holds as many black stones as white ones.",
      "Never three stones of one colour side by side in a line, across or down. Here three in a row is the one thing you may not make.",
      "No two rows are the same, and no two columns are the same.",
      "Tap a cell once for black, again for white, again to clear it. The printed stones stay where they are, and every puzzle has exactly one answer.",
    ],
    board: "8×8 is the usual size. 6×6 is quick; 12×12 is an evening.",
  },
  wordDrop: {
    label: "WordDrop",
    kanji: "ワードドロップ",
    tagline: "Find the hidden word. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Guessing a word from what each guess gives away is an old parlour game: Jotto (1955) counted the letters two words share, and the television game Lingo (1987) coloured each letter in its place or not. Josh Wardle's Wordle (2021) made the five-letter form a daily habit.",
    rules: [
      "A word is hidden: five letters, or four in the short form. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "A letter appears in the colours as often as it is in the word: guess two E's against a word with one, and one E lights up while the other goes grey.",
      "Six guesses for five letters, five for four. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      "Hard keeps you honest: every letter already found must be used again, a green one in its place.",
    ],
    board:
      "Five letters and six guesses is the game everybody knows. Four letters and five guesses is quicker, and not always easier: fewer letters give away less. Easy draws from the commonest words; medium and hard from a wider list, and hard adds its rule.",
  },
};
