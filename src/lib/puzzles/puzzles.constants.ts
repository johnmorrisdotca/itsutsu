import type { VariantCopy } from "../gomoku/variants.constants";

import { LONGEST_WORD, MOST_GUESSES } from "./gomoji/layout";
import { KUMIMOJI_BAG, KUMIMOJI_HANDS } from "./kumimoji/tiles.constants";
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
  gomoji: "gomoji",
  gomojiKana: "gomojiKana",
  gomojiMot: "gomojiMot",
  gomojiWort: "gomojiWort",
  tsunagi: "tsunagi",
  kumimoji: "kumimoji",
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
  PUZZLE_KINDS.gomoji,
  PUZZLE_KINDS.gomojiKana,
  PUZZLE_KINDS.gomojiMot,
  PUZZLE_KINDS.gomojiWort,
  PUZZLE_KINDS.tsunagi,
  PUZZLE_KINDS.kumimoji,
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
  if (allowed === null) return { label: "No limit", kanji: "無制限", blurb: "Check and Show as often as you like: Check says how many cells are wrong, Show marks which." };
  if (allowed === 1) return { label: "One", kanji: "一回", blurb: "One Check or Show, so spend it well. Running out takes them away; the puzzle goes on." };
  if (allowed === 3) return { label: "Three", kanji: "三回", blurb: "Three Checks or Shows between them. Running out takes them away; the puzzle goes on." };
  return { label: String(allowed), kanji: `${allowed}回`, blurb: `${allowed} Checks or Shows between them. Running out takes them away; the puzzle goes on.` };
}

/** Whether a number is one of the allowances offered, so an address or a request can name no other. */
export function isCheckAllowance(value: unknown): value is number | null {
  return PUZZLE_CHECK_ALLOWANCES.includes(value as number | null);
}

/**
 * Hidden Stones is made at eight sides and offered at four — Beginner, Usual,
 * Long and Longest — because the set-up screen keeps room for four boards and
 * no more (see `offered`). John, 2026-09-26: "is it possible to add a 12x12
 * game? and a beginner 4x4 game?" The two new ones took the ends, and 9×9
 * stayed between the everyday 7×7 and the 12×12 as the step up; 5×5, 6×6,
 * 8×8 and 10×10 stay in `sizes` for anything already made at them. A 4×4 is
 * made easy only (`levelsAt`): it has two possible answers, and looking
 * always tells them apart.
 */
/** The longest answer a word puzzle can hand in: every guess its most generous level gives, of its longest word. */
const WORD_ANSWER_MOST = MOST_GUESSES * LONGEST_WORD;

/**
 * A Kumimoji's longest string is a kept game (`encodeTileProgress`): the count
 * of tiles taken, the tiles traded back, the hand, and the grid, which writes
 * a letter a tile, a number for each gap and a "/" between rows. Fifty tiles
 * each on a row of its own and indented by two digits is 199 characters for
 * the grid; with a hand and trades beside it, 400 holds any game of fifty.
 */
const TILE_GAME_MOST = 400;

export const PUZZLE_SPECS: Record<PuzzleKind, PuzzleSpec> = {
  // 256: a 16×16's cells, one character each, 1–9 then A–G.
  numberPlace: { sizes: [4, 6, 9, 16], offered: [4, 6, 9, 16], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 256 },
  hiddenStones: {
    sizes: [4, 5, 6, 7, 8, 9, 10, 12],
    offered: [4, 7, 9, 12],
    defaultSize: 7,
    levels: ["easy", "hard"],
    levelsAt: { 4: ["easy"] },
    defaultLevel: "easy",
    mostCells: 144,
    stones: true,
  },
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
  blackAndWhite: { sizes: [6, 8, 10, 12], offered: [6, 8, 10, 12], defaultSize: 8, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 144, stones: true },
  /*
   * A size is the word's length, and an answer is every guess made, one
   * character a letter or a kana: the most guesses any level gives
   * (`MOST_GUESSES`) of the longest word. It was 30, six guesses of five, and
   * when medium grew a seventh row and easy the whole board (2026-09-25) every
   * solve past the sixth guess was refused as "Not a grid of that size" —
   * solved, and never kept or paid. `puzzleCodeLength.test.ts` holds it now.
   */
  gomoji: { sizes: [4, 5, 6], offered: [4, 5, 6], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomoji" },
  /* The longest answer the same way, in kana; the givens are the word and its grey word. */
  gomojiKana: { sizes: [3, 4, 5], offered: [3, 4, 5], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "easy", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomojiKana" },
  // Gomoji in French, from the Lexique dictionary: the same shape as English's, accents folded away.
  gomojiMot: { sizes: [4, 5, 6], offered: [4, 5, 6], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomoji" },
  // Gomoji in German: the same shape again, its alphabet carrying Ä, Ö and Ü as letters of their own.
  gomojiWort: { sizes: [4, 5, 6], offered: [4, 5, 6], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomoji" },
  /*
   * Six sizes of a hundred fixed levels each, and room for four size tiles:
   * they show four at a time, 4 to 7 or 6 to 9 (`TsunagiSizes`). A level's
   * band (the first third easy, the last hard) is its level here. No Check
   * or Hint: a line is joined or it is not, and the board shows which.
   */
  tsunagi: { sizes: [4, 5, 6, 7, 8, 9], offered: [4, 5, 6, 7], defaultSize: 4, levels: PUZZLE_LEVEL_LIST, defaultLevel: "easy", mostCells: 81, helps: false, onBoard: true, fixedLevels: true },
  /*
   * A size is the hand a game opens with (`KUMIMOJI_HANDS`), and the bag it is
   * played from follows from it (`KUMIMOJI_BAG`). One level: the bag is the
   * whole of a game's difficulty. The hand of three is the browser tests' own,
   * made and checked like any other and never offered.
   */
  kumimoji: {
    sizes: [KUMIMOJI_HANDS.tiny, KUMIMOJI_HANDS.quick, KUMIMOJI_HANDS.classic],
    offered: [KUMIMOJI_HANDS.quick, KUMIMOJI_HANDS.classic],
    defaultSize: KUMIMOJI_HANDS.classic,
    levels: ["medium"],
    defaultLevel: "medium",
    mostCells: TILE_GAME_MOST,
    helps: false,
    tiles: true,
  },
};

/** Whether a puzzle is drawn on the board itself in the player's board colour, rather than on white paper. */
export function drawnOnBoard(kind: PuzzleKind): boolean {
  const spec = PUZZLE_SPECS[kind];
  return spec.wordGrid !== undefined || spec.onBoard === true;
}

/**
 * THE LONGEST CODE ANY PUZZLE HAS — a 9×9 Jigsaw's cells and regions, 162
 * characters — which is what a route may accept before it asks the kind's own
 * `mostCells`. The solved route used to cap a code at 100, and every 9×9
 * Jigsaw and 7×7 More or Less handed in was refused as a bad request, kept
 * nowhere and paid nothing. Read from the specs, so a longer kind raises it.
 */
export const PUZZLE_CODE_LONGEST = Math.max(...Object.values(PUZZLE_SPECS).map((spec) => spec.mostCells));

/** The levels a puzzle can be made at, at this size: the kind's levels, less any this size cannot have (`levelsAt`). */
export function levelsFor(kind: PuzzleKind, size: number): readonly PuzzleLevel[] {
  const spec = PUZZLE_SPECS[kind];
  return spec.levelsAt?.[size] ?? spec.levels;
}


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
    4: { label: "Beginner", kanji: "入門" },
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Usual", kanji: "定番" },
    8: { label: "Longer", kanji: "長め" },
    9: { label: "Long", kanji: "長" },
    10: { label: "Evening", kanji: "夜長" },
    12: { label: "Longest", kanji: "最長" },
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
  gomoji: {
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
    6: { label: "Six letters", kanji: "六文字" },
  },
  gomojiKana: {
    3: { label: "Three kana", kanji: "三文字" },
    4: { label: "Four kana", kanji: "四文字" },
    5: { label: "Five kana", kanji: "五文字" },
  },
  gomojiMot: {
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
    6: { label: "Six letters", kanji: "六文字" },
  },
  gomojiWort: {
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
    6: { label: "Six letters", kanji: "六文字" },
  },
  tsunagi: {
    4: { label: "First", kanji: "初" },
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Usual", kanji: "定番" },
    8: { label: "Long", kanji: "長" },
    9: { label: "Longest", kanji: "最長" },
  },
  kumimoji: {
    [KUMIMOJI_HANDS.tiny]: { label: "Tiny", kanji: "極小" },
    [KUMIMOJI_HANDS.quick]: { label: "Quick", kanji: "速" },
    [KUMIMOJI_HANDS.classic]: { label: "Classic", kanji: "定番" },
  },
};

/**
 * WHAT A LEVEL MEANS, where it means something else than how much has to be
 * tried: a Gomoji's level is how many guesses it gives (`layout.ts`) and how
 * common its word is. Every other puzzle reads `PUZZLE_LEVEL_DISPLAY`.
 */
const WORD_LEVEL_BLURBS: Record<PuzzleLevel, string> = {
  easy: "One of the commonest words, and every row of the board to find it in.",
  medium: "A wider list of words, and one guess more than the classic game.",
  hard: "A wider list of words, and the classic count of guesses.",
};
export const PUZZLE_LEVEL_BLURBS: Partial<Record<PuzzleKind, Partial<Record<PuzzleLevel, string>>>> = {
  gomoji: WORD_LEVEL_BLURBS,
  gomojiKana: WORD_LEVEL_BLURBS,
  tsunagi: {
    easy: "The first third of a size's hundred levels: every line can be found by looking.",
    medium: "The middle third: longer lines, and somewhere one has to be tried.",
    hard: "The last third: winding lines, and more than one place to try something and see.",
  },
  kumimoji: {
    medium: `Every tile of the bag goes down before the clock stops: ${KUMIMOJI_BAG[KUMIMOJI_HANDS.quick]} in a Quick game, ${KUMIMOJI_BAG[KUMIMOJI_HANDS.classic]} in a Classic one.`,
  },
};

/** The line under the level chips on the set-up screen, for this puzzle. */
export function levelBlurb(kind: PuzzleKind, level: PuzzleLevel): string {
  return PUZZLE_LEVEL_BLURBS[kind]?.[level] ?? PUZZLE_LEVEL_DISPLAY[level].blurb;
}

/** A lettered Gomoji's Head start, in its rules (`headStart.ts`); the kana one says it in kana. */
const HEAD_START_RULE =
  "Head start, a choice at easy, greys as many keys as the word has letters before the first guess, none of them in the word: a free guess that takes no row, at a cost of 50 points.";

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
    board: "7×7 is the everyday size. 4×4 is a first puzzle, easy only; 12×12 is an evening.",
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
  gomoji: {
    label: "Gomoji",
    kanji: "五文字",
    tagline: "Find the hidden word. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Guessing a word from what each guess gives away is an old parlour game: Jotto (1955) counted the letters two words share, and the television game Lingo (1987) coloured each letter in its place or not. Josh Wardle's Wordle (2021) made the five-letter form a daily habit.",
    rules: [
      "A word is hidden: five letters, four in the short form, or six in the long one. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "A letter appears in the colours as often as it is in the word: guess two E's against a word with one, and one E lights up while the other goes grey.",
      "Hard gives the classic count: six guesses for five letters, five for four, and six for six, since a longer word gives more away with every guess. Medium gives one more, and easy every row of the board: nine for five letters, eight for four or six. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      "Strict, a choice at any level, keeps you honest: every letter already found must be used again, a green one in its place.",
      HEAD_START_RULE,
    ],
    board:
      "Five letters on a board nine squares across, or four or six on eight. The words come from SCOWL, the spelling lists by Kevin Atkinson: easy hides one of the commonest words, medium and hard one of a wider list, and any word in the lists may be guessed.",
  },
  gomojiKana: {
    label: "Gomoji Kana",
    kanji: "五文字かな",
    tagline: "Find the hidden word in kana. Each guess shows which kana are right, which are in the word, and which column the right one is in.",
    inspiredBy: "Wordle",
    origin:
      "Gomoji in Japanese: the same hunt for a hidden word, played in hiragana, where a kana can be nearly right in ways a letter cannot. The rules for size, marks and columns are our own.",
    rules: [
      "A word is hidden, three, four or five kana long, in hiragana. Hard gives six guesses, medium seven, and easy every row the board has left; every guess must be a real word.",
      "Green is the right kana in the right place. Orange is a kana that is in the word somewhere else. Yellow means the word's kana in this place is in the same column of the kana table (か き く け こ are one column). Grey is none of those.",
      "An arrow means right kana, not quite: down for the wrong size (つ for っ), up for the wrong mark (は for ば or ぱ). The word is found only when every place is plain green.",
      "On easy and medium the puzzle opens with a free word already played that is grey everywhere, so its kana are out before you start.",
      "Type with the kana keys, or in romaji on your own keyboard (ka, kya, tsu; a double consonant for っ, nn for ん, - for ー). Strict, a choice at any level, keeps you honest: every kana found must be used again, a green one in its place.",
      "Head start, a choice at easy, greys as many kana keys as the word is long before the first guess, none of them in the word nor in the free grey word: a free guess that takes no row, at a cost of 50 points.",
    ],
    board:
      "Three kana is the gentlest, five the hardest. The words come from JMdict, the Japanese dictionary of the Electronic Dictionary Research and Development Group, used under its licence and refreshed every month. The answers are the commonest words by a fixed rule — textbook-common words first, then by how often newspapers use them: easy hides one of the 900 commonest at its length, medium and hard one of the 2,000 commonest, and any word in the dictionary may be guessed.",
  },
  gomojiMot: {
    label: "Gomoji Mot",
    kanji: "五文字・仏",
    tagline: "Find the hidden French word. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Gomoji in French: the same hunt for a hidden word Josh Wardle's Wordle (2021) made a daily habit, played on the AZERTY keyboard. Accents fold to their plain letter, as French Wordle clones play it — É guesses the same as E.",
    country: "FR",
    rules: [
      "A word is hidden: five letters, four in the short form, or six in the long one. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "A letter appears in the colours as often as it is in the word: guess two E's against a word with one, and one E lights up while the other goes grey.",
      "Six guesses for five letters, five for four, six for six. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      "Hard keeps you honest: every letter already found must be used again, a green one in its place.",
      HEAD_START_RULE,
    ],
    board:
      "Five letters and six guesses, four letters and five, or six letters and six. Any word in Lexique, a dictionary of about 140,000 French words, may be guessed. The hidden word is one Wiktionary has too, read in French books and in its dictionary form: never a name, a plural, a conjugated verb or a word borrowed from English. Easy hides one of the commoner words, as Lexique counts them among those French film dialogue uses most (hermitdave's FrequencyWords), and medium and hard one of the wider list. Accents are folded away, and words spelled with œ or æ are left out.",
  },
  gomojiWort: {
    label: "Gomoji Wort",
    kanji: "五文字・独",
    tagline: "Find the hidden German word. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Gomoji in German: the same hunt for a hidden word Josh Wardle's Wordle (2021) made a daily habit, played on the QWERTZ keyboard with Ä, Ö and Ü as letters of their own.",
    country: "DE",
    rules: [
      "A word is hidden: five letters, four in the short form, or six in the long one. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "Ä, Ö and Ü are letters of their own, not vowels with a fold: a guess for ä only matches ä.",
      "Six guesses for five letters, five for four, six for six. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      "Hard keeps you honest: every letter already found must be used again, a green one in its place.",
      HEAD_START_RULE,
    ],
    board:
      "Five letters and six guesses, four letters and five, or six letters and six. Any form in LanguageTool's German dictionary may be guessed, never a name or an abbreviation. The hidden word is one Wiktionary has too, in its dictionary form: never a plural, an inflection or a word borrowed from English. How often German film dialogue says it (hermitdave's FrequencyWords) decides how common it is: easy hides one of the commoner words, medium and hard one of the wider list. Words spelled with ß are left out, the way French leaves out œ and æ.",
  },
  tsunagi: {
    label: "Tsunagi",
    kanji: "繋ぎ",
    tagline: "Join each pair of marbles with a line, and fill the board.",
    inspiredBy: "Numberlink",
    origin:
      "Our version of Numberlink, the joining puzzle Nikoli made famous in Japan in the 1980s and printed as Arukone. Tsunagi 繋ぎ is Japanese for a joining: the line between two things that belong together. The levels, the marbles and the name are our own.",
    alsoKnownAs: ["Numberlink", "Arukone"],
    country: "JP",
    wikipedia: "Numberlink",
    rules: [
      "Every marble has a partner of the same colour and number. Join each pair with one line, drawn from cell to cell across and down, never on a slant.",
      "Lines may not cross, and no two lines may share a cell.",
      "The level is solved when every pair is joined and every cell of the board has a line through it. Every level has exactly one way to do that.",
      "Press on a marble, or on the end of a line, and drag. Drag back over your own line to shorten it; drag into another line to cut it back. Tap a marble to clear its line.",
      "A hundred levels at every size, the same for everybody. They open ten at a time: solve all ten in a row of the board of levels and the next row opens.",
    ],
    board:
      "4×4 is where to start, and 9×9 is the long one. Play by colours or by numbers, whichever you read faster: the marbles and the level are the same either way.",
  },
  /*
   * OUR OWN GAME, UNDER OUR OWN NAME. The anagram-grid race games are sold
   * under trademarks this site does not use, in its copy, its pictures or its
   * rules: the idea of building a crossword of your own from drawn tiles is
   * nobody's, and the letter mix is a fact about English (`TILE_MIX`).
   */
  kumimoji: {
    label: "Kumimoji",
    kanji: "組文字",
    tagline: "Build one crossword of your own from a hand of letter tiles, draw more as you go, and use the whole bag against the clock.",
    inspiredBy: "the anagram-grid race games",
    origin:
      "Our own solo take on the anagram-grid race games, where every player builds a crossword of their own from drawn tiles at the same time. Kumimoji plays it alone, against the clock, from a bag drawn from the classic mix of 144 letters. Its name, 組文字, means “assembled letters”: a sibling of Gomoji 五文字.",
    rules: [
      `You start with a hand of tiles, ${KUMIMOJI_HANDS.classic} in a Classic game or ${KUMIMOJI_HANDS.quick} in a Quick one. Lay them out to build one crossword: every tile joined to the rest, and every line of two or more letters, across or down, a word.`,
      "Tap a tile and then a square to put it there, or drag it; on a keyboard, choose a square and type. Tiles can be moved, swapped or sent back to your hand at any time, and a line that is not a word is marked in red until it is.",
      "When your hand is empty and the grid is sound, press Draw for the next tile from the bag, and fit it in. Rebuild as much as you like: only the whole has to be right.",
      "Stuck with a Q or an X? Trade it: it goes to the bottom of the bag and you take the next three. Every tile still has to be used, the traded one included.",
      "The game ends when the bag is empty and every tile is on a sound grid. Your time is your score. Every bag has been laid out once before you see it, so it can always be finished.",
    ],
    board: `There is no board: the tiles lie on a table that grows as the crossword does, and zooms to fit it. A Quick game uses ${KUMIMOJI_BAG[KUMIMOJI_HANDS.quick]} tiles and a Classic one ${KUMIMOJI_BAG[KUMIMOJI_HANDS.classic]}, drawn from the full mix of 144: thirteen A's, eighteen E's, and two each of J, K, Q, X and Z. Any word from two letters to fifteen in SCOWL, Kevin Atkinson's English and American spelling lists, counts.`,
  },
};
