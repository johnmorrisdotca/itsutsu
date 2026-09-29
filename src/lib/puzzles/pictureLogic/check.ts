import type { PuzzleCheck } from "../puzzles.types";
import { decodeClues, decodePicture, runsOf } from "./code";

/**
 * Whether a grid solves a Picture logic puzzle: the check the browser makes to
 * say "solved" and the server makes before it pays. O(cells), no search:
 * every row's runs of shaded cells and every column's, read off the grid and
 * compared with the clues. Written against the clues and not the picture the
 * puzzle was made from, because the clues are the rules — a grid that meets
 * them all is solved — and the solver has already proved only one does.
 */
export function checkPictureLogic(size: number, givens: string, answer: string): PuzzleCheck {
  const clues = decodeClues(givens, size);
  if (clues === null) return { ok: false, reason: "the givens are not a set of clues" };
  const picture = decodePicture(answer, size);
  if (picture === null) return { ok: false, reason: "not a grid of shaded and empty cells that size" };
  const same = (runs: number[], clue: readonly number[]) => runs.length === clue.length && runs.every((run, at) => run === clue[at]);
  for (let line = 0; line < size; line += 1) {
    const row = runsOf(picture.slice(line * size, (line + 1) * size));
    if (!same(row, clues.rows[line]!)) return { ok: false, reason: `row ${line + 1} does not match its clue` };
    const col = runsOf(Array.from({ length: size }, (_, at) => picture[at * size + line]!));
    if (!same(col, clues.cols[line]!)) return { ok: false, reason: `column ${line + 1} does not match its clue` };
  }
  return { ok: true };
}
