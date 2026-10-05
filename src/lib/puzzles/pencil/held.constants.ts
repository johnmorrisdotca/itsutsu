import type { VariantCopy } from "../../gomoku/variants.constants";
import type { PuzzleSpec } from "../puzzles.types";
import type { HeldPencilKind } from "./pencil.types";

/*
 * THE PENCIL PUZZLES KAZU MAKES THAT THE SITE DOES NOT OFFER, HELD. John, 2026-10-05:
 * "ship four now". Akari, Loop (Kazu's Slitherlink) and Hitori work end to end here
 * (`held.ts`, the engines and `heldInput.ts`, `heldGeometry.ts` and `heldDraw.ts` beside
 * it, all tested in `held.test.ts`), but Kazu 1.2.0's generators for them are small
 * families of layouts: an Akari 7×7 always has ten white squares, a Slitherlink clues every
 * cell and mostly with 0, a Hitori shades three or four squares. They wait for a harder Kazu
 * and an extra-hard level (board rows `kazu-harder-akari-slitherlink-and-hitori-and-easy-medium-hard-and-extra-hard-for`
 * and `pencil-puzzles-an-extra-hard-level-on-the-site-and-akari-slitherlink-and-hitori`).
 *
 * No kind here is a `PuzzleKind`, so no page, card, link, picture, XP award or date reaches
 * one, and nothing of Kazu's three engines is in a bundle. TO BRING ONE BACK: add its key to
 * `PuzzleKind` and `PencilKind`, its engine to `engines.ts`, its entries from this file to
 * `pencil.constants.ts`, its draw, input and geometry from the held files to `pencilDraw.ts`,
 * `input.ts` and `geometry.ts` (the presses and the geometry are there already, for every
 * kind), its slug (akari, loop, hitori), weight (`points.constants.ts` says Akari 1.25,
 * Loop 0.8, Hitori 0.8), `families.data.ts` row, a picture and a browser case: the same list
 * as any new puzzle, which `puzzles.coverage.test.ts` holds. Loop, drawn on edges, also needs
 * its edge press back in `PencilBoard.tsx` (`edgeAt`), its Enter and Space on an edge in
 * `PencilSolve.tsx`, and the `where` its steps are said with in `PencilSolve.tsx` and
 * `FinishedPuzzle.tsx` (`edgeWords`). The names they will go by: Akari (明かり), Loop (輪; Kazu's
 * Slitherlink, "known elsewhere as" on its rules page only) and Hitori (一人).
 */
export const HELD_PENCIL_KIND_LIST: readonly HeldPencilKind[] = ["akari", "slitherlink", "hitori"];

export const HELD_SPECS: Record<HeldPencilKind, PuzzleSpec> = {
  // 144: the cells of a 12×12; a bulb is an `o`.
  akari: { sizes: [5, 7, 9, 12], offered: [5, 7, 9, 12], defaultSize: 7, levels: ["medium"], defaultLevel: "medium", mostCells: 144 },
  // 220: the edges of a 10×10, 2 × 10 × 11, which its answer writes a character each.
  slitherlink: { sizes: [4, 5, 7, 10], offered: [4, 5, 7, 10], defaultSize: 5, levels: ["medium"], defaultLevel: "medium", mostCells: 220 },
  // 49: a 7×7's cells.
  hitori: { sizes: [5, 7], offered: [5, 7], defaultSize: 5, levels: ["medium"], defaultLevel: "medium", mostCells: 49 },
};

export const HELD_SIZE_NAMES: Record<HeldPencilKind, Record<number, { label: string; kanji: string }>> = {
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
};

export const HELD_DISPLAY: Record<HeldPencilKind, VariantCopy> = {
  akari: {
    label: "Akari",
    kanji: "明かり",
    tagline: "Place bulbs so that every white square is lit, no two bulbs light each other, and every number has its bulbs beside it.",
    inspiredBy: "the lamps-in-a-gallery pencil puzzle",
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
    label: "Loop",
    kanji: "輪",
    tagline: "Draw one loop along the grid's lines so that every number has exactly that many of its four sides on the loop.",
    inspiredBy: "the loop-drawing pencil puzzle",
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
      "Loop is known elsewhere as Slitherlink, Fences and Loopy.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 7×7 and 10×10 are longer.",
  },
  hitori: {
    label: "Hitori",
    kanji: "一人",
    tagline: "Shade squares so no number repeats in any row or column, no two shaded squares touch, and the squares left stay joined up.",
    inspiredBy: "the shade-the-repeats pencil puzzle",
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
};
