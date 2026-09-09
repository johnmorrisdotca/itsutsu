import { describe, expect, it } from "vitest";

import { isLocalDatabase } from "./localDatabase";

/**
 * The guard on the end-to-end suite's tidy-up, tested away from the suite it
 * guards — a guard checked only by the thing it protects is not a guard.
 */
describe("isLocalDatabase", () => {
  it("recognises a database on this machine", () => {
    expect(isLocalDatabase("postgresql://u:p@localhost:5432/gomoku")).toBe(true);
    expect(isLocalDatabase("postgresql://u:p@127.0.0.1:5432/gomoku")).toBe(true);
  });

  it("refuses anything that is not", () => {
    // The one that matters: Neon, which is where the real site lives.
    expect(isLocalDatabase("postgresql://u:p@ep-cool-name.eu-central-1.aws.neon.tech/gomoku")).toBe(false);
    expect(isLocalDatabase("postgresql://u:p@db.internal:5432/gomoku")).toBe(false);
  });

  it("refuses what it cannot read, rather than assuming the best", () => {
    expect(isLocalDatabase(undefined)).toBe(false);
    expect(isLocalDatabase(null)).toBe(false);
    expect(isLocalDatabase("")).toBe(false);
    expect(isLocalDatabase("not a url")).toBe(false);
  });
});
