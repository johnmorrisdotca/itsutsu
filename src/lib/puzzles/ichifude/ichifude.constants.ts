import type { VariantCopy } from "../../gomoku/variants.constants";
import type { PuzzleSpec } from "../puzzles.types";

/*
 * ICHIFUDE'S SHARE OF THE PUZZLES' TABLES: how big it comes and what a reader is
 * told, in the shapes `puzzles.constants.ts` takes. It lives in Pencil puzzles
 * (`families.data.ts`), the eighth on that shelf: a board to work out and draw on,
 * in one line. The name is the site's own, and so is every board: each is made here
 * from its seed, and none is taken from anywhere.
 */

/** 64: the cells of an 8×8, a character each, for the board and for the line. */
export const ICHIFUDE_SPEC: PuzzleSpec = {
  sizes: [5, 6, 7, 8],
  offered: [5, 6, 7, 8],
  defaultSize: 6,
  levels: ["easy", "medium", "hard"],
  defaultLevel: "medium",
  mostCells: 64,
};

/** What each size is for, under its picture on the size tiles. */
export const ICHIFUDE_SIZE_NAMES: Record<number, { label: string; kanji: string }> = {
  5: { label: "Quick", kanji: "速" },
  6: { label: "Standard", kanji: "定番" },
  7: { label: "Long", kanji: "長" },
  8: { label: "Longest", kanji: "最長" },
};

export const ICHIFUDE_DISPLAY: VariantCopy = {
  label: "Ichifude",
  kanji: "一筆",
  tagline: "Draw one line through every square, passing the numbers in order.",
  inspiredBy: "the one-line number path puzzle",
  origin:
    "A route that visits every point of a board exactly once is called a Hamiltonian path, after the Irish mathematician William Rowan Hamilton, who made a game of one in 1857. Drawn through a grid with its stops numbered, it has become a favourite puzzle of the day. 一筆 means one stroke of the brush: the line is never lifted. The boards here are made by our own code, a new one from every seed.",
  wikipedia: "Hamiltonian_path",
  rules: [
    "Draw one line from the square numbered 1 to the highest number, moving up, down, left or right, one square at a time.",
    "The line must pass the numbers in order and go through every square exactly once. A number out of its turn stops the line.",
    "Drag from the end of the line, or tap a square beside it. Drag back along the line, or tap a square on it, to take back what comes after.",
    "Every board has exactly one answer. The clock starts on your first step and stops when the last square is filled. Check tells you how many squares are off the answer, never which.",
  ],
  board: "6×6 is the usual size. 5×5 is quick; 7×7 and 8×8 are longer. At every size there are three levels: easy gives plenty of numbers, and hard only the ones the one answer needs.",
};
