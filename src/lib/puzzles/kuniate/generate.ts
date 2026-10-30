import { seededRandom } from "../random";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { KUNIATE_FLAG } from "./code";
import { KUNIATE_EASY, KUNIATE_HARD, KUNIATE_MEDIUM, KUNIATE_NO_FLAG } from "./pool.constants";

/** The countries a level asks for, and for a flag only those with one to draw. */
export function kuniatePool(size: number, level: PuzzleLevel): readonly string[] {
  const pool = level === "easy" ? KUNIATE_EASY : level === "medium" ? KUNIATE_MEDIUM : KUNIATE_HARD;
  return size === KUNIATE_FLAG ? pool.filter((code) => !KUNIATE_NO_FLAG.has(code)) : pool;
}

/**
 * The country a seed asks for, by this way and at this level. The way is mixed into
 * the seed, so today's outline, flag and capital are three countries and one cannot
 * give another away.
 */
export function generateKuniate(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const pool = kuniatePool(size, level);
  const random = seededRandom(seed * 31 + size);
  // The first draws of a small seed sit close together: stir the stream before reading it.
  random();
  random();
  const code = pool[Math.floor(random() * pool.length)]!;
  return { kind: "kuniate", size, level, seed, givens: `${code}${size}`, solution: code };
}
