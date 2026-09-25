/**
 * THE NUMBER A TAP ON THE CHOSEN CELL PUTS IN IT: one more, and after the
 * largest the cell empties, and then it starts again at 1.
 *
 * John, 2026-09-24: "Is it bad to allow the user to click through the 1, 2, 3,
 * 4, 5, X, 1, 2, 3.... so they can just keep tapping? seems like a better
 * experience to me." A tap on a cell that is not chosen still only chooses it
 * — otherwise choosing a cell to use the keys would write a 1 into it — and
 * the keys under the grid stay, because a 9 on a 9×9 is nine taps.
 *
 * `0` is an empty cell, as everywhere in a puzzle's cells.
 */
export function stepEntry(value: number, size: number): number {
  return value >= size ? 0 : value + 1;
}
