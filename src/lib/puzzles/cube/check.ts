import type { PuzzleCheck } from "../puzzles.types";

import { cubeSolved, decodeCubeMoves, isCubeState, moveFits, turnAll } from "kyuubu";

import { CUBE_SIZES } from "./generate";

/** The most characters a cube's moves may be kept with: three a move, and room for a long first solve of a 5×5. */
export const CUBE_MOVES_MOST = 9000;

function playedOut(size: number, givens: string, answer: string): { state: string } | { reason: string } {
  if (!(CUBE_SIZES as readonly number[]).includes(size)) return { reason: "no cube of that size" };
  if (!isCubeState(givens, size)) return { reason: "not a cube of that size" };
  if (answer.length > CUBE_MOVES_MOST) return { reason: "more moves than a solve is kept with" };
  const moves = decodeCubeMoves(answer);
  if (moves === null) return { reason: "a move that is not written as one" };
  if (!moves.every((move) => moveFits(size, move))) return { reason: "a layer the cube does not have" };
  return { state: turnAll(givens, size, moves) };
}

/**
 * THE CHECK THE SERVER RUNS on a finished cube: the moves, turned from the
 * scramble, leave every face one colour. O(moves × stickers), no solver, and
 * any way to solved counts, not only the scramble taken back.
 */
export function checkCube(size: number, givens: string, answer: string): PuzzleCheck {
  if (answer.length === 0) return { ok: false, reason: "no move was made" };
  const played = playedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, reason: played.reason };
  return cubeSolved(played.state, size) ? { ok: true } : { ok: false, reason: "not every face is one colour" };
}

/** A cube given up: its moves all turns this cube has, at least one made, and not solved, since a solved cube is a solve. */
export function checkCubeGivenUp(size: number, givens: string, answer: string): PuzzleCheck {
  if (answer.length === 0) return { ok: false, reason: "no move was made" };
  const played = playedOut(size, givens, answer);
  if ("reason" in played) return { ok: false, reason: played.reason };
  return cubeSolved(played.state, size) ? { ok: false, reason: "it was solved" } : { ok: true };
}

/** Whether a kept run's moves are written as moves, within the length a run is kept with; they are turned from the scramble when it is opened. */
export function cubeMovesFit(moves: string): boolean {
  return moves.length <= CUBE_MOVES_MOST && decodeCubeMoves(moves) !== null;
}
