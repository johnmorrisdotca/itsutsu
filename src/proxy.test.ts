import { readFileSync } from "node:fs";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EMBED_TOKEN_PARAM, signEmbedToken } from "@/lib/auth/embedToken";

import { MATCHER_EXEMPT, config, isBoardApiPath, proxy, wouldBeOpen } from "./proxy";

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

describe("isBoardApiPath", () => {
  it("is the two backlog routes, and nothing that merely starts the same way", () => {
    expect(isBoardApiPath("/api/backlog")).toBe(true);
    expect(isBoardApiPath("/api/backlog/abc123")).toBe(true);
    expect(isBoardApiPath("/api/backlogging")).toBe(false);
    expect(isBoardApiPath("/api/games")).toBe(false);
  });

  it("cannot be walked out of the board routes with an encoded separator", () => {
    /*
     * THESE TWO MATCH, AND ARE SAFE FOR A REASON OUTSIDE THIS FILE — which is
     * exactly why they are pinned here rather than left to be re-derived.
     *
     * A dot-dot spelled plainly, or percent-encoded as %2e%2e, is normalised
     * by the URL parser BEFORE the gate is asked, so `/api/backlog/../games/
     * live` arrives as `/api/games/live` and never matches at all. An encoded
     * SLASH is not: `%2f` stays inside its segment, so these two reach this
     * check still spelled `/api/backlog/...` and it answers true.
     *
     * That is only safe because Next routes on the same un-decoded pathname —
     * verified against the live site, where `/games/..%2fapi%2fgames%2flive`
     * answers 404 rather than the 401 that `/api/games/live` itself gives. So
     * the request lands somewhere under the backlog directory or nowhere, and
     * the token cannot carry it to another route.
     *
     * If a Next upgrade ever decodes `%2f` before matching, that stops being
     * true and this becomes a hole in the gate rather than a door in it. This
     * case will not catch that by itself — nothing in a unit test can — but it
     * records the assumption at the place that depends on it.
     */
    expect(isBoardApiPath("/api/backlog/..%2fgames%2flive")).toBe(true);
    expect(isBoardApiPath("/api/backlog/games/live")).toBe(true);
    expect(isBoardApiPath("/api/games/live")).toBe(false);
  });
});

/**
 * Board convergence ITS-02: an agent's terminal has no browser to hold a
 * session cookie in, so it carries BOARD_TOKEN in a header instead. These
 * exercise `proxy()` itself, not just the path list, because the whole
 * point is a request that never had a session reaching the route at all —
 * `wouldBeOpen`/`isBoardApiPath` alone cannot show that the token is
 * actually checked.
 */
describe("the board token, through the gate itself", () => {
  const ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV };
  });

  function backlogRequest(path: string, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest(`https://itsutsu.com${path}`, { headers });
  }

  it("lets the right bearer token through with no session at all", async () => {
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    process.env.BOARD_TOKEN = "right-token";
    const response = await proxy(backlogRequest("/api/backlog", { Authorization: "Bearer right-token" }));
    // NextResponse.next() carries no redirect and answers as an ordinary 200.
    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("falls through to the ordinary API refusal for a wrong token", async () => {
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    process.env.BOARD_TOKEN = "right-token";
    const response = await proxy(backlogRequest("/api/backlog", { Authorization: "Bearer wrong" }));
    expect(response.status).toBe(401);
  });

  it("falls through with no Authorization header at all", async () => {
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    process.env.BOARD_TOKEN = "right-token";
    const response = await proxy(backlogRequest("/api/backlog"));
    expect(response.status).toBe(401);
  });

  it("never opens anything but the board routes, whatever the token", async () => {
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    process.env.BOARD_TOKEN = "right-token";
    const response = await proxy(backlogRequest("/api/games", { Authorization: "Bearer right-token" }));
    expect(response.status).toBe(401);
  });

  it("opens nothing when BOARD_TOKEN is not set, whatever the request carries", async () => {
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    delete process.env.BOARD_TOKEN;
    const response = await proxy(backlogRequest("/api/backlog", { Authorization: "Bearer anything" }));
    expect(response.status).toBe(401);
  });
});

/**
 * The security fault this file exists to close: the gate used to bypass
 * every check — pages and API routes alike — whenever AUTH_SECRET was
 * missing or too short, in production as well as in development.
 * `signingKey()` (session.ts, signing.ts) cannot mint or verify a session
 * either way, so that bypass was never "let the operator in while nobody
 * else can get a session" — it was "let everybody in, unauthenticated,
 * including whoever finds the variable gone."
 *
 * Production now refuses instead (503, saying nothing about which variable
 * is wrong); development is exactly as it was, since a bypass with no
 * stranger to protect was never the bug.
 */
describe("the gate with no working key", () => {
  const ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV };
    vi.unstubAllEnvs();
  });

  function pageRequest(path = "/history"): NextRequest {
    return new NextRequest(`https://itsutsu.com${path}`);
  }

  function apiRequest(path = "/api/games"): NextRequest {
    return new NextRequest(`https://itsutsu.com${path}`);
  }

  it("refuses a page in production when AUTH_SECRET is missing, rather than letting it through", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.AUTH_SECRET;
    const response = await proxy(pageRequest());
    expect(response.status).toBe(503);
    // Not a redirect to /join: signing in is not the way out of this, and
    // must not be made to look like it is.
    expect(response.headers.get("location")).toBeNull();
    const body = await response.text();
    expect(body).not.toContain("AUTH_SECRET");
  });

  it("refuses an API route in production when AUTH_SECRET is missing, rather than letting it through", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.AUTH_SECRET;
    const response = await proxy(apiRequest());
    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(JSON.stringify(body)).not.toContain("AUTH_SECRET");
  });

  it("refuses in production when AUTH_SECRET is set but too short", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "short";
    const response = await proxy(pageRequest());
    expect(response.status).toBe(503);
  });

  it("keeps the old bypass in development when AUTH_SECRET is missing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.AUTH_SECRET;
    const response = await proxy(pageRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps the old bypass in development when AUTH_SECRET is set but too short", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.AUTH_SECRET = "short";
    const response = await proxy(pageRequest());
    expect(response.status).toBe(200);
  });

  it("does not refuse in production once AUTH_SECRET is present and correct — it falls through to the ordinary gate", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    const response = await proxy(pageRequest());
    // No session cookie: the ORDINARY refusal (send them to /join), not the
    // new one — proof this change only ever narrows what used to be an
    // unconditional bypass, and never touches the configured case.
    expect(response.status).not.toBe(503);
    expect(response.headers.get("location")).toContain("/join");
  });

  it("still answers the API's ordinary 401 in production once AUTH_SECRET is present and correct", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    const response = await proxy(apiRequest());
    expect(response.status).toBe(401);
  });
});

/**
 * The two existing token exceptions do not go through `gateIsConfigured()`
 * at all — the board token is compared against its own separate env var,
 * and both checks run before the new "is the gate configured" branch this
 * ticket adds. Pinned here, in production specifically, because that is the
 * one environment where the new branch exists to run.
 */
describe("the two token exceptions survive the fail-closed change, in production", () => {
  const ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV };
    vi.unstubAllEnvs();
  });

  it("still lets a valid embed token through with no session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    const token = await signEmbedToken("proxy.test.ts");
    expect(token).not.toBeNull();
    const response = await proxy(
      new NextRequest(`https://itsutsu.com/embed?${EMBED_TOKEN_PARAM}=${token}`),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still lets the right board token through with no session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
    process.env.BOARD_TOKEN = "right-token";
    const response = await proxy(
      new NextRequest("https://itsutsu.com/api/backlog", {
        headers: { Authorization: "Bearer right-token" },
      }),
    );
    expect(response.status).toBe(200);
  });
});
