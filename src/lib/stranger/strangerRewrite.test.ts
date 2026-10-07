import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { SUITE_SERVER_ENV } from "@/lib/suiteServer";

import { ASK_FOR_KEPT_COPY } from "./strangerPath";
import { strangerRewrite } from "./strangerRewrite";

/** The live site: production, on Vercel. Every case below is about the live site unless it says otherwise. */
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv(SUITE_SERVER_ENV, undefined);
});
afterEach(() => vi.unstubAllEnvs());

function ask(path: string, init: { cookie?: string; language?: string; method?: string; asks?: boolean } = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (init.asks === true) headers[ASK_FOR_KEPT_COPY] = "1";
  if (init.cookie !== undefined) headers.cookie = init.cookie;
  if (init.language !== undefined) headers["accept-language"] = init.language;
  return new NextRequest(`https://itsutsu.com${path}`, { method: init.method ?? "GET", headers });
}

/** Where the request was sent, or null when it carried on as it was. */
function rewrittenTo(request: NextRequest): string | null {
  const response = strangerRewrite(request);
  if (response === null) return null;
  const target = response.headers.get("x-middleware-rewrite");
  return target === null ? null : new URL(target).pathname + new URL(target).search;
}

describe("a stranger is answered from the kept copy of an open page", () => {
  it("rewrites a plain visit, and keeps the address in the bar by rewriting rather than redirecting", () => {
    expect(rewrittenTo(ask("/games/gomoku/rules"))).toBe("/stranger/games/gomoku/rules");
    expect(rewrittenTo(ask("/"))).toBe("/stranger");
    expect(rewrittenTo(ask("/games"))).toBe("/stranger/games");
  });

  it("does the same for a crawler that says nothing about language, and for a reader of English", () => {
    expect(rewrittenTo(ask("/learn"))).toBe("/stranger/learn");
    expect(rewrittenTo(ask("/learn", { language: "en-GB,en;q=0.9" }))).toBe("/stranger/learn");
    expect(rewrittenTo(ask("/learn", { language: "de-DE,de;q=0.9" }))).toBe("/stranger/learn");
  });

  it("keeps Next's own query on a client navigation, so the router's cache key still matches", () => {
    expect(rewrittenTo(ask("/games/gomoku?_rsc=abc12"))).toBe("/stranger/games/gomoku?_rsc=abc12");
  });

  it("answers a head request the way it answers a get", () => {
    expect(rewrittenTo(ask("/games/gomoku", { method: "HEAD" }))).toBe("/stranger/games/gomoku");
  });
});

describe("anybody who might be more than an ordinary stranger is answered live", () => {
  it("never rewrites a request with the site's session cookie, whatever it holds", () => {
    expect(rewrittenTo(ask("/games/gomoku", { cookie: `${SESSION_COOKIE}=anything` }))).toBeNull();
    expect(rewrittenTo(ask("/", { cookie: `other=1; ${SESSION_COOKIE}=garbage` }))).toBeNull();
  });

  it("never rewrites a request carrying Google sign-in's cookies, which the door reads", () => {
    expect(rewrittenTo(ask("/join", { cookie: "next-auth.session-token=x" }))).toBeNull();
    expect(rewrittenTo(ask("/join", { cookie: "__Secure-next-auth.session-token=x" }))).toBeNull();
    expect(rewrittenTo(ask("/join", { cookie: "next-auth.csrf-token=x" }))).toBeNull();
  });

  it("never rewrites a request that is not a read", () => {
    expect(rewrittenTo(ask("/join", { method: "POST" }))).toBeNull();
    expect(rewrittenTo(ask("/games/gomoku", { method: "PUT" }))).toBeNull();
  });

  it("answers a reader of Japanese live, however they said so, and a reader who chose English is kept", () => {
    expect(rewrittenTo(ask("/games/gomoku", { language: "ja-JP,ja;q=0.9,en;q=0.8" }))).toBeNull();
    expect(rewrittenTo(ask("/games/gomoku", { cookie: "lang=ja" }))).toBeNull();
    expect(rewrittenTo(ask("/games/gomoku", { cookie: "lang=en; lang-chosen=ja" }))).toBeNull();
    expect(rewrittenTo(ask("/games/gomoku", { cookie: "lang=en", language: "ja" }))).toBe("/stranger/games/gomoku");
    expect(rewrittenTo(ask("/games/gomoku", { cookie: "lang=ja; lang-chosen=en" }))).toBe("/stranger/games/gomoku");
  });

  it("answers live a page whose query changes what it says, and ignores a query on one whose does not", () => {
    expect(rewrittenTo(ask("/games?letter=A"))).toBeNull();
    expect(rewrittenTo(ask("/games/cards?kind=puzzle"))).toBeNull();
    expect(rewrittenTo(ask("/join?code=abc"))).toBeNull();
    expect(rewrittenTo(ask("/join?error=x"))).toBeNull();
    expect(rewrittenTo(ask("/join?ask=1"))).toBeNull();
    expect(rewrittenTo(ask("/join?operator=1"))).toBeNull();
    // Where to go afterwards is read in the browser, so the door's copy serves every `next`.
    expect(rewrittenTo(ask("/join?next=%2Fplayers"))).toBe("/stranger/join?next=%2Fplayers");
    expect(rewrittenTo(ask("/games/gomoku/rules?utm_source=mail"))).toBe("/stranger/games/gomoku/rules?utm_source=mail");
  });

  it("answers live an address that is no kept page", () => {
    expect(rewrittenTo(ask("/games/not-a-game"))).toBeNull();
    expect(rewrittenTo(ask("/players"))).toBeNull();
    expect(rewrittenTo(ask("/stranger/games"))).toBeNull();
  });
});

describe("where the copy is not made", () => {
  it("is not made by a dev server, which keeps nothing, unless a request asks", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", undefined);
    expect(rewrittenTo(ask("/games/gomoku"))).toBeNull();
    expect(rewrittenTo(ask("/games/gomoku", { asks: true }))).toBe("/stranger/games/gomoku");
  });

  it("is not made by the browser suite's own build, so a spec that seeds a game reads the page as it is, unless a request asks", () => {
    vi.stubEnv("VERCEL", undefined);
    vi.stubEnv(SUITE_SERVER_ENV, "1");
    expect(rewrittenTo(ask("/games"))).toBeNull();
    expect(rewrittenTo(ask("/games", { asks: true }))).toBe("/stranger/games");
  });

  it("cannot be asked for into existence a rule that does not hold: asking changes nothing for a member or a reader of Japanese", () => {
    vi.stubEnv("VERCEL", undefined);
    expect(rewrittenTo(ask("/games", { asks: true, cookie: `${SESSION_COOKIE}=x` }))).toBeNull();
    expect(rewrittenTo(ask("/games", { asks: true, language: "ja" }))).toBeNull();
  });

  it("is made on the live site whether or not anybody asks, and the header means nothing there", () => {
    expect(rewrittenTo(ask("/games/gomoku"))).toBe("/stranger/games/gomoku");
    expect(rewrittenTo(ask("/games/gomoku", { asks: true }))).toBe("/stranger/games/gomoku");
  });
});
