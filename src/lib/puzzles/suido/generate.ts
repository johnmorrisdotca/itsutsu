import { encodeLayout, flowOf, makeSuido, withMasks } from "@johnmorrisdotca/suido";

import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { suidoKindOfSeed, suidoSquaresOfSeed } from "./seed";
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

/**
 * HOW MANY BIG PIECES a board of this many cells has: one for about every thirty-two, never fewer than one. Big pieces are four cells each, so a
 * board a quarter of whose cells are in one is mostly squares; an eighth of them is one of every few (a 7×7 has two, a 12×12 has five, a
 * 28×28 has twenty-five), and a 20×50's code stays well under the longest the routes accept (`SUIDO_CODE_MOST`).
 */
export function suidoBigCount(cells: number): number {
  return Math.max(1, Math.round(cells / 32));
}

/** A board of Suido, as one of the site's puzzles: Suido's board of this size and level from this seed. */
export function generateSuido(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const shape = suidoShapeOf(size);
  if (shape === null) throw new Error(`No Suido board is made at size ${size}.`);
  // A square is asked for by its side, a long board (507 is 5×7, `sizes.ts`) by its width and height.
  const where = shape.width === shape.height ? { size: shape.width } : { width: shape.width, height: shape.height };
  /*
   * A BIG BOARD IS MADE FROM FEWER TRIES. The package makes boards until one is near the level asked for, up to sixty; a board
   * of a thousand cells takes a quarter of a second to a second to make and measure, so sixty would be a minute in a phone. From
   * four hundred cells (20×20 up) it makes two and keeps the nearer, within 12 of the level's aim and not within 4: a huge board is a place among a hundred boards of its
   * size, so it is aimed less exactly, and is made in under a second on a laptop and a few on a phone (`suido.test.ts` holds the time).
   */
  const attempts = shape.width * shape.height > 400 ? 2 : undefined;
  // A board with big pieces (the seed says so, `suidoSquaresOfSeed`) has a few squares of four cells that turn as one, scaled to the board.
  const bigs = suidoSquaresOfSeed(seed) === "big" ? suidoBigCount(shape.width * shape.height) : 0;
  const made = makeSuido({ ...where, kind: suidoKindOfSeed(seed), difficulty: SUIDO_DIFFICULTY[level], seed, ...(bigs > 0 ? { bigs } : {}), ...(attempts === undefined ? {} : { attempts, tolerance: 12 }) });
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
