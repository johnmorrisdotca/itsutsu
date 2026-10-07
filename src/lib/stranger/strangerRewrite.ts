import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { OFFERED_LOCALES } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, LANG_CHOSEN_COOKIE, LANG_COOKIE } from "@/lib/i18n/i18n.constants";
import { resolveLocale } from "@/lib/i18n/locale";
import { reliefAllowed } from "@/lib/suiteServer";

import { ASK_FOR_KEPT_COPY } from "./strangerPath";
import { strangerRouteFor } from "./strangerRoutes";

/**
 * A READER WITH NO SESSION IS ANSWERED FROM THE KEPT COPY OF AN OPEN PAGE.
 *
 * Called by the gate AFTER it has said yes to an open path, and nowhere else:
 * it wraps the `next()` the decision had already reached and decides nothing,
 * so it can never turn a no into a yes (`proxy.ts` says the rule). It either
 * returns a rewrite to the page's kept copy (`app/stranger/[[...path]]`, drawn
 * at most once an hour and read by no cookie) or null, and null is "answer
 * live, as always". It reads no database.
 *
 * LIVE WHENEVER THE REQUEST COULD BE ANYBODY BUT THE ORDINARY STRANGER:
 *
 *  - It is not the live site, and nobody asked for the copy. A dev server
 *    keeps no copy of anything, and the suite's own build is answered live
 *    unless a request says `ASK_FOR_KEPT_COPY`, so a spec that seeds a game
 *    and reads the page in the same minute is not testing the cache
 *    (`reliefAllowed` is the one answer to "is this the live site?": never
 *    true on Vercel).
 *  - It is not a plain GET or HEAD.
 *  - It carries the site's session cookie, valid or not. Not verified here, on
 *    purpose: a request with a cookie is answered by the live page, which does
 *    verify it, and one without cannot be a member. The cheap check can only
 *    ever send somebody to the page that was always right for them.
 *  - It carries any of Google sign-in's cookies: somebody Google has just
 *    sent back has a half-made account the door's page reads.
 *  - It asks for a language the copy is not in. The copy is the default
 *    language: the root layout draws `<html lang>` from the request, and a
 *    copy has no request, so a Japanese reader is answered live and is always
 *    shown Japanese, never the English copy. Worked out by the same function
 *    the page uses (`resolveLocale`), from the same three things a stranger
 *    can say; the account, the fourth, is a member's.
 *  - The address reads its query and has one (`strangerRouteFor`).
 */

/** Google sign-in's cookies (next-auth), whatever the prefix a secure deployment adds. */
function carriesSignInCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.includes("next-auth"));
}

/** The query a kept copy may be answered for: Next's own `_rsc` (a client navigation) and, for the door, where to go after. */
function queryIsAnswerable(request: NextRequest, readsQuery: boolean, door: boolean): boolean {
  for (const key of request.nextUrl.searchParams.keys()) {
    if (key === "_rsc") continue;
    if (door && key === "next") continue;
    if (readsQuery) return false;
  }
  return true;
}

export function strangerRewrite(request: NextRequest): NextResponse | null {
  if (reliefAllowed() && request.headers.get(ASK_FOR_KEPT_COPY) !== "1") return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (request.cookies.has(SESSION_COOKIE) || carriesSignInCookie(request)) return null;

  const { pathname } = request.nextUrl;
  const route = strangerRouteFor(pathname);
  if (route === null) return null;
  if (!queryIsAnswerable(request, route.readsQuery, pathname === "/join")) return null;

  const language = resolveLocale(
    {
      justChosen: request.cookies.get(LANG_CHOSEN_COOKIE)?.value ?? null,
      remembered: request.cookies.get(LANG_COOKIE)?.value ?? null,
      accepts: request.headers.get("accept-language"),
    },
    OFFERED_LOCALES,
  );
  if (language !== DEFAULT_LOCALE) return null;

  const to = request.nextUrl.clone();
  to.pathname = route.path;
  return NextResponse.rewrite(to);
}
