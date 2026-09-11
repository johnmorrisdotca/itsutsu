import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { EMBED_TOKEN_PARAM, verifyEmbedToken } from "@/lib/auth/embedToken";
import { constantTimeEqual } from "@/lib/auth/constantTimeEqual";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { OFFERED_LOCALES } from "@/lib/i18n/dictionaries";
import {
  LANG_COOKIE,
  LANG_PARAM,
  LANG_REMEMBER_FOR_SECONDS,
} from "@/lib/i18n/i18n.constants";
import { readLocale } from "@/lib/i18n/locale";

/**
 * The gate.
 *
 * Nothing is reachable without a signed session cookie — pages and API routes
 * alike — except the handful of paths needed to get one. That is what closes
 * the unauthenticated write endpoints: they are simply not reachable by an
 * anonymous request, rather than each route being remembered to guard itself.
 *
 * Three ways through: redeem an invite code, sign in as the operator, or —
 * for the two backlog routes only — carry the board token in a header, the
 * way an embed carries its own token in the URL. Neither of those last two
 * is a session; each is a narrow credential this gate recognises for one
 * purpose and re-checks nothing else about.
 *
 * `proxy.ts`, not `middleware.ts` — the middleware convention is deprecated in
 * Next 16 and renamed.
 */

/**
 * Paths that stay reachable without a session, BY PREFIX.
 *
 * Two kinds. The sign-in routes, because a door nobody can reach is not a
 * door. And the learning pages, which are documentation: they render nothing a
 * visitor wrote, hold no data, and are the pages you would want someone to be
 * able to read and link to before deciding to ask for an invite. Everything
 * else, including /players and the whole API, stays shut.
 *
 * A prefix here opens EVERYTHING BENEATH IT, which is why /games is not in
 * this list. See `OPEN_EXACTLY` and `OPEN_PATTERNS` below.
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

/**
 * READING IS OPEN, PLAYING IS GATED — John's rule, in his words: "strangers
 * should be able to browse the site, the games, the rules etc... see some
 * stuff... they need to register to play."
 *
 * These are matched WHOLE rather than by prefix, and that is the entire point
 * of the list existing. A prefix entry for "/games" opens everything beneath
 * it — every match, every seat-claim link, a reader's own record — and the
 * half of this site that lives under /games is the half that does things.
 * Browsing a game and taking a seat at one are the same first segment.
 */
const OPEN_EXACTLY = [
  /*
   * /games — the catalogue. It is what the /rules index was, and more: every
   * game's name, kanji and tagline, in three arrangements.
   *
   * The LOBBY on that page is not part of what a stranger sees. Open seats,
   * who is here, the form that starts a game — those are members doing things,
   * and the page itself leaves every one of them out when nobody is signed in.
   * That check is in the page rather than here, which is this file's own rule:
   * an addition belongs after a decision has arrived at yes, never inside the
   * deciding.
   */
  "/games",
];

/**
 * The facets of a game a stranger may read, and the ones they may not.
 *
 * Open: the game itself, its rules, its family, its background. All four are
 * tables in this repository — what the game IS — and none of them holds
 * anything a member wrote.
 *
 * NOT OPEN, and each for its own reason:
 *
 *  - `/play`, `/new`, `/match/...` — playing. A board, a setup form, a game
 *    between two people with every control the site has on it, and the
 *    seat-claim route underneath that BINDS a seat to whoever follows it.
 *    Watching a match is reading, but the page a watcher lands on is the same
 *    page a player uses, and a seat link is a write. That is the edge, and it
 *    is decided in favour of the rule rather than against it.
 *  - `/me` — the reader's own games, which has nothing to say to a stranger.
 *  - `/history` and `/standings` — AND THIS ONE IS A GAP RATHER THAN A
 *    DECISION. They are reading, they belong open by the rule above, and they
 *    cannot go open yet: both print members' names through `PlayerName`, which
 *    SHOWS "Hanako M." and links to /players/hanako-morris. The whole name is
 *    in the markup. That is the leak that was fixed in production by taking
 *    members off open pages, and `shownName` says in as many words that the
 *    address half is a decision still to be made. Opening these would put a
 *    twelve-year-old's surname on a page with no invite in front of it. When
 *    `playerPath` stops carrying the whole name, they belong in the pattern
 *    below and nothing else needs to change.
 */
const OPEN_PATTERNS = [/^\/games\/[^/]+(?:\/(?:rules|family|background))?$/];

function isOpenPath(pathname: string): boolean {
  // The front page says what the site is; it shows no game and needs no key.
  if (pathname === "/") return true;
  if (OPEN_EXACTLY.includes(pathname)) return true;
  if (OPEN_PATTERNS.some((pattern) => pattern.test(pathname))) return true;
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
 * The two routes board convergence ITS-02's CLI reaches: the board, and one
 * row of it.
 */
function isBoardApi(pathname: string): boolean {
  return pathname === "/api/backlog" || pathname.startsWith("/api/backlog/");
}

/**
 * A language asked for in the address, remembered and then taken back out of
 * it. Null when the address says nothing about language, which is almost
 * every request.
 *
 * Here because a Server Component can READ a cookie while it renders and
 * cannot SET one, and this is the only thing on the way in that can.
 *
 * It redirects rather than carrying on, and both halves of that are
 * deliberate. Setting the cookie and carrying on would render *this* page in
 * the old language — the cookie only reaches the request after it — so the
 * page you changed the language on would be the one page that did not change,
 * which reads as broken. And the language is not part of what a page is: an
 * address with `?lang=es` stuck to it would get copied, shared and bookmarked,
 * and would then overrule the language of whoever opened it.
 *
 * It cannot turn a yes into a no. It only ever runs after the gate has
 * already said yes, the redirect goes to the same path with one parameter
 * removed, and that request is decided again from scratch exactly as it would
 * have been. GET only, so a form post is never answered with a redirect.
 */
function rememberLanguage(request: NextRequest): NextResponse | null {
  if (request.method !== "GET") return null;
  const asked = readLocale(request.nextUrl.searchParams.get(LANG_PARAM));
  if (asked === null || !OFFERED_LOCALES.includes(asked)) return null;

  const clean = new URL(request.url);
  clean.searchParams.delete(LANG_PARAM);
  const response = NextResponse.redirect(clean);
  response.cookies.set({
    name: LANG_COOKIE,
    value: asked,
    // Every page: a language is not about one page.
    path: "/",
    maxAge: LANG_REMEMBER_FOR_SECONDS,
    sameSite: "lax",
    httpOnly: true,
  });
  return response;
}

/**
 * Carry on — and keep the language, when one was asked for on the way.
 *
 * It decides nothing: the gate has already said yes by the time it runs, and
 * the one thing it adds is a cookie, which a Server Component can read while
 * it renders and cannot set.
 *
 * The players page's narrowing was kept here too, in a cookie, until it had
 * an account to live on. It is remembered by the page now, through the
 * preferences registry — see `memberFilter.ts` — which is where a choice that
 * follows a member between devices belongs. It is also somewhere a prefetch
 * cannot reach: this file answers a prefetch like any other request, and a
 * cookie set here for `/players?who=…` remembered whichever of the bar's
 * links had last come into view, a narrowing nobody chose.
 */
function carryOn(request: NextRequest): NextResponse {
  return rememberLanguage(request) ?? NextResponse.next();
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

  /*
   * Board convergence ITS-02: an agent's terminal carries its own credential
   * in a header, the same reason an embed carries one in the URL — there is
   * no browser here to hold a session cookie. This is the gate deciding
   * "may this request reach the app at all", which is a coarser question
   * than "who, exactly, is writing" — `boardActor` re-checks the same token
   * and additionally requires `X-Board-Actor`, which the gate does not know
   * about, the same relationship `isEmbed` has with the embed board's own
   * `data`-scope check. A missing or wrong token changes nothing here; the
   * request falls through to the session check below exactly as it always
   * did, so this only ever ADDS a way through for these two paths, never
   * takes one away.
   */
  if (isBoardApi(pathname)) {
    const expected = process.env.BOARD_TOKEN?.trim() ?? "";
    const auth = request.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    if (expected.length > 0 && token.length > 0 && constantTimeEqual(expected, token)) {
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

/** Only for that test: whether a path is one the board token can open. */
export const isBoardApiPath = isBoardApi;
