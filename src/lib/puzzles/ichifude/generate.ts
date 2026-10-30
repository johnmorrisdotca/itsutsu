import { encodeLine, encodeNumbers, neighbours } from "./code";
import { seededRandom, type Random } from "../random";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { searchLines } from "./solve";

/**
 * MAKING AN ICHIFUDE BOARD, in the browser, from a seed.
 *
 * The answer comes first: a line through every cell, shaken from a plain back and
 * forth by the backbite move (join an end of the line to a cell beside it and turn
 * round what is cut off), which wanders over the lines of a grid and leaves no mark
 * of where it started. Then the numbers: the two ends and an even spread along the
 * way, more wherever the solver finds a second answer, until it finds exactly one.
 * Then numbers come off, in an order the seed decides, each only if there is still
 * exactly one answer, down to as many as the level asks for.
 *
 * So a level is how much the numbers tell you: easy points the way every few cells,
 * and hard leaves only what the one answer needs.
 */

/** How many cells to a number the level aims for; hard takes off every number it can. */
const CELLS_A_NUMBER: Record<"easy" | "medium", number> = { easy: 3, medium: 4.5 };

/** The fewest numbers a level aims for, at a side: enough that a small board is still a puzzle. */
function numbersWanted(size: number, level: PuzzleLevel): number {
  const cells = size * size;
  if (level === "easy") return Math.round(cells / CELLS_A_NUMBER.easy);
  if (level === "medium") return Math.round(cells / CELLS_A_NUMBER.medium);
  return 2;
}

/** A plain back and forth across the board, the line every shake begins from. */
function backAndForth(size: number): number[] {
  const line: number[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) line.push(row * size + (row % 2 === 0 ? column : size - 1 - column));
  }
  return line;
}

/** One line through every cell: a back and forth, turned by the backbite move many times over. */
export function shakenLine(size: number, random: Random): number[] {
  const line = backAndForth(size);
  const placeOf = new Int32Array(size * size);
  line.forEach((cell, place) => {
    placeOf[cell] = place;
  });
  const turns = 20 * size * size;
  for (let turn = 0; turn < turns; turn += 1) {
    const fromEnd = random() < 0.5;
    const head = fromEnd ? line[line.length - 1]! : line[0]!;
    const around = neighbours(head, size);
    const beside = around[Math.floor(random() * around.length)]!;
    const at = placeOf[beside]!;
    const low = fromEnd ? at + 1 : 0;
    const high = fromEnd ? line.length - 1 : at - 1;
    // The cell before the head along the line turns nothing; the rest cut the line there and turn round the piece cut off.
    if (low >= high) continue;
    for (let a = low, b = high; a < b; a += 1, b -= 1) {
      const left = line[a]!;
      const right = line[b]!;
      line[a] = right;
      line[b] = left;
      placeOf[right] = a;
      placeOf[left] = b;
    }
  }
  return line;
}

/** The numbers on the board, a number a cell, for these places along the line. */
function numbersAt(line: readonly number[], places: readonly number[]): number[] {
  const numbers = new Array<number>(line.length).fill(0);
  [...places].sort((a, b) => a - b).forEach((place, index) => {
    numbers[line[place]!] = index + 1;
  });
  return numbers;
}

/** Whether these numbers leave exactly one answer, proved by a search that finished. */
function oneAnswer(size: number, line: readonly number[], places: readonly number[]): { yes: boolean; other: number[] | null } {
  const search = searchLines(size, numbersAt(line, places), 2);
  if (search.found === 1 && !search.exhausted) return { yes: true, other: null };
  const other = search.lines.find((each) => each.some((cell, place) => cell !== line[place])) ?? null;
  return { yes: false, other };
}

/**
 * The place along the line to number so that another answer stops being one: the cell where the other answer first
 * leaves the line, numbered where the line comes to it, makes the other answer reach it too soon. Where that cell is
 * numbered already, any later cell the two answers put in different places.
 */
function placeThatRefutes(line: readonly number[], other: readonly number[], places: ReadonlySet<number>, placeOf: Int32Array): number {
  const parts = other.findIndex((cell, place) => cell !== line[place]);
  const first = placeOf[other[parts]!]!;
  if (!places.has(first)) return first;
  for (let place = parts; place < line.length; place += 1) if (other[place] !== line[place] && !places.has(place)) return place;
  return middleOfLongestGap(places);
}

/** The middle of the longest run of the line with no number on it. */
function middleOfLongestGap(places: ReadonlySet<number>): number {
  const sorted = [...places].sort((a, b) => a - b);
  let widest = 1;
  for (let at = 1; at < sorted.length; at += 1) if (sorted[at]! - sorted[at - 1]! > sorted[widest]! - sorted[widest - 1]!) widest = at;
  return Math.floor((sorted[widest]! + sorted[widest - 1]!) / 2);
}

export function generateIchifude(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  const line = shakenLine(size, random);
  const cells = size * size;
  const wanted = numbersWanted(size, level);

  // Begin with an even spread of the numbers the level wants, or a few for a level that wants none.
  const opening = Math.max(wanted, Math.round(cells / CELLS_A_NUMBER.medium));
  const places = new Set<number>([0, cells - 1]);
  for (let index = 1; index < opening - 1; index += 1) places.add(Math.round((index * (cells - 1)) / (opening - 1)));

  // Add a number wherever a second answer leaves the line, or at the middle of the longest gap where the search could not tell.
  const placeOf = new Int32Array(cells);
  line.forEach((cell, place) => {
    placeOf[cell] = place;
  });
  for (let tries = 0; tries < cells && places.size < cells; tries += 1) {
    const { yes, other } = oneAnswer(size, line, [...places]);
    if (yes) break;
    places.add(other === null ? middleOfLongestGap(places) : placeThatRefutes(line, other, places, placeOf));
  }

  // Take numbers off, in the seed's order, for as long as there is one answer and the level wants fewer.
  const removable = [...places].filter((place) => place !== 0 && place !== cells - 1);
  for (let at = removable.length - 1; at > 0; at -= 1) {
    const other = Math.floor(random() * (at + 1));
    [removable[at], removable[other]] = [removable[other]!, removable[at]!];
  }
  for (const place of removable) {
    if (places.size <= wanted) break;
    places.delete(place);
    if (!oneAnswer(size, line, [...places]).yes) places.add(place);
  }

  return { kind: "ichifude", size, level, seed, givens: encodeNumbers(numbersAt(line, [...places])), solution: encodeLine(line, size) };
}
