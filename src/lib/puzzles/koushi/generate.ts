import { answersFor, type GomojiLanguage } from "../gomoji/code";
import type { Puzzle, PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled, type Random } from "../random";
import {
  LATTICE_CELLS,
  LATTICE_LINES,
  LATTICE_SIDE,
  LEAST_SWAPS,
  LETTER_CELLS,
  encodeGivens,
  encodePlay,
  wordsOf,
} from "./lattice";
import { leastSwaps, swapsSolving } from "./leastSwaps";

/**
 * MAKING A KOUSHI, in the browser, from a seed.
 *
 * First the six words. A word across is drawn from the level's list; the three
 * words down must start with its first, third and fifth letters; and the rows
 * across on rows 3 and 5 must then be words holding the letters the downs put
 * at their crossings. Drawn from the lists Gomoji draws its answers from
 * (`answersFor`), so any language Gomoji plays in can make one: easy and medium
 * from the commonest words, hard from the wider list. Six different words.
 *
 * Then the scramble. The 21 letters are moved round cycles of cells chosen at
 * random — a cycle of k cells takes k − 1 swaps to undo — so that the cells
 * moved less the cycles is the level's number (`LEAST_SWAPS`). Repeated letters
 * can make a scramble shorter to undo than the cycles say, so the true fewest
 * swaps is worked out (`leastSwaps`) and a scramble is kept only when it is
 * exactly the level's number and no word is already right. `puzzle.solution`
 * is an answer the check accepts: the solved grid and a shortest run of swaps
 * that reaches it (`swapsSolving`).
 *
 * Deterministic in the seed, like every generator here.
 */

/** How many draws of words, and of scrambles, before a seed is given up for its neighbour. Neither is ever near. */
const WORD_TRIES = 20_000;
const SCRAMBLE_TRIES = 400;

const LEVEL_SALT: Record<PuzzleLevel, number> = { easy: 0, medium: 1_000_003, hard: 2_000_006 };

export function generateKoushi(level: PuzzleLevel, seed: number, lang: GomojiLanguage = "en", kind: PuzzleKind = "koushi"): Puzzle {
  for (let bump = 0; bump < 50; bump += 1) {
    // Salted by the level, so one day's easy and medium are different words, not one lattice scrambled twice.
    const random = seededRandom(seed + bump * 7_919 + LEVEL_SALT[level]);
    const solution = latticeOf(answersFor(LATTICE_SIDE, level !== "hard", lang), random);
    if (solution === null) continue;
    const scramble = scrambleOf(solution, LEAST_SWAPS[level], random);
    if (scramble === null) continue;
    const swaps = swapsSolving(scramble, solution, LETTER_CELLS)!;
    return { kind, size: LATTICE_SIDE, level, seed, givens: encodeGivens(scramble, solution), solution: encodePlay(solution, swaps) };
  }
  throw new Error(`No Koushi could be made from seed ${seed}.`);
}

/** Six different words in the lattice, as a grid of 25 with "." in the holes, or null if none was found in time. */
export function latticeOf(words: readonly string[], random: Random): string[] | null {
  if (words.length === 0) return null;
  const byFirst = new Map<string, string[]>();
  const byCrossings = new Map<string, string[]>();
  for (const word of words) {
    byFirst.set(word[0]!, [...(byFirst.get(word[0]!) ?? []), word]);
    const crossings = word[0]! + word[2]! + word[4]!;
    byCrossings.set(crossings, [...(byCrossings.get(crossings) ?? []), word]);
  }
  const pick = (from: readonly string[] | undefined): string | null => (from === undefined || from.length === 0 ? null : from[Math.floor(random() * from.length)]!);
  for (let tries = 0; tries < WORD_TRIES; tries += 1) {
    const top = pick(words)!;
    const downs = [pick(byFirst.get(top[0]!)), pick(byFirst.get(top[2]!)), pick(byFirst.get(top[4]!))];
    if (downs.some((word) => word === null)) continue;
    const [left, middle, right] = downs as string[];
    const across = [2, 4].map((row) => pick(byCrossings.get(left![row]! + middle![row]! + right![row]!)));
    if (across.some((word) => word === null)) continue;
    const grid = Array.from({ length: LATTICE_CELLS }, () => ".");
    const rows = [top, across[0]!, across[1]!];
    rows.forEach((word, at) => [...word].forEach((letter, col) => (grid[at * 2 * LATTICE_SIDE + col] = letter)));
    [left!, middle!, right!].forEach((word, at) => [...word].forEach((letter, row) => (grid[row * LATTICE_SIDE + at * 2] = letter)));
    if (new Set(wordsOf(grid)).size !== LATTICE_LINES.length) continue;
    return grid;
  }
  return null;
}

/**
 * A scramble of the solution whose fewest swaps to solve is exactly `least`,
 * with no word right, or null if none was found in time. The cells moved are
 * `least` plus four to six — so four to six cycles, and four to ten letters
 * start green, near the published game's look — capped at the 21 there are.
 */
export function scrambleOf(solution: readonly string[], least: number, random: Random): string[] | null {
  for (let tries = 0; tries < SCRAMBLE_TRIES; tries += 1) {
    const cycles = 4 + Math.floor(random() * 3);
    const moved = Math.min(LETTER_CELLS.length, least + cycles);
    const count = moved - least;
    if (count < 1 || moved < 2 * count) continue;
    const cells = shuffled(LETTER_CELLS, random).slice(0, moved);
    // Cycle lengths: two each, and the rest handed out one at a time at random.
    const lengths = Array.from({ length: count }, () => 2);
    for (let left = moved - 2 * count; left > 0; left -= 1) lengths[Math.floor(random() * count)]! += 1;
    const grid = [...solution];
    let at = 0;
    for (const length of lengths) {
      const ring = cells.slice(at, at + length);
      at += length;
      // Each cell of the ring takes the letter of the next: undone in length − 1 swaps.
      ring.forEach((cell, j) => (grid[cell] = solution[ring[(j + 1) % length]!]!));
    }
    if (leastSwaps(grid, solution, LETTER_CELLS) !== least) continue;
    const words = wordsOf(grid);
    const right = wordsOf(solution);
    if (words.some((word, line) => word === right[line])) continue;
    return grid;
  }
  return null;
}

