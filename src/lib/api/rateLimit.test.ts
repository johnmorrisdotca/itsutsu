import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RATE_LIMITS, checkRateLimit, overLimit, resetRateLimits } from "./rateLimit";

/**
 * The ceiling every route is behind.
 *
 * This is the site's answer to "nothing here should be able to cost a lot by
 * accident", so what is worth holding is the part that keeps that true: that
 * a counter really does stop, that it stops the right caller and nobody else,
 * and that two routes never share one allowance.
 */
function asking(ip = "1.2.3.4"): Request {
  return new Request("https://itsutsu.com/api/anything", {
    headers: { "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  resetRateLimits();
});

describe("overLimit", () => {
  it("says nothing at all while a caller is within their allowance", () => {
    expect(overLimit(asking(), "test")).toBeNull();
  });

  it("answers 429 once the allowance is spent, and keeps answering it", async () => {
    const { maxRequests } = RATE_LIMITS.write;
    for (let i = 0; i < maxRequests; i += 1) expect(overLimit(asking(), "test")).toBeNull();

    const refused = overLimit(asking(), "test");
    expect(refused?.status).toBe(429);
    expect(overLimit(asking(), "test")?.status).toBe(429);
  });

  it("tells the caller when to come back rather than only refusing them", async () => {
    const { maxRequests } = RATE_LIMITS.write;
    for (let i = 0; i < maxRequests; i += 1) overLimit(asking(), "test");
    const refused = overLimit(asking(), "test")!;

    expect(Number(refused.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(refused.headers.get("X-RateLimit-Limit")).toBe(String(maxRequests));
    expect(refused.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("counts each route apart, so spending one allowance leaves the others", () => {
    for (let i = 0; i < RATE_LIMITS.write.maxRequests + 1; i += 1) overLimit(asking(), "applause");
    expect(overLimit(asking(), "applause")).not.toBeNull();
    // The same person can still resign a game.
    expect(overLimit(asking(), "resign")).toBeNull();
  });

  it("counts each caller apart, so one loop does not shut the site to everybody", () => {
    for (let i = 0; i < RATE_LIMITS.write.maxRequests + 1; i += 1) {
      overLimit(asking("9.9.9.9"), "sit");
    }
    expect(overLimit(asking("9.9.9.9"), "sit")).not.toBeNull();
    expect(overLimit(asking("1.1.1.1"), "sit")).toBeNull();
  });

  it("takes the first address in a forwarded chain, not the proxy's own", () => {
    const chained = new Request("https://itsutsu.com/api/anything", {
      headers: { "x-forwarded-for": "5.5.5.5, 10.0.0.1, 10.0.0.2" },
    });
    for (let i = 0; i < RATE_LIMITS.write.maxRequests + 1; i += 1) overLimit(chained, "sit");
    // The caller behind the proxy is the one who spent it.
    expect(overLimit(asking("5.5.5.5"), "sit")).not.toBeNull();
    expect(overLimit(asking("10.0.0.1"), "sit")).toBeNull();
  });

  it("reads a limit far above what a person does and well below what a loop does", () => {
    // A person clicking as fast as they can manage is nowhere near sixty a
    // minute on one route; a stuck client passes it in a second.
    expect(RATE_LIMITS.write.maxRequests).toBe(60);
    expect(RATE_LIMITS.write.windowMs).toBe(60_000);
    // The polled board is the one read called on a timer, so it gets room for
    // about ten watching tabs from one address.
    expect(RATE_LIMITS.pollGame.maxRequests).toBeGreaterThanOrEqual(240);
  });

  it("lets a route pass its own limit rather than always taking the write one", () => {
    for (let i = 0; i < RATE_LIMITS.write.maxRequests + 1; i += 1) {
      overLimit(asking(), "reads", RATE_LIMITS.read);
    }
    // Still inside the far larger read allowance.
    expect(overLimit(asking(), "reads", RATE_LIMITS.read)).toBeNull();
  });

  it("keeps the sign-in limits mean, because that is the guessing path", () => {
    expect(RATE_LIMITS.redeemCode.maxRequests).toBeLessThanOrEqual(5);
    expect(RATE_LIMITS.adminSignIn.maxRequests).toBeLessThanOrEqual(5);
    // Offering four words to prove who you are is the same kind of path.
    expect(RATE_LIMITS.phraseEntry.maxRequests).toBeLessThanOrEqual(5);
  });

  /*
   * The two phrase limits exist for opposite reasons, and the `strict` flag is
   * what says which is which. Entry must stay mean in every environment or the
   * suite's relief would make a thirty-six-bit credential guessable; drawing
   * candidates bounds a bill and nothing else, so it is relieved like any other
   * cost limit. Asserted because the two sit next to each other and a copied
   * `strict` would quietly stop a child rerolling.
   */
  it("marks the phrase entry path strict and the picker not", () => {
    expect(RATE_LIMITS.phraseEntry.strict).toBe(true);
    expect("strict" in RATE_LIMITS.phraseDraw).toBe(false);
    expect(RATE_LIMITS.phraseDraw.maxRequests).toBeGreaterThanOrEqual(60);
  });

  it("counts the same whichever way a route asks", () => {
    // overLimit is checkRateLimit with the address read for you; a route that
    // needs a different key still shares the one counter underneath.
    for (let i = 0; i < RATE_LIMITS.write.maxRequests; i += 1) overLimit(asking(), "mixed");
    expect(checkRateLimit("mixed:1.2.3.4", RATE_LIMITS.write).allowed).toBe(false);
  });
});

/**
 * The relief that lets the suite run, and the limits it must never touch.
 *
 * The end-to-end suite drives the whole site from one address and creates a
 * game in most of its tests, so a limit meant for one household stopped it
 * dead — a dozen tests failing with 429s that say nothing about the code.
 * Relieving that is right; relieving the guessing paths would quietly turn
 * off the thing gate.spec.ts exists to prove.
 */
describe("the limits outside production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps a strict limit strict, whatever the environment", () => {
    // Redeeming a code is the guessing path; gate.spec.ts guesses eight and
    // expects to be stopped. Relief here would silently end that.
    for (const environment of ["development", "test", "production"]) {
      vi.stubEnv("NODE_ENV", environment);
      const key = `strict-${environment}-${Math.random()}`;
      const config = { windowMs: 60_000, maxRequests: 5, strict: true } as const;
      const seen = Array.from({ length: 8 }, () => checkRateLimit(key, config).allowed);
      expect(seen.filter(Boolean).length, environment).toBe(5);
    }
  });

  it("gives a cost limit more room only where an environment asks", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RATE_LIMIT_RELIEF", "10");
    const config = { windowMs: 60_000, maxRequests: 2 };
    const key = `cost-${Math.random()}`;
    // Well past the written limit, and still allowed.
    for (let i = 0; i < 10; i += 1) {
      expect(checkRateLimit(key, config).allowed, `request ${i + 1}`).toBe(true);
    }
  });

  it("enforces the written limit when nothing asks for relief", () => {
    // The default, and what every other test in this file relies on.
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RATE_LIMIT_RELIEF", "");
    const config = { windowMs: 60_000, maxRequests: 2 };
    const key = `cost-plain-${Math.random()}`;
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed, "the third must be refused").toBe(false);
  });

  it("ignores relief in production, however loudly it is asked for", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_RELIEF", "1000");
    const config = { windowMs: 60_000, maxRequests: 2 };
    const key = `cost-prod-${Math.random()}`;
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed, "the third must be refused").toBe(false);
  });
});
