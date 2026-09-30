import { solveSteps, turnAll, type SolveStage } from "@johnmorrisdotca/kyuubu";

import { cubeOfSeed } from "@/lib/puzzles/cube/generate";

import { CUBE_STAGES_BY_SIZE } from "./cubeMethod";

/** The sizes the guide teaches: the ones the method is written for. */
export type TaughtSize = 2 | 3;

/** How many seeds are tried for a cube where the stage is still to do; a scramble almost never leaves one done by luck. */
const TRIES = 200;

/**
 * A CUBE TO PRACTISE ONE STEP ON: a full scramble, solved by the method up
 * to the stage asked for, so that stage is the next thing to do. The same
 * for a seed in every browser, so the page draws it on the server and the
 * browser agrees. A scramble that happens to leave the stage done already
 * is passed over for the next seed.
 */
export function practiceCube(n: TaughtSize, stage: SolveStage, seed: number): { state: string; seed: number } {
  for (let tried = seed; tried < seed + TRIES; tried += 1) {
    const scrambled = cubeOfSeed(n, "hard", tried);
    const steps = solveSteps(scrambled, n) ?? [];
    const at = steps.findIndex((step) => step.stage === stage);
    if (at >= 0) return { state: turnAll(scrambled, n, steps.slice(0, at).flatMap((step) => step.moves)), seed: tried };
  }
  throw new Error(`no cube found with ${stage} still to do`);
}

/** Whether the stage is done on this cube: the method's next step is a later one, or it is solved. Earlier work undone makes it not done. */
export function stageDone(state: string, n: TaughtSize, stage: SolveStage): boolean {
  const steps = solveSteps(state, n);
  if (steps === null) return false;
  if (steps.length === 0) return true;
  const order = CUBE_STAGES_BY_SIZE[n];
  return order.indexOf(steps[0].stage) > order.indexOf(stage);
}
