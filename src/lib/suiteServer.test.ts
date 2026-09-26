import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SUITE_SERVER_ENV, reliefAllowed } from "./suiteServer";

describe("relief for the browser suite", () => {
  it("is allowed outside production, as it always was", () => {
    expect(reliefAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(reliefAllowed({ NODE_ENV: "test" })).toBe(true);
  });

  it("is refused in production unless the suite's server says it is one", () => {
    expect(reliefAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(reliefAllowed({ NODE_ENV: "production", [SUITE_SERVER_ENV]: "yes" })).toBe(false);
    expect(reliefAllowed({ NODE_ENV: "production", [SUITE_SERVER_ENV]: "1" })).toBe(true);
  });

  it("is refused on Vercel whatever is set, so a marker that escaped into the deployment does nothing", () => {
    expect(reliefAllowed({ NODE_ENV: "production", [SUITE_SERVER_ENV]: "1", VERCEL: "1" })).toBe(false);
    expect(reliefAllowed({ NODE_ENV: "production", [SUITE_SERVER_ENV]: "1", VERCEL_ENV: "production" })).toBe(false);
  });

  it("is set by the suite's workflow and never by the deploy", () => {
    const workflows = join(process.cwd(), ".github/workflows");
    expect(readFileSync(join(workflows, "e2e.yml"), "utf8")).toContain(SUITE_SERVER_ENV);
    expect(readFileSync(join(workflows, "vercel-deploy.yml"), "utf8")).not.toContain(SUITE_SERVER_ENV);
  });
});
