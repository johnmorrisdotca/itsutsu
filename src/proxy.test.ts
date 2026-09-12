import { readFileSync } from "node:fs";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EMBED_TOKEN_PARAM, signEmbedToken } from "@/lib/auth/embedToken";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";

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
      // The doorstep. It writes nothing, but it is the last step before a game
      // and it describes one — a stranger has no business reading it, and
      // pressing Begin on it needs a session anyway.
      "/games/hex/begin",
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

  it("refuses when NODE_ENV says nothing it recognises, rather than falling through to the bypass", async () => {
    /*
     * THE CASE THE OBVIOUS SPELLING GETS WRONG. Written as
     * `if (NODE_ENV === "production") refuse`, every other value reaches the
     * bypass — unset, misspelled, or set by a runtime that does not use the
     * word — and the environment nobody thought about is the one that
     * resolves OPEN. The relaxed environments are named instead, so anything
     * unrecognised refuses.
     */
    vi.stubEnv("NODE_ENV", "staging");
    delete process.env.AUTH_SECRET;
    const response = await proxy(pageRequest());
    expect(response.status).toBe(503);
  });

  it("refuses when NODE_ENV is not set at all", async () => {
    /*
     * Deleted from `process.env` directly rather than through `stubEnv`.
     * Stubbing a variable to `undefined` and the block's own `afterEach`
     * restoring `process.env` wholesale are two mechanisms for the same job,
     * and together they leave the value set — this case read 200 for that
     * reason while the identical code answered 503 when run on its own. The
     * bug was the test, and a security case that passes for a reason nobody
     * can name is worth less than none.
     */
    vi.unstubAllEnvs();
    // NODE_ENV is typed read-only by @types/node; the point of the case is
    // precisely the value that type says cannot happen.
    delete (process.env as { NODE_ENV?: string }).NODE_ENV;
    delete process.env.AUTH_SECRET;
    const response = await proxy(pageRequest());
    expect(response.status).toBe(503);
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

/**
 * The maintenance shutter, which is the only thing in this repository allowed
 * to turn the gate's yes into a no.
 *
 * Every case below drives `proxy` itself with a constructed request, because
 * the whole question is what a REQUEST gets — `maintenanceRefusal` returning
 * the right object would prove nothing about where the gate calls it from, and
 * the placement is the part that can be wrong. Two of these fail if it is
 * called before the deciding rather than after, and two fail if it is called
 * on the wrong side of the session check.
 */
describe("the site being worked on", () => {
  const ENV = { ...process.env };
  const SECRET = "a-secret-long-enough-to-be-accepted";
  const OPERATOR = "operator@itsutsu.com";

  afterEach(() => {
    process.env = { ...ENV };
    vi.unstubAllEnvs();
  });

  /** The shutter down, a key in the lock, and one operator on the allowlist. */
  function shutTheSite(): void {
    process.env.AUTH_SECRET = SECRET;
    process.env.ADMIN_EMAILS = OPERATOR;
    process.env.SITE_MAINTENANCE = "on";
  }

  async function cookieFor(session: {
    kind: "admin" | "player";
    email?: string;
  }): Promise<string> {
    const token = await signSession({
      ...session,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(token).not.toBeNull();
    return `${SESSION_COOKIE}=${token}`;
  }

  function ask(path: string, cookie?: string): NextRequest {
    return new NextRequest(
      `https://itsutsu.com${path}`,
      cookie === undefined ? undefined : { headers: { cookie } },
    );
  }

  it("shows a member the notice instead of the page they asked for", async () => {
    shutTheSite();
    const response = await proxy(ask("/history", await cookieFor({ kind: "player", email: "her@example.com" })));
    expect(response.status).toBe(503);
    // Not a redirect to /join: signing in is not what is wrong here, and the
    // door must not be made to look like the way out of it.
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.text();
    expect(body).toContain("being worked on");
    // It names no variable and no operator. Somebody reading the shutter learns
    // that the site is shut, and nothing whatsoever about how it is run.
    expect(body).not.toContain("SITE_MAINTENANCE");
    expect(body).not.toContain(OPERATOR);
  });

  it("shows a stranger the notice on the pages they could otherwise read", async () => {
    shutTheSite();
    const response = await proxy(ask("/games"));
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("being worked on");
  });

  /*
   * AND LEAVES A REFUSAL THAT HAD ALREADY HAPPENED EXACTLY AS IT WAS, which is
   * the invariant stated from the other side and is worth a test of its own
   * because it looks at first like a gap. A stranger deep-linking to /history
   * is sent to the door, not shown the notice — the shutter runs where the
   * gate's yeses arrive, and this request never got one. It cannot turn a no
   * into a different no any more than it can turn one into a yes.
   *
   * Nothing is lost by it: they were not going to see /history today either
   * way, and the door is where a visitor with no invite belongs. What matters
   * is that every page a non-operator can actually REACH is the notice, which
   * the two tests above are.
   */
  it("leaves a refusal the gate had already arrived at untouched", async () => {
    shutTheSite();
    const page = await proxy(ask("/history"));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toContain("/join");
    const api = await proxy(ask("/api/games"));
    expect(api.status).toBe(401);
  });

  it("answers an API caller with a 503 it can act on rather than HTML", async () => {
    shutTheSite();
    const response = await proxy(
      ask("/api/games", await cookieFor({ kind: "player", email: "her@example.com" })),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual({
      error: "The site is being worked on. Try again shortly.",
    });
  });

  it("lets the operator through, so the site can be taken back out of it", async () => {
    shutTheSite();
    const response = await proxy(ask("/history", await cookieFor({ kind: "admin", email: OPERATOR })));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets the operator reach the panel that says how to lift it", async () => {
    shutTheSite();
    const response = await proxy(ask("/admin", await cookieFor({ kind: "admin", email: OPERATOR })));
    expect(response.status).toBe(200);
  });

  /*
   * The two halves of being the operator, each failing on its own. A session
   * that merely SAYS admin is not enough, or removing somebody from
   * ADMIN_EMAILS would leave their cookie working until it expired — a day.
   * And an ordinary member whose address happens to be on the allowlist is
   * still an ordinary member, since only the operator's own sign-in mints the
   * admin kind.
   */
  it("shuts out a member's session, allowlisted address or not", async () => {
    shutTheSite();
    const response = await proxy(ask("/history", await cookieFor({ kind: "player", email: OPERATOR })));
    expect(response.status).toBe(503);
  });

  it("shuts out an admin session whose address is not on the allowlist", async () => {
    shutTheSite();
    const response = await proxy(
      ask("/history", await cookieFor({ kind: "admin", email: "someone@example.com" })),
    );
    expect(response.status).toBe(503);
  });

  it("shuts out a session with no address at all, which an invite code mints", async () => {
    shutTheSite();
    const response = await proxy(ask("/history", await cookieFor({ kind: "player" })));
    expect(response.status).toBe(503);
  });

  /*
   * READING DOES NOT STAY OPEN, and this is a decision rather than a
   * consequence. "Reading is open, playing is gated" is about who holds an
   * invite; it is not about an hour when the database is being migrated
   * underneath the pages that read it. Every open page here draws from the same
   * database, so leaving them up would show a reader a 500, a half-migrated
   * table, or a count that is briefly untrue — three worse answers than a
   * notice saying the site is being worked on.
   */
  it("closes the pages a stranger may ordinarily read", async () => {
    shutTheSite();
    for (const path of ["/", "/games", "/games/gomoku", "/games/hex/rules", "/about", "/learn"]) {
      const response = await proxy(ask(path));
      expect(response.status, `${path} should be shut while the site is`).toBe(503);
    }
  });

  /*
   * The doors, which is how the shutter is survivable. The recovery has to work
   * from a browser holding no cookie at all — a new laptop, a cleared cache, an
   * operator pass that expired overnight — so the paths that mint a session
   * stay reachable. They grant nothing: each was already open before this
   * existed, and the shutter simply declines to take them back.
   */
  it("keeps the door open, so the operator can always sign in and lift it", async () => {
    shutTheSite();
    for (const path of ["/join", "/api/session", "/api/auth/callback/google"]) {
      const response = await proxy(ask(path));
      expect(response.status, `${path} must stay reachable`).toBe(200);
      expect(response.headers.get("location"), `${path} must not redirect`).toBeNull();
    }
  });

  /*
   * The recovery path that needs no database write and no session: the variable
   * itself. Removing it, or setting it to anything that is not "on", puts the
   * site back exactly as it was — which is what makes a stuck setting
   * recoverable from Vercel alone.
   */
  it("is off when the variable is absent, and the gate behaves exactly as before", async () => {
    process.env.AUTH_SECRET = SECRET;
    delete process.env.SITE_MAINTENANCE;
    expect((await proxy(ask("/games"))).status).toBe(200);
    const shut = await proxy(ask("/history"));
    expect(shut.status).toBe(307);
    expect(shut.headers.get("location")).toContain("/join");
  });

  it("is off for any value that is not the word, rather than for any value that is not a word it knows", async () => {
    process.env.AUTH_SECRET = SECRET;
    for (const value of ["off", "", "true", "1", "yes", "ON!", "maintenance"]) {
      process.env.SITE_MAINTENANCE = value;
      const response = await proxy(ask("/games"));
      expect(response.status, `SITE_MAINTENANCE=${value} must not shut the site`).toBe(200);
    }
  });

  it("reads the word whatever case or spacing it was pasted with", async () => {
    process.env.AUTH_SECRET = SECRET;
    for (const value of ["on", "ON", " on ", "On"]) {
      process.env.SITE_MAINTENANCE = value;
      const response = await proxy(ask("/games"));
      expect(response.status, `SITE_MAINTENANCE=${value} must shut the site`).toBe(503);
    }
  });

  /*
   * The two token exceptions are deliberately NOT shuttered, and that is a
   * decision worth a failing test if anybody changes it. Both are narrow,
   * read-only credentials that never reach a page; and the board token is how
   * the operator works the backlog, which is exactly what they are doing while
   * the site is down.
   */
  it("leaves the embed and board credentials alone, which is how the operator keeps working", async () => {
    shutTheSite();
    process.env.BOARD_TOKEN = "right-token";
    const token = await signEmbedToken("proxy.test.ts");
    const embed = await proxy(ask(`/embed?${EMBED_TOKEN_PARAM}=${token}`));
    expect(embed.status).toBe(200);
    const board = await proxy(
      new NextRequest("https://itsutsu.com/api/backlog", {
        headers: { Authorization: "Bearer right-token" },
      }),
    );
    expect(board.status).toBe(200);
  });

  /*
   * The invariant the whole design rests on, stated as a test rather than only
   * as a comment: the shutter can take a way through away and can never add
   * one. A path the gate refuses is still refused while the site is shut, and
   * no cookie, variable or address makes the shutter open it.
   */
  it("never opens anything the gate had shut", async () => {
    shutTheSite();
    const operator = await cookieFor({ kind: "admin", email: OPERATOR });
    // The one request that gets furthest: the operator, on a gated page. Even
    // that is only ever the 200 the gate would have given them anyway.
    expect((await proxy(ask("/history", operator))).status).toBe(200);
    // And with no key at all, in production, the shutter changes nothing: the
    // unconfigured refusal still wins, because it runs before this does.
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.AUTH_SECRET;
    const response = await proxy(ask("/history"));
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toContain("not configured");
  });
});

/**
 * A language asked for in the address.
 *
 * `rememberLanguage` had no cases at all until the language became a
 * cross-device preference, and the reason it needs them now is that it is the
 * ONE THING THE GATE CONTRIBUTES to that feature: the render on the other
 * side of its redirect cannot tell a fresh choice from a year-old cookie
 * unless this file says so.
 *
 * `proxy.test.ts` is deliberately where this lives rather than an i18n test.
 * The rule for this file is that an addition may only wrap a yes the gate has
 * already arrived at, so the claim worth pinning is not "the cookie is set"
 * but "no decision moved to make room for it" — and only the gate's own tests
 * can say that.
 */
describe("remembering a language asked for in the address", () => {
  const ENV = { ...process.env };
  const SECRET = "a-secret-long-enough-to-be-accepted";

  afterEach(() => {
    process.env = { ...ENV };
    vi.unstubAllEnvs();
  });

  function ask(path: string, cookie?: string): NextRequest {
    process.env.AUTH_SECRET = SECRET;
    return new NextRequest(
      `https://itsutsu.com${path}`,
      cookie === undefined ? undefined : { headers: { cookie } },
    );
  }

  /** The cookies a response's Set-Cookie headers carried, by name. */
  function cookiesOn(response: Response): Record<string, string> {
    const found: Record<string, string> = {};
    for (const line of response.headers.getSetCookie()) {
      const [pair = ""] = line.split(";");
      const at = pair.indexOf("=");
      if (at > 0) found[pair.slice(0, at).trim()] = pair.slice(at + 1).trim();
    }
    return found;
  }

  it("takes the language out of the address and keeps it in a cookie", async () => {
    const response = await proxy(ask("/games?lang=ja"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/games");
    expect(location, "the address kept the language on it").not.toContain("lang=");
    expect(cookiesOn(response).lang).toBe("ja");
  });

  /*
   * THE ONE NEW THING THE GATE DOES. A member's language lives on their
   * account from this release on, and the account is one request behind at
   * the moment they change their mind — so something has to say "this was
   * chosen just now", and only the request carrying `?lang=` knows it.
   * `memberLanguage.ts` does the keeping; this only says so in a cookie.
   */
  it("says in a second cookie that the language was chosen just now", async () => {
    const set = cookiesOn(await proxy(ask("/games?lang=ja")));
    expect(set["lang-chosen"]).toBe("ja");
    // The language, not a flag: whoever reads the marker needs to know WHICH,
    // and a flag plus the other cookie would be two sources for one fact.
    expect(set["lang-chosen"]).toBe(set.lang);
  });

  it("gives the marker a life measured in a minute, and the language a year", async () => {
    const lines = (await proxy(ask("/games?lang=ja"))).headers.getSetCookie();
    const marker = lines.find((line) => line.startsWith("lang-chosen="));
    const kept = lines.find((line) => line.startsWith("lang="));
    // A marker that outlived its click would become a second standing
    // preference, which is the thing it exists to prevent.
    expect(marker).toContain("Max-Age=60");
    expect(kept).toContain(`Max-Age=${60 * 60 * 24 * 365}`);
    for (const line of [marker, kept]) {
      expect(line).toContain("HttpOnly");
      expect(line).toContain("Path=/");
    }
  });

  it("sets neither cookie for a language the site does not speak", async () => {
    for (const wrong of ["de", "zh", "es", "klingon", "", "JA"]) {
      const response = await proxy(ask(`/games?lang=${wrong}`));
      expect(response.status, `lang=${wrong} must not redirect`).toBe(200);
      expect(cookiesOn(response), `lang=${wrong} must keep nothing`).toEqual({});
    }
  });

  it("never answers a form post with a redirect", async () => {
    process.env.AUTH_SECRET = SECRET;
    const posted = await proxy(
      new NextRequest("https://itsutsu.com/games?lang=ja", { method: "POST" }),
    );
    expect(posted.headers.get("location")).toBeNull();
    expect(cookiesOn(posted)).toEqual({});
  });

  /*
   * THE INVARIANT, and the only reason a cookie belongs in this file at all.
   * `rememberLanguage` runs inside `carryOn`, which is where all three of the
   * gate's yeses arrive, so it can only ever act on a request already being
   * let through. A `?lang=` on a shut path must still be shut, and neither
   * cookie may appear on that answer: a cookie set on a refusal would be the
   * gate leaking a decision it never made.
   */
  it("cannot turn a refusal into a way through, and leaves no cookie on one", async () => {
    const shut = await proxy(ask("/history?lang=ja"));
    expect(shut.status).toBe(307);
    expect(shut.headers.get("location")).toContain("/join");
    expect(cookiesOn(shut)).toEqual({});
  });

  it("carries the whole address to the door, language and all", async () => {
    // The language is dropped only on the way past a yes. A visitor sent to
    // the door must still arrive back where they were going.
    const shut = await proxy(ask("/history?result=white&lang=ja"));
    expect(shut.headers.get("location") ?? "").toContain("result%3Dwhite");
  });

  it("remembers for a member's session exactly as it does for a stranger", async () => {
    // Signed with the key the gate is about to verify with, or the session is
    // simply not a session and the case would prove nothing about languages.
    process.env.AUTH_SECRET = SECRET;
    const token = await signSession({
      kind: "player",
      email: "her@example.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const response = await proxy(ask("/history?lang=ja", `${SESSION_COOKIE}=${token}`));
    expect(response.status).toBe(307);
    // Who is asking is not this file's business: the gate sets the same two
    // cookies either way and never looks up an account to decide.
    expect(cookiesOn(response)["lang-chosen"]).toBe("ja");
  });
});
