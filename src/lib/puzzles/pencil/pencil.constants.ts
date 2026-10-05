import type { VariantCopy } from "../../gomoku/variants.constants";
import type { PuzzleLevel, PuzzleSpec } from "../puzzles.types";
import type { PencilKind } from "./pencil.types";

/*
 * THE PENCIL PUZZLES' TABLES: what each is, how big it comes, and what a reader
 * is told, in the shapes `puzzles.constants.ts` spreads into its own tables.
 * Their own module since 2026-10-05, when six arrived at once from Kazu 1.2.0:
 * `puzzles.constants.ts` is a table of every puzzle, and this is the one family's
 * share of it.
 *
 * NAMES. John, 2026-09-24: "do best guesses for names. I can change later."
 * Each goes by the name the package and the world's puzzle sites know it by
 * (Shikaku, Akari, Slitherlink, Hitori, Fillomino, Kakuro), as Futoshiki and
 * Skyscrapers do; the Japanese beside it is a plain word for the thing, never a
 * publisher's title for it, as Sudoku's is ナンプレ and not 数独. Each says what it
 * is our version of (`inspiredBy`) because the puzzles are made here by Kazu's
 * code, none of them reproducing a published grid. See `RULES_ATTRIBUTION`.
 */
const THREE_LEVELS: readonly PuzzleLevel[] = ["easy", "medium", "hard"];

/** Every pencil puzzle, in the order its family shows them: the one list the dispatch, the gates and the tests read. */
export const PENCIL_KIND_LIST: readonly PencilKind[] = ["shikaku", "akari", "slitherlink", "hitori", "fillomino", "kakuro"];

/** Whether a puzzle kind is one of the pencil puzzles. */
export function isPencilKind(kind: string): kind is PencilKind {
  return (PENCIL_KIND_LIST as readonly string[]).includes(kind);
}

export const PENCIL_SPECS: Record<PencilKind, PuzzleSpec> = {
  // 144: a 12×12's cells, one character each, a letter a rectangle in the answer.
  shikaku: { sizes: [5, 7, 9, 12], offered: [5, 7, 9, 12], defaultSize: 7, levels: THREE_LEVELS, defaultLevel: "medium", mostCells: 144 },
  // 144: the cells of a 12×12; a bulb is an `o`.
  akari: { sizes: [5, 7, 9, 12], offered: [5, 7, 9, 12], defaultSize: 7, levels: ["medium"], defaultLevel: "medium", mostCells: 144 },
  // 220: the edges of a 10×10, 2 × 10 × 11, which its answer writes a character each.
  slitherlink: { sizes: [4, 5, 7, 10], offered: [4, 5, 7, 10], defaultSize: 5, levels: ["medium"], defaultLevel: "medium", mostCells: 220 },
  // 49: a 7×7's cells.
  hitori: { sizes: [5, 7], offered: [5, 7], defaultSize: 5, levels: ["medium"], defaultLevel: "medium", mostCells: 49 },
  /*
   * 36 at most: Kazu makes none larger (`FILLOMINO_GENERATOR_MOST_CELLS`). A 6×6 is easy only: its medium puzzles
   * took a browser a second and a half at the worst (measured over twenty seeds), and a page that stops for that
   * long is not a puzzle that opens.
   */
  fillomino: { sizes: [4, 5, 6], offered: [4, 5, 6], defaultSize: 5, levels: ["easy", "medium"], levelsAt: { 6: ["easy"] }, defaultLevel: "easy", mostCells: 36 },
  // 500: a 10×10 of cells written as `.` for white and five characters for black (`#` and the two sums); its answer is 100.
  kakuro: { sizes: [10], offered: [10], defaultSize: 10, levels: ["medium"], defaultLevel: "medium", mostCells: 500 },
};

/** What each size is for, under its picture on the size tiles. */
export const PENCIL_SIZE_NAMES: Record<PencilKind, Record<number, { label: string; kanji: string }>> = {
  shikaku: {
    5: { label: "Quick", kanji: "速" },
    7: { label: "Standard", kanji: "定番" },
    9: { label: "Long", kanji: "長" },
    12: { label: "Longest", kanji: "最長" },
  },
  akari: {
    5: { label: "Quick", kanji: "速" },
    7: { label: "Standard", kanji: "定番" },
    9: { label: "Long", kanji: "長" },
    12: { label: "Longest", kanji: "最長" },
  },
  slitherlink: {
    4: { label: "Quick", kanji: "速" },
    5: { label: "Standard", kanji: "定番" },
    7: { label: "Long", kanji: "長" },
    10: { label: "Longest", kanji: "最長" },
  },
  hitori: {
    5: { label: "Standard", kanji: "定番" },
    7: { label: "Long", kanji: "長" },
  },
  fillomino: {
    4: { label: "Quick", kanji: "速" },
    5: { label: "Standard", kanji: "定番" },
    6: { label: "Long", kanji: "長" },
  },
  kakuro: {
    10: { label: "Standard", kanji: "定番" },
  },
};

/** What a level means for the pencil puzzles that have more than one: Kazu's generation profiles, not a rating of how hard they feel. */
export const PENCIL_LEVEL_BLURBS: Partial<Record<PencilKind, Partial<Record<PuzzleLevel, string>>>> = {
  shikaku: {
    easy: "Mostly small rectangles: a number has only a few places it can reach.",
    medium: "A mix of small and larger rectangles.",
    hard: "Larger rectangles, so each number has more places it could stretch to.",
  },
  fillomino: {
    easy: "More numbers printed, so most regions are half drawn already.",
    medium: "Fewer numbers printed: some regions have to be worked out from the ones beside them.",
  },
};

export const PENCIL_DISPLAY: Record<PencilKind, VariantCopy> = {
  shikaku: {
    label: "Shikaku",
    kanji: "四角",
    tagline: "Cut the grid into rectangles, each holding one number that says how many cells it covers.",
    inspiredBy: "Shikaku, the rectangle-dividing pencil puzzle",
    origin:
      "A pencil puzzle published in Japan by Nikoli as 四角に切れ (shikaku ni kire, 'cut into rectangles'), and found elsewhere as Divide by Box and Rectangles. 四角 (shikaku) is the word for a rectangle or a square. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    alsoKnownAs: ["Divide by Box", "Rectangles", "Shikaku ni kire"],
    country: "JP",
    wikipedia: "Shikaku",
    rules: [
      "Cut the grid into rectangles so that every cell is in exactly one. A square counts as a rectangle.",
      "Every rectangle holds exactly one number, and the number is its area: how many cells it covers.",
      "Tap one corner of a rectangle and then the opposite corner to draw it; or press on one corner and drag to the other. A rectangle drawn over others takes their place.",
      "Remove, under the board, lets you tap a rectangle to take it away. Undo takes back the last change.",
      "Every puzzle has exactly one answer. The clock starts on your first rectangle and stops when the last cell is covered rightly. Check tells you how many rectangles are wrong, never which.",
    ],
    board: "7×7 is the usual size. 5×5 is quick; 9×9 and 12×12 are longer. Easy puzzles have mostly small rectangles; hard ones have larger ones.",
  },
  akari: {
    label: "Akari",
    kanji: "明かり",
    tagline: "Place bulbs so that every white square is lit, no two bulbs light each other, and every number has its bulbs beside it.",
    inspiredBy: "Akari, the lamps-in-a-gallery pencil puzzle",
    origin:
      "A pencil puzzle published in Japan by Nikoli as Light Up, 美術館 (bijutsukan, 'art gallery'), and also called Akari, 明かり, 'light'. Bulbs shine along their row and column until a black square stops them. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    alsoKnownAs: ["Light Up", "Bijutsukan"],
    country: "JP",
    wikipedia: "Light Up (puzzle)",
    rules: [
      "Put a bulb in some of the white squares. A bulb lights its own square and every white square in line with it, across and down, until a black square or the edge of the board.",
      "Every white square must be lit.",
      "No bulb may be lit by another: two bulbs never see each other along a row or column.",
      "A number in a black square says how many bulbs touch it, above, below and to each side. A black square with no number can have any.",
      "Tap a white square to put a bulb in it, and again to take it out. Every puzzle has exactly one answer. The clock starts on your first bulb and stops when the board is right. Check tells you how many bulbs are wrong, never which.",
    ],
    board: "7×7 is the usual size. 5×5 is quick; 9×9 and 12×12 are longer.",
  },
  slitherlink: {
    label: "Slitherlink",
    kanji: "輪",
    tagline: "Draw one loop along the grid's lines so that every number has exactly that many of its four sides on the loop.",
    inspiredBy: "Slitherlink, the loop-drawing pencil puzzle",
    origin:
      "A loop puzzle developed by the Japanese publisher Nikoli and found under many names: Slitherlink, Fences, Takegaki, Loop the Loop and Loopy among them. 輪 (wa) is Japanese for a ring or loop. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    alsoKnownAs: ["Fences", "Takegaki", "Loop the Loop", "Loopy"],
    country: "JP",
    wikipedia: "Slitherlink",
    rules: [
      "Draw a single closed loop along the lines of the grid, joining the dots. It never crosses itself or branches.",
      "A number in a cell says how many of that cell's four sides the loop runs along. A cell with no number can have any.",
      "Tap a line between two dots to draw it, and again to take it out.",
      "Every puzzle has exactly one answer. The clock starts on your first line and stops when the loop is right. Check tells you how many lines are wrong, never which.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 7×7 and 10×10 are longer.",
  },
  hitori: {
    label: "Hitori",
    kanji: "一人",
    tagline: "Shade squares so no number repeats in any row or column, no two shaded squares touch, and the squares left stay joined up.",
    inspiredBy: "Hitori, the shade-the-repeats pencil puzzle",
    origin:
      "A pencil puzzle published in Japan by Nikoli as ひとりにしてくれ (hitori ni shite kure, 'leave me alone'). 一人 (hitori) means one person, or alone: each number left unshaded stands alone in its row and column. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    alsoKnownAs: ["Hitori ni shite kure"],
    country: "JP",
    wikipedia: "Hitori",
    rules: [
      "Shade some of the squares so that no number appears twice among the unshaded squares in any row or column.",
      "Two shaded squares may not touch along a side.",
      "All the unshaded squares must be joined up, one group, side to side: shading may not cut the board in two.",
      "Tap a square to shade it, and again to clear it.",
      "Every puzzle has exactly one answer. The clock starts on your first square and stops when the board is right. Check tells you how many squares are wrong, never which.",
    ],
    board: "5×5 is the usual size, and 7×7 is longer.",
  },
  fillomino: {
    label: "Fillomino",
    kanji: "区画",
    tagline: "Fill every cell with a number so that each group of cells with the same number is exactly that many cells big.",
    inspiredBy: "Fillomino, the number-the-regions pencil puzzle",
    origin:
      "A pencil puzzle in which the numbers say how big their region is, published in Japan by Nikoli in the 1980s and since by many others, sometimes as Allied Occupation. 区画 (kukaku) is Japanese for a block or plot of land. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    alsoKnownAs: ["Allied Occupation"],
    country: "JP",
    wikipedia: "Fillomino",
    rules: [
      "Fill every empty cell with a number. Cells with the same number that touch along a side form a region, and a region's number is how many cells it has.",
      "A 3 sits in a region of three cells, a 1 stands on its own, and so on. A region does not need a printed number in it.",
      "Two regions of the same size may not touch along a side, or they would be one region.",
      "Tap a cell, then a number. The printed numbers stay where they are.",
      "Every puzzle has exactly one answer. The clock starts on your first number and stops when the grid is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 6×6 is longer, and easy only.",
  },
  kakuro: {
    label: "Kakuro",
    kanji: "合計",
    tagline: "Fill the white cells with 1 to 9 so every run adds up to its clue and never repeats a digit.",
    inspiredBy: "Kakuro, the crossword-sums pencil puzzle",
    origin:
      "A crossword made of sums. Jacob E. Funk, a Canadian working for Dell Magazines, devised it in 1966 as Cross Sums; in Japan, where it became hugely popular, it is Kakuro, short for 加算クロス (kasan kurosu, 'addition cross'), and that name is now used almost everywhere. 合計 (gōkei) is Japanese for a total. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    alsoKnownAs: ["Cross Sums", "Cross-sums", "Kakkuro"],
    country: "CA",
    wikipedia: "Kakuro",
    rules: [
      "Fill every white cell with a digit from 1 to 9.",
      "A black cell holds clues. The number at its top right is the sum of the white cells running to its right; the number at its bottom left is the sum of the white cells running down from it.",
      "Within one run, no digit may appear twice.",
      "Tap a white cell, then a digit. Tap the cell again to step it on, 1, 2, 3 and round to empty.",
      "Every puzzle has exactly one answer. The clock starts on your first digit and stops when every run is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "Kakuro comes in one size here, 10×10, with runs of two to nine cells. It is best on a tablet or a computer, where the cells are big enough to tap.",
  },
};
