import { solveSteps, turnAll } from "@johnmorrisdotca/kyuubu";
import { describe, expect, it } from "vitest";

import { CUBE_STAGE_WORDS, CUBE_STAGES_BY_SIZE } from "./cubeMethod";
import { practiceCube, stageDone, stageRest } from "./cubePractice";

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

  it("shows the turns that win an earlier stage back when the reader has undone it, and none once the stage is done", () => {
    const { state } = practiceCube(3, "yellowFace", 1);
    expect(stageRest(state, 3, "yellowFace").length).toBeGreaterThan(0);
    // The whole step done: nothing is left to show.
    const through = solveSteps(state, 3)!.findIndex((step) => step.stage !== "yellowFace");
    const finished = turnAll(state, 3, solveSteps(state, 3)!.slice(0, through).flatMap((step) => step.moves));
    expect(stageRest(finished, 3, "yellowFace")).toEqual([]);
    // A white corner turned out of the first layer: the method's next step is back there, and that is what is shown.
    const undone = turnAll(state, 3, [{ axis: 0, layer: 2, turns: 3 }, { axis: 1, layer: 2, turns: 3 }]);
    const rest = stageRest(undone, 3, "yellowFace");
    expect(rest.length).toBeGreaterThan(0);
    expect(rest[0].stage).not.toBe("yellowFace");
    expect(stageDone(undone, 3, "yellowFace")).toBe(false);
  });

  it("says every stage in words", () => {
    for (const stage of new Set([...CUBE_STAGES_BY_SIZE[2], ...CUBE_STAGES_BY_SIZE[3]])) expect(CUBE_STAGE_WORDS[stage].title.length).toBeGreaterThan(0);
  });
});
