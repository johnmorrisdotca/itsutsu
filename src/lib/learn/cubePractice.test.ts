import { solveSteps, turnAll } from "@johnmorrisdotca/kyuubu";
import { describe, expect, it } from "vitest";

import { CUBE_STAGE_WORDS, CUBE_STAGES_BY_SIZE } from "./cubeMethod";
import { practiceCube, stageDone } from "./cubePractice";

/**
 * THE GUIDE'S PRACTICE CUBES: each one has its stage next, the stage's own
 * turns finish it, and the method's words cover every stage it can show.
 */
describe("a cube to practise a step on", () => {
  for (const n of [2, 3] as const) {
    it.each(CUBE_STAGES_BY_SIZE[n])(`on the ${n}×${n}, has %s next, and its turns finish it`, (stage) => {
      for (const seed of [1, 2, 3]) {
        const { state } = practiceCube(n, stage, seed);
        const steps = solveSteps(state, n)!;
        expect(steps[0].stage).toBe(stage);
        expect(stageDone(state, n, stage)).toBe(false);
        const through = steps.findIndex((step) => step.stage !== stage);
        const turns = steps.slice(0, through < 0 ? steps.length : through).flatMap((step) => step.moves);
        expect(stageDone(turnAll(state, n, turns), n, stage)).toBe(true);
        expect(practiceCube(n, stage, seed)).toEqual(practiceCube(n, stage, seed));
      }
    });
  }

  it("says every stage in words", () => {
    for (const stage of new Set([...CUBE_STAGES_BY_SIZE[2], ...CUBE_STAGES_BY_SIZE[3]])) expect(CUBE_STAGE_WORDS[stage].title.length).toBeGreaterThan(0);
  });
});
