import { checkSuidoAnswer, decodeLayout, shapeOf, type Layout } from "@johnmorrisdotca/suido";

import type { PuzzleCheck } from "../puzzles.types";
import { suidoBigLevelOfBoard, suidoLevelOfBoard } from "./levels";
import { suidoBigSizeOf } from "./bigLevels";
import { suidoShapeOf } from "./sizes";

/**
 * Whether an answer solves a Suido board: the package's check, O(cells), after
 * the board is held to what the site makes. The package's own check takes any
 * board it can read, and says it does not ask whether a site made it; a site
 * that pays for a solve asks that first, and the site makes two kinds of board:
 *
 *  - A LEVEL (`levels.ts`): one of the package's fixed boards, of any twist it
 *    declares (several pumps, locked pieces, walls, edges that join, an inlet
 *    and an outlet). It is a level when its hash is a level's of the size
 *    (`suidoLevelOfBoard`), which needs no level loaded: a server has none.
 *  - A LEVEL OF THE BIG-PIECES SET (`bigLevels.ts`): one of the package's sixty-four, of the size the level is at, found by its hash the same way.
 *  - A BOARD made from a seed (`generate.ts`): of the shape the size says, one
 *    pump, edges that do not join, and none of the twists.
 */
export function checkSuido(size: number, givens: string, answer: string): PuzzleCheck {
  const big = suidoBigLevelOfBoard(givens);
  const bigHere = big !== null && suidoBigSizeOf(big) === size;
  if (suidoLevelOfBoard(size, givens) === null && !bigHere && boardOf(givens, size) === null) return { ok: false, reason: "the givens are not a board of that size" };
  return checkSuidoAnswer(givens, answer);
}

/** The board a code stands for, if it is one the site makes from a seed at this size; null for anything else, a level included (`checkSuido`). */
export function boardOf(code: string, size: number): Layout | null {
  const layout = decodeLayout(code);
  const shape = suidoShapeOf(size);
  if (layout === null || shape === null || layout.width !== shape.width || layout.height !== shape.height) return null;
  if (layout.wrap || layout.sources.length !== 1 || layout.kind === "inlet-outlet") return null;
  if ((layout.locked?.length ?? 0) > 0 || (layout.walls?.length ?? 0) > 0) return null;
  return layout;
}

/** Whether a kept board is a board of this size, which is all a half-played run is read against (`SuidoSolve` reads the rest): the shape alone, since a level's board may be of any twist. */
export function suidoCodeFits(code: string, size: number): boolean {
  const layout = decodeLayout(code);
  const shape = suidoShapeOf(size);
  return layout !== null && shape !== null && layout.width === shape.width && layout.height === shape.height;
}

/** The pieces a board has, which is the work in it: every cell that is not bare ground. */
export function suidoPieces(givens: string): number {
  const layout = decodeLayout(givens);
  return layout === null ? 0 : layout.cells.filter((mask) => shapeOf(mask) !== "blank").length;
}
