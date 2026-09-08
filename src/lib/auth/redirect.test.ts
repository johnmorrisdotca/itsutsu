import { describe, expect, it } from "vitest";

import { safeDestination } from "./redirect";

describe("safeDestination", () => {
  it("keeps an ordinary path, query and all", () => {
    expect(safeDestination("/history")).toBe("/history");
    expect(safeDestination("/history?result=white")).toBe("/history?result=white");
    expect(safeDestination("/games/gomoku/abc/seat/xyz")).toBe("/games/gomoku/abc/seat/xyz");
  });

  /**
   * The ones a `startsWith("/")` check lets through. A browser reads both as
   * protocol-relative and leaves the site, which is how a sign-in page becomes
   * a phishing redirect wearing a real domain.
   */
  it.each(["//evil.test", "//evil.test/path", "/\\evil.test", "/\\\\evil.test"])(
    "refuses %j, which resolves off-site",
    (input) => {
      expect(safeDestination(input)).toBe("/games");
    },
  );

  it("refuses an absolute URL", () => {
    for (const input of ["https://evil.test", "http://evil.test", "javascript:alert(1)"]) {
      expect(safeDestination(input)).toBe("/games");
    }
  });

  it("refuses nothing at all", () => {
    for (const input of [null, undefined, ""]) {
      expect(safeDestination(input)).toBe("/games");
    }
  });

  it("keeps a bare slash, which is an explicit choice of the board", () => {
    expect(safeDestination("/")).toBe("/");
  });
});
