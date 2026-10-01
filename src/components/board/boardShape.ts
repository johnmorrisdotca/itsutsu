import { suidoShapeOf } from "@/lib/puzzles/suido/sizes";

/**
 * A board that is not square, from the one number a size is kept as: a size of a hundred or more is a long board's
 * width and then its height in two digits each, 507 being 5×7 (`suidoShapeOf`, which owns the rule). Null for a
 * square, which is every size below a hundred and the only kind any game but Suido has.
 *
 * Its own file, and not `Board.constants.ts`, whose every line decides how a game's picture looks
 * (`boardArtFingerprint.ts`): a long board is no game's picture, so nothing here asks them to be re-taken.
 */
export function longBoardOf(size: number): { width: number; height: number } | null {
  const shape = size >= 100 ? suidoShapeOf(size) : null;
  return shape === null || shape.width === shape.height ? null : shape;
}
