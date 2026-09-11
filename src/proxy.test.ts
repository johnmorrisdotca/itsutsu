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
      "/games/hex/rules",
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
    /*
     * /rules and /rules/hex used to be on this line. A game is one address
     * with its facets underneath now, so what a stranger may read is the
     * catalogue, a game, and what that game IS.
     */
    for (const path of [
      "/",
      "/join",
      "/about",
      "/learn",
      "/games",
      "/games/hex",
      "/games/hex/rules",
      "/games/hex/family",
      "/games/hex/background",
    ]) {
      expect(wouldBeOpen(path), `${path} should be readable without an invite`).toBe(true);
    }
  });

  it("holds everything else shut", () => {
    for (const path of ["/history", "/players", "/admin", "/backlog", "/me", "/api/games"]) {
      expect(wouldBeOpen(path), `${path} should need a session`).toBe(false);
    }
  });

  /**
   * READING IS OPEN, PLAYING IS GATED — and this is where the line falls under
   * a game. It is the assertion a prefix entry for "/games" would have wiped
   * out in one word, because that list matches by prefix and every one of
   * these begins the same way.
   */
  it("keeps the playing half of a game shut", () => {
    for (const path of [
      "/games/hex/play",
      "/games/hex/new",
      "/games/hex/match/abc",
      "/games/hex/match/abc/12",
      "/games/hex/match/abc/seat/tok",
      "/games/hex/me",
    ]) {
      expect(wouldBeOpen(path), `${path} is playing, or is about the reader, and needs a session`).toBe(
        false,
      );
    }
  });

  /**
   * THE BLOCKER IS GONE; THE DECISION HAS NOT BEEN TAKEN YET.
   *
   * A game's record and its ladder are READING, and by the rule above they
   * belong open. They were shut for a concrete reason rather than a cautious
   * one: both print members' names through `PlayerName`, which showed
   * "Hanako M." while the href under it read /players/hanako-morris. The whole
   * name was in the markup, which is the leak that was fixed in production by
   * taking members off open pages in the first place.
   *
   * **That is fixed.** `playerPath` builds `/players/<id>` for anybody with a
   * member behind them, and `playerLinks.coverage.test.ts` fails the build for
   * a caller that links to a person without their id. So nothing about a
   * name's address holds these two shut any more.
   *
   * They stay shut here because OPENING them is a change to `proxy.ts` and
   * belongs to `what-a-visitor-with-no-invite-may-see`, landed on its own with
   * its own suite rather than ridden in on an address change. This test is now
   * the note that says so: it asserts they are still shut, and records WHY
   * that is a pending decision rather than a live leak.
   *
   * WHEN THAT TICKET IS TAKEN: add `history|standings` to `OPEN_PATTERNS` and
   * delete this test.
   */
  it("keeps a game's record and ladder shut until opening them is decided on purpose", () => {
    for (const path of ["/games/hex/history", "/games/hex/standings"]) {
      expect(wouldBeOpen(path), `${path} is still shut, pending a deliberate decision`).toBe(false);
    }
    /*
     * And the reason they WERE shut is genuinely gone — asserted rather than
     * claimed, because "the blocker is fixed" is exactly the sort of sentence
     * that stays in a comment long after it stopped being true.
     */
    const shown = readFileSync("src/components/players/PlayerName.tsx", "utf8");
    expect(shown, "a person's link must be built from their id").toContain("playerPath(whole, memberId)");
  });

  it("is not opened by an address that merely looks like one of the open ones", () => {
    /*
     * The pattern is anchored at both ends and allows exactly one segment for
     * the game, so nothing rides in on it by being longer or by starting the
     * same way.
     */
    for (const path of [
      "/games/hex/rules/secret",
      "/games/hex/match/rules",
      "/gamesy/hex/rules",
      "/games/hex/family/anything",
    ]) {
      expect(wouldBeOpen(path), `${path} must not ride in on the rules pattern`).toBe(false);
    }
  });

  it("is not opened by a name that merely starts with an open one", () => {
    for (const path of ["/joinery", "/gamesy", "/aboutus", "/learners"]) {
      expect(wouldBeOpen(path), `${path} must not ride in on a prefix`).toBe(false);
    }
  });

  it("keeps the robots file open, since it is the file that says what is", () => {
    expect(wouldBeOpen("/robots.txt")).toBe(true);
    const robots = readFileSync("src/app/robots.ts", "utf8");
    // Whatever it allows, it must refuse the rest rather than allow by default.
    expect(robots).toContain('disallow: "/"');
  });

  /**
   * Everything robots.txt invites a crawler to is a path this gate really
   * opens.
   *
   * Not the converse: `/join` is open and deliberately uncrawlable, because a
   * door is not a page to arrive at from a search result. Only one direction
   * can go wrong silently, and it did — the file advertised `/rules` for weeks
   * after that namespace stopped existing, and omitted `/games`, which had
   * just been opened on purpose. A crawler was being sent to a 404 and steered
   * away from the pages this site most wants found.
   */
  it("never invites a crawler to a path the gate shuts", () => {
    const robots = readFileSync("src/app/robots.ts", "utf8");
    const listed = robots.match(/allow: \[([^\]]*)\]/)?.[1] ?? "";
    const allowed = [...listed.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    expect(allowed.length, "no allow list was found to check").toBeGreaterThan(0);
    for (const entry of allowed) {
      // "/$" is robots.txt's way of saying the front page and nothing under it.
      const path = entry === "/$" ? "/" : entry.replace(/\/$/, "");
      expect(wouldBeOpen(path), `robots.txt invites crawlers to ${entry}, which the gate shuts`).toBe(true);
    }
  });
});
