import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

import { MAINTENANCE_ENV } from "./site.constants";
import { maintenanceIsOn } from "./site";

/**
 * The shutter, and the one thing in this repository allowed to turn the gate's
 * yes into a no.
 *
 * REACHABLE FROM THE GATE, which decides everything about this file. Nothing
 * here imports Prisma, `server-only` or `next/headers`; the only two questions
 * it asks are answered by `process.env` and by Web Crypto over a cookie the
 * gate already verifies on every request anyway. So it costs no query, holds
 * no cache, keeps no module state, and — the case it exists for — it still
 * works when the database is the thing being worked on.
 *
 * IT CAN ONLY EVER REFUSE. The return type is `NextResponse | null`, the
 * `NextResponse` is always a 503, and null means "I have nothing to say, carry
 * on with whatever you had already decided". There is no branch that returns a
 * pass, so no arrangement of environment, cookie or path can make this open
 * something the gate had shut. That is the property `AGENTS.md` asks of an
 * addition to `proxy.ts`, stated as a type rather than as a promise.
 */

/**
 * The doors, which stay reachable while the site is shut.
 *
 * THIS LIST CANNOT GRANT ANYTHING, and it is worth being clear why, because a
 * path list inside the gate usually can. `maintenanceRefusal` runs only after
 * `isOpenPath`, the token exceptions and the session check have already
 * arrived at yes — so the most this can do is decline to take back a way
 * through that already existed. `/admin` is deliberately absent for that
 * reason: the operator's session passes on its own below, and a member's
 * session reaching `/admin` is answered by the page's own 404 exactly as it is
 * on any other day.
 *
 * They are here so that the operator can always get a session. A shutter the
 * operator cannot sign in past is a site nobody can reopen, and the recovery
 * has to work from a cold browser with no cookie at all — a new laptop, a
 * cleared cache, an expired operator pass, which lasts a day. WazaDB exempts
 * its sign-in, register and password paths from its own maintenance overlay
 * for the same reason, in as many words: so a logged-out admin can still reach
 * the door.
 */
const MAINTENANCE_OPEN = ["/join", "/api/session", "/api/auth"];

function isDoor(pathname: string): boolean {
  return MAINTENANCE_OPEN.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Whether this request carries the operator's own session.
 *
 * Both halves are free. `verifySession` is an HMAC over the cookie — Web
 * Crypto, no lookup — and `isAdminEmail` reads `ADMIN_EMAILS` out of the
 * environment and nothing else. This is `currentAdmin()` with its one database
 * question left out, and leaving it out is the point: `currentAdmin` also asks
 * whether the operator has been banned, which is a row, and a shutter that
 * needs a row cannot identify the operator during the hour the rows are being
 * worked on. It would fail closed against the one person who must get in.
 *
 * Less strict than `currentAdmin`, then — deliberately, and safely, because
 * this decides only whether to hold a door open that the gate had already
 * opened. Everything behind it re-checks with `currentAdmin` as it always did.
 */
async function isOperator(request: NextRequest): Promise<boolean> {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  return session?.kind === "admin" && isAdminEmail(session.email);
}

/**
 * A 503 for a request that arrives while the site is being worked on, or null
 * when there is nothing to say.
 *
 * The order of the checks is the cost of the feature. When the site is up —
 * which is every request on almost every day — this reads one environment
 * variable, compares one string, and returns. Nothing else in here runs at
 * all: no cookie is verified, no path list is walked, and the gate goes on to
 * do exactly what it did before this existed.
 */
export async function maintenanceRefusal(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (!maintenanceIsOn(process.env[MAINTENANCE_ENV])) return null;

  const { pathname } = request.nextUrl;
  if (isDoor(pathname)) return null;
  if (await isOperator(request)) return null;

  const headers = { "Cache-Control": "no-store" };
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "The site is being worked on. Try again shortly." },
      { status: 503, headers },
    );
  }
  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * What everybody else sees, and no more than that.
 *
 * 503 rather than a 200 with a banner over it, so a crawler, a monitor and a
 * fetch() all learn the same thing the reader does — WazaDB's overlay is a
 * client-rendered panel on an ordinary 200, which means the page underneath
 * was rendered and sent. No-store, so nothing caches the shutter and shows it
 * to somebody after the site is back.
 *
 * It names no variable, no operator and no reason. A stranger reading this is
 * told the site is being worked on, which is true and is all they need; the
 * operator does not need it at all, because they are looking at the site.
 */
const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Being worked on</title>
</head>
<body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.6;">
<h1 style="font-size: 1.25rem;">Itsutsu is being worked on</h1>
<p>The site is closed for a short while. Nothing has been lost — your games are
where you left them. Please try again shortly.</p>
</body>
</html>`;
