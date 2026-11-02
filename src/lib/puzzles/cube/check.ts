import type { PuzzleCheck } from "../puzzles.types";

import { cubeSolved, decodeCubeMoves, isCubeState, moveFits, turnAll } from "@johnmorrisdotca/kyuubu";

import { CUBE_SIZES } from "./generate";
import type { PuzzleReason } from "@/lib/puzzles/puzzleReasons";
import { no, why } from "@/lib/puzzles/puzzleReasons";

/**
 * The most characters a cube's moves may be kept with: three a move, ten thousand moves, which is as many as Kyuubu keeps in
 * one saved solve (`MAX_RECORD_MOVES`). It was 9,000 (three thousand moves), room for a long first solve of a 5×5; a first
 * 7×7 is a long evening of single layers, a thousand turns of them or well past it.
 */
export const CUBE_MOVES_MOST = 30_000;

function playedOut(size: number, givens: string, answer: string): { state: string } | PuzzleReason {
  if (!(CUBE_SIZES as readonly number[]).includes(size)) return why("chk.noCubeSize");
  if (!isCubeState(givens, size)) return why("chk.notCubeSize");
  if (answer.length > CUBE_MOVES_MOST) return why("chk.moreMovesSolve");
  const moves = decodeCubeMoves(answer);
  if (moves === null) return why("chk.moveNotWritten");
  if (!moves.every((move) => moveFits(size, move))) return why("chk.noSuchLayer");
  return { state: turnAll(givens, size, moves) };
}

/**
 * THE CHECK THE SERVER RUNS on a finished cube: the moves, turned from the
 * scramble, leave every face one colour. O(moves × stickers), no solver, and
 * any way to solved counts, not only the scramble taken back.
 */
export function checkCube(size: number, givens: string, answer: string): PuzzleCheck {
  if (answer.length === 0) return no("chk.noMoveMade");
  const played = playedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, ...played };
  return cubeSolved(played.state, size) ? { ok: true } : no("chk.notEveryFace");
}

/** A cube given up: its moves all turns this cube has, at least one made, and not solved, since a solved cube is a solve. */
export function checkCubeGivenUp(size: number, givens: string, answer: string): PuzzleCheck {
  if (answer.length === 0) return no("chk.noMoveMade");
  const played = playedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, ...played };
  return cubeSolved(played.state, size) ? no("chk.itWasSolved") : { ok: true };
}

/** Whether a kept run's moves are written as moves, within the length a run is kept with; they are turned from the scramble when it is opened. */
export function cubeMovesFit(moves: string): boolean {
  return moves.length <= CUBE_MOVES_MOST && decodeCubeMoves(moves) !== null;
}
