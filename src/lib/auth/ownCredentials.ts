import type { NextRequest } from "next/server";

import { STOP_API_PATH, verifyStopToken } from "@/lib/mail/mailStop";

import { EMBED_TOKEN_PARAM, verifyEmbedToken } from "./embedToken";

/**
 * THE REQUESTS THAT CARRY THEIR OWN CREDENTIAL, rather than a session: the two
 * sanctioned exceptions to the gate in `proxy.ts` (AGENTS.md, "The Gate Is
 * `src/proxy.ts`"). Each is a narrow token of its own kind, signed with the
 * site's key and checked by its own function, for a caller that has no session
 * to hold; each grants "continue" on its own addresses and nothing else, and
 * the route it continues to checks the same token again. A wrong or missing
 * token answers false, and the request falls through to the ordinary session
 * check exactly as before — so neither can take a way through away.
 *
 * Here rather than inside the gate because they are one responsibility of
 * their own, and the gate is the file that decides everything else. A third
 * one needs this shape and its reasoning written beside it, as these have.
 */
export async function carriesOwnCredential(request: NextRequest): Promise<boolean> {
  const { pathname } = request.nextUrl;

  /*
   * An embed carries its own credential in the URL, because a cross-site
   * iframe cannot rely on a cookie — browsers block third-party cookies. The
   * board it unlocks makes no API calls, so this grants a game and nothing
   * else; a signed-in visitor still reaches /embed the ordinary way.
   */
  if (isEmbed(pathname)) {
    const token = request.nextUrl.searchParams.get(EMBED_TOKEN_PARAM);
    if (token !== null && (await verifyEmbedToken(token)) !== null) return true;
  }

  /*
   * A STOP LINK, the second credential of the embed token's shape. Every email
   * a member is sent says how to stop getting it (`mailStop.ts`), and the law
   * that asks for it — Canada's, where this site and its players are — also
   * asks that it work without signing in: somebody who wants out will not log
   * in to ask. So the link carries its own proof, a token signed with the
   * site's key under a kind of its own, naming one member and one kind of
   * email, checked by its own function (`verifyStopToken`).
   *
   * It grants "continue", on two addresses, and nothing else: the page that
   * asks which emails to stop and the route that records the answer, both of
   * which check the same token again before they read or write anything, and
   * neither of which can do more than switch that member's email off or back
   * on. Like the embed, it is not shuttered for maintenance: a way out of
   * email has to keep working while the site is being worked on.
   */
  const stop = stopTokenOf(request);
  return stop !== null && (await verifyStopToken(stop)) !== null;
}

export function isEmbed(pathname: string): boolean {
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
 * The stop token a request carries, if it is one of the two addresses a stop
 * link reaches: the page an email's footer links to, `/stop/<token>`, and the
 * route its buttons and a mail program's one-click post to,
 * `/api/mail/stop?token=…`. Null anywhere else, whatever the query says.
 */
function stopTokenOf(request: NextRequest): string | null {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/stop/")) {
    const token = pathname.slice("/stop/".length);
    return token === "" || token.includes("/") ? null : token;
  }
  if (pathname === STOP_API_PATH) return request.nextUrl.searchParams.get("token");
  return null;
}
