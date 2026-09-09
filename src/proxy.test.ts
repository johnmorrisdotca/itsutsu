import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MATCHER_EXEMPT, config, wouldBeOpen } from "./proxy";

/**
 * The gate, and the one shortcut through it.
 *
 * Nothing reaches the site without a session except a short list of paths the
 * gate lets through on purpose. Some of those are static files — the artwork,
 * the marks, the icons — and running the gate over them can only ever end in
 * letting them through, so the matcher skips them and saves an invocation per
 * file. That saving is only safe while the two lists agree, and they are
 * written in two places for a reason Next imposes: it reads the matcher
 * without running the file, so it cannot be built from the other list. This
 * is what holds them in step.
 */
describe("the matcher's exemptions", () => {
  it("skips only paths the gate would have opened anyway", () => {
    for (const path of MATCHER_EXEMPT) {
      expect(wouldBeOpen(path), `${path} is skipped by the matcher but not open`).toBe(true);
    }
  });

  it("still runs over everything that is not one of them", () => {
    const [pattern] = config.matcher;
    const matcher = new RegExp(`^${pattern}$`);
    for (const path of [
      "/",
      "/games",
      "/games/gomoku",
      "/history",
      "/players",
      "/admin",
      "/backlog",
      "/api/games",
      "/api/backlog",
      "/join",
      "/rules",
      "/rules/hex",
    ]) {
      expect(matcher.test(path), `${path} must still reach the gate`).toBe(true);
    }
  });

  it("skips the files it says it skips", () => {
    const [pattern] = config.matcher;
    const matcher = new RegExp(`^${pattern}$`);
    for (const path of MATCHER_EXEMPT) {
      expect(matcher.test(path), `${path} should not reach the gate`).toBe(false);
    }
    for (const path of ["/_next/static/chunk.js", "/_next/image?url=x"]) {
      expect(matcher.test(path), `${path} should not reach the gate`).toBe(false);
    }
  });

  it("does not skip a page whose name merely begins the same way", () => {
    const [pattern] = config.matcher;
    const matcher = new RegExp(`^${pattern}$`);
    // "/artists" is not "/art/", and a gate that could not tell them apart
    // would be a gate anybody could walk around by naming a page carefully.
    for (const path of ["/artists", "/art", "/branding", "/brand"]) {
      expect(matcher.test(path), `${path} must still reach the gate`).toBe(true);
    }
  });

  it("names every file it skips, so the test cannot fall behind the pattern", () => {
    // Each alternative in the pattern that is not one of Next's own must have
    // a matching address in MATCHER_EXEMPT, or it is being skipped untested.
    const [pattern] = config.matcher;
    const alternatives = pattern
      .slice(pattern.indexOf("(?!") + 3, pattern.indexOf(")."))
      .split("|")
      .filter((part) => !part.startsWith("_next"));
    for (const alternative of alternatives) {
      const plain = alternative.replace(/\\/g, "");
      expect(
        MATCHER_EXEMPT.some((path) => path.slice(1).startsWith(plain)),
        `the matcher skips "${plain}" but no test address covers it`,
      ).toBe(true);
    }
  });
});

describe("the paths that stay open", () => {
  it("opens the front page, the door and the documentation", () => {
    for (const path of ["/", "/join", "/about", "/rules", "/rules/hex", "/learn"]) {
      expect(wouldBeOpen(path), `${path} should be readable without an invite`).toBe(true);
    }
  });

  it("holds everything else shut", () => {
    for (const path of ["/games", "/history", "/players", "/admin", "/backlog", "/me", "/api/games"]) {
      expect(wouldBeOpen(path), `${path} should need a session`).toBe(false);
    }
  });

  it("is not opened by a name that merely starts with an open one", () => {
    for (const path of ["/joinery", "/rulesy", "/aboutus", "/learners"]) {
      expect(wouldBeOpen(path), `${path} must not ride in on a prefix`).toBe(false);
    }
  });

  it("keeps the robots file open, since it is the file that says what is", () => {
    expect(wouldBeOpen("/robots.txt")).toBe(true);
    const robots = readFileSync("src/app/robots.ts", "utf8");
    // Whatever it allows, it must refuse the rest rather than allow by default.
    expect(robots).toContain('disallow: "/"');
  });
});
