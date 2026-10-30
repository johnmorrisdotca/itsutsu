import { adjacent, neighbours } from "./code";

/**
 * What a press or a drag does to the line, the one place that decides it.
 *
 * The line always starts on the first number. A press on a cell of the line cuts
 * it back to there; a press beside its head takes one more step. A drag does the
 * same for every cell it enters, and a fast finger that has crossed cells between
 * two readings is followed along a straight run when every cell of it is free. A
 * number may be stepped on only when it is the next one: anything else leaves the
 * line as it was.
 */

/** The next number the line is due to pass, after the ones it has passed. */
export function nextNumberOf(line: readonly number[], numbers: readonly number[]): number {
  let next = 1;
  for (const cell of line) if (numbers[cell] === next) next += 1;
  return next;
}

/** Whether the line may step onto this cell from its head. */
function canStep(line: readonly number[], numbers: readonly number[], cell: number, size: number): boolean {
  if (line.includes(cell) || !adjacent(line[line.length - 1]!, cell, size)) return false;
  const number = numbers[cell]!;
  return number === 0 || number === nextNumberOf(line, numbers);
}

/** The line after this cell is pressed, or entered by a drag (`dragging`), which alone follows a straight run. */
export function lineAfter(line: readonly number[], numbers: readonly number[], cell: number, size: number, dragging = false): readonly number[] {
  const at = line.indexOf(cell);
  if (at !== -1) return at === line.length - 1 ? line : line.slice(0, at + 1);
  if (canStep(line, numbers, cell, size)) return [...line, cell];
  if (!dragging) return line;
  // A straight run from the head to here, each cell of it free: a finger that moved faster than it was read.
  const head = line[line.length - 1]!;
  const sameRow = Math.floor(head / size) === Math.floor(cell / size);
  const sameColumn = head % size === cell % size;
  if (!sameRow && !sameColumn) return line;
  const stride = sameRow ? (cell > head ? 1 : -1) : cell > head ? size : -size;
  let walked: readonly number[] = line;
  for (let at2 = head + stride; ; at2 += stride) {
    if (!canStep(walked, numbers, at2, size)) return line;
    walked = [...walked, at2];
    if (at2 === cell) return walked;
  }
}

/** The line after one arrow key: back along itself if that is the way it came, a step on if it is free. */
export function lineAfterArrow(line: readonly number[], numbers: readonly number[], direction: "up" | "down" | "left" | "right", size: number): readonly number[] {
  const head = line[line.length - 1]!;
  const row = Math.floor(head / size);
  const column = head % size;
  const to = direction === "up" ? (row > 0 ? head - size : null) : direction === "down" ? (row < size - 1 ? head + size : null) : direction === "left" ? (column > 0 ? head - 1 : null) : column < size - 1 ? head + 1 : null;
  if (to === null) return line;
  if (line.length >= 2 && line[line.length - 2] === to) return line.slice(0, -1);
  return canStep(line, numbers, to, size) ? [...line, to] : line;
}

/** A cell the head could step to next, for the board to light: only ever a cell beside it. */
export function stepsFrom(line: readonly number[], numbers: readonly number[], size: number): number[] {
  return neighbours(line[line.length - 1]!, size).filter((cell) => canStep(line, numbers, cell, size));
}
