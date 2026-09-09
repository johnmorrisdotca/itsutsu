import { NextResponse } from "next/server";

/**
 * Request rate limiting, in the shape UmaKuma uses.
 *
 * The store is an in-process Map, which means each serverless instance counts
 * its own traffic and a burst spread across instances gets a proportionally
 * higher allowance. That is a real limitation and a deliberate trade: it needs
 * no Redis, no network call on the hot path, and it still turns "anyone can
 * write to the database as fast as they can loop" into a bounded nuisance.
 * Move it to a shared store if the limits ever need to be exact.
 */
type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetTime) rateLimitStore.delete(key);
  }
}

/** The caller's address, as far as the proxy in front of us reports it. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 120 },
): RateLimitResult {
  const now = Date.now();
  cleanupStaleEntries(now);

  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetSeconds: Math.max(1, Math.ceil((existing.resetTime - now) / 1000)),
  };
}

export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetSeconds));
  return response;
}

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please retry in ${result.resetSeconds} seconds.`,
    },
    { status: 429 },
  );
  response.headers.set("Retry-After", String(result.resetSeconds));
  return applyRateLimitHeaders(response, result);
}

/** Only for tests: forget every counter. */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * The limits, gathered so they can be read at a glance rather than hunted for
 * across route files. Writes are far tighter than reads because a write costs
 * a database row and a read does not.
 */
export const RATE_LIMITS = {
  /** Recording a finished game. */
  recordGame: { windowMs: 60_000, maxRequests: 20 },
  /** Starting a shared game. */
  createGame: { windowMs: 60_000, maxRequests: 30 },
  /** Playing a stone in a shared game — generous, it is the hot path. */
  playMove: { windowMs: 60_000, maxRequests: 120 },
  /** Redeeming an invite code. Deliberately mean: this is the guessing path. */
  redeemCode: { windowMs: 60_000, maxRequests: 5 },
  /** Signing in as the operator. Meaner still. */
  adminSignIn: { windowMs: 60_000, maxRequests: 5 },
  /** Reads, including autocomplete on every keystroke. */
  read: { windowMs: 60_000, maxRequests: 240 },
  /**
   * A board asking whether the other side has moved: the busiest read on the
   * site, because it is the only one a page makes on a timer. One watching
   * tab spends twenty-four of these a minute, so the allowance is ten tabs
   * from one address — a household on one connection, not a script.
   */
  pollGame: { windowMs: 60_000, maxRequests: 240 },
} as const satisfies Record<string, RateLimitConfig>;
