import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/**
 * The gate.
 *
 * Nothing is reachable without a signed session cookie — pages and API routes
 * alike — except the handful of paths needed to get one. That is what closes
 * the unauthenticated write endpoints: they are simply not reachable by an
 * anonymous request, rather than each route being remembered to guard itself.
 *
 * Two ways through: redeem an invite code, or sign in as the operator.
 *
 * `proxy.ts`, not `middleware.ts` — the middleware convention is deprecated in
 * Next 16 and renamed.
 */

/** Paths that must stay reachable, or nobody could ever get in. */
const OPEN_PATHS = [
  "/join",
  "/api/session",
  "/favicon.ico",
  "/icon.svg",
  "/robots.txt",
];

/**
 * When no secret is configured the gate cannot verify anything, and a locked
 * door nobody holds a key to is worse than an open one for local development.
 * A deployment that means to be private must set AUTH_SECRET; the /join page
 * says so plainly when it is missing.
 */
function gateIsConfigured(): boolean {
  const secret = process.env.AUTH_SECRET?.trim();
  return Boolean(secret && secret.length >= 16);
}

function isOpenPath(pathname: string): boolean {
  return OPEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!gateIsConfigured() || isOpenPath(pathname)) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session !== null) return NextResponse.next();

  /*
   * An API caller gets a status it can act on; a person gets the door. Sending
   * JSON to a browser, or HTML to fetch(), would be useless to both.
   */
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "An invite code is needed to use this site." },
      { status: 401 },
    );
  }

  const join = new URL("/join", request.url);
  // So the door can put you back where you were heading.
  if (pathname !== "/") join.searchParams.set("next", pathname);
  return NextResponse.redirect(join);
}

export const config = {
  /*
   * Everything except Next's own assets and the image optimiser. Those carry
   * no data of their own and blocking them only breaks the join page's styling.
   */
  matcher: ["/((?!_next/static|_next/image).*)"],
};
