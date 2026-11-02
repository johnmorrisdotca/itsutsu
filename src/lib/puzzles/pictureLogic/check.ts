import type { PuzzleCheck } from "../puzzles.types";
import { decodeClues, decodePicture, runsOf } from "./code";
import { no } from "@/lib/puzzles/puzzleReasons";

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
  if (clues === null) return no("chk.cluesGivens");
  const picture = decodePicture(answer, size);
  if (picture === null) return no("chk.shadedGrid");
  const same = (runs: number[], clue: readonly number[]) => runs.length === clue.length && runs.every((run, at) => run === clue[at]);
  for (let line = 0; line < size; line += 1) {
    const row = runsOf(picture.slice(line * size, (line + 1) * size));
    if (!same(row, clues.rows[line]!)) return no("chk.rowNoClue", { n: line + 1 });
    const col = runsOf(Array.from({ length: size }, (_, at) => picture[at * size + line]!));
    if (!same(col, clues.cols[line]!)) return no("chk.columnNoClue", { n: line + 1 });
  }
  return { ok: true };
}
