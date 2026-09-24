import { describe, expect, it } from "vitest";

import {
  FUNCTION_GROWTH_ALLOWED,
  FUNCTION_GROWTH_FLOOR_MB,
  FUNCTION_SIZE_LIMIT_MB,
  judgeFunctionSizes,
  matchBaseline,
  recordBaseline,
} from "./functionSizeGate.mjs";

const pages = (mb: number, name = "_not-found") => ({ name, mb, routes: [name, "admin", "releases", "releases.rsc"] });
const api = (mb: number) => ({ name: "api/admin/members/[id]/claim", mb, routes: ["api/admin/members/[id]/claim", "api/games/[id]"] });

const baseline = {
  functions: [
    { name: "_not-found", mb: 25, sample: ["_not-found", "admin", "releases"] },
    { name: "api/admin/members/[id]/claim", mb: 30, sample: ["api/admin/members/[id]/claim", "api/games/[id]"] },
  ],
};

/* John, 2026-09-23, on UmaKuma's gate: "no more than 20% sounds reasonable." */
describe("the function-size gate", () => {
  it("passes a function within 20% of its recorded size", () => {
    const [verdict] = judgeFunctionSizes([pages(29.9)], baseline);
    expect(verdict!.failure).toBeNull();
    expect(verdict!.allowedMb).toBeCloseTo(25 * (1 + FUNCTION_GROWTH_ALLOWED), 6);
  });

  it("fails a function that grew more than 20% and more than 5 MB over its recorded size", () => {
    const [verdict] = judgeFunctionSizes([pages(31.5)], baseline);
    expect(verdict!.failure).toContain("26% (6.5 MB) over the 25.0 MB recorded");
  });

  /* A 2 MB function has 0.4 MB of room at 20%, which build noise can use up. */
  it("passes a small function that grew by a megabyte, however large the percentage", () => {
    const small = { functions: [{ name: "_middleware", mb: 1.7, sample: ["_middleware"] }] };
    const grew = (mb: number) => judgeFunctionSizes([{ name: "_middleware", mb, routes: ["_middleware"] }], small)[0]!;
    expect(grew(2.7).failure).toBeNull();
    expect(grew(2.7).allowedMb).toBeCloseTo(1.7 + FUNCTION_GROWTH_FLOOR_MB, 6);
    expect(grew(6.8).failure).toContain("over the 1.7 MB recorded");
  });

  it("fails any function over the ceiling, recorded or not", () => {
    const unknown = { name: "api/new", mb: FUNCTION_SIZE_LIMIT_MB + 1, routes: ["api/new"] };
    expect(judgeFunctionSizes([unknown], baseline)[0]!.failure).toContain(`over the ${FUNCTION_SIZE_LIMIT_MB} MB ceiling`);
    const recordedBig = { functions: [{ name: "api/new", mb: FUNCTION_SIZE_LIMIT_MB - 2, sample: ["api/new"] }] };
    expect(judgeFunctionSizes([unknown], recordedBig)[0]!.failure).toContain("ceiling");
  });

  it("gives a function the baseline does not know the ceiling as its only limit", () => {
    const [verdict] = judgeFunctionSizes([{ name: "api/brand-new", mb: FUNCTION_SIZE_LIMIT_MB - 5, routes: ["api/brand-new"] }], baseline);
    expect(verdict!.baseline).toBeNull();
    expect(verdict!.allowedMb).toBe(FUNCTION_SIZE_LIMIT_MB);
    expect(verdict!.failure).toBeNull();
  });

  it("has only the ceiling when there is no baseline at all", () => {
    expect(judgeFunctionSizes([pages(FUNCTION_SIZE_LIMIT_MB - 1)], null)[0]!.failure).toBeNull();
  });

  /*
   * Vercel names a bundle after its alphabetically first route, so a new route
   * can rename one. The baseline recognises it by the routes it holds, or the
   * 20% rule would quietly stop applying.
   */
  it("recognises a function renamed by a new route, by the routes it holds", () => {
    expect(matchBaseline(pages(26, "_global-error"), baseline.functions)?.name).toBe("_not-found");
    expect(matchBaseline(api(31), baseline.functions)?.name).toBe("api/admin/members/[id]/claim");
    expect(matchBaseline({ name: "x", mb: 1, routes: ["nothing-shared"] }, baseline.functions)).toBeNull();
  });

  it("records each function's size and a sample of its routes, leaving out the .rsc twins", () => {
    const recorded = recordBaseline([api(30.04), pages(44.36)]);
    expect(recorded.functions.map((fn) => [fn.name, fn.mb])).toEqual([
      ["_not-found", 44.4],
      ["api/admin/members/[id]/claim", 30],
    ]);
    expect(recorded.functions[0]!.sample).toEqual(["_not-found", "admin", "releases"]);
  });
});
