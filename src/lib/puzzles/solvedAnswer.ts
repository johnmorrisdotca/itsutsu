import { decodeBlackAndWhite, encodeBlackAndWhite } from "./blackAndWhite/code";
import { solutionOf as blackAndWhiteSolution } from "./blackAndWhite/solve";
import { boardOf, encodeBridges } from "./bridges/code";
import { solutionOf as bridgesSolution } from "./bridges/solve";
import { decodeClues, encodePicture } from "./pictureLogic/code";
import { solutionOf as pictureSolution } from "./pictureLogic/solve";
import { checkSuidoAnswer } from "@johnmorrisdotca/suido";
import { suidoAnswerOf } from "./suido/solve";
import { encodeWay } from "./meikyuu/way";
import { tobiishiChallengeOf, tobiishiRefOfCode } from "./tobiishi/levels";
import { encodeAnswer } from "./tobiishi/way";
import { pencilEngine } from "./pencil/engines";
import { isPencilKind } from "./pencil/pencil.constants";
import { decodeRegions, encodeStones } from "./hiddenStones/code";
import { solutionOf as hiddenStonesSolution } from "./hiddenStones/solve";
import { isNumberKind, numbersAnswerOf } from "./kazu";
import { checkSolution } from "./puzzleCheck";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";

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
  // A Suido level's board is held to the site's levels by the server's own check, which needs the size's levels loaded; here the answer is only drawn, and the package's check of it against its own board is the whole of what is asked.
  if (kind === "suido") return checkSuidoAnswer(givens, answer).ok ? answer : null;
  return checkSolution(kind, size, givens, answer, level).ok ? answer : null;
}

function searchAnswer(kind: PuzzleKind, size: number, givens: string): string | null {
  // The Numbers family: Kazu's solver, which reads the regions, cages, marks or clues out of the givens and refuses givens that are not a puzzle.
  if (isNumberKind(kind)) return numbersAnswerOf(kind, size, givens);
  // The pencil puzzles: Kazu's solver, which counts the answers and gives the one there is.
  if (isPencilKind(kind)) return pencilEngine(kind).solve(size, givens);
  switch (kind) {
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
    case "bridges": {
      const board = boardOf(givens, size);
      const counts = board === null ? null : bridgesSolution(board);
      return board === null || counts === null ? null : encodeBridges(board, counts);
    }
    case "pictureLogic": {
      const clues = decodeClues(givens, size);
      const picture = clues === null ? null : pictureSolution(clues);
      return picture === null ? null : encodePicture(picture);
    }
    case "suido":
      return suidoAnswerOf(givens, size);
    case "meikyuu":
      // A maze has exactly one way through, found again from its recipe.
      return encodeWay(givens);
    case "tobiishi": {
      // A level always has the answer it was made from, found again from its name; any other run to the goal is as good, and this is the one that can be shown.
      const ref = tobiishiRefOfCode(givens);
      if (ref === null) return null;
      const challenge = tobiishiChallengeOf(ref);
      return encodeAnswer(challenge.game, challenge.answer);
    }
    default:
      return null;
  }
}
