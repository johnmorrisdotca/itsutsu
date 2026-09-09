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
  /**
   * A limit that exists to stop an attack rather than to bound a cost, and so
   * is never relieved outside production. See `RELIEF`.
   */
  strict?: boolean;
};

/**
 * How much more room the cost limits get, where an environment asks for it.
 *
 * The end-to-end suite drives the whole site from one address, sequentially,
 * and creates a game in most of its three hundred tests — so it trips a limit
 * meant for one household and fails a dozen of them with 429s that say
 * nothing about the code. Three sessions have now lost time triaging those.
 *
 * Asked for rather than assumed. An earlier version of this relieved every
 * environment that was not production, which changed the numbers under six
 * tests that had every right to expect the ones written down; a limiter whose
 * behaviour depends on something nobody set is a limiter nobody can reason
 * about. `RATE_LIMIT_RELIEF` is set in .env, for the dev server the suite
 * drives, and nowhere else.
 *
 * Two things it can never do. It is ignored outright in production, so a
 * variable that escaped into the deployment would do nothing. And it never
 * touches a `strict` limit — the ones that exist to stop somebody guessing
 * rather than to bound a cost — because a suite that cannot exhaust the
 * guessing path cannot prove it closes, and gate.spec.ts proves exactly that
 * by guessing eight codes and expecting to be stopped at five.
 */
function allowanceFor(config: RateLimitConfig): number {
  if (config.strict === true) return config.maxRequests;
  if (process.env.NODE_ENV === "production") return config.maxRequests;

  const relief = Number(process.env.RATE_LIMIT_RELIEF ?? "1");
  if (!Number.isFinite(relief) || relief < 1) return config.maxRequests;
  return config.maxRequests * Math.floor(relief);
}

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

  // The number actually enforced here, which outside production is more
  // generous than the number written down — see RELIEF.
  const allowance = allowanceFor(config);
  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      allowed: true,
      limit: allowance,
      remaining: allowance - 1,
      resetSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= allowance,
    limit: allowance,
    remaining: Math.max(0, allowance - existing.count),
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
 * The whole check, as one line at the top of a handler: the 429 to return, or
 * null to carry on.
 *
 * Every route that guards itself does the same three things — read the
 * caller's address, count them under a name of its own, answer 429 if they
 * are over — and three lines repeated across two dozen files is three lines
 * that can be got subtly wrong in one of them, or left out of the next one
 * somebody writes. Said once here.
 *
 * `scope` names the counter, so a member spending their allowance on one
 * route still has the others: `applause:1.2.3.4` and `resign:1.2.3.4` are
 * counted apart.
 */
export function overLimit(
  request: Request,
  scope: string,
  config: RateLimitConfig = RATE_LIMITS.write,
): NextResponse | null {
  const result = checkRateLimit(`${scope}:${getClientIp(request)}`, config);
  return result.allowed ? null : createRateLimitResponse(result);
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
  redeemCode: { windowMs: 60_000, maxRequests: 5, strict: true },
  /** Signing in as the operator. Meaner still. */
  adminSignIn: { windowMs: 60_000, maxRequests: 5, strict: true },
  /** Reads, including autocomplete on every keystroke. */
  read: { windowMs: 60_000, maxRequests: 240 },
  /**
   * The ordinary write: sitting down, resigning, applauding, changing a
   * setting, keeping a buddy. One a second sustained, which no person does
   * and no honest client needs, and which still turns a stuck loop into a
   * bounded nuisance rather than a bill.
   */
  write: { windowMs: 60_000, maxRequests: 60 },
  /**
   * A board asking whether the other side has moved: the busiest read on the
   * site, because it is the only one a page makes on a timer. One watching
   * tab spends twenty-four of these a minute, so the allowance is ten tabs
   * from one address — a household on one connection, not a script.
   */
  pollGame: { windowMs: 60_000, maxRequests: 240 },
} as const satisfies Record<string, RateLimitConfig>;
