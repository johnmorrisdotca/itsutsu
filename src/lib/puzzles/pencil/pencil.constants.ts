import type { VariantCopy } from "../../gomoku/variants.constants";
import type { PuzzleLevel, PuzzleSpec } from "../puzzles.types";
import type { PencilKind } from "./pencil.types";

/*
 * THE PENCIL PUZZLES' TABLES: what each is, how big it comes, and what a reader
 * is told, in the shapes `puzzles.constants.ts` spreads into its own tables.
 * Their own module since 2026-10-05, when Kazu 1.2.0 brought a dozen grid puzzles:
 * `puzzles.constants.ts` is a table of every puzzle, and this is the one family's
 * share of it. The ones Kazu makes that the site does not offer yet are in
 * `held.constants.ts`.
 *
 * NAMES. John, 2026-10-05: ordinary Japanese words stay ("it's weird that we can't
 * have a game called Shikaku? that is a basic Japanese word"), and a coined name
 * becomes plain English: Kakuro is Cross Sums and Fillomino is Regions, each saying
 * on its rules page, and nowhere else, what it is known as elsewhere. The Japanese
 * beside a name is a plain word for the thing, never a publisher's title for it, as
 * Sudoku's is ナンプレ and not 数独. Each says what it is our version of (`inspiredBy`)
 * without the coined name, because the puzzles are made here by Kazu's code, none of
 * them reproducing a published grid. See `RULES_ATTRIBUTION`.
 */
/** Every level the Pencil puzzles make (Kazu 1.3.0): extra hard is the site's first (2026-10-05). */
const FOUR_LEVELS: readonly PuzzleLevel[] = ["easy", "medium", "hard", "extra-hard"];

/** Every pencil puzzle the site offers, in the order its family shows them: the one list the dispatch, the gates and the tests read. */
export const PENCIL_KIND_LIST: readonly PencilKind[] = ["shikaku", "crossSums", "regions"];

/** Whether a puzzle kind is one of the pencil puzzles. */
export function isPencilKind(kind: string): kind is PencilKind {
  return (PENCIL_KIND_LIST as readonly string[]).includes(kind);
}

/*
 * SIZES, all four levels at every one (Kazu 1.3.0 makes each at each, measured by `docs/plans/pencil/README.md`:
 * the slowest board of any kind, size and level took a browser about half a second). Four boards a puzzle on the
 * set-up, which is all it holds without moving (`picker.test.ts`), and the sizes are the ones Kazu says it offers
 * (`SHIKAKU_SIZES` and the rest, which `pencil.test.ts` holds these to) because they are the ones it measured at.
 * A size Kazu can make and the set-up does not offer is not in `sizes` either: nothing was kept at one.
 */
export const PENCIL_SPECS: Record<PencilKind, PuzzleSpec> = {
  // 196: a 14×14's cells, one character each, a letter a rectangle in the answer.
  shikaku: { sizes: [5, 7, 10, 14], offered: [5, 7, 10, 14], defaultSize: 7, levels: FOUR_LEVELS, defaultLevel: "medium", mostCells: 196 },
  // 720: a 12×12 of cells written as `.` for white and five characters for black (`#` and the two sums), at the very most; its answer is 144.
  crossSums: { sizes: [6, 8, 10, 12], offered: [6, 8, 10, 12], defaultSize: 8, levels: FOUR_LEVELS, defaultLevel: "medium", mostCells: 720 },
  // 144: a 12×12's cells, a character each (a number is one character, to nine and then a letter, and `pencil.test.ts` makes the biggest boards at every level to see none outgrows it).
  regions: { sizes: [6, 8, 10, 12], offered: [6, 8, 10, 12], defaultSize: 8, levels: FOUR_LEVELS, defaultLevel: "medium", mostCells: 144 },
};

/** What each size is for, under its picture on the size tiles. */
export const PENCIL_SIZE_NAMES: Record<PencilKind, Record<number, { label: string; kanji: string }>> = {
  shikaku: {
    5: { label: "Quick", kanji: "速" },
    7: { label: "Standard", kanji: "定番" },
    10: { label: "Long", kanji: "長" },
    14: { label: "Longest", kanji: "最長" },
  },
  crossSums: {
    6: { label: "Quick", kanji: "速" },
    8: { label: "Standard", kanji: "定番" },
    10: { label: "Long", kanji: "長" },
    12: { label: "Longest", kanji: "最長" },
  },
  regions: {
    6: { label: "Quick", kanji: "速" },
    8: { label: "Standard", kanji: "定番" },
    10: { label: "Long", kanji: "長" },
    12: { label: "Longest", kanji: "最長" },
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
    board: "7×7 is the usual size. 5×5 is quick; 10×10 and 14×14 are longer. At every size there are four levels, from easy, where every rectangle can be found by looking, to extra hard.",
  },
  crossSums: {
    label: "Cross Sums",
    kanji: "合計",
    tagline: "Fill the white cells with 1 to 9 so every run adds up to its clue and never repeats a digit.",
    inspiredBy: "the crossword of sums",
    origin:
      "A crossword made of sums. Jacob E. Funk, a Canadian working for Dell Magazines, devised it in 1966 as Cross Sums, and it became hugely popular in Japan, from where its best-known name has come back. 合計 (gōkei) is Japanese for a total. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    country: "CA",
    wikipedia: "Kakuro",
    rules: [
      "Fill every white cell with a digit from 1 to 9.",
      "A black cell holds clues. The number at its top right is the sum of the white cells running to its right; the number at its bottom left is the sum of the white cells running down from it.",
      "Within one run, no digit may appear twice.",
      "Tap a white cell, then a digit.",
      "Every puzzle has exactly one answer. The clock starts on your first digit and stops when every run is right. Check tells you how many cells are wrong, never which.",
      "Cross Sums is known elsewhere as Kakuro, Kakkuro and Cross-sums.",
    ],
    board: "8×8 is the usual size, counting the row and column of sums. 6×6 is quick; 10×10 and 12×12 are longer, with runs of up to nine cells, and best on a tablet or a computer, where the cells are big enough to tap.",
  },
  regions: {
    label: "Regions",
    kanji: "区画",
    tagline: "Fill every cell with a number so that each group of cells with the same number is exactly that many cells big.",
    inspiredBy: "the number-the-regions pencil puzzle",
    origin:
      "A pencil puzzle in which the numbers say how big their region is, published in Japan by Nikoli in the 1980s and since by many others. 区画 (kukaku) is Japanese for a block or plot of land. The puzzles here are made by Kazu, our open-source package, each with exactly one answer.",
    country: "JP",
    wikipedia: "Fillomino",
    rules: [
      "Fill every empty cell with a number. Cells with the same number that touch along a side form a region, and a region's number is how many cells it has.",
      "A 3 sits in a region of three cells, a 1 stands on its own, and so on. A region does not need a printed number in it.",
      "Two regions of the same size may not touch along a side, or they would be one region.",
      "Tap a cell, then a number. The printed numbers stay where they are.",
      "Every puzzle has exactly one answer. The clock starts on your first number and stops when the grid is right. Check tells you how many cells are wrong, never which.",
      "Regions is known elsewhere as Fillomino and as Allied Occupation.",
    ],
    board: "8×8 is the usual size. 6×6 is quick; 10×10 and 12×12 are longer. At every size there are four levels, from easy, with most numbers printed, to extra hard, with as few as the one answer allows.",
  },
};
