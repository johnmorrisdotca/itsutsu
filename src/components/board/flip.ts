/**
 * Turning the board round, for the reader who is looking at it.
 *
 * A flip is a rendering order and nothing more. The board, the moves and the
 * coordinates are untouched: the same cells are drawn, in the opposite order,
 * so the point the engine calls A1 is still A1 and is simply somewhere else on
 * the screen. That is what makes this safe to put in `Appearance` — there is
 * no state here to get out of step with the game, and nothing to send anybody.
 *
 * Reversing the order rather than rotating with CSS is what keeps the
 * coordinate gutters honest. The labels are laid out through the same
 * function, so they turn with the board by construction; a flipped board that
 * kept its old letters and numbers would be lying about where things are,
 * which is worse than a board somebody has to read upside down.
 */
export function layoutOrder(count: number, flipped: boolean): number[] {
  const indices = Array.from({ length: count }, (_, index) => index);
  return flipped ? indices.reverse() : indices;
}
