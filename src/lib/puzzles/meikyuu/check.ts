import { solutionOf } from "@johnmorrisdotca/meikyuu";

import type { PuzzleCheck } from "../puzzles.types";
import { meikyuuLevelOfBoard } from "./levels";
import { decodeWay, mazeOf } from "./way";

/**
 * Whether an answer solves a Meikyuu maze: a line from its start to its goal,
 * every step through an open passage, none onto the line already. The maze is
 * its recipe, and the recipe is held to what the site makes first: one of the
 * levels of its size. The package's rules say a line may go out and back for a
 * key; what is handed in is the line that is left, which is the way through
 * (a maze has exactly one), so the keys picked up on the way are not in it and
 * not asked about here.
 */
export function checkMeikyuu(size: number, givens: string, answer: string): PuzzleCheck {
  if (meikyuuLevelOfBoard(size, givens) === null) return { ok: false, reason: "the givens are not a level of that size" };
  const maze = mazeOf(givens);
  if (maze === null) return { ok: false, reason: "the givens are not a maze" };
  const way = decodeWay(maze, answer);
  if (way === null) return { ok: false, reason: "that is not a line through the maze" };
  if (way[way.length - 1] !== maze.goal) return { ok: false, reason: "the line does not reach the goal" };
  return { ok: true };
}

/** The cells on the way through the maze a recipe makes, which is the work in it: each is drawn once. Nought for a recipe that is no maze. */
export function meikyuuWay(givens: string): number {
  const maze = mazeOf(givens);
  return maze === null ? 0 : solutionOf(maze).length;
}
