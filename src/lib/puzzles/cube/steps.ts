import { countsAsMove, type CubeMove } from "@johnmorrisdotca/kyuubu";

/**
 * A CUBE'S TURNS, GROUPED INTO THE STEPS A REPLAY STANDS AT. Only a turn that
 * counts is a step (`countsAsMove`); a turn of the whole cube in the hand
 * rides with the turn after it, so a replay never stands on a cube that is
 * only held differently. `ends[k]` is how many of the turns the cube has had
 * once it is at step k (`ends[0]` is 0), and `each[k - 1]` the turns of step k.
 *
 * Turns of the whole cube left over at the end, with no counted turn after
 * them, are dropped by default, as a finished solve's replay wants (it ends
 * where the last counted move leaves it). A lesson in holding the cube is
 * nothing but such turns, so it asks `keepTrailing`: they are one last step.
 */
export type CubeSteps = {
  /** Every turn, in order. */
  all: CubeMove[];
  /** How many turns have been made at each step, from 0. */
  ends: number[];
  /** The turns of each step. */
  each: CubeMove[][];
};

export function groupCubeSteps(all: readonly CubeMove[], keepTrailing = false): CubeSteps {
  const ends: number[] = [0];
  all.forEach((move, index) => {
    if (countsAsMove(move)) ends.push(index + 1);
  });
  if (keepTrailing && ends[ends.length - 1] < all.length) ends.push(all.length);
  const each: CubeMove[][] = ends.slice(1).map((end, index) => all.slice(ends[index], end));
  return { all: [...all], ends, each };
}
