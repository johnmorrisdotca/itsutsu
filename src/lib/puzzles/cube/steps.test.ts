import { movesNotation, parseMoves } from "@johnmorrisdotca/kyuubu";
import { describe, expect, it } from "vitest";

import { groupCubeSteps } from "./steps";

const turns = (notation: string) => parseMoves(notation, 3)!;
const words = (each: readonly (readonly ReturnType<typeof turns>[number][])[]) => each.map((step) => movesNotation(step, 3));

describe("a cube's turns grouped into the steps a replay stands at", () => {
  it("makes each turn that counts a step", () => {
    const steps = groupCubeSteps(turns("R U R' U'"));
    expect(words(steps.each)).toEqual(["R", "U", "R'", "U'"]);
    expect(steps.ends).toEqual([0, 1, 2, 3, 4]);
  });

  it("carries a turn of the whole cube with the turn after it, so no step is only the cube held differently", () => {
    const steps = groupCubeSteps(turns("x R y' U"));
    expect(words(steps.each)).toEqual(["x R", "y' U"]);
    expect(steps.ends).toEqual([0, 2, 4]);
  });

  it("drops turns of the whole cube left over at the end, as a finished solve's replay stops where its last counted move leaves it", () => {
    const steps = groupCubeSteps(turns("R U x2"));
    expect(words(steps.each)).toEqual(["R", "U"]);
    expect(steps.all).toHaveLength(3);
  });

  it("keeps them as a last step of their own when asked, so holding the cube is a lesson too", () => {
    const steps = groupCubeSteps(turns("R U x2"), true);
    expect(words(steps.each)).toEqual(["R", "U", "x2"]);
    const only = groupCubeSteps(turns("z'"), true);
    expect(words(only.each)).toEqual(["z'"]);
    expect(only.ends).toEqual([0, 1]);
    expect(groupCubeSteps(turns("z'")).each).toEqual([]);
  });

  it("is empty for no turns", () => {
    expect(groupCubeSteps([], true)).toEqual({ all: [], ends: [0], each: [] });
  });
});
