import type { VariantCopy } from "../../gomoku/variants.constants";
import type { PuzzleLevel, PuzzleSpec } from "../puzzles.types";
import type { JiraiGrid, JiraiShape } from "./variants";

/*
 * JIRAI 地雷's TABLES: what it is, how big it comes, what a reader is told, and
 * the words for its ways to play (`variants.ts`). The shapes `puzzles.constants.ts`
 * spreads into its own tables, as `pencil/pencil.constants.ts` does for its six.
 */

/**
 * 9 is the usual board, 7 the quick one (a rectangle only: a shape needs nine each way) and 12 and 16 the long ones.
 * 32 is the Huge one, four times the area of the 16 (Jirai 0.4.0, 2026-10-05): five sizes and room for four tiles, so they are a shelf
 * (`shelves`): 7 to 16, then 9 to 32. It is zoomed on a phone (`TsunagiViewport`), where a square of the whole board fitted to 390
 * pixels is about eleven wide.
 * 1100: the recipe a board's givens begin with (about thirty-five characters) and its 1,024 squares at 32 × 32.
 */
export const JIRAI_SPEC: PuzzleSpec = { sizes: [7, 9, 12, 16, 32], offered: [7, 9, 12, 16], defaultSize: 9, levels: ["easy", "medium", "hard", "extra-hard"], defaultLevel: "medium", mostCells: 1100, shelves: true };

export const JIRAI_SIZE_NAMES: Record<number, { label: string; kanji: string }> = {
  7: { label: "Quick", kanji: "速" },
  9: { label: "Standard", kanji: "定番" },
  12: { label: "Long", kanji: "長" },
  16: { label: "Longest", kanji: "最長" },
  32: { label: "Huge", kanji: "巨大" },
};

/** What a level means: how many of the squares are mines, which Jirai still proves can be finished by clues. */
export const JIRAI_LEVEL_BLURBS: Record<PuzzleLevel, string> = {
  easy: "About one square in eight is a mine.",
  medium: "About one square in six is a mine.",
  hard: "About one square in five is a mine: closer to the expert board of the classic game.",
  "extra-hard": "One square in four is a mine: thicker than the expert board of the classic game, and still never a guess.",
};

export const JIRAI_GRID_DISPLAY: Record<JiraiGrid, { label: string; kanji: string; blurb: string }> = {
  square: { label: "Eight neighbours", kanji: "八方", blurb: "The classic count: every square counts the mines in the eight squares round it, corners included." },
  orthogonal: { label: "Four neighbours", kanji: "四方", blurb: "Every square counts only the four beside it: above, below, left and right." },
  hex: { label: "Hexagons", kanji: "六角", blurb: "The squares are hexagons, and each counts the six that touch it." },
  wrap: { label: "Wraparound", kanji: "環", blurb: "The edges join: the left edge meets the right and the top meets the bottom, so no square is on the edge." },
};

export const JIRAI_SHAPE_DISPLAY: Record<JiraiShape, { label: string; kanji: string }> = {
  rectangle: { label: "Rectangle", kanji: "四角" },
  heart: { label: "Heart", kanji: "心" },
  star: { label: "Star", kanji: "星" },
  hexagon: { label: "Hexagon", kanji: "六角形" },
};

export const JIRAI_DISPLAY: VariantCopy = {
  label: "Jirai",
  kanji: "地雷",
  tagline: "Uncover every safe square without a single guess: each board is dealt so that its numbers alone are enough, on squares, hexagons, a heart or a star.",
  inspiredBy: "the mine-finding puzzle sold as Minesweeper",
  origin:
    "A grid of covered squares with mines hidden among them, uncovered by the numbers that say how many of a square's neighbours are mines. Its beginnings are disputed, and it reached nearly everyone as a game that came with Microsoft Windows in the 1990s. 地雷 (jirai) is Japanese for a land mine. The boards here are dealt by Jirai, our open-source package, which proves each one can be finished from its clues alone, so a guess is never needed.",
  alsoKnownAs: ["Minesweeper", "マインスイーパ"],
  wikipedia: "Minesweeper (video game)",
  rules: [
    "Uncover every square that has no mine. An uncovered square shows how many of its neighbours are mines; a blank one has none, and the squares round it uncover themselves.",
    "Neighbours depend on the board you choose: the eight squares round one, the four beside it, the six hexagons that touch it, or, on a wraparound board, the squares across the edge, because the edges join.",
    "Tap a square to uncover it. Turn on Flag, press and hold a square, or right-click it, to flag a square you know is a mine, and again to take the flag off. Tap an uncovered number that has all its flags to uncover the rest of the squares round it.",
    "You never have to guess. The middle of the board is uncovered for you, and every board is dealt so that the numbers always prove at least one square safe or mined.",
    "A mine you uncover is flagged where it lies and counted as a mistake, which costs what a Hint does; it does not end the puzzle.",
    "Every board has its own mines: the clock starts on your first move and stops when the last safe square is uncovered. Check says how many flags are wrong and how many safe squares are left, never which. Show marks the wrong flags. Hint uncovers a square the numbers prove safe.",
  ],
  board:
    "9×9 is the usual size. 7×7 is quick; 12×12 and 16×16 are longer, and 32×32, the Huge board, is more than a thousand squares: on a phone you zoom in and move about it. The heart, star and hexagon shapes need at least 9×9. Four neighbours gives more blanks and fewer numbers than the classic eight; hexagons count six; wraparound has no edge squares.",
};
