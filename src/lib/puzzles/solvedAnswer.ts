import { decodeBlackAndWhite, encodeBlackAndWhite } from "./blackAndWhite/code";
import { solutionOf as blackAndWhiteSolution } from "./blackAndWhite/solve";
import { decodeRegions, encodeStones } from "./hiddenStones/code";
import { solutionOf as hiddenStonesSolution } from "./hiddenStones/solve";
import { decodeJigsaw } from "./jigsaw/code";
import { decodeKiller } from "./killer/code";
import { decodeMoreOrLess } from "./moreOrLess/code";
import { solutionOf as moreOrLessSolution } from "./moreOrLess/solve";
import { boxedLayout, cagedLayout, regionLayout, regionsAreSound } from "./numberPlace/layout";
import { solutionOf as numberPlaceSolution } from "./numberPlace/solve";
import { checkSolution } from "./puzzleCheck";
import { decodeCells, encodeCells } from "./puzzleCode";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";
import { decodeTowers } from "./towers/code";
import { solutionOf as towersSolution } from "./towers/solve";

/**
 * THE ANSWER A FINISHED GRID MUST HAVE HAD, WORKED OUT FROM ITS GIVENS, in the
 * code a solve's answer is kept in (`PuzzleSolve.answer`).
 *
 * John, 2026-09-26, on a 4×4 Number Place solved two days before, whose page
 * drew the grid as it was dealt: "this game doesn't even look solved and it
 * was in completed games… this is a bug." A solve kept before its grid was has
 * no answer to draw — but every grid made here has exactly one answer, and a
 * solve that was paid was checked against it, so the answer is the puzzle's
 * own, found again by the solver that made it.
 *
 * Refuses rather than guesses: null for a word puzzle (a word's answer is the
 * guesses, which nothing can work out afterwards), for givens that do not
 * read, for a grid with no answer or more than one, and for anything the
 * solver finds that the server's own check would not pass. Drawn solved only
 * when it is certainly the grid that was solved.
 *
 * Run in the reader's browser, once, when the page is opened (`FinishedPuzzle`):
 * the search is the same one the browser ran to make the puzzle.
 */
export function solvedAnswerOf(kind: PuzzleKind, size: number, level: PuzzleLevel, givens: string): string | null {
  const answer = searchAnswer(kind, size, givens);
  if (answer === null) return null;
  return checkSolution(kind, size, givens, answer, level).ok ? answer : null;
}

function searchAnswer(kind: PuzzleKind, size: number, givens: string): string | null {
  const cells = (grid: number[] | null) => (grid === null ? null : encodeCells(grid));
  switch (kind) {
    case "numberPlace":
    case "diagonal": {
      const asked = decodeCells(givens, size);
      return asked === null ? null : cells(numberPlaceSolution(asked, boxedLayout(size, kind === "diagonal")));
    }
    case "jigsaw": {
      const asked = decodeJigsaw(givens, size);
      if (asked === null || !regionsAreSound(size, asked.regions)) return null;
      return cells(numberPlaceSolution(asked.cells, regionLayout(size, asked.regions)));
    }
    case "sumCages": {
      const asked = decodeKiller(givens, size);
      return asked === null ? null : cells(numberPlaceSolution(asked.cells, cagedLayout(size, asked.cages)));
    }
    case "moreOrLess": {
      const asked = decodeMoreOrLess(givens, size);
      return asked === null ? null : cells(moreOrLessSolution(asked.cells, size, asked.marks));
    }
    case "towers": {
      const asked = decodeTowers(givens, size);
      return asked === null ? null : cells(towersSolution(asked.cells, size, asked.clues));
    }
    case "hiddenStones": {
      const regions = decodeRegions(givens, size);
      const stones = regions === null ? null : hiddenStonesSolution(size, regions);
      return stones === null ? null : encodeStones(stones);
    }
    case "blackAndWhite": {
      const printed = decodeBlackAndWhite(givens.slice(0, size * size), size);
      const solved = printed === null ? null : blackAndWhiteSolution(printed, size);
      return solved === null ? null : encodeBlackAndWhite(solved);
    }
    default:
      return null;
  }
}
