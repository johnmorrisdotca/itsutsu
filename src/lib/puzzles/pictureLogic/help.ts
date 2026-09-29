import { cellHint } from "../hintCell";
import { EMPTY_CELL, SHADED_CELL } from "./code";
import type { CellState } from "./pictureLogic.types";

/**
 * Check, Show and Hint for Picture logic, worked out against the puzzle's one
 * answer as every puzzle's are. A cell is wrong when it is shaded and the
 * picture has it empty, or marked ✕ and the picture has it shaded; a cell
 * left untouched is never wrong, only not done.
 */

/** Whether the player's cell says something the picture contradicts. */
function isWrong(cell: CellState, shaded: boolean): boolean {
  return (cell === SHADED_CELL && !shaded) || (cell === EMPTY_CELL && shaded);
}

/** The cells Show marks: every shade and every ✕ the picture does not have there. */
export function pictureWrong(cells: readonly CellState[], picture: readonly boolean[]): number[] {
  return cells.flatMap((cell, at) => (isWrong(cell, picture[at]!) ? [at] : []));
}

/** What Check says: how many cells are wrong, and how many of the picture's shaded cells are still to shade. */
export function pictureChecked(cells: readonly CellState[], picture: readonly boolean[]): { wrong: number; toShade: number } {
  return {
    wrong: pictureWrong(cells, picture).length,
    toShade: picture.filter((shaded, at) => shaded && cells[at] !== SHADED_CELL).length,
  };
}

/**
 * Where a Hint goes: the tightest cell not yet as the picture has it — a
 * shade where it is shaded, a ✕ where it is empty — by the rule every grid
 * puzzle's hint follows (`cellHint`). Null when every cell is done.
 */
export function pictureHint(size: number, cells: readonly CellState[], picture: readonly boolean[]): number | null {
  const want = picture.map((shaded) => (shaded ? SHADED_CELL : EMPTY_CELL));
  return cellHint(size, () => false, cells, want);
}

/** What a Hint puts in its cell: a shade or a ✕, as the picture has it. */
export function hintedState(picture: readonly boolean[], cell: number): CellState {
  return picture[cell] ? SHADED_CELL : EMPTY_CELL;
}
