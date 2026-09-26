import type { PuzzleLevel } from "../puzzles.types";

/**
 * KOUSHI 格子: six five-letter words woven into a 5×5 lattice, their letters
 * scrambled, put right by swapping two letters at a time.
 *
 * THE LATTICE. Three words across, on rows 1, 3 and 5, and three down, on
 * columns 1, 3 and 5 (0, 2 and 4 here, counted from nought). Every word
 * crosses three others, so nine cells are shared by an across word and a down
 * word, and 21 cells hold a letter. The four cells at rows 2 and 4, columns 2
 * and 4 are nobody's: the holes of the lattice, where the board shows through.
 *
 * AS STRINGS, for an address, a POST body and a kept run — 25 characters a
 * grid, row by row, "." for a hole:
 * - the GIVENS are the scrambled grid in lower case, then the solution in
 *   CAPITALS: 50 characters. Capitals, as Gomoji's givens are, so the givens
 *   can never be handed in as an answer.
 * - an ANSWER, and a run's progress, is the grid as it stands in lower case,
 *   then every swap made, in order, each as two capitals A–Y naming the two
 *   cells swapped (A the top-left cell, Y the bottom-right). The swaps are
 *   what the server believes: it plays them again from the scramble, and the
 *   grid they make must be the grid written.
 */

export const LATTICE_SIDE = 5;
export const LATTICE_CELLS = LATTICE_SIDE * LATTICE_SIDE;

/** The four cells no word passes through: rows 2 and 4, columns 2 and 4, counted from one. */
export const LATTICE_HOLES: readonly number[] = [6, 8, 16, 18];

const HOLE_SET = new Set(LATTICE_HOLES);

export function isHole(cell: number): boolean {
  return HOLE_SET.has(cell);
}

/** The 21 cells that hold a letter, in reading order. */
export const LETTER_CELLS: readonly number[] = Array.from({ length: LATTICE_CELLS }, (_, cell) => cell).filter((cell) => !isHole(cell));

/** The six words' cells: across on rows 0, 2 and 4, then down on columns 0, 2 and 4, each in reading order. */
export const LATTICE_LINES: readonly (readonly number[])[] = [
  ...[0, 2, 4].map((row) => Array.from({ length: LATTICE_SIDE }, (_, col) => row * LATTICE_SIDE + col)),
  ...[0, 2, 4].map((col) => Array.from({ length: LATTICE_SIDE }, (_, row) => row * LATTICE_SIDE + col)),
];

/** Which of the six words each cell is in: two for a crossing, one for any other letter, none for a hole. */
export const LINES_OF: readonly (readonly number[])[] = Array.from({ length: LATTICE_CELLS }, (_, cell) =>
  LATTICE_LINES.flatMap((line, at) => (line.includes(cell) ? [at] : [])),
);

/** The words a grid spells, across first then down: six strings of five. */
export function wordsOf(grid: readonly string[]): string[] {
  return LATTICE_LINES.map((line) => line.map((cell) => grid[cell] ?? "").join(""));
}

/*
 * THE SWAPS A LEVEL GIVES. Every puzzle is made so the fewest swaps that solve
 * it is exactly the level's number, and the allowance is five more, so a
 * perfect solve at any level leaves five swaps unused: five marks at the end.
 * Medium is the published game's count, ten and fifteen.
 */
export const LEAST_SWAPS: Record<PuzzleLevel, number> = { easy: 8, medium: 10, hard: 12 };
export const SPARE_SWAPS = 5;

export function swapsAllowed(level: PuzzleLevel): number {
  return LEAST_SWAPS[level] + SPARE_SWAPS;
}

/** The most swaps any level allows: what a kept run or an answer may hold. */
export const MOST_SWAPS = Math.max(...Object.values(LEAST_SWAPS)) + SPARE_SWAPS;

/** The longest answer: a grid, then two characters for every swap the most generous level gives. */
export const KOUSHI_ANSWER_MOST = LATTICE_CELLS + 2 * MOST_SWAPS;

/** The letters a grid may be written in: English's plain alphabet, and German's umlauts for the day it is played there. */
const LETTER = /^[a-zäöü]$/;

/** One swap: the two cells whose letters change places, the smaller first. */
export type Swap = readonly [number, number];

/** A grid as 25 characters, or null for a string that is not one: every letter cell a letter, every hole a ".". */
export function decodeGrid(code: string): string[] | null {
  if (typeof code !== "string" || code.length !== LATTICE_CELLS) return null;
  const grid = [...code];
  for (let cell = 0; cell < LATTICE_CELLS; cell += 1) {
    const char = grid[cell]!;
    if (isHole(cell) ? char !== "." : !LETTER.test(char)) return null;
  }
  return grid;
}

export function encodeGrid(grid: readonly string[]): string {
  return grid.map((char, cell) => (isHole(cell) ? "." : char)).join("");
}

/** The givens: the scramble a solver starts from, and the grid it must become. */
export type KoushiGivens = { scramble: string[]; solution: string[] };

export function encodeGivens(scramble: readonly string[], solution: readonly string[]): string {
  return encodeGrid(scramble) + encodeGrid(solution).toUpperCase();
}

export function decodeGivens(code: string): KoushiGivens | null {
  if (typeof code !== "string" || code.length !== 2 * LATTICE_CELLS) return null;
  const upper = code.slice(LATTICE_CELLS);
  if (upper !== upper.toUpperCase()) return null;
  const scramble = decodeGrid(code.slice(0, LATTICE_CELLS));
  const solution = decodeGrid(upper.toLowerCase());
  return scramble === null || solution === null ? null : { scramble, solution };
}

const CELL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXY";

export function encodeSwaps(swaps: readonly Swap[]): string {
  return swaps.map(([a, b]) => CELL_LETTERS[a]! + CELL_LETTERS[b]!).join("");
}

/** The swaps a string names, or null for one that is not whole pairs of two different letter cells. */
export function decodeSwaps(code: string): Swap[] | null {
  if (code.length % 2 !== 0) return null;
  const swaps: Swap[] = [];
  for (let at = 0; at < code.length; at += 2) {
    const a = CELL_LETTERS.indexOf(code[at]!);
    const b = CELL_LETTERS.indexOf(code[at + 1]!);
    if (a < 0 || b < 0 || a === b || isHole(a) || isHole(b)) return null;
    swaps.push([a, b]);
  }
  return swaps;
}

/** A grid as it stands and the swaps that made it: an answer, or a kept run's progress. */
export type KoushiPlay = { grid: string[]; swaps: Swap[] };

export function encodePlay(grid: readonly string[], swaps: readonly Swap[]): string {
  return encodeGrid(grid) + encodeSwaps(swaps);
}

export function decodePlay(code: string): KoushiPlay | null {
  if (typeof code !== "string" || code.length < LATTICE_CELLS || code.length > KOUSHI_ANSWER_MOST) return null;
  const grid = decodeGrid(code.slice(0, LATTICE_CELLS));
  const swaps = decodeSwaps(code.slice(LATTICE_CELLS));
  return grid === null || swaps === null ? null : { grid, swaps };
}

/** A grid with two cells' letters changed places; the grid handed in is left as it was. */
export function swapped(grid: readonly string[], [a, b]: Swap): string[] {
  const next = [...grid];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return next;
}

/** The grid a run of swaps makes from a starting grid. */
export function replay(start: readonly string[], swaps: readonly Swap[]): string[] {
  return swaps.reduce<string[]>((grid, swap) => swapped(grid, swap), [...start]);
}

/** What a letter tells the solver: in its place, wanted elsewhere in one of its words, or wanted by neither. */
export type LatticeMark = "hit" | "near" | "miss";

/**
 * EACH LETTER'S COLOUR, against the solution. Green (`hit`) is the right
 * letter in the right cell. Otherwise, each word the cell is in is asked,
 * alone: the letters that word still needs are its cells' solution letters
 * where they are not yet green, and its cells not yet green are read in order
 * — left to right across, top to bottom down — each lighting yellow (`near`)
 * if the word still needs its letter, and using that copy up. So a word that
 * needs one E lights one E and not two, the first it comes to.
 *
 * A crossing is in two words and is yellow if EITHER wants its letter: it may
 * belong in the word across or the word down, and the colour does not say
 * which. That is the published game's rule for its corners. Anything else is
 * plain (`miss`): neither of its words wants that letter anywhere it is not
 * already green. Holes are nobody's and are never marked.
 */
export function markLattice(grid: readonly string[], solution: readonly string[]): (LatticeMark | null)[] {
  const marks: (LatticeMark | null)[] = Array.from({ length: LATTICE_CELLS }, (_, cell) =>
    isHole(cell) ? null : grid[cell] === solution[cell] ? "hit" : "miss",
  );
  for (const line of LATTICE_LINES) {
    const wanted = new Map<string, number>();
    for (const cell of line) {
      if (marks[cell] !== "hit") wanted.set(solution[cell]!, (wanted.get(solution[cell]!) ?? 0) + 1);
    }
    for (const cell of line) {
      if (marks[cell] === "hit") continue;
      const left = wanted.get(grid[cell]!) ?? 0;
      if (left > 0) {
        marks[cell] = "near";
        wanted.set(grid[cell]!, left - 1);
      }
    }
  }
  return marks;
}

/** Whether every letter is in its place. */
export function isSolved(grid: readonly string[], solution: readonly string[]): boolean {
  return LETTER_CELLS.every((cell) => grid[cell] === solution[cell]);
}
