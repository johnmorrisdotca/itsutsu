import { beforeEach, describe, expect, it } from "vitest";

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
  });

  it("counts the same whichever way a route asks", () => {
    // overLimit is checkRateLimit with the address read for you; a route that
    // needs a different key still shares the one counter underneath.
    for (let i = 0; i < RATE_LIMITS.write.maxRequests; i += 1) overLimit(asking(), "mixed");
    expect(checkRateLimit("mixed:1.2.3.4", RATE_LIMITS.write).allowed).toBe(false);
  });
});
