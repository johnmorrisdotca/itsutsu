import { encodeLayout, flowOf, makeSuido, withMasks } from "@johnmorrisdotca/suido";

import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { suidoKindOfSeed } from "./seed";
import { suidoShapeOf } from "./sizes";

/**
 * SUIDO'S BOARDS ARE SUIDO'S. The pieces, the pumps and drains, the solver that
 * proves a board has exactly one answer, the generator and the check are
 * `@johnmorrisdotca/suido`. What is the site's own is here: a board written as
 * one of the site's puzzles, what a level asks of the package, and where the
 * kind of board is kept.
 *
 * A BOARD IS ITS SEED. Size, level and seed make one board in every browser,
 * which is what an address, a kept run, a race and a table of fastest times
 * all lean on. The package's `difficulty` is a rank among boards of the
 * same size (1 to 100), so a level is a target for it: easy aims at the plainer
 * fifth, medium the middle, hard the upper fifth.
 */
export const SUIDO_DIFFICULTY: Record<PuzzleLevel, number> = { easy: 20, medium: 50, hard: 80, "extra-hard": 80 };

/** A board of Suido, as one of the site's puzzles: Suido's board of this size and level from this seed. */
export function generateSuido(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const shape = suidoShapeOf(size);
  if (shape === null) throw new Error(`No Suido board is made at size ${size}.`);
  // A square is asked for by its side, a long board (507 is 5×7, `sizes.ts`) by its width and height.
  const where = shape.width === shape.height ? { size: shape.width } : { width: shape.width, height: shape.height };
  const made = makeSuido({ ...where, kind: suidoKindOfSeed(seed), difficulty: SUIDO_DIFFICULTY[level], seed });
  /*
   * THE ANSWER, WITH ITS SPARES AS DEALT. A drains board's spare pieces, which
   * the water never reaches, may face any way, and the package's answer has
   * them facing whichever way it happened to lay them. The solver finds an
   * answer again leaving a spare as it was given (`suidoAnswerOf`), so the
   * answer is written the same way here: one answer for one board, whichever
   * made it, and a finished page that works its answer out draws what the
   * solve was handed in. A network has no spare.
   */
  const water = flowOf(made.layout, made.solution);
  const solution = encodeLayout(withMasks(made.layout, made.solution.map((mask, cell) => (water.wet[cell] === true ? mask : made.layout.cells[cell]!))));
  // `puzzle.seed` stays the seed asked for, though the package may have tried others to come near the level: the address names this board.
  return { kind: "suido", size, level, seed, givens: made.code, solution };
}
