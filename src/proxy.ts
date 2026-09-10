import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { EMBED_TOKEN_PARAM, verifyEmbedToken } from "@/lib/auth/embedToken";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { readDirectoryFilter } from "@/lib/rating/directoryFilter";
import {
  DIRECTORY_FILTER_COOKIE,
  REMEMBER_FOR_SECONDS,
  addressSaysFilter,
  rememberedValue,
} from "@/lib/rating/rememberedFilter";

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
  "/about",
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
  // The front page says what the site is; it shows no game and needs no key.
  if (pathname === "/") return true;
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

/**
 * Carry on — and, on the players page, keep the narrowing that was asked for.
 *
 * It is here because a Server Component can READ a cookie while it renders and
 * cannot SET one, and this is the only thing on the way in that can. The
 * alternative was turning the filter bar into a form, which would cost the
 * addressable links the bar was built to be.
 *
 * It decides nothing. Which filter a page shows is `filterFor`'s answer and
 * the page asks it directly; this only puts what was asked somewhere the next
 * visit can find it. An address that says nothing about narrowing is left
 * alone, because silence is exactly the case a remembered answer is for and
 * must not overwrite one.
 */
function carryOn(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  if (request.nextUrl.pathname !== "/players") return response;

  const asked = Object.fromEntries(request.nextUrl.searchParams);
  if (!addressSaysFilter(asked)) return response;

  response.cookies.set({
    name: DIRECTORY_FILTER_COOKIE,
    value: rememberedValue(readDirectoryFilter(asked)),
    // Sent back only on requests for the page it is about.
    path: "/players",
    maxAge: REMEMBER_FOR_SECONDS,
    sameSite: "lax",
    httpOnly: true,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  /*
   * One host. Google sign-in is registered for the bare domain, and its state
   * cookie must be read back by the host that set it, so a visit that starts
   * on www. is sent to the bare domain before anything else happens.
   */
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const canonical = new URL(request.url);
    canonical.host = host.slice(4);
    return NextResponse.redirect(canonical, 308);
  }
  const { pathname } = request.nextUrl;

  if (!gateIsConfigured() || isOpenPath(pathname)) return carryOn(request);

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
  if (session !== null) return carryOn(request);

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
   * Everything except Next's own assets, the image optimiser, and the files
   * this gate would let through anyway.
   *
   * The first two carry no data of their own, and blocking them only breaks
   * the join page's styling. The rest are the artwork, the marks, the icons
   * and the two text files a crawler asks for — every one of them already
   * named in OPEN_PATHS above, so running the gate over them only ever ends
   * in `NextResponse.next()`. We were paying an invocation per file to reach
   * that conclusion: a single visit to the front page draws six of them.
   *
   * The list has to be written out rather than built from OPEN_PATHS, because
   * Next reads this matcher without running the file. `proxy.test.ts` holds
   * the two in step: anything exempted here has to be open there, or the
   * exemption would be a hole in the gate rather than a saving.
   */
  matcher: [
    "/((?!_next/static|_next/image|art/|brand/|favicon\\.ico|icon\\.svg|apple-icon\\.png|icon-192\\.png|icon-512\\.png|opengraph-image\\.png|manifest\\.webmanifest|robots\\.txt).*)",
  ],
};

/**
 * The paths the matcher above skips, spelled as addresses rather than as a
 * regular expression, so a test can check each one is genuinely open.
 */
export const MATCHER_EXEMPT = [
  "/art/games/caro.jpg",
  "/brand/itsutsu-stones.svg",
  "/favicon.ico",
  "/icon.svg",
  "/apple-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/opengraph-image.png",
  "/manifest.webmanifest",
  "/robots.txt",
] as const;

/** Only for that test: whether the gate would have let a path through. */
export const wouldBeOpen = isOpenPath;
