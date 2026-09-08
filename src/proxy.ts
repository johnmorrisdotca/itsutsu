import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { EMBED_TOKEN_PARAM, verifyEmbedToken } from "@/lib/auth/embedToken";
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

/**
 * Paths that stay reachable without a session.
 *
 * Two kinds. The sign-in routes, because a door nobody can reach is not a
 * door. And the rules and learning pages, which are documentation: they render
 * nothing a visitor wrote, hold no data, and are the pages you would want
 * someone to be able to read and link to before deciding to ask for an invite.
 * Everything else, including /players and the whole API, stays shut.
 */
const OPEN_PATHS = [
  "/join",
  "/api/session",
  // Google sign-in. A sign-in route that cannot be reached without signing in
  // first would be of no use to anybody.
  "/api/auth",
  "/favicon.ico",
  "/icon.svg",
  // The home-screen icons, the manifest that names them, and the card a
  // shared link unfurls to. A crawler holds no cookie; a locked card is a
  // blank one.
  "/apple-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest",
  "/opengraph-image.png",
  "/robots.txt",
  "/rules",
  "/learn",
  // The screenshots those pages load. Files under public/ are not Next's own
  // assets, so the matcher does not exempt them and they need naming here.
  "/art",
  // The logo. The join page is open, so the marks it draws must be too, or a
  // visitor with no cookie sees a broken image where the name should be.
  "/brand",
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

function isEmbed(pathname: string): boolean {
  return (
    pathname === "/embed" ||
    pathname.startsWith("/embed/") ||
    // The read-only endpoint an embedded board calls. It re-checks the token
    // itself, and additionally requires the `data` scope, which the gate does
    // not know about.
    pathname.startsWith("/api/embed/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!gateIsConfigured() || isOpenPath(pathname)) return NextResponse.next();

  /*
   * An embed carries its own credential in the URL, because a cross-site
   * iframe cannot rely on a cookie — browsers block third-party cookies. The
   * board it unlocks makes no API calls, so this grants a game and nothing
   * else; a signed-in visitor still reaches /embed the ordinary way below.
   */
  if (isEmbed(pathname)) {
    const token = request.nextUrl.searchParams.get(EMBED_TOKEN_PARAM);
    if (token !== null && (await verifyEmbedToken(token)) !== null) {
      return NextResponse.next();
    }
  }

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
  /*
   * Carry the whole path, query included. A seat link carries its claim in the
   * path, and a record page its filters in the query; dropping either at the
   * door would land the visitor somewhere other than where they were sent.
   */
  const wanted = `${pathname}${request.nextUrl.search}`;
  if (wanted !== "/") join.searchParams.set("next", wanted);
  return NextResponse.redirect(join);
}

export const config = {
  /*
   * Everything except Next's own assets and the image optimiser. Those carry
   * no data of their own and blocking them only breaks the join page's styling.
   */
  matcher: ["/((?!_next/static|_next/image).*)"],
};
